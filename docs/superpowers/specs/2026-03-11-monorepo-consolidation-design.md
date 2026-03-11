# Monorepo Consolidation — Design Spec

**Date:** 2026-03-11
**Status:** Approved
**Goal:** Consolidate 5 repos into 1 monorepo with 3 apps + shared packages, applying magnetlab's coding standards throughout. Framework unification (all Next.js). Route-by-route frontend migration.

**Architecture:** pnpm workspaces monorepo. No Turborepo. Each app deploys independently (Vercel or Railway). Shared packages provide types, DB client, logging, and integration clients. Magnetlab joins later when developer is ready.

---

## Current State

| Repo | Stack | LOC | Deploy | Purpose |
|------|-------|-----|--------|---------|
| magnetlab | Next.js 15, pnpm | ~40K+ | Vercel | Lead magnet SaaS (gold standard, off-limits) |
| gtm-system | Next.js 16 | ~30K+ | Railway | GTM orchestrator, 83 Trigger.dev tasks, 18 webhooks |
| copy-of-gtm-os | React/Vite | ~96K | Vercel | Frontend SPA (Blueprint, Bootcamp, Admin, Client Portal) |
| leadmagnet-backend | Express | ~10.5K | Railway | Blueprint pipeline (scrape, enrich, generate) |
| leadmagnet-admin | Next.js 16 | ~7.7K | Vercel | Admin UI for Blueprint Generator |

**Critical problems:**
1. Prospect/Post types defined in 2 repos with mismatched status enums
2. Same Supabase CRUD logic duplicated between leadmagnet-backend and copy-of-gtm-os
3. Email enrichment logic exists in both leadmagnet-backend AND gtm-system
4. 3 different logging implementations (logError, logger.ts, raw console)
5. No shared packages — every repo reimplements utilities
6. leadmagnet-admin (7.7K LOC) calls leadmagnet-backend via proxy routes
7. 2 frameworks (Vite + Next.js) for frontends
8. Integration clients (PlusVibe, HeyReach, Attio) duplicated across repos

---

## End State

```
mas-platform/
├── apps/
│   ├── gtm-os/                        Next.js frontend (Vercel → modernagencysales.com)
│   │   ├── src/
│   │   │   ├── app/                    Next.js App Router routes
│   │   │   ├── components/             React components (never import from server/)
│   │   │   ├── frontend/api/           Client-side API modules (apiClient + domain modules)
│   │   │   ├── server/
│   │   │   │   ├── services/           Business logic (.service.ts files)
│   │   │   │   └── repositories/       DB queries (.repo.ts files)
│   │   │   └── lib/                    App-specific utilities
│   │   ├── eslint.config.mjs           Server/client boundary enforcement
│   │   ├── jest.config.js              50% coverage threshold
│   │   └── CLAUDE.md                   App-specific docs
│   │
│   ├── gtm-system/                     Next.js backend (Railway → gtmconductor.com)
│   │   ├── src/
│   │   │   ├── app/api/                API routes (thin handlers, <30 lines)
│   │   │   ├── lib/                    Auth, webhooks, middleware helpers
│   │   │   ├── server/
│   │   │   │   ├── services/           Business logic (includes absorbed Blueprint services)
│   │   │   │   └── repositories/       DB queries (includes absorbed Blueprint repos)
│   │   │   ├── trigger/                83+ Trigger.dev tasks (includes Blueprint pipeline)
│   │   │   └── components/             Dashboard UI
│   │   └── CLAUDE.md
│   │
│   └── magnetlab/                      Joins later (developer moves it in)
│
├── packages/
│   ├── types/                          @mas/types (tsc build)
│   │   ├── prospect.ts                 Prospect, ProspectPost, ProspectStatus
│   │   ├── dfy.ts                      DfyEngagement, DfyDeliverable, DfyActivityLog
│   │   ├── proposal.ts                 Proposal, ProposalPricing, ProposalService
│   │   ├── lead.ts                     Lead, LeadStatus, EnrichmentRun
│   │   ├── bootcamp.ts                 BootcampStudent, LmsCohort, LmsLesson, etc.
│   │   ├── infrastructure.ts           InfraProvision, InfraDomain, InfraTier
│   │   └── index.ts                    Barrel file
│   │
│   ├── db/                             @mas/db (tsc build)
│   │   ├── client.ts                   createBrowserClient, createServerClient, createAdminClient
│   │   │                               NOTE: createServerClient requires cookies — called ONLY in
│   │   │                               route handlers or middleware, NEVER in services/repos.
│   │   │                               Services receive the client as a parameter or use createAdminClient.
│   │   ├── scope.ts                    DataScope interface, applyScope(), getDataScope()
│   │   ├── whitelist.ts                filterAllowedFields() generic helper
│   │   └── index.ts
│   │
│   ├── logging/                        @mas/logging (tsc build)
│   │   ├── logger.ts                   logError, logWarn (Sentry in prod, console in dev)
│   │   ├── status-code.ts              getStatusCode() helper for route error handling
│   │   └── index.ts
│   │
│   └── integrations/                   @mas/integrations (tsup build, ESM+CJS)
│       ├── base-client.ts              BaseApiClient (timeout, error handling, typed responses)
│       ├── plusvibe.ts                  PlusVibe cold email client
│       ├── heyreach.ts                 HeyReach LinkedIn automation client
│       ├── attio.ts                    Attio CRM client
│       ├── resend.ts                   Resend email client
│       ├── apify.ts                    Apify scraping client
│       ├── brightdata.ts               Bright Data SERP client
│       └── index.ts
│
├── pnpm-workspace.yaml                 packages: ['packages/*', 'apps/*']
├── eslint.config.mjs                   Root ESLint flat config
├── .prettierrc                         { semi, singleQuote, tabWidth: 2, trailingComma: "es5", printWidth: 100 }
├── .npmrc                              engine-strict=true
├── tsconfig.base.json                  Shared compiler options (strict, ES2022, bundler)
├── .husky/pre-commit                   npx lint-staged && pnpm typecheck && pnpm build
└── CLAUDE.md                           Master decision guide for all apps
```

