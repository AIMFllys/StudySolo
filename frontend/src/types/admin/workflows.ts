export interface WorkflowStats {
  total_runs: number;
  completed: number;
  failed: number;
  running: number;
  success_rate: number;
  avg_duration_seconds: number | null;
  total_tokens_used: number;
}

export interface WorkflowStatsResponse {
  stats: WorkflowStats;
  time_range: string;
}

export interface RunningWorkflow {
  id: string;
  workflow_id: string;
  user_id: string;
  started_at: string;
  current_step: number | null;
  total_steps: number | null;
  current_node: string | null;
  elapsed_seconds: number | null;
}

export interface RunningWorkflowsResponse {
  running: RunningWorkflow[];
  total: number;
}

export interface ErrorWorkflow {
  id: string;
  workflow_id: string;
  user_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  elapsed_seconds: number | null;
}

export interface ErrorWorkflowsResponse {
  errors: ErrorWorkflow[];
  total: number;
}

export type WorkflowTimeRange = '7d' | '30d' | '90d';
