-- ============================================
-- Add INSERT RLS policies for infra_provisions and infra_domains
-- Students need INSERT to create provision records from the wizard
-- ============================================

-- Allow authenticated students to insert their own provisions
CREATE POLICY "Students insert own provisions"
ON infra_provisions FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM bootcamp_students WHERE email = auth.jwt() ->> 'email'
  )
);

-- Allow authenticated students to insert domains for their own provisions
CREATE POLICY "Students insert own domains"
ON infra_domains FOR INSERT
TO authenticated
WITH CHECK (
  provision_id IN (
    SELECT id FROM infra_provisions WHERE student_id IN (
      SELECT id FROM bootcamp_students WHERE email = auth.jwt() ->> 'email'
    )
  )
);
