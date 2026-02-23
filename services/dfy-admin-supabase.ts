import { supabase } from '../lib/supabaseClient';
import type {
  DfyAdminEngagement,
  DfyAdminDeliverable,
  DfyActivityEntry,
  DfyAutomationRun,
} from '../types/dfy-admin-types';

// Column constants — must match DB schema (never select('*'))
const ADMIN_ENGAGEMENT_COLUMNS =
  'id, proposal_id, tenant_id, client_name, client_email, client_company, portal_slug, status, monthly_rate, start_date, linear_project_id, slack_channel_id, stripe_subscription_id, onboarding_checklist, unipile_account_id, linkedin_connected_at, communication_preference, created_at';
const DELIVERABLE_COLUMNS =
  'id, engagement_id, name, description, category, status, assignee, due_date, sort_order, client_approved_at, client_notes, linear_issue_id, milestone_id, playbook_url, automation_type, automation_status, automation_config, depends_on, revision_feedback, revision_requested_at, revision_count, created_at';
const AUTOMATION_RUN_COLUMNS =
  'id, engagement_id, deliverable_id, automation_type, status, trigger_run_id, error_log, started_at, completed_at, created_at';
const ACTIVITY_COLUMNS =
  'id, engagement_id, deliverable_id, action, description, actor, metadata, client_visible, created_at';

// ============================================
// GTM Admin API helper (x-admin-key auth)
// ============================================

const GTM_API_BASE = import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtmconductor.com';
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

async function gtmAdminFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GTM_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_API_KEY,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ============================================
// Read functions (direct Supabase)
// ============================================

export async function fetchDfyEngagements(): Promise<DfyAdminEngagement[]> {
  const { data, error } = await supabase
    .from('dfy_engagements')
    .select(ADMIN_ENGAGEMENT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data || []) as DfyAdminEngagement[];
}

export async function fetchDfyEngagementById(id: string): Promise<DfyAdminEngagement | null> {
  const { data, error } = await supabase
    .from('dfy_engagements')
    .select(ADMIN_ENGAGEMENT_COLUMNS)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as DfyAdminEngagement;
}

export async function fetchDfyDeliverables(engagementId: string): Promise<DfyAdminDeliverable[]> {
  const { data, error } = await supabase
    .from('dfy_deliverables')
    .select(DELIVERABLE_COLUMNS)
    .eq('engagement_id', engagementId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as DfyAdminDeliverable[];
}

export async function fetchDfyActivityLog(engagementId: string): Promise<DfyActivityEntry[]> {
  const { data, error } = await supabase
    .from('dfy_activity_log')
    .select(ACTIVITY_COLUMNS)
    .eq('engagement_id', engagementId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data || []) as DfyActivityEntry[];
}

export async function fetchDfyOnboardingTemplate(): Promise<unknown> {
  const { data, error } = await supabase
    .from('bootcamp_settings')
    .select('value')
    .eq('key', 'dfy_onboarding_template')
    .single();

  if (error || !data) return null;
  return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
}

export async function fetchDfyTemplateBySlug(slug: string): Promise<unknown> {
  const key = `dfy_template_${slug}`;
  const { data, error } = await supabase
    .from('bootcamp_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
}

export async function saveDfyTemplateBySlug(slug: string, template: unknown) {
  return gtmAdminFetch('/api/dfy/admin/template', {
    method: 'PUT',
    body: JSON.stringify({ key: `dfy_template_${slug}`, template }),
  });
}

export async function fetchAutomationRuns(engagementId: string): Promise<DfyAutomationRun[]> {
  const { data, error } = await supabase
    .from('dfy_automation_runs')
    .select(AUTOMATION_RUN_COLUMNS)
    .eq('engagement_id', engagementId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data || []) as DfyAutomationRun[];
}

export async function fetchAllDeliverables(): Promise<
  Pick<DfyAdminDeliverable, 'id' | 'engagement_id' | 'status'>[]
> {
  const { data, error } = await supabase
    .from('dfy_deliverables')
    .select('id, engagement_id, status');

  if (error) throw new Error(error.message);
  return (data || []) as Pick<DfyAdminDeliverable, 'id' | 'engagement_id' | 'status'>[];
}

// ============================================
// Write functions (via gtm-system API)
// ============================================

export async function updateEngagement(
  id: string,
  data: {
    status?: string;
    onboarding_checklist?: Record<string, unknown>;
    communication_preference?: string;
  }
) {
  return gtmAdminFetch(`/api/dfy/admin/engagements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateDeliverable(
  id: string,
  data: {
    status?: string;
    assignee?: string;
    due_date?: string;
    automation_config?: Record<string, unknown>;
  }
) {
  return gtmAdminFetch(`/api/dfy/admin/deliverables/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function saveDfyOnboardingTemplate(template: unknown) {
  return gtmAdminFetch('/api/dfy/admin/template', {
    method: 'PUT',
    body: JSON.stringify(template),
  });
}

export async function retriggerOnboarding(engagementId: string) {
  return gtmAdminFetch(`/api/dfy/admin/engagements/${engagementId}/retrigger`, {
    method: 'POST',
  });
}

export async function triggerAutomation(deliverableId: string) {
  return gtmAdminFetch('/api/dfy/admin/trigger-automation', {
    method: 'POST',
    body: JSON.stringify({ deliverable_id: deliverableId }),
  });
}

export async function retryAutomation(runId: string) {
  return gtmAdminFetch('/api/dfy/admin/trigger-automation', {
    method: 'POST',
    body: JSON.stringify({ automation_run_id: runId }),
  });
}

export async function syncPlaybooks(engagementId?: string) {
  return gtmAdminFetch('/api/dfy/admin/playbook-sync', {
    method: 'POST',
    body: JSON.stringify(engagementId ? { engagement_id: engagementId } : {}),
  });
}

export async function manualOnboard(data: {
  client_name: string;
  client_email: string;
  client_company: string;
  client_industry?: string;
  monthly_rate?: number;
  communication_preference?: string;
}): Promise<{ success: boolean; engagement_id: string; portal_slug: string }> {
  return gtmAdminFetch('/api/dfy/admin/manual-onboard', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resendMagicLink(engagementId: string) {
  return gtmAdminFetch(`/api/dfy/client/magic-link`, {
    method: 'POST',
    body: JSON.stringify({ engagement_id: engagementId }),
  });
}

export async function postEngagementUpdate(engagementId: string, message: string) {
  return gtmAdminFetch(`/api/dfy/admin/engagements/${engagementId}/post-update`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
