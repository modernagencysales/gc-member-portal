-- Allow public read/insert/update/delete on student_cohorts
-- Matches the open RLS pattern used by bootcamp_students
-- Needed for admin panel enrollment management (uses anon key)
-- Also needed for student-facing app (no Supabase Auth, so auth.jwt() is null)

CREATE POLICY "Allow public read for student_cohorts"
ON student_cohorts FOR SELECT USING (true);

CREATE POLICY "Allow public insert for student_cohorts"
ON student_cohorts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for student_cohorts"
ON student_cohorts FOR UPDATE USING (true);

CREATE POLICY "Allow public delete for student_cohorts"
ON student_cohorts FOR DELETE USING (true);
