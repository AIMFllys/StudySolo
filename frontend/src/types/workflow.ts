import type { Edge, Node } from '@xyflow/react';

export interface WorkflowMeta {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowContent {
  id: string;
  name: string;
  nodes_json: Node[];
  edges_json: Edge[];
}
