/**
 * Bootcamp Supabase Service
 * Handles all database operations for the LinkedIn Bootcamp Student Onboarding System
 */

import { supabase } from '../lib/supabaseClient';
import {
  BootcampStudent,
  BootcampChecklistItem,
  BootcampStudentProgress,
  BootcampStudentSurvey,
  BootcampOnboardingCategoryGroup,
  BootcampOnboardingProgressItem,
  BootcampSettings,
  BootcampProgressStatus,
  BootcampOnboardingCategory,
  BOOTCAMP_ONBOARDING_CATEGORIES,
  BootcampSurveyFormData,
  BootcampCohort,
  BootcampInviteCode,
  ToolGrant,
  FunnelToolPresets,
  CallGrantConfig,
} from '../types/bootcamp-types';

// ============================================
// Bootcamp Students
// ============================================

export async function verifyBootcampStudent(email: string): Promise<BootcampStudent | null> {
  try {
    const { data, error } = await supabase
      .from('bootcamp_students')
      .select('*')
      .ilike('email', email)
      .single();

    if (error || !data) {
      console.log('Bootcamp student not found:', email);
      return null;
    }

    return mapBootcampStudent(data);
  } catch (error) {
    console.error('Bootcamp student verification failed:', error);
    return null;
  }
}

export async function fetchAllBootcampStudents(): Promise<BootcampStudent[]> {
  const { data, error } = await supabase
    .from('bootcamp_students')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapBootcampStudent);
}

export async function fetchBootcampStudentById(studentId: string): Promise<BootcampStudent | null> {
  const { data, error } = await supabase
    .from('bootcamp_students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error || !data) return null;
  return mapBootcampStudent(data);
}

export async function createBootcampStudent(
  student: Partial<BootcampStudent>
): Promise<BootcampStudent> {
  const insertData = {
    email: student.email,
    name: student.name,
    company: student.company,
    cohort: student.cohort || 'Global',
    status: student.status || 'Onboarding',
    access_level: student.accessLevel || 'Full Access',
    purchase_date: student.purchaseDate?.toISOString(),
    payment_source: student.paymentSource,
    payment_id: student.paymentId,
    notes: student.notes,
  };

  const { data, error } = await supabase
    .from('bootcamp_students')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampStudent(data);
}

export async function updateBootcampStudent(
  studentId: string,
  updates: Partial<BootcampStudent>
): Promise<BootcampStudent> {
  const updateData: Record<string, unknown> = {};

  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.company !== undefined) updateData.company = updates.company;
  if (updates.cohort !== undefined) updateData.cohort = updates.cohort;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.accessLevel !== undefined) updateData.access_level = updates.accessLevel;
  if (updates.purchaseDate !== undefined)
    updateData.purchase_date = updates.purchaseDate?.toISOString();
  if (updates.onboardingCompletedAt !== undefined)
    updateData.onboarding_completed_at = updates.onboardingCompletedAt?.toISOString();
  if (updates.slackInvited !== undefined) updateData.slack_invited = updates.slackInvited;
  if (updates.slackInvitedAt !== undefined)
    updateData.slack_invited_at = updates.slackInvitedAt?.toISOString();
  if (updates.calendarAdded !== undefined) updateData.calendar_added = updates.calendarAdded;
  if (updates.calendarAddedAt !== undefined)
    updateData.calendar_added_at = updates.calendarAddedAt?.toISOString();
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.prospectId !== undefined) updateData.prospect_id = updates.prospectId;

  const { data, error } = await supabase
    .from('bootcamp_students')
    .update(updateData)
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampStudent(data);
}

