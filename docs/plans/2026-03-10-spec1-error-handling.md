# Spec 1: Error Handling & Observability — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 307 raw `console.*` calls across 78 files with structured `logError`/`logWarn` logging wired to Sentry, fix silent failure patterns, and add tests.

**Architecture:** `lib/logError.ts` already exists with Sentry integration. We add a `logWarn` companion, then mechanically replace every `console.error`/`console.warn`/`console.log` in source files (not `node_modules`, not `supabase/functions/`). Silent failure patterns in services get `logError` calls added. Fire-and-forget DB ops get `.catch(logError)`. Tests verify the logging functions work correctly.

**Tech Stack:** TypeScript, Vitest, @sentry/react

**Repo:** `/Users/timlife/Documents/claude code/copy-of-gtm-os`

**Important context:**
- `lib/logError.ts` exists at line count 15 — has `logError(context, error, metadata)` that logs to console + captures to Sentry in production
- `lib/sentry.ts` has `initSentry()`, `setSentryUser()`, `addBreadcrumb()` — all working
- Supabase edge functions (`supabase/functions/`) are OUT OF SCOPE — they run in Deno and don't have access to Sentry
- Test setup is at `tests/setup.ts` — mocks fetch, localStorage, matchMedia
- 78 source files have console.* calls, heaviest are: `blueprint-supabase.ts` (40), `bootcamp-supabase.ts` (35), `supabase.ts` (21), `affiliate-supabase.ts` (15)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/logError.ts` | Modify | Add `logWarn`, improve `logError` signature |
| `tests/lib/logError.test.ts` | Create | Unit tests for logError/logWarn |
| `services/blueprint-supabase.ts` | Modify | Replace 40 console.* → logError/logWarn |
| `services/bootcamp-supabase.ts` | Modify | Replace 35 console.* → logError/logWarn |
| `services/supabase.ts` | Modify | Replace 21 console.* → logError/logWarn |
| `services/affiliate-supabase.ts` | Modify | Replace 15 console.* → logError/logWarn |
| `services/airtable.ts` | Modify | Replace 4 console.* → logError/logWarn |
| `services/ai.ts` | Modify | Replace console.* → logError/logWarn |
| `services/command-center.ts` | Modify | Replace console.* → logError/logWarn |
| `services/tenant-branding.ts` | Modify | Replace console.* → logError/logWarn |
| `services/proposal-supabase.ts` | Modify | Fix fire-and-forget `.then(() => {})` |
| `context/AuthContext.tsx` | Modify | Replace 3 console.* → logError/logWarn |
| `components/**/*.tsx` (45 files) | Modify | Replace console.* → logError/logWarn |
| `lib/sentry.ts` | Modify | Replace its own console.warn/error |
| `lib/supabaseClient.ts` | Modify | Replace console.* → logError/logWarn |
| `lib/webVitals.ts` | Modify | Replace console.* → logError/logWarn |

---

## Chunk 1: Logging Infrastructure + Tests

### Task 1: Enhance logError.ts with logWarn

**Files:**
- Modify: `lib/logError.ts`
- Create: `tests/lib/logError.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/logError.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Sentry before importing logError
vi.mock('@sentry/react', () => ({
  withScope: vi.fn((cb) => cb({
    setTag: vi.fn(),
    setExtras: vi.fn(),
    setLevel: vi.fn(),
  })),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { logError, logWarn } from '../../lib/logError';
import * as Sentry from '@sentry/react';

describe('logError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('logs to console.error with context prefix', () => {
    const error = new Error('test error');
    logError('test-context', error);
    expect(console.error).toHaveBeenCalledWith('[test-context]', error, '');
  });

  it('logs to console.error with metadata', () => {
    const error = new Error('test error');
    const meta = { userId: '123', action: 'save' };
    logError('test-context', error, meta);
    expect(console.error).toHaveBeenCalledWith('[test-context]', error, meta);
  });

  it('captures to Sentry in production', () => {
    vi.stubEnv('PROD', 'true');

    const error = new Error('sentry test');
    logError('sentry-context', error, { key: 'val' });

    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error);

    vi.unstubAllEnvs();
  });

  it('wraps non-Error values in Error for Sentry', () => {
    vi.stubEnv('PROD', 'true');

    logError('string-error', 'just a string');

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'just a string' })
    );

    vi.unstubAllEnvs();
  });

  it('does not capture to Sentry in development', () => {
    logError('dev-context', new Error('dev error'));
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});

