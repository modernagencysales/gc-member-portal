# TAM Pipeline Backend Migration Design

## Problem

The TAM builder's `tam-run-job` Edge Function processes all pipeline steps synchronously. Long-running steps (qualify: 150 companies x Claude API) exceed the Supabase Edge Function wall clock limit (~150s), causing "Failed to send a request to the Edge Function" errors.

## Decision

Move long-running handlers to Trigger.dev tasks in gtm-system. Keep `sourceCompanies` in the Edge Function (completes in ~10s). Add parallel processing for speed.

## Architecture

```
Frontend (copy-of-gtm-os)
  |  polls tam_job_queue every 3s (unchanged)
  v
Edge Function (tam-run-job)
  |  sourceCompanies: runs inline (fast)
  |  qualify/findContacts/checkLinkedin/refineDiscolike:
  |    marks job "running", fires gtm-system API, returns immediately
  v
gtm-system
  POST /api/tam/run  (authenticated, triggers Trigger.dev task)
  |
  v
Trigger.dev tasks
  tam-qualify-companies     10 concurrent Claude calls per batch
  tam-find-contacts         5 concurrent Prospeo + 10 concurrent find-email
  tam-check-linkedin        5 concurrent Bright Data calls
  tam-refine-discolike      single Discolike batch call
  |
  All tasks update tam_job_queue.progress directly via Supabase
```

## Trigger.dev Task Specs

### tam-qualify-companies
- Input: `{ jobId, projectId }`
- Fetches companies with `qualification_status = 'pending'`
- 10 concurrent Claude Sonnet 4 calls (Promise.all batches)
- Updates `tam_companies.qualification_status` + `qualification_reason` per company
- Updates `tam_job_queue.progress` after each batch
- 150 companies = ~15 batches x 3s = ~45 seconds (was ~7.5 min)
- maxDuration: 600s, retry: maxAttempts 2

### tam-find-contacts
- Input: `{ jobId, projectId }`
- Fetches qualified companies with domains
- 5 concurrent Prospeo person searches
- 10 concurrent find-email enrichments
- Inserts contacts, updates progress per batch
- maxDuration: 1800s, retry: maxAttempts 2

### tam-check-linkedin
- Input: `{ jobId, projectId }`
- Fetches contacts with linkedin_url
- 5 concurrent Bright Data lookups
- Updates `linkedin_active` per contact
- maxDuration: 1800s, retry: maxAttempts 2

### tam-refine-discolike
- Input: `{ jobId, projectId }`
- Single Discolike API call + insert new companies
- maxDuration: 300s, retry: maxAttempts 2

## API Route

`POST /api/tam/run` in gtm-system:
- Auth: `x-api-key` header validated against `SERVICE_API_KEY`
- Body: `{ jobId, jobType, projectId }`
- Triggers appropriate Trigger.dev task
- Returns `{ triggered: true, taskId }`

## Edge Function Changes

Long-running job types dispatch to gtm-system instead of processing inline:
```typescript
const triggerRes = await fetch(`${gtmSystemUrl}/api/tam/run`, {
  method: 'POST',
  headers: { 'x-api-key': serviceApiKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobId, jobType: job.job_type, projectId: job.project_id }),
});
```

Returns immediately. Trigger.dev task handles processing + progress updates.

## Frontend Changes

None. Polling mechanism already reads `tam_job_queue` for progress/status.

## Environment Variables Needed

gtm-system Trigger.dev env:
- `ANTHROPIC_API_KEY` (for qualify step Claude calls)
- `PROSPEO_API_KEY` (for find contacts)
- `BRIGHT_DATA_API_KEY` (for LinkedIn check)
- `DISCOLIKE_API_KEY` (for refine)

gtm-system Railway env:
- `SERVICE_API_KEY` (already exists, for API route auth)

Edge Function secrets:
- `GTM_SYSTEM_URL` (already exists)
- `SERVICE_API_KEY` (already exists)