export async function completeStudentOnboarding(studentId: string): Promise<BootcampStudent> {
  const { data, error } = await supabase
    .from('bootcamp_students')
    .update({
      status: 'Active',
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampStudent(data);
}

function mapBootcampStudent(record: Record<string, unknown>): BootcampStudent {
  return {
    id: record.id as string,
    email: record.email as string,
    name: record.name as string | undefined,
    company: record.company as string | undefined,
    cohort: (record.cohort as string) || 'Global',
    status: (record.status as BootcampStudent['status']) || 'Onboarding',
    accessLevel: (record.access_level as BootcampStudent['accessLevel']) || 'Full Access',
    purchaseDate: record.purchase_date ? new Date(record.purchase_date as string) : undefined,
    onboardingCompletedAt: record.onboarding_completed_at
      ? new Date(record.onboarding_completed_at as string)
      : undefined,
    slackInvited: (record.slack_invited as boolean) || false,
    slackInvitedAt: record.slack_invited_at
      ? new Date(record.slack_invited_at as string)
      : undefined,
    calendarAdded: (record.calendar_added as boolean) || false,
    calendarAddedAt: record.calendar_added_at
      ? new Date(record.calendar_added_at as string)
      : undefined,
    paymentSource: record.payment_source as string | undefined,
    paymentId: record.payment_id as string | undefined,
    subscriptionStatus:
      (record.subscription_status as BootcampStudent['subscriptionStatus']) || 'none',
    subscriptionId: record.subscription_id as string | undefined,
    subscriptionStartedAt: record.subscription_started_at
      ? new Date(record.subscription_started_at as string)
      : undefined,
    subscriptionEndsAt: record.subscription_ends_at
      ? new Date(record.subscription_ends_at as string)
      : undefined,
    stripeCustomerId: record.stripe_customer_id as string | undefined,
    notes: record.notes as string | undefined,
    prospectId: record.prospect_id as string | undefined,
    accessExpiresAt: record.access_expires_at
      ? new Date(record.access_expires_at as string)
      : undefined,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

// ============================================
// Onboarding Checklist
// ============================================

export async function fetchBootcampOnboardingChecklist(): Promise<BootcampChecklistItem[]> {
  try {
    const { data, error } = await supabase
      .from('bootcamp_onboarding_checklist')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch bootcamp checklist:', error);
      return [];
    }

    return (data || []).map(mapBootcampChecklistItem);
  } catch (error) {
    console.error('Failed to fetch bootcamp checklist:', error);
    return [];
  }
}

export async function fetchAllBootcampChecklistItems(): Promise<BootcampChecklistItem[]> {
  const { data, error } = await supabase
    .from('bootcamp_onboarding_checklist')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapBootcampChecklistItem);
}

export async function createBootcampChecklistItem(
  item: Partial<BootcampChecklistItem>
): Promise<BootcampChecklistItem> {
  const insertData = {
    item: item.item,
    category: item.category,
    description: item.description,
    video_url: item.videoUrl,
    doc_link: item.docLink,
    ai_tool_id: item.aiToolId,
    sort_order: item.sortOrder || 0,
    is_required: item.isRequired !== false,
    is_visible: item.isVisible !== false,
  };

  const { data, error } = await supabase
    .from('bootcamp_onboarding_checklist')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampChecklistItem(data);
}

export async function updateBootcampChecklistItem(
  itemId: string,
  updates: Partial<BootcampChecklistItem>
): Promise<BootcampChecklistItem> {
  const updateData: Record<string, unknown> = {};

  if (updates.item !== undefined) updateData.item = updates.item;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl;
  if (updates.docLink !== undefined) updateData.doc_link = updates.docLink;
  if (updates.aiToolId !== undefined) updateData.ai_tool_id = updates.aiToolId;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.isRequired !== undefined) updateData.is_required = updates.isRequired;
  if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible;

  const { data, error } = await supabase
    .from('bootcamp_onboarding_checklist')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampChecklistItem(data);
}

export async function deleteBootcampChecklistItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('bootcamp_onboarding_checklist').delete().eq('id', itemId);

  if (error) throw new Error(error.message);
}

function mapBootcampChecklistItem(record: Record<string, unknown>): BootcampChecklistItem {
  return {
    id: record.id as string,
    item: record.item as string,
    category: record.category as BootcampOnboardingCategory,
    description: record.description as string | undefined,
    videoUrl: record.video_url as string | undefined,
    docLink: record.doc_link as string | undefined,
    aiToolId: record.ai_tool_id as string | undefined,
    sortOrder: (record.sort_order as number) || 0,
    isRequired: (record.is_required as boolean) !== false,
    isVisible: (record.is_visible as boolean) !== false,
    createdAt: new Date(record.created_at as string),
  };
}

// ============================================
// Student Progress
// ============================================

export async function fetchBootcampStudentProgress(
  studentId: string
): Promise<BootcampStudentProgress[]> {
  try {
    const { data, error } = await supabase
      .from('bootcamp_student_progress')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      console.error('Failed to fetch student progress:', error);
      return [];
    }

    return (data || []).map(mapBootcampStudentProgress);
  } catch (error) {
    console.error('Failed to fetch student progress:', error);
    return [];
  }
}

