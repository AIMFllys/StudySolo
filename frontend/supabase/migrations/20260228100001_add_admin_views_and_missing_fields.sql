-- Add is_active field to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add workflow monitoring fields to ss_workflow_runs
ALTER TABLE ss_workflow_runs ADD COLUMN IF NOT EXISTS current_step INTEGER;
ALTER TABLE ss_workflow_runs ADD COLUMN IF NOT EXISTS total_steps INTEGER;
ALTER TABLE ss_workflow_runs ADD COLUMN IF NOT EXISTS current_node TEXT;

-- Create view v_daily_signups
CREATE OR REPLACE VIEW v_daily_signups AS
SELECT DATE(created_at) AS date, COUNT(*) AS signups,
  COUNT(CASE WHEN email LIKE '%.edu%' THEN 1 END) AS edu_signups
FROM user_profiles GROUP BY DATE(created_at) ORDER BY date DESC;

-- Create view v_daily_workflow_stats
CREATE OR REPLACE VIEW v_daily_workflow_stats AS
SELECT DATE(started_at) AS date, COUNT(*) AS total_runs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS success,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed,
  COALESCE(SUM(tokens_used), 0) AS total_tokens,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_duration_seconds
FROM ss_workflow_runs GROUP BY DATE(started_at) ORDER BY date DESC;
