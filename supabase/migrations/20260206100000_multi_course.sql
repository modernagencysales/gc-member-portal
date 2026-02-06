-- Multi-Course Platform Extensibility
-- Extends lms_cohorts with course presentation + onboarding config
-- Extends student_cohorts with per-enrollment tracking

-- ============================================
-- Extend lms_cohorts
-- ============================================

ALTER TABLE lms_cohorts
  ADD COLUMN IF NOT EXISTS sidebar_label TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'course',
  ADD COLUMN IF NOT EXISTS thrivecart_product_id TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_config JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_cohorts_product_id
  ON lms_cohorts(thrivecart_product_id) WHERE thrivecart_product_id IS NOT NULL;

-- ============================================
-- Extend student_cohorts
-- ============================================

ALTER TABLE student_cohorts
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'Full Access',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrollment_source TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_metadata JSONB DEFAULT '{}';
