# TAM Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a guided TAM list-building tool that interviews users on their ICP, orchestrates data sourcing from multiple providers, and delivers a segmented contact list with emails and LinkedIn activity signals.

**Architecture:** 4-step ICP wizard → AI strategy chat (reuses ChatInterface) → async job queue for scraping/enrichment → list dashboard with filtering, segmentation, and export. Backend is Supabase Edge Functions proxying BlitzAPI, Serper, Storeleads, Bright Data, etc.

**Tech Stack:** React, TypeScript, Tailwind, Supabase (Postgres + Edge Functions + Realtime), Claude API (via existing chat edge function pattern), BlitzAPI (RapidAPI), Serper, Storeleads, Bright Data, React Query, Recharts.

**Design Doc:** `docs/plans/2026-01-31-tam-builder-design.md`

---

## Task 1: Database Migration — TAM Tables

**Files:**
- Create: `supabase/migrations/20260131100000_tam_tables.sql`

**Step 1: Write the migration**

```sql
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
```

**Step 2: Apply migration**

Run: `npx supabase db push` (or apply via Supabase dashboard SQL editor)

**Step 3: Commit**

```bash
git add supabase/migrations/20260131100000_tam_tables.sql
git commit -m "feat(tam): add database tables for TAM builder"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `types/tam-types.ts`

**Step 1: Write types**

```typescript
// === Enums ===

export type TamProjectStatus = 'draft' | 'sourcing' | 'enriching' | 'complete';

export type TamCompanySource = 'serper' | 'storeleads' | 'apollo' | 'blitzapi' | 'smartscout';

export type TamQualificationStatus = 'pending' | 'qualified' | 'disqualified';

export type TamEmailStatus = 'found' | 'verified' | 'catch_all' | 'invalid' | 'not_found';

export type TamContactSource = 'blitzapi' | 'apollo';

export type TamJobType = 'source_companies' | 'qualify' | 'find_contacts' | 'enrich_emails' | 'check_linkedin';

export type TamJobStatus = 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed';

// === ICP Profile (wizard output) ===

export type BusinessModelType =
  | 'b2b_saas'
  | 'ecommerce_dtc'
  | 'amazon_sellers'
  | 'local_service'
  | 'agencies'
  | 'other';

export interface IcpProfile {
  businessModel: BusinessModelType;
  businessModelOther?: string;
  whatYouSell: string;
  employeeSizeRanges: string[]; // e.g. ['1-10', '11-50']
  geography: 'us_only' | 'specific_countries' | 'global';
  specificCountries?: string[];
  usEmployeeFilter: boolean;
  industryKeywords: string[];
  targetTitles: string[];
  seniorityPreference: string[]; // e.g. ['c_suite', 'vp']
  contactsPerCompany: number;
  specialCriteria?: string;
}

export interface SourcingStrategy {
  primarySource: TamCompanySource;
  secondarySources: TamCompanySource[];
  reasoning: string;
  estimatedCompanyCount?: number;
  searchConfig: Record<string, unknown>;
}

// === Domain Objects ===

export interface TamProject {
  id: string;
  userId: string;
  name: string;
  status: TamProjectStatus;
  icpProfile: IcpProfile | null;
  sourcingStrategy: SourcingStrategy | null;
  createdAt: string;
  updatedAt: string;
}

export interface TamCompany {
  id: string;
  projectId: string;
  name: string;
  domain: string | null;
  linkedinUrl: string | null;
  source: TamCompanySource | null;
  industry: string | null;
  employeeCount: number | null;
  location: string | null;
  description: string | null;
  qualificationStatus: TamQualificationStatus;
  qualificationReason: string | null;
  usEmployeePct: number | null;
  segmentTags: Record<string, string> | null;
  rawData: Record<string, unknown> | null;
  createdAt: string;
}

