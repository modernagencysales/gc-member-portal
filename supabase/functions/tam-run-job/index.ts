/* eslint-disable no-undef */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://modernagencysales.com',
  'https://www.modernagencysales.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ============================================
// Prospeo API helpers (https://prospeo.io/api-docs)
// ============================================

const PROSPEO_BASE = 'https://api.prospeo.io';

function prospeoHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'X-KEY': apiKey,
  };
}

// ============================================
// Domain normalization
// ============================================

function normalizeDomain(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.trim().toLowerCase();
  // Strip protocol
  d = d.replace(/^https?:\/\//, '');
  // Strip www.
  d = d.replace(/^www\./, '');
  // Strip trailing slash / path
  d = d.split('/')[0];
  // Strip port
  d = d.split(':')[0];
  return d || null;
}

// ============================================
// Normalized company shape (shared across all sources)
// ============================================

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

// ============================================
// Discolike API helpers (https://discolike.com/api)
// ============================================

const DISCOLIKE_BASE = 'https://api.discolike.com';

async function discolikeGet(
  apiKey: string,
  path: string,
  params: Record<string, string | number> = {}
): Promise<any> {
  const url = new URL(`${DISCOLIKE_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url.toString(), {
    headers: { 'x-discolike-key': apiKey, Accept: 'application/json' },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Discolike ${path} failed: ${response.status} ${response.statusText} — ${body}`
    );
  }
  return response.json();
}

// Domain consensus discovery — pass multiple seed domains for best results
async function discolikeDiscoverByDomains(
  apiKey: string,
  domains: string[],
  country: string,
  maxRecords: number
): Promise<any[]> {
  // DiscoLike expects multiple `domain` query params for consensus
  const url = new URL(`${DISCOLIKE_BASE}/v1/discover`);
  for (const d of domains) {
    url.searchParams.append('domain', d);
  }
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

// ============================================
// BlitzAPI helpers (will activate when BLITZ_API_KEY is set)
// https://docs.blitz-api.ai
// ============================================

const BLITZAPI_BASE = 'https://api.blitz-api.ai/v2';

function blitzApiHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };
}

