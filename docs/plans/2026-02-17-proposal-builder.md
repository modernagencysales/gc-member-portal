# Proposal Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a proposal builder that generates beautiful, co-branded sales proposals from call transcripts and Blueprint data — hosted as web pages with PDF download.

**Architecture:** Two-repo feature. gtm-system owns the API (CRUD + AI generation via Trigger.dev). copy-of-gtm-os owns the frontend (admin UI + public proposal page). Supabase `proposals` table is the shared data store. Single-shot Claude call generates proposal content; admin edits before publishing.

**Tech Stack:** React 18, Tailwind CSS, Supabase, Trigger.dev, Claude API (Anthropic SDK), Attio API, Next.js 16 (gtm-system)

**Design doc:** `docs/plans/2026-02-17-proposal-builder-design.md`

---

## Phase 1: Foundation (Database + Types)

### Task 1: Create `proposals` table in Supabase

**Files:**
- Create: SQL migration (run via Supabase dashboard or CLI)

**Step 1: Run the migration**

```sql
create table proposals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  prospect_id uuid references prospects(id),
  status text not null default 'draft',

  client_name text not null,
  client_title text,
  client_company text not null,
  client_logo_url text,
  client_brand_color text,
  client_website text,

  headline text not null,
  executive_summary text not null,
  about_us jsonb not null default '{}'::jsonb,
  client_snapshot jsonb not null default '{}'::jsonb,
  goals jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  roadmap jsonb not null default '[]'::jsonb,
  pricing jsonb not null default '{}'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,

  transcript_text text,
  transcript_source text,
  additional_notes text,

  created_by text,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_proposals_slug on proposals(slug);
create index idx_proposals_prospect_id on proposals(prospect_id);
create index idx_proposals_status on proposals(status);
```

**Step 2: Verify**

Run: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'proposals' ORDER BY ordinal_position;`

Expected: All 24 columns present with correct types.

---

### Task 2: Define proposal types in copy-of-gtm-os

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/types/proposal-types.ts`

**Step 1: Create the types file**

```typescript
// ============================================
// Proposal Types
// ============================================

export type ProposalStatus = 'draft' | 'published' | 'archived';

export interface ProposalGoal {
  type: 'metric' | 'aspirational' | 'experimental';
  title: string;
  description: string;
  timeline: string;
}

export interface ProposalService {
  name: string;
  description: string;
  deliverables: string[];
  timeline: string;
}

export interface ProposalRoadmapPhase {
  phase: number;
  title: string;
  description: string;
  duration: string;
  milestones: string[];
}

export interface ProposalPackage {
  name: string;
  price: string;
  features: string[];
  recommended: boolean;
}

export interface ProposalCustomItem {
  label: string;
  price: string;
}

export interface ProposalPricing {
  packages: ProposalPackage[];
  customItems: ProposalCustomItem[];
  total: string;
  paymentTerms: string;
}

export interface ProposalNextStep {
  step: number;
  title: string;
  description: string;
}

export interface ProposalAboutUs {
  blurb: string;
  stats: { label: string; value: string }[];
  socialProof: string[];
}

export interface ProposalClientSnapshot {
  company: string;
  industry: string;
  size: string;
  revenue: string;
  currentState: string;
}

export interface Proposal {
  id: string;
  slug: string;
  prospectId: string | null;
  status: ProposalStatus;

  clientName: string;
  clientTitle: string | null;
  clientCompany: string;
  clientLogoUrl: string | null;
  clientBrandColor: string | null;
  clientWebsite: string | null;

  headline: string;
  executiveSummary: string;
  aboutUs: ProposalAboutUs;
  clientSnapshot: ProposalClientSnapshot;
  goals: ProposalGoal[];
  services: ProposalService[];
  roadmap: ProposalRoadmapPhase[];
  pricing: ProposalPricing;
  nextSteps: ProposalNextStep[];

  transcriptText: string | null;
  transcriptSource: string | null;
  additionalNotes: string | null;

  createdBy: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Config stored in bootcamp_settings key 'proposal_packages'
export interface ProposalPackageConfig {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  deliverables: string[];
}
```

