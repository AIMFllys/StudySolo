/**
 * Workflow Memory types — run history and node-level traces.
 */

import type { Node, Edge } from '@xyflow/react';

export interface WorkflowRunMeta {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  status: string;
  input: string | null;
  tokens_used: number;
  started_at: string;
  completed_at: string | null;
  is_shared: boolean;
}

export interface RunTrace {
  id: string;
  node_id: string;
  node_type: string;
  node_name: string;
  category: string | null;
  execution_order: number;
  status: string;
  input_snapshot: string | null;
  final_output: string | null;
  output_format: string | null;
  duration_ms: number | null;
  model_route: string | null;
  is_parallel: boolean;
  parallel_group_id: string | null;
  error_message: string | null;
}

export interface WorkflowRunDetail extends WorkflowRunMeta {
  workflow_name: string;
  nodes_json?: Node[];
  edges_json?: Edge[];
  traces: RunTrace[];
}
