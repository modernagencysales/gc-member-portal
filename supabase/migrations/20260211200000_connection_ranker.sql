-- Connection Ranking Tables
-- Three-phase aggressive connection ranking system

-- Runs table: tracks each ranking run
CREATE TABLE IF NOT EXISTS connection_ranking_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','phase1_running','phase1_complete','phase2_running','phase2_complete','completed','failed','paused')),
  total_connections int NOT NULL DEFAULT 0,
  phase1_processed int NOT NULL DEFAULT 0,
  phase2_total int NOT NULL DEFAULT 0,
  phase2_processed int NOT NULL DEFAULT 0,
  tier_definite_keep int NOT NULL DEFAULT 0,
  tier_strong_keep int NOT NULL DEFAULT 0,
  tier_borderline int NOT NULL DEFAULT 0,
  tier_likely_remove int NOT NULL DEFAULT 0,
  tier_definite_remove int NOT NULL DEFAULT 0,
  tier_protected int NOT NULL DEFAULT 0,
  criteria jsonb,
  protected_keywords jsonb,
  gemini_calls int NOT NULL DEFAULT 0,
  estimated_cost_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  phase1_completed_at timestamptz,
  phase2_completed_at timestamptz,
  completed_at timestamptz
);

-- Results table: one row per connection per run
CREATE TABLE IF NOT EXISTS connection_ranking_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES connection_ranking_runs(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  linkedin_url text,
  email_address text,
  company text,
  position text,
  connected_on text,
  deterministic_score int NOT NULL DEFAULT 0,
  title_score int NOT NULL DEFAULT 0,
  company_score int NOT NULL DEFAULT 0,
  recency_score int NOT NULL DEFAULT 0,
  is_protected boolean NOT NULL DEFAULT false,
  protected_reason text,
  needs_enrichment boolean NOT NULL DEFAULT false,
  enrichment_status text NOT NULL DEFAULT 'pending'
    CHECK (enrichment_status IN ('pending','skipped','processing','completed','failed')),
  grounding_data jsonb,
  ai_score int NOT NULL DEFAULT 0,
  ai_reasoning text,
  ai_geography text,
  ai_industry text,
  ai_company_size text,
  total_score int NOT NULL DEFAULT 0,
  tier text
    CHECK (tier IN ('definite_keep','strong_keep','borderline','likely_remove','definite_remove','protected')),
  rank_position int,
  user_override text CHECK (user_override IN ('keep','remove')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ranking_results_run_id ON connection_ranking_results(run_id);
CREATE INDEX IF NOT EXISTS idx_ranking_results_run_tier ON connection_ranking_results(run_id, tier);
CREATE INDEX IF NOT EXISTS idx_ranking_results_enrichment ON connection_ranking_results(run_id, enrichment_status) WHERE needs_enrichment = true;
CREATE INDEX IF NOT EXISTS idx_ranking_results_score ON connection_ranking_results(run_id, total_score DESC);

-- RLS: public policy (same pattern as enrichment_batch_runs)
ALTER TABLE connection_ranking_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_ranking_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access_ranking_runs" ON connection_ranking_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access_ranking_results" ON connection_ranking_results FOR ALL USING (true) WITH CHECK (true);
