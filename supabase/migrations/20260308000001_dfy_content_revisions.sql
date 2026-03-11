-- DFY Content Revisions: full version history for content items
CREATE TABLE IF NOT EXISTS dfy_content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES dfy_content_items(id) ON DELETE CASCADE,
  engagement_id uuid NOT NULL REFERENCES dfy_engagements(id) ON DELETE CASCADE,
  round int NOT NULL,
  content text NOT NULL,
  feedback text,
  author text NOT NULL CHECK (author IN ('original', 'ai', 'human')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_revisions_item ON dfy_content_revisions(content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_revisions_engagement ON dfy_content_revisions(engagement_id);

-- Add file_metadata to deliverables for CSV row count etc.
ALTER TABLE dfy_deliverables ADD COLUMN IF NOT EXISTS file_metadata jsonb DEFAULT '{}';

-- RLS
ALTER TABLE dfy_content_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read_content_revisions ON dfy_content_revisions;
CREATE POLICY anon_read_content_revisions ON dfy_content_revisions FOR SELECT USING (true);

DROP POLICY IF EXISTS anon_insert_content_revisions ON dfy_content_revisions;
CREATE POLICY anon_insert_content_revisions ON dfy_content_revisions FOR INSERT WITH CHECK (true);

-- Add revision_ready to content items status constraint
ALTER TABLE dfy_content_items DROP CONSTRAINT IF EXISTS dfy_content_items_status_check;
ALTER TABLE dfy_content_items ADD CONSTRAINT dfy_content_items_status_check
  CHECK (status = ANY (ARRAY['review'::text, 'approved'::text, 'revision_requested'::text, 'revision_ready'::text]));
