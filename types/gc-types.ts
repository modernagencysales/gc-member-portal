/**
 * Growth Collective Member Portal Types
 *
 * These types map to the Supabase database schema for the GC Member Portal.
 */

// ============================================
// GC Members (tblCUYvanbJPMKpcd)
// ============================================
export type MemberPlan = 'Full ($1000/mo)' | 'Lite ($600/mo)' | 'Trial';
export type MemberStatus = 'Onboarding' | 'Active' | 'Paused' | 'Churned';

export interface GCMemberFields {
  Email: string;
  Name?: string;
  Company?: string;
  Website?: string;
  LinkedIn?: string;
  Plan?: MemberPlan;
  Status?: MemberStatus;
  'Start Date'?: string;
  'Slack Handle'?: string;
  'Calendar Link'?: string;
  Notes?: string;
  // Linked records
  'Tool Access'?: string[];
  'Member Progress'?: string[];
  Campaigns?: string[];
  'Member ICP'?: string[];
  'Team Task Tracking'?: string[];
}

export interface GCMember {
  id: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  linkedIn?: string;
  plan: MemberPlan;
  status: MemberStatus;
  startDate?: Date;
  slackHandle?: string;
  calendarLink?: string;
  notes?: string;
}

// ============================================
// Tool Access (tbl6WPJzf9BsCYUbE)
// ============================================
export type ToolName =
  | 'Clay'
  | 'Smartlead'
  | 'HeyReach'
  | 'Apify'
  | 'Anthropic API'
  | 'Gemini API'
  | 'Zapmail'
  | 'Mailforge'
  | 'Linked Helper';

export type ToolAccessType = 'Shared Account' | 'Client Account' | 'Own Account';
export type ToolStatus = 'Not Set Up' | 'Pending' | 'Active' | 'Issues';

export interface ToolAccessFields {
  'Record Name'?: string;
  Member?: string[];
  Tool?: ToolName;
  'Login URL'?: string;
  Username?: string;
  Password?: string;
  'Access Type'?: ToolAccessType;
  Status?: ToolStatus;
  'Setup Doc'?: string;
  Notes?: string;
}

export interface ToolAccess {
  id: string;
  recordName?: string;
  memberId?: string;
  tool: ToolName;
  loginUrl?: string;
  username?: string;
  password?: string;
  accessType: ToolAccessType;
  status: ToolStatus;
  setupDoc?: string;
  notes?: string;
}

// ============================================
// Onboarding Checklist (tbl3m2PpabdeyqOpb)
// Master template - NOT duplicated per member
// ============================================
export type OnboardingCategory = 'Before Kickoff' | 'Week 1' | 'Week 2' | 'Week 3-4' | 'Ongoing';
export type SupportType =
  | 'Self-Service'
  | 'Doc/Template Provided'
  | 'Review on Call'
  | 'Strategy Guidance'
  | 'Initial Setup Help';
export type PlanRequired = 'All Plans' | 'Full Only';

export interface OnboardingChecklistFields {
  Item?: string;
  Category?: OnboardingCategory;
  'Support Type'?: SupportType;
  Order?: number;
  Description?: string;
  'Doc Link'?: string;
  'Plan Required'?: PlanRequired;
  'Member Progress'?: string[];
}

export interface OnboardingChecklistItem {
  id: string;
  item: string;
  category: OnboardingCategory;
  supportType: SupportType;
  order: number;
  description?: string;
  docLink?: string;
  planRequired: PlanRequired;
}

// ============================================
// Member Progress (tblpTPONdNydnRQQ3)
// Individual tracking per member per checklist item
// ============================================
export type ProgressStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Complete';

export interface MemberProgressFields {
  'Record ID'?: string;
  Member?: string[];
  'Checklist Item'?: string[];
  Status?: ProgressStatus;
  'Completed Date'?: string;
  Notes?: string;
}

export interface MemberProgress {
  id: string;
  recordId?: string;
  memberId?: string;
  checklistItemId?: string;
  status: ProgressStatus;
  completedDate?: Date;
  notes?: string;
}

// Combined view for UI - checklist item with progress
export interface OnboardingProgressItem extends OnboardingChecklistItem {
  progressId?: string;
  progressStatus: ProgressStatus;
  completedDate?: Date;
  progressNotes?: string;
}

// Grouped by category for display
export interface OnboardingCategoryGroup {
  name: OnboardingCategory;
  items: OnboardingProgressItem[];
  completedCount: number;
  totalCount: number;
}

// ============================================
// Member ICP (tblpunEDDXbhq3ojc)
// ============================================
export interface MemberICPFields {
  'Company Name'?: string;
  Member?: string[];
  'Target Description'?: string;
  Verticals?: string;
  'Company Size'?: string;
  'Job Titles'?: string;
  Geography?: string;
  'Pain Points'?: string;
  'Social Proof'?: string;
  Differentiator?: string;
  'Common Objections'?: string;
  Offer?: string;
}