**Deployment stays the same:**
- `apps/gtm-os` → Vercel (modernagencysales.com)
- `apps/gtm-system` → Railway (gtmconductor.com)
- `apps/magnetlab` → Vercel (magnetlab.app) — when it joins

---

## Conventions (Applied During Every Phase)

All conventions extracted from magnetlab's production codebase. Full reference: `~/.claude/projects/-Users-timlife/memory/coding-quality-standards.md`

### Layered Architecture

```
API Route (auth → scope → validate → service → JSON)         max 30 lines
    ↓
Service (business logic, validation, orchestration)           .service.ts
    ↓
Repository (Supabase queries only, named column constants)    .repo.ts
    ↓
Supabase (PostgreSQL)
```

- Routes never contain business logic
- Services never import NextRequest/NextResponse/cookies()
- Repositories never imported by 'use client' files
- Dependencies flow ONE direction: Route → Service → Repo → DB

### File Naming

- Repositories: `{domain}.repo.ts` (kebab-case)
- Services: `{domain}.service.ts` (kebab-case)
- Frontend API modules: `{domain}.ts` in `src/frontend/api/`

### Method Naming

- **Repos**: `find*` (reads), `create*`, `update*`, `delete*`
- **Services**: `get*`/`list*` (reads), `create*`, `update*`, `delete*`, domain verbs (`publish*`, `polish*`)
- **Services export**: `getStatusCode(error)` for route handler error mapping

### DataScope

Every service and repo method takes `DataScope` as first param:
```typescript
interface DataScope {
  type: 'user' | 'tenant' | 'admin';
  userId: string;
  tenantId?: string;
  ownerId?: string;
}
```

### Error Handling

```typescript
// Service: attach statusCode to errors
throw Object.assign(new Error('Not found'), { statusCode: 404 });

// Route: use getStatusCode()
const status = service.getStatusCode(error);
return NextResponse.json({ error: message }, { status });

// Logging: always structured
logError('domain.service:method', error, { id, step });
```

### Frontend Data Layer

- `src/frontend/api/client.ts` — centralized apiClient (one per app)
- Domain modules wrap apiClient: `src/frontend/api/bootcamp.ts`
- Components import domain modules, NEVER raw `fetch()`
- ESLint enforces: client files cannot import from `src/server/`

### Validation

- Every API route validates with Zod
- Every schema gets a test
- `type FooInput = z.infer<typeof fooSchema>`

### Testing

- Jest for apps, Vitest for packages
- 50% coverage threshold (branches, functions, lines, statements)
- Every route: auth (401), validation (400), happy path (200), error (500)
- Mock service layer, not fetch

### File Structure

- JSDoc header on every file: `/** Name. Purpose. Constraint. */`
- Section dividers in files > 50 lines: `// ─── Name ────────────────────────`
- Import order: external → `@/` absolute → type imports
- Column constants: `SCREAMING_SNAKE_CASE` at top of repo files

---

## Cross-App Data Ownership

| Access Pattern | Rule | Example |
|---------------|------|---------|
| Own table, read | Direct repo | gtm-os reads `bootcamp_students` |
| Own table, write | Direct repo | gtm-system writes `leads` |
| Shared table, read-only | Direct repo (OK for public/perf) | gtm-os reads `prospects` for Blueprint pages |
| Other app's table, write | Call owning app's API | gtm-os calls gtm-system to update `proposals` |
| Cross-app notification | Fire-and-forget webhook (5s timeout) | magnetlab → gtm-system `lead.created` |

