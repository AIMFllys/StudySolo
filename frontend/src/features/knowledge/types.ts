export interface KBDocument {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  status: string;
  total_chunks: number;
  total_tokens: number;
  created_at: string;
  error_message?: string;
}

export interface KnowledgeApiError {
  detail?: string;
}