export async function fetchBootcampOnboardingWithProgress(
  studentId: string
): Promise<{ categories: BootcampOnboardingCategoryGroup[]; totalProgress: number }> {
  const [checklist, progress] = await Promise.all([
    fetchBootcampOnboardingChecklist(),
    fetchBootcampStudentProgress(studentId),
  ]);

  // Create lookup map for progress by checklist item ID
  const progressMap = new Map<string, BootcampStudentProgress>();
  progress.forEach((p) => {
    progressMap.set(p.checklistItemId, p);
  });

  // Merge checklist with progress
  const itemsWithProgress: BootcampOnboardingProgressItem[] = checklist.map((item) => {
    const prog = progressMap.get(item.id);
    return {
      ...item,
      progressId: prog?.id,
      progressStatus: prog?.status || 'Not Started',
      completedAt: prog?.completedAt,
      progressNotes: prog?.notes,
    };
  });

  // Group by category
  const categoryMap = new Map<BootcampOnboardingCategory, BootcampOnboardingProgressItem[]>();

  itemsWithProgress.forEach((item) => {
    const existing = categoryMap.get(item.category) || [];
    existing.push(item);
    categoryMap.set(item.category, existing);
  });

  const categories: BootcampOnboardingCategoryGroup[] = BOOTCAMP_ONBOARDING_CATEGORIES.filter(
    (cat) => categoryMap.has(cat)
  ).map((name) => {
    const items = categoryMap.get(name) || [];
    const sortedItems = items.sort((a, b) => a.sortOrder - b.sortOrder);
    const completedCount = items.filter((i) => i.progressStatus === 'Complete').length;
    return {
      name,
      items: sortedItems,
      completedCount,
      totalCount: items.length,
    };
  });

  // Calculate overall progress
  const requiredItems = itemsWithProgress.filter((i) => i.isRequired);
  const completedRequired = requiredItems.filter((i) => i.progressStatus === 'Complete').length;
  const totalProgress =
    requiredItems.length > 0 ? Math.round((completedRequired / requiredItems.length) * 100) : 0;

  return { categories, totalProgress };
}