**Note:** During migration (Phases 3-6), both the old Vite app and the new Next.js app will read from the same tables. The ownership column above reflects the end state. The overlap period is expected and safe because both apps are read-compatible.

---

## Prerequisites

- **Specs 1-5 (Codebase Cleanup)** must be complete before any migration begins. These extracted hooks (useBootcampAuth, useDfyEngagementData, etc.) and decomposed oversized components that Phases 5-6 depend on. *(Completed 2026-03-11.)*

---

## Execution Phases

### Phase 0: Foundation (~1 week)

**Create monorepo + shared packages.**

- New repo `mas-platform` with pnpm workspaces
- Root config matching magnetlab: `eslint.config.mjs`, `.prettierrc`, `.npmrc`, `.husky/pre-commit`, `tsconfig.base.json`
- Build 4 packages: `@mas/types`, `@mas/db`, `@mas/logging`, `@mas/integrations`
- Each package: `package.json`, `tsconfig.json`, barrel `index.ts` with JSDoc + section dividers
- Vitest tests for each package
- lint-staged: `prettier --write` + `eslint --max-warnings 0 --no-warn-ignored`
- Pre-commit: `npx lint-staged && pnpm typecheck && pnpm build`

**Exit criteria:** All 4 packages build, pass tests, can be imported.

### Phase 1: Backend Consolidation — leadmagnet-admin + leadmagnet-backend (~3-5 days)

**Merge leadmagnet-admin into leadmagnet-backend, convert Express to Next.js.**

- Convert 9 Express route files → Next.js `app/api/` routes (<30 lines each)
  - **Complexity note:** Most routes are simple JSON handlers. `enrichment-batch` and `cold-email` routes have file upload/streaming — these need special handling (Next.js API route body size limits, FormData parsing). Audit each route's middleware chain before converting.
- Move leadmagnet-admin pages into same app (admin UI alongside API)
- Eliminate admin-proxy pattern (admin pages call services directly)
- Apply conventions: `.service.ts`/`.repo.ts` naming, `find*` in repos, DataScope, JSDoc, section dividers, Zod validation
- Replace `console.error` with `@mas/logging`
- Import types from `@mas/types`, Supabase client from `@mas/db`
- Trigger.dev tasks stay as-is

**Exit criteria:** Single Next.js app serves API + admin UI. Tests pass. Old repos archived.

**Fallback:** If Express→Next.js conversion reveals blocking complexity (streaming, WebSockets), keep Express as a standalone app in `apps/blueprint-api/` and convert later.

### Phase 2: Backend Consolidation — Blueprint API into gtm-system (~1 week)

**Absorb merged Blueprint app into gtm-system.**

- Move services → `src/server/services/blueprint-*.service.ts`
- Move repos → `src/server/repositories/blueprint-*.repo.ts`
- Move Trigger.dev tasks → `src/trigger/blueprint-*.ts`
- Move admin pages → `src/app/admin/blueprint/`
- Deduplicate: email enrichment (both repos), integration clients → `@mas/integrations`
- **Required refactoring before absorption** (blockers, not optional polish):
  - `LeadMagnetWizard.tsx` (2,626 lines) → decompose (hooks + sub-components)
  - `dm/page.tsx` (1,415 lines) → decompose
  - Missing JSDoc headers on 14+ files
  - 5 files with `console.error` → `@mas/logging`
  - `middleware.ts` (574 lines) → extract CORS to separate module

**Exit criteria:** gtm-system is single backend. All Trigger.dev tasks work. Integration clients deduplicated. Two repos archived.

### Phase 3: Frontend Migration — Blueprint Pages (~3-5 days)

**First batch of copy-of-gtm-os routes to Next.js.**

- Set up `apps/gtm-os/` as Next.js app (matching magnetlab config)
- Establish layered architecture from day one:
  - `src/frontend/api/client.ts` + `src/frontend/api/blueprint.ts`
  - `src/server/repositories/blueprint.repo.ts` (read-only: PROSPECT_COLUMNS, POST_COLUMNS from `@mas/types`)
  - `src/server/services/blueprint.service.ts`
  - ESLint boundary enforcement
- Migrate: `/blueprint`, `/blueprint/:slug`, `/blueprint/:slug/offer`, `/blueprint/thank-you`, `/blueprint/call-booked`
- Server-side rendering (SSR) — SEO improvement over current SPA
- Landing sub-components already extracted (NavBar, Hero, HowItWorks, Footer)
- Vercel routing: `/blueprint/*` → new app, everything else → old Vite app

**Exit criteria:** Blueprint pages render from Next.js. SSR works. Old Vite app serves remaining routes.

### Phase 4: Frontend Migration — Client Portal + Proposals + Affiliate (~3-5 days)

