-- Migration: enable_rls_on_sensitive_platform_tables
-- Enables RLS on sensitive Platform (legacy) tables that were missing RLS protection
-- Note: These are Platform legacy tables (no ss_ prefix). RLS is enabled but
-- no policies are added here - service_role bypasses RLS for backend access.

-- Enable RLS on sessions table (already has RLS from platform)
-- The following tables need RLS enabled for security:

ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_codes_v2 ENABLE ROW LEVEL SECURITY;

-- Note: The following platform tables have RLS disabled (tracked but not fixed here
-- as they are outside Admin Panel scope):
-- ai_models, api_call_logs, conversations, messages, conversation_folders,
-- message_feedback, redeem_codes, redeem_logs, usage_daily, usage_stats,
-- user_model_limits, user_preferences, user_login_logs, site_stats,
-- verification_codes
