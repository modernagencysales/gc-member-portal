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

// All job types are dispatched to gtm-system Trigger.dev tasks.
// This edge function only handles job loading, status updates, and dispatch.

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

    // Dispatch to gtm-system Trigger.dev tasks.
    // The client polls tam_job_queue for progress updates.
    const gtmSystemUrl = Deno.env.get('GTM_SYSTEM_URL');
    const serviceApiKey = Deno.env.get('SERVICE_API_KEY');

    if (!gtmSystemUrl || !serviceApiKey) {
      await supabase
        .from('tam_job_queue')
        .update({
          status: 'failed',
          result_summary: { error: 'GTM_SYSTEM_URL or SERVICE_API_KEY not configured' },
        })
        .eq('id', jobId);
      return new Response(JSON.stringify({ error: 'Backend not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      await supabase
        .from('tam_job_queue')
        .update({
          status: 'failed',
          result_summary: { error: `Backend dispatch failed: ${errBody}` },
        })
        .eq('id', jobId);
      return new Response(JSON.stringify({ error: 'Backend dispatch failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const triggerData = await triggerRes.json();
    return new Response(
      JSON.stringify({ success: true, dispatched: true, taskId: triggerData.taskId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
