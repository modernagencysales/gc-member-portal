/**
 * Email Enrichment Batch Service
 * Handles all database operations for the CSV upload → email enrichment feature
 */

import { supabase } from '../lib/supabaseClient';
import { BLUEPRINT_BACKEND_URL } from '../lib/api-config';

// ============================================
// Types
// ============================================

export interface BatchRun {
  id: string;
  userId: string;
  name: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalContacts: number;
  processedContacts: number;
  emailsFound: number;
  createdAt: string;
  completedAt: string | null;
}

export interface BatchLead {
  id: string;
  runId: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  companyDomain: string | null;
  linkedinUrl: string | null;
  foundEmail: string | null;
  provider: string | null;
  validationStatus: string | null;
  status: 'pending' | 'processing' | 'found' | 'not_found' | 'error';
  errorMessage: string | null;
  createdAt: string;
}

// ============================================
// Column Lists
// ============================================

const BATCH_RUN_COLUMNS =
  'id, user_id, name, status, total_contacts, processed_contacts, emails_found, created_at, completed_at';

const BATCH_LEAD_COLUMNS =
  'id, run_id, first_name, last_name, company_name, company_domain, linkedin_url, found_email, provider, validation_status, status, error_message, created_at';

// ============================================
// Mappers
// ============================================

function mapBatchRun(data: Record<string, unknown>): BatchRun {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: (data.name as string) || null,
    status: data.status as BatchRun['status'],
    totalContacts: (data.total_contacts as number) || 0,
    processedContacts: (data.processed_contacts as number) || 0,
    emailsFound: (data.emails_found as number) || 0,
    createdAt: data.created_at as string,
    completedAt: (data.completed_at as string) || null,
  };
}

function mapBatchLead(data: Record<string, unknown>): BatchLead {
  return {
    id: data.id as string,
    runId: data.run_id as string,
    firstName: (data.first_name as string) || null,
    lastName: (data.last_name as string) || null,
    companyName: (data.company_name as string) || null,
    companyDomain: (data.company_domain as string) || null,
    linkedinUrl: (data.linkedin_url as string) || null,
    foundEmail: (data.found_email as string) || null,
    provider: (data.provider as string) || null,
    validationStatus: (data.validation_status as string) || null,
    status: data.status as BatchLead['status'],
    errorMessage: (data.error_message as string) || null,
    createdAt: data.created_at as string,
  };
}

// ============================================
// Operations
// ============================================

export async function createBatchRun(userId: string, name: string): Promise<BatchRun> {
  const { data, error } = await supabase
    .from('enrichment_batch_runs')
    .insert({ user_id: userId, name, total_contacts: 0 })
    .select(BATCH_RUN_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return mapBatchRun(data);
}

export async function insertBatchLeads(
  runId: string,
  leads: Array<{
    firstName?: string;
    lastName?: string;
    companyName?: string;
    companyDomain?: string;
    linkedinUrl?: string;
  }>
): Promise<void> {
  const insertData = leads.map((lead) => ({
    run_id: runId,
    first_name: lead.firstName || null,
    last_name: lead.lastName || null,
    company_name: lead.companyName || null,
    company_domain: lead.companyDomain || null,
    linkedin_url: lead.linkedinUrl || null,
  }));

  // Insert in chunks of 500
  for (let i = 0; i < insertData.length; i += 500) {
    const chunk = insertData.slice(i, i + 500);
    const { error } = await supabase.from('enrichment_batch_leads').insert(chunk);
    if (error) throw new Error(error.message);
  }

  // Update total_contacts on the run
  const { error: updateError } = await supabase
    .from('enrichment_batch_runs')
    .update({ total_contacts: leads.length })
    .eq('id', runId);

  if (updateError) throw new Error(updateError.message);
}

export async function fetchBatchRun(runId: string): Promise<BatchRun | null> {
  const { data, error } = await supabase
    .from('enrichment_batch_runs')
    .select(BATCH_RUN_COLUMNS)
    .eq('id', runId)
    .single();

  if (error || !data) return null;
  return mapBatchRun(data);
}

export async function fetchBatchLeads(runId: string): Promise<BatchLead[]> {
  const { data, error } = await supabase
    .from('enrichment_batch_leads')
    .select(BATCH_LEAD_COLUMNS)
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapBatchLead);
}

export async function fetchBatchRunsByUser(userId: string): Promise<BatchRun[]> {
  const { data, error } = await supabase
    .from('enrichment_batch_runs')
    .select(BATCH_RUN_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data || []).map(mapBatchRun);
}

export async function triggerBatchEnrichment(runId: string): Promise<{ taskHandleId: string }> {
  const backendUrl = BLUEPRINT_BACKEND_URL;

  // Get current session for auth
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Send auth token if available (backend validates via Supabase)
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${backendUrl}/api/enrichment/batch/trigger`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ run_id: runId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Failed to trigger enrichment: ${response.status}`);
  }

  const result = await response.json();
  return { taskHandleId: result.task_handle_id };
}