async function blitzApiSearch(
  apiKey: string,
  filters: Record<string, any>,
  page: number
): Promise<any> {
  const response = await fetch(`${BLITZAPI_BASE}/company/search`, {
    method: 'POST',
    headers: blitzApiHeaders(apiKey),
    body: JSON.stringify({ ...filters, page, per_page: 100 }),
  });
  if (!response.ok) {
    throw new Error(`BlitzAPI search failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function buildBlitzApiFilters(icpProfile: any): Record<string, any> {
  const filters: Record<string, any> = {};

  if (icpProfile.industryKeywords?.length) {
    filters.industries = icpProfile.industryKeywords;
  }

  if (icpProfile.employeeSizeRanges?.length) {
    const rangeMap: Record<string, [number, number]> = {
      '1-10': [1, 10],
      '11-50': [11, 50],
      '51-200': [51, 200],
      '201-1000': [201, 1000],
      '1000+': [1001, 100000],
    };
    const mins: number[] = [];
    const maxs: number[] = [];
    for (const r of icpProfile.employeeSizeRanges) {
      const mapped = rangeMap[r];
      if (mapped) {
        mins.push(mapped[0]);
        maxs.push(mapped[1]);
      }
    }
    if (mins.length) {
      filters.employee_count_min = Math.min(...mins);
      filters.employee_count_max = Math.max(...maxs);
    }
  }

  if (icpProfile.geography === 'us_only') {
    filters.countries = ['US'];
  } else if (
    icpProfile.geography === 'specific_countries' &&
    icpProfile.specificCountries?.length
  ) {
    filters.countries = icpProfile.specificCountries;
  }

  return filters;
}

// ============================================
// Build Prospeo filters from ICP profile
// ============================================

function buildProspeoCompanyFilters(icpProfile: any): Record<string, any> {
  const filters: Record<string, any> = {};

  // Industry filter
  if (icpProfile.industryKeywords?.length) {
    filters.company_industry = {
      include: icpProfile.industryKeywords,
    };
  }

  // Employee size filter — map wizard ranges to Prospeo's company_headcount_range (flat array)
  // Prospeo ranges: 1-10, 11-20, 21-50, 51-100, 101-200, 201-500, 501-1000, 1001-2000, 2001-5000, 5001-10000, 10000+
  if (icpProfile.employeeSizeRanges?.length) {
    const sizeMap: Record<string, string[]> = {
      '1-10': ['1-10'],
      '11-50': ['11-20', '21-50'],
      '51-200': ['51-100', '101-200'],
      '201-1000': ['201-500', '501-1000'],
      '1000+': ['1001-2000', '2001-5000', '5001-10000', '10000+'],
    };
    const prospeoSizes = icpProfile.employeeSizeRanges.flatMap((s: string) => sizeMap[s] || []);
    if (prospeoSizes.length > 0) {
      filters.company_headcount_range = prospeoSizes;
    }
  }

  // Location filter
  if (icpProfile.geography === 'us_only') {
    filters.company_location_search = { include: ['United States'] };
  } else if (
    icpProfile.geography === 'specific_countries' &&
    icpProfile.specificCountries?.length
  ) {
    filters.company_location_search = { include: icpProfile.specificCountries };
  }

  // Seed company domains — search by website (normalize to clean domains)
  if (icpProfile.seedCompanyDomains?.length) {
    const cleanDomains = icpProfile.seedCompanyDomains
      .map((d: string) => {
        let domain = d.trim().toLowerCase();
        domain = domain.replace(/^https?:\/\//, '');
        domain = domain.replace(/^www\./, '');
        domain = domain.split('/')[0];
        domain = domain.split(':')[0];
        return domain;
      })
      .filter((d: string) => d && d.includes('.') && !d.includes(' '));
    if (cleanDomains.length > 0) {
      filters.company = {
        websites: { include: cleanDomains },
      };
    }
  }

  return filters;
}

function buildProspeoPersonFilters(icpProfile: any, companyDomains: string[]): Record<string, any> {
  const filters: Record<string, any> = {};

  // Target companies by domain
  if (companyDomains.length > 0) {
    filters.company = {
      websites: { include: companyDomains.slice(0, 500) },
    };
  }

  // Seniority filter — map wizard values to Prospeo enum
  // Prospeo values: Founder/Owner, C-Suite, Partner, Vice President, Head, Director, Manager, Senior, Entry, Intern
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
    if (mapped.length > 0) {
      filters.person_seniority = { include: mapped };
    }
  }

  // Location filter
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

// ============================================
// Source Companies — multi-source pipeline
// ============================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Progress callback — source reports 0-1 fraction, orchestrator scales to global %
type ProgressFn = (fraction: number) => Promise<void>;

function progressFn(supabase: any, jobId: string, start: number, end: number): ProgressFn {
  return (fraction) =>
    supabase
      .from('tam_job_queue')
      .update({
        progress: start + Math.round(fraction * (end - start)),
      })
      .eq('id', jobId);
}

// Normalize domain, dedup against shared set, push if new
function addCompany(out: SourcedCompany[], seen: Set<string>, c: SourcedCompany): void {
  if (!c.name) return;
  const d = normalizeDomain(c.domain);
  if (d) {
    if (seen.has(d)) return;
    seen.add(d);
  }
  out.push({ ...c, domain: d });
}

// Fetch one Prospeo page with up to 3 rate-limit retries. Returns null when exhausted.
async function fetchProspeoPage(apiKey: string, filters: any, page: number): Promise<any | null> {
  for (let retry = 0; retry < 3; retry++) {
    const resp = await fetch(`${PROSPEO_BASE}/search-company`, {
      method: 'POST',
      headers: prospeoHeaders(apiKey),
      body: JSON.stringify({ filters, page }),
    });
    const data = await resp.json();
    if (data.error_code === 'NO_RESULTS') return null;
    if (data.error_code === 'RATE_LIMITED') {
      await delay(2000 * (retry + 1));
      continue;
    }
    if (data.error) throw new Error(`Prospeo: ${data.error_code} — ${data.filter_error || ''}`);
    return data;
  }
  return null;
}

// Fetch one BlitzAPI page with up to 3 rate-limit retries. Returns null when exhausted.
async function fetchBlitzApiPage(apiKey: string, filters: any, page: number): Promise<any | null> {
  for (let retry = 0; retry < 3; retry++) {
    const data = await blitzApiSearch(apiKey, filters, page);
    if (data.error === 'no_results' || data.error === 'NO_RESULTS') return null;
    if (data.error === 'rate_limited' || data.status === 429) {
      await delay(2000 * (retry + 1));
      continue;
    }
    if (data.error) throw new Error(`BlitzAPI: ${data.error}`);
    return data;
  }
  return null;
}

// Batch-insert with error tracking
async function batchInsertCompanies(
  supabase: any,
  projectId: string,
  companies: SourcedCompany[],
  progress: ProgressFn
): Promise<{ inserted: number; failed: number }> {
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
    if (error) {
      console.error(`Insert error (offset ${i}): ${error.message}`);
      failed += batch.length;
    } else {
      inserted += batch.length;
    }
    await progress((i + batch.length) / companies.length);
  }

  return { inserted, failed };
}

// ---- Source: Prospeo ----

async function sourceFromProspeo(
  apiKey: string,
  icpProfile: any,
  seen: Set<string>,
  progress: ProgressFn
): Promise<SourcedCompany[]> {
  const filters = buildProspeoCompanyFilters(icpProfile);

  if (Object.keys(filters).length === 0) {
    // Fallback industries must use exact Prospeo enum values
    const fallback: Record<string, string[]> = {
      b2b_saas: [
        'Software Development',
        'Technology, Information and Internet',
        'IT Services and IT Consulting',
      ],
      ecommerce_dtc: [
        'General Retail',
        'Online and Mail Order Retail',
        'Internet Marketplace Platforms',
      ],
      amazon_sellers: ['General Retail', 'Online and Mail Order Retail'],
      local_service: ['Professional Services', 'Consumer Services'],
      agencies: ['Advertising Services', 'Marketing Services', 'Professional Services'],
    };
    filters.company_industry = {
      include: fallback[icpProfile.businessModel] || ['Software Development'],
    };
  }

  const companies: SourcedCompany[] = [];
  const maxPages = icpProfile.sourcingLimits?.prospeoMaxPages || 40;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const data = await fetchProspeoPage(apiKey, filters, page);
      if (!data) return companies;

      for (const r of data.results || []) {
        const co = r.company || {};
        addCompany(companies, seen, {
          name: co.name || null,
          domain: co.domain || co.website || null,
          linkedin_url: co.linkedin_url || null,
          industry: co.industry || null,
          employee_count: co.employee_count || null,
          location:
            [co.location?.city, co.location?.state, co.location?.country]
              .filter(Boolean)
              .join(', ') || null,
          description: co.description || co.description_seo || null,
          digital_footprint_score: null,
          similarity_score: null,
          source: 'prospeo',
          raw: co,
        });
      }

      const results = data.results || [];
      if (results.length < 25 || page >= (data.pagination?.total_page || 1)) return companies;
      await delay(300);
      await progress(page / maxPages);
    } catch (err) {
      if (page === 1) throw err;
      return companies;
    }
  }
  return companies;
}

// ---- Source: Discolike (domain consensus) ----

async function sourceFromDiscolike(
  apiKey: string,
  icpProfile: any,
  seen: Set<string>,
  progress: ProgressFn
): Promise<SourcedCompany[]> {
  const companies: SourcedCompany[] = [];

  // Domain consensus requires seed domains — skip if none provided
  const seedDomains = (icpProfile.seedCompanyDomains || [])
    .map((d: string) => normalizeDomain(d))
    .filter(Boolean)
    .slice(0, 10);

  if (seedDomains.length === 0) {
    console.log('DiscoLike: no seed domains, skipping');
    return companies;
  }

  const maxRecords = icpProfile.sourcingLimits?.discolikeMaxRecords || 200;

  // Country filter
  let country = '';
  if (icpProfile.geography === 'us_only') country = 'US';
  else if (icpProfile.geography === 'specific_countries' && icpProfile.specificCountries?.length) {
    country = icpProfile.specificCountries[0];
  }

  await progress(0.1);

  // Single domain consensus call with all seed domains
  const results = await discolikeDiscoverByDomains(apiKey, seedDomains, country, maxRecords);

  await progress(0.8);

  for (const r of results) {
    addCompany(companies, seen, {
      name: r.name || r.company_name || r.domain || '',
      domain: r.domain || r.website || null,
      linkedin_url: null,
      industry: r.industry || r.category || null,
      employee_count: r.employees || r.employee_count || null,
      location: r.address || r.location || r.country || null,
      description: r.description || null,
      digital_footprint_score: r.score || r.digital_footprint_score || null,
      similarity_score: r.similarity || null,
      source: 'discolike',
      raw: r,
    });
  }

  await progress(1.0);
  return companies;
}

// ---- Source: BlitzAPI (activates when BLITZ_API_KEY is set) ----

async function sourceFromBlitzApi(
  apiKey: string,
  icpProfile: any,
  seen: Set<string>,
  progress: ProgressFn
): Promise<SourcedCompany[]> {
  const companies: SourcedCompany[] = [];
  const filters = buildBlitzApiFilters(icpProfile);
  if (Object.keys(filters).length === 0) return companies;

  const maxPages = icpProfile.sourcingLimits?.blitzApiMaxPages || 20;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const data = await fetchBlitzApiPage(apiKey, filters, page);
      if (!data) return companies;

      const results = data.results || data.companies || [];
      for (const r of results) {
        addCompany(companies, seen, {
          name: r.name || r.company_name || r.domain || '',
          domain: r.domain || r.website || null,
          linkedin_url: r.linkedin_url || r.linkedin || null,
          industry: r.industry || r.category || null,
          employee_count: r.employee_count || r.employees || null,
          location:
            [r.city, r.state, r.country].filter(Boolean).join(', ') ||
            r.location ||
            r.address ||
            null,
          description: r.description || r.tagline || null,
          digital_footprint_score: null,
          similarity_score: null,
          source: 'blitzapi',
          raw: r,
        });
      }

      if (
        results.length < 100 ||
        page >= (data.total_pages || data.pagination?.total_pages || maxPages)
      )
        return companies;
      await delay(300);
      await progress(page / maxPages);
    } catch (err) {
      if (page === 1) throw err;
      return companies;
    }
  }
  return companies;
}

// ---- Main orchestrator ----

async function handleSourceCompanies(supabase: any, job: any, project: any) {
  const prospeoKey = Deno.env.get('PROSPEO_API_KEY');
  if (!prospeoKey) throw new Error('PROSPEO_API_KEY not configured');

  const discolikeKey = Deno.env.get('DISCOLIKE_API_KEY');
  const blitzKey = Deno.env.get('BLITZ_API_KEY');
  const icpProfile = project?.icp_profile || {};
  const seen = new Set<string>();
  const pg = (start: number, end: number) => progressFn(supabase, job.id, start, end);

  // Fixed progress ranges: Prospeo 0-30, Discolike 30-60, BlitzAPI 60-90, Insert 90-100
  // Each source runs independently — one failing doesn't block the others
  const errors: string[] = [];

  let prospeoCompanies: SourcedCompany[] = [];
  try {
    prospeoCompanies = await sourceFromProspeo(prospeoKey, icpProfile, seen, pg(0, 30));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Prospeo sourcing failed:', msg);
    errors.push(`Prospeo: ${msg}`);
  }

  let discolikeCompanies: SourcedCompany[] = [];
  if (discolikeKey) {
    try {
      discolikeCompanies = await sourceFromDiscolike(discolikeKey, icpProfile, seen, pg(30, 60));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Discolike sourcing failed:', msg);
      errors.push(`Discolike: ${msg}`);
    }
  }

  let blitzCompanies: SourcedCompany[] = [];
  if (blitzKey) {
    try {
      blitzCompanies = await sourceFromBlitzApi(blitzKey, icpProfile, seen, pg(60, 90));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('BlitzAPI sourcing failed:', msg);
      errors.push(`BlitzAPI: ${msg}`);
    }
  }

  // Insert all (already deduped via shared `seen` set)
  const allCompanies = [...prospeoCompanies, ...discolikeCompanies, ...blitzCompanies];

  // If ALL sources failed and we have zero companies, throw so the job is marked failed
  if (allCompanies.length === 0 && errors.length > 0) {
    throw new Error(`All sources failed: ${errors.join('; ')}`);
  }

  const { inserted, failed } = await batchInsertCompanies(
    supabase,
    job.project_id,
    allCompanies,
    pg(90, 100)
  );

  await supabase.from('tam_projects').update({ status: 'sourcing' }).eq('id', job.project_id);

  // Count per source
  const counts: Record<string, number> = {};
  for (const c of allCompanies) counts[c.source] = (counts[c.source] || 0) + 1;
  const sources = Object.keys(counts).filter((k) => counts[k] > 0);

  return {
    companiesFound: allCompanies.length,
    inserted,
    failed,
    prospeoCount: counts.prospeo || 0,
    discolikeCount: counts.discolike || 0,
    blitzapiCount: counts.blitzapi || 0,
    source: sources.join('+') || 'none',
    ...(errors.length > 0 ? { warnings: errors } : {}),
  };
}

// ============================================
// Qualification (Claude AI)
// ============================================

async function handleQualify(supabase: any, job: any, project: any) {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const icpProfile = project?.icp_profile || {};

  const { data: companies } = await supabase
    .from('tam_companies')
    .select(
      'id, project_id, name, domain, linkedin_url, source, industry, employee_count, location, description, digital_footprint_score, qualification_status, qualification_reason, raw_data, created_at'
    )
    .eq('project_id', job.project_id)
    .eq('qualification_status', 'pending');

  if (!companies || companies.length === 0) {
    return { qualified: 0, disqualified: 0, total: 0 };
  }

  let qualified = 0;
  let disqualified = 0;
  const batchSize = 10;

  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);

    for (const company of batch) {
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
- Business model: ${icpProfile.businessModel || 'any'}
- What they sell: ${icpProfile.whatYouSell || 'not specified'}
- Target industries: ${icpProfile.industryKeywords?.join(', ') || 'any'}
- Employee size: ${icpProfile.employeeSizeRanges?.join(', ') || 'any'}
- Geography: ${icpProfile.geography || 'any'}
- Special criteria: ${icpProfile.specialCriteria || 'none'}`,
              },
            ],
          }),
        });

        const result = await response.json();
        const content = result.content?.[0]?.text || '';

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const status = parsed.qualified ? 'qualified' : 'disqualified';

          await supabase
            .from('tam_companies')
            .update({
              qualification_status: status,
              qualification_reason: parsed.reason,
            })
            .eq('id', company.id);

          if (parsed.qualified) qualified++;
          else disqualified++;
        } else {
          // Can't parse — leave as pending for review
          await supabase
            .from('tam_companies')
            .update({
              qualification_reason: 'Needs review (AI response parse error)',
            })
            .eq('id', company.id);
        }
      } catch {
        // Skip on error, leave as pending
      }
    }

    const progress = Math.round(((i + batch.length) / companies.length) * 100);
    await supabase.from('tam_job_queue').update({ progress }).eq('id', job.id);
  }

  // Update project status
  await supabase.from('tam_projects').update({ status: 'enriching' }).eq('id', job.project_id);

  return { qualified, disqualified, total: companies.length };
}