export interface TamContact {
  id: string;
  companyId: string;
  projectId: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  linkedinUrl: string | null;
  email: string | null;
  emailStatus: TamEmailStatus | null;
  phone: string | null;
  linkedinLastPostDate: string | null;
  linkedinActive: boolean | null;
  source: TamContactSource | null;
  rawData: Record<string, unknown> | null;
  createdAt: string;
}

export interface TamJob {
  id: string;
  projectId: string;
  jobType: TamJobType;
  status: TamJobStatus;
  config: Record<string, unknown> | null;
  progress: number;
  resultSummary: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
}

// === Aggregates ===

export interface TamCompanyWithContacts extends TamCompany {
  contacts: TamContact[];
}

export interface TamProjectStats {
  totalCompanies: number;
  qualifiedCompanies: number;
  disqualifiedCompanies: number;
  pendingCompanies: number;
  totalContacts: number;
  emailsVerified: number;
  emailsCatchAll: number;
  emailsNotFound: number;
  linkedinActive: number;
  linkedinInactive: number;
}

// === Input types ===

export interface TamProjectInput {
  name: string;
  icpProfile: IcpProfile;
}
```

**Step 2: Commit**

```bash
git add types/tam-types.ts
git commit -m "feat(tam): add TypeScript types for TAM builder"
```

---

## Task 3: Service Layer

**Files:**
- Create: `services/tam-supabase.ts`

**Step 1: Write service layer**

Follow the exact pattern from `bootcamp-supabase.ts`: mapper functions for snake_case ↔ camelCase, throw on error, return null for optional lookups.

Functions needed:
- `mapTamProject`, `mapTamCompany`, `mapTamContact`, `mapTamJob` — mappers
- `createTamProject(input: TamProjectInput & { userId: string }): Promise<TamProject>`
- `fetchTamProject(projectId: string): Promise<TamProject | null>`
- `fetchTamProjectsByUser(userId: string): Promise<TamProject[]>`
- `updateTamProject(projectId: string, updates: Partial<TamProject>): Promise<TamProject>`
- `fetchTamCompanies(projectId: string, filters?: { qualificationStatus?, source? }): Promise<TamCompany[]>`
- `insertTamCompanies(companies: Partial<TamCompany>[]): Promise<void>` — bulk insert
- `updateTamCompany(companyId: string, updates: Partial<TamCompany>): Promise<TamCompany>`
- `fetchTamContacts(projectId: string, filters?: { emailStatus?, linkedinActive? }): Promise<TamContact[]>`
- `fetchTamContactsByCompany(companyId: string): Promise<TamContact[]>`
- `insertTamContacts(contacts: Partial<TamContact>[]): Promise<void>` — bulk insert
- `fetchTamJobs(projectId: string): Promise<TamJob[]>`
- `createTamJob(job: Pick<TamJob, 'projectId' | 'jobType' | 'config'>): Promise<TamJob>`
- `updateTamJob(jobId: string, updates: Partial<TamJob>): Promise<TamJob>`
- `fetchTamProjectStats(projectId: string): Promise<TamProjectStats>` — aggregation query

**Step 2: Commit**

```bash
git add services/tam-supabase.ts
git commit -m "feat(tam): add Supabase service layer for TAM builder"
```

---

## Task 4: React Query Hooks

**Files:**
- Create: `hooks/useTamProject.ts`
- Modify: `lib/queryClient.ts` — add TAM query keys

**Step 1: Add query keys to `lib/queryClient.ts`**

Add to the existing `queryKeys` object:

```typescript
// TAM Builder
tamProjects: (userId: string) => ['tam', 'projects', userId] as const,
tamProject: (projectId: string) => ['tam', 'project', projectId] as const,
tamCompanies: (projectId: string) => ['tam', 'companies', projectId] as const,
tamContacts: (projectId: string) => ['tam', 'contacts', projectId] as const,
tamContactsByCompany: (companyId: string) => ['tam', 'contacts', 'company', companyId] as const,
tamJobs: (projectId: string) => ['tam', 'jobs', projectId] as const,
tamStats: (projectId: string) => ['tam', 'stats', projectId] as const,
```

**Step 2: Write hooks**

```typescript
// Queries
export function useTamProjects(userId: string | undefined)
export function useTamProject(projectId: string | undefined)
export function useTamCompanies(projectId: string | undefined, filters?)
export function useTamContacts(projectId: string | undefined, filters?)
export function useTamContactsByCompany(companyId: string | undefined)
export function useTamJobs(projectId: string | undefined)
export function useTamStats(projectId: string | undefined)

