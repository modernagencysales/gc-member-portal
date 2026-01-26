-- Add subscription fields to bootcamp_students
ALTER TABLE bootcamp_students
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'
  CHECK (subscription_status IN ('none', 'active', 'canceled', 'past_due')),
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_students_subscription_status
ON bootcamp_students(subscription_status) WHERE subscription_status != 'none';

CREATE INDEX IF NOT EXISTS idx_students_stripe_customer
ON bootcamp_students(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Junction table for multi-cohort membership
CREATE TABLE IF NOT EXISTS student_cohorts (
  student_id UUID REFERENCES bootcamp_students(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES lms_cohorts(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'member', 'resources')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, cohort_id)
);

-- Subscription events for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES bootcamp_students(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'paid', 'canceled', 'payment_failed', 'reactivated')),
  stripe_event_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_student
ON subscription_events(student_id, created_at DESC);

-- Enable RLS
ALTER TABLE student_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_cohorts
CREATE POLICY "Students can view their own cohort memberships"
ON student_cohorts FOR SELECT
USING (student_id IN (
  SELECT id FROM bootcamp_students WHERE email = auth.jwt() ->> 'email'
));

CREATE POLICY "Service role can manage student_cohorts"
ON student_cohorts FOR ALL
USING (auth.role() = 'service_role');

-- RLS policies for subscription_events
CREATE POLICY "Students can view their own subscription events"
ON subscription_events FOR SELECT
USING (student_id IN (
  SELECT id FROM bootcamp_students WHERE email = auth.jwt() ->> 'email'
));

CREATE POLICY "Service role can manage subscription_events"
ON subscription_events FOR ALL
USING (auth.role() = 'service_role');
