# TAM Builder — Design Document

## Overview

A guided TAM (Total Addressable Market) list-building tool embedded in GTM OS. Users describe their ideal customer through a structured wizard, then an AI recommends and orchestrates data sourcing, company qualification, contact finding, email enrichment, and LinkedIn activity checking — with user confirmations at key gates.

The end result is a segmented list of individual contacts with verified emails and LinkedIn activity signals, stored in Supabase with full export capability.

## Goals

- Replace Clay for users who find it overwhelming
- Guide users from "I don't know where to start" to a complete, enriched contact list
- Automatically route to the right data sources based on ICP type
- Segment contacts for multi-channel outreach (LinkedIn active vs. email-only)
- Architect for platform-key usage now, BYO keys later (self-serve)

## Architecture

Three-phase UI within a single route:

1. **ICP Wizard** — Structured 4-step form capturing business model, filters, contact targeting, and special criteria
2. **Strategy Chat** — AI-powered chat (existing ChatInterface) that recommends sourcing strategy, orchestrates jobs, and reports progress with approval gates
3. **List Dashboard** — Table view of companies and contacts with filtering, segmentation, and export

### Enrichment Pipeline

```
Source Companies → Qualify Companies → Find Contacts + Emails → Check LinkedIn Activity → Segment & Export
```

Each step is a job in `tam_job_queue`, triggered by the chat AI after user confirmation.

### Data Source Routing

| Target Customer Type | Company Source | Contact Source |
|----------------------|---------------|----------------|
| B2B SaaS / Software | BlitzAPI / Apollo (ExportApollo) | BlitzAPI |
| E-commerce / DTC | Storeleads | BlitzAPI |
| Amazon sellers | SmartScout | BlitzAPI |
| Local / service businesses | Serper (Google Maps) | BlitzAPI |
| Agencies | Serper + BlitzAPI | BlitzAPI |
| Niche directories | Serper (Trustpilot, Crunchbase, etc.) | BlitzAPI |

BlitzAPI is the universal contact + email layer regardless of company source.

### LinkedIn Activity Check

- Bright Data scrapes the contact's most recent LinkedIn post
- Extracts post date, calculates recency
- Segments contacts (not filters — everyone stays in the list):
  - **LinkedIn Active + Email verified** → Multi-channel outreach
  - **LinkedIn Inactive + Email verified** → Email-only outreach
  - **LinkedIn Active + No email** → LinkedIn-only outreach
  - **No email + Inactive** → Flagged for manual review

## Data Model

### `tam_projects`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | text | Owner |
| name | text | User-given project name |
| status | enum | draft, sourcing, enriching, complete |
| icp_profile | jsonb | Wizard answers: industry, business model, geo, size, titles, special criteria |
| sourcing_strategy | jsonb | AI-recommended sources and config |
| created_at | timestamp | |
| updated_at | timestamp | |

### `tam_companies`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| project_id | uuid | FK to tam_projects |
| name | text | Company name |
| domain | text | Website domain |
| linkedin_url | text | Company LinkedIn URL |
| source | enum | serper, storeleads, apollo, blitzapi, smartscout |
| industry | text | |
| employee_count | int | |
| location | text | |
| description | text | |
| qualification_status | enum | pending, qualified, disqualified |
| qualification_reason | text | AI explanation |
| us_employee_pct | float | Nullable, for geo filtering |
| segment_tags | jsonb | Niche, size bucket, tech, operating model |
| raw_data | jsonb | Full response from source |

### `tam_contacts`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| company_id | uuid | FK to tam_companies |
| project_id | uuid | FK to tam_projects |
| first_name | text | |
| last_name | text | |
| title | text | Job title |
| linkedin_url | text | |
| email | text | |
| email_status | enum | found, verified, catch_all, invalid |
| phone | text | Nullable |
| linkedin_last_post_date | timestamp | Nullable |
| linkedin_active | boolean | Derived from post date |
| source | enum | blitzapi, prospeo, etc. |
| raw_data | jsonb | Full response from source |

### `tam_job_queue`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| project_id | uuid | FK to tam_projects |
| job_type | enum | source_companies, qualify, find_contacts, enrich_emails, check_linkedin |
| status | enum | pending, running, awaiting_approval, completed, failed |
| config | jsonb | Source-specific params |
| progress | int | Percentage 0-100 |
| result_summary | jsonb | Counts, errors |
| created_at | timestamp | |
| completed_at | timestamp | |

## ICP Wizard (4 Steps)

### Step 1: Business Model

- "What do your target customers sell?" — Radio select:
  - B2B SaaS / Software
  - E-commerce / DTC brands
  - Amazon sellers
  - Local / service businesses
  - Agencies
  - Other (free text)
- "What do YOU sell them?" — Short text field

Determines primary data source routing.

### Step 2: Company Filters

- Employee count range (preset buckets: 1-10, 11-50, 51-200, 201-1000, 1000+ — multi-select)
- Geography (US only, specific countries, global) with US employee % filter toggle
- Industry keywords (comma-separated, AI-suggested defaults based on Step 1)

### Step 3: Contact Targeting

- Target titles/roles (multi-select chips + free text: Founder, CEO, VP Marketing, Head of Sales, etc.)
- Seniority preference (C-suite, VP, Director, Manager — maps to BlitzAPI waterfall ICP)
- Number of contacts per company (1-3, default 1)

