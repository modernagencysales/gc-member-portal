# CLAUDE.md

> This repo: `/Users/timlife/Documents/claude code/copy-of-gtm-os`

## Identity

Multi-purpose SaaS frontend (React SPA) hosting public LinkedIn Authority Blueprint pages, Growth Collective member portal, Bootcamp LMS, DFY client portal, and admin dashboard — backed by Supabase and companion backend services.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite 5.2
- **Routing**: React Router v6 (lazy-loaded)
- **Styling**: Tailwind CSS
- **State**: React Context (Auth, Theme, Notifications) + TanStack Query
- **Database**: Supabase (all data access via service layer)
- **AI**: Claude (via Supabase edge functions) + Google Gemini
- **Payments**: Stripe
- **Error Tracking**: Sentry (via `@sentry/react`, wired through `logError`/`logWarn`)
- **Testing**: Vitest + Playwright + React Testing Library + MSW
- **Deploy**: Vercel

## Architecture

### Directory Structure

```
├── components/
│   ├── admin/             - Admin dashboards (dfy, lms, blueprints, proposals, affiliates)
│   ├── affiliate/         - Affiliate program pages
│   ├── blueprint/         - Public Blueprint pages + landing/
│   ├── bootcamp/          - Student app (email-enrichment, connection-qualifier, sidebar, etc.)
│   ├── chat/              - AI chat interface
│   ├── client-portal/     - DFY client portal (intake wizard, dashboard, deliverables)
│   ├── gc/                - Growth Collective portal (dashboard, campaigns, tools, icp)
│   ├── proposal/          - Public proposal viewer
│   ├── shared/            - Reusable UI components
│   └── tam/               - TAM builder (wizard, dashboard)
├── context/               - AuthContext, NotificationContext, ThemeContext
├── hooks/                 - 31 custom React hooks (domain-specific state + mutations)
├── services/              - 21 service files (all Supabase/API access)
├── types/                 - 16 type definition files (one per domain)
├── lib/                   - Utilities: logError, supabaseClient, queryClient, sentry, csv-parser
│   └── api/               - gtm-fetch (shared GTM System API client), funnel
├── pages/bootcamp/        - BootcampApp.tsx (thin orchestrator)
├── config/                - App configuration
├── design-system/         - Design tokens and component library
├── supabase/              - Edge functions + migrations
├── tests/                 - Test suites
└── e2e/                   - Playwright E2E tests
```

**Note:** This repo has NO `src/` directory. All source files live at the root level.

### Patterns

- **Service layer**: All DB calls live in `services/`. Components and hooks never import `supabaseClient` directly.
- **Hook extraction**: Domain state lives in custom hooks (`useBootcampAuth`, `useDfyEngagementData`, `useProposalForm`, etc.). Components are thin renderers.
- **Structured logging**: All error/warning logging uses `logError(context, error, metadata)` and `logWarn(context, message, metadata)` from `lib/logError.ts`. Never use raw `console.log`/`console.error`. Both capture to Sentry in production.
- **Update whitelists**: Every service that writes to DB uses `ALLOWED_UPDATE_FIELDS` constants with `filterAllowedFields()` to prevent arbitrary field injection.
- **GTM API client**: All cross-origin calls to gtm-system use `gtmAdminFetch()` from `lib/api/gtm-fetch.ts` (attaches `x-admin-key` header).
- **Context providers**: Auth, Theme, Notifications wrap at root. Auth gates portal/bootcamp/admin routes.
- **React Query + code splitting**: TanStack Query for server state; lazy-loaded route components per product area.

### Service Layer Contracts

Every service file follows this structure:
```
/** JSDoc module header. Purpose. Constraint: Never imports React/UI. */
import { supabase } from '../lib/supabaseClient';
import { logError } from '../lib/logError';
import type { ... } from '../types/...';

// ─── Column Selects ─────
const TABLE_COLUMNS = 'id, name, ...';

// ─── Types ─────
export type FooUpdateInput = Partial<Record<FooUpdateField, unknown>>;

// ─── Helpers ─────
const ALLOWED_UPDATE_FIELDS = ['field1', 'field2'] as const;
function filterAllowedFields(...) { ... }

// ─── Reads ─────
export async function getFoo(...): Promise<Foo | null> { ... }

// ─── Writes ─────
export async function updateFoo(...): Promise<Foo | null> { ... }
```

### Hook Patterns

Domain hooks encapsulate state + mutations, keeping components under 300 lines:

| Hook | Purpose |
|------|---------|
| `useBootcampAuth` | Auth state, login/register/logout, ref-forwarding for temporal deps |
| `useBootcampCurriculum` | Course data loading, lesson navigation, `onProgressLoaded` callback |
| `useBootcampProgress` | Completed items, proof-of-work, task notes, `setProgressFromLoad` |
| `useBootcampOnboarding` | Onboarding steps, survey data, needs-onboarding derived state |
| `useDfyEngagementData` | 10 mutations + 6 queries for DFY engagement detail |
| `useDfyTemplateEditor` | Template CRUD, milestone/deliverable state |
| `useProposalForm` | 20+ form helpers, formData state, proposalToForm mapper |
| `useBlueprintForm` | Phase state machine, form data, session restore |
| `useEnrichmentPageState` | 11 useState for email enrichment pipeline |
| `useContentItemForm` | LMS content item form state + URL handlers |
| `usePickaxeEmbed` | MutationObserver + script injection for Pickaxe AI tools |

### Component Conventions

- **Max 300 lines** per component. Oversized components are split into sub-components + hooks.
- **Sub-component directories**: `components/admin/dfy/shared/`, `components/admin/dfy/panels/`, `components/admin/proposals/sections/`, `components/blueprint/landing/`, `components/bootcamp/email-enrichment/`.
- **JSDoc headers** on all files: `/** Name. Purpose. Constraint. */`
- **Section dividers** in files > 50 lines: `// ─── Section Name ─────`

## Database Access (Cross-Repo)

This repo shares a Supabase database with 3 other repos. See gtm-system's `docs/database-ownership.md` for the full table registry.

**This repo owns:** `bootcamp_students`, `bootcamp_settings`, `bootcamp_recipes`, `bootcamp_contacts`, `bootcamp_contact_lists`, `blueprint_settings`, `lms_*` tables, `tam_*` tables, `connection_ranking_*` tables, `ai_tools`, `chat_*` tables, `affiliates`, `referrals`, `infra_*` tables, `student_*` tables.

**This repo reads from other repos:**
- `prospects` + `posts` (owned by leadmagnet-backend) — public Blueprint pages, prospect detail
- `leads` (owned by gtm-system) — lead lookup for intro offers
- `proposals` (owned by gtm-system) — read and write for proposal management
- `intro_offers` + `dfy_engagements` (owned by gtm-system) — read and write for client portals

**This repo writes to other repos' tables:**
- `proposals` — status updates, view count increments
- `intro_offers` — status updates from client portal
- `dfy_client_sessions` — portal session tracking

**Rule:** Use explicit column selects (never `select('*')`). Define column constants per service file. See `services/blueprint-supabase.ts` for the pattern.

## System Context

```
  copy-of-gtm-os (Vite/React SPA)
        │ reads/writes
        ▼
  Supabase DB (shared prospects table)
    │              │
    ▼              ▼
  leadmagnet-admin ──▶ leadmagnet-backend
  (Next.js 16)         (Express: scrape → enrich → generate)
                            │
  magnetlab ◄── webhooks ── gtm-system
  (Lead Magnet SaaS)       (GTM Orchestrator, 14+ integrations)
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/blueprint` | Blueprint landing |
| `/blueprint/thank-you` | Post-submission confirmation |
| `/blueprint/call-booked` | Booking confirmation |
| `/blueprint/:slug` | Prospect analysis page |
| `/blueprint/:slug/offer` | Prospect offer page |
| `/offer/:offerType` | Offer pages by type |
| `/case-studies` | Case studies |
| `/login` | Member login |
| `/portal` | GC member dashboard |
| `/portal/onboarding` | New member onboarding |
| `/portal/tools` | Tool access |
| `/portal/campaigns` | Campaign management |
| `/portal/icp` | ICP builder (Claude AI) |
| `/portal/resources` | Member resources |
| `/bootcamp/login` | Student login |
| `/bootcamp/onboarding` | Student onboarding |
| `/bootcamp/curriculum` | Weekly curriculum |
| `/bootcamp/progress` | Progress tracking |
| `/bootcamp/ai-tools` | AI tools |
| `/bootcamp/surveys` | Student surveys |
| `/bootcamp/settings` | Account settings |
| `/bootcamp/tam-builder` | TAM builder |
| `/admin` | Redirects to /admin/courses |
| `/admin/courses` | Courses overview (cohort list) |
| `/admin/courses/students` | Student roster + CSV import |
| `/admin/courses/curriculum` | Curriculum editor |
| `/admin/courses/curriculum/:id` | Curriculum editor (specific cohort) |
| `/admin/courses/invite-codes` | Invite codes |
| `/admin/courses/surveys` | Survey responses |
| `/admin/courses/onboarding` | Course onboarding checklist |
| `/admin/courses/ai-tools` | AI tool management |
| `/admin/courses/settings` | Course settings |
| `/admin/blueprints` | Blueprint/prospect management |
| `/admin/gc/tools` | GC member tool access |
| `/admin/gc/onboarding` | GC onboarding checklist |
| `/admin/affiliates` | Affiliate program |
| `/admin/dfy` | DFY engagement list |
| `/admin/dfy/:id` | DFY engagement detail (deliverables, activity, upgrade) |
| `/admin/dfy/templates` | DFY template editor |
| `/client/:slug` | Client portal (intake wizard, dashboard, deliverables) |