// Mutations
export function useCreateTamProjectMutation()  // invalidates tamProjects
export function useUpdateTamProjectMutation()  // invalidates tamProject + tamProjects
export function useUpdateTamCompanyMutation()  // invalidates tamCompanies + tamStats
export function useCreateTamJobMutation()      // invalidates tamJobs
export function useUpdateTamJobMutation()      // invalidates tamJobs
```

For `useTamJobs`, add `refetchInterval: 3000` when any job has status `running` — this gives near-realtime progress updates without Supabase Realtime complexity.

**Step 3: Commit**

```bash
git add hooks/useTamProject.ts lib/queryClient.ts
git commit -m "feat(tam): add React Query hooks for TAM builder"
```

---

## Task 5: ICP Wizard Component

**Files:**
- Create: `components/tam/IcpWizard.tsx`

**Step 1: Build the 4-step wizard**

Props:
```typescript
interface IcpWizardProps {
  onComplete: (project: TamProject) => void;
  userId: string;
}
```

State: `currentStep` (1-4), `formData: Partial<IcpProfile>`

**Step 1 UI — Business Model:**
- Radio group for BusinessModelType options with labels:
  - B2B SaaS / Software, E-commerce / DTC, Amazon Sellers, Local / Service Businesses, Agencies, Other
- If "Other" selected, show text input
- Text input: "What do YOU sell them?"
- Next button (disabled until business model + what you sell filled)

**Step 2 UI — Company Filters:**
- Multi-select chips for employee size: 1-10, 11-50, 51-200, 201-1000, 1000+
- Radio group for geography: US Only, Specific Countries, Global
- If "Specific Countries", show text input
- Toggle: "Filter for US-based employees (75%+ in US)"
- Comma-separated text input for industry keywords
- Back/Next buttons

**Step 3 UI — Contact Targeting:**
- Multi-select chips for titles: Founder, CEO, CTO, VP Marketing, VP Sales, Head of Marketing, Head of Sales, Director of Marketing, Director of Sales (plus free text input to add custom)
- Checkbox group for seniority: C-Suite, VP, Director, Manager
- Number input: contacts per company (1-3, default 1)
- Back/Next buttons

**Step 4 UI — Review & Launch:**
- Summary card showing all selections from steps 1-3
- Optional textarea: "Anything else the AI should know?"
- Back / "Start Building" button
- On submit: calls `createTamProject` mutation with IcpProfile, transitions to chat

**Styling:** Follow existing Tailwind patterns — `rounded-2xl`, `border-slate-200 dark:border-slate-800`, `bg-white dark:bg-slate-900`, brand color accents.

**Step 2: Commit**

```bash
git add components/tam/IcpWizard.tsx
git commit -m "feat(tam): add ICP wizard component"
```

---

## Task 6: TAM Builder AI Tool Registration

**Files:**
- Create: `supabase/migrations/20260131100001_tam_ai_tool.sql`

**Step 1: Write seed migration**

```sql
INSERT INTO ai_tools (slug, name, description, system_prompt, model, max_tokens, welcome_message, suggested_prompts, is_active)
VALUES (
  'tam-builder',
  'TAM Builder Assistant',
  'AI assistant that helps build your Total Addressable Market list',
  'You are a TAM building assistant integrated into a GTM platform. The user has completed an ICP wizard and you have their profile data in the context below.

Your job is to:
1. Review their ICP profile and recommend a sourcing strategy
2. Explain which data sources you will use and why
3. Guide them through the scraping and enrichment process step by step
4. Ask for confirmation before each major step (sourcing, qualification, contact finding, LinkedIn check)
5. Report progress and results at each stage
6. Help them understand and refine their list

Source routing rules:
- B2B SaaS / Software → BlitzAPI company search or Apollo (ExportApollo)
- E-commerce / DTC → Storeleads for companies, BlitzAPI for contacts
- Amazon sellers → SmartScout for companies, BlitzAPI for contacts
- Local / service businesses → Serper (Google Maps) for companies, BlitzAPI for contacts
- Agencies → Serper + BlitzAPI
- Open web / niche → Serper scraping (Trustpilot, Crunchbase, etc.), BlitzAPI for contacts

BlitzAPI is always used for finding contacts and email enrichment (unlimited plan).
Bright Data is used for LinkedIn activity checking (most recent post scrape).

When reporting results, always include:
- Total counts
- Sample of 5-10 entries for user review
- Breakdown by relevant categories
- Clear next step with confirmation prompt

Be concise and action-oriented. Do not over-explain unless asked.

ICP PROFILE DATA:
{icp_context}',
  'claude-sonnet-4-20250514',
  2048,
  NULL,
  NULL,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  max_tokens = EXCLUDED.max_tokens;
```

Note: The `{icp_context}` placeholder gets replaced at runtime in the edge function, same pattern as Blueprint context injection.

**Step 2: Apply and commit**

```bash
git add supabase/migrations/20260131100001_tam_ai_tool.sql
git commit -m "feat(tam): register TAM builder AI tool"
```

---

## Task 7: TAM Chat Context Injection

**Files:**
- Modify: `supabase/functions/chat/index.ts`

**Step 1: Add TAM context injection**

In the edge function, after loading the AI tool config and before building the final system prompt, add a block that checks if the tool slug is `tam-builder`. If so, query `tam_projects` for the user's active project and inject the `icp_profile` and `sourcing_strategy` as context — replacing `{icp_context}` in the system prompt.

Also inject current job statuses from `tam_job_queue` so the AI knows where the pipeline stands.

```typescript
// After loading tool config, before Claude API call:
if (toolSlug === 'tam-builder' || tool.slug === 'tam-builder') {
  // Find active TAM project for this student
  const { data: tamProject } = await supabase
    .from('tam_projects')
    .select('*')
    .eq('user_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tamProject) {
    // Get current job statuses
    const { data: jobs } = await supabase
      .from('tam_job_queue')
      .select('*')
      .eq('project_id', tamProject.id)
      .order('created_at', { ascending: true });

    // Get stats
    const { count: totalCompanies } = await supabase
      .from('tam_companies')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', tamProject.id);

    const { count: qualifiedCompanies } = await supabase
      .from('tam_companies')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', tamProject.id)
      .eq('qualification_status', 'qualified');

    const { count: totalContacts } = await supabase
      .from('tam_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', tamProject.id);

    const tamContext = JSON.stringify({
      project: {
        id: tamProject.id,
        name: tamProject.name,
        status: tamProject.status,
        icpProfile: tamProject.icp_profile,
        sourcingStrategy: tamProject.sourcing_strategy,
      },
      jobs: jobs || [],
      stats: { totalCompanies, qualifiedCompanies, totalContacts },
    }, null, 2);

    finalSystemPrompt = finalSystemPrompt.replace('{icp_context}', tamContext);
  } else {
    finalSystemPrompt = finalSystemPrompt.replace('{icp_context}', 'No TAM project found for this user.');
  }
}
```

**Step 2: Commit**

```bash
git add supabase/functions/chat/index.ts
git commit -m "feat(tam): inject TAM project context into chat edge function"
```

---

## Task 8: TAM Job Runner Edge Function

**Files:**
- Create: `supabase/functions/tam-run-job/index.ts`

**Step 1: Write the job runner**

This edge function is called by the frontend when a user approves a step. It receives a `jobId`, loads the job config, and dispatches to the appropriate handler.

Structure:
```typescript
serve(async (req) => {
  // CORS handling (same pattern as chat)
  // Parse { jobId } from body
  // Load job from tam_job_queue
  // Set status to 'running'
  // Dispatch based on job_type:
  //   source_companies → handleSourceCompanies(job, supabase)
  //   qualify → handleQualify(job, supabase)
  //   find_contacts → handleFindContacts(job, supabase)
  //   check_linkedin → handleCheckLinkedin(job, supabase)
  // On success: set status 'completed', set result_summary
  // On error: set status 'failed', set result_summary with error
});
```

Each handler is a separate async function within the same file (edge functions are single-file). They:
1. Read config from `job.config`
2. Call the external API (BlitzAPI via RapidAPI, Serper, etc.)
3. Insert results into `tam_companies` or `tam_contacts`
4. Update `job.progress` periodically
5. Return a result summary

**Step 2: Implement `handleSourceCompanies`**

Based on `config.source`:
- `serper`: Call Serper API with search query built from ICP keywords + industry + geo
- `storeleads`: Call Storeleads API with ecommerce filters
- `blitzapi`: Call BlitzAPI company search via RapidAPI
- `apollo`: Call ExportApollo API

Each inserts rows into `tam_companies` with `source` field set.

**Step 3: Implement `handleQualify`**

For each unqualified company in the project:
- Scrape website via Serper (`site:domain.com`)
- Send to Claude with qualification prompt + ICP criteria
- Update `qualification_status` and `qualification_reason`
- If US employee filter enabled, run second prompt for `us_employee_pct`

Batch in groups of 10, updating `progress` after each batch.

**Step 4: Implement `handleFindContacts`**

For each qualified company:
- Call BlitzAPI people search with target titles from ICP
- Insert results into `tam_contacts` with email and email_status
- BlitzAPI returns email + phone in the same call

**Step 5: Implement `handleCheckLinkedin`**

For each contact with a `linkedin_url`:
- Call Bright Data to scrape most recent LinkedIn post
- Extract post date
- Set `linkedin_last_post_date` and `linkedin_active` (true if within 30 days)

**Step 6: Commit**

```bash
git add supabase/functions/tam-run-job/index.ts
git commit -m "feat(tam): add job runner edge function for TAM pipeline"
```

---

## Task 9: TAM Stats Bar Component

**Files:**
- Create: `components/tam/TamStatsBar.tsx`

**Step 1: Build stats bar**

Props: `stats: TamProjectStats`

Horizontal bar with stat cards:
- Total Companies (with qualified/disqualified/pending breakdown)
- Total Contacts
- Email Coverage (verified % + catch-all % + not found %)
- LinkedIn Active (active % vs inactive %)

Use existing design patterns: `rounded-xl`, slate borders, small uppercase labels. Numbers large and bold. Use green/yellow/red color coding for email status and LinkedIn activity.

**Step 2: Commit**

```bash
git add components/tam/TamStatsBar.tsx
git commit -m "feat(tam): add stats bar component"
```

---

## Task 10: TAM Dashboard Component

**Files:**
- Create: `components/tam/TamDashboard.tsx`

**Step 1: Build the list dashboard**

Props:
```typescript
interface TamDashboardProps {
  projectId: string;
  onOpenChat: () => void;
}
```

**Layout:**
- `TamStatsBar` at top
- Filter bar: qualification status, email status, LinkedIn active/inactive, segment tags, source
- Segment quick-tabs: All | LinkedIn Active | Email Only | Needs Review
- Company table with expandable rows showing contacts
- Bulk action bar (appears when rows selected): Export CSV, Re-enrich emails
- Chat button (floating, bottom-right) to reopen strategy chat

**Company table columns:** Checkbox, Company Name, Industry, Employees, Location, Contacts (count), Status badge

**Expanded contact row:** Name, Title, Email (with status badge), LinkedIn Activity (green/yellow/red dot + date), Phone

**Export:** Build CSV string client-side from filtered data. Use `Blob` + `URL.createObjectURL` for download. Column headers match Smartlead/HeyReach import format: `first_name, last_name, email, company_name, title, linkedin_url`.

**Step 2: Commit**

```bash
git add components/tam/TamDashboard.tsx
git commit -m "feat(tam): add list dashboard component"
```

---

## Task 11: TAM Builder Parent Component

**Files:**
- Create: `components/tam/TamBuilder.tsx`

**Step 1: Build the parent orchestrator**

This manages the three-phase flow: Wizard → Chat → Dashboard.

```typescript
interface TamBuilderProps {
  userId: string;
}
```

State: `phase: 'wizard' | 'chat' | 'dashboard'`, `activeProjectId: string | null`

**Logic:**
- On mount: check if user has an existing TAM project (not complete). If so, resume at appropriate phase based on project status.
- `draft` → wizard or chat (if `icp_profile` exists)
- `sourcing` or `enriching` → chat with dashboard accessible via tab
- `complete` → dashboard
- Wizard `onComplete` → sets projectId, transitions to chat phase
- Tab bar at top when in chat/dashboard phase to switch between "Strategy" and "List" views
- "New Project" button to start fresh

**Step 2: Commit**

```bash
git add components/tam/TamBuilder.tsx
git commit -m "feat(tam): add parent TAM builder component with phase management"
```

---

## Task 12: Route Registration & Sidebar Entry

**Files:**
- Modify: `App.tsx` — add route
- Modify: `components/Sidebar.tsx` (or equivalent bootcamp sidebar) — add nav entry

**Step 1: Add route**

```typescript
const TamBuilder = lazy(() => import('./components/tam/TamBuilder'));

// Inside bootcamp routes:
<Route path="tam-builder" element={<TamBuilder userId={studentId} />} />
```

**Step 2: Add sidebar entry**

Add a "TAM Builder" item with a `Target` icon (from Lucide) to the AI Tools section of the sidebar, linking to `/bootcamp/tam-builder`.

**Step 3: Commit**

```bash
git add App.tsx components/Sidebar.tsx
git commit -m "feat(tam): add route and sidebar entry for TAM builder"
```

---

## Task 13: Integration Testing — Full Flow

**Step 1: Manual walkthrough**

1. Navigate to `/bootcamp/tam-builder`
2. Complete ICP wizard (pick B2B SaaS, 11-50 employees, US only, CEO/Founder titles)
3. Verify `tam_projects` row created in Supabase with correct `icp_profile`
4. Chat opens with AI summary of sourcing strategy
5. Approve sourcing → verify `tam_job_queue` row created
6. Verify companies appear in dashboard after job completes
7. Approve qualification → verify statuses update
8. Approve contact finding → verify contacts with emails appear
9. Approve LinkedIn check → verify activity data populated
10. Test filters and segment views on dashboard
11. Test CSV export — open in spreadsheet, verify columns

**Step 2: Fix any issues found**

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(tam): integration test fixes"
```

---

## Task Order & Dependencies

```
Task 1 (migration) ─────┐
Task 2 (types) ──────────┤
                         ├── Task 3 (service layer) ── Task 4 (hooks) ──┐
Task 6 (AI tool seed) ──┘                                               │
                                                                         ├── Task 11 (parent) ── Task 12 (routes) ── Task 13 (test)
Task 5 (wizard) ─────────────────────────────────────────────────────────┤
Task 7 (chat context) ──────────────────────────────────────────────────┤
Task 8 (job runner) ────────────────────────────────────────────────────┤
Task 9 (stats bar) ──── Task 10 (dashboard) ────────────────────────────┘
```

Tasks 1, 2, 5, 6, 7, 8, 9 can be parallelized. Task 3 depends on 1+2. Task 4 depends on 3. Tasks 10-13 are sequential at the end.
