-- Fix TAM Builder RLS policies
-- Replace FOR ALL policies with explicit per-operation policies
-- to match the pattern used by all other tables in this project.

-- Drop existing FOR ALL policies
DROP POLICY IF EXISTS "Public access tam_projects" ON tam_projects;
DROP POLICY IF EXISTS "Public access tam_companies" ON tam_companies;
DROP POLICY IF EXISTS "Public access tam_contacts" ON tam_contacts;
DROP POLICY IF EXISTS "Public access tam_job_queue" ON tam_job_queue;

-- tam_projects
CREATE POLICY "tam_projects_select" ON tam_projects FOR SELECT USING (true);
CREATE POLICY "tam_projects_insert" ON tam_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "tam_projects_update" ON tam_projects FOR UPDATE USING (true);
CREATE POLICY "tam_projects_delete" ON tam_projects FOR DELETE USING (true);

-- tam_companies
CREATE POLICY "tam_companies_select" ON tam_companies FOR SELECT USING (true);
CREATE POLICY "tam_companies_insert" ON tam_companies FOR INSERT WITH CHECK (true);
CREATE POLICY "tam_companies_update" ON tam_companies FOR UPDATE USING (true);
CREATE POLICY "tam_companies_delete" ON tam_companies FOR DELETE USING (true);

-- tam_contacts
CREATE POLICY "tam_contacts_select" ON tam_contacts FOR SELECT USING (true);
CREATE POLICY "tam_contacts_insert" ON tam_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "tam_contacts_update" ON tam_contacts FOR UPDATE USING (true);
CREATE POLICY "tam_contacts_delete" ON tam_contacts FOR DELETE USING (true);

-- tam_job_queue
CREATE POLICY "tam_job_queue_select" ON tam_job_queue FOR SELECT USING (true);
CREATE POLICY "tam_job_queue_insert" ON tam_job_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "tam_job_queue_update" ON tam_job_queue FOR UPDATE USING (true);
CREATE POLICY "tam_job_queue_delete" ON tam_job_queue FOR DELETE USING (true);
