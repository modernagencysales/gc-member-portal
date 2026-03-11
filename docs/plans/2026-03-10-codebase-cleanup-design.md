# copy-of-gtm-os Codebase Cleanup — Design Spec

**Date:** 2026-03-10
**Status:** Approved
**Goal:** Bring copy-of-gtm-os into full compliance with the coding standards established in the global CLAUDE.md, making the codebase maximally readable and maintainable for both AI and human developers.

**Architecture:** 5 independent specs executed in priority order. Each spec is self-contained, independently valuable, testable, and includes tests for everything it touches. Each spec gets its own implementation plan.

**Motivation:** After a major cleanup of gtm-system (rebuilt tables, shared service layer, strict coding standards), copy-of-gtm-os is the next repo to align. A deep evaluation identified 8 critical issues, 9 important issues, and 2 nice-to-haves across error handling, data access, component structure, and developer ergonomics.

---

## Evaluation Summary

**Codebase stats:** 96K lines of TypeScript, ~200+ source files, 22 services, 259 components, 20 hooks, 16 type files, 44 test files. Serves 6+ product areas (Blueprint, Bootcamp LMS, GC Portal, DFY Admin, Client Portal, Affiliate).

**What's already good:**
- No `select('*')` — explicit column constants everywhere
- Service layer exists (22 files) with section dividers and organized reads/writes
- Admin auth consistent (`x-admin-key` pattern)
- Test infrastructure solid (Vitest + RTL + MSW + Playwright)
- Database ownership documented in CLAUDE.md

**Critical issues found:**
1. `logError` utility exists but zero files use it — 307 raw console calls
2. `updateProposal()` accepts unvalidated `Partial<Record<string, unknown>>`
3. No `ALLOWED_UPDATE_FIELDS` whitelists in any service
4. DfyEngagementDetail.tsx at 2,682 lines (9x the 300-line limit)
5. BootcampApp.tsx god-component: 994 lines, 23 useState, dual Airtable/Supabase
6. Raw `fetch()` in 10+ React components
7. Direct Supabase imports in 5 components + 3 hooks, bypassing service layer
8. 7 other components exceed 700 lines

---

## Spec 1: Error Handling & Observability

**Goal:** Replace all 307 raw `console.*` calls with structured `logError`/`logWarn` logging wired to Sentry, fix silent failure patterns, and add tests for the logging infrastructure.

**Scope:**
- `lib/logError.ts` already exists with Sentry integration — needs a `logWarn` companion for non-error cases
- 78 files across services, components, and hooks need migration from `console.*` to structured logging
- ~15 silent failure patterns (catch → return empty) in services need to propagate errors or at minimum log them with context
- Fire-and-forget DB operations (`.then(() => {})`) need error logging

**Tests:**
- Unit tests for `logError`/`logWarn` (verify Sentry capture, metadata formatting)
- Verify key services call structured logging on failure paths

**What it does NOT do:** No component restructuring, no data access changes, no new service layer work. Pure logging/observability swap.

**Standards addressed:**
- Principle 6: Write code that fails loudly
- Rule: Never write empty `catch {}` — at minimum `logError()`
- Rule: Use `logError(context, error, metadata)` — never raw `console.log`/`console.error`

---

## Spec 2: Data Access Hardening

**Goal:** Eliminate the dual Airtable/Supabase system, enforce typed update whitelists on all services, route all component/hook DB access through the service layer, and consolidate duplicate fetch helpers.

**Scope:**

### Kill Airtable
- Remove `services/airtable.ts` (254 lines)
- Remove Airtable fallback from `BootcampApp.tsx` curriculum loading
- Remove `verifyUser` (Airtable) from `AuthContext.tsx`
- Remove Airtable from CSP `connect-src` in `vercel.json`

### Update whitelists
- Add `ALLOWED_UPDATE_FIELDS` constants to every service that writes to the DB
- Fix `updateProposal()` to stop accepting `Partial<Record<string, unknown>>`
- Add typed `*UpdateInput`, `*InsertInput` interfaces to all services

### Route components through services
- Remove direct `supabaseClient` imports from 5 components: `Phase2Progress`, `ConnectionQualifier`, `CheckoutStep`, `GeneratePanel`, `SubscriptionModal`
- Remove direct `supabaseClient` imports from 3 hooks: `useTamPipeline`, `useTamLinkedinCheck`, `useTamRefine`
- Move their queries into the appropriate service files

### Consolidate fetch helpers
- Replace `gtmAdminFetch()`, `fetchGtm()`, `gtmFetch()` and inline `x-admin-key` headers with one shared `lib/gtm-fetch.ts` utility
- Standardize on `VITE_GTM_SYSTEM_URL` everywhere

**Tests:**
- Tests for update whitelist enforcement (verify rejected fields throw)
- Tests for the consolidated fetch helper
- Tests for any new service functions created from component extraction

