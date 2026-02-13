# DiscoLike Two-Phase Hybrid Workflow

**Date**: 2026-02-13
**Status**: Approved

## Problem

The TAM Builder's DiscoLike integration uses keyword-based discovery (`/v1/discover?keyword=X`), which treats DiscoLike like a search engine. DiscoLike is actually a **classifier** — it compares website text against a search vector built from seed domains. The correct approach is **domain consensus** (`/v1/discover?domain=A&domain=B&...`), which finds companies similar to the seed set.

Additionally, the founder recommends a **thumbs up/down feedback loop** to refine the search vector iteratively. This is not implemented.

## Solution

Two-phase approach:

1. **Fix pipeline sourcing** — replace keyword discovery with domain consensus
2. **Add refine loop** — thumbs up/down on dashboard companies, "Refine Lookalikes" button re-runs discovery with expanded seed set

## Phase 1: Edge Function Fix

Rewrite `sourceFromDiscolike()` in `tam-run-job/index.ts`:

- Remove BizData keyword extraction step
- Remove `discolikeDiscover()` keyword-based function
- Single API call: `GET /v1/discover?domain=A&domain=B&...&country=US&max_records=200&min_score=50`
- Pass all seed domains (up to 10) as multiple `domain` query params
- Parse `similarity` field from each result
- Store in `tam_companies` with `similarity_score` column
- If no seed domains provided, skip DiscoLike (it requires domains)
- Update API key to new value: `35a8fac1-4628-4d8a-93eb-3dedf3e9d588`

## Phase 2: Refine Loop

### Database Changes

```sql
ALTER TABLE tam_companies ADD COLUMN IF NOT EXISTS similarity_score REAL;
ALTER TABLE tam_companies ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IN ('liked', 'disliked'));
```

### New Job Type: `refine_discolike`

Added to `tam_job_queue` as a new step type. Handler in `tam-run-job/index.ts`:

1. Fetch original seed domains from project's ICP profile
2. Fetch all DiscoLike-sourced companies with `feedback = 'liked'` — add their domains to seed set
3. Fetch all DiscoLike-sourced companies with `feedback = 'disliked'` — exclude their domains from results
4. Run domain consensus discovery with expanded seed set
5. Insert new companies (deduped against existing project companies)
6. Report results summary

### Dashboard UI

**Company rows** (DiscoLike-sourced):
- Thumbs-up / thumbs-down icons after source badge
- Toggle: null → liked, null → disliked, liked/disliked → null
- Immediate save via mutation

**Dashboard header** (when DiscoLike companies exist):
- "Refine Lookalikes" button with refresh icon
- Badge showing "N liked, M disliked"
- Creates `refine_discolike` job on click
- Disabled while refine job is running

### Service Layer

- `updateCompanyFeedback(companyId, feedback)` — update feedback column
- `createRefineJob(projectId)` — create refine_discolike job in queue
- `useTamRefine()` hook — manages refine job state, polls for completion

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/tam-run-job/index.ts` | Rewrite `sourceFromDiscolike()`, add `handleRefineDiscolike()`, update API key |
| `supabase/migrations/YYYYMMDD_discolike_refine.sql` | Add `similarity_score`, `feedback` columns, `refine_discolike` job type |
| `components/tam/TamDashboard.tsx` | Add thumbs up/down icons, Refine button |
| `components/tam/CompanyRow.tsx` (or inline) | Feedback toggle UI |
| `services/tam-supabase.ts` | Add `updateCompanyFeedback()`, `createRefineJob()` |
| `hooks/useTamPipeline.ts` | Support `refine_discolike` job type |
| `types/tam-types.ts` | Add feedback field to TamCompany type, refine job type |