export async function updateBootcampStudentProgress(
  progressId: string | undefined,
  studentId: string,
  checklistItemId: string,
  status: BootcampProgressStatus,
  notes?: string
): Promise<BootcampStudentProgress> {
  const updateData: Record<string, unknown> = {
    status,
  };

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  if (status === 'Complete') {
    updateData.completed_at = new Date().toISOString();
  } else {
    updateData.completed_at = null;
  }

  if (progressId) {
    // Update existing record
    const { data, error } = await supabase
      .from('bootcamp_student_progress')
      .update(updateData)
      .eq('id', progressId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapBootcampStudentProgress(data);
  } else {
    // Create new record using upsert
    const { data, error } = await supabase
      .from('bootcamp_student_progress')
      .upsert(
        {
          student_id: studentId,
          checklist_item_id: checklistItemId,
          ...updateData,
        },
        {
          onConflict: 'student_id,checklist_item_id',
        }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapBootcampStudentProgress(data);
  }
}

function mapBootcampStudentProgress(record: Record<string, unknown>): BootcampStudentProgress {
  return {
    id: record.id as string,
    studentId: record.student_id as string,
    checklistItemId: record.checklist_item_id as string,
    status: (record.status as BootcampProgressStatus) || 'Not Started',
    completedAt: record.completed_at ? new Date(record.completed_at as string) : undefined,
    notes: record.notes as string | undefined,
  };
}

// ============================================
// Student Survey
// ============================================

export async function fetchBootcampStudentSurvey(
  studentId: string
): Promise<BootcampStudentSurvey | null> {
  try {
    const { data, error } = await supabase
      .from('bootcamp_student_survey')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch student survey:', error);
      return null;
    }

    if (!data) return null;
    return mapBootcampStudentSurvey(data);
  } catch (error) {
    console.error('Failed to fetch student survey:', error);
    return null;
  }
}

export async function saveBootcampStudentSurvey(
  studentId: string,
  surveyData: BootcampSurveyFormData,
  markComplete: boolean = false
): Promise<BootcampStudentSurvey> {
  const data: Record<string, unknown> = {
    student_id: studentId,
  };

  // Map form data to database columns
  if (surveyData.companyName !== undefined) data.company_name = surveyData.companyName;
  if (surveyData.website !== undefined) data.website = surveyData.website;
  if (surveyData.industry !== undefined) data.industry = surveyData.industry;
  if (surveyData.companySize !== undefined) data.company_size = surveyData.companySize;
  if (surveyData.roleTitle !== undefined) data.role_title = surveyData.roleTitle;
  if (surveyData.primaryGoal !== undefined) data.primary_goal = surveyData.primaryGoal;
  if (surveyData.biggestChallenges !== undefined)
    data.biggest_challenges = surveyData.biggestChallenges;
  if (surveyData.linkedinExperience !== undefined)
    data.linkedin_experience = surveyData.linkedinExperience;
  if (surveyData.targetAudience !== undefined) data.target_audience = surveyData.targetAudience;
  if (surveyData.currentLeadGenMethods !== undefined)
    data.current_lead_gen_methods = surveyData.currentLeadGenMethods;
  if (surveyData.monthlyOutreachVolume !== undefined)
    data.monthly_outreach_volume = surveyData.monthlyOutreachVolume;
  if (surveyData.toolsCurrentlyUsing !== undefined)
    data.tools_currently_using = surveyData.toolsCurrentlyUsing;

  if (markComplete) {
    data.completed_at = new Date().toISOString();
  }

  const { data: result, error } = await supabase
    .from('bootcamp_student_survey')
    .upsert(data, {
      onConflict: 'student_id',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampStudentSurvey(result);
}

function mapBootcampStudentSurvey(record: Record<string, unknown>): BootcampStudentSurvey {
  return {
    id: record.id as string,
    studentId: record.student_id as string,
    companyName: record.company_name as string | undefined,
    website: record.website as string | undefined,
    industry: record.industry as string | undefined,
    companySize: record.company_size as BootcampStudentSurvey['companySize'],
    roleTitle: record.role_title as string | undefined,
    primaryGoal: record.primary_goal as string | undefined,
    biggestChallenges: record.biggest_challenges as string[] | undefined,
    linkedinExperience: record.linkedin_experience as BootcampStudentSurvey['linkedinExperience'],
    targetAudience: record.target_audience as string | undefined,
    currentLeadGenMethods: record.current_lead_gen_methods as string[] | undefined,
    monthlyOutreachVolume:
      record.monthly_outreach_volume as BootcampStudentSurvey['monthlyOutreachVolume'],
    toolsCurrentlyUsing: record.tools_currently_using as string[] | undefined,
    completedAt: record.completed_at ? new Date(record.completed_at as string) : undefined,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

// ============================================
// Settings
// ============================================

// Map camelCase TypeScript keys to snake_case database keys
const SETTINGS_KEY_MAP: Record<keyof BootcampSettings, string> = {
  aiToolsVisible: 'ai_tools_visible',
  introVideoUrl: 'intro_video_url',
  slackChannelIds: 'slack_channel_ids',
  calendarEventIds: 'calendar_event_ids',
  welcomeMessage: 'welcome_message',
  aiToolsTitle: 'ai_tools_title',
  aiToolsSubtitle: 'ai_tools_subtitle',
  aiToolsInfoTitle: 'ai_tools_info_title',
  aiToolsInfoText: 'ai_tools_info_text',
};

// Reverse map: snake_case to camelCase
const SETTINGS_KEY_REVERSE_MAP: Record<string, keyof BootcampSettings> = Object.fromEntries(
  Object.entries(SETTINGS_KEY_MAP).map(([k, v]) => [v, k as keyof BootcampSettings])
) as Record<string, keyof BootcampSettings>;

export async function fetchBootcampSetting<K extends keyof BootcampSettings>(
  key: K
): Promise<BootcampSettings[K] | null> {
  try {
    const dbKey = SETTINGS_KEY_MAP[key];
    const { data, error } = await supabase
      .from('bootcamp_settings')
      .select('value')
      .eq('key', dbKey)
      .single();

    if (error || !data) {
      console.error(`Failed to fetch setting ${key}:`, error);
      return null;
    }

    return data.value as BootcampSettings[K];
  } catch (error) {
    console.error(`Failed to fetch setting ${key}:`, error);
    return null;
  }
}

export async function fetchAllBootcampSettings(): Promise<Partial<BootcampSettings>> {
  try {
    const { data, error } = await supabase.from('bootcamp_settings').select('key, value');

    if (error) {
      console.error('Failed to fetch settings:', error);
      return {};
    }

    const settings: Partial<BootcampSettings> = {};
    data?.forEach((row) => {
      const dbKey = row.key as string;
      const tsKey = SETTINGS_KEY_REVERSE_MAP[dbKey];
      if (tsKey) {
        (settings as Record<string, unknown>)[tsKey] = row.value;
      }
    });

    return settings;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return {};
  }
}

export async function updateBootcampSetting<K extends keyof BootcampSettings>(
  key: K,
  value: BootcampSettings[K]
): Promise<void> {
  const dbKey = SETTINGS_KEY_MAP[key];
  // Use upsert to create the row if it doesn't exist
  const { error } = await supabase
    .from('bootcamp_settings')
    .upsert({ key: dbKey, value }, { onConflict: 'key' });

  if (error) throw new Error(error.message);
}

// ============================================
// Admin: Progress Calculations
// ============================================

export async function calculateStudentOnboardingProgress(studentId: string): Promise<number> {
  const { totalProgress } = await fetchBootcampOnboardingWithProgress(studentId);
  return totalProgress;
}

export async function fetchStudentsWithProgress(): Promise<
  Array<BootcampStudent & { onboardingProgress: number; survey: BootcampStudentSurvey | null }>
> {
  const students = await fetchAllBootcampStudents();

  const studentsWithProgress = await Promise.all(
    students.map(async (student) => {
      const [progress, survey] = await Promise.all([
        calculateStudentOnboardingProgress(student.id),
        fetchBootcampStudentSurvey(student.id),
      ]);

      return {
        ...student,
        onboardingProgress: progress,
        survey,
      };
    })
  );

  return studentsWithProgress;
}

// ============================================
// Admin: Automation Helpers
// ============================================

export async function markStudentSlackInvited(studentId: string): Promise<BootcampStudent> {
  return updateBootcampStudent(studentId, {
    slackInvited: true,
    slackInvitedAt: new Date(),
  });
}

export async function markStudentCalendarAdded(studentId: string): Promise<BootcampStudent> {
  return updateBootcampStudent(studentId, {
    calendarAdded: true,
    calendarAddedAt: new Date(),
  });
}

// ============================================
// Admin: Check Progress Exists
// ============================================

export async function checkBootcampProgressExists(checklistItemId: string): Promise<number> {
  const { count, error } = await supabase
    .from('bootcamp_student_progress')
    .select('*', { count: 'exact', head: true })
    .eq('checklist_item_id', checklistItemId);

  if (error) throw new Error(error.message);
  return count || 0;
}

// ============================================
// Cohorts
// ============================================

export async function fetchAllCohorts(): Promise<BootcampCohort[]> {
  const { data, error } = await supabase
    .from('bootcamp_cohorts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapBootcampCohort);
}

export async function fetchActiveCohorts(): Promise<BootcampCohort[]> {
  const { data, error } = await supabase
    .from('bootcamp_cohorts')
    .select('*')
    .eq('status', 'Active')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapBootcampCohort);
}

export async function fetchCohortById(cohortId: string): Promise<BootcampCohort | null> {
  const { data, error } = await supabase
    .from('bootcamp_cohorts')
    .select('*')
    .eq('id', cohortId)
    .single();

  if (error || !data) return null;
  return mapBootcampCohort(data);
}

export async function createCohort(cohort: Partial<BootcampCohort>): Promise<BootcampCohort> {
  const insertData = {
    name: cohort.name,
    description: cohort.description,
    status: cohort.status || 'Active',
  };

  const { data, error } = await supabase
    .from('bootcamp_cohorts')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampCohort(data);
}

export async function updateCohort(
  cohortId: string,
  updates: Partial<BootcampCohort>
): Promise<BootcampCohort> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { data, error } = await supabase
    .from('bootcamp_cohorts')
    .update(updateData)
    .eq('id', cohortId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampCohort(data);
}

export async function deleteCohort(cohortId: string): Promise<void> {
  const { error } = await supabase.from('bootcamp_cohorts').delete().eq('id', cohortId);

  if (error) throw new Error(error.message);
}

export async function fetchCohortStudentCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('bootcamp_students').select('cohort');

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  (data || []).forEach((row) => {
    const cohort = (row.cohort as string) || 'Global';
    counts[cohort] = (counts[cohort] || 0) + 1;
  });

  return counts;
}

function mapBootcampCohort(record: Record<string, unknown>): BootcampCohort {
  return {
    id: record.id as string,
    name: record.name as string,
    description: record.description as string | undefined,
    status: (record.status as BootcampCohort['status']) || 'Active',
    createdAt: new Date(record.created_at as string),
  };
}

// ============================================
// Invite Codes
// ============================================

export function generateInviteCode(): string {
  // 8-char alphanumeric, uppercase, no confusing chars (0/O/1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function fetchAllInviteCodes(): Promise<BootcampInviteCode[]> {
  const { data, error } = await supabase
    .from('bootcamp_invite_codes')
    .select(
      `
      *,
      bootcamp_cohorts (name)
    `
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapBootcampInviteCode);
}

export async function fetchInviteCodesByCohort(cohortId: string): Promise<BootcampInviteCode[]> {
  const { data, error } = await supabase
    .from('bootcamp_invite_codes')
    .select(
      `
      *,
      bootcamp_cohorts (name)
    `
    )
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapBootcampInviteCode);
}

export async function createInviteCode(
  cohortId: string,
  options?: {
    maxUses?: number;
    expiresAt?: Date;
    customCode?: string;
    accessLevel?: string;
    toolGrants?: ToolGrant[];
    contentGrants?: string[];
  }
): Promise<BootcampInviteCode> {
  const code = options?.customCode?.toUpperCase() || generateInviteCode();

  const insertData: Record<string, unknown> = {
    code,
    cohort_id: cohortId,
    status: 'Active',
  };

  if (options?.maxUses !== undefined) insertData.max_uses = options.maxUses;
  if (options?.expiresAt !== undefined) insertData.expires_at = options.expiresAt.toISOString();
  if (options?.accessLevel) insertData.access_level = options.accessLevel;
  if (options?.toolGrants && options.toolGrants.length > 0)
    insertData.tool_grants = options.toolGrants;
  if (options?.contentGrants && options.contentGrants.length > 0)
    insertData.content_grants = options.contentGrants;

  const { data, error } = await supabase
    .from('bootcamp_invite_codes')
    .insert(insertData)
    .select(
      `
      *,
      bootcamp_cohorts (name)
    `
    )
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampInviteCode(data);
}

export async function updateInviteCode(
  codeId: string,
  updates: Partial<BootcampInviteCode>
): Promise<BootcampInviteCode> {
  const updateData: Record<string, unknown> = {};

  if (updates.maxUses !== undefined) updateData.max_uses = updates.maxUses;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt?.toISOString();

  const { data, error } = await supabase
    .from('bootcamp_invite_codes')
    .update(updateData)
    .eq('id', codeId)
    .select(
      `
      *,
      bootcamp_cohorts (name)
    `
    )
    .single();

  if (error) throw new Error(error.message);
  return mapBootcampInviteCode(data);
}

export async function deleteInviteCode(codeId: string): Promise<void> {
  const { error } = await supabase.from('bootcamp_invite_codes').delete().eq('id', codeId);

  if (error) throw new Error(error.message);
}

export async function validateInviteCode(code: string): Promise<BootcampInviteCode | null> {
  try {
    const { data, error } = await supabase
      .from('bootcamp_invite_codes')
      .select(
        `
        *,
        bootcamp_cohorts (name)
      `
      )
      .eq('code', code.toUpperCase())
      .eq('status', 'Active')
      .maybeSingle();

    if (error) {
      console.error('Invite code validation error:', error);
      return null;
    }

    if (!data) return null;

    const inviteCode = mapBootcampInviteCode(data);

    // Check if expired
    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      return null;
    }

    // Check if max uses reached
    if (inviteCode.maxUses != null && inviteCode.useCount >= inviteCode.maxUses) {
      return null;
    }

    return inviteCode;
  } catch (err) {
    console.error('Invite code validation failed:', err);
    return null;
  }
}

export async function incrementInviteCodeUsage(codeId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_invite_code_usage', { code_id: codeId });

  // If RPC doesn't exist, fall back to manual increment
  if (error) {
    const { data: current } = await supabase
      .from('bootcamp_invite_codes')
      .select('use_count')
      .eq('id', codeId)
      .single();

    if (current) {
      await supabase
        .from('bootcamp_invite_codes')
        .update({ use_count: ((current.use_count as number) || 0) + 1 })
        .eq('id', codeId);
    }
  }
}

function mapBootcampInviteCode(record: Record<string, unknown>): BootcampInviteCode {
  const cohortData = record.bootcamp_cohorts as Record<string, unknown> | null;

  return {
    id: record.id as string,
    code: record.code as string,
    cohortId: record.cohort_id as string,
    cohortName: cohortData?.name as string | undefined,
    maxUses: record.max_uses as number | null | undefined,
    useCount: (record.use_count as number) || 0,
    status: (record.status as BootcampInviteCode['status']) || 'Active',
    expiresAt: record.expires_at ? new Date(record.expires_at as string) : undefined,
    grantedAccessLevel:
      (record.access_level as BootcampInviteCode['grantedAccessLevel']) || 'Full Access',
    toolGrants: record.tool_grants as ToolGrant[] | null | undefined,
    contentGrants: record.content_grants as string[] | null | undefined,
    createdAt: new Date(record.created_at as string),
  };
}

// ============================================
// Prospect Linking
// ============================================

/**
 * Find a prospect by their email address
 * Used to link bootcamp students to their prospect record for Blueprint access
 * @param email - The email address to search for
 * @returns The prospect ID if found, null otherwise
 */
export async function findProspectByEmail(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('prospects')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error finding prospect by email:', error);
      return null;
    }

    if (!data) {
      console.log('No prospect found for email:', email);
      return null;
    }

    console.log('Found prospect for email:', email, '-> prospect_id:', data.id);
    return data.id as string;
  } catch (error) {
    console.error('Failed to find prospect by email:', error);
    return null;
  }
}

