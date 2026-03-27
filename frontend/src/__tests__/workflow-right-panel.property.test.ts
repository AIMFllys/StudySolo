import { describe, expect, it } from 'vitest';
import type { NodeExecutionTrace, WorkflowExecutionSession } from '@/types';
import {
  countExecutionSessionStatuses,
  getExecutionSessionStepCount,
  resolveExecutionFocusTrace,
} from '@/components/layout/sidebar/right-panel-execution-utils';

function makeTrace(overrides: Partial<NodeExecutionTrace>): NodeExecutionTrace {
  return {
    nodeId: overrides.nodeId ?? 'node-1',
    nodeType: overrides.nodeType ?? 'summary',
    nodeName: overrides.nodeName ?? '节点 1',
    category: overrides.category ?? 'generation',
    status: overrides.status ?? 'pending',
    executionOrder: overrides.executionOrder ?? 1,
    isParallel: overrides.isParallel ?? false,
    streamingOutput: overrides.streamingOutput ?? '',
    ...overrides,
  };
}

function makeSession(traces: NodeExecutionTrace[]): WorkflowExecutionSession {
  return {
    sessionId: 'session-1',
    workflowId: 'workflow-1',
    workflowName: '测试工作流',
    startedAt: 0,
    overallStatus: 'running',
    traces,
    completedCount: traces.filter((trace) => trace.status === 'done' || trace.status === 'error').length,
    totalCount: traces.length,
    chains: [],
  };
}

describe('workflow right panel execution helpers', () => {
  it('counts execution statuses from renderable traces only', () => {
    const session = makeSession([
      makeTrace({ nodeId: 'trigger', nodeType: 'trigger_input', status: 'pending' }),
      makeTrace({ nodeId: 'a', status: 'pending' }),
      makeTrace({ nodeId: 'b', status: 'running' }),
      makeTrace({ nodeId: 'c', status: 'done' }),
      makeTrace({ nodeId: 'd', status: 'error' }),
      makeTrace({ nodeId: 'e', status: 'skipped' }),
    ]);

    expect(countExecutionSessionStatuses(session)).toMatchObject({
      pending: 1,
      running: 1,
      done: 1,
      error: 1,
    });
    expect(getExecutionSessionStepCount(session)).toBe(5);
  });

  it('uses the earliest running trace as current execution focus', () => {
    const session = makeSession([
      makeTrace({ nodeId: 'a', executionOrder: 3, status: 'running' }),
      makeTrace({ nodeId: 'b', executionOrder: 1, status: 'running' }),
      makeTrace({ nodeId: 'c', executionOrder: 2, status: 'done', finishedAt: 20 }),
    ]);

    expect(resolveExecutionFocusTrace(session)?.nodeId).toBe('b');
  });

  it('falls back to the most recently finished or errored trace when nothing is running', () => {
    const session = makeSession([
      makeTrace({ nodeId: 'a', executionOrder: 1, status: 'done', finishedAt: 30 }),
      makeTrace({ nodeId: 'b', executionOrder: 2, status: 'error', finishedAt: 60 }),
      makeTrace({ nodeId: 'c', executionOrder: 3, status: 'pending' }),
    ]);

    expect(resolveExecutionFocusTrace(session)?.nodeId).toBe('b');
  });

  it('returns null when the session only contains non-renderable traces', () => {
    const session = makeSession([
      makeTrace({ nodeId: 'trigger', nodeType: 'trigger_input', status: 'pending' }),
    ]);

    expect(resolveExecutionFocusTrace(session)).toBeNull();
    expect(getExecutionSessionStepCount(session)).toBe(0);
  });
});
