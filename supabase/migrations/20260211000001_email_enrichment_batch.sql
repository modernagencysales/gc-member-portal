-- Email Enrichment Batch tables for student CSV upload → waterfall enrichment

CREATE TABLE IF NOT EXISTS enrichment_batch_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_contacts integer NOT NULL DEFAULT 0,
  processed_contacts integer NOT NULL DEFAULT 0,
  emails_found integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS enrichment_batch_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES enrichment_batch_runs(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  company_name text,
  company_domain text,
  linkedin_url text,
  found_email text,
  provider text,
  validation_status text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'found', 'not_found', 'error')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_enrichment_batch_leads_run_id ON enrichment_batch_leads(run_id);
CREATE INDEX idx_enrichment_batch_runs_user_id ON enrichment_batch_runs(user_id);

-- RLS: public access (bootcamp uses anon key, user_id filtering is app-level)
ALTER TABLE enrichment_batch_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_batch_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrichment_batch_runs_public" ON enrichment_batch_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enrichment_batch_leads_public" ON enrichment_batch_leads FOR ALL USING (true) WITH CHECK (true);