### DFY Admin & Client Portal

**Admin DFY pages** (`components/admin/dfy/`):
- `DfyEngagementList.tsx` — List all DFY engagements with status filters
- `DfyEngagementDetail.tsx` — Thin orchestrator (295 lines). State in `useDfyEngagementData` hook. Sub-components in `shared/` (InfoPair, ActionButtons, AutomationStatusBadge, DeliverableRow, MilestoneSection, AutomationHistoryPanel, ActivityRow, DeleteConfirmationModal) and `panels/` (OnboardingChecklistSection, ContentCallPrepPanel, ProfileRewriteReviewPanel, CallTranscriptSection, ResourceFilesSection, IntakeFormSection)
- `DfyOverviewCard.tsx` — Client details grid, LinkedIn edit, Linear customer
- `DfyActivityPanel.tsx` — Activity log + post update form
- `DfyDeliverablesPanel.tsx` — Milestone groups + deliverable rows
- `DfyTemplateEditor.tsx` — Edit deliverable templates. State in `useDfyTemplateEditor` hook. Sub-components in `template/` (MilestonesEditor, DeliverableRow, DeliverableEditForm, DeliverablesSection, constants)
- `DfyStatusBadge.tsx` — Reusable status badge component

**Client portal** (`components/client-portal/`):
- `ClientPortalPage.tsx` — Main entry point. Three-gate logic for intro offers: (1) show `IntroOfferIntakeWizard` if `intake_status === 'pending'`, (2) show processing spinner if `intake_status === 'submitted'`, (3) show full portal otherwise
- `IntroOfferIntakeWizard.tsx` — 4-step wizard: Best Clients URLs → Dream Clients URLs → Data Dump (file upload) → Quick Confirms. Validates min 2 LinkedIn URLs per step. Submits to `POST /api/dfy/client/intake` on gtm-system
- `StepDataDump.tsx` — File upload with drag-drop. Validates extensions against `ALLOWED_EXTENSIONS` set
- `ClientDashboard.tsx`, `DeliverableCard.tsx`, `ActivityTimeline.tsx` — Full portal UI

**Services:**
- `services/dfy-service.ts` — Client-facing Supabase queries. `DfyEngagement` interface includes `engagement_type`, `intake_status`, `processed_intake`
- `services/dfy-admin-supabase.ts` — Admin queries. `ADMIN_ENGAGEMENT_COLUMNS` includes all DFY + intro offer columns

**Auth:** Admin routes use `x-admin-key` header (via `VITE_ADMIN_API_KEY`). Client portal uses `portal_slug` URL param to look up engagement (no auth session needed — client accesses via unique link).

**Cross-origin:** Client portal calls gtm-system API (`gtmconductor.com`) for intake submission + file upload. Requires CORS on gtm-system + CSP `connect-src` in `vercel.json`.

## Database Models

`Prospect` -- prospects, `ProspectPost` -- posts, `BlueprintSettings` -- config, `BlueprintContentBlock` -- content, `BootcampStudent` -- students, `BootcampChecklistItem` -- checklist, `BootcampStudentProgress` -- progress, `BootcampStudentSurvey` -- surveys, `BootcampInviteCode` -- invites, `LmsCohort` -- cohorts, `LmsWeek` -- weeks, `LmsLesson` -- lessons, `LmsContentItem` -- content, `LmsActionItem` -- actions, `LmsLessonProgress` -- progress, `LmsActionItemProgress` -- progress, `GCMember` -- members, `ToolAccess` -- permissions, `Campaign` -- campaigns, `MemberProgress` -- progress, `MemberICP` -- ICPs, `SubscriptionEvent` -- billing, `DfyEngagement` -- dfy_engagements (engagement_type, intake_status, processed_intake, pricing_tier), `DfyDeliverable` -- dfy_deliverables (depends_on, automation_type, automation_status), `DfyActivityLog` -- dfy_activity_log, `DfyClientSession` -- dfy_client_sessions

## Feature Decision Guide

