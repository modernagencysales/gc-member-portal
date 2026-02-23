-- RPC function for DFY intake form submission.
-- Runs as SECURITY DEFINER to bypass RLS (anon has SELECT only on dfy_engagements).
-- Validates portal_slug ownership and prevents re-submission.

CREATE OR REPLACE FUNCTION submit_dfy_intake(
  p_portal_slug text,
  p_ideal_client text,
  p_crm_type text,
  p_crm_access text DEFAULT NULL,
  p_notetaker_tool text DEFAULT NULL,
  p_notetaker_other text DEFAULT NULL,
  p_linkedin_url text DEFAULT NULL,
  p_files jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement_id uuid;
  v_client_name text;
BEGIN
  -- Validate required fields
  IF p_ideal_client IS NULL OR trim(p_ideal_client) = '' THEN
    RETURN jsonb_build_object('error', 'Ideal client description is required');
  END IF;
  IF p_crm_type IS NULL OR trim(p_crm_type) = '' THEN
    RETURN jsonb_build_object('error', 'CRM type is required');
  END IF;
  IF p_notetaker_tool IS NULL OR trim(p_notetaker_tool) = '' THEN
    RETURN jsonb_build_object('error', 'Notetaker tool selection is required');
  END IF;
  IF p_linkedin_url IS NULL OR trim(p_linkedin_url) = '' THEN
    RETURN jsonb_build_object('error', 'LinkedIn profile URL is required');
  END IF;

  -- Find engagement by portal_slug (must exist and not already submitted)
  SELECT id, client_name
  INTO v_engagement_id, v_client_name
  FROM dfy_engagements
  WHERE portal_slug = p_portal_slug
    AND intake_submitted_at IS NULL;

  IF v_engagement_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Engagement not found or intake already submitted');
  END IF;

  -- Update engagement with intake data
  UPDATE dfy_engagements
  SET
    intake_data = jsonb_build_object(
      'ideal_client', trim(p_ideal_client),
      'crm_type', trim(p_crm_type),
      'crm_access', CASE WHEN p_crm_access IS NOT NULL THEN trim(p_crm_access) ELSE NULL END,
      'notetaker_tool', trim(p_notetaker_tool),
      'notetaker_other', CASE WHEN p_notetaker_tool = 'Other' AND p_notetaker_other IS NOT NULL THEN trim(p_notetaker_other) ELSE NULL END,
      'linkedin_url', trim(p_linkedin_url),
      'files', p_files
    ),
    intake_submitted_at = now(),
    linkedin_url = trim(p_linkedin_url)
  WHERE id = v_engagement_id;

  -- Log activity
  INSERT INTO dfy_activity_log (engagement_id, action, actor, description, metadata, client_visible)
  VALUES (
    v_engagement_id,
    'intake_form_submitted',
    COALESCE(v_client_name, 'Client'),
    'Onboarding intake form submitted',
    jsonb_build_object(
      'fields_completed', '["ideal_client","crm","notetaker","linkedin_url"]'::jsonb,
      'files_uploaded', jsonb_array_length(p_files)
    ),
    true
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Allow anon to call this function
GRANT EXECUTE ON FUNCTION submit_dfy_intake TO anon;
GRANT EXECUTE ON FUNCTION submit_dfy_intake TO authenticated;

-- Storage bucket for intake file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('dfy-intake-files', 'dfy-intake-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous uploads to dfy-intake-files bucket (scoped by engagement folder)
CREATE POLICY "anon_upload_intake_files"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'dfy-intake-files');

-- Allow service role full access
CREATE POLICY "service_role_all_intake_files"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'dfy-intake-files')
WITH CHECK (bucket_id = 'dfy-intake-files');
