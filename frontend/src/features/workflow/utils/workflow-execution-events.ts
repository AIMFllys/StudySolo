import type { WorkflowSSEEvent } from '@/types/workflow-events';
import type { WorkflowExecutionSession } from '@/types/workflow';
import { buildParallelGroupId, parseInputSummary } from '@/features/workflow/utils/trace-helpers';

type ExecutionTerminalStatus = 'completed' | 'error';
type WorkflowNodeDataUpdate =
  | Partial<Record<string, unknown>>
  | ((prev: Record<string, unknown>) => Partial<Record<string, unknown>>);

interface WorkflowExecutionEventDeps {
  getExecutionSession: () => WorkflowExecutionSession | null;
  now: () => number;
  nextTraceOrder: () => number;
  startTimeMap: Record<string, number>;
  setStatus: (status: ExecutionTerminalStatus) => void;
  setError: (error: string | null) => void;
  setSelectedNodeId: (nodeId: string) => void;
  updateNodeData: (nodeId: string, update: WorkflowNodeDataUpdate) => void;
  registerNodeTrace: (
    nodeId: string,
    executionOrder: number,
    isParallel: boolean,
    parallelGroupId?: string,
  ) => void;
  updateNodeTrace: (nodeId: string, updates: Record<string, unknown>) => void;
  appendNodeTraceToken: (nodeId: string, token: string) => void;
  finalizeExecutionSession: (status: ExecutionTerminalStatus) => void;
  closeStream: () => void;
  resetTrackingState: () => void;
}

export function applyWorkflowExecutionEvent(
  event: string,
  payload: string,
  deps: WorkflowExecutionEventDeps,
): boolean {
  try {
    if (event === 'node_input') {
      const data = JSON.parse(payload) as Extract<WorkflowSSEEvent, { type: 'node_input' }>;
      deps.startTimeMap[data.node_id] = deps.now();
      const session = deps.getExecutionSession();
      const runningNodeIds = (session?.traces ?? [])
        .filter((trace) => trace.status === 'running' && trace.nodeId !== data.node_id)
        .map((trace) => trace.nodeId);
      const parallelGroupId = runningNodeIds.length > 0
        ? buildParallelGroupId([...runningNodeIds, data.node_id])
        : undefined;

      if (parallelGroupId) {
        for (const runningNodeId of runningNodeIds) {
          deps.updateNodeTrace(runningNodeId, {
            isParallel: true,
            parallelGroupId,
          });
        }
      }

      deps.registerNodeTrace(
        data.node_id,
        deps.nextTraceOrder(),
        Boolean(parallelGroupId),
        parallelGroupId,
      );
      deps.updateNodeData(data.node_id, {
        input_snapshot: data.input_snapshot,
      });
      deps.updateNodeTrace(data.node_id, {
        status: 'running',
        startedAt: deps.now(),
        inputSummary: parseInputSummary(data.input_snapshot),
        rawInputSnapshot: data.input_snapshot,
      });
      return false;
    }

    if (event === 'node_status') {
      const data = JSON.parse(payload) as Extract<WorkflowSSEEvent, { type: 'node_status' }>;
      deps.setSelectedNodeId(data.node_id);

      const updates: Record<string, unknown> = {
        status: data.status,
        ...(data.error ? { error: data.error } : {}),
      };

      if (data.status === 'running') {
        if (!deps.startTimeMap[data.node_id]) {
          deps.startTimeMap[data.node_id] = deps.now();
        }
      } else if (data.status === 'done' || data.status === 'error') {
        const startT = deps.startTimeMap[data.node_id];
        if (startT) {
          updates.execution_time_ms = Math.round(deps.now() - startT);
          delete deps.startTimeMap[data.node_id];
        }
      }

      deps.updateNodeData(data.node_id, updates);
      if (data.status !== 'running') {
        deps.updateNodeTrace(data.node_id, {
          status: data.status,
          errorMessage: data.error,
          durationMs: typeof updates.execution_time_ms === 'number' ? updates.execution_time_ms : undefined,
          finishedAt: data.status === 'done' || data.status === 'error'
            ? deps.now()
            : undefined,
        });
      }
      return false;
    }

    if (event === 'node_token') {
      const data = JSON.parse(payload) as Extract<WorkflowSSEEvent, { type: 'node_token' }>;
      deps.setSelectedNodeId(data.node_id);
      deps.updateNodeData(data.node_id, (prev: { output?: string | null }) => ({
        output: (prev.output ?? '') + data.token,
      }));
      deps.appendNodeTraceToken(data.node_id, data.token);
      return false;
    }

    if (event === 'node_done') {
      const data = JSON.parse(payload) as Extract<WorkflowSSEEvent, { type: 'node_done' }>;
      deps.setSelectedNodeId(data.node_id);
      deps.updateNodeData(data.node_id, {
        output: data.full_output,
        status: 'done',
      });
      deps.updateNodeTrace(data.node_id, {
        status: 'done',
        finalOutput: data.full_output,
      });
      return false;
    }

    if (event === 'loop_iteration') {
      const data = JSON.parse(payload) as Extract<WorkflowSSEEvent, { type: 'loop_iteration' }>;
      deps.setSelectedNodeId(data.group_id);
      deps.updateNodeData(data.group_id, {
        currentIteration: data.iteration,
        totalIterations: data.total,
        status: 'running',
      });
      return false;
    }

    if (event === 'save_error') {
      const data = JSON.parse(payload) as Extract<WorkflowSSEEvent, { type: 'save_error' }>;
      deps.setError(data.error);
      return false;
    }

    if (event === 'workflow_done') {
      const data = JSON.parse(payload) as Extract<WorkflowSSEEvent, { type: 'workflow_done' }>;
      const nextStatus = data.status === 'completed' ? 'completed' : 'error';
      deps.setStatus(nextStatus);
      deps.setError(data.status === 'completed' ? null : (data.error ?? '工作流执行失败'));
      deps.finalizeExecutionSession(nextStatus);
      deps.closeStream();
      deps.resetTrackingState();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
