/**
 * inject-traces.ts — Map RunTrace execution data onto workflow nodes.
 *
 * Merges trace results (output, status, timing, errors) into the
 * corresponding node's `data` so that ReadOnlyCanvas → AIStepNode →
 * NodeResultSlip can render execution results on the canvas.
 */

import type { Node } from '@xyflow/react';
import type { RunTrace } from '@/types/memory';

const VALID_STATUSES = new Set([
  'pending', 'running', 'done', 'error', 'skipped', 'waiting',
]);

function mapTraceStatus(traceStatus: string): string {
  return VALID_STATUSES.has(traceStatus) ? traceStatus : 'pending';
}

/**
 * Inject trace execution data into nodes' `data` fields.
 *
 * Mapping:
 *   trace.final_output   → node.data.output
 *   trace.status          → node.data.status
 *   trace.input_snapshot  → node.data.input_snapshot
 *   trace.duration_ms     → node.data.execution_time_ms
 *   trace.model_route     → node.data.model_route
 *   trace.error_message   → node.data.error
 *   trace.output_format   → node.data.output_format
 *
 * Nodes without a matching trace keep status='pending'.
 */
export function injectTracesIntoNodes(
  nodes: Node[],
  traces: RunTrace[],
): Node[] {
  const traceMap = new Map(traces.map((t) => [t.node_id, t]));

  return nodes.map((node) => {
    const trace = traceMap.get(node.id);
    if (!trace) return node;

    return {
      ...node,
      data: {
        ...node.data,
        output: trace.final_output ?? '',
        status: mapTraceStatus(trace.status),
        input_snapshot: trace.input_snapshot ?? undefined,
        execution_time_ms: trace.duration_ms ?? undefined,
        model_route: trace.model_route ?? undefined,
        error: trace.error_message ?? undefined,
        output_format: trace.output_format ?? undefined,
      },
    };
  });
}

/**
 * Find traces that have no matching node in nodes_json.
 * These "orphan" traces occur when the user edited the workflow
 * after execution (deleted/replaced nodes).
 */
export function findOrphanTraces(
  nodes: Node[],
  traces: RunTrace[],
): RunTrace[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  return traces.filter((t) => !nodeIds.has(t.node_id));
}