**Step 2: Verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add types/proposal-types.ts
git commit -m "feat(proposals): add proposal TypeScript types"
```

---

## Phase 2: Backend (gtm-system)

### Task 3: Add CSRF skip + CORS for `/api/proposals`

**Files:**
- Modify: `/Users/timlife/Documents/claude code/gtm-system/src/middleware.ts`

**Step 1: Add CSRF skip**

In the `validateCsrf()` function, add after the `/api/intro-offers` line:

```typescript
if (request.nextUrl.pathname.startsWith('/api/proposals')) return true;
```

**Step 2: Add CORS handling**

In the middleware function, add a CORS block for `/api/proposals` matching the pattern used for `/api/intro-offers` routes. The route should accept cross-origin requests from `CORS_ALLOWED_ORIGINS` with Bearer JWT auth.

**Step 3: Verify**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(proposals): add CSRF skip + CORS for /api/proposals"
```

---

### Task 4: Create proposals CRUD API routes

**Files:**
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/proposals/route.ts` (list + create)
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/proposals/[id]/route.ts` (get + update + delete)
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/proposals/by-slug/[slug]/route.ts` (public get by slug + view tracking)

**Step 1: Create the list + create route**

`/api/proposals/route.ts`:
- `GET` — List all proposals, ordered by `created_at` desc. Supports `?status=draft` filter.
- `POST` — Create a new proposal. Accepts full proposal payload. Generates slug from `client_name` + `client_company` (same pattern as prospect slug generation: `firstname-company-xxxx`). Returns the created proposal.

Auth: Bearer JWT from Supabase (same pattern as `/api/intro-offers`).

**Step 2: Create the get/update/delete route**

`/api/proposals/[id]/route.ts`:
- `GET` — Get proposal by ID.
- `PATCH` — Update proposal fields. Accepts partial payload.
- `DELETE` — Soft delete (set status to `archived`).

Auth: Bearer JWT.

**Step 3: Create the public slug route**

`/api/proposals/by-slug/[slug]/route.ts`:
- `GET` — Get proposal by slug. No auth required (public). Increments `view_count` and sets `last_viewed_at`. Only returns published proposals (status = 'published').

**Step 4: Verify**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/app/api/proposals/
git commit -m "feat(proposals): add CRUD API routes"
```

---

### Task 5: Create `generate-proposal` Trigger.dev task

**Files:**
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/trigger/generate-proposal.ts`

**Step 1: Define the task**

The task receives:
```typescript
interface GenerateProposalPayload {
  proposal_id: string;        // ID of the draft proposal to populate
  prospect_id?: string;       // Optional: link to Blueprint prospect
  transcript_text: string;    // Call transcript
  selected_packages: string[]; // Package IDs from config
  additional_notes?: string;  // Extra context
}
```

**Step 2: Implement the task logic**

1. Fetch prospect data from Supabase if `prospect_id` provided (authority scores, analysis, company research, buyer persona, strategic gap)
2. Fetch package config from `bootcamp_settings` key `proposal_packages`
3. Build Claude prompt with:
   - System prompt: "You are a proposal writer for Modern Agency Sales..."
   - Transcript text
   - Prospect Blueprint data (if available)
   - Selected packages with base pricing
   - Additional notes
   - Output schema: JSON matching the proposal content fields
4. Call Claude (Anthropic SDK) with structured output — response must match `{ headline, executive_summary, client_snapshot, goals, services, roadmap, next_steps }`
5. Extract client logo from prospect record (`company_logo` field) if available
6. Update the proposal record in Supabase with generated content
7. Set `about_us` to static Tim data (hardcoded in the task — same stats used everywhere)

**Step 3: Key implementation details**

- Use `@anthropic-ai/sdk` (already in gtm-system deps)
- Model: `claude-sonnet-4-20250514` (fast + good enough for structured output)
- Max tokens: 4096 (proposals are ~2-3K tokens of JSON)
- Temperature: 0.7 (creative but focused)
- The prompt must explicitly require 3 goals in the metric/aspirational/experimental format
- Parse Claude's response as JSON, validate against expected shape
- On error, set proposal status to 'draft' with an error note in `additional_notes`

**Step 4: Verify**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/trigger/generate-proposal.ts
git commit -m "feat(proposals): add generate-proposal Trigger.dev task"
```

---

### Task 6: Create generate API endpoint