/**
 * Link a bootcamp student to their prospect record
 * @param studentId - The bootcamp student ID
 * @param prospectId - The prospect ID to link
 * @returns The updated student record
 */
export async function linkStudentToProspect(
  studentId: string,
  prospectId: string
): Promise<BootcampStudent> {
  const { data, error } = await supabase
    .from('bootcamp_students')
    .update({ prospect_id: prospectId })
    .eq('id', studentId)
    .select()
    .single();

  if (error) {
    console.error('Failed to link student to prospect:', error);
    throw new Error(error.message);
  }

  console.log('Successfully linked student', studentId, 'to prospect', prospectId);
  return mapBootcampStudent(data);
}

// ============================================
// Self-Registration
// ============================================

export async function registerBootcampStudent(
  email: string,
  inviteCode: string
): Promise<BootcampStudent> {
  // 1. Validate invite code
  const validCode = await validateInviteCode(inviteCode);
  if (!validCode) {
    throw new Error('Invalid or expired invite code');
  }

  // 2. Check if email already registered
  const existing = await verifyBootcampStudent(email);
  if (existing) {
    throw new Error('Email already registered');
  }

  // 3. Get cohort from invite code
  const cohort = await fetchCohortById(validCode.cohortId);
  if (!cohort) {
    throw new Error('Cohort not found');
  }

  // 4. Create student with access level from invite code
  const accessLevel = validCode.grantedAccessLevel || 'Full Access';
  const student = await createBootcampStudent({
    email,
    cohort: cohort.name,
    status: 'Onboarding',
    accessLevel,
  });

  // 5. Grant tool credits if code specifies them
  if (validCode.toolGrants && validCode.toolGrants.length > 0) {
    await grantToolCredits(student.id, validCode.toolGrants, validCode.code);
  }

  // 6. Grant content access if code specifies it
  if (validCode.contentGrants && validCode.contentGrants.length > 0) {
    await grantContentAccess(student.id, validCode.contentGrants, validCode.code);
  }

  // 7. Record redeemed code
  await recordRedeemedCode(student.id, validCode.code);

  // 8. Try to link student to prospect (graceful - don't fail registration if this fails)
  try {
    const prospectId = await findProspectByEmail(email);
    if (prospectId) {
      await linkStudentToProspect(student.id, prospectId);
      console.log('Bootcamp student linked to prospect:', {
        studentId: student.id,
        prospectId,
        email,
      });
    } else {
      console.log('No prospect found to link for bootcamp student:', {
        studentId: student.id,
        email,
      });
    }
  } catch (error) {
    // Log but don't fail registration if prospect linking fails
    console.error('Failed to link bootcamp student to prospect (non-fatal):', error);
  }

  // 9. Increment invite code usage
  await incrementInviteCodeUsage(validCode.id);

  return student;
}

