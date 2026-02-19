-- Create a database function for reliable bootcamp_settings upsert.
-- Uses SECURITY DEFINER to bypass RLS/privilege issues that were
-- causing the anon-key client's UPDATE to silently return 0 rows,
-- leading to INSERT hitting the unique constraint on 'key'.

-- Also ensure anon/authenticated have proper table-level privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON bootcamp_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON bootcamp_settings TO authenticated;

-- The RPC function itself (belt-and-suspenders with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION upsert_bootcamp_setting(
  p_key TEXT,
  p_value JSONB,
  p_description TEXT DEFAULT ''
) RETURNS void AS $$
BEGIN
  INSERT INTO bootcamp_settings (key, value, description)
  VALUES (p_key, p_value, p_description)
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
