# TAM Pipeline Backend Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move long-running TAM pipeline handlers (qualify, findContacts, checkLinkedin, refineDiscolike) from Supabase Edge Functions to Trigger.dev tasks in gtm-system, with parallel processing for speed.

**Architecture:** Edge Function stays as thin dispatcher for long-running jobs — marks job "running", POSTs to gtm-system `/api/tam/run`, returns immediately. Trigger.dev tasks process work with parallel batches, updating `tam_job_queue.progress` directly. Frontend polling unchanged.

**Tech Stack:** Next.js 16 (gtm-system), Trigger.dev v4.3.3, Supabase, Claude API, Prospeo API, Bright Data API, Discolike API

---

### Task 1: Create TAM helper module in gtm-system

**Files:**
- Create: `src/lib/tam/helpers.ts`

**Step 1: Create the helpers file**

This module contains shared utilities used by all TAM Trigger.dev tasks: Supabase client, progress updater, domain normalization, batch insert.

```typescript
// src/lib/tam/helpers.ts
import { createClient } from '@supabase/supabase-js';
import { logger } from '@trigger.dev/sdk/v3';

export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function updateJobProgress(jobId: string, progress: number) {
  const supabase = getSupabase();
  await supabase.from('tam_job_queue').update({ progress }).eq('id', jobId);
}

export async function markJobCompleted(
  jobId: string,
  resultSummary: Record<string, unknown>
) {
  const supabase = getSupabase();
  await supabase
    .from('tam_job_queue')
    .update({
      status: 'completed',
      progress: 100,
      result_summary: resultSummary,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

export async function markJobFailed(jobId: string, errorMessage: string) {
  const supabase = getSupabase();
  await supabase
    .from('tam_job_queue')
    .update({
      status: 'failed',
      result_summary: { error: errorMessage },
    })
    .eq('id', jobId);
}

export function normalizeDomain(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.split('/')[0];
  d = d.split(':')[0];
  return d || null;
}

// Process items in parallel batches
export async function parallelBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}
```

**Step 2: Commit**

```bash
git add src/lib/tam/helpers.ts
git commit -m "feat(tam): add shared TAM helper module"
```

---

### Task 2: Create tam-qualify-companies Trigger.dev task

**Files:**
- Create: `src/trigger/tam-qualify-companies.ts`

**Step 1: Create the task file**

Port the `handleQualify` logic from `copy-of-gtm-os/supabase/functions/tam-run-job/index.ts:683-785`. Key change: use `parallelBatch` with concurrency=10 instead of sequential processing.

```typescript
// src/trigger/tam-qualify-companies.ts
import { task, logger } from '@trigger.dev/sdk/v3';
import {
  getSupabase,
  updateJobProgress,
  markJobCompleted,
  markJobFailed,
  parallelBatch,
} from '@/lib/tam/helpers';

interface QualifyPayload {
  jobId: string;
  projectId: string;
}

async function qualifyCompany(
  company: Record<string, unknown>,
  icpProfile: Record<string, unknown>,
  anthropicKey: string
): Promise<{ id: string; status: string; reason: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `Evaluate if this company matches our ICP. Respond with JSON only: {"qualified": true/false, "reason": "brief reason"}

Company: ${company.name}
Domain: ${company.domain || 'unknown'}
Description: ${company.description || 'none'}
Industry: ${company.industry || 'unknown'}
Employee count: ${company.employee_count || 'unknown'}
Location: ${company.location || 'unknown'}