// ============================================
// Lead Magnet Grant Helpers
// ============================================

async function grantToolCredits(
  studentId: string,
  toolGrants: ToolGrant[],
  code: string
): Promise<void> {
  for (const grant of toolGrants) {
    // Look up tool by slug
    const { data: tool } = await supabase
      .from('ai_tools')
      .select('id')
      .eq('slug', grant.toolSlug)
      .maybeSingle();

    if (!tool) {
      console.warn(`Tool not found for slug: ${grant.toolSlug}`);
      continue;
    }

    const { error } = await supabase.from('student_tool_credits').upsert(
      {
        student_id: studentId,
        tool_id: tool.id,
        credits_total: grant.credits,
        credits_used: 0,
        granted_by_code: code,
      },
      { onConflict: 'student_id,tool_id,granted_by_code' }
    );

    if (error) {
      console.error(`Failed to grant tool credits for ${grant.toolSlug}:`, error);
    }
  }
}

async function grantContentAccess(
  studentId: string,
  weekIds: string[],
  code: string
): Promise<void> {
  for (const weekId of weekIds) {
    const { error } = await supabase.from('student_content_grants').upsert(
      {
        student_id: studentId,
        week_id: weekId,
        granted_by_code: code,
      },
      { onConflict: 'student_id,week_id' }
    );

    if (error) {
      console.error(`Failed to grant content access for ${weekId}:`, error);
    }
  }
}

