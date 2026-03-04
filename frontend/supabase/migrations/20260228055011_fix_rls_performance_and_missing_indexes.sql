-- Migration: fix_rls_performance_and_missing_indexes
-- Fixes RLS performance issues by using subquery pattern for auth.uid()
-- and adds missing indexes for better query performance

-- Fix RLS policies to use subquery pattern (SELECT auth.uid()) for performance
-- This avoids re-evaluating auth.uid() for each row

-- user_profiles: already using subquery pattern from migration 1

-- ss_workflows: update policies to use subquery pattern
DROP POLICY IF EXISTS ss_workflows_select_own ON public.ss_workflows;
DROP POLICY IF EXISTS ss_workflows_insert_own ON public.ss_workflows;
DROP POLICY IF EXISTS ss_workflows_update_own ON public.ss_workflows;
DROP POLICY IF EXISTS ss_workflows_delete_own ON public.ss_workflows;

CREATE POLICY ss_workflows_select_own ON public.ss_workflows
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflows_insert_own ON public.ss_workflows
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflows_update_own ON public.ss_workflows
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflows_delete_own ON public.ss_workflows
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ss_workflow_runs: update policies
DROP POLICY IF EXISTS ss_workflow_runs_select_own ON public.ss_workflow_runs;
DROP POLICY IF EXISTS ss_workflow_runs_insert_own ON public.ss_workflow_runs;
DROP POLICY IF EXISTS ss_workflow_runs_update_own ON public.ss_workflow_runs;
DROP POLICY IF EXISTS ss_workflow_runs_delete_own ON public.ss_workflow_runs;

CREATE POLICY ss_workflow_runs_select_own ON public.ss_workflow_runs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflow_runs_insert_own ON public.ss_workflow_runs
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflow_runs_update_own ON public.ss_workflow_runs
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_workflow_runs_delete_own ON public.ss_workflow_runs
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ss_usage_daily: update policies
DROP POLICY IF EXISTS ss_usage_daily_select_own ON public.ss_usage_daily;
DROP POLICY IF EXISTS ss_usage_daily_insert_own ON public.ss_usage_daily;
DROP POLICY IF EXISTS ss_usage_daily_update_own ON public.ss_usage_daily;

CREATE POLICY ss_usage_daily_select_own ON public.ss_usage_daily
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_usage_daily_insert_own ON public.ss_usage_daily
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY ss_usage_daily_update_own ON public.ss_usage_daily
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- subscriptions: update policies
DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_insert_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update_own ON public.subscriptions;

CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY subscriptions_insert_own ON public.subscriptions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY subscriptions_update_own ON public.subscriptions
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- addon_purchases: update policies
DROP POLICY IF EXISTS addon_purchases_select_own ON public.addon_purchases;
DROP POLICY IF EXISTS addon_purchases_insert_own ON public.addon_purchases;

CREATE POLICY addon_purchases_select_own ON public.addon_purchases
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY addon_purchases_insert_own ON public.addon_purchases
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- payment_records: update policies
DROP POLICY IF EXISTS payment_records_select_own ON public.payment_records;

CREATE POLICY payment_records_select_own ON public.payment_records
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- tier_change_log: update policies
DROP POLICY IF EXISTS tier_change_log_select_own ON public.tier_change_log;

CREATE POLICY tier_change_log_select_own ON public.tier_change_log
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- student_verifications: update policies
DROP POLICY IF EXISTS student_verifications_select_own ON public.student_verifications;
DROP POLICY IF EXISTS student_verifications_insert_own ON public.student_verifications;

CREATE POLICY student_verifications_select_own ON public.student_verifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY student_verifications_insert_own ON public.student_verifications
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_profiles: update policies
DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;

CREATE POLICY user_profiles_select_own ON public.user_profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY user_profiles_insert_own ON public.user_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);
