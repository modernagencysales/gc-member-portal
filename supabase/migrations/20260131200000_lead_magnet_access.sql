-- Phase 1: Lead Magnet Access System tables and functions

-- 1A. Extend bootcamp_invite_codes with access level and grants
ALTER TABLE bootcamp_invite_codes
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'Full Access',
  ADD COLUMN IF NOT EXISTS tool_grants JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_grants JSONB DEFAULT NULL;

-- 1B. Create student_tool_credits table
CREATE TABLE IF NOT EXISTS student_tool_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES bootcamp_students(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES ai_tools(id) ON DELETE CASCADE,
  credits_total INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  granted_by_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, tool_id, granted_by_code)
);

-- 1C. Create student_content_grants table
CREATE TABLE IF NOT EXISTS student_content_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES bootcamp_students(id) ON DELETE CASCADE,
  week_id TEXT NOT NULL,
  granted_by_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, week_id)
);

-- 1D. Create student_redeemed_codes table
CREATE TABLE IF NOT EXISTS student_redeemed_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES bootcamp_students(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, code)
);

-- 1E. Credit decrement RPC
CREATE OR REPLACE FUNCTION decrement_tool_credit(p_student_id UUID, p_tool_id UUID)
RETURNS INTEGER AS $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COALESCE(SUM(credits_total - credits_used), 0) INTO remaining
  FROM student_tool_credits
  WHERE student_id = p_student_id AND tool_id = p_tool_id;

  IF remaining <= 0 THEN RETURN -1; END IF;

  UPDATE student_tool_credits
  SET credits_used = credits_used + 1
  WHERE id = (
    SELECT id FROM student_tool_credits
    WHERE student_id = p_student_id AND tool_id = p_tool_id AND credits_used < credits_total
    ORDER BY created_at ASC LIMIT 1
  );

  RETURN remaining - 1;
END;
$$ LANGUAGE plpgsql;
