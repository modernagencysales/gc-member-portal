-- ============================================
-- TAM Builder Tables
-- ============================================

-- Enums
DO $$ BEGIN
  CREATE TYPE tam_project_status AS ENUM ('draft', 'sourcing', 'enriching', 'complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tam_company_source AS ENUM ('serper', 'storeleads', 'apollo', 'blitzapi', 'smartscout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tam_qualification_status AS ENUM ('pending', 'qualified', 'disqualified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tam_email_status AS ENUM ('found', 'verified', 'catch_all', 'invalid', 'not_found');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tam_contact_source AS ENUM ('blitzapi', 'apollo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tam_job_type AS ENUM ('source_companies', 'qualify', 'find_contacts', 'enrich_emails', 'check_linkedin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tam_job_status AS ENUM ('pending', 'running', 'awaiting_approval', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Projects
CREATE TABLE IF NOT EXISTS tam_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status tam_project_status DEFAULT 'draft',
  icp_profile JSONB,
  sourcing_strategy JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies
CREATE TABLE IF NOT EXISTS tam_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES tam_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  linkedin_url TEXT,
  source tam_company_source,
  industry TEXT,
  employee_count INTEGER,
  location TEXT,
  description TEXT,
  qualification_status tam_qualification_status DEFAULT 'pending',
  qualification_reason TEXT,
  us_employee_pct REAL,
  segment_tags JSONB,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts
CREATE TABLE IF NOT EXISTS tam_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tam_companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES tam_projects(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  linkedin_url TEXT,
  email TEXT,
  email_status tam_email_status,
  phone TEXT,
  linkedin_last_post_date TIMESTAMP WITH TIME ZONE,
  linkedin_active BOOLEAN,
  source tam_contact_source,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Queue
CREATE TABLE IF NOT EXISTS tam_job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES tam_projects(id) ON DELETE CASCADE,
  job_type tam_job_type NOT NULL,
  status tam_job_status DEFAULT 'pending',
  config JSONB,
  progress INTEGER DEFAULT 0,
  result_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tam_projects_user_id ON tam_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tam_companies_project_id ON tam_companies(project_id);
CREATE INDEX IF NOT EXISTS idx_tam_companies_qualification ON tam_companies(project_id, qualification_status);
CREATE INDEX IF NOT EXISTS idx_tam_contacts_project_id ON tam_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_tam_contacts_company_id ON tam_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_tam_contacts_email_status ON tam_contacts(project_id, email_status);
CREATE INDEX IF NOT EXISTS idx_tam_contacts_linkedin_active ON tam_contacts(project_id, linkedin_active);
CREATE INDEX IF NOT EXISTS idx_tam_job_queue_project_id ON tam_job_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_tam_job_queue_status ON tam_job_queue(status);

-- RLS
ALTER TABLE tam_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tam_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tam_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tam_job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access tam_projects" ON tam_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access tam_companies" ON tam_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access tam_contacts" ON tam_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access tam_job_queue" ON tam_job_queue FOR ALL USING (true) WITH CHECK (true);

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_tam_projects_updated_at ON tam_projects;
CREATE TRIGGER update_tam_projects_updated_at
  BEFORE UPDATE ON tam_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
