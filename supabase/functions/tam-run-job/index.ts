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

// Handler function for sourcing companies
async function handleSourceCompanies(supabase: any, job: any, project: any) {
  const config = job.config || {};
  const source = config.source || 'serper';
  const icpProfile = project?.icp_profile || {};

  let companies: any[] = [];

  // Build search based on source type
  if (source === 'serper') {
    // Serper Google Search API
    const serperKey = Deno.env.get('SERPER_API_KEY');
    if (!serperKey) throw new Error('SERPER_API_KEY not configured');

    const searchQuery = buildSerperQuery(icpProfile);
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: searchQuery, num: 100 }),
    });

    const data = await response.json();
    companies = (data.organic || []).map((result: any) => ({
      name: result.title,
      domain: new URL(result.link).hostname,
      description: result.snippet,
      source: 'serper',
    }));
  } else if (source === 'storeleads') {
    // Storeleads API for ecommerce
    const storeleadsKey = Deno.env.get('STORELEADS_API_KEY');
    if (!storeleadsKey) throw new Error('STORELEADS_API_KEY not configured');

    // TODO: Implement Storeleads API call
    companies = [];
  } else if (source === 'blitzapi') {
    // BlitzAPI company search via RapidAPI
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) throw new Error('RAPIDAPI_KEY not configured');

    // TODO: Implement BlitzAPI company search
    companies = [];
  }

  // Insert companies into database
  if (companies.length > 0) {
    const insertData = companies.map((c: any) => ({
      project_id: job.project_id,
      name: c.name,
      domain: c.domain || null,
      linkedin_url: c.linkedin_url || null,
      source: c.source,
      industry: c.industry || null,
      employee_count: c.employee_count || null,
      location: c.location || null,
      description: c.description || null,
      qualification_status: 'pending',
      raw_data: c,
    }));

    const batchSize = 100;
    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);
      await supabase.from('tam_companies').insert(batch);

      const progress = Math.round(((i + batch.length) / insertData.length) * 100);
      await supabase.from('tam_job_queue').update({ progress }).eq('id', job.id);
    }
  }

  return { companiesFound: companies.length, source };
}

function buildSerperQuery(icpProfile: any): string {
  const parts: string[] = [];
  if (icpProfile.industryKeywords?.length) {
    parts.push(icpProfile.industryKeywords.join(' OR '));
  }
  if (icpProfile.businessModel === 'local_service') {
    parts.push('near me');
  }
  if (icpProfile.geography === 'us_only') {
    parts.push('USA');
  }
  return parts.join(' ') || 'companies';
}

// Handler function for qualifying companies
async function handleQualify(supabase: any, job: any, project: any) {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const icpProfile = project?.icp_profile || {};

  // Get all pending companies
  const { data: companies } = await supabase
    .from('tam_companies')
    .select('*')
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
        // Use Claude to qualify the company
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
                content: `Evaluate if this company matches our ICP. Respond with JSON: {"qualified": true/false, "reason": "brief reason"}

Company: ${company.name}
Domain: ${company.domain || 'unknown'}
Description: ${company.description || 'none'}
Industry: ${company.industry || 'unknown'}

ICP Criteria:
- Business model target: ${icpProfile.businessModel || 'any'}
- Industries: ${icpProfile.industryKeywords?.join(', ') || 'any'}
- Employee size: ${icpProfile.employeeSizeRanges?.join(', ') || 'any'}
- Geography: ${icpProfile.geography || 'any'}
- Special: ${icpProfile.specialCriteria || 'none'}`,
              },
            ],
          }),
        });

        const result = await response.json();
        const content = result.content?.[0]?.text || '';

        try {
          const parsed = JSON.parse(content);
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
        } catch {
          // If we can't parse, mark as qualified with note
          await supabase
            .from('tam_companies')
            .update({
              qualification_status: 'qualified',
              qualification_reason: 'Auto-qualified (parse error)',
            })
            .eq('id', company.id);
          qualified++;
        }
      } catch {
        // Skip on error, leave as pending
      }
    }

    const progress = Math.round(((i + batch.length) / companies.length) * 100);
    await supabase.from('tam_job_queue').update({ progress }).eq('id', job.id);
  }

  return { qualified, disqualified, total: companies.length };
}

// Handler function for finding contacts
async function handleFindContacts(supabase: any, job: any, project: any) {
  const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
  if (!rapidApiKey) throw new Error('RAPIDAPI_KEY not configured');

  const icpProfile = project?.icp_profile || {};

  // Get qualified companies
  const { data: companies } = await supabase
    .from('tam_companies')
    .select('*')
    .eq('project_id', job.project_id)
    .eq('qualification_status', 'qualified');

  if (!companies || companies.length === 0) {
    return { contactsFound: 0, emailsFound: 0, total: 0 };
  }

  let contactsFound = 0;
  let emailsFound = 0;

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];

    try {
      // BlitzAPI people search via RapidAPI
      const response = await fetch(
        'https://linkedin-b2b-data-enrichment-apis-blitzapi.p.rapidapi.com/company-employees',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'linkedin-b2b-data-enrichment-apis-blitzapi.p.rapidapi.com',
          },
          body: JSON.stringify({
            companyDomain: company.domain,
            titles: icpProfile.targetTitles || ['CEO', 'Founder'],
            limit: icpProfile.contactsPerCompany || 1,
          }),
        }
      );

      const data = await response.json();
      const contacts = Array.isArray(data) ? data : data.results || [];

      for (const contact of contacts.slice(0, icpProfile.contactsPerCompany || 1)) {
        await supabase.from('tam_contacts').insert({
          company_id: company.id,
          project_id: job.project_id,
          first_name: contact.firstName || contact.first_name || null,
          last_name: contact.lastName || contact.last_name || null,
          title: contact.title || contact.position || null,
          linkedin_url: contact.linkedinUrl || contact.linkedin_url || null,
          email: contact.email || null,
          email_status: contact.email ? 'found' : 'not_found',
          phone: contact.phone || null,
          source: 'blitzapi',
          raw_data: contact,
        });

        contactsFound++;
        if (contact.email) emailsFound++;
      }
    } catch {
      // Skip company on error
    }

    const progress = Math.round(((i + 1) / companies.length) * 100);
    await supabase.from('tam_job_queue').update({ progress }).eq('id', job.id);
  }

  return { contactsFound, emailsFound, totalCompanies: companies.length };
}

// Handler function for checking LinkedIn activity
async function handleCheckLinkedin(supabase: any, job: any, _project: any) {
  const brightDataKey = Deno.env.get('BRIGHT_DATA_API_KEY');
  if (!brightDataKey) throw new Error('BRIGHT_DATA_API_KEY not configured');

  // Get contacts with LinkedIn URLs
  const { data: contacts } = await supabase
    .from('tam_contacts')
    .select('*')
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
      // Bright Data LinkedIn scrape for most recent post
      // TODO: Replace with actual Bright Data API endpoint
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
      // Mark as inactive on error
      await supabase.from('tam_contacts').update({ linkedin_active: false }).eq('id', contact.id);
      inactive++;
    }

    const progress = Math.round(((i + 1) / contacts.length) * 100);
    await supabase.from('tam_job_queue').update({ progress }).eq('id', job.id);
  }

  return { active, inactive, total: contacts.length };
}

// Main serve function
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
      .select('*')
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
      .select('*')
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
