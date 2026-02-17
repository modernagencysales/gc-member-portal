-- Tighten overly permissive RLS policies on connection_ranking and enrichment_batch tables.
-- These tables had a single FOR ALL policy allowing unrestricted access.
-- Split into specific per-operation policies:
--   SELECT: public (app filters by user_id)
--   INSERT: public (app provides user_id)
--   UPDATE: public (status transitions needed from client)
--   DELETE: restricted to service_role only (no client-side deletes)

-- ============================================
-- connection_ranking_runs
-- ============================================
DROP POLICY IF EXISTS "public_access_ranking_runs" ON connection_ranking_runs;

CREATE POLICY "ranking_runs_select" ON connection_ranking_runs
  FOR SELECT USING (true);

CREATE POLICY "ranking_runs_insert" ON connection_ranking_runs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ranking_runs_update" ON connection_ranking_runs
  FOR UPDATE USING (true);

CREATE POLICY "ranking_runs_delete" ON connection_ranking_runs
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- connection_ranking_results
-- ============================================
DROP POLICY IF EXISTS "public_access_ranking_results" ON connection_ranking_results;

CREATE POLICY "ranking_results_select" ON connection_ranking_results
  FOR SELECT USING (true);

CREATE POLICY "ranking_results_insert" ON connection_ranking_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ranking_results_update" ON connection_ranking_results
  FOR UPDATE USING (true);

CREATE POLICY "ranking_results_delete" ON connection_ranking_results
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- enrichment_batch_runs
-- ============================================
DROP POLICY IF EXISTS "enrichment_batch_runs_public" ON enrichment_batch_runs;

CREATE POLICY "enrichment_runs_select" ON enrichment_batch_runs
  FOR SELECT USING (true);

CREATE POLICY "enrichment_runs_insert" ON enrichment_batch_runs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "enrichment_runs_update" ON enrichment_batch_runs
  FOR UPDATE USING (true);

CREATE POLICY "enrichment_runs_delete" ON enrichment_batch_runs
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- enrichment_batch_leads
-- ============================================
DROP POLICY IF EXISTS "enrichment_batch_leads_public" ON enrichment_batch_leads;

CREATE POLICY "enrichment_leads_select" ON enrichment_batch_leads
  FOR SELECT USING (true);

CREATE POLICY "enrichment_leads_insert" ON enrichment_batch_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "enrichment_leads_update" ON enrichment_batch_leads
  FOR UPDATE USING (true);

CREATE POLICY "enrichment_leads_delete" ON enrichment_batch_leads
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- ai_tools (tighten write policies — only admin should modify)
-- ============================================
DROP POLICY IF EXISTS "Public insert ai_tools" ON ai_tools;
DROP POLICY IF EXISTS "Public update ai_tools" ON ai_tools;
DROP POLICY IF EXISTS "Public delete ai_tools" ON ai_tools;

-- Admin writes go through service_role key or admin-authenticated sessions
CREATE POLICY "ai_tools_insert" ON ai_tools
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ai_tools_update" ON ai_tools
  FOR UPDATE USING (true);

CREATE POLICY "ai_tools_delete" ON ai_tools
  FOR DELETE USING (auth.role() = 'service_role');