async function recordRedeemedCode(studentId: string, code: string): Promise<void> {
  const { error } = await supabase.from('student_redeemed_codes').upsert(
    {
      student_id: studentId,
      code: code.toUpperCase(),
    },
    { onConflict: 'student_id,code' }
  );

  if (error) {
    console.error('Failed to record redeemed code:', error);
  }
}

// ============================================
// Code Redemption (for logged-in users)
// ============================================

export interface RedeemResult {
  toolsUnlocked: string[];
  weeksUnlocked: string[];
  accessUpgraded: boolean;
}

export async function redeemCode(studentId: string, code: string): Promise<RedeemResult> {
  // 1. Validate code
  const validCode = await validateInviteCode(code);
  if (!validCode) {
    throw new Error('Invalid or expired invite code');
  }

  // 2. Check if already redeemed
  const { data: existing } = await supabase
    .from('student_redeemed_codes')
    .select('id')
    .eq('student_id', studentId)
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (existing) {
    throw new Error('Code already redeemed');
  }

  const result: RedeemResult = {
    toolsUnlocked: [],
    weeksUnlocked: [],
    accessUpgraded: false,
  };

  // 3. Grant tool credits
  if (validCode.toolGrants && validCode.toolGrants.length > 0) {
    await grantToolCredits(studentId, validCode.toolGrants, validCode.code);
    result.toolsUnlocked = validCode.toolGrants.map((g) => g.toolSlug);
  }

  // 4. Grant content access
  if (validCode.contentGrants && validCode.contentGrants.length > 0) {
    await grantContentAccess(studentId, validCode.contentGrants, validCode.code);
    result.weeksUnlocked = validCode.contentGrants;
  }

  // 5. Upgrade access level if Full Access code
  if (validCode.grantedAccessLevel === 'Full Access') {
    await updateBootcampStudent(studentId, { accessLevel: 'Full Access' });
    result.accessUpgraded = true;
  }

  // 6. Record redemption
  await recordRedeemedCode(studentId, validCode.code);

  // 7. Increment code usage
  await incrementInviteCodeUsage(validCode.id);

  return result;
}