ICP Criteria:
- Business model: ${(icpProfile as any).businessModel || 'any'}
- What they sell: ${(icpProfile as any).whatYouSell || 'not specified'}
- Target industries: ${(icpProfile as any).industryKeywords?.join(', ') || 'any'}
- Employee size: ${(icpProfile as any).employeeSizeRanges?.join(', ') || 'any'}
- Geography: ${(icpProfile as any).geography || 'any'}
- Special criteria: ${(icpProfile as any).specialCriteria || 'none'}`,
          },
        ],
      }),
    });

    const result = await response.json();
    const content = result.content?.[0]?.text || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: company.id as string,
        status: parsed.qualified ? 'qualified' : 'disqualified',
        reason: parsed.reason || '',
      };
    }

    return {
      id: company.id as string,
      status: 'pending',
      reason: 'Needs review (AI response parse error)',
    };
  } catch {
    return {
      id: company.id as string,
      status: 'pending',
      reason: 'Needs review (API error)',
    };
  }
}

export const tamQualifyCompanies = task({
  id: 'tam-qualify-companies',
  retry: { maxAttempts: 2 },
  maxDuration: 600,
  run: async (payload: QualifyPayload) => {
    const { jobId, projectId } = payload;
    const supabase = getSupabase();

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      await markJobFailed(jobId, 'ANTHROPIC_API_KEY not configured');
      return;
    }

    try {
      // Load project ICP profile
      const { data: project } = await supabase
        .from('tam_projects')
        .select('icp_profile')
        .eq('id', projectId)
        .single();

      const icpProfile = project?.icp_profile || {};

      // Fetch pending companies
      const { data: companies } = await supabase
        .from('tam_companies')
        .select(
          'id, name, domain, industry, employee_count, location, description, digital_footprint_score'
        )
        .eq('project_id', projectId)
        .eq('qualification_status', 'pending');

      if (!companies || companies.length === 0) {
        await markJobCompleted(jobId, { qualified: 0, disqualified: 0, total: 0 });
        return;
      }

      logger.info('Starting qualification', {
        projectId,
        companyCount: companies.length,
      });

      let qualified = 0;
      let disqualified = 0;
      const CONCURRENCY = 10;

      // Process in parallel batches of 10
      for (let i = 0; i < companies.length; i += CONCURRENCY) {
        const batch = companies.slice(i, i + CONCURRENCY);

        const results = await Promise.all(
          batch.map((company) => qualifyCompany(company, icpProfile, anthropicKey))
        );

        // Update each company in DB
        for (const result of results) {
          await supabase
            .from('tam_companies')
            .update({
              qualification_status: result.status,
              qualification_reason: result.reason,
            })
            .eq('id', result.id);

          if (result.status === 'qualified') qualified++;
          else if (result.status === 'disqualified') disqualified++;
        }

        const progress = Math.round(((i + batch.length) / companies.length) * 100);
        await updateJobProgress(jobId, progress);
      }

      // Update project status
      await supabase
        .from('tam_projects')
        .update({ status: 'enriching' })
        .eq('id', projectId);

      await markJobCompleted(jobId, {
        qualified,
        disqualified,
        total: companies.length,
      });

      logger.info('Qualification complete', { qualified, disqualified, total: companies.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Qualification failed', { error: message });
      await markJobFailed(jobId, message);
    }
  },
});
```

**Step 2: Commit**

```bash
git add src/trigger/tam-qualify-companies.ts
git commit -m "feat(tam): add tam-qualify-companies Trigger.dev task with parallel processing"
```

---

### Task 3: Create tam-find-contacts Trigger.dev task

**Files:**
- Create: `src/trigger/tam-find-contacts.ts`

**Step 1: Create the task file**

Port `handleFindContacts` from Edge Function (lines 791-948). Key changes: parallel Prospeo person searches across companies, parallel email enrichment. Uses the existing `find-email` service in gtm-system (call it internally, not via HTTP).

