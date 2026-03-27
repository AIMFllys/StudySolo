'use client';

import type { NodeExecutionTrace, NodeStatus, WorkflowExecutionSession } from '@/types';

const TRACKED_SUMMARY_STATUSES: NodeStatus[] = ['pending', 'running', 'done', 'error'];

function isRenderableTrace(trace: NodeExecutionTrace) {
  return trace.nodeType !== 'trigger_input';
}

export function countExecutionSessionStatuses(session: WorkflowExecutionSession): Record<NodeStatus, number> {
  return session.traces
    .filter(isRenderableTrace)
    .reduce<Record<NodeStatus, number>>((counts, trace) => {
      if (!TRACKED_SUMMARY_STATUSES.includes(trace.status)) {
        return counts;
      }

      counts[trace.status] = (counts[trace.status] ?? 0) + 1;
      return counts;
    }, {
      pending: 0,
      running: 0,
      done: 0,
      error: 0,
      waiting: 0,
      paused: 0,
      skipped: 0,
    });
}

export function getExecutionSessionStepCount(session: WorkflowExecutionSession): number {
  return session.traces.filter(isRenderableTrace).length;
}

export function resolveExecutionFocusTrace(session: WorkflowExecutionSession): NodeExecutionTrace | null {
  const renderableTraces = session.traces.filter(isRenderableTrace);
  if (renderableTraces.length === 0) {
    return null;
  }

  const runningTrace = [...renderableTraces]
    .filter((trace) => trace.status === 'running')
    .sort((left, right) => left.executionOrder - right.executionOrder)[0];

  if (runningTrace) {
    return runningTrace;
  }

  const latestFinishedTrace = [...renderableTraces]
    .filter((trace) => trace.status === 'done' || trace.status === 'error' || trace.status === 'skipped')
    .sort((left, right) => {
      const finishedDelta = (right.finishedAt ?? -1) - (left.finishedAt ?? -1);
      if (finishedDelta !== 0) {
        return finishedDelta;
      }
      return right.executionOrder - left.executionOrder;
    })[0];

  return latestFinishedTrace ?? null;
}
