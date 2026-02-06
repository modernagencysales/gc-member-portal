/**
 * LinkedIn Bootcamp Student Onboarding Types
 * Maps to the Supabase database schema for bootcamp student management
 */

// ============================================
// Bootcamp Student
// ============================================
export type BootcampStudentStatus = 'Onboarding' | 'Active' | 'Completed' | 'Paused' | 'Churned';
export type BootcampAccessLevel =
  | 'Full Access'
  | 'Curriculum Only'
  | 'Lead Magnet'
  | 'Funnel Access';

export type SubscriptionStatus = 'none' | 'active' | 'canceled' | 'past_due';

export type StudentCohortRole = 'student' | 'member' | 'resources';

export interface StudentCohort {
  studentId: string;
  cohortId: string;
  role: StudentCohortRole;
  joinedAt: Date;
  accessLevel?: string;
  onboardingCompletedAt?: Date;
  accessExpiresAt?: Date;
  enrollmentSource?: string;
}

export interface StudentEnrollment extends StudentCohort {
  cohort: import('../types/lms-types').LmsCohort;
}

export interface SubscriptionEvent {
  id: string;
  studentId: string;
  eventType: 'created' | 'paid' | 'canceled' | 'payment_failed' | 'reactivated';
  stripeEventId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface BootcampStudent {
  id: string;
  email: string;
  name?: string;
  company?: string;
  cohort: string;
  status: BootcampStudentStatus;
  accessLevel: BootcampAccessLevel;
  purchaseDate?: Date;
  onboardingCompletedAt?: Date;
  slackInvited: boolean;
  slackInvitedAt?: Date;
  calendarAdded: boolean;
  calendarAddedAt?: Date;
  paymentSource?: string;
  paymentId?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionId?: string;
  subscriptionStartedAt?: Date;
  subscriptionEndsAt?: Date;
  stripeCustomerId?: string;
  notes?: string;
  /** Link to prospect record for Blueprint access */
  prospectId?: string;
  /** Time-limited access expiry for Funnel Access users */
  accessExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Onboarding Checklist
// ============================================
export type BootcampOnboardingCategory =
  | 'Welcome'
  | 'Account Setup'
  | 'AI Tools'
  | 'Community'
  | 'Getting Started';

export interface BootcampChecklistItem {
  id: string;
  item: string;
  category: BootcampOnboardingCategory;
  description?: string;
  videoUrl?: string;
  docLink?: string;
  aiToolId?: string;
  sortOrder: number;
  isRequired: boolean;
  isVisible: boolean;
  createdAt: Date;
}

// ============================================
// Student Progress
// ============================================
export type BootcampProgressStatus = 'Not Started' | 'In Progress' | 'Complete' | 'Skipped';

export interface BootcampStudentProgress {
  id: string;
  studentId: string;
  checklistItemId: string;
  status: BootcampProgressStatus;
  completedAt?: Date;
  notes?: string;
}

// Combined view for UI - checklist item with progress
export interface BootcampOnboardingProgressItem extends BootcampChecklistItem {
  progressId?: string;
  progressStatus: BootcampProgressStatus;
  completedAt?: Date;
  progressNotes?: string;
}

// Grouped by category for display
export interface BootcampOnboardingCategoryGroup {
  name: BootcampOnboardingCategory;
  items: BootcampOnboardingProgressItem[];
  completedCount: number;
  totalCount: number;
}

// ============================================
// Student Survey
// ============================================
export type CompanySize = 'Solo' | '2-10' | '11-50' | '51-200' | '201-500' | '500+';
export type LinkedInExperience = 'None' | 'Beginner' | 'Intermediate' | 'Advanced';
export type MonthlyOutreachVolume = '0' | '1-100' | '101-500' | '501-1000' | '1000+';

export interface BootcampStudentSurvey {
  id: string;
  studentId: string;
  // Business Basics
  companyName?: string;
  website?: string;
  industry?: string;
  companySize?: CompanySize;
  roleTitle?: string;
  // Goals & Challenges
  primaryGoal?: string;
  biggestChallenges?: string[];
  linkedinExperience?: LinkedInExperience;
  // Lead Gen Details
  targetAudience?: string;
  currentLeadGenMethods?: string[];
  monthlyOutreachVolume?: MonthlyOutreachVolume;
  toolsCurrentlyUsing?: string[];
  // Meta
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Survey form data (partial for step-by-step saving)
export interface BootcampSurveyFormData {
  // Step 1: Business Basics
  companyName?: string;
  website?: string;
  industry?: string;
  companySize?: CompanySize;
  roleTitle?: string;
  // Step 2: Goals & Challenges
  primaryGoal?: string;
  biggestChallenges?: string[];
  linkedinExperience?: LinkedInExperience;
  // Step 3: Lead Generation
  targetAudience?: string;
  currentLeadGenMethods?: string[];
  monthlyOutreachVolume?: MonthlyOutreachVolume;
  toolsCurrentlyUsing?: string[];
}

// ============================================
// Settings
// ============================================
export interface BootcampSettings {
  aiToolsVisible: boolean;
  introVideoUrl: string;
  slackChannelIds: string[];
  calendarEventIds: string[];
  welcomeMessage: string;
  // AI Tools page customization
  aiToolsTitle: string;
  aiToolsSubtitle: string;
  aiToolsInfoTitle: string;
  aiToolsInfoText: string;
}

// ============================================
// Admin Types
// ============================================
export interface BootcampStudentWithProgress extends BootcampStudent {
  onboardingProgress: number; // Percentage 0-100
  survey?: BootcampStudentSurvey;
}

export type BootcampAutomationAction = 'slack' | 'calendar' | 'both';

export interface BootcampAutomationResult {
  studentId: string;
  email: string;
  action: BootcampAutomationAction;
  success: boolean;
  error?: string;
}

// ============================================
// Cohorts
// ============================================
export type BootcampCohortStatus = 'Active' | 'Archived';

export interface BootcampCohort {
  id: string;
  name: string;
  description?: string;
  status: BootcampCohortStatus;
  createdAt: Date;
}

// ============================================
// Invite Codes
// ============================================
export type BootcampInviteCodeStatus = 'Active' | 'Disabled';

export interface ToolGrant {
  toolSlug: string;
  credits: number;
}

export interface BootcampInviteCode {
  id: string;
  code: string;
  cohortId: string;
  cohortName?: string; // Joined from cohort table for display
  maxUses?: number | null;
  useCount: number;
  status: BootcampInviteCodeStatus;
  expiresAt?: Date;
  grantedAccessLevel?: BootcampAccessLevel;
  toolGrants?: ToolGrant[] | null;
  contentGrants?: string[] | null;
  createdAt: Date;
}

// ============================================
// Onboarding Flow State
// ============================================
export type OnboardingStep =
  | 'welcome'
  | 'video'
  | 'survey'
  | 'ai-tools'
  | 'slack'
  | 'calendar'
  | 'complete';

export interface OnboardingFlowState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  surveyData: BootcampSurveyFormData;
  surveyStep: number; // 1, 2, or 3
}

// ============================================
// Funnel Access Tool Presets
// ============================================
export interface FunnelToolPreset {
  name: string;
  toolSlugs: string[];
  description?: string;
}

export interface FunnelToolPresets {
  [presetKey: string]: FunnelToolPreset;
}

// ============================================
// Constants
// ============================================
export const BOOTCAMP_ONBOARDING_CATEGORIES: BootcampOnboardingCategory[] = [
  'Welcome',
  'Account Setup',
  'AI Tools',
  'Community',
  'Getting Started',
];

export const COMPANY_SIZES: CompanySize[] = ['Solo', '2-10', '11-50', '51-200', '201-500', '500+'];

export const LINKEDIN_EXPERIENCE_LEVELS: LinkedInExperience[] = [
  'None',
  'Beginner',
  'Intermediate',
  'Advanced',
];

export const MONTHLY_OUTREACH_VOLUMES: MonthlyOutreachVolume[] = [
  '0',
  '1-100',
  '101-500',
  '501-1000',
  '1000+',
];

export const INDUSTRY_OPTIONS = [
  'Technology/SaaS',
  'Marketing/Advertising',
  'Consulting',
  'Financial Services',
  'Healthcare',
  'E-commerce/Retail',
  'Real Estate',
  'Manufacturing',
  'Education',
  'Legal Services',
  'Other',
];

export const CHALLENGE_OPTIONS = [
  'Finding qualified leads',
  'Getting responses to outreach',
  'Booking meetings',
  'Building a consistent pipeline',
  'Managing time/capacity',
  'Writing effective copy',
  'Using LinkedIn effectively',
  'Following up consistently',
  'Tracking results',
];

export const LEAD_GEN_METHOD_OPTIONS = [
  'Cold email',
  'LinkedIn outreach',
  'Referrals',
  'Paid ads',
  'Content marketing',
  'Events/Networking',
  'SEO/Inbound',
  'Partnerships',
  'None currently',
];

export const TOOLS_OPTIONS = [
  'LinkedIn Sales Navigator',
  'Clay',
  'Apollo',
  'Lemlist',
  'HubSpot',
  'Salesforce',
  'Outreach',
  'SalesLoft',
  'Instantly',
  'Smartlead',
  'None',
  'Other',
];
