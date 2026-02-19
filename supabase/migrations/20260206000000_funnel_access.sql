-- Sprint + AI Tools: time-limited bootcamp access for low-ticket funnel upsell buyers
-- Adds access_expires_at column and funnel tool preset settings

ALTER TABLE bootcamp_students
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_students_access_expires
  ON bootcamp_students(access_expires_at) WHERE access_expires_at IS NOT NULL;

INSERT INTO bootcamp_settings (key, value, description) VALUES
  ('funnel_tool_presets', '{"default":{"name":"Standard Sprint + AI Tools","toolSlugs":[],"description":"Default curated tool set for funnel access users"}}',
   'Tool preset configurations for Sprint + AI Tools users')
ON CONFLICT (key) DO NOTHING;
