-- Migration: create_shared_membership_tables
-- Creates shared membership/subscription tables used across platform apps

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  amount NUMERIC NOT NULL,
  original_amount NUMERIC,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  renew_failed_count INTEGER DEFAULT 0,
  last_renew_attempt_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  payment_provider TEXT,
  external_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY subscriptions_insert_own ON public.subscriptions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY subscriptions_update_own ON public.subscriptions
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- Updated at trigger
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON public.subscriptions(expires_at);

-- Addon purchases table
CREATE TABLE IF NOT EXISTS public.addon_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  addon_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CNY',
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  renew_failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.addon_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY addon_purchases_select_own ON public.addon_purchases
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY addon_purchases_insert_own ON public.addon_purchases
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Indexes
CREATE INDEX idx_addon_purchases_user ON public.addon_purchases(user_id);
CREATE INDEX idx_addon_purchases_subscription ON public.addon_purchases(subscription_id);

-- Payment records table
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  addon_purchase_id UUID REFERENCES public.addon_purchases(id),
  payment_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CNY',
  payment_provider TEXT NOT NULL,
  external_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY payment_records_select_own ON public.payment_records
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Indexes
CREATE INDEX idx_payment_records_user ON public.payment_records(user_id);
CREATE INDEX idx_payment_records_subscription ON public.payment_records(subscription_id);
CREATE INDEX idx_payment_records_addon ON public.payment_records(addon_purchase_id);
CREATE INDEX idx_payment_records_status ON public.payment_records(status);

-- Tier change log table
CREATE TABLE IF NOT EXISTS public.tier_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  old_tier TEXT NOT NULL,
  new_tier TEXT NOT NULL,
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tier_change_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tier_change_log_select_own ON public.tier_change_log
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Index
CREATE INDEX idx_tier_change_log_user ON public.tier_change_log(user_id);

-- Student verifications table
CREATE TABLE IF NOT EXISTS public.student_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  student_id TEXT,
  edu_email TEXT,
  graduation_year INTEGER,
  proof_type TEXT,
  proof_url TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY student_verifications_select_own ON public.student_verifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY student_verifications_insert_own ON public.student_verifications
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Index
CREATE INDEX idx_student_verifications_user ON public.student_verifications(user_id);

-- Verification codes v2 table
CREATE TABLE IF NOT EXISTS public.verification_codes_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_codes_v2 ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX idx_verification_codes_v2_email ON public.verification_codes_v2(email, type, is_used);
