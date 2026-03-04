-- Migration: create_studysolo_core_tables
-- Creates StudySolo-specific core tables: ss_workflows, ss_workflow_runs, ss_usage_daily

-- Workflows table
CREATE TABLE IF NOT EXISTS public.ss_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  nodes_json JSONB DEFAULT '[]'::jsonb,
  edges_json JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ss_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ss_workflows_select_own ON public.ss_workflows
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflows_insert_own ON public.ss_workflows
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflows_update_own ON public.ss_workflows
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflows_delete_own ON public.ss_workflows
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Updated at trigger
CREATE TRIGGER ss_workflows_updated_at
  BEFORE UPDATE ON public.ss_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index
CREATE INDEX idx_ss_workflows_user_id ON public.ss_workflows(user_id);

-- Workflow runs table
CREATE TABLE IF NOT EXISTS public.ss_workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.ss_workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  input TEXT,
  output JSONB,
  status TEXT DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  tokens_used INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.ss_workflow_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ss_workflow_runs_select_own ON public.ss_workflow_runs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflow_runs_insert_own ON public.ss_workflow_runs
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflow_runs_update_own ON public.ss_workflow_runs
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflow_runs_delete_own ON public.ss_workflow_runs
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Indexes
CREATE INDEX idx_ss_workflow_runs_user_id ON public.ss_workflow_runs(user_id);
CREATE INDEX idx_ss_workflow_runs_workflow_id ON public.ss_workflow_runs(workflow_id);

-- Daily usage table
CREATE TABLE IF NOT EXISTS public.ss_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  executions_count INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.ss_usage_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ss_usage_daily_select_own ON public.ss_usage_daily
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_usage_daily_insert_own ON public.ss_usage_daily
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_usage_daily_update_own ON public.ss_usage_daily
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Index
CREATE INDEX idx_ss_usage_daily_user_date ON public.ss_usage_daily(user_id, date);
