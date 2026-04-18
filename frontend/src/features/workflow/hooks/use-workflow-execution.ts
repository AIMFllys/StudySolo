'use client';

import { useCallback, useRef, useState } from 'react';
import { useWorkflowStore } from '@/stores/workflow/use-workflow-store';
import { nodeStreamStore } from '@/stores/workflow/use-node-stream-store';
import {
  buildExecutionRequestBody,
  getExecutionFailureMessage,
  shouldFinalizeExecutionAsInterrupted,
  EXECUTION_ACTIVITY_GRACE_MS,
} from '@/features/workflow/utils/execution-state';
import { extractSseEvents } from '@/features/workflow/utils/parse-sse';
import { applyWorkflowExecutionEvent } from '@/features/workflow/utils/workflow-execution-events';
import { eventBus } from '@/lib/events/event-bus';
import { authedStreamFetch } from '@/services/api-client';

export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'error';

export function useWorkflowExecution() {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeMapRef = useRef<Record<string, number>>({});
  const traceOrderRef = useRef(1);
  const lastActivityAtRef = useRef(0);
  // rAF-batched token buffer: { [nodeId]: accumulated tokens pending flush }.
  const tokenBufferRef = useRef<Map<string, string>>(new Map());
  const tokenFlushHandleRef = useRef<number | null>(null);

  const currentWorkflowId = useWorkflowStore((state) => state.currentWorkflowId);
  const currentWorkflowName = useWorkflowStore((state) => state.currentWorkflowName);
  const setSelectedNodeId = useWorkflowStore((state) => state.setSelectedNodeId);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const startExecutionSession = useWorkflowStore((state) => state.startExecutionSession);
  const registerNodeTrace = useWorkflowStore((state) => state.registerNodeTrace);
  const updateNodeTrace = useWorkflowStore((state) => state.updateNodeTrace);
  const appendNodeTraceToken = useWorkflowStore((state) => state.appendNodeTraceToken);
  const updateExecutionSessionMeta = useWorkflowStore((state) => state.updateExecutionSessionMeta);
  const finalizeExecutionSession = useWorkflowStore((state) => state.finalizeExecutionSession);
  const clearExecutionSession = useWorkflowStore((state) => state.clearExecutionSession);

  // 把累积在 ref buffer 里的 token 写入 **节点流式 store**（不是主 workflow store）。
  // 只有订阅特定 nodeId 的节点渲染组件会重渲，避免触发画布/侧边栏广播。
  // 主 workflow store 中的 `output` 会在 `node_done` / 终态 `node_status` 时一次性提交。
  const flushBufferedTokens = useCallback(() => {
    if (tokenFlushHandleRef.current !== null) {
      if (typeof window !== 'undefined') {
        window.cancelAnimationFrame(tokenFlushHandleRef.current);
      }
      tokenFlushHandleRef.current = null;
    }
    const buffer = tokenBufferRef.current;
    if (buffer.size === 0) return;
    const entries = Array.from(buffer.entries());
    buffer.clear();
    for (const [nodeId, tokens] of entries) {
      if (!tokens) continue;
      nodeStreamStore.append(nodeId, tokens);
      appendNodeTraceToken(nodeId, tokens);
    }
  }, [appendNodeTraceToken]);

  const scheduleTokenFlush = useCallback(() => {
    if (tokenFlushHandleRef.current !== null) return;
    if (typeof window === 'undefined') {
      // SSR / non-browser fallback — flush synchronously.
      flushBufferedTokens();
      return;
    }
    tokenFlushHandleRef.current = window.requestAnimationFrame(() => {
      tokenFlushHandleRef.current = null;
      flushBufferedTokens();
    });
  }, [flushBufferedTokens]);

  const bufferNodeToken = useCallback((nodeId: string, token: string) => {
    if (!token) return;
    const buffer = tokenBufferRef.current;
    const existing = buffer.get(nodeId) ?? '';
    buffer.set(nodeId, existing + token);
    scheduleTokenFlush();
  }, [scheduleTokenFlush]);

  const commitAndClearNodeStream = useCallback((nodeId: string) => {
    const streamed = nodeStreamStore.get(nodeId);
    if (streamed !== undefined && streamed.length > 0) {
      updateNodeData(nodeId, (prev) => {
        // Only promote the streamed text when the main store hasn't already
        // received a richer authoritative output (e.g. from a node_done that
        // arrived before the terminal node_status).
        const prevOutput = typeof prev.output === 'string' ? prev.output : '';
        return {
          output: prevOutput.length >= streamed.length ? prevOutput : streamed,
        };
      });
    }
    nodeStreamStore.clear(nodeId);
  }, [updateNodeData]);

  const resetTrackingState = useCallback(() => {
    startTimeMapRef.current = {};
    traceOrderRef.current = 1;
    lastActivityAtRef.current = 0;
    // Discard any in-flight tokens from an aborted run.
    if (tokenFlushHandleRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(tokenFlushHandleRef.current);
    }
    tokenFlushHandleRef.current = null;
    tokenBufferRef.current.clear();
    // Clear any leftover streamed overlays from a previous run so nodes fall
    // back to the persisted `node.data.output` until new tokens arrive.
    nodeStreamStore.clearAll();
  }, []);

  const closeStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const finishWithError = useCallback((message: string) => {
    // Preserve any partial streamed output before wiping tracking state.
    flushBufferedTokens();
    setStatus('error');
    setError(message);
    finalizeExecutionSession('error');
    closeStream();
    resetTrackingState();
  }, [closeStream, finalizeExecutionSession, flushBufferedTokens, resetTrackingState]);

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
      lastActivityAtRef.current = performance.now();
      eventBus.emit('workflow:close-node-config', undefined);

      const controller = new AbortController();
      abortControllerRef.current = controller;
      let didComplete = false;

      const handleEvent = (event: string, payload: string) => {
        lastActivityAtRef.current = performance.now();
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
          bufferNodeToken,
          flushBufferedTokens,
          commitAndClearNodeStream,
          updateExecutionSessionMeta,
          finalizeExecutionSession,
          closeStream,
          resetTrackingState,
        }) || didComplete;
      };

      try {
        const response = await authedStreamFetch(`/api/workflow/${id}/execute`, {
          method: 'POST',
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
        const decoder = new TextDecoder('utf-8');
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

        if (shouldFinalizeExecutionAsInterrupted(
          didComplete,
          controller.signal.aborted,
          performance.now(),
          lastActivityAtRef.current,
          EXECUTION_ACTIVITY_GRACE_MS,
        )) {
          finishWithError('执行流异常中断，请手动重新运行');
        } else if (!didComplete && !controller.signal.aborted) {
          finishWithError('执行连接已提前关闭，请查看后端日志或重试');
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
      bufferNodeToken,
      clearExecutionSession,
      closeStream,
      commitAndClearNodeStream,
      currentWorkflowId,
      currentWorkflowName,
      finishWithError,
      finalizeExecutionSession,
      flushBufferedTokens,
      updateExecutionSessionMeta,
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
