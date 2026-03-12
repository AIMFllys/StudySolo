export type WorkflowSSEEvent =
  | { type: 'node_status'; node_id: string; status: string; error?: string }
  | { type: 'node_token'; node_id: string; token: string }
  | { type: 'node_done'; node_id: string; full_output: string }
  | { type: 'workflow_done'; workflow_id: string; status: string; error?: string }
  | { type: 'save_error'; workflow_id: string; error: string };
