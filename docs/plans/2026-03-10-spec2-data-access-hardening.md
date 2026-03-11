# Spec 2: Data Access Hardening — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the dual Airtable/Supabase system, enforce typed update whitelists on all write services, route all component/hook DB access through the service layer, and consolidate duplicate fetch helpers.

**Architecture:** Four independent subsystems executed in order: (1) consolidate 4 duplicate GTM fetch helpers into one shared utility, (2) remove all Airtable code and test artifacts, (3) add `ALLOWED_UPDATE_FIELDS` whitelists + typed input interfaces to all services with DB writes, (4) extract direct `supabase` imports and raw `fetch()` from components/hooks into service functions.

**Tech Stack:** TypeScript, Vitest, Supabase JS client, React

**Repo:** `/Users/timlife/Documents/claude code/copy-of-gtm-os`
**Important:** No `src/` directory — files are at root level (e.g., `lib/`, `services/`, `components/`).

**Important context:**
- `lib/api-config.ts` already exists with `GTM_SYSTEM_URL`, `BLUEPRINT_BACKEND_URL`, `buildGtmHeaders()`
- 4 duplicate GTM fetch helpers: `gtmAdminFetch` (dfy-admin), `gtmFetch` (proposal-gtm), `gtmFetch` (intro-offer — different auth!), `funnelFetch` (lib/api/funnel.ts)
- Two auth patterns: `x-admin-key` header (admin routes) and Supabase session `Bearer` token (intro-offer)
- `verifyBootcampStudent` in `services/bootcamp-supabase.ts` already replaces Airtable's `verifyUser`
- `fetchStudentCurriculumAsLegacy` in `services/lms-supabase.ts` already replaces Airtable's `fetchCourseData`
- All `console.*` calls already replaced with `logError`/`logWarn` (Spec 1 complete)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/api/gtm-fetch.ts` | Create | Shared GTM System fetch helper with admin-key auth |
| `tests/lib/api/gtm-fetch.test.ts` | Create | Tests for gtm-fetch |
| `services/dfy-admin-supabase.ts` | Modify | Use shared gtmAdminFetch |
| `services/proposal-gtm.ts` | Modify | Use shared gtmAdminFetch |
| `lib/api/funnel.ts` | Modify | Use shared gtmAdminFetch |
| `services/airtable.ts` | Delete | Remove Airtable service |
| `tests/unit/services/airtable.test.ts` | Delete | Remove Airtable tests |
| `context/AuthContext.tsx` | Modify | Replace verifyUser → verifyBootcampStudent |
| `components/bootcamp/Login.tsx` | Modify | Remove Airtable fallback |
| `pages/bootcamp/BootcampApp.tsx` | Modify | Remove Airtable fallback |
| `types/gc-types.ts` | Modify | Remove Airtable artifacts |
| `lib/queryClient.ts` | Modify | Remove legacy Airtable query keys |
| `vercel.json` | Modify | Remove Airtable from CSP |
| `.env.example` | Modify | Remove Airtable env vars |
| `services/proposal-supabase.ts` | Modify | Add ProposalUpdateInput, ALLOWED_UPDATE_FIELDS |
| `tests/services/proposal-supabase.test.ts` | Create | Whitelist enforcement tests |
| `services/connection-ranker-supabase.ts` | Modify | Replace extraFields with typed RunStatusUpdate |
| `services/bootcamp-supabase.ts` | Modify | Add BootcampStudentInsertInput |
| `services/tam-supabase.ts` | Modify | Add invokeTamJob wrapper |
| `services/connection-ranker-supabase.ts` | Modify | Add edge function wrappers |
| `services/cold-email-recipes-supabase.ts` | Modify | Add invokeRecipeSteps wrapper |
| `services/subscription-supabase.ts` | Modify | Add createCheckoutSession wrapper |
| `services/infrastructure-supabase.ts` | Modify | Add createInfraCheckout + checkDomainAvailability |
| `services/dfy-admin-supabase.ts` | Modify | Add upgradeEngagement + createLinearCustomer |

---

## Chunk 1: Consolidate GTM Fetch Helpers

### Task 1: Create shared gtmAdminFetch utility + tests

**Files:**
- Create: `lib/api/gtm-fetch.ts`
- Create: `tests/lib/api/gtm-fetch.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/api/gtm-fetch.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock before import
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { gtmAdminFetch } from '../../../lib/api/gtm-fetch';

