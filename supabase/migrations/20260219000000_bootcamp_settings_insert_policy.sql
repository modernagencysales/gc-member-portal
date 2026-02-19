-- Add missing INSERT policy for bootcamp_settings
-- The table had SELECT and UPDATE but no INSERT, which caused
-- upsert operations (e.g. saving call grant config) to fail with RLS violation.
CREATE POLICY "Allow public insert for settings" ON bootcamp_settings
  FOR INSERT WITH CHECK (true);