```typescript
// src/trigger/tam-find-contacts.ts
import { task, logger } from '@trigger.dev/sdk/v3';
import {
  getSupabase,
  updateJobProgress,
  markJobCompleted,
  markJobFailed,
} from '@/lib/tam/helpers';

const PROSPEO_BASE = 'https://api.prospeo.io';

function prospeoHeaders(apiKey: string) {
  return { 'Content-Type': 'application/json', 'X-KEY': apiKey };
}

function buildProspeoPersonFilters(
  icpProfile: Record<string, any>,
  companyDomains: string[]
): Record<string, any> {
  const filters: Record<string, any> = {};

  if (companyDomains.length > 0) {
    filters.company = { websites: { include: companyDomains.slice(0, 500) } };
  }

  const seniorityMap: Record<string, string> = {
    'C-Suite': 'C-Suite',
    VP: 'Vice President',
    Director: 'Director',
    Manager: 'Manager',
    Founder: 'Founder/Owner',
  };
  if (icpProfile.seniorityPreference?.length) {
    const mapped = icpProfile.seniorityPreference
      .map((s: string) => seniorityMap[s])
      .filter(Boolean);
    if (mapped.length > 0) filters.person_seniority = { include: mapped };
  }

  if (icpProfile.geography === 'us_only') {
    filters.person_location_search = { include: ['United States'] };
  } else if (
    icpProfile.geography === 'specific_countries' &&
    icpProfile.specificCountries?.length
  ) {
    filters.person_location_search = { include: icpProfile.specificCountries };
  }

  return filters;
}

interface FindContactsPayload {
  jobId: string;
  projectId: string;
}

export const tamFindContacts = task({
  id: 'tam-find-contacts',
  retry: { maxAttempts: 2 },
  maxDuration: 1800,
  run: async (payload: FindContactsPayload) => {
    const { jobId, projectId } = payload;
    const supabase = getSupabase();

    const prospeoKey = process.env.PROSPEO_API_KEY;
    if (!prospeoKey) {
      await markJobFailed(jobId, 'PROSPEO_API_KEY not configured');
      return;
    }

    try {
      const { data: project } = await supabase
        .from('tam_projects')
        .select('icp_profile')
        .eq('id', projectId)
        .single();

      const icpProfile = project?.icp_profile || {};

      const { data: companies } = await supabase
        .from('tam_companies')
        .select('id, project_id, name, domain')
        .eq('project_id', projectId)
        .eq('qualification_status', 'qualified')
        .not('domain', 'is', null);

      if (!companies || companies.length === 0) {
        await supabase
          .from('tam_projects')
          .update({ status: 'complete' })
          .eq('id', projectId);
        await markJobCompleted(jobId, {
          contactsFound: 0,
          emailsFound: 0,
          totalCompanies: 0,
        });
        return;
      }

      logger.info('Finding contacts', {
        projectId,
        companyCount: companies.length,
      });

      let contactsFound = 0;
      let emailsFound = 0;
      const maxContactsPerCompany = icpProfile.contactsPerCompany || 1;

      // Batch companies into groups of up to 500 domains (Prospeo limit)
      const batchSize = Math.min(companies.length, 500);
      const companyBatches: any[][] = [];
      for (let i = 0; i < companies.length; i += batchSize) {
        companyBatches.push(companies.slice(i, i + batchSize));
      }

      const gtmSystemUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gtmconductor.com';
      const serviceKey = process.env.SERVICE_API_KEY;

      for (let batchIdx = 0; batchIdx < companyBatches.length; batchIdx++) {
        const batch = companyBatches[batchIdx];
        const domains = batch.map((c: any) => c.domain).filter(Boolean);
        const domainToCompany = new Map(
          batch.map((c: any) => [c.domain, c])
        );

        const personFilters = buildProspeoPersonFilters(icpProfile, domains);
        const companyContactCounts = new Map<string, number>();

        const maxPages = Math.ceil(
          (domains.length * maxContactsPerCompany) / 25
        );
        const pageLimit = Math.min(maxPages, 20);

        for (let page = 1; page <= pageLimit; page++) {
          try {
            const response = await fetch(`${PROSPEO_BASE}/search-person`, {
              method: 'POST',
              headers: prospeoHeaders(prospeoKey),
              body: JSON.stringify({ filters: personFilters, page }),
            });

            const data = await response.json();

            if (data.error) {
              if (data.error_code === 'NO_RESULTS') break;
              if (data.error_code === 'RATE_LIMITED') {
                await new Promise((r) => setTimeout(r, 2000));
                continue;
              }
              break;
            }

            // Process results — enrich emails in parallel (10 concurrent)
            const results = data.results || [];
            const enrichPromises: Promise<void>[] = [];

            for (const result of results) {
              const person = result.person || {};
              const company = result.company || {};
              const companyDomain =
                company.domain || company.website || null;

              const matchedCompany = companyDomain
                ? domainToCompany.get(companyDomain)
                : null;
              if (!matchedCompany) continue;

              const currentCount =
                companyContactCounts.get(matchedCompany.id) || 0;
              if (currentCount >= maxContactsPerCompany) continue;
              companyContactCounts.set(
                matchedCompany.id,
                currentCount + 1
              );

              const firstName = person.first_name || '';
              const lastName = person.last_name || '';

              const enrichAndInsert = async () => {
                let email: string | null = null;
                let emailStatus = 'not_found';

                if (firstName && lastName && companyDomain && serviceKey) {
                  try {
                    const enrichResponse = await fetch(
                      `${gtmSystemUrl}/api/services/find-email`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-Service-Key': serviceKey,
                        },
                        body: JSON.stringify({
                          first_name: firstName,
                          last_name: lastName,
                          company_domain: companyDomain,
                          linkedin_url: person.linkedin_url || undefined,
                        }),
                      }
                    );

                    if (enrichResponse.ok) {
                      const enrichData = await enrichResponse.json();
                      if (enrichData.email) {
                        email = enrichData.email;
                        emailStatus = enrichData.validated
                          ? 'verified'
                          : 'found';
                      }
                    }
                  } catch {
                    // Continue without enrichment
                  }
                }

                await supabase.from('tam_contacts').insert({
                  company_id: matchedCompany.id,
                  project_id: projectId,
                  first_name: person.first_name || null,
                  last_name: person.last_name || null,
                  title: person.current_job_title || null,
                  linkedin_url: person.linkedin_url || null,
                  email,
                  email_status: emailStatus,
                  phone: null,
                  source: 'prospeo',
                  raw_data: { person, company },
                });

                contactsFound++;
                if (email) emailsFound++;
              };

              enrichPromises.push(enrichAndInsert());

              // Flush every 10 for parallel processing
              if (enrichPromises.length >= 10) {
                await Promise.all(enrichPromises);
                enrichPromises.length = 0;
              }
            }

            // Flush remaining
            if (enrichPromises.length > 0) {
              await Promise.all(enrichPromises);
            }

            const totalPages = data.pagination?.total_page || 1;
            if (page >= totalPages) break;

            await new Promise((r) => setTimeout(r, 300));
          } catch {
            break;
          }
        }

        const progress = Math.round(
          ((batchIdx + 1) / companyBatches.length) * 100
        );
        await updateJobProgress(jobId, progress);
      }

      await supabase
        .from('tam_projects')
        .update({ status: 'complete' })
        .eq('id', projectId);

      await markJobCompleted(jobId, {
        contactsFound,
        emailsFound,
        totalCompanies: companies.length,
      });

      logger.info('Find contacts complete', {
        contactsFound,
        emailsFound,
        totalCompanies: companies.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Find contacts failed', { error: message });
      await markJobFailed(jobId, message);
    }
  },
});
```