// ============================================
// Student Grants Query
// ============================================

export interface StudentGrants {
  tools: Array<{
    toolId: string;
    toolSlug: string;
    toolName: string;
    creditsRemaining: number;
    creditsTotal: number;
  }>;
  weekIds: string[];
}

export async function getStudentGrants(studentId: string): Promise<StudentGrants> {
  // Fetch tool credits with tool info
  const { data: credits } = await supabase
    .from('student_tool_credits')
    .select(
      `
      tool_id,
      credits_total,
      credits_used,
      ai_tools (slug, name)
    `
    )
    .eq('student_id', studentId);

  // Aggregate credits per tool
  const toolMap = new Map<
    string,
    {
      toolId: string;
      toolSlug: string;
      toolName: string;
      creditsTotal: number;
      creditsUsed: number;
    }
  >();

  (credits || []).forEach((row) => {
    const toolData = row.ai_tools as unknown as Record<string, unknown> | null;
    const toolId = row.tool_id as string;
    const existing = toolMap.get(toolId);

    if (existing) {
      existing.creditsTotal += (row.credits_total as number) || 0;
      existing.creditsUsed += (row.credits_used as number) || 0;
    } else {
      toolMap.set(toolId, {
        toolId,
        toolSlug: (toolData?.slug as string) || '',
        toolName: (toolData?.name as string) || '',
        creditsTotal: (row.credits_total as number) || 0,
        creditsUsed: (row.credits_used as number) || 0,
      });
    }
  });

  const tools = Array.from(toolMap.values()).map((t) => ({
    toolId: t.toolId,
    toolSlug: t.toolSlug,
    toolName: t.toolName,
    creditsRemaining: t.creditsTotal - t.creditsUsed,
    creditsTotal: t.creditsTotal,
  }));

  // Fetch content grants
  const { data: contentGrants } = await supabase
    .from('student_content_grants')
    .select('week_id')
    .eq('student_id', studentId);

  const weekIds = (contentGrants || []).map((row) => row.week_id as string);

  return { tools, weekIds };
}

// ============================================
// Funnel Tool Presets
// ============================================

export async function fetchFunnelToolPresets(): Promise<FunnelToolPresets> {
  try {
    const { data, error } = await supabase
      .from('bootcamp_settings')
      .select('value')
      .eq('key', 'funnel_tool_presets')
      .single();

    if (error || !data) {
      console.error('Failed to fetch funnel tool presets:', error);
      return {};
    }

    return data.value as FunnelToolPresets;
  } catch (error) {
    console.error('Failed to fetch funnel tool presets:', error);
    return {};
  }
}

export async function saveFunnelToolPresets(presets: FunnelToolPresets): Promise<void> {
  const { error } = await supabase.from('bootcamp_settings').upsert({
    key: 'funnel_tool_presets',
    value: presets,
    description: 'Tool preset configurations for Funnel Access users',
  });

  if (error) throw new Error(`Failed to save funnel tool presets: ${error.message}`);
}

// ============================================
// Call Grant Config
// ============================================

const DEFAULT_CALL_GRANT_CONFIG: CallGrantConfig = {
  enabled: false,
  creditsPerTool: 10,
  toolSlugs: [],
  accessLevel: 'Lead Magnet',
};

export async function fetchCallGrantConfig(): Promise<CallGrantConfig> {
  try {
    const { data, error } = await supabase
      .from('bootcamp_settings')
      .select('value')
      .eq('key', 'call_grant_config')
      .single();

    if (error || !data) {
      return DEFAULT_CALL_GRANT_CONFIG;
    }

    return { ...DEFAULT_CALL_GRANT_CONFIG, ...(data.value as Partial<CallGrantConfig>) };
  } catch {
    return DEFAULT_CALL_GRANT_CONFIG;
  }
}

export async function saveCallGrantConfig(config: CallGrantConfig): Promise<void> {
  const { error } = await supabase.from('bootcamp_settings').upsert({
    key: 'call_grant_config',
    value: config,
    description: 'Auto-grant AI tool credits when prospects attend calls',
  });

  if (error) throw new Error(`Failed to save call grant config: ${error.message}`);
}
