-- Migration: add_admin_performance_indexes
-- Performance indexes for Admin Panel queries

-- user_profiles.email: used in admin user search
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email);

-- user_profiles.tier: used in member stats and filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON public.user_profiles (tier);

-- ss_admin_audit_logs.created_at: used in audit log pagination (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_ss_admin_audit_logs_created_at ON public.ss_admin_audit_logs (created_at DESC);

-- ss_admin_audit_logs.action: used in audit log action filter
CREATE INDEX IF NOT EXISTS idx_ss_admin_audit_logs_action ON public.ss_admin_audit_logs (action);

-- ss_workflow_runs.started_at: used in workflow stats time range queries
CREATE INDEX IF NOT EXISTS idx_ss_workflow_runs_started_at ON public.ss_workflow_runs (started_at DESC);

-- ss_workflow_runs.status: used in workflow monitoring queries
CREATE INDEX IF NOT EXISTS idx_ss_workflow_runs_status ON public.ss_workflow_runs (status);