describe('gtmAdminFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GTM_SYSTEM_URL', 'https://test-gtm.example.com');
    vi.stubEnv('VITE_ADMIN_API_KEY', 'test-admin-key');
  });

  it('sends GET request with x-admin-key header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const result = await gtmAdminFetch('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-gtm.example.com/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-admin-key': 'test-admin-key',
        }),
      })
    );
    expect(result).toEqual({ data: 'test' });
  });

  it('sends POST request with body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await gtmAdminFetch('/api/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-gtm.example.com/api/test',
      expect.objectContaining({
        method: 'POST',
        body: '{"key":"value"}',
      })
    );
  });

  it('throws on non-OK response with error message from body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    });

    await expect(gtmAdminFetch('/api/test')).rejects.toThrow('Forbidden');
  });

  it('throws generic message when error body is unparseable', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(gtmAdminFetch('/api/test')).rejects.toThrow('GTM API request failed: 500');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/api/gtm-fetch.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create `lib/api/gtm-fetch.ts`**

```typescript
/** Shared GTM System API client.
 *  All requests to gtm-system (gtmconductor.com) go through this helper.
 *  Uses x-admin-key authentication (GC portal has no Supabase session).
 *  Never import fetch() directly in services — use this instead. */

const GTM_BASE = import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtmconductor.com';
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

/**
 * Authenticated fetch to GTM System API.
 * Attaches x-admin-key header and handles error responses.
 */
export async function gtmAdminFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GTM_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `GTM API request failed: ${res.status}`);
  }

  return res.json();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/api/gtm-fetch.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/api/gtm-fetch.ts tests/lib/api/gtm-fetch.test.ts
git commit -m "feat: create shared gtmAdminFetch utility with tests"
```

---

### Task 2: Migrate services to use shared gtmAdminFetch

**Files:**
- Modify: `services/dfy-admin-supabase.ts`
- Modify: `services/proposal-gtm.ts`
- Modify: `lib/api/funnel.ts`

- [ ] **Step 1: Update dfy-admin-supabase.ts**

Replace the local `gtmAdminFetch` function (lines 25-42) with an import:
```typescript
import { gtmAdminFetch } from '../lib/api/gtm-fetch';
```
Remove the local `GTM_API_BASE`, `ADMIN_API_KEY`, and `gtmAdminFetch` function definition.

- [ ] **Step 2: Update proposal-gtm.ts**

Replace the local `gtmFetch` function (lines 4-29) with:
```typescript
import { gtmAdminFetch } from '../lib/api/gtm-fetch';
```
Then rename all calls from `gtmFetch(...)` to `gtmAdminFetch(...)` throughout the file.
Remove the local `GTM_API_BASE`, `ADMIN_API_KEY`, and `gtmFetch` function definition.

- [ ] **Step 3: Update lib/api/funnel.ts**

Replace the local `funnelFetch` with shared utility:
```typescript
import { gtmAdminFetch } from './gtm-fetch';

export const funnelApi = {
  getStages: () => gtmAdminFetch('/api/funnel/stages'),
  getMetrics: (params?: { channel?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.channel) qs.set('channel', params.channel);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return gtmAdminFetch(`/api/funnel/metrics?${qs}`);
  },
  getAttribution: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return gtmAdminFetch(`/api/funnel/attribution?${qs}`);
  },
  getConfig: () => gtmAdminFetch('/api/funnel/config'),
  getQualification: async (email: string) => {
    const data = await gtmAdminFetch<{ qualification?: { qualified?: boolean; source_channel?: string }; iclosed_event_url?: string; phone?: string }>(
      `/api/funnel/qualification/${encodeURIComponent(email)}`
    );
    return {
      qualified: data.qualification?.qualified ?? true,
      iclosed_event_url: data.iclosed_event_url || '',
      phone: data.phone || '',
      source_channel: data.qualification?.source_channel || '',
    };
  },
  updateConfig: (key: string, value: string) =>
    gtmAdminFetch('/api/funnel/config', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),
};
```

**Note:** `intro-offer-supabase.ts` uses Supabase session auth (Bearer token), NOT x-admin-key. Leave that `gtmFetch` in place — it's a different auth pattern and will be addressed when intro offers get their own auth strategy.

- [ ] **Step 4: Verify no duplicate GTM fetch helpers remain**

Run: `grep -rn "async function gtmFetch\|async function gtmAdminFetch\|async function funnelFetch" services/ lib/ --include="*.ts" | grep -v node_modules`

Expected: Only `lib/api/gtm-fetch.ts` defines `gtmAdminFetch`. `intro-offer-supabase.ts` still has its own `gtmFetch` (intentional — different auth pattern).

- [ ] **Step 5: Commit**

```bash
git add services/dfy-admin-supabase.ts services/proposal-gtm.ts lib/api/funnel.ts
git commit -m "refactor: consolidate GTM fetch helpers into shared gtmAdminFetch"
```

---

## Chunk 2: Kill Airtable

### Task 3: Remove Airtable service and update auth

**Files:**
- Delete: `services/airtable.ts`
- Modify: `context/AuthContext.tsx`
- Modify: `components/bootcamp/Login.tsx`

- [ ] **Step 1: Read AuthContext.tsx and Login.tsx** to understand current Airtable usage

- [ ] **Step 2: Update AuthContext.tsx**

Replace the Airtable `verifyUser` import with `verifyBootcampStudent`:
```typescript
// REMOVE: import { verifyUser } from '../services/airtable';
import { verifyBootcampStudent } from '../services/bootcamp-supabase';
```

In the `loginBootcamp` function, replace `verifyUser(email)` with `verifyBootcampStudent(email)`. The returned shape may differ — `verifyBootcampStudent` returns a `BootcampStudent` object, not an Airtable record. Map the fields to match what the rest of the app expects for `user` state.

- [ ] **Step 3: Update Login.tsx**

Remove the Airtable import and fallback:
```typescript
// REMOVE: import { verifyUser } from '../../services/airtable';
```
Remove the fallback block that calls `verifyUser` when `verifyBootcampStudent` returns nothing. If the student isn't in Supabase, they're not registered.

- [ ] **Step 4: Delete services/airtable.ts**

```bash
rm services/airtable.ts
```

- [ ] **Step 5: Verify no imports of airtable service remain**

```bash
grep -rn "services/airtable" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test."
```
Expected: 0 results

- [ ] **Step 6: Commit**

```bash
git add -A services/airtable.ts context/AuthContext.tsx components/bootcamp/Login.tsx
git commit -m "refactor: remove Airtable auth, use Supabase-only bootcamp verification"
```

---

### Task 4: Remove Airtable from BootcampApp and clean up artifacts

**Files:**
- Modify: `pages/bootcamp/BootcampApp.tsx`
- Modify: `types/gc-types.ts`
- Modify: `lib/queryClient.ts`
- Modify: `vercel.json`
- Modify: `.env.example`

- [ ] **Step 1: Update BootcampApp.tsx**

Remove the `fetchCourseData` import from airtable:
```typescript
// REMOVE: import { fetchCourseData } from '../../services/airtable';
```

Remove the Airtable fallback block (approximately lines 247-252):
```typescript
// REMOVE this pattern:
// let data = await fetchStudentCurriculumAsLegacy(cohortName, activeUser.email);
// if (!data.weeks.length) {
//   data = await fetchCourseData(cohortName, activeUser.email);
// }
// KEEP only:
// const data = await fetchStudentCurriculumAsLegacy(cohortName, activeUser.email);
```

Remove any comments referencing "legacy Airtable".

- [ ] **Step 2: Clean up types/gc-types.ts**

Remove ONLY the Airtable-specific items: `GC_TABLE_IDS` constant, `AirtableRecord<T>` generic interface, and any `*Fields` interfaces that were Airtable field-name maps (e.g., `GCMemberFields`). **Do NOT remove** the Supabase-era interfaces like `GCMember`, `ToolAccess`, `Campaign`, `Resource`, `MemberICP`, etc. — those are actively used by 15+ files.

Update JSDoc header to remove "Airtable" references. First read the file to identify exactly what to remove vs keep.

- [ ] **Step 3: Clean up lib/queryClient.ts**

Remove the `// Bootcamp (Legacy - Airtable)` comment block and the 4 legacy query key factories: `bootcampUser`, `bootcampModules`, `bootcampLessons`, `bootcampProgress`.

First verify they're unused: `grep -rn "bootcampUser\|bootcampModules\|bootcampLessons\|bootcampProgress" --include="*.ts" --include="*.tsx" | grep -v queryClient.ts`

- [ ] **Step 4: Remove Airtable from vercel.json CSP**

In `vercel.json`, find the `Content-Security-Policy` header and remove `https://api.airtable.com` from the `connect-src` directive.

- [ ] **Step 5: Remove Airtable env vars from .env.example**

Remove `VITE_AIRTABLE_API_KEY` and `VITE_AIRTABLE_BASE_ID` lines.

- [ ] **Step 6: Commit**

```bash
git add pages/bootcamp/BootcampApp.tsx types/gc-types.ts lib/queryClient.ts vercel.json .env.example
git commit -m "refactor: remove all Airtable artifacts (CSP, types, env vars, fallbacks)"
```

---

### Task 5: Clean up Airtable test artifacts

**Files:**
- Delete: `tests/unit/services/airtable.test.ts`
- Modify: `mocks/handlers.ts` (remove Airtable MSW handlers)
- Modify: `tests/setup.ts` (remove Airtable env stubs)
- Modify: `tests/setup-msw.ts` (remove Airtable env stubs if present)
- Modify: E2E helpers and specs (remove mockAirtableQuery)

- [ ] **Step 1: Delete airtable test file**

```bash
rm tests/unit/services/airtable.test.ts
```

- [ ] **Step 2: Clean up MSW handlers**

Read `mocks/handlers.ts` and remove all `http.get('https://api.airtable.com/...')` handlers. Keep non-Airtable handlers.

- [ ] **Step 3: Clean up test setup files**

In `tests/setup.ts` and `tests/setup-msw.ts`, remove:
```typescript
vi.stubEnv('VITE_AIRTABLE_API_KEY', '...');
vi.stubEnv('VITE_AIRTABLE_BASE_ID', '...');
```

- [ ] **Step 4: Clean up E2E files**

Read `e2e/helpers/index.ts` and remove `mockAirtableQuery()` function. In the 3 E2E specs that call it (`bootcamp-login.spec.ts`, `bootcamp-curriculum.spec.ts`, `bootcamp-tools.spec.ts`):
- Remove the `import { mockAirtableQuery }` line
- Remove the `await mockAirtableQuery(page, [])` call entirely — these were mocking empty Airtable results as a no-op. Since Airtable is gone, there's nothing to mock. The tests already mock Supabase responses separately.

- [ ] **Step 5: Run tests to verify nothing broke**

```bash
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: remove all Airtable test artifacts and mocks"
```

---

## Chunk 3: Update Whitelists

### Task 6: Fix proposal-supabase.ts — typed updates with whitelist

**Files:**
- Modify: `services/proposal-supabase.ts`
- Create: `tests/services/proposal-update-whitelist.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/services/proposal-update-whitelist.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockUpdate = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    })),
  },
}));

import { updateProposal } from '../../services/proposal-supabase';

describe('updateProposal whitelist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnThis();
    mockEq.mockReturnThis();
    mockSelect.mockReturnThis();
    mockSingle.mockResolvedValue({ data: { id: '1', slug: 'test' }, error: null });
  });

  it('passes through allowed fields', async () => {
    await updateProposal('123', {
      client_name: 'New Name',
      headline: 'New Headline',
      status: 'published',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        client_name: 'New Name',
        headline: 'New Headline',
        status: 'published',
      })
    );
  });

  it('strips disallowed fields', async () => {
    await updateProposal('123', {
      client_name: 'Name',
      id: 'injected-id',
      created_at: '2020-01-01',
      created_by: 'hacker',
    } as any);

    const calledWith = mockUpdate.mock.calls[0][0];
    expect(calledWith).not.toHaveProperty('id');
    expect(calledWith).not.toHaveProperty('created_at');
    expect(calledWith).not.toHaveProperty('created_by');
    expect(calledWith).toHaveProperty('client_name', 'Name');
  });

  it('always sets updated_at', async () => {
    await updateProposal('123', { headline: 'Test' });

    const calledWith = mockUpdate.mock.calls[0][0];
    expect(calledWith).toHaveProperty('updated_at');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/services/proposal-update-whitelist.test.ts`
Expected: FAIL — current implementation passes all fields through

- [ ] **Step 3: Implement the whitelist**

In `services/proposal-supabase.ts`, replace:

```typescript
// OLD: accepts anything
export async function updateProposal(
  id: string,
  updates: Partial<Record<string, unknown>>
): Promise<Proposal | null> {
  const { data, error } = await supabase
    .from('proposals')
    .update({ ...updates, updated_at: new Date().toISOString() })
```

With:

```typescript
/** Fields that callers are permitted to update on proposals. */
const PROPOSAL_ALLOWED_UPDATE_FIELDS = [
  'status',
  'client_name',
  'client_title',
  'client_company',
  'client_logo_url',
  'client_brand_color',
  'client_website',
  'headline',
  'executive_summary',
  'about_us',
  'client_snapshot',
  'goals',
  'services',
  'roadmap',
  'pricing',
  'next_steps',
  'transcript_text',
  'transcript_source',
  'additional_notes',
  'monthly_rate_cents',
] as const;

type ProposalUpdateField = (typeof PROPOSAL_ALLOWED_UPDATE_FIELDS)[number];

/** Typed proposal update input — only whitelisted fields allowed. */
export type ProposalUpdateInput = Partial<Record<ProposalUpdateField, unknown>>;

function filterAllowedFields(input: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set<string>(PROPOSAL_ALLOWED_UPDATE_FIELDS);
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (allowed.has(key)) filtered[key] = input[key];
  }
  return filtered;
}

export async function updateProposal(
  id: string,
  updates: ProposalUpdateInput
): Promise<Proposal | null> {
  const filtered = filterAllowedFields(updates as Record<string, unknown>);
  filtered.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('proposals')
    .update(filtered)
    .eq('id', id)
    .select(PROPOSAL_COLUMNS)
    .single();

  if (error || !data) return null;
  return mapProposal(data as Record<string, unknown>);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/services/proposal-update-whitelist.test.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add services/proposal-supabase.ts tests/services/proposal-update-whitelist.test.ts
git commit -m "fix: add ALLOWED_UPDATE_FIELDS whitelist to proposal updates"
```

---

### Task 7: Fix connection-ranker-supabase.ts — typed extraFields

**Files:**
- Modify: `services/connection-ranker-supabase.ts`

- [ ] **Step 1: Read the file** to find all callers of `updateRunStatus` with `extraFields`

Search: `grep -rn "updateRunStatus" --include="*.ts" --include="*.tsx" | grep -v ".test."`

Identify what fields are actually passed in `extraFields` across all call sites.

- [ ] **Step 2: Replace `extraFields` with typed interface**

Replace:
```typescript
export async function updateRunStatus(
  runId: string,
  status: RunStatus,
  extraFields?: Record<string, unknown>
): Promise<void> {
  const update: Record<string, unknown> = { status, ...extraFields };
```

With:
```typescript
/** Typed extra fields that can accompany a status update. */
interface RunStatusExtra {
  phase1_completed_at?: string;
  phase2_total?: number;
  phase2_completed_at?: string;
  completed_at?: string;
  total_connections?: number;
  tier_definite_keep?: number;
  tier_strong_keep?: number;
  tier_borderline?: number;
  tier_likely_remove?: number;
  tier_definite_remove?: number;
  tier_protected?: number;
}

export async function updateRunStatus(
  runId: string,
  status: RunStatus,
  extraFields?: RunStatusExtra
): Promise<void> {
  const update: Record<string, unknown> = { status, ...extraFields };
```

The interface should list ONLY the fields that are actually passed by callers. Read all call sites first.

- [ ] **Step 3: Verify callers still type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add services/connection-ranker-supabase.ts
git commit -m "fix: replace untyped extraFields with RunStatusExtra interface"
```

---

### Task 8: Add typed insert inputs to bootcamp + affiliate services

**Files:**
- Modify: `services/bootcamp-supabase.ts`
- Modify: `services/affiliate-supabase.ts`

- [ ] **Step 1: Read bootcamp-supabase.ts** to find `createBootcampStudent` and its `Partial<BootcampStudent>` parameter

- [ ] **Step 2: Create BootcampStudentInsertInput**

Replace `Partial<BootcampStudent>` with a named interface that lists only the fields callers should provide:

```typescript
/** Fields allowed when creating a new bootcamp student. */
export interface BootcampStudentInsertInput {
  email: string;
  first_name?: string;
  last_name?: string;
  cohort?: string;
  invite_code?: string;
  access_level?: string;
}
```

Read all callers of `createBootcampStudent` to determine the exact field set.

- [ ] **Step 3: Read affiliate-supabase.ts** and do the same for `createAffiliateAsset`

Replace `Partial<AffiliateAsset>` with `AffiliateAssetInsertInput` listing only allowed fields.

- [ ] **Step 4: Verify callers still type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add services/bootcamp-supabase.ts services/affiliate-supabase.ts
git commit -m "refactor: add typed insert inputs to bootcamp and affiliate services"
```

---

## Chunk 4: Route Components Through Services

### Task 9: Extract supabase.functions.invoke from TAM hooks

**Files:**
- Modify: `services/tam-supabase.ts`
- Modify: `hooks/useTamPipeline.ts`
- Modify: `hooks/useTamRefine.ts`
- Modify: `hooks/useTamLinkedinCheck.ts`

- [ ] **Step 1: Read the 3 hooks** to understand what edge functions they invoke

- [ ] **Step 2: Add edge function wrapper to tam-supabase.ts**

```typescript
// ─── Edge Function Invocations ─────

import { supabase } from '../lib/supabaseClient';

export async function invokeTamJob(
  jobId: string,
  jobType: string,
  payload: Record<string, unknown>
): Promise<{ data: unknown; error: unknown }> {
  return supabase.functions.invoke('tam-run-job', {
    body: { jobId, jobType, ...payload },
  });
}
```

Adapt the function signature to match what the hooks actually pass.

- [ ] **Step 3: Update the 3 hooks**

Replace direct `supabase.functions.invoke('tam-run-job', ...)` with `invokeTamJob(...)`.
Remove `import { supabase } from '../lib/supabaseClient'` from each hook.

- [ ] **Step 4: Verify no direct supabase imports in TAM hooks**

```bash
grep -n "supabaseClient" hooks/useTamPipeline.ts hooks/useTamRefine.ts hooks/useTamLinkedinCheck.ts
```
Expected: 0 results

- [ ] **Step 5: Commit**

```bash
git add services/tam-supabase.ts hooks/useTamPipeline.ts hooks/useTamRefine.ts hooks/useTamLinkedinCheck.ts
git commit -m "refactor: route TAM hooks through service layer"
```

---

### Task 10: Extract supabase.functions.invoke from qualifier, recipes, checkout components

**Files:**
- Modify: `services/connection-ranker-supabase.ts`
- Modify: `services/cold-email-recipes-supabase.ts`
- Modify: `services/subscription-supabase.ts`
- Modify: `services/infrastructure-supabase.ts`
- Modify: `components/bootcamp/connection-qualifier/ConnectionQualifier.tsx`
- Modify: `components/bootcamp/connection-qualifier/Phase2Progress.tsx`
- Modify: `components/bootcamp/cold-email-recipes/generate/GeneratePanel.tsx`
- Modify: `components/bootcamp/SubscriptionModal.tsx`
- Modify: `components/bootcamp/infrastructure/wizard/CheckoutStep.tsx`

- [ ] **Step 1: Read each component** to understand what edge functions they invoke

- [ ] **Step 2: Add service wrappers**

For each component's `supabase.functions.invoke` call, add a corresponding function to the appropriate service file. Examples:

In `services/connection-ranker-supabase.ts`:
```typescript
export async function invokeQualifyConnections(runId: string, connections: unknown[], criteria: unknown) {
  return supabase.functions.invoke('qualify-connections', { body: { runId, connections, criteria } });
}

export async function invokeEnrichConnection(runId: string, connectionId: string) {
  return supabase.functions.invoke('rank-connections-enrich', { body: { runId, connectionId } });
}
```

In `services/cold-email-recipes-supabase.ts`:
```typescript
export async function invokeRecipeSteps(recipeId: string, contactListId: string) {
  return supabase.functions.invoke('run-recipe-steps', { body: { recipeId, contactListId } });
}
```

In `services/subscription-supabase.ts`:
```typescript
export async function createCheckoutSession(studentId: string, priceId: string) {
  return supabase.functions.invoke('create-checkout', { body: { studentId, priceId } });
}
```

In `services/infrastructure-supabase.ts`:
```typescript
export async function createInfraCheckout(provisionId: string) {
  return supabase.functions.invoke('create-infra-checkout', { body: { provisionId } });
}
```

Read each component first to get the exact payload shapes.

- [ ] **Step 3: Update components** to import from services instead of supabaseClient

- [ ] **Step 4: Verify no direct supabase imports remain in these components**

```bash
grep -n "supabaseClient" components/bootcamp/connection-qualifier/ConnectionQualifier.tsx components/bootcamp/connection-qualifier/Phase2Progress.tsx components/bootcamp/cold-email-recipes/generate/GeneratePanel.tsx components/bootcamp/SubscriptionModal.tsx components/bootcamp/infrastructure/wizard/CheckoutStep.tsx
```
Expected: 0 results

- [ ] **Step 5: Commit**

```bash
git add services/ components/bootcamp/
git commit -m "refactor: route component edge function calls through service layer"
```

---

### Task 11: Extract raw fetch from DfyEngagementDetail and other components

**Files:**
- Modify: `services/dfy-admin-supabase.ts`
- Modify: `components/admin/dfy/DfyEngagementDetail.tsx`
- Modify: `services/affiliate-supabase.ts`
- Modify: `components/affiliate/AffiliateOnboard.tsx`
- Modify: `components/affiliate/AffiliateSettingsPage.tsx`
- Modify: `components/bootcamp/infrastructure/wizard/DomainPicker.tsx`

- [ ] **Step 1: Read DfyEngagementDetail.tsx** — find the 3 inline fetch calls with raw `x-admin-key`

- [ ] **Step 2: Add service functions to dfy-admin-supabase.ts**

```typescript
export async function upgradeEngagement(engagementId: string): Promise<void> {
  await gtmAdminFetch(`/api/dfy/admin/engagements/${engagementId}/upgrade`, { method: 'POST' });
}

export async function createLinearCustomer(engagementId: string, options?: { syncDeliverables?: boolean }): Promise<void> {
  await gtmAdminFetch(`/api/dfy/admin/engagements/${engagementId}/create-customer`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}
```

Read the actual fetch calls to get the exact API paths and payloads.

- [ ] **Step 3: Update DfyEngagementDetail.tsx** — replace inline fetches with service calls

- [ ] **Step 4: Add affiliate edge function wrappers**

In `services/affiliate-supabase.ts`:
```typescript
export async function createConnectAccount(email: string) {
  return supabase.functions.invoke('create-connect-account', { body: { email } });
}

export async function getConnectLoginLink(affiliateId: string) {
  return supabase.functions.invoke('create-connect-login-link', { body: { affiliateId } });
}
```

- [ ] **Step 5: Update AffiliateOnboard.tsx and AffiliateSettingsPage.tsx** to use service functions

- [ ] **Step 6: Extract DomainPicker fetch to infrastructure service**

Read `DomainPicker.tsx`, find the `fetch` to `/api/infrastructure/domains/check`, and move it to `services/infrastructure-supabase.ts`:
```typescript
export async function checkDomainAvailability(domain: string): Promise<DomainCheckResult> {
  // Use buildGtmHeaders from lib/api-config.ts for x-infra-key auth
}
```

- [ ] **Step 7: Verify no raw fetch or supabaseClient imports in modified components**

```bash
grep -n "supabaseClient\|x-admin-key" components/admin/dfy/DfyEngagementDetail.tsx components/affiliate/AffiliateOnboard.tsx components/affiliate/AffiliateSettingsPage.tsx components/bootcamp/infrastructure/wizard/DomainPicker.tsx
```
Expected: 0 results

- [ ] **Step 8: Commit**

```bash
git add services/ components/
git commit -m "refactor: extract raw fetch and supabase imports from components into services"
```

---

### Task 12: Final verification

- [ ] **Step 1: Verify zero direct supabase imports in components/hooks**

```bash
grep -rn "from.*supabaseClient" components/ hooks/ --include="*.ts" --include="*.tsx" | grep -v ".test."
```
Expected: 0 results

- [ ] **Step 2: Verify zero raw x-admin-key and raw edge function calls in components**

```bash
grep -rn "x-admin-key" components/ --include="*.ts" --include="*.tsx" | grep -v ".test."
grep -rn "VITE_SUPABASE_URL.*functions/v1\|functions/v1/" components/ --include="*.ts" --include="*.tsx" | grep -v ".test."
```
Expected: 0 results for both

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 4: Run tests**

```bash
npx vitest run
```
Expected: All pass (excluding pre-existing failures)

- [ ] **Step 5: Run build**

```bash
npm run build
```
Expected: Success

- [ ] **Step 6: Commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: spec 2 complete — data access hardened"
```
