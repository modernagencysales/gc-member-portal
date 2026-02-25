import { supabase } from '../lib/supabaseClient';

// ============================================
// Client Portal Token Helpers
// ============================================

const PORTAL_TOKEN_KEY = 'dfy_portal_token';

export function storePortalToken(token: string): void {
  localStorage.setItem(PORTAL_TOKEN_KEY, token);
}

export function getPortalToken(): string | null {
  return localStorage.getItem(PORTAL_TOKEN_KEY);
}

export function clearPortalToken(): void {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getPortalToken();
  if (token) {
    headers['x-client-portal-token'] = token;
  }
  return headers;
}

// ============================================
// DFY Service Types
// ============================================

export interface SignProposalPayload {
  signed_name: string;
  signed_ip: string;
  signed_user_agent: string;
}

export interface SignProposalResponse {
  engagement_id: string;
  checkout_url: string;
}

export interface DfyEngagement {
  id: string;
  proposal_id: string;
  client_name: string;
  client_email: string;
  client_company: string;
  portal_slug: string;
  status: string;
  monthly_rate: number;
  start_date: string;
  onboarding_checklist: Record<
    string,
    { label: string; completed: boolean; notes?: string }
  > | null;
  unipile_account_id: string | null;
  linkedin_connected_at: string | null;
  intake_data: Record<string, unknown> | null;
  intake_submitted_at: string | null;
  engagement_type: 'intro_offer' | 'full_dfy';
  blueprint_prospect_id: string | null;
  intake_status: 'pending' | 'submitted' | 'processing' | 'ready';
  processed_intake: Record<string, unknown> | null;
  magnetlab_user_id: string | null;
  created_at: string;
}

export interface DfyDeliverable {
  id: string;
  engagement_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  assignee: string;
  due_date: string;
  sort_order: number;
  client_approved_at: string | null;
  client_notes: string | null;
  automation_type: string | null;
}

export interface DfyActivityEntry {
  id: string;
  engagement_id: string;
  deliverable_id: string | null;
  action: string;
  description: string;
  actor: string;
  metadata: Record<string, unknown>;
  client_visible: boolean;
  created_at: string;
}

// ============================================
// Sign Proposal
// ============================================

const GTM_SYSTEM_URL = import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtmconductor.com';

export async function signProposal(
  proposalId: string,
  payload: SignProposalPayload
): Promise<SignProposalResponse> {
  const res = await fetch(`${GTM_SYSTEM_URL}/api/proposals/${proposalId}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Sign request failed' }));
    throw new Error(error.error || 'Failed to sign proposal');
  }
  return res.json();
}

// ============================================
// Portal Data Fetching (for client portal)
// ============================================

const DFY_ENGAGEMENT_COLUMNS =
  'id, proposal_id, client_name, client_email, client_company, portal_slug, status, monthly_rate, start_date, onboarding_checklist, unipile_account_id, linkedin_connected_at, intake_data, intake_submitted_at, engagement_type, blueprint_prospect_id, intake_status, processed_intake, magnetlab_user_id, created_at';
const DFY_DELIVERABLE_COLUMNS =
  'id, engagement_id, name, description, category, status, assignee, due_date, sort_order, client_approved_at, client_notes, automation_type, created_at';
const DFY_ACTIVITY_COLUMNS =
  'id, engagement_id, deliverable_id, action, description, actor, metadata, client_visible, created_at';

export async function getEngagementBySlug(slug: string): Promise<DfyEngagement | null> {
  const { data, error } = await supabase
    .from('dfy_engagements')
    .select(DFY_ENGAGEMENT_COLUMNS)
    .eq('portal_slug', slug)
    .single();
  if (error || !data) return null;
  return data as DfyEngagement;
}

export async function getDeliverables(engagementId: string): Promise<DfyDeliverable[]> {
  const { data, error } = await supabase
    .from('dfy_deliverables')
    .select(DFY_DELIVERABLE_COLUMNS)
    .eq('engagement_id', engagementId)
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data as DfyDeliverable[];
}

export async function getActivityLog(engagementId: string): Promise<DfyActivityEntry[]> {
  const { data, error } = await supabase
    .from('dfy_activity_log')
    .select(DFY_ACTIVITY_COLUMNS)
    .eq('engagement_id', engagementId)
    .eq('client_visible', true)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as DfyActivityEntry[];
}

// ============================================
// Approve Deliverable
// ============================================

export async function approveDeliverable(
  deliverableId: string,
  portalSlug: string,
  notes?: string
): Promise<void> {
  const res = await fetch(`${GTM_SYSTEM_URL}/api/dfy/deliverables/${deliverableId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ portal_slug: portalSlug, notes }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Approval failed' }));
    throw new Error(error.error || 'Failed to approve deliverable');
  }
}