describe('logWarn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('logs to console.warn with context prefix', () => {
    logWarn('warn-context', 'something happened');
    expect(console.warn).toHaveBeenCalledWith('[warn-context]', 'something happened', '');
  });

  it('logs to console.warn with metadata', () => {
    logWarn('warn-context', 'msg', { detail: 'info' });
    expect(console.warn).toHaveBeenCalledWith('[warn-context]', 'msg', { detail: 'info' });
  });

  it('logs to console.warn without metadata', () => {
    logWarn('warn-context', 'no meta');
    expect(console.warn).toHaveBeenCalledWith('[warn-context]', 'no meta', '');
  });

  it('captures to Sentry as message (not exception) in production', () => {
    vi.stubEnv('PROD', 'true');

    logWarn('warn-sentry', 'warning message');

    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalledWith('[warn-sentry] warning message');
    expect(Sentry.captureException).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it('does not capture to Sentry in development', () => {
    logWarn('dev-warn', 'dev warning');
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/logError.test.ts`
Expected: FAIL — `logWarn` is not exported from `lib/logError.ts`

- [ ] **Step 3: Update lib/logError.ts with logWarn**

Replace the entire file:

```typescript
/** Structured logging. Logs to console and captures to Sentry in production.
 *  Never import console.log/error/warn directly — use these functions instead. */
import * as Sentry from '@sentry/react';

/**
 * Log an error with structured context. Captures to Sentry in production.
 * Use for actual errors (failed DB calls, unexpected states, caught exceptions).
 */
export function logError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
  console.error(`[${context}]`, error, metadata ?? '');

  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      scope.setTag('context', context);
      if (metadata) scope.setExtras(metadata);
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    });
  }
}

/**
 * Log a warning with structured context. Captures to Sentry as message in production.
 * Use for non-critical issues (missing optional data, fallback paths, deprecation notices).
 */