**Step 2: Commit**

```bash
git add src/trigger/tam-find-contacts.ts
git commit -m "feat(tam): add tam-find-contacts Trigger.dev task with parallel email enrichment"
```

---

### Task 4: Create tam-check-linkedin Trigger.dev task

**Files:**
- Create: `src/trigger/tam-check-linkedin.ts`

**Step 1: Create the task file**

Port `handleCheckLinkedin` from Edge Function (lines 954-1020). Key change: parallel Bright Data lookups (5 concurrent).

```typescript
// src/trigger/tam-check-linkedin.ts
import { task, logger } from '@trigger.dev/sdk/v3';
import {
  getSupabase,
  updateJobProgress,
  markJobCompleted,
  markJobFailed,
  parallelBatch,
} from '@/lib/tam/helpers';

interface CheckLinkedinPayload {
  jobId: string;
  projectId: string;
}

export const tamCheckLinkedin = task({
  id: 'tam-check-linkedin',
  retry: { maxAttempts: 2 },
  maxDuration: 1800,
  run: async (payload: CheckLinkedinPayload) => {
    const { jobId, projectId } = payload;
    const supabase = getSupabase();

    const brightDataKey = process.env.BRIGHT_DATA_API_KEY;
    if (!brightDataKey) {
      await markJobFailed(jobId, 'BRIGHT_DATA_API_KEY not configured');
      return;
    }

    try {
      const { data: contacts } = await supabase
        .from('tam_contacts')
        .select('id, linkedin_url')
        .eq('project_id', projectId)
        .not('linkedin_url', 'is', null);

      if (!contacts || contacts.length === 0) {
        await markJobCompleted(jobId, { active: 0, inactive: 0, total: 0 });
        return;
      }

      logger.info('Checking LinkedIn activity', {
        projectId,
        contactCount: contacts.length,
      });

      let active = 0;
      let inactive = 0;
      const CONCURRENCY = 5;

      for (let i = 0; i < contacts.length; i += CONCURRENCY) {
        const batch = contacts.slice(i, i + CONCURRENCY);

        const results = await Promise.all(
          batch.map(async (contact) => {
            try {
              const response = await fetch(
                'https://api.brightdata.com/datasets/v3/trigger',
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${brightDataKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    url: contact.linkedin_url,
                    type: 'linkedin_posts',
                  }),
                }
              );

              const data = await response.json();
              const lastPostDate =
                data.lastPostDate || data.last_post_date || null;

              let isActive = false;
              if (lastPostDate) {
                const postDate = new Date(lastPostDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                isActive = postDate > thirtyDaysAgo;
              }

              return { id: contact.id, lastPostDate, isActive };
            } catch {
              return { id: contact.id, lastPostDate: null, isActive: false };
            }
          })
        );

        for (const result of results) {
          await supabase
            .from('tam_contacts')
            .update({
              linkedin_last_post_date: result.lastPostDate,
              linkedin_active: result.isActive,
            })
            .eq('id', result.id);

          if (result.isActive) active++;
          else inactive++;
        }

        const progress = Math.round(
          ((i + batch.length) / contacts.length) * 100
        );
        await updateJobProgress(jobId, progress);
      }

      await markJobCompleted(jobId, {
        active,
        inactive,
        total: contacts.length,
      });

      logger.info('LinkedIn check complete', {
        active,
        inactive,
        total: contacts.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('LinkedIn check failed', { error: message });
      await markJobFailed(jobId, message);
    }
  },
});
```