// ============================================
// Find Contacts (Prospeo search-person + enrich-person)
// ============================================

async function handleFindContacts(supabase: any, job: any, project: any) {
  const prospeoKey = Deno.env.get('PROSPEO_API_KEY');
  if (!prospeoKey) throw new Error('PROSPEO_API_KEY not configured');

  const icpProfile = project?.icp_profile || {};

  // Get qualified companies with domains
  const { data: companies } = await supabase
    .from('tam_companies')
    .select(
      'id, project_id, name, domain, linkedin_url, source, industry, employee_count, location, description, digital_footprint_score, qualification_status, qualification_reason, raw_data, created_at'
    )
    .eq('project_id', job.project_id)
    .eq('qualification_status', 'qualified')
    .not('domain', 'is', null);

  if (!companies || companies.length === 0) {
    // Update project status even if no companies
    await supabase.from('tam_projects').update({ status: 'complete' }).eq('id', job.project_id);
    return { contactsFound: 0, emailsFound: 0, totalCompanies: 0 };
  }

  let contactsFound = 0;
  let emailsFound = 0;
  const maxContactsPerCompany = icpProfile.contactsPerCompany || 1;

  // Batch companies into groups of up to 500 domains (Prospeo limit)
  const batchSize = Math.min(companies.length, 500);
  const companyBatches: any[][] = [];
  for (let i = 0; i < companies.length; i += batchSize) {
    companyBatches.push(companies.slice(i, i + batchSize));
  }

  for (let batchIdx = 0; batchIdx < companyBatches.length; batchIdx++) {
    const batch = companyBatches[batchIdx];
    const domains = batch.map((c: any) => c.domain).filter(Boolean);
    const domainToCompany = new Map(batch.map((c: any) => [c.domain, c]));

    // Search for people at these companies
    const personFilters = buildProspeoPersonFilters(icpProfile, domains);
    const companyContactCounts = new Map<string, number>();

    // Paginate through results
    const maxPages = Math.ceil((domains.length * maxContactsPerCompany) / 25);
    const pageLimit = Math.min(maxPages, 20); // Cap at 20 pages (500 results)

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

        for (const result of data.results || []) {
          const person = result.person || {};
          const company = result.company || {};
          const companyDomain = company.domain || company.website || null;

          // Match to our company record
          const matchedCompany = companyDomain ? domainToCompany.get(companyDomain) : null;
          if (!matchedCompany) continue;

          // Check per-company limit
          const currentCount = companyContactCounts.get(matchedCompany.id) || 0;
          if (currentCount >= maxContactsPerCompany) continue;
          companyContactCounts.set(matchedCompany.id, currentCount + 1);

          // Find email via centralized API hub
          let email: string | null = null;
          let emailStatus = 'not_found';
          const phone: string | null = null;

          const firstName = person.first_name || '';
          const lastName = person.last_name || '';
          if (firstName && lastName && companyDomain) {
            try {
              const gtmSystemUrl = Deno.env.get('GTM_SYSTEM_URL');
              const serviceKey = Deno.env.get('SERVICE_API_KEY');
              if (gtmSystemUrl && serviceKey) {
                const enrichResponse = await fetch(`${gtmSystemUrl}/api/services/find-email`, {
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
                });

                if (enrichResponse.ok) {
                  const enrichData = await enrichResponse.json();
                  if (enrichData.email) {
                    email = enrichData.email;
                    emailStatus = enrichData.validated ? 'verified' : 'found';
                  }
                }
              }
            } catch {
              // Continue without enrichment
            }
          }

          // Insert contact
          await supabase.from('tam_contacts').insert({
            company_id: matchedCompany.id,
            project_id: job.project_id,
            first_name: person.first_name || null,
            last_name: person.last_name || null,
            title: person.current_job_title || null,
            linkedin_url: person.linkedin_url || null,
            email: email,
            email_status: emailStatus,
            phone: phone,
            source: 'prospeo',
            raw_data: { person, company },
          });

          contactsFound++;
          if (email) emailsFound++;
        }

        // Stop if we got fewer than a full page
        const totalPages = data.pagination?.total_page || 1;
        if (page >= totalPages) break;

        // Rate limit between pages
        await new Promise((r) => setTimeout(r, 300));
      } catch {
        break;
      }
    }

    // Update progress per batch
    const progress = Math.round(((batchIdx + 1) / companyBatches.length) * 100);
    await supabase.from('tam_job_queue').update({ progress }).eq('id', job.id);
  }

  // Update project status to complete
  await supabase.from('tam_projects').update({ status: 'complete' }).eq('id', job.project_id);

  return { contactsFound, emailsFound, totalCompanies: companies.length };
}