export interface MemberICP {
  id: string;
  companyName?: string;
  memberId?: string;
  targetDescription?: string;
  verticals?: string;
  companySize?: string;
  jobTitles?: string;
  geography?: string;
  painPoints?: string;
  socialProof?: string;
  differentiator?: string;
  commonObjections?: string;
  offer?: string;
}

// ============================================
// Campaigns (tblPb8i1PyfpqT98c)
// ============================================
export type CampaignChannel = 'Cold Email' | 'LinkedIn DM' | 'Both';
export type CampaignStatus = 'Draft' | 'Warming Up' | 'Live' | 'Paused' | 'Ended';

export interface CampaignFields {
  'Campaign Name'?: string;
  Member?: string[];
  Channel?: CampaignChannel;
  Status?: CampaignStatus;
  'ICP Segment'?: string;
  'Messaging Angle'?: string;
  'Email 1'?: string;
  'Email 2'?: string;
  'LinkedIn DM'?: string;
  'Start Date'?: string;
  'Contacts Reached'?: number;
  Opens?: number;
  'Replies (Self-Reported)'?: number;
  'Positive Replies (Self-Reported)'?: number;
  'Meetings Booked (Self-Reported)'?: number;
  'Last Updated By Member'?: string;
  Notes?: string;
}

export interface Campaign {
  id: string;
  campaignName: string;
  memberId?: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  icpSegment?: string;
  messagingAngle?: string;
  email1?: string;
  email2?: string;
  linkedInDM?: string;
  startDate?: Date;
  metrics: CampaignMetrics;
  lastUpdatedByMember?: Date;
  notes?: string;
}

export interface CampaignMetrics {
  contactsReached: number;
  opens: number;
  replies: number;
  positiveReplies: number;
  meetingsBooked: number;
}

// ============================================
// Resources (tblCHPQexaXAvglGq)
// ============================================
export type ResourceCategory =
  | 'Getting Started'
  | 'Email Infrastructure'
  | 'Clay & List Building'
  | 'Cold Email'
  | 'LinkedIn Outreach'
  | 'Campaign Strategy'
  | 'Templates'
  | 'Troubleshooting';

export type ResourceTool =
  | 'General'
  | 'Clay'
  | 'Smartlead'
  | 'HeyReach'
  | 'Zapmail'
  | 'Mailforge'
  | 'Linked Helper';

export interface ResourceFields {
  Title?: string;
  Category?: ResourceCategory;
  Description?: string;
  URL?: string;
  Tool?: ResourceTool;
  Order?: number;
  'Plan Required'?: PlanRequired;
  Featured?: boolean;
}

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  description?: string;
  url?: string;
  tool: ResourceTool;
  order: number;
  planRequired: PlanRequired;
  featured: boolean;
}

// ============================================
// Status Color Configuration
// ============================================
export type StatusColor = 'green' | 'yellow' | 'gray' | 'red';

export interface StatusColorConfig {
  bg: string;
  text: string;
  border: string;
  darkBg: string;
  darkText: string;
  darkBorder: string;
}

export const STATUS_COLORS: Record<StatusColor, StatusColorConfig> = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    darkBg: 'dark:bg-green-900/30',
    darkText: 'dark:text-green-400',
    darkBorder: 'dark:border-green-800',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    darkBg: 'dark:bg-yellow-900/30',
    darkText: 'dark:text-yellow-400',
    darkBorder: 'dark:border-yellow-800',
  },
  gray: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    darkBg: 'dark:bg-slate-800',
    darkText: 'dark:text-slate-400',
    darkBorder: 'dark:border-slate-700',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    darkBg: 'dark:bg-red-900/30',
    darkText: 'dark:text-red-400',
    darkBorder: 'dark:border-red-800',
  },
};

// Map status values to colors
export function getStatusColor(status: string): StatusColor {
  const greenStatuses = ['Active', 'Complete', 'Done', 'Live'];
  const yellowStatuses = ['Onboarding', 'In Progress', 'Warming Up', 'Pending'];
  const grayStatuses = ['Paused', 'Draft', 'Not Started', 'Not Set Up'];
  const redStatuses = ['Churned', 'Blocked', 'Issues', 'Ended', 'Expired'];

  if (greenStatuses.includes(status)) return 'green';
  if (yellowStatuses.includes(status)) return 'yellow';
  if (grayStatuses.includes(status)) return 'gray';
  if (redStatuses.includes(status)) return 'red';
  return 'gray';
}

// ============================================
// Auth Types
// ============================================
export type AppMode = 'gc' | 'bootcamp';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: AppMode | null;
  gcMember: GCMember | null;
  error: string | null;
}