**Step 2: Commit**

```bash
git add src/trigger/tam-check-linkedin.ts
git commit -m "feat(tam): add tam-check-linkedin Trigger.dev task with parallel lookups"
```

---

### Task 5: Create tam-refine-discolike Trigger.dev task

**Files:**
- Create: `src/trigger/tam-refine-discolike.ts`

**Step 1: Create the task file**

Port `handleRefineDiscolike` from Edge Function (lines 1026-1139). This is already fast (single API call), just moving it to Trigger.dev for consistency.

```typescript
// src/trigger/tam-refine-discolike.ts
import { task, logger } from '@trigger.dev/sdk/v3';
import {
  getSupabase,
  updateJobProgress,
  markJobCompleted,
  markJobFailed,
  normalizeDomain,
} from '@/lib/tam/helpers';

const DISCOLIKE_BASE = 'https://api.discolike.com';

interface SourcedCompany {
  name: string;
  domain: string | null;
  linkedin_url: string | null;
  industry: string | null;
  employee_count: number | null;
  location: string | null;
  description: string | null;
  digital_footprint_score: number | null;
  similarity_score: number | null;
  source: string;
  raw: Record<string, unknown>;
}

async function discolikeDiscoverByDomains(
  apiKey: string,
  domains: string[],
  country: string,
  maxRecords: number
): Promise<any[]> {
  const url = new URL(`${DISCOLIKE_BASE}/v1/discover`);
  for (const d of domains) url.searchParams.append('domain', d);
  if (country) url.searchParams.set('country', country);
  url.searchParams.set('max_records', String(maxRecords));
  url.searchParams.set('min_score', '50');

  const response = await fetch(url.toString(), {
    headers: { 'x-discolike-key': apiKey, Accept: 'application/json' },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Discolike discover failed: ${response.status} ${response.statusText} — ${body}`
    );
  }
  const data = await response.json();
  return data.results || data.companies || [];
}

interface RefinePayload {
  jobId: string;
  projectId: string;
}

