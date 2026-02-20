import { supabase } from '../lib/supabaseClient';

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
}

export interface DfyActivityEntry {
  id: string;
  engagement_id: string;
  deliverable_id: string | null;
  action: string;
  description: string;
  actor: string;
  metadata: Record<string, unknown>;
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
  'id, proposal_id, client_name, client_email, client_company, portal_slug, status, monthly_rate, start_date, created_at';
const DFY_DELIVERABLE_COLUMNS =
  'id, engagement_id, name, description, category, status, assignee, due_date, sort_order, client_approved_at, client_notes, created_at';
const DFY_ACTIVITY_COLUMNS =
  'id, engagement_id, deliverable_id, action, description, actor, metadata, created_at';

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
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as DfyActivityEntry[];
}
