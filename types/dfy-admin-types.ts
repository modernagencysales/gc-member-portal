// DFY Admin types — matches gtm-system dfy_engagements, dfy_deliverables, dfy_activity_log tables

export type DfyEngagementStatus =
  | 'pending_payment'
  | 'onboarding'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type DfyDeliverableStatus = 'pending' | 'in_progress' | 'review' | 'approved' | 'completed';

export type DfyCategory = 'onboarding' | 'content' | 'funnel' | 'outbound';

export interface OnboardingChecklistItem {
  label: string;
  completed: boolean;
  notes?: string;
}

export type OnboardingChecklist = Record<string, OnboardingChecklistItem>;

export interface DfyAdminEngagement {
  id: string;
  proposal_id: string;
  tenant_id: string;
  client_name: string;
  client_email: string;
  client_company: string;
  portal_slug: string;
  status: DfyEngagementStatus;
  monthly_rate: number;
  start_date: string;
  linear_project_id: string | null;
  slack_channel_id: string | null;
  stripe_subscription_id: string | null;
  onboarding_checklist: OnboardingChecklist | null;
  unipile_account_id: string | null;
  linkedin_connected_at: string | null;
  created_at: string;
}

export interface DfyAdminDeliverable {
  id: string;
  engagement_id: string;
  name: string;
  description: string;
  category: DfyCategory;
  status: DfyDeliverableStatus;
  assignee: string;
  due_date: string;
  sort_order: number;
  client_approved_at: string | null;
  client_notes: string | null;
  linear_issue_id: string | null;
  milestone_id: string | null;
  playbook_url: string | null;
  automation_type: string | null;
  automation_status: string;
  depends_on: string[];
  created_at: string;
}

export interface DfyAutomationRun {
  id: string;
  engagement_id: string;
  deliverable_id: string;
  automation_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  trigger_run_id: string | null;
  error_log: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
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

export interface DfyDeliverableTemplate {
  name: string;
  description: string;
  category: DfyCategory;
  assignee: string;
  relative_due_days: number;
}

// ============================================
// Constants
// ============================================

export const DEFAULT_ONBOARDING_CHECKLIST: OnboardingChecklist = {
  transcripts_access: { label: 'Ongoing access to call transcripts', completed: false, notes: '' },
  content_call: { label: 'Content call on the books', completed: false, notes: '' },
  existing_content: {
    label: 'All existing content / internal resources',
    completed: false,
    notes: '',
  },
  linkedin_login: { label: 'LinkedIn login', completed: false, notes: '' },
  clickup_access: { label: 'ClickUp login/access', completed: false, notes: '' },
  lead_list: { label: 'Lead list (workshop or filters)', completed: false, notes: '' },
  primary_offer: { label: 'Align on clear primary offer', completed: false, notes: '' },
  benchmark_metrics: { label: 'Benchmark of current metrics', completed: false, notes: '' },
  case_studies: { label: 'Best case studies with metrics', completed: false, notes: '' },
};

export const ENGAGEMENT_STATUS_CONFIGS: Record<
  DfyEngagementStatus,
  { label: string; color: string }
> = {
  pending_payment: { label: 'Pending Payment', color: 'yellow' },
  onboarding: { label: 'Onboarding', color: 'blue' },
  active: { label: 'Active', color: 'green' },
  paused: { label: 'Paused', color: 'orange' },
  completed: { label: 'Completed', color: 'slate' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

export const DELIVERABLE_STATUS_CONFIGS: Record<
  DfyDeliverableStatus,
  { label: string; color: string }
> = {
  pending: { label: 'Pending', color: 'slate' },
  in_progress: { label: 'In Progress', color: 'blue' },
  review: { label: 'In Review', color: 'purple' },
  approved: { label: 'Approved', color: 'green' },
  completed: { label: 'Completed', color: 'emerald' },
};

export const CATEGORY_LABELS: Record<DfyCategory, string> = {
  onboarding: 'Onboarding',
  content: 'Content',
  funnel: 'Funnel',
  outbound: 'Outbound',
};