export const tamRefineDiscolike = task({
  id: 'tam-refine-discolike',
  retry: { maxAttempts: 2 },
  maxDuration: 300,
  run: async (payload: RefinePayload) => {
    const { jobId, projectId } = payload;
    const supabase = getSupabase();

    const discolikeKey = process.env.DISCOLIKE_API_KEY;
    if (!discolikeKey) {
      await markJobFailed(jobId, 'DISCOLIKE_API_KEY not configured');
      return;
    }

    try {
      const { data: project } = await supabase
        .from('tam_projects')
        .select('icp_profile')
        .eq('id', projectId)
        .single();

      const icpProfile = project?.icp_profile || {};

      // Get original seed domains
      const originalSeeds = (icpProfile.seedCompanyDomains || [])
        .map((d: string) => normalizeDomain(d))
        .filter(Boolean) as string[];

      // Get liked companies' domains (expand seed set)
      const { data: likedCompanies } = await supabase
        .from('tam_companies')
        .select('domain')
        .eq('project_id', projectId)
        .eq('source', 'discolike')
        .eq('feedback', 'liked')
        .not('domain', 'is', null);

      const likedDomains = (likedCompanies || [])
        .map((c: any) => normalizeDomain(c.domain))
        .filter(Boolean) as string[];

      // Get disliked domains
      const { data: dislikedCompanies } = await supabase
        .from('tam_companies')
        .select('domain')
        .eq('project_id', projectId)
        .eq('source', 'discolike')
        .eq('feedback', 'disliked')
        .not('domain', 'is', null);

      const dislikedDomains = new Set(
        (dislikedCompanies || [])
          .map((c: any) => normalizeDomain(c.domain))
          .filter(Boolean)
      );

      const seedSet = new Set<string>([...originalSeeds, ...likedDomains]);
      const seedDomains = [...seedSet].slice(0, 10);

      if (seedDomains.length === 0) {
        await markJobCompleted(jobId, {
          companiesFound: 0,
          message: 'No seed domains available',
        });
        return;
      }

      await updateJobProgress(jobId, 10);

      // Get existing domains for dedup
      const { data: existingCompanies } = await supabase
        .from('tam_companies')
        .select('domain')
        .eq('project_id', projectId)
        .not('domain', 'is', null);

      const seen = new Set<string>(
        (existingCompanies || [])
          .map((c: any) => normalizeDomain(c.domain))
          .filter(Boolean) as string[]
      );

      // Country filter
      let country = '';
      if (icpProfile.geography === 'us_only') country = 'US';
      else if (
        icpProfile.geography === 'specific_countries' &&
        icpProfile.specificCountries?.length
      ) {
        country = icpProfile.specificCountries[0];
      }

      const maxRecords =
        icpProfile.sourcingLimits?.discolikeMaxRecords || 200;

      await updateJobProgress(jobId, 20);

      const results = await discolikeDiscoverByDomains(
        discolikeKey,
        seedDomains,
        country,
        maxRecords
      );

      await updateJobProgress(jobId, 60);

      // Filter and build companies
      const companies: SourcedCompany[] = [];
      for (const r of results) {
        const domain = normalizeDomain(r.domain || r.website || null);
        if (domain && dislikedDomains.has(domain)) continue;
        if (!r.name && !r.company_name && !domain) continue;

        const d = normalizeDomain(r.domain || r.website || null);
        if (d) {
          if (seen.has(d)) continue;
          seen.add(d);
        }

        companies.push({
          name: r.name || r.company_name || r.domain || '',
          domain: d,
          linkedin_url: null,
          industry: r.industry || r.category || null,
          employee_count: r.employees || r.employee_count || null,
          location: r.address || r.location || r.country || null,
          description: r.description || null,
          digital_footprint_score:
            r.score || r.digital_footprint_score || null,
          similarity_score: r.similarity || null,
          source: 'discolike',
          raw: r,
        });
      }

      // Batch insert
      let inserted = 0;
      let failed = 0;
      for (let i = 0; i < companies.length; i += 100) {
        const batch = companies.slice(i, i + 100);
        const { error } = await supabase.from('tam_companies').insert(
          batch.map((c) => ({
            project_id: projectId,
            name: c.name,
            domain: c.domain,
            linkedin_url: c.linkedin_url,
            source: c.source,
            industry: c.industry,
            employee_count: c.employee_count,
            location: c.location,
            description: c.description,
            digital_footprint_score: c.digital_footprint_score,
            similarity_score: c.similarity_score,
            qualification_status: 'pending',
            raw_data: c.raw,
          }))
        );
        if (error) failed += batch.length;
        else inserted += batch.length;

        const progress =
          60 + Math.round(((i + batch.length) / companies.length) * 40);
        await updateJobProgress(jobId, progress);
      }

      await markJobCompleted(jobId, {
        companiesFound: companies.length,
        inserted,
        failed,
        seedDomainsUsed: seedDomains.length,
        likedCount: likedDomains.length,
        dislikedExcluded: dislikedDomains.size,
        totalResults: results.length,
      });

      logger.info('Refine complete', {
        companiesFound: companies.length,
        inserted,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Refine failed', { error: message });
      await markJobFailed(jobId, message);
    }
  },
});
```

**Step 2: Commit**

```bash
git add src/trigger/tam-refine-discolike.ts
git commit -m "feat(tam): add tam-refine-discolike Trigger.dev task"
```

---

### Task 6: Create API route to dispatch TAM tasks

**Files:**
- Create: `src/app/api/tam/run/route.ts`

**Step 1: Create the API route**

This route receives requests from the Edge Function and triggers the appropriate Trigger.dev task.

```typescript
// src/app/api/tam/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { logger } from '@/lib/logging/logger';
import type { tamQualifyCompanies } from '@/trigger/tam-qualify-companies';
import type { tamFindContacts } from '@/trigger/tam-find-contacts';
import type { tamCheckLinkedin } from '@/trigger/tam-check-linkedin';
import type { tamRefineDiscolike } from '@/trigger/tam-refine-discolike';

const SERVICE_API_KEY = process.env.SERVICE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const apiKey = request.headers.get('x-api-key');
    if (!SERVICE_API_KEY || apiKey !== SERVICE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, jobType, projectId } = await request.json();

    if (!jobId || !jobType || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, jobType, projectId' },
        { status: 400 }
      );
    }

    const payload = { jobId, projectId };

    let handle;
    switch (jobType) {
      case 'qualify':
        handle = await tasks.trigger<typeof tamQualifyCompanies>(
          'tam-qualify-companies',
          payload
        );
        break;
      case 'find_contacts':
        handle = await tasks.trigger<typeof tamFindContacts>(
          'tam-find-contacts',
          payload
        );
        break;
      case 'check_linkedin':
        handle = await tasks.trigger<typeof tamCheckLinkedin>(
          'tam-check-linkedin',
          payload
        );
        break;
      case 'refine_discolike':
        handle = await tasks.trigger<typeof tamRefineDiscolike>(
          'tam-refine-discolike',
          payload
        );
        break;
      default:
        return NextResponse.json(
          { error: `Unknown job type: ${jobType}` },
          { status: 400 }
        );
    }

    logger.info('TAM task triggered', {
      jobId,
      jobType,
      projectId,
      taskId: handle.id,
    });

    return NextResponse.json({ triggered: true, taskId: handle.id });
  } catch (error) {
    logger.error(
      'TAM task trigger failed',
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      { error: 'Failed to trigger task' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/tam/run/route.ts
git commit -m "feat(tam): add /api/tam/run dispatch route"
```

---

### Task 7: Add env var entries for new TAM keys

**Files:**
- Modify: `src/lib/env.ts`

**Step 1: Add DISCOLIKE_API_KEY and BRIGHT_DATA_API_KEY entries**

Add after the existing optional API key entries (around line 120ish, near other optional API keys). These are optional since the tasks check and fail gracefully.

```typescript
  {
    key: 'DISCOLIKE_API_KEY',
    required: false,
    sensitive: true,
    group: 'tam',
    description: 'Discolike API key for TAM company discovery',
  },
  {
    key: 'BRIGHT_DATA_API_KEY',
    required: false,
    sensitive: true,
    group: 'tam',
    description: 'Bright Data API key for LinkedIn activity checks',
  },
```

**Step 2: Commit**

```bash
git add src/lib/env.ts
git commit -m "feat(tam): add DISCOLIKE_API_KEY and BRIGHT_DATA_API_KEY to env validation"
```

---

### Task 8: Update Edge Function to dispatch to gtm-system

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/supabase/functions/tam-run-job/index.ts`

**Step 1: Replace the EdgeRuntime.waitUntil background processing with HTTP dispatch**

In the main `serve()` function (around line 1182), replace the `longRunningTypes` block that uses `EdgeRuntime.waitUntil` with an HTTP POST to gtm-system's `/api/tam/run` endpoint. The function already marks the job as "running" — just dispatch and return.

Replace the entire `if (longRunningTypes.includes(job.job_type))` block with:

```typescript
    const longRunningTypes = ['qualify', 'find_contacts', 'check_linkedin', 'refine_discolike'];

    if (longRunningTypes.includes(job.job_type)) {
      // Dispatch to gtm-system Trigger.dev tasks
      const gtmSystemUrl = Deno.env.get('GTM_SYSTEM_URL');
      const serviceApiKey = Deno.env.get('SERVICE_API_KEY');

      if (!gtmSystemUrl || !serviceApiKey) {
        await supabase.from('tam_job_queue').update({
          status: 'failed',
          result_summary: { error: 'GTM_SYSTEM_URL or SERVICE_API_KEY not configured' },
        }).eq('id', jobId);
        return new Response(
          JSON.stringify({ error: 'Backend not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const triggerRes = await fetch(`${gtmSystemUrl}/api/tam/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': serviceApiKey,
        },
        body: JSON.stringify({
          jobId,
          jobType: job.job_type,
          projectId: job.project_id,
        }),
      });

      if (!triggerRes.ok) {
        const errBody = await triggerRes.text().catch(() => 'Unknown error');
        await supabase.from('tam_job_queue').update({
          status: 'failed',
          result_summary: { error: `Backend dispatch failed: ${errBody}` },
        }).eq('id', jobId);
        return new Response(
          JSON.stringify({ error: 'Backend dispatch failed' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const triggerData = await triggerRes.json();
      return new Response(
        JSON.stringify({ success: true, dispatched: true, taskId: triggerData.taskId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
```

**Step 2: Commit** (in copy-of-gtm-os repo)

```bash
git add supabase/functions/tam-run-job/index.ts
git commit -m "feat(tam): dispatch long-running jobs to gtm-system backend"
```

---

### Task 9: Set environment variables in Trigger.dev

**Step 1: Set env vars via Trigger.dev API**

The gtm-system Trigger.dev project needs DISCOLIKE_API_KEY and BRIGHT_DATA_API_KEY. ANTHROPIC_API_KEY, PROSPEO_API_KEY, SUPABASE keys, and SERVICE_API_KEY are already set.

Get the current values from Supabase Edge Function secrets (they're already configured there), then set in Trigger.dev:

```bash
# Check which keys are already in Trigger.dev
curl -s -H "Authorization: Bearer tr_prod_Fxgn6CdrH6v2NSMVhSJL" \
  "https://api.trigger.dev/api/v1/projects/proj_yymkdpugnlvvgbslvnno/envvars/prod" | python3 -m json.tool

# Set DISCOLIKE_API_KEY (get value from Supabase dashboard or existing env)
# Set BRIGHT_DATA_API_KEY (get value from Supabase dashboard or existing env)
```

Verify these are set in Railway too (for the API route): `DISCOLIKE_API_KEY`, `BRIGHT_DATA_API_KEY`.

---

### Task 10: Deploy and test

**Step 1: Deploy gtm-system Trigger.dev tasks**

```bash
cd "/Users/timlife/Documents/claude code/gtm-system"
TRIGGER_SECRET_KEY=tr_prod_Fxgn6CdrH6v2NSMVhSJL npx trigger.dev@4.3.3 deploy
```

**Step 2: Deploy Edge Function**

```bash
cd "/Users/timlife/Documents/claude code/copy-of-gtm-os"
npx supabase functions deploy tam-run-job --project-ref qvawbxpijxlwdkolmjrs --no-verify-jwt
```

**Step 3: Test the qualify step end-to-end**

1. Go to TAM builder in the app
2. Create a new project with an ICP profile
3. Wait for Source Companies to complete
4. Watch Qualify Companies — should complete in ~45s instead of timing out
5. Check Trigger.dev dashboard for the `tam-qualify-companies` run
6. Verify `tam_job_queue` shows progress updates and final completion
