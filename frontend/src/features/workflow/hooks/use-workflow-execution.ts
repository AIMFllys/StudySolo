'use client';

import { useCallback, useRef, useState } from 'react';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import {
  buildExecutionRequestBody,
  getExecutionFailureMessage,
  shouldFinalizeExecutionAsInterrupted,
} from '@/features/workflow/utils/execution-state';
import { extractSseEvents } from '@/features/workflow/utils/parse-sse';
import { applyWorkflowExecutionEvent } from '@/features/workflow/utils/workflow-execution-events';

export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'error';

export function useWorkflowExecution() {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeMapRef = useRef<Record<string, number>>({});
  const traceOrderRef = useRef(1);

  const currentWorkflowId = useWorkflowStore((state) => state.currentWorkflowId);
  const currentWorkflowName = useWorkflowStore((state) => state.currentWorkflowName);
  const setSelectedNodeId = useWorkflowStore((state) => state.setSelectedNodeId);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const startExecutionSession = useWorkflowStore((state) => state.startExecutionSession);
  const registerNodeTrace = useWorkflowStore((state) => state.registerNodeTrace);
  const updateNodeTrace = useWorkflowStore((state) => state.updateNodeTrace);
  const appendNodeTraceToken = useWorkflowStore((state) => state.appendNodeTraceToken);
  const finalizeExecutionSession = useWorkflowStore((state) => state.finalizeExecutionSession);
  const clearExecutionSession = useWorkflowStore((state) => state.clearExecutionSession);

  const resetTrackingState = useCallback(() => {
    startTimeMapRef.current = {};
    traceOrderRef.current = 1;
  }, []);

  const closeStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const finishWithError = useCallback((message: string) => {
    setStatus('error');
    setError(message);
    finalizeExecutionSession('error');
    closeStream();
    resetTrackingState();
  }, [closeStream, finalizeExecutionSession, resetTrackingState]);

  const stop = useCallback(() => {
    finishWithError('执行流已中断，请手动重新运行');
  }, [finishWithError]);

  const start = useCallback(
    async (workflowId?: string) => {
      const id = workflowId ?? currentWorkflowId;
      if (!id) return;

      const snapshot = useWorkflowStore.getState();
      const workflowName = snapshot.currentWorkflowName ?? currentWorkflowName ?? id;
      const nodes = snapshot.nodes;
      const edges = snapshot.edges;

      closeStream();
      resetTrackingState();
      setStatus('running');
      setError(null);
      clearExecutionSession();
      startExecutionSession(id, workflowName);
      window.dispatchEvent(new Event('workflow:close-node-config'));

      const controller = new AbortController();
      abortControllerRef.current = controller;
      let didComplete = false;

      const handleEvent = (event: string, payload: string) => {
        didComplete = applyWorkflowExecutionEvent(event, payload, {
          getExecutionSession: () => useWorkflowStore.getState().executionSession,
          now: () => performance.now(),
          nextTraceOrder: () => traceOrderRef.current++,
          startTimeMap: startTimeMapRef.current,
          setStatus,
          setError,
          setSelectedNodeId,
          updateNodeData,
          registerNodeTrace,
          updateNodeTrace,
          appendNodeTraceToken,
          finalizeExecutionSession,
          closeStream,
          resetTrackingState,
        }) || didComplete;
      };

      try {
        const response = await fetch(`/api/workflow/${id}/execute`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildExecutionRequestBody(nodes, edges)),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error('EMPTY_STREAM');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const parsed = extractSseEvents(buffer);
          buffer = parsed.remainder;

          for (const event of parsed.events) {
            handleEvent(event.event, event.data);
          }
        }

        buffer += decoder.decode();
        const parsed = extractSseEvents(buffer);
        for (const event of parsed.events) {
          handleEvent(event.event, event.data);
        }

        if (shouldFinalizeExecutionAsInterrupted(didComplete, controller.signal.aborted)) {
          finishWithError('执行流异常中断，请手动重新运行');
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        finishWithError(getExecutionFailureMessage(caught));
      }
    },
    [
      appendNodeTraceToken,
      clearExecutionSession,
      closeStream,
      currentWorkflowId,
      currentWorkflowName,
      finishWithError,
      finalizeExecutionSession,
      registerNodeTrace,
      resetTrackingState,
      setSelectedNodeId,
      startExecutionSession,
      updateNodeData,
      updateNodeTrace,
    ]
  );

  return { status, error, start, stop };
}
