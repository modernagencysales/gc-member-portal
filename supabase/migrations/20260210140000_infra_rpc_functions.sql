-- ============================================
-- RPC functions for infrastructure provisioning
-- Uses SECURITY DEFINER to bypass RLS since the bootcamp
-- login doesn't create Supabase Auth sessions
-- ============================================

-- Get provisions for a student (with tiers and domains)
CREATE OR REPLACE FUNCTION get_student_provisions(p_student_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(p))
  INTO result
  FROM (
    SELECT
      ip.*,
      (SELECT row_to_json(t) FROM infra_tiers t WHERE t.id = ip.tier_id) as infra_tiers,
      (SELECT json_agg(row_to_json(d)) FROM infra_domains d WHERE d.provision_id = ip.id) as infra_domains
    FROM infra_provisions ip
    WHERE ip.student_id = p_student_id
  ) p;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_student_provisions(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_student_provisions(uuid) TO authenticated;
