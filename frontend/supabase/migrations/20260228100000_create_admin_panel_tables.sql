-- Migration: create_admin_panel_tables
-- Applied: 2026-02-28
-- Description: Creates Admin Panel tables (ss_admin_accounts, ss_admin_audit_logs, ss_system_config)
--              with RLS policies and initial admin account.

-- Create ss_admin_accounts table
CREATE TABLE ss_admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  force_change_password BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ss_admin_audit_logs table
CREATE TABLE ss_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES ss_admin_accounts(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create ss_system_config table
CREATE TABLE ss_system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES ss_admin_accounts(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all three tables
ALTER TABLE ss_admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_system_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (USING (false) = service_role only)
CREATE POLICY "admin_service_only" ON ss_admin_accounts FOR ALL USING (false);
CREATE POLICY "audit_service_only" ON ss_admin_audit_logs FOR ALL USING (false);
CREATE POLICY "config_service_only" ON ss_system_config FOR ALL USING (false);

-- Insert initial admin account
-- Password: Admin@1037Solo! (bcrypt, 12 rounds)
INSERT INTO ss_admin_accounts (username, password_hash, is_active, force_change_password)
VALUES (
  '1037SoloAdmin',
  '$2b$12$83hmpXOKYc.G99sSxANCFusqH8LpEqZpJWgQBNPlQUXvjVc5V6PxK',
  true,
  true
);