| Feature Type | Repo | Rationale |
|---|---|---|
| Lead magnet creation/AI content generation | magnetlab | Owns the lead magnet product, AI pipeline, funnel builder |
| LinkedIn profile scraping/enrichment | leadmagnet-backend | Owns the Blueprint pipeline (scrape → enrich → generate) |
| Blueprint admin UI/prompt editing | leadmagnet-admin | Admin dashboard for the Blueprint backend |
| Public Blueprint pages/prospect pages | copy-of-gtm-os | Hosts all public-facing Blueprint pages + student portals |
| GC member portal features | copy-of-gtm-os | Owns the Growth Collective member experience |
| Bootcamp LMS/student features | copy-of-gtm-os | Owns the LinkedIn Bootcamp product |
| Webhook ingestion from 3rd parties | gtm-system | Central webhook hub for 14+ integrations |
| Lead routing/pipeline orchestration | gtm-system | Owns lead lifecycle from capture to sales handoff |
| Cold email campaigns | gtm-system | Owns all cold email: UI, campaign management, enrichment, pipeline |
| Content scheduling/publishing | magnetlab | Owns content pipeline and auto-publishing |
| Reply classification/delivery | gtm-system | Owns the reply pipeline (AI classify → Blueprint → deliver) |
| Funnel pages/opt-in pages | magnetlab | Owns funnel builder, opt-in, thank-you, content pages |
| Stripe billing/subscriptions | magnetlab (SaaS billing) or copy-of-gtm-os (bootcamp subs) | Depends on which product the billing is for |
| AI prompt management | leadmagnet-admin (Blueprint) or magnetlab (lead magnets) | Depends on which AI pipeline |

## Integration Points

- **Supabase** -- Primary DB. The `prospects` table is shared with `leadmagnet-backend` (scrape/enrich/generate). Edge functions proxy Claude AI calls.
- **Blueprint Backend** (`VITE_BLUEPRINT_BACKEND_URL`) -- Blueprint-specific backend operations.
- **GTM System** (`VITE_GTM_SYSTEM_URL`) -- Cross-system GTM operations via `gtmAdminFetch()` in `lib/api/gtm-fetch.ts`.
- **Call Access Grants** -- Config stored in `bootcamp_settings` key `call_grant_config` (`CallGrantConfig` type). Admin UI at `components/admin/bootcamp/settings/CallGrantConfigEditor.tsx`. gtm-system's `grant-call-access` Trigger.dev task reads this config to auto-create student accounts with AI tool credits when prospects attend Cal.com calls.

## Environment Variables

- `VITE_SUPABASE_URL` -- Supabase project URL
- `VITE_SUPABASE_ANON_KEY` -- Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` -- Supabase service role (server-side)
- `ANTHROPIC_API_KEY` -- Claude AI key
- `VITE_SENTRY_DSN` -- Sentry error tracking
- `VITE_CALCOM_BOOKING_URL` -- Cal.com booking
- `VITE_SENJA_WIDGET_ID` -- Senja testimonials
- `VITE_BLUEPRINT_BACKEND_URL` -- Blueprint backend URL
- `VITE_GTM_SYSTEM_URL` -- GTM system URL
- `VITE_ADMIN_API_KEY` -- Admin API key (x-admin-key header for gtm-system calls)
- `VITE_ADMIN_EMAILS` -- Admin email addresses (comma-separated)
- `VITE_INFRA_API_KEY` -- Infrastructure provisioning API key

## Development

**Setup**: `npm install`, `cp .env.example .env`, `npm run dev`

**Commands**:
```
npm run dev              # Vite dev server
npm run build            # Production build
npm run test             # All tests
npm run test:unit        # Unit tests (Vitest)
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests (Playwright)
npm run test:coverage    # Tests with coverage
```

## Testing

- Unit tests: Vitest + React Testing Library, co-located with components or in `__tests__/`.
- Integration tests: Vitest + MSW mocking Supabase and external APIs.
- E2E: Playwright for full browser user flows.
- Single file: `npx vitest run path/to/test.ts` or `npx playwright test --ui`.
- MSW handlers defined for Supabase endpoints and external APIs.

## Deployment

- **Vercel**: Auto-deploy is broken for private org repos (needs Vercel Pro). Deploy manually:
  ```
  vercel --prod
  ```
- No background jobs or Trigger.dev tasks in this repo.

## Related Repos

| Repo | Path | Purpose |
|------|------|---------|
| magnetlab | `/Users/timlife/Documents/claude code/magnetlab` | Lead magnet SaaS, funnels, content |
| gtm-system | `/Users/timlife/Documents/claude code/gtm-system` | GTM orchestrator, webhooks, lead routing |
| leadmagnet-admin | `/Users/timlife/linkedin-leadmagnet-admin` | Admin dashboard for Blueprint Generator |
| leadmagnet-backend | `/Users/timlife/linkedin-leadmagnet-backend` | Blueprint pipeline: scrape → enrich → generate |