### Step 4: Review & Special Criteria

- Summary card of all selections
- Optional free-text: "Anything else the AI should know?" (e.g., "must use Shopify", "avoid companies using Gong", "only funded startups")
- "Start Building" button → saves tam_project, transitions to Strategy Chat

## Strategy Chat

Reuses existing `ChatInterface` component. New `ai_tools` record with slug `tam-builder` and a system prompt that receives the `icp_profile` as context (same injection pattern as Blueprint).

### AI Behavior

First message summarizes the recommended plan based on ICP wizard data, including:
- Which sources to use and why
- Estimated company volume
- Contact targeting approach
- Asks for confirmation to begin

### Approval Gates

The AI pauses and asks for user confirmation at each transition:

1. **After company sourcing** → Shows sample of 10, reports total count, asks to proceed with qualification
2. **After qualification** → Reports qualified/disqualified counts with top reasons, asks to proceed with contact finding
3. **After contact finding** → Reports contact count, email coverage breakdown (verified, catch-all, not found), asks to run LinkedIn check
4. **After LinkedIn check** → Reports active/inactive split, announces list is ready, links to dashboard

### Job Triggering

Chat AI inserts rows into `tam_job_queue`. Frontend polls (or uses Supabase Realtime) for status updates. Chat reflects progress as jobs run.

## List Dashboard

### Layout

- Stats bar at top: total companies, total contacts, email coverage %, LinkedIn active %, segment breakdown
- Company-level table with expandable rows showing contacts
- Collapsible chat panel on right for natural-language queries

### Table Columns (Company Level)

Company name, industry, employee count, location, # contacts found, qualification status

### Expanded Contact Row

Name, title, email, email status, LinkedIn activity (active/inactive + last post date)

### Filtering

- Qualification status
- Email status (verified, catch-all, invalid, not found)
- LinkedIn active / inactive
- Segment tags
- Source

### Segment Views

Toggle between: All, LinkedIn Active, Email Only, Needs Review

### Bulk Actions

- Export selection as CSV (columns mapped for Smartlead/HeyReach import)
- Re-enrich failed emails
- Manually disqualify/qualify companies

### Export

CSV download with all fields or filtered subset. Column naming matches common outreach tool import formats.

## Backend (Supabase Edge Functions)

### `tam-source-companies`

Orchestrates calls to the appropriate provider based on `sourcing_strategy`:
- Serper: Google search, Google Maps, Trustpilot, Crunchbase scraping
- Storeleads: E-commerce brand data
- SmartScout: Amazon seller data
- ExportApollo: Apollo list export
- BlitzAPI: B2B company search

Inserts results into `tam_companies`. Updates job progress.

### `tam-qualify`

For each unqualified company:
- Scrapes website via Serper (cost ~$0.001)
- Sends to Claude with qualification prompt + ICP criteria
- Sets qualification_status and qualification_reason
- Optionally calculates us_employee_pct via second prompt

Runs in batches. Updates job progress.

### `tam-find-contacts`

For each qualified company:
- Calls BlitzAPI people search with target titles and seniority from ICP
- Retrieves email + phone enrichment in same flow
- Inserts into tam_contacts with email_status

### `tam-check-linkedin`

For each contact with a linkedin_url:
- Calls Bright Data to scrape most recent post
- Extracts post date
- Sets linkedin_last_post_date and linkedin_active (true if posted within 30 days)

### `tam-job-runner`

Polls tam_job_queue for pending jobs. Dispatches to the correct function. Updates status and progress. Handles failures and retries.

## API Key Strategy

### V1 (Now)

All API keys stored as environment variables in Supabase Edge Functions. Platform pays for everything. Cost absorbed into bootcamp subscription.

### V2 (Self-Serve, Future)

Add `api_keys` table with encrypted storage (Supabase Vault). Edge Functions check for user BYO key first, fall back to platform key if user's plan allows it. Settings page for users to manage their own keys.

The Edge Function abstraction pulls keys from env vars, making the swap to table-based lookup a minimal change.

## Route & Integration

- Route: `/bootcamp/tam-builder` (extend to `/portal/tam-builder` for GC members)
- New AI tool record in `ai_tools` table: slug `tam-builder`
- Sidebar entry in bootcamp LMS under AI Tools section
- Follows existing auth and access control patterns

## New Files

### Frontend

- `components/tam/TamBuilder.tsx` — Parent component, wizard → chat → dashboard flow
- `components/tam/IcpWizard.tsx` — 4-step structured form
- `components/tam/TamDashboard.tsx` — Company/contact table with filters, segments, export
- `components/tam/TamStatsBar.tsx` — Summary metrics bar
- `services/tam-supabase.ts` — Service layer for TAM tables
- `hooks/useTamProject.ts` — React Query hooks for projects, companies, contacts, jobs

### Backend

- `supabase/functions/tam-source-companies/index.ts`
- `supabase/functions/tam-qualify/index.ts`
- `supabase/functions/tam-find-contacts/index.ts`
- `supabase/functions/tam-check-linkedin/index.ts`
- `supabase/functions/tam-job-runner/index.ts`

### Database

- Migration: `tam_projects`, `tam_companies`, `tam_contacts`, `tam_job_queue` tables
- Seed: new `ai_tools` record for `tam-builder`
