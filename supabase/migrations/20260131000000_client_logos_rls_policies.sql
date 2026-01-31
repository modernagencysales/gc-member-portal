-- ============================================
-- RLS Policies for client_logos table
-- Matches the pattern used by blueprint_settings and blueprint_content_blocks
-- ============================================

ALTER TABLE client_logos ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "client_logos_select" ON client_logos;
CREATE POLICY "client_logos_select" ON client_logos FOR SELECT USING (true);

-- Insert access (admin-gated in UI)
DROP POLICY IF EXISTS "client_logos_insert" ON client_logos;
CREATE POLICY "client_logos_insert" ON client_logos FOR INSERT WITH CHECK (true);

-- Update access
DROP POLICY IF EXISTS "client_logos_update" ON client_logos;
CREATE POLICY "client_logos_update" ON client_logos FOR UPDATE USING (true);

-- Delete access
DROP POLICY IF EXISTS "client_logos_delete" ON client_logos;
CREATE POLICY "client_logos_delete" ON client_logos FOR DELETE USING (true);
