/**
 * 1037Solo shared database types
 *
 * 文档编码：UTF-8（无 BOM）
 * 事实源：supabase/migrations/*、backend/app/models/*、backend/app/api/*
 */

export type TierType = 'free' | 'pro' | 'pro_plus' | 'ultra';
export type BillingChannel = 'native' | 'proxy' | 'tool_service';
export type RoutingPolicy = 'native_first' | 'proxy_first' | 'capability_fixed';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  tier: TierType;
  tier_expires_at: string | null;
  is_student_verified: boolean;
  student_verified_at: string | null;
  storage_used_bytes: number;
  preferred_currency: 'CNY' | 'USD';
  registered_from: 'studysolo' | 'platform';
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  legacy_id: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: Exclude<TierType, 'free'>;
  plan_type: 'monthly' | 'yearly' | 'semester';
  currency: 'CNY' | 'USD';
  amount: number;
  original_amount: number | null;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  renew_failed_count: number;
  last_renew_attempt_at: string | null;
  status: 'active' | 'expired' | 'cancelled' | 'grace_period' | 'pending_deletion';
  payment_provider: string | null;
  external_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddonPurchase {
  id: string;
  user_id: string;
  subscription_id: string | null;
  addon_type: 'storage' | 'workflows' | 'concurrent';
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: 'CNY' | 'USD';
  started_at: string | null;
  expires_at: string;
  auto_renew: boolean;
  renew_failed_count: number;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  subscription_id: string | null;
  addon_purchase_id: string | null;
  payment_type:
    | 'subscription_new'
    | 'subscription_renew'
    | 'subscription_upgrade'
    | 'addon_new'
    | 'addon_renew'
    | 'refund';
  amount: number;
  currency: 'CNY' | 'USD';
  payment_provider: string;
  external_payment_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  invoice_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface StudentVerification {
  id: string;
  user_id: string;
  school_name: string;
  student_id: string | null;
  edu_email: string | null;
  graduation_year: number | null;
  proof_type: 'edu_email' | 'student_card' | 'enrollment_letter' | null;
  proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  verified_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface TierChangeLog {
  id: string;
  user_id: string;
  old_tier: string;
  new_tier: string;
  reason: string | null;
  changed_at: string;
}

export interface VerificationCodeV2 {
  id: string;
  email: string;
  code: string;
  type: 'register' | 'reset_password' | 'email_change';
  is_used: boolean;
  expires_at: string;
  created_at: string;
  attempt_count: number;
}

export interface CaptchaChallenge {
  id: string;
  seed: number;
  target_x: number;
  verified: boolean;
  consumed: boolean;
  expires_at: string;
  created_at: string;
}

export interface AuthRateLimitEvent {
  id: string;
  bucket: string;
  event_type: string;
  expires_at: string;
  created_at: string;
}

export interface AiModel {
  id: string;
  name: string;
  provider: string;
  category: string;
  default_daily_limit: number;
  max_context_tokens: number | null;
  supports_thinking: boolean;
  is_enabled: boolean;
  is_visible: boolean;
  description: string | null;
  input_price: number;
  output_price: number;
  input_price_per_million: number;
  output_price_per_million: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AiModelFamily {
  id: string;
  vendor: string;
  family_name: string;
  task_family: string;
  routing_policy: RoutingPolicy;
  description: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiModelSku {
  id: string;
  family_id: string;
  provider: string;
  model_id: string;
  display_name: string;
  billing_channel: BillingChannel;
  required_tier: TierType;
  is_enabled: boolean;
  is_visible: boolean;
  is_user_selectable: boolean;
  is_fallback_only: boolean;
  supports_thinking: boolean;
  max_context_tokens: number | null;
  input_price_cny_per_million: number;
  output_price_cny_per_million: number;
  price_source: string | null;
  pricing_verified_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SsAdminAccount {
  id: string;
  username: string;
  password_hash: string;
  email: string | null;
  is_active: boolean;
  force_change_password: boolean;
  last_login: string | null;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface SsAdminAuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SsWorkflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes_json: Record<string, unknown>[];
  edges_json: Record<string, unknown>[];
  annotations_json: Record<string, unknown>[];
  tags: string[];
  status: string;
  is_public: boolean;
  is_featured: boolean;
  is_official: boolean;
  likes_count: number;
  favorites_count: number;
  created_at: string;
  updated_at: string;
}

export interface SsWorkflowRun {
  id: string;
  workflow_id: string;
  user_id: string;
  input: string | null;
  output: Record<string, unknown> | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  tokens_used: number;
  current_step: number | null;
  total_steps: number | null;
  current_node: string | null;
}

export interface SsWorkflowCollaborator {
  id: string;
  workflow_id: string;
  user_id: string;
  role: string;
  status: string;
  invited_by: string | null;
  created_at: string;
}

export interface SsWorkflowInteraction {
  id: string;
  user_id: string;
  workflow_id: string;
  action: 'like' | 'favorite';
  created_at: string;
}

export interface SsAiConversation {
  id: string;
  user_id: string;
  workflow_id: string | null;
  title: string;
  model_id: string | null;
  platform: string | null;
  message_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SsAiMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent: 'BUILD' | 'MODIFY' | 'CHAT' | 'ACTION' | null;
  actions_json: Record<string, unknown>[] | null;
  canvas_snapshot: Record<string, unknown> | null;
  tokens_used: number;
  model_used: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface SsAiRequest {
  id: string;
  user_id: string;
  source_type: 'assistant' | 'workflow';
  source_subtype: string;
  conversation_id: string | null;
  message_id: string | null;
  workflow_id: string | null;
  workflow_run_id: string | null;
  status: string;
  started_at: string;
  finished_at: string | null;
}

export interface SsAiUsageEvent {
  id: string;
  request_id: string;
  user_id: string;
  source_type: 'assistant' | 'workflow';
  source_subtype: string;
  provider: string;
  vendor: string | null;
  model: string;
  node_id: string | null;
  attempt_index: number;
  is_fallback: boolean;
  status: string;
  latency_ms: number | null;
  input_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  cached_tokens: number;
  total_tokens: number;
  sku_id: string | null;
  family_id: string | null;
  billing_channel: string | null;
  input_price_cny_per_million: number;
  output_price_cny_per_million: number;
  cost_amount_usd: number;
  cost_amount_cny: number;
  provider_request_id: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface SsAiUsageMinute {
  minute_bucket: string;
  user_id: string;
  source_type: 'assistant' | 'workflow';
  source_subtype: string;
  provider: string;
  model: string;
  sku_id: string;
  family_id: string;
  vendor: string;
  billing_channel: string;
  logical_requests: number;
  provider_calls: number;
  successful_provider_calls: number;
  total_tokens: number;
  total_cost_usd: number;
  total_cost_cny: number;
  error_count: number;
  fallback_count: number;
  latency_ms_sum: number;
  latency_ms_count: number;
}

export interface SsUsageDaily {
  id: string;
  user_id: string;
  date: string;
  executions_count: number;
  tokens_used: number;
  created_at: string;
}

export interface SsNotice {
  id: string;
  title: string;
  type: 'system' | 'feature' | 'promotion' | 'education' | 'changelog' | 'maintenance';
  content: string;
  audience: string;
  priority: number;
  status: 'draft' | 'published' | 'archived';
  popup_enabled: boolean;
  popup_type: string | null;
  start_time: string | null;
  end_time: string | null;
  action_text: string | null;
  action_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  expires_at: string | null;
}

export interface SsNoticeRead {
  id: string;
  notice_id: string;
  user_id: string;
  read_at: string;
}

export interface SsRating {
  id: string;
  user_id: string;
  rating_type: 'nps' | 'csat';
  score: number;
  comment: string | null;
  context: string | null;
  created_at: string;
}

export interface SsSystemConfig {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface SsFeedback {
  id: string;
  user_id: string;
  user_email: string;
  user_nickname: string;
  rating: number;
  issue_type: string;
  content: string;
  reward_days: number;
  reward_applied: boolean;
  created_at: string;
  updated_at: string;
}

export interface SsKbDocument {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  file_path: string | null;
  status: string;
  error_message: string | null;
  total_chunks: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface SsKbDocumentSummary {
  id: string;
  document_id: string;
  summary: string;
  key_concepts: Record<string, unknown>[];
  table_of_contents: Record<string, unknown>[];
  created_at: string;
}

export interface SsKbDocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SsKbChunkEmbedding {
  id: string;
  chunk_id: string;
  document_id: string;
  created_at: string;
}

export interface SsKbSummaryEmbedding {
  id: string;
  document_id: string;
  created_at: string;
}

export interface PlatformLegacyUser {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  nickname: string | null;
  fingerprint: string | null;
  login_count: number;
  total_tokens_used: number;
  last_login_at: string | null;
  last_login_ip: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const TABLE_NAMES = {
  USER_PROFILES: 'user_profiles',
  SUBSCRIPTIONS: 'subscriptions',
  ADDON_PURCHASES: 'addon_purchases',
  PAYMENT_RECORDS: 'payment_records',
  STUDENT_VERIFICATIONS: 'student_verifications',
  TIER_CHANGE_LOG: 'tier_change_log',
  VERIFICATION_CODES_V2: 'verification_codes_v2',
  CAPTCHA_CHALLENGES: 'captcha_challenges',
  AUTH_RATE_LIMIT_EVENTS: 'auth_rate_limit_events',
  AI_MODELS: 'ai_models',
  AI_MODEL_FAMILIES: 'ai_model_families',
  AI_MODEL_SKUS: 'ai_model_skus',
  SS_ADMIN_ACCOUNTS: 'ss_admin_accounts',
  SS_ADMIN_AUDIT_LOGS: 'ss_admin_audit_logs',
  SS_WORKFLOWS: 'ss_workflows',
  SS_WORKFLOW_RUNS: 'ss_workflow_runs',
  SS_WORKFLOW_COLLABORATORS: 'ss_workflow_collaborators',
  SS_WORKFLOW_INTERACTIONS: 'ss_workflow_interactions',
  SS_AI_CONVERSATIONS: 'ss_ai_conversations',
  SS_AI_MESSAGES: 'ss_ai_messages',
  SS_AI_REQUESTS: 'ss_ai_requests',
  SS_AI_USAGE_EVENTS: 'ss_ai_usage_events',
  SS_AI_USAGE_MINUTE: 'ss_ai_usage_minute',
  SS_USAGE_DAILY: 'ss_usage_daily',
  SS_NOTICES: 'ss_notices',
  SS_NOTICE_READS: 'ss_notice_reads',
  SS_RATINGS: 'ss_ratings',
  SS_SYSTEM_CONFIG: 'ss_system_config',
  SS_FEEDBACK: 'ss_feedback',
  SS_KB_DOCUMENTS: 'ss_kb_documents',
  SS_KB_DOCUMENT_SUMMARIES: 'ss_kb_document_summaries',
  SS_KB_DOCUMENT_CHUNKS: 'ss_kb_document_chunks',
  SS_KB_CHUNK_EMBEDDINGS: 'ss_kb_chunk_embeddings',
  SS_KB_SUMMARY_EMBEDDINGS: 'ss_kb_summary_embeddings',
  PT_LEGACY_USERS: 'users',
  PT_LEGACY_SESSIONS: 'sessions',
  PT_LEGACY_CONVERSATIONS: 'conversations',
  PT_LEGACY_MESSAGES: 'messages',
} as const;
