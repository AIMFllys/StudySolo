export type CommunityNodeCategory =
  | 'academic'
  | 'analysis'
  | 'generation'
  | 'assessment'
  | 'productivity'
  | 'other';

export type CommunityNodeOutputFormat = 'markdown' | 'json';
export type CommunityNodeSort = 'likes' | 'newest';
export type CommunityNodeModelPreference = 'auto' | 'fast' | 'powerful';

export interface CommunityNodePublic {
  id: string;
  author_id: string;
  author_name: string;
  name: string;
  description: string;
  icon: string;
  category: CommunityNodeCategory | string;
  version: string;
  input_hint: string;
  output_format: CommunityNodeOutputFormat | string;
  output_schema?: Record<string, unknown> | null;
  model_preference: CommunityNodeModelPreference | string;
  knowledge_file_name?: string | null;
  knowledge_file_size: number;
  likes_count: number;
  install_count: number;
  is_liked: boolean;
  is_owner: boolean;
  created_at: string;
}

export interface CommunityNodeInsertPayload {
  id: string;
  name: string;
  icon: string;
  input_hint: string;
  output_format: string;
  model_preference: string;
  description: string;
}

export interface CommunityNodeMine extends CommunityNodePublic {
  prompt: string;
  status: string;
  reject_reason?: string | null;
}

export interface CommunityNodeListResponse {
  items: CommunityNodePublic[];
  total: number;
  page: number;
  pages: number;
}

export interface GenerateSchemaRequest {
  name: string;
  description: string;
  prompt_snippet: string;
}

export interface GenerateSchemaResponse {
  schema: Record<string, unknown>;
  example: Record<string, unknown>;
}

export interface PublishCommunityNodeInput {
  name: string;
  description: string;
  icon: string;
  category: CommunityNodeCategory;
  prompt: string;
  input_hint: string;
  output_format: CommunityNodeOutputFormat;
  output_schema?: Record<string, unknown> | null;
  model_preference: CommunityNodeModelPreference;
  knowledge_file?: File | null;
}

export interface UpdateCommunityNodeInput {
  name?: string;
  description?: string;
  icon?: string;
  category?: CommunityNodeCategory;
  prompt?: string;
  input_hint?: string;
  output_format?: CommunityNodeOutputFormat;
  output_schema?: Record<string, unknown> | null;
  model_preference?: CommunityNodeModelPreference;
}