// ============================================
// LinkedIn Activity Check (Bright Data)
// ============================================

async function handleCheckLinkedin(supabase: any, job: any, _project: any) {
  const brightDataKey = Deno.env.get('BRIGHT_DATA_API_KEY');
  if (!brightDataKey) throw new Error('BRIGHT_DATA_API_KEY not configured');

  const { data: contacts } = await supabase
    .from('tam_contacts')
    .select(
      'id, company_id, project_id, first_name, last_name, title, linkedin_url, email, email_status, phone, linkedin_last_post_date, linkedin_active, source, raw_data, created_at'
    )
    .eq('project_id', job.project_id)
    .not('linkedin_url', 'is', null);

  if (!contacts || contacts.length === 0) {
    return { active: 0, inactive: 0, total: 0 };
  }

  let active = 0;
  let inactive = 0;

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];

    try {
      const response = await fetch('https://api.brightdata.com/datasets/v3/trigger', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${brightDataKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: contact.linkedin_url,
          type: 'linkedin_posts',
        }),
      });

      const data = await response.json();
      const lastPostDate = data.lastPostDate || data.last_post_date || null;

      let isActive = false;
      if (lastPostDate) {
        const postDate = new Date(lastPostDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        isActive = postDate > thirtyDaysAgo;
      }

      await supabase
        .from('tam_contacts')
        .update({
          linkedin_last_post_date: lastPostDate,
          linkedin_active: isActive,
        })
        .eq('id', contact.id);

      if (isActive) active++;
      else inactive++;
    } catch {
      await supabase.from('tam_contacts').update({ linkedin_active: false }).eq('id', contact.id);
      inactive++;
    }

    const progress = Math.round(((i + 1) / contacts.length) * 100);
    await supabase.from('tam_job_queue').update({ progress }).eq('id', job.id);
  }

  return { active, inactive, total: contacts.length };
}