**Files:**
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/proposals/generate/route.ts`

**Step 1: Create the endpoint**

`POST /api/proposals/generate`:
1. Receives: `{ prospect_id?, transcript_text, selected_packages, additional_notes?, client_name, client_company, client_title? }`
2. Creates a draft proposal in Supabase with client info
3. Triggers the `generate-proposal` Trigger.dev task with the proposal ID
4. Returns `{ proposal_id, status: 'generating' }`

Auth: Bearer JWT.

**Step 2: Add Attio transcript fetch sub-endpoint**

Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/proposals/transcript/route.ts`

`POST /api/proposals/transcript`:
1. Receives: `{ email?, linkedin_url? }` — at least one required
2. Finds person in Attio by email or LinkedIn URL
3. Calls `client.listNotes(personId)` to get all notes
4. Returns `{ notes: [{ title, content, created_at }] }`

This allows the admin UI to pull transcript/notes from Attio before generating.

**Step 3: Verify**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/api/proposals/generate/ src/app/api/proposals/transcript/
git commit -m "feat(proposals): add generate + transcript fetch endpoints"
```

---

### Task 7: Seed proposal packages config

**Files:**
- None (Supabase data insert)

**Step 1: Insert package config**

```sql
INSERT INTO bootcamp_settings (key, value) VALUES (
  'proposal_packages',
  '{
    "packages": [
      {
        "id": "content",
        "name": "Content Creation",
        "description": "LinkedIn content strategy + weekly posts",
        "basePrice": "$3,000/mo",
        "deliverables": [
          "4 LinkedIn posts per week",
          "Content calendar",
          "Lead magnet creation (1/quarter)",
          "Monthly performance review"
        ]
      },
      {
        "id": "content-outbound",
        "name": "Content + Outbound",
        "description": "Content creation plus automated outreach",
        "basePrice": "$5,000/mo",
        "deliverables": [
          "Everything in Content Creation",
          "Connection request campaigns (HeyReach)",
          "DM automation setup",
          "CRM integration"
        ]
      },
      {
        "id": "full-funnel",
        "name": "Full Funnel",
        "description": "Complete LinkedIn revenue system",
        "basePrice": "$8,000/mo",
        "deliverables": [
          "Everything in Content + Outbound",
          "Cold email campaigns",
          "LinkedIn Thought Leader Ads",
          "Lead magnet funnel (MagnetLab)",
          "Weekly strategy calls"
        ]
      }
    ]
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

**Step 2: Verify**

Run: `SELECT value FROM bootcamp_settings WHERE key = 'proposal_packages';`
Expected: Returns the 3-package JSON object.

---

### Task 8: Deploy gtm-system backend

**Step 1: Push to remote**

```bash
cd "/Users/timlife/Documents/claude code/gtm-system"
git push origin main
```

Railway auto-deploys from main.

**Step 2: Deploy Trigger.dev**

```bash
cd "/Users/timlife/Documents/claude code/gtm-system"
TRIGGER_SECRET_KEY=tr_prod_Fxgn6CdrH6v2NSMVhSJL npx trigger.dev@4.3.3 deploy
```

**Step 3: Verify**

Test the API with curl:
```bash
curl -X GET https://gtmconductor.com/api/proposals -H "Authorization: Bearer <jwt>"
```
Expected: `[]` (empty array, no proposals yet).

---

## Phase 3: Frontend Service Layer (copy-of-gtm-os)

### Task 9: Create proposal service layer

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/services/proposal-supabase.ts`

**Step 1: Create the service file**

Follow the pattern from `blueprint-supabase.ts`:
- Define `PROPOSAL_COLUMNS` constant (explicit column list, never `select('*')`)
- Create `mapProposal()` function (snake_case DB → camelCase TypeScript)
- Implement functions:
  - `getProposalBySlug(slug: string): Promise<Proposal | null>` — fetches from Supabase directly (published only), increments view count
  - `listProposals(): Promise<Proposal[]>` — all proposals for admin, ordered by created_at desc
  - `getProposalById(id: string): Promise<Proposal | null>` — single proposal by ID
  - `updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal>` — partial update
  - `deleteProposal(id: string): Promise<void>` — set status to archived

**Step 2: Create proposal GTM system service**

Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/services/proposal-gtm.ts`

Functions that call gtm-system API:
- `generateProposal(input: GenerateProposalInput): Promise<{ proposal_id: string }>` — POST to `/api/proposals/generate`
- `fetchAttioTranscript(email?: string, linkedinUrl?: string): Promise<{ notes: AttioNote[] }>` — POST to `/api/proposals/transcript`
- `fetchProposalPackages(): Promise<ProposalPackageConfig[]>` — GET from `bootcamp_settings` via Supabase

Use `GTM_SYSTEM_URL` from `lib/api-config.ts`.

**Step 3: Add query keys**

In `/Users/timlife/Documents/claude code/copy-of-gtm-os/lib/queryClient.ts`, add:

```typescript
// Proposals
proposalBySlug: (slug: string) => ['proposal', slug] as const,
proposalById: (id: string) => ['proposal', 'detail', id] as const,
proposalsList: () => ['proposals', 'list'] as const,
proposalPackages: () => ['proposals', 'packages'] as const,
```

**Step 4: Verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit`
Expected: No type errors.

**Step 5: Commit**

```bash
git add services/proposal-supabase.ts services/proposal-gtm.ts lib/queryClient.ts
git commit -m "feat(proposals): add proposal service layer + query keys"
```

---

## Phase 4: Public Proposal Page

### Task 10: Create ProposalPage component

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/proposal/ProposalPage.tsx`

**Step 1: Create the page component**

Structure: Single file with inline sub-components (same pattern as GenericOfferPage).

Sections (rendered top to bottom):
1. **Header Bar** — MAS logo (left), "Proposal" text (center), Client logo (right). Uses client's `client_brand_color` for a subtle accent line.
2. **Hero** — "Prepared for {clientName}" + company + date + headline + executive summary. Clean, centered, generous whitespace.
3. **Who We Are** — `about_us.blurb` + 4 stat cards (same grid as Blueprint/DFY) + `about_us.socialProof` as testimonial quotes.
4. **You + Your Goals** — `client_snapshot` card (with client brand color accent) + 3 goal cards in a row. Each card has an icon (BarChart3 for metric, Target for aspirational, FlaskConical for experimental), title, description, timeline badge.
5. **Our Proposal** — `services` array rendered as cards with deliverable bullet lists. Expandable accordion per service.
6. **Roadmap** — `roadmap` phases as vertical timeline (left border line with numbered dots, like the Blueprint curriculum section but without accordion).
7. **Pricing** — `pricing.packages` as cards (recommended one gets violet border-2). Custom items listed below. Total + payment terms.
8. **Next Steps** — `next_steps` as numbered cards (like DFY "How It Works"). Final CTA button linking to Cal.com booking. `[Download PDF]` secondary button.
9. **Footer** — Copyright + Privacy + Terms links.

**Step 2: Key implementation details**

- Use `ThemeToggle` from `components/blueprint/ThemeToggle`
- Fetch proposal via `getProposalBySlug(slug)` from `services/proposal-supabase.ts`
- View count increment happens in the service function (already implemented in Task 9)
- If proposal not found or status !== 'published', show 404 page
- Client brand color: apply as CSS custom property `--client-accent` and use in goal cards + snapshot card via inline styles
- Cal.com CTA: use `VITE_CALCOM_BOOKING_URL` env var (same as Blueprint)
- All text content comes from the proposal record — no hardcoded copy except footer

**Step 3: Verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit`
Expected: No type errors.

**Step 4: Commit**

```bash
git add components/proposal/
git commit -m "feat(proposals): add public ProposalPage component"
```

---

### Task 11: Add print CSS for PDF download

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/proposal/ProposalPage.tsx`

**Step 1: Add print styles**

Add a `<style>` tag in the component (or a Tailwind `@media print` block) that:
- Forces light mode colors (override dark mode)
- Hides ThemeToggle, download button, CTA buttons
- Adds `page-break-before: always` for sections: Pricing, Next Steps
- Adds `page-break-inside: avoid` for cards, goal cards, roadmap phases
- Expands all accordions (if any are collapsed)
- Sets max-width to 100% for full-page print
- Removes background gradients, simplifies to solid colors

**Step 2: Add download button**

In the Next Steps section, add a secondary button:
```tsx
<button
  onClick={() => window.print()}
  className="px-6 py-3 rounded-lg font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors print:hidden"
>
  Download PDF
</button>
```

**Step 3: Verify**

Open the proposal page in browser, click "Download PDF", verify the print preview looks clean.

**Step 4: Commit**

```bash
git add components/proposal/ProposalPage.tsx
git commit -m "feat(proposals): add print CSS for PDF download"
```

---

### Task 12: Add `/proposal/:slug` route

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/App.tsx`

**Step 1: Add lazy import**

After the DFYOfferPage import:
```typescript
const ProposalPage = lazy(() => import('./components/proposal/ProposalPage'));
```

**Step 2: Add route**

Before the legal routes section:
```tsx
{/* Proposals */}
<Route path="/proposal/:slug" element={<ProposalPage />} />
```

**Step 3: Verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npm run build`
Expected: Build succeeds, `ProposalPage` chunk appears in output.

**Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat(proposals): add /proposal/:slug route"
```

---

## Phase 5: Admin UI

### Task 13: Create admin proposals list page

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/admin/proposals/AdminProposalsPage.tsx`

**Step 1: Create the list page**

Follow the pattern from `AdminBlueprintsPage.tsx`:
- React Query to fetch `listProposals()`
- Table with columns: Client, Company, Status (badge: draft=yellow, published=green, archived=gray), Created (relative date), Views, Actions
- Status badge component inline
- `[+ New Proposal]` button links to `/admin/proposals/new`
- Row click links to `/admin/proposals/:id`
- Search filter (client name / company)
- Status filter dropdown

**Step 2: Verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add components/admin/proposals/
git commit -m "feat(proposals): add admin proposals list page"
```

---

### Task 14: Create admin proposal creation page

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/admin/proposals/AdminProposalNew.tsx`

**Step 1: Create the wizard**

Multi-step form:

**Step 1 UI: Select Prospect**
- Search input that queries `listProspects()` from `blueprint-supabase.ts`
- Autocomplete dropdown showing prospect name + company
- On select: auto-fill client_name, client_company, client_title, client_logo_url from prospect record
- "Or enter manually" toggle: shows manual text inputs for client_name, client_company, client_title

**Step 2 UI: Add Transcript**
- "Pull from Attio" button → calls `fetchAttioTranscript(prospect.email, prospect.linkedinUrl)` → populates textarea with concatenated notes
- Large textarea for transcript text (manual paste or Attio-populated)
- Smaller textarea for additional notes/context

**Step 3 UI: Configure Services**
- Fetch package configs from `fetchProposalPackages()`
- Render as checkboxes with package name, description, base price
- "Add custom item" button → dynamic rows with label + price inputs
- Payment terms text input (default: "Net 30")

**Step 4 UI: Generate**
- `[Generate Proposal]` button → calls `generateProposal(input)` → shows loading spinner
- Polls proposal status every 3 seconds until status changes from 'generating'
- On complete: redirect to `/admin/proposals/:id` (the edit/preview page)

**Step 2: Verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add components/admin/proposals/AdminProposalNew.tsx
git commit -m "feat(proposals): add admin proposal creation wizard"
```

---

### Task 15: Create admin proposal edit/preview page

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/admin/proposals/AdminProposalEdit.tsx`

**Step 1: Create the edit page**

Layout: Split view or tabbed view.

**Preview Tab**: Renders the full `ProposalPage` component (import from `components/proposal/ProposalPage`) in an iframe or directly, showing exactly what the public page will look like.

**Edit Tab**: Form with editable fields for each section:
- Headline (text input)
- Executive Summary (textarea)
- Client Snapshot (structured form: company, industry, size, revenue, currentState)
- Goals (3 editable goal cards: type dropdown, title, description, timeline)
- Services (dynamic list: name, description, deliverables array, timeline)
- Roadmap (dynamic list: phase number, title, description, duration, milestones array)
- Pricing (package list + custom items + total + payment terms)
- Next Steps (dynamic list: step number, title, description)

**Action buttons:**
- `[Save Draft]` — PATCH update, stay on page
- `[Preview]` — Opens public URL in new tab (even for drafts, for admin preview)
- `[Publish]` — Sets status to 'published', shows the shareable URL with copy button
- `[Archive]` — Sets status to 'archived' with confirmation

**Step 2: Verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add components/admin/proposals/AdminProposalEdit.tsx
git commit -m "feat(proposals): add admin proposal edit/preview page"
```

---

### Task 16: Wire up admin routes and sidebar

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/App.tsx`
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/admin/UnifiedAdminSidebar.tsx`
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/admin/UnifiedAdminLayout.tsx`

**Step 1: Add lazy imports to App.tsx**

```typescript
const AdminProposalsPage = lazy(() => import('./components/admin/proposals/AdminProposalsPage'));
const AdminProposalNew = lazy(() => import('./components/admin/proposals/AdminProposalNew'));
const AdminProposalEdit = lazy(() => import('./components/admin/proposals/AdminProposalEdit'));
```

**Step 2: Add admin routes inside `<Route path="/admin">` block**

After the intro-offers routes:
```tsx
{/* Proposals */}
<Route path="proposals" element={<AdminProposalsPage />} />
<Route path="proposals/new" element={<AdminProposalNew />} />
<Route path="proposals/:proposalId" element={<AdminProposalEdit />} />
```

**Step 3: Add sidebar nav item**

In `UnifiedAdminSidebar.tsx`, add a new section after "Intro Offers":
```typescript
{
  label: 'Sales',
  items: [
    { to: '/admin/proposals', icon: FileText, label: 'Proposals' },
  ],
},
```

**Step 4: Add route title**

In `UnifiedAdminLayout.tsx`, add to `routeTitles`:
```typescript
'/admin/proposals': 'Proposals',
'/admin/proposals/new': 'New Proposal',
```

**Step 5: Verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npm run build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add App.tsx components/admin/UnifiedAdminSidebar.tsx components/admin/UnifiedAdminLayout.tsx
git commit -m "feat(proposals): wire up admin routes + sidebar navigation"
```

---

## Phase 6: Integration & First Proposal

### Task 17: Generate Bobby's proposal

**Step 1: Find Bobby's prospect ID**

```sql
SELECT id, full_name, company, slug, email, status
FROM prospects
WHERE slug = 'robertderaco-vz58';
```

**Step 2: Create Bobby's proposal via the admin UI**

1. Navigate to `/admin/proposals/new`
2. Search for "Robert Deraco" or "Synapse" in Step 1
3. In Step 2, paste the call transcript (from the user's message in this conversation)
4. In Step 3, select "Content Creation" package (Bobby's crawl phase)
5. Add custom items if needed (HeyReach setup, lead magnet creation)
6. Click "Generate Proposal"
7. Review and edit the generated content
8. Publish

**Step 3: Verify the public page**

Visit: `https://modernagencysales.com/proposal/{bobby-slug}`
- Page renders with co-branding (MAS + Synapse logos)
- 3 goal cards show metric/aspirational/experimental
- Pricing shows Content Creation package
- PDF download works
- Dark/light mode works
- Mobile responsive

---

### Task 18: Deploy frontend

**Step 1: Push and deploy**

```bash
cd "/Users/timlife/Documents/claude code/copy-of-gtm-os"
git push origin main
vercel --prod
```

**Step 2: Verify**

- `/admin/proposals` shows empty list
- `/admin/proposals/new` wizard works
- `/proposal/:slug` renders for published proposals
- Existing routes (`/blueprint/:slug`, `/offer/dfy`, `/offer/:offerType`) still work

---

## Verification Checklist

1. [ ] `proposals` table exists in Supabase with correct schema
2. [ ] gtm-system API routes respond (list, create, get, update, archive, generate, transcript)
3. [ ] CSRF skip works for `/api/proposals` routes
4. [ ] CORS headers present for cross-origin calls from copy-of-gtm-os
5. [ ] Trigger.dev `generate-proposal` task deploys and runs
6. [ ] AI generates coherent proposal with 3 correctly-typed goals
7. [ ] Admin list page shows proposals with status badges
8. [ ] Admin creation wizard works end-to-end (select prospect → paste transcript → select packages → generate)
9. [ ] Admin edit page allows editing all fields
10. [ ] Public proposal page renders at `/proposal/:slug`
11. [ ] Client logo + brand color applied correctly
12. [ ] PDF download produces clean output
13. [ ] Dark/light mode works on proposal page
14. [ ] Mobile responsive
15. [ ] View count increments on page load
16. [ ] Bobby's proposal generated and looks good
17. [ ] No regression on existing routes
