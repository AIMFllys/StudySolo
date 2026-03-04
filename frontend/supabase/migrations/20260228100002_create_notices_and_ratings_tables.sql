-- Migration: create_notices_and_ratings_tables
-- Creates ss_notices, ss_notice_reads, and ss_ratings tables with RLS policies

-- Create ss_notices table
CREATE TABLE ss_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'feature', 'promotion', 'education', 'changelog')),
  content TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',
  priority INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  popup_enabled BOOLEAN DEFAULT false,
  popup_type TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  action_text TEXT,
  action_url TEXT,
  created_by UUID REFERENCES ss_admin_accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ss_notice_reads table
CREATE TABLE ss_notice_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES ss_notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notice_id, user_id)
);

-- Create ss_ratings table
CREATE TABLE ss_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating_type TEXT NOT NULL CHECK (rating_type IN ('nps', 'csat')),
  score INTEGER NOT NULL,
  comment TEXT,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all three tables
ALTER TABLE ss_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ss_notices: authenticated users can SELECT published notices
CREATE POLICY "Authenticated users can read published notices"
  ON ss_notices FOR SELECT
  TO authenticated
  USING (status = 'published');

-- RLS policies for ss_notice_reads: users can read/write their own records
CREATE POLICY "Users can read their own notice reads"
  ON ss_notice_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notice reads"
  ON ss_notice_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notice reads"
  ON ss_notice_reads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policies for ss_ratings: users can INSERT their own ratings
CREATE POLICY "Users can insert their own ratings"
  ON ss_ratings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
