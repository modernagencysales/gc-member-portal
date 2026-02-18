# Proposal Builder — Design Document

**Date**: 2026-02-17
**Status**: Approved

## Overview

A proposal builder that generates beautiful, co-branded sales proposals from call transcripts and Blueprint data. Proposals are hosted web pages (like Blueprints) with PDF download via print CSS. AI generates the first draft; admin edits before publishing.

**First target**: Bobby Deraco (Synapse) — validates the full pipeline with real data.

## Architecture

```
copy-of-gtm-os (frontend)
  ├─ /admin/proposals — list + create/edit UI
  ├─ /proposal/:slug — public proposal page
  └─ components/proposal/* — all proposal components

gtm-system (backend)
  ├─ /api/proposals/* — CRUD + generate endpoint
  ├─ Trigger.dev task: generate-proposal
  └─ Uses existing Attio client for transcript retrieval

Supabase (shared DB)
  └─ proposals table (new)
```

## Data Model

### `proposals` table

```sql
create table proposals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  prospect_id uuid references prospects(id),
  status text not null default 'draft', -- draft | published | archived

  -- Client info (scraped + AI-extracted)
  client_name text not null,
  client_title text,
  client_company text not null,
  client_logo_url text,
  client_brand_color text,
  client_website text,

  -- Proposal content (AI-generated, editable)
  headline text not null,
  executive_summary text not null,
  about_us jsonb not null,       -- { blurb, stats: [{label, value}], socialProof: string[] }
  client_snapshot jsonb not null, -- { company, industry, size, revenue, currentState }
  goals jsonb not null,          -- [{type: 'metric'|'aspirational'|'experimental', title, description, timeline}]
  services jsonb not null,       -- [{name, description, deliverables: string[], timeline}]
  roadmap jsonb not null,        -- [{phase, title, description, duration, milestones: string[]}]
  pricing jsonb not null,        -- { packages: [{name, price, features, recommended}], customItems: [{label, price}], total, paymentTerms }
  next_steps jsonb not null,     -- [{step, title, description}]

  -- Source data
  transcript_text text,
  transcript_source text,        -- 'attio' | 'manual'
  additional_notes text,

  -- Metadata
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

## Public Proposal Page (`/proposal/:slug`)

### Section Flow

| # | Section | Content | Data Source |
|---|---------|---------|-------------|
| 1 | **Header** | MAS logo + Client logo, co-branded | `client_logo_url` |
| 2 | **Hero** | "Prepared for [Name]" + company + date + headline + exec summary | `headline`, `executive_summary` |
| 3 | **Who We Are** | Tim's blurb + 4 stat cards + 2-3 testimonials | `about_us` (static) |
| 4 | **You + Your Goals** | Client snapshot card + 3 goal cards (metric / aspirational / experimental) | `client_snapshot`, `goals` |
| 5 | **Our Proposal** | Service cards with deliverables (expandable accordion) | `services` |
| 6 | **Roadmap** | Vertical timeline with phases and milestones | `roadmap` |
| 7 | **Pricing** | Package cards (highlighted recommended) + custom items + terms | `pricing` |
| 8 | **Next Steps** | Numbered steps + CTA button + [Download PDF] | `next_steps` |
| 9 | **Footer** | Copyright + Privacy + Terms | Static |

### Visual Design

- Same Tailwind/violet theme as Blueprint pages, dark/light mode via `ThemeToggle`
- Client's brand color used as accent for "You + Your Goals" section and goal cards
- Client logo in header alongside MAS logo
- Clean, generous whitespace — cleaner than Blueprint
- Mobile responsive (cards stack on mobile)
- View tracking: increment `view_count` on page load

### Goal Cards

3 cards in a row (stack on mobile):

1. **Metric-driven** (icon: chart) — Quantifiable target with timeline (e.g., "Generate 15+ qualified PE conversations per quarter")
2. **Aspirational** (icon: target) — Where they want to go (e.g., "Build a scalable revenue arm that feeds a future sales team")
3. **Experimental** (icon: flask) — New thing to try (e.g., "Test LinkedIn Thought Leader Ads targeting your PE firm prospect list")

### PDF Support

CSS print styles (`@media print`):
- Force light mode colors
- Hide ThemeToggle, sticky elements, download button
- Add page breaks between sections
- Expand all accordions
- Optimize typography for print
- `[Download PDF]` button calls `window.print()`

Future: Server-side PDF generation for automated emailing.

## Admin UI (`/admin/proposals`)

### List Page

Table with columns: Client, Company, Status (badge), Created, Views, Actions (view/edit/archive).
`[+ New Proposal]` button.

### Creation Wizard

**Step 1: Select Prospect**
- Search by name/company from `prospects` table
- Auto-fills: client name, company, title, logo, links Blueprint data
- Or enter manually if no Blueprint exists

**Step 2: Add Transcript**
- "Pull from Attio" button → fetches notes/recordings for this contact via Attio API
- Or paste transcript text manually
- Additional notes field (extra context for AI)

**Step 3: Configure Services**
- Select from pre-defined packages (checkboxes):
  - Content Creation
  - Content + Outbound
  - Full Funnel
- Add custom line items (label + price)
- Set payment terms

**Step 4: Generate**
- `[Generate Proposal]` → POST to gtm-system API → Trigger.dev task
- Shows loading state while generating (~30s)

**Step 5: Preview + Edit**
- Full rendered preview (same component as public page)
- Click any section to edit inline (contentEditable or modal forms)
- Edit goals, services, roadmap, pricing individually
- `[Regenerate Section]` button per section if needed

**Step 6: Publish**
- `[Publish]` → sets status to `published`
- Generates shareable URL
- Copy link button

## AI Generation

### Trigger.dev Task: `generate-proposal`

**Single-shot Claude call** with structured JSON output.

**Inputs:**
- Blueprint prospect data (scores, analysis, strategic gap, buyer persona, company research, knowledge base)
- Call transcript text
- Selected service packages with base pricing
- Additional admin notes

**AI generates:**
- `headline` — personalized proposal title
- `executive_summary` — 2-3 sentences tying their situation to our solution
- `client_snapshot` — structured company/situation summary
- `goals` — 3 goals in metric/aspirational/experimental format
- `services` — detailed deliverables customized to their needs
- `roadmap` — phased timeline with milestones
- `next_steps` — specific next actions

**AI does NOT generate (controlled by admin/static):**
- `about_us` — static data, same for every proposal
- `pricing` — driven by selected packages
- Testimonials — curated from existing set

### Client Branding Extraction

- **Logo**: Use `company_logo` from prospect record (LinkedIn scrape), or `profile_photo` of the company
- **Brand color**: Extract dominant color from logo (client-side canvas, or during generation)
- **Fallback**: Text-only company name + neutral slate accent if no logo found

## Service Packages Config

Stored in `bootcamp_settings` table, key: `proposal_packages`.

```jsonc
{
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
}
```

Editable via the existing admin settings page.

## Bobby (Synapse) — First Proposal

Based on transcript + Blueprint data:

**Client snapshot**: Synapse, 45-person B2B brand transformation agency, 19 years, self-funded. Targets PE firms + mid-market manufacturers ($50M+). Bobby just exited operations, now full-time biz dev. Tried posting 1x/week with 8 likes from people he knows.

**3 Goals**:
1. **Metric**: "Generate 15+ qualified PE conversations per quarter through LinkedIn" (90-day target)
2. **Aspirational**: "Build a scalable revenue arm that feeds your future sales team" (Bobby's stated vision from the call)
3. **Experimental**: "Test LinkedIn Thought Leader Ads targeting your PE firm prospect list" (new channel, complements content)

**Services**: Start with Content Creation package (crawl phase), with custom add-ons for HeyReach setup and lead magnet creation. Roadmap shows 90-day test → expand to full funnel.

**Roadmap**:
- Phase 1 (Weeks 1-2): Foundation — Interview, content calendar, lead magnet creation, HeyReach setup
- Phase 2 (Weeks 3-8): Execution — Daily posting, connection campaigns, DM automation
- Phase 3 (Weeks 9-12): Optimization — Review results, refine targeting, plan Phase 2 expansion

## CSRF Note

All `/api/proposals/*` routes in gtm-system must be added to the CSRF skip list in `src/middleware.ts` (same pattern as other server-to-server routes).

## Verification

1. `proposals` table created in Supabase with correct schema
2. gtm-system API routes work (CRUD + generate)
3. Trigger.dev task generates proposal from Bobby's real data
4. Admin UI in copy-of-gtm-os allows creating/editing/publishing
5. Public page renders at `/proposal/:slug` with co-branding
6. PDF print CSS produces clean output
7. View tracking increments on page load
8. Dark/light mode works
9. Mobile responsive
10. Existing routes not broken