// ============================================
// Refine DiscoLike (feedback-driven re-discovery)
// ============================================

async function handleRefineDiscolike(supabase: any, job: any, project: any) {
  const discolikeKey = Deno.env.get('DISCOLIKE_API_KEY');
  if (!discolikeKey) throw new Error('DISCOLIKE_API_KEY not configured');

  const icpProfile = project?.icp_profile || {};
  const pg = (start: number, end: number) => progressFn(supabase, job.id, start, end);

  // Get original seed domains from ICP profile
  const originalSeeds = (icpProfile.seedCompanyDomains || [])
    .map((d: string) => normalizeDomain(d))
    .filter(Boolean) as string[];

  // Get liked companies' domains (expand seed set)
  const { data: likedCompanies } = await supabase
    .from('tam_companies')
    .select('domain')
    .eq('project_id', job.project_id)
    .eq('source', 'discolike')
    .eq('feedback', 'liked')
    .not('domain', 'is', null);

  const likedDomains = (likedCompanies || [])
    .map((c: any) => normalizeDomain(c.domain))
    .filter(Boolean) as string[];

  // Get disliked companies' domains (exclude from results)
  const { data: dislikedCompanies } = await supabase
    .from('tam_companies')
    .select('domain')
    .eq('project_id', job.project_id)
    .eq('source', 'discolike')
    .eq('feedback', 'disliked')
    .not('domain', 'is', null);

  const dislikedDomains = new Set(
    (dislikedCompanies || []).map((c: any) => normalizeDomain(c.domain)).filter(Boolean)
  );

  // Build expanded seed set: original seeds + liked domains (up to 10)
  const seedSet = new Set<string>([...originalSeeds, ...likedDomains]);
  const seedDomains = [...seedSet].slice(0, 10);

  if (seedDomains.length === 0) {
    return { companiesFound: 0, message: 'No seed domains available' };
  }

  await pg(0, 10)(0.5);

  // Get existing domains in project for dedup
  const { data: existingCompanies } = await supabase
    .from('tam_companies')
    .select('domain')
    .eq('project_id', job.project_id)
    .not('domain', 'is', null);

  const seen = new Set<string>(
    (existingCompanies || []).map((c: any) => normalizeDomain(c.domain)).filter(Boolean) as string[]
  );

  // Country filter
  let country = '';
  if (icpProfile.geography === 'us_only') country = 'US';
  else if (icpProfile.geography === 'specific_countries' && icpProfile.specificCountries?.length) {
    country = icpProfile.specificCountries[0];
  }

  const maxRecords = icpProfile.sourcingLimits?.discolikeMaxRecords || 200;

  await pg(10, 20)(0.5);

  // Run domain consensus discovery with expanded seed set
  const results = await discolikeDiscoverByDomains(discolikeKey, seedDomains, country, maxRecords);

  await pg(20, 60)(1.0);

  // Filter out disliked domains and build company list
  const companies: SourcedCompany[] = [];
  for (const r of results) {
    const domain = normalizeDomain(r.domain || r.website || null);
    if (domain && dislikedDomains.has(domain)) continue;

    addCompany(companies, seen, {
      name: r.name || r.company_name || r.domain || '',
      domain: r.domain || r.website || null,
      linkedin_url: null,
      industry: r.industry || r.category || null,
      employee_count: r.employees || r.employee_count || null,
      location: r.address || r.location || r.country || null,
      description: r.description || null,
      digital_footprint_score: r.score || r.digital_footprint_score || null,
      similarity_score: r.similarity || null,
      source: 'discolike',
      raw: r,
    });
  }

  // Insert new companies
  const { inserted, failed } = await batchInsertCompanies(
    supabase,
    job.project_id,
    companies,
    pg(60, 100)
  );

  return {
    companiesFound: companies.length,
    inserted,
    failed,
    seedDomainsUsed: seedDomains.length,
    likedCount: likedDomains.length,
    dislikedExcluded: dislikedDomains.size,
    totalResults: results.length,
  };
}