**Three small, self-contained product areas.**

- **Client Portal** (~8 components): `/client/:slug`. Slug-based auth (no session needed). Writes to gtm-system via API (doesn't own DFY tables).
- **Proposals** (~2 components): Public proposal viewer. Read-only from Supabase.
- **Affiliate** (~11 components): Standalone signup/dashboard.
- Each gets repo + service files following conventions
- Frontend API modules for client-side data

**Exit criteria:** Three more route groups on Next.js. Vite surface shrinking.

### Phase 5: Frontend Migration — Bootcamp LMS (~1-2 weeks)

**Biggest product area. 50+ components, auth-gated. Highest-risk phase.**

#### Auth Migration Design

Current auth is NOT Supabase Auth or NextAuth. It is a custom email-lookup system:
- `verifyBootcampStudent()` queries `bootcamp_students` by email, stores result in `localStorage` under `BOOTCAMP_USER_KEY`
- React Context (`useAuth()`) reads from localStorage on mount
- No passwords, no JWTs, no sessions — just email verification against DB

**Migration approach:** NextAuth v5 with **magic link** provider (email-based, no passwords needed):
- Students receive a magic link email to sign in (matches current passwordless UX)
- NextAuth stores session in HTTP-only cookie (replaces localStorage — more secure)
- `bootcamp_students` table remains the user store — NextAuth adapter queries it
- Existing students need NO migration — they just click a magic link on first visit post-migration
- `useAuth()` context hook → replaced by NextAuth's `useSession()` in client components, `auth()` in server components
- All 50+ components using `useAuth()` → mechanical find-and-replace

**Session strategy:** JWT (stateless, matches magnetlab). No database sessions needed.

**GC Portal auth:** Stays separate (if GC portal survives Phase 7). Uses same NextAuth instance with a different user table (`gc_members`).

#### Migration steps

- Auth: NextAuth v5 with magic link (see above)
- Hooks already extracted in Spec 3 → convert to Next.js patterns (server data loading in server components, client state stays in hooks)
- Repos: `bootcamp-students.repo.ts`, `lms-cohorts.repo.ts`, `lms-lessons.repo.ts`, `lms-progress.repo.ts`
- Services: `bootcamp.service.ts`, `lms.service.ts`
- All sub-routes: login, onboarding, curriculum, progress, ai-tools, surveys, settings, tam-builder
- TAM builder + connection qualifier + email enrichment tools migrate here

**Exit criteria:** Full Bootcamp LMS on Next.js with server-side auth. Students can sign in via magic link. All student-facing features working.

### Phase 6: Frontend Migration — Admin Dashboards (~1-2 weeks)

**All admin pages. Second-largest surface.**

- Auth: NextAuth v5 with admin role check (replace x-admin-key pattern)
- Routes: `/admin/courses/*`, `/admin/blueprints`, `/admin/dfy/*`, `/admin/affiliates`, `/admin/gc/*`
- DFY components already decomposed in Spec 3 — move as-is
- Admin pages calling gtm-system → call services directly or use `@mas/integrations` for cross-app

**Exit criteria:** All admin routes on Next.js. Old Vite app decommissioned.

### Phase 7: GC Portal — Evaluate & Decide

Product decision checkpoint:
- (A) Migrate as-is (~15 components)
- (B) Merge into Bootcamp (if features overlap)
- (C) Kill it (if truly unused)

### Phase 8: Decommission + Magnetlab Integration

- Delete old Vite copy-of-gtm-os
- Update DNS/Vercel — `modernagencysales.com` → `apps/gtm-os`
- Archive old repos (leadmagnet-admin, leadmagnet-backend, copy-of-gtm-os)
- Developer moves magnetlab into `apps/magnetlab/`, updates imports to `@mas/*` packages
- Final CLAUDE.md rewrite for monorepo

---

## Out of Scope

- Dark mode Tailwind migration
- React Router upgrade (eliminated — Next.js replaces it)
- New feature development during migration
- Touching magnetlab code (developer's domain)
- GC Portal migration (product decision pending)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking production during migration | Route-by-route. Old Vite app stays live. Vercel routing proxies gradually. |
| Auth conversion breaks bootcamp login | Phase 5 is the riskiest. Feature-flag new auth, keep old as fallback. |
| Developer disagrees with monorepo structure | Monorepo is a NEW repo. magnetlab stays untouched. Developer reviews structure before moving in. |
| Express→Next.js conversion scope | leadmagnet-backend is only 10.5K LOC, 9 routes. Mechanical conversion. Fallback: wrap Express as standalone app. |
| Shared package API drift | TypeScript enforces at build time. ESLint boundary rules prevent misuse. |
| Test coverage drops during migration | 50% threshold in jest.config.js. CI blocks merge if below. |
