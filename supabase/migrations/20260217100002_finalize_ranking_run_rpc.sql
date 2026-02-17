-- RPC function: finalize_ranking_run
-- Called by services/connection-ranker-supabase.ts finalizeRanking()
-- Handles: score recomputation, tier assignment, rank positions, tier counts

CREATE OR REPLACE FUNCTION finalize_ranking_run(p_run_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier_definite_keep int := 0;
  v_tier_strong_keep int := 0;
  v_tier_borderline int := 0;
  v_tier_likely_remove int := 0;
  v_tier_definite_remove int := 0;
  v_tier_protected int := 0;
BEGIN
  -- Step 1: Recompute total_score = deterministic_score + ai_score (clamped 0-100)
  UPDATE connection_ranking_results
  SET total_score = GREATEST(0, LEAST(100, deterministic_score + ai_score))
  WHERE run_id = p_run_id;

  -- Step 2: Assign tiers based on total_score and is_protected
  UPDATE connection_ranking_results
  SET tier = CASE
    WHEN is_protected THEN 'protected'
    WHEN total_score >= 70 THEN 'definite_keep'
    WHEN total_score >= 50 THEN 'strong_keep'
    WHEN total_score >= 30 THEN 'borderline'
    WHEN total_score >= 10 THEN 'likely_remove'
    ELSE 'definite_remove'
  END
  WHERE run_id = p_run_id;

  -- Step 3: Assign rank positions ordered by total_score DESC
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_score DESC, first_name ASC) AS rn
    FROM connection_ranking_results
    WHERE run_id = p_run_id
  )
  UPDATE connection_ranking_results r
  SET rank_position = ranked.rn
  FROM ranked
  WHERE r.id = ranked.id;

  -- Step 4: Count tiers
  SELECT
    COALESCE(SUM(CASE WHEN tier = 'definite_keep' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tier = 'strong_keep' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tier = 'borderline' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tier = 'likely_remove' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tier = 'definite_remove' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tier = 'protected' THEN 1 ELSE 0 END), 0)
  INTO
    v_tier_definite_keep,
    v_tier_strong_keep,
    v_tier_borderline,
    v_tier_likely_remove,
    v_tier_definite_remove,
    v_tier_protected
  FROM connection_ranking_results
  WHERE run_id = p_run_id;

  -- Step 5: Update run with tier counts and mark completed
  UPDATE connection_ranking_runs
  SET
    tier_definite_keep = v_tier_definite_keep,
    tier_strong_keep = v_tier_strong_keep,
    tier_borderline = v_tier_borderline,
    tier_likely_remove = v_tier_likely_remove,
    tier_definite_remove = v_tier_definite_remove,
    tier_protected = v_tier_protected,
    status = 'completed',
    completed_at = now()
  WHERE id = p_run_id;
END;
$$;