// ============================================
// Main serve function
// ============================================

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'jobId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load job
    const { data: job, error: jobError } = await supabase
      .from('tam_job_queue')
      .select(
        'id, project_id, job_type, status, progress, result_summary, created_at, completed_at'
      )
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set status to running
    await supabase.from('tam_job_queue').update({ status: 'running', progress: 0 }).eq('id', jobId);

    // Load project for ICP context
    const { data: project } = await supabase
      .from('tam_projects')
      .select('id, user_id, name, status, icp_profile, sourcing_strategy, created_at, updated_at')
      .eq('id', job.project_id)
      .single();

    let resultSummary: Record<string, unknown> = {};

    try {
      switch (job.job_type) {
        case 'source_companies':
          resultSummary = await handleSourceCompanies(supabase, job, project);
          break;
        case 'qualify':
          resultSummary = await handleQualify(supabase, job, project);
          break;
        case 'find_contacts':
          resultSummary = await handleFindContacts(supabase, job, project);
          break;
        case 'check_linkedin':
          resultSummary = await handleCheckLinkedin(supabase, job, project);
          break;
        case 'refine_discolike':
          resultSummary = await handleRefineDiscolike(supabase, job, project);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // Mark completed
      await supabase
        .from('tam_job_queue')
        .update({
          status: 'completed',
          progress: 100,
          result_summary: resultSummary,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    } catch (handlerError) {
      // Mark failed
      await supabase
        .from('tam_job_queue')
        .update({
          status: 'failed',
          result_summary: { error: handlerError.message },
        })
        .eq('id', jobId);

      throw handlerError;
    }

    return new Response(JSON.stringify({ success: true, resultSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