// ============================================
// LinkedIn Connect (Client Portal)
// ============================================

export async function requestLinkedInConnect(portalSlug: string): Promise<{ url: string }> {
  const res = await fetch(`${GTM_SYSTEM_URL}/api/dfy/client/linkedin-connect`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ portal_slug: portalSlug }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to connect LinkedIn' }));
    throw new Error(error.error || 'Failed to start LinkedIn connection');
  }
  const data = await res.json();
  return { url: data.url };
}

// ============================================
// Client Checklist Update
// ============================================

export async function updateClientChecklist(
  portalSlug: string,
  updates: Record<string, { completed?: boolean; notes?: string }>
): Promise<void> {
  const res = await fetch(`${GTM_SYSTEM_URL}/api/dfy/client/checklist`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ portal_slug: portalSlug, updates }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Checklist update failed' }));
    throw new Error(error.error || 'Failed to update checklist');
  }
}

// ============================================
// Request Revision (Client Portal)
// ============================================

export async function requestRevision(
  deliverableId: string,
  portalSlug: string,
  feedback: string
): Promise<void> {
  const res = await fetch(
    `${GTM_SYSTEM_URL}/api/dfy/deliverables/${deliverableId}/request-revision`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ portal_slug: portalSlug, feedback }),
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Revision request failed' }));
    throw new Error(error.error || 'Failed to request revision');
  }
}

// ============================================
// Validate Portal Token
// ============================================

export async function validatePortalToken(
  token: string
): Promise<{ valid: boolean; engagement_id?: string; portal_slug?: string }> {
  const res = await fetch(`${GTM_SYSTEM_URL}/api/dfy/client/validate-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return { valid: false };
  return res.json();
}

// ============================================
// Automation Output (Client Portal)
// ============================================

export async function fetchAutomationOutput(
  portalSlug: string,
  automationType: string
): Promise<{ output: unknown; completed_at: string | null } | null> {
  const params = new URLSearchParams({ portal_slug: portalSlug, automation_type: automationType });
  const headers = getAuthHeaders();
  const res = await fetch(`${GTM_SYSTEM_URL}/api/dfy/client/automation-output?${params}`, {
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

// ============================================
// Client Metrics (Client Portal)
// ============================================

// ============================================
// Submit Intake Form (Client Portal)
// ============================================

export async function submitIntakeForm(
  portalSlug: string,
  fields: {
    ideal_client: string;
    crm_type: string;
    crm_access: string;
    notetaker_tool: string;
    notetaker_other?: string;
    linkedin_url: string;
  },
  files: File[] = []
): Promise<void> {
  // Upload files to Supabase Storage first (if any)
  const uploadedFiles: Array<{ name: string; path: string; size: number; type: string }> = [];

  for (const file of files) {
    const fileId = globalThis.crypto.randomUUID();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    // Use portalSlug as folder prefix (engagement_id not available on client)
    const storagePath = `${portalSlug}/${fileId}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from('dfy-intake-files')
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      throw new Error(`Failed to upload file "${file.name}"`);
    }

    uploadedFiles.push({
      name: file.name,
      path: storagePath,
      size: file.size,
      type: file.type,
    });
  }

  // Call RPC function (runs via Supabase — no cross-origin call to gtm-system)
  const { data, error } = await supabase.rpc('submit_dfy_intake', {
    p_portal_slug: portalSlug,
    p_ideal_client: fields.ideal_client,
    p_crm_type: fields.crm_type,
    p_crm_access: fields.crm_access || null,
    p_notetaker_tool: fields.notetaker_tool,
    p_notetaker_other: fields.notetaker_tool === 'Other' ? fields.notetaker_other || null : null,
    p_linkedin_url: fields.linkedin_url,
    p_files: uploadedFiles,
  });

  if (error) {
    throw new Error(error.message || 'Submission failed');
  }

  // RPC returns { success: true } or { error: '...' }
  if (data?.error) {
    throw new Error(data.error);
  }
}

// ============================================
// Client Metrics (Client Portal)
// ============================================

export async function getClientMetrics(portalSlug: string): Promise<{
  funnel: { views: number; leads: number; conversionRate: number };
  content: { created: number; published: number; inReview: number };
  milestones: {
    total: number;
    completed: number;
    completionPct: number;
    timeline: Array<{
      name: string;
      status: string;
      category: string;
      dueDate: string | null;
      completedAt: string | null;
    }>;
  };
  startDate: string | null;
}> {
  const params = new URLSearchParams({ portal_slug: portalSlug });
  const headers = getAuthHeaders();
  const res = await fetch(`${GTM_SYSTEM_URL}/api/dfy/client/metrics?${params}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch client metrics');
  }
  return res.json();
}