**What it does NOT do:** No component splitting (that's Spec 3). Components keep their current structure — we just move their DB calls into services.

**Standards addressed:**
- Principle 3: Make the implicit explicit
- Principle 4: Build layers, not features (Component → Hook → Service → DB)
- Principle 5: Delete before you add (Airtable removal)
- Principle 8: Dependencies flow one direction
- Principle 10: Think about what SHOULDN'T happen (whitelists)
- Rule: Explicit column selects — never `select('*')`
- Rule: `ALLOWED_UPDATE_FIELDS` whitelists for all update operations
- Rule: Typed interfaces: `*Filters`, `*UpdateInput`, `*InsertInput` per domain

---

## Spec 3: Component Decomposition

**Goal:** Break apart the 8 oversized components into focused sub-components and custom hooks, each under 300 lines. Extract all inline `fetch()` calls to the service layer.

**Scope:**

| Component | Lines | Decomposition Strategy |
|-----------|-------|----------------------|
| BootcampApp.tsx | 994 | Extract 23 useState into 3-4 hooks (`useBootcampAuth`, `useBootcampCurriculum`, `useBootcampProgress`, `useBootcampOnboarding`). Split rendering into sub-components. |
| DfyEngagementDetail.tsx | 2,682 | Extract 12 mutations into `useDfyEngagementMutations`. Extract inline `fetch()` to services. Split into section sub-components. |
| DfyTemplateEditor.tsx | 1,387 | Extract editing state into hook, split form sections. |
| BlueprintLandingPage.tsx | 1,088 | Move existing inline sub-components (Hero, NavBar, StatsRow) to separate files. |
| AdminProposalEdit.tsx | 1,050 | Extract form state + mutations to hook, split editor sections. |
| EmailEnrichmentPage.tsx | 777 | Extract pipeline state to hook, split steps. |
| LmsContentItemModal.tsx | 749 | Extract form logic to hook, split tabs/sections. |
| LessonView.tsx | 735 | Extract content rendering sub-components. |

- Any remaining raw `fetch()` in components (10+ files) moved to service layer.

**Tests:**
- Tests for each extracted hook (state management, mutation behavior)
- Component render tests for newly split sub-components

**What it does NOT do:** No data access changes (done in Spec 2). No error handling changes (done in Spec 1). Pure structural decomposition.

**Standards addressed:**
- Principle 1: Design for the reader
- Principle 7: Side effects are quarantined
- Rule: No raw `fetch()` in React components
- Rule: Extract state to custom hooks at ~15 `useState` calls
- Rule: No component over 300 lines

---

## Spec 4: Developer Ergonomics

**Goal:** Polish the codebase for day-to-day developer productivity — consistent documentation, clean imports, removed legacy artifacts.

**Scope:**
- **JSDoc module headers:** Add to 11 service files missing them (`command-center.ts`, `dfy-intake-service.ts`, `dfy-service.ts`, `infrastructure-supabase.ts`, `intro-offer-supabase.ts`, `proposal-gtm.ts`, `proposal-supabase.ts`, `subscription-supabase.ts`, `ai.ts`, `affiliate-supabase.ts`, and any hooks/components created in Spec 3)
- **Legacy types cleanup:** Merge root-level `types.ts` into `types/bootcamp-types.ts` or delete if fully superseded. Update all imports.
- **Import order enforcement:** External packages → relative/alias paths → `type` imports. Add ESLint rule if not already configured.
- **Section dividers:** Add `// ─── Name ─────` dividers to any files over 50 lines that lack them.

**Tests:**
- Schema validation tests for all 16 type files in `types/`
- Verify all exported types match actual DB column shapes where applicable

**What it does NOT do:** Dark mode Tailwind migration (high effort, low value — can be a future effort).

**Standards addressed:**
- Principle 1: Design for the reader
- Principle 9: Predictability over cleverness
- Rule: JSDoc module header on every new file
- Rule: Import order: external → absolute → type imports
- Rule: Section dividers in files > 50 lines
- Rule: Literal union types, not TypeScript enums

---

## Spec 5: Final Code Review & Legibility Pass

**Goal:** A holistic review of the entire codebase after Specs 1-4, ensuring maximum readability for both AI and human developers. Someone (or Claude) opening this repo for the first time should be productive within minutes.

**Scope:**
- **CLAUDE.md rewrite:** Update to reflect post-cleanup architecture. Clear file maps, data flow diagrams, "where does X live?" decision guide. Document the service layer contracts, hook patterns, and component conventions.
- **Pattern consistency audit:** Walk every service, hook, and component to ensure they follow the same structure — same error handling, return types, import order, section dividers.
- **Dead code removal:** Find unused exports, orphaned components, stale imports, commented-out code. Delete it.
- **Naming consistency:** Verify file names, function names, type names follow the same conventions throughout. No `get` vs `fetch` vs `load` inconsistency.
- **Navigation aids:** Ensure every directory with 5+ files has clear organization. Barrel files where appropriate, clear file naming.
- **Code review checklist:** Run the full Code Review Checklist from global CLAUDE.md against the cleaned codebase. Document any remaining violations.

**Tests:**
- Run full test suite, ensure 100% pass
- Coverage report to identify any critical paths still untested
- Fill remaining test gaps found during the audit

**Standards addressed:** All 10 principles — this is the final compliance check.

---

## Execution Order & Dependencies

```
Spec 1 (Error Handling)
    ↓
Spec 2 (Data Access)  — depends on Spec 1 (errors visible for debugging)
    ↓
Spec 3 (Components)   — depends on Spec 2 (data access clean before splitting)
    ↓
Spec 4 (Ergonomics)   — depends on Spec 3 (new files from decomposition need headers)
    ↓
Spec 5 (Final Review) — depends on all above
```

Each spec gets its own implementation plan via the writing-plans skill. Each spec is independently committable and deployable.

## Out of Scope

- Dark mode migration to Tailwind `dark:` variants (high effort, cosmetic)
- React Router upgrade or SSR migration
- New feature development
- Cross-repo changes (gtm-system, magnetlab, etc.)