export function logWarn(context: string, message: string, metadata?: Record<string, unknown>): void {
  console.warn(`[${context}]`, message, metadata ?? '');

  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      scope.setTag('context', context);
      scope.setLevel('warning');
      if (metadata) scope.setExtras(metadata);
      Sentry.captureMessage(`[${context}] ${message}`);
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/logError.test.ts`
Expected: PASS (all 10 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/logError.ts tests/lib/logError.test.ts
git commit -m "feat: add logWarn companion to logError, add tests"
```

---

## Chunk 2: Migrate Services (Heavy Hitters)

### Task 2: Migrate blueprint-supabase.ts (40 calls)

**Files:**
- Modify: `services/blueprint-supabase.ts`

The pattern is mechanical. Every occurrence of:
- `console.error('Error doing X:', error)` → `logError('blueprint:doX', error)`
- `console.log('Info message:', val)` → `logWarn('blueprint:context', 'Info message', { val })`

- [ ] **Step 1: Add import**

Add to the top of `services/blueprint-supabase.ts`:
```typescript
import { logError, logWarn } from '../lib/logError';
```

- [ ] **Step 2: Replace all 40 console.* calls**

Apply these replacements throughout the file. The pattern for each:

| Before | After |
|--------|-------|
| `console.error('Error fetching prospect by slug:', error)` | `logError('blueprint:fetchBySlug', error, { slug })` |
| `console.error('Failed to fetch prospect by slug:', error)` | `logError('blueprint:fetchBySlug', error, { slug })` |
| `console.log('Prospect not found for slug:', slug)` | `logWarn('blueprint:fetchBySlug', 'Prospect not found', { slug })` |
| `console.error('Error fetching prospect by id:', error)` | `logError('blueprint:fetchById', error, { id })` |
| `console.error('Error listing prospects:', error)` | `logError('blueprint:listProspects', error)` |
| `console.error('Error updating prospect offer:', error)` | `logError('blueprint:updateOffer', error)` |
| `console.error('Error updating prospect slug:', error)` | `logError('blueprint:updateSlug', error)` |
| `console.error('Error creating prospect from landing:', error)` | `logError('blueprint:createFromLanding', error)` |
| `console.error('Error fetching prospect posts:', error)` | `logError('blueprint:fetchPosts', error)` |
| `console.error('Error updating finalized content:', error)` | `logError('blueprint:updateContent', error)` |
| `console.error('Error fetching prospect count:', error)` | `logError('blueprint:fetchCount', error)` |

Continue this pattern for all 40 calls. Context format: `blueprint:<functionName>`.

Include relevant local variables in the metadata object (e.g., `{ slug }`, `{ id }`, `{ email }`) — whatever is available in scope.

- [ ] **Step 3: Verify no console.* calls remain**

Run: `grep -n "console\.\(log\|error\|warn\)" services/blueprint-supabase.ts`
Expected: 0 results

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/services/blueprint-supabase.test.ts`
Expected: PASS (existing tests still pass)

- [ ] **Step 5: Commit**

```bash
git add services/blueprint-supabase.ts
git commit -m "refactor: replace console.* with logError/logWarn in blueprint service"
```

---

### Task 3: Migrate bootcamp-supabase.ts (35 calls)

**Files:**
- Modify: `services/bootcamp-supabase.ts`

- [ ] **Step 1: Add import**

```typescript
import { logError, logWarn } from '../lib/logError';
```

- [ ] **Step 2: Replace all 35 console.* calls**

Same mechanical pattern as Task 2. Context format: `bootcamp:<functionName>`.

| Before pattern | After pattern |
|--------|-------|
| `console.error('Bootcamp student verification failed:', error)` | `logError('bootcamp:verifyStudent', error, { email })` |
| `console.log('Bootcamp student not found:', email)` | `logWarn('bootcamp:verifyStudent', 'Student not found', { email })` |
| `console.error('Failed to fetch bootcamp checklist:', error)` | `logError('bootcamp:fetchChecklist', error)` |
| `console.error('Failed to fetch student progress:', error)` | `logError('bootcamp:fetchProgress', error)` |
| `console.error('Failed to fetch student survey:', error)` | `logError('bootcamp:fetchSurvey', error)` |
| `console.error('Failed to fetch setting ${key}:', error)` | `logError('bootcamp:fetchSetting', error, { key })` |
| `console.error('Invite code validation error:', error)` | `logError('bootcamp:validateInviteCode', error)` |

Continue for all 35. Include available local variables in metadata.

- [ ] **Step 3: Verify no console.* calls remain**

Run: `grep -n "console\.\(log\|error\|warn\)" services/bootcamp-supabase.ts`
Expected: 0 results

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add services/bootcamp-supabase.ts
git commit -m "refactor: replace console.* with logError/logWarn in bootcamp service"
```

---

### Task 4: Migrate supabase.ts (21 calls)

**Files:**
- Modify: `services/supabase.ts`

- [ ] **Step 1: Add import and replace all 21 console.* calls**

Same pattern. Context format: `gc:<functionName>` (this is the GC member service).

- [ ] **Step 2: Verify and commit**

```bash
grep -n "console\.\(log\|error\|warn\)" services/supabase.ts  # should be 0
git add services/supabase.ts
git commit -m "refactor: replace console.* with logError/logWarn in gc service"
```

---

### Task 5: Migrate affiliate-supabase.ts (15 calls)

**Files:**
- Modify: `services/affiliate-supabase.ts`

- [ ] **Step 1: Add import and replace all 15 console.* calls**

Context format: `affiliate:<functionName>`.

- [ ] **Step 2: Verify and commit**

```bash
grep -n "console\.\(log\|error\|warn\)" services/affiliate-supabase.ts  # should be 0
git add services/affiliate-supabase.ts
git commit -m "refactor: replace console.* with logError/logWarn in affiliate service"
```

---

### Task 6: Migrate remaining services (airtable, ai, command-center, tenant-branding)

**Files:**
- Modify: `services/airtable.ts` (4 calls, context: `airtable:<fn>`)
- Modify: `services/ai.ts` (context: `ai:<fn>`)
- Modify: `services/command-center.ts` (context: `commandCenter:<fn>`)
- Modify: `services/tenant-branding.ts` (context: `tenantBranding:<fn>`)

- [ ] **Step 1: Add imports and replace all console.* calls in each file**

- [ ] **Step 2: Verify and commit**

```bash
grep -rn "console\.\(log\|error\|warn\)" services/ | grep -v ".test."  # should be 0
git add services/
git commit -m "refactor: replace console.* with logError/logWarn in remaining services"
```

---

### Task 7: Fix proposal-supabase.ts fire-and-forget

**Files:**
- Modify: `services/proposal-supabase.ts`

- [ ] **Step 1: Fix the `.then(() => {})` pattern**

Find (around line 71-78):
```typescript
supabase
  .from('proposals')
  .update({ view_count: ..., last_viewed_at: ... })
  .eq('id', data.id)
  .then(() => {});
```

Replace with:
```typescript
supabase
  .from('proposals')
  .update({ view_count: (data.view_count || 0) + 1, last_viewed_at: new Date().toISOString() })
  .eq('id', data.id)
  .then(() => {})
  .catch((err) => logError('proposal:updateViewCount', err, { proposalId: data.id }));
```

Also add the `logError` import and replace any other console.* calls in this file.

- [ ] **Step 2: Commit**

```bash
git add services/proposal-supabase.ts
git commit -m "fix: log errors on fire-and-forget proposal view count update"
```

---

## Chunk 3: Migrate Context, Lib, and Components

### Task 8: Migrate context and lib files

**Files:**
- Modify: `context/AuthContext.tsx` (3 calls)
- Modify: `lib/sentry.ts` (2 calls — keep console.warn for "DSN not configured" since logError depends on Sentry)
- Modify: `lib/supabaseClient.ts`
- Modify: `lib/webVitals.ts`

- [ ] **Step 1: Add imports and replace console.* calls**

Context formats: `auth:<fn>`, `supabaseClient:<fn>`, `webVitals:<fn>`.

**Special case for `lib/sentry.ts`:** The `console.warn('Sentry DSN not configured...')` on line 8 should stay as `console.warn` since `logWarn` depends on Sentry being initialized. This is the one place raw console is acceptable.

- [ ] **Step 2: Verify and commit**

```bash
git add context/AuthContext.tsx lib/sentry.ts lib/supabaseClient.ts lib/webVitals.ts
git commit -m "refactor: replace console.* with logError/logWarn in context and lib"
```

---

### Task 9: Migrate admin components (17 files)

**Files:**
- Modify: `components/admin/blueprints/AdminBlueprintsPage.tsx`
- Modify: `components/admin/blueprints/BlueprintDetailPanel.tsx`
- Modify: `components/admin/blueprints/BlueprintSettingsModal.tsx`
- Modify: `components/admin/blueprints/ContentEditor.tsx`
- Modify: `components/admin/bootcamp/ai-tools/AdminAIToolsPage.tsx`
- Modify: `components/admin/bootcamp/cohorts/AdminBootcampCohortsPage.tsx`
- Modify: `components/admin/bootcamp/invite-codes/AdminBootcampInviteCodesPage.tsx`
- Modify: `components/admin/bootcamp/onboarding/AdminBootcampOnboardingPage.tsx`
- Modify: `components/admin/bootcamp/settings/AdminBootcampSettingsPage.tsx`
- Modify: `components/admin/bootcamp/students/AdminStudentsPage.tsx`
- Modify: `components/admin/bootcamp/students/GenerateBlueprintModal.tsx`
- Modify: `components/admin/lms/cohorts/AdminLmsCohortsPage.tsx`
- Modify: `components/admin/lms/curriculum/AdminLmsCurriculumPage.tsx`
- Modify: `components/admin/lms/curriculum/LmsContentItemModal.tsx`
- Modify: `components/admin/onboarding/AdminOnboardingPage.tsx`
- Modify: `components/admin/proposals/AdminProposalNew.tsx`
- Modify: `components/admin/tools/AdminToolsPage.tsx`

- [ ] **Step 1: Add import to each file and replace all console.* calls**

Context format for components: `AdminBlueprintsPage:<action>`, `AdminStudentsPage:<action>`, etc. Use the component name as the context prefix.

- [ ] **Step 2: Verify**

```bash
grep -rn "console\.\(log\|error\|warn\)" components/admin/ | grep -v ".test."  # should be 0
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/
git commit -m "refactor: replace console.* with logError/logWarn in admin components"
```

---

### Task 10: Migrate blueprint components (9 files)

**Files:**
- Modify: `components/blueprint/BlueprintLandingPage.tsx` (7 calls)
- Modify: `components/blueprint/BlueprintPage.tsx`
- Modify: `components/blueprint/BlueprintThankYou.tsx`
- Modify: `components/blueprint/ContentRoadmap.tsx`
- Modify: `components/blueprint/GenericOfferPage.tsx`
- Modify: `components/blueprint/LeadMagnets.tsx`
- Modify: `components/blueprint/LinkedInProfileMock.tsx`
- Modify: `components/blueprint/OfferPage.tsx`
- Modify: `components/blueprint/ProfileRewrite.tsx`

- [ ] **Step 1: Add imports and replace all console.* calls**

- [ ] **Step 2: Verify and commit**

```bash
grep -rn "console\.\(log\|error\|warn\)" components/blueprint/ | grep -v ".test."  # should be 0
git add components/blueprint/
git commit -m "refactor: replace console.* with logError/logWarn in blueprint components"
```

---

### Task 11: Migrate bootcamp components (16 files)

**Files:**
- Modify: `components/bootcamp/LessonView.tsx`
- Modify: `components/bootcamp/MyBlueprint.tsx`
- Modify: `components/bootcamp/MyPosts.tsx`
- Modify: `components/bootcamp/SubscriptionModal.tsx`
- Modify: `components/bootcamp/cold-email-recipes/generate/GeneratePanel.tsx`
- Modify: `components/bootcamp/cold-email-recipes/lists/ContactListManager.tsx`
- Modify: `components/bootcamp/connection-qualifier/ConnectionQualifier.tsx`
- Modify: `components/bootcamp/connection-qualifier/Phase2Progress.tsx`
- Modify: `components/bootcamp/connection-qualifier/RankingResults.tsx`
- Modify: `components/bootcamp/connection-qualifier/RunHistory.tsx`
- Modify: `components/bootcamp/email-enrichment/EmailEnrichmentPage.tsx`
- Modify: `components/bootcamp/infrastructure/wizard/CheckoutStep.tsx`
- Modify: `components/bootcamp/infrastructure/wizard/DomainPicker.tsx`
- Modify: `components/bootcamp/onboarding/OnboardingSurvey.tsx`
- Modify: `components/bootcamp/settings/BlueprintConnect.tsx`
- Modify: `pages/bootcamp/BootcampApp.tsx`

- [ ] **Step 1: Add imports and replace all console.* calls**

- [ ] **Step 2: Verify and commit**

```bash
grep -rn "console\.\(log\|error\|warn\)" components/bootcamp/ pages/bootcamp/ | grep -v ".test."  # should be 0
git add components/bootcamp/ pages/bootcamp/
git commit -m "refactor: replace console.* with logError/logWarn in bootcamp components"
```

---

### Task 12: Migrate remaining components (gc, chat, tam, shared, affiliate)

**Files:**
- Modify: `components/gc/GCLayout.tsx`
- Modify: `components/gc/campaigns/CampaignsPage.tsx`
- Modify: `components/gc/dashboard/DashboardHome.tsx`
- Modify: `components/gc/icp/ICPPage.tsx`
- Modify: `components/gc/onboarding/OnboardingPage.tsx`
- Modify: `components/gc/resources/ResourcesPage.tsx`
- Modify: `components/gc/tools/ToolsPage.tsx`
- Modify: `components/chat/ChatInterface.tsx`
- Modify: `components/tam/TamBuilder.tsx`
- Modify: `components/shared/ErrorBoundary.tsx`
- Modify: `components/affiliate/AffiliateSettingsPage.tsx`
- Modify: `hooks/useTamPipeline.ts`
- Modify: `hooks/useTamLinkedinCheck.ts`
- Modify: `hooks/useTamRefine.ts`

- [ ] **Step 1: Add imports and replace all console.* calls**

- [ ] **Step 2: Verify and commit**

```bash
grep -rn "console\.\(log\|error\|warn\)" components/ hooks/ pages/ context/ lib/ services/ | grep -v node_modules | grep -v ".test." | grep -v "lib/sentry.ts"  # should be 0 (only sentry.ts exception)
git add components/ hooks/
git commit -m "refactor: replace console.* with logError/logWarn in remaining components and hooks"
```

---

## Chunk 4: Final Verification & ESLint Rule

### Task 13: Add ESLint rule to prevent future console.* usage

**Files:**
- Modify: `.eslintrc.cjs` or `eslint.config.js` (whichever exists)

- [ ] **Step 1: Check which ESLint config exists**

Run: `ls .eslintrc* eslint.config.*`

- [ ] **Step 2: Add no-console rule**

Add to the rules section:
```javascript
'no-console': ['warn', { allow: [] }],
```

This will warn on any new `console.*` usage, guiding developers to use `logError`/`logWarn` instead.

**Exception:** `lib/sentry.ts` line 8 (`console.warn` for DSN not configured) — add an eslint-disable comment on that specific line:
```typescript
// eslint-disable-next-line no-console
console.warn('Sentry DSN not configured. Error tracking disabled.');
```

And in `lib/logError.ts` itself (which uses console.error/console.warn internally):
```typescript
// eslint-disable-next-line no-console
console.error(`[${context}]`, error, metadata ?? '');
```
```typescript
// eslint-disable-next-line no-console
console.warn(`[${context}]`, message, metadata ?? '');
```

- [ ] **Step 3: Run lint and fix any violations**

Run: `npm run lint`
Expected: 0 errors in source files (warnings only in sentry.ts/logError.ts with disable comments)

- [ ] **Step 4: Commit**

```bash
git add .eslintrc* eslint.config.* lib/logError.ts lib/sentry.ts
git commit -m "chore: add no-console ESLint rule, prevent future console.* usage"
```

---

### Task 14: Full verification sweep

- [ ] **Step 1: Verify zero console.* calls in source (excluding allowed exceptions)**

Run:
```bash
grep -rn "console\.\(log\|error\|warn\)" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v dist | grep -v ".test." | grep -v "supabase/functions/" | grep -v "lib/logError.ts" | grep -v "lib/sentry.ts"
```
Expected: 0 results

- [ ] **Step 2: Run full test suite**

Run: `npm run test:run` (or `npx vitest run`)
Expected: All tests PASS

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: spec 1 complete — all console.* replaced with structured logging"
```
