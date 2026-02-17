/**
 * LMS Supabase Service
 * Handles all database operations for the Learning Management System
 * Supports cohort-independent curriculum with full CRUD operations
 */

import { supabase } from '../lib/supabaseClient';
import {
  LmsCohort,
  LmsWeek,
  LmsLesson,
  LmsContentItem,
  LmsActionItem,
  LmsLessonProgress,
  LmsActionItemProgress,
  LmsWeekWithLessons,
  LmsLessonWithContent,
  LmsCurriculumData,
  LmsCohortFormData,
  LmsWeekFormData,
  LmsLessonFormData,
  LmsContentItemFormData,
  LmsActionItemFormData,
  LmsCredentialsData,
  LmsContentType,
  CohortOnboardingConfig,
} from '../types/lms-types';
import { StudentEnrollment } from '../types/bootcamp-types';

// Explicit column lists (avoid select('*'))
const LMS_COHORT_COLUMNS =
  'id, name, description, status, start_date, end_date, sidebar_label, icon, sort_order, product_type, thrivecart_product_id, onboarding_config, created_at, updated_at';

const LMS_WEEK_COLUMNS =
  'id, cohort_id, title, description, sort_order, is_visible, created_at, updated_at';

const LMS_LESSON_COLUMNS =
  'id, week_id, title, description, sort_order, is_visible, created_at, updated_at';

const LMS_CONTENT_ITEM_COLUMNS =
  'id, lesson_id, title, content_type, embed_url, ai_tool_slug, content_text, credentials_data, description, sort_order, is_visible, created_at, updated_at';

const LMS_ACTION_ITEM_COLUMNS =
  'id, week_id, text, description, video_url, sort_order, assigned_to_email, is_visible, created_at, updated_at';

const LMS_LESSON_PROGRESS_COLUMNS = 'id, student_id, lesson_id, completed_at, notes, created_at';

const LMS_ACTION_ITEM_PROGRESS_COLUMNS =
  'id, student_id, action_item_id, completed_at, proof_of_work, notes, created_at';

// ============================================
// Cohorts
// ============================================

export async function fetchAllLmsCohorts(): Promise<LmsCohort[]> {
  const { data, error } = await supabase
    .from('lms_cohorts')
    .select(LMS_COHORT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsCohort);
}

export async function fetchActiveLmsCohorts(): Promise<LmsCohort[]> {
  const { data, error } = await supabase
    .from('lms_cohorts')
    .select(LMS_COHORT_COLUMNS)
    .eq('status', 'Active')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsCohort);
}

export async function fetchLmsCohortById(cohortId: string): Promise<LmsCohort | null> {
  const { data, error } = await supabase
    .from('lms_cohorts')
    .select(LMS_COHORT_COLUMNS)
    .eq('id', cohortId)
    .single();

  if (error || !data) return null;
  return mapLmsCohort(data);
}

export async function fetchLmsCohortByName(name: string): Promise<LmsCohort | null> {
  const { data, error } = await supabase
    .from('lms_cohorts')
    .select(LMS_COHORT_COLUMNS)
    .ilike('name', name)
    .single();

  if (error || !data) return null;
  return mapLmsCohort(data);
}

export async function createLmsCohort(cohort: LmsCohortFormData): Promise<LmsCohort> {
  const insertData: Record<string, unknown> = {
    name: cohort.name,
    description: cohort.description,
    status: cohort.status || 'Active',
    start_date: cohort.startDate,
    end_date: cohort.endDate,
  };

  if (cohort.sidebarLabel !== undefined) insertData.sidebar_label = cohort.sidebarLabel;
  if (cohort.icon !== undefined) insertData.icon = cohort.icon;
  if (cohort.sortOrder !== undefined) insertData.sort_order = cohort.sortOrder;
  if (cohort.productType !== undefined) insertData.product_type = cohort.productType;
  if (cohort.thrivecartProductId !== undefined)
    insertData.thrivecart_product_id = cohort.thrivecartProductId;
  if (cohort.onboardingConfig !== undefined) insertData.onboarding_config = cohort.onboardingConfig;

  const { data, error } = await supabase.from('lms_cohorts').insert(insertData).select().single();

  if (error) throw new Error(error.message);
  return mapLmsCohort(data);
}

export async function updateLmsCohort(
  cohortId: string,
  updates: Partial<LmsCohortFormData>
): Promise<LmsCohort> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
  if (updates.sidebarLabel !== undefined) updateData.sidebar_label = updates.sidebarLabel;
  if (updates.icon !== undefined) updateData.icon = updates.icon;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.productType !== undefined) updateData.product_type = updates.productType;
  if (updates.thrivecartProductId !== undefined)
    updateData.thrivecart_product_id = updates.thrivecartProductId;
  if (updates.onboardingConfig !== undefined)
    updateData.onboarding_config = updates.onboardingConfig;

  const { data, error } = await supabase
    .from('lms_cohorts')
    .update(updateData)
    .eq('id', cohortId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLmsCohort(data);
}

export async function deleteLmsCohort(cohortId: string): Promise<void> {
  const { error } = await supabase.from('lms_cohorts').delete().eq('id', cohortId);

  if (error) throw new Error(error.message);
}

export async function duplicateLmsCohort(
  sourceCohortId: string,
  newName: string,
  newDescription?: string,
  newStatus?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('duplicate_lms_cohort', {
    source_cohort_id: sourceCohortId,
    new_cohort_name: newName,
    new_cohort_description: newDescription,
    new_cohort_status: newStatus || 'Draft',
  });

  if (error) throw new Error(error.message);
  return data as string;
}

function mapLmsCohort(record: Record<string, unknown>): LmsCohort {
  return {
    id: record.id as string,
    name: record.name as string,
    description: record.description as string | undefined,
    status: (record.status as LmsCohort['status']) || 'Active',
    startDate: record.start_date ? new Date(record.start_date as string) : undefined,
    endDate: record.end_date ? new Date(record.end_date as string) : undefined,
    sidebarLabel: record.sidebar_label as string | undefined,
    icon: record.icon as string | undefined,
    sortOrder: (record.sort_order as number) || 0,
    productType: record.product_type as string | undefined,
    thrivecartProductId: record.thrivecart_product_id as string | undefined,
    onboardingConfig: record.onboarding_config as CohortOnboardingConfig | undefined,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

// ============================================
// Weeks
// ============================================

export async function fetchLmsWeeksByCohort(cohortId: string): Promise<LmsWeek[]> {
  const { data, error } = await supabase
    .from('lms_weeks')
    .select(LMS_WEEK_COLUMNS)
    .eq('cohort_id', cohortId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsWeek);
}

export async function fetchVisibleLmsWeeksByCohort(cohortId: string): Promise<LmsWeek[]> {
  const { data, error } = await supabase
    .from('lms_weeks')
    .select(LMS_WEEK_COLUMNS)
    .eq('cohort_id', cohortId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsWeek);
}

export async function fetchLmsWeekById(weekId: string): Promise<LmsWeek | null> {
  const { data, error } = await supabase
    .from('lms_weeks')
    .select(LMS_WEEK_COLUMNS)
    .eq('id', weekId)
    .single();

  if (error || !data) return null;
  return mapLmsWeek(data);
}

export async function createLmsWeek(week: LmsWeekFormData): Promise<LmsWeek> {
  const insertData = {
    cohort_id: week.cohortId,
    title: week.title,
    description: week.description,
    sort_order: week.sortOrder,
    is_visible: week.isVisible ?? true,
  };

  const { data, error } = await supabase.from('lms_weeks').insert(insertData).select().single();

  if (error) throw new Error(error.message);
  return mapLmsWeek(data);
}

export async function updateLmsWeek(
  weekId: string,
  updates: Partial<LmsWeekFormData>
): Promise<LmsWeek> {
  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible;

  const { data, error } = await supabase
    .from('lms_weeks')
    .update(updateData)
    .eq('id', weekId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLmsWeek(data);
}

export async function deleteLmsWeek(weekId: string): Promise<void> {
  const { error } = await supabase.from('lms_weeks').delete().eq('id', weekId);

  if (error) throw new Error(error.message);
}

export async function reorderLmsWeeks(weekIds: string[], cohortId: string): Promise<void> {
  // Update each week's sort order based on its position in the array
  const updates = weekIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('lms_weeks')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('cohort_id', cohortId);

    if (error) throw new Error(error.message);
  }
}

function mapLmsWeek(record: Record<string, unknown>): LmsWeek {
  return {
    id: record.id as string,
    cohortId: record.cohort_id as string,
    title: record.title as string,
    description: record.description as string | undefined,
    sortOrder: (record.sort_order as number) || 0,
    isVisible: record.is_visible !== false,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

// ============================================
// Lessons
// ============================================

export async function fetchLmsLessonsByWeek(weekId: string): Promise<LmsLesson[]> {
  const { data, error } = await supabase
    .from('lms_lessons')
    .select(LMS_LESSON_COLUMNS)
    .eq('week_id', weekId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsLesson);
}

export async function fetchVisibleLmsLessonsByWeek(weekId: string): Promise<LmsLesson[]> {
  const { data, error } = await supabase
    .from('lms_lessons')
    .select(LMS_LESSON_COLUMNS)
    .eq('week_id', weekId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsLesson);
}

export async function fetchLmsLessonById(lessonId: string): Promise<LmsLesson | null> {
  const { data, error } = await supabase
    .from('lms_lessons')
    .select(LMS_LESSON_COLUMNS)
    .eq('id', lessonId)
    .single();

  if (error || !data) return null;
  return mapLmsLesson(data);
}

export async function createLmsLesson(lesson: LmsLessonFormData): Promise<LmsLesson> {
  const insertData = {
    week_id: lesson.weekId,
    title: lesson.title,
    description: lesson.description,
    sort_order: lesson.sortOrder,
    is_visible: lesson.isVisible ?? true,
  };

  const { data, error } = await supabase.from('lms_lessons').insert(insertData).select().single();

  if (error) throw new Error(error.message);
  return mapLmsLesson(data);
}

export async function updateLmsLesson(
  lessonId: string,
  updates: Partial<LmsLessonFormData>
): Promise<LmsLesson> {
  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible;

  const { data, error } = await supabase
    .from('lms_lessons')
    .update(updateData)
    .eq('id', lessonId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLmsLesson(data);
}

export async function deleteLmsLesson(lessonId: string): Promise<void> {
  const { error } = await supabase.from('lms_lessons').delete().eq('id', lessonId);

  if (error) throw new Error(error.message);
}

export async function reorderLmsLessons(lessonIds: string[], weekId: string): Promise<void> {
  const updates = lessonIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('lms_lessons')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('week_id', weekId);

    if (error) throw new Error(error.message);
  }
}

function mapLmsLesson(record: Record<string, unknown>): LmsLesson {
  return {
    id: record.id as string,
    weekId: record.week_id as string,
    title: record.title as string,
    description: record.description as string | undefined,
    sortOrder: (record.sort_order as number) || 0,
    isVisible: record.is_visible !== false,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

// ============================================
// Content Items
// ============================================

export async function fetchLmsContentItemsByLesson(lessonId: string): Promise<LmsContentItem[]> {
  const { data, error } = await supabase
    .from('lms_content_items')
    .select(LMS_CONTENT_ITEM_COLUMNS)
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsContentItem);
}

export async function fetchVisibleLmsContentItemsByLesson(
  lessonId: string
): Promise<LmsContentItem[]> {
  const { data, error } = await supabase
    .from('lms_content_items')
    .select(LMS_CONTENT_ITEM_COLUMNS)
    .eq('lesson_id', lessonId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsContentItem);
}

export async function fetchLmsContentItemById(
  contentItemId: string
): Promise<LmsContentItem | null> {
  const { data, error } = await supabase
    .from('lms_content_items')
    .select(LMS_CONTENT_ITEM_COLUMNS)
    .eq('id', contentItemId)
    .single();

  if (error || !data) return null;
  return mapLmsContentItem(data);
}

export async function createLmsContentItem(item: LmsContentItemFormData): Promise<LmsContentItem> {
  const insertData = {
    lesson_id: item.lessonId,
    title: item.title,
    content_type: item.contentType,
    embed_url: item.embedUrl,
    ai_tool_slug: item.aiToolSlug,
    content_text: item.contentText,
    credentials_data: item.credentialsData,
    description: item.description,
    sort_order: item.sortOrder,
    is_visible: item.isVisible ?? true,
  };

  const { data, error } = await supabase
    .from('lms_content_items')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLmsContentItem(data);
}

export async function updateLmsContentItem(
  contentItemId: string,
  updates: Partial<LmsContentItemFormData>
): Promise<LmsContentItem> {
  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.contentType !== undefined) updateData.content_type = updates.contentType;
  if (updates.embedUrl !== undefined) updateData.embed_url = updates.embedUrl;
  if (updates.aiToolSlug !== undefined) updateData.ai_tool_slug = updates.aiToolSlug;
  if (updates.contentText !== undefined) updateData.content_text = updates.contentText;
  if (updates.credentialsData !== undefined) updateData.credentials_data = updates.credentialsData;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible;

  const { data, error } = await supabase
    .from('lms_content_items')
    .update(updateData)
    .eq('id', contentItemId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLmsContentItem(data);
}

export async function deleteLmsContentItem(contentItemId: string): Promise<void> {
  const { error } = await supabase.from('lms_content_items').delete().eq('id', contentItemId);

  if (error) throw new Error(error.message);
}

export async function reorderLmsContentItems(itemIds: string[], lessonId: string): Promise<void> {
  const updates = itemIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('lms_content_items')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('lesson_id', lessonId);

    if (error) throw new Error(error.message);
  }
}

function mapLmsContentItem(record: Record<string, unknown>): LmsContentItem {
  return {
    id: record.id as string,
    lessonId: record.lesson_id as string,
    title: record.title as string,
    contentType: record.content_type as LmsContentType,
    embedUrl: record.embed_url as string | undefined,
    aiToolSlug: record.ai_tool_slug as string | undefined,
    contentText: record.content_text as string | undefined,
    credentialsData: record.credentials_data as LmsCredentialsData | undefined,
    description: record.description as string | undefined,
    sortOrder: (record.sort_order as number) || 0,
    isVisible: record.is_visible !== false,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

// ============================================
// Action Items
// ============================================

export async function fetchLmsActionItemsByWeek(weekId: string): Promise<LmsActionItem[]> {
  const { data, error } = await supabase
    .from('lms_action_items')
    .select(LMS_ACTION_ITEM_COLUMNS)
    .eq('week_id', weekId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsActionItem);
}

export async function fetchVisibleLmsActionItemsByWeek(
  weekId: string,
  userEmail?: string
): Promise<LmsActionItem[]> {
  let query = supabase
    .from('lms_action_items')
    .select(LMS_ACTION_ITEM_COLUMNS)
    .eq('week_id', weekId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  // Filter by assigned_to_email - show items assigned to no one (null) or to this user
  const items = (data || []).map(mapLmsActionItem);
  if (userEmail) {
    return items.filter(
      (item) =>
        !item.assignedToEmail || item.assignedToEmail.toLowerCase() === userEmail.toLowerCase()
    );
  }
  // If no user email, only show unassigned items
  return items.filter((item) => !item.assignedToEmail);
}

export async function fetchLmsActionItemById(actionItemId: string): Promise<LmsActionItem | null> {
  const { data, error } = await supabase
    .from('lms_action_items')
    .select(LMS_ACTION_ITEM_COLUMNS)
    .eq('id', actionItemId)
    .single();

  if (error || !data) return null;
  return mapLmsActionItem(data);
}

export async function createLmsActionItem(item: LmsActionItemFormData): Promise<LmsActionItem> {
  const insertData = {
    week_id: item.weekId,
    text: item.text,
    description: item.description,
    video_url: item.videoUrl || null,
    sort_order: item.sortOrder,
    assigned_to_email: item.assignedToEmail || null,
    is_visible: item.isVisible ?? true,
  };

  const { data, error } = await supabase
    .from('lms_action_items')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLmsActionItem(data);
}

export async function updateLmsActionItem(
  actionItemId: string,
  updates: Partial<LmsActionItemFormData>
): Promise<LmsActionItem> {
  const updateData: Record<string, unknown> = {};

  if (updates.text !== undefined) updateData.text = updates.text;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl || null;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.assignedToEmail !== undefined)
    updateData.assigned_to_email = updates.assignedToEmail || null;
  if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible;

  const { data, error } = await supabase
    .from('lms_action_items')
    .update(updateData)
    .eq('id', actionItemId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLmsActionItem(data);
}

export async function deleteLmsActionItem(actionItemId: string): Promise<void> {
  const { error } = await supabase.from('lms_action_items').delete().eq('id', actionItemId);

  if (error) throw new Error(error.message);
}

export async function reorderLmsActionItems(itemIds: string[], weekId: string): Promise<void> {
  const updates = itemIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('lms_action_items')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('week_id', weekId);

    if (error) throw new Error(error.message);
  }
}

function mapLmsActionItem(record: Record<string, unknown>): LmsActionItem {
  return {
    id: record.id as string,
    weekId: record.week_id as string,
    text: record.text as string,
    description: record.description as string | undefined,
    videoUrl: record.video_url as string | undefined,
    sortOrder: (record.sort_order as number) || 0,
    assignedToEmail: record.assigned_to_email as string | undefined,
    isVisible: record.is_visible !== false,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

// ============================================
// Student Progress
// ============================================

export async function fetchLessonProgress(
  studentId: string,
  lessonId: string
): Promise<LmsLessonProgress | null> {
  const { data, error } = await supabase
    .from('lms_student_lesson_progress')
    .select(LMS_LESSON_PROGRESS_COLUMNS)
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .single();

  if (error || !data) return null;
  return mapLmsLessonProgress(data);
}

export async function fetchAllLessonProgress(studentId: string): Promise<LmsLessonProgress[]> {
  const { data, error } = await supabase
    .from('lms_student_lesson_progress')
    .select(LMS_LESSON_PROGRESS_COLUMNS)
    .eq('student_id', studentId);

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsLessonProgress);
}

export async function markLessonComplete(
  studentId: string,
  lessonId: string,
  notes?: string
): Promise<LmsLessonProgress> {
  const { data, error } = await supabase
    .from('lms_student_lesson_progress')
    .upsert(
      {
        student_id: studentId,
        lesson_id: lessonId,
        completed_at: new Date().toISOString(),
        notes,
      },
      { onConflict: 'student_id,lesson_id' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLmsLessonProgress(data);
}

export async function markLessonIncomplete(studentId: string, lessonId: string): Promise<void> {
  const { error } = await supabase
    .from('lms_student_lesson_progress')
    .delete()
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId);

  if (error) throw new Error(error.message);
}

function mapLmsLessonProgress(record: Record<string, unknown>): LmsLessonProgress {
  return {
    id: record.id as string,
    studentId: record.student_id as string,
    lessonId: record.lesson_id as string,
    completedAt: record.completed_at ? new Date(record.completed_at as string) : undefined,
    notes: record.notes as string | undefined,
    createdAt: new Date(record.created_at as string),
  };
}

export async function fetchActionItemProgress(
  studentId: string,
  actionItemId: string
): Promise<LmsActionItemProgress | null> {
  const { data, error } = await supabase
    .from('lms_student_action_item_progress')
    .select(LMS_ACTION_ITEM_PROGRESS_COLUMNS)
    .eq('student_id', studentId)
    .eq('action_item_id', actionItemId)
    .single();

  if (error || !data) return null;
  return mapLmsActionItemProgress(data);
}

export async function fetchAllActionItemProgress(
  studentId: string
): Promise<LmsActionItemProgress[]> {
  const { data, error } = await supabase
    .from('lms_student_action_item_progress')
    .select(LMS_ACTION_ITEM_PROGRESS_COLUMNS)
    .eq('student_id', studentId);

  if (error) throw new Error(error.message);
  return (data || []).map(mapLmsActionItemProgress);
}

export async function markActionItemComplete(
  studentId: string,
  actionItemId: string,
  proofOfWork?: string,
  notes?: string
): Promise<LmsActionItemProgress> {
  const { data, error } = await supabase
    .from('lms_student_action_item_progress')
    .upsert(
      {
        student_id: studentId,
        action_item_id: actionItemId,
        completed_at: new Date().toISOString(),
        proof_of_work: proofOfWork,
        notes,
      },
      { onConflict: 'student_id,action_item_id' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLmsActionItemProgress(data);
}

export async function markActionItemIncomplete(
  studentId: string,
  actionItemId: string
): Promise<void> {
  const { error } = await supabase
    .from('lms_student_action_item_progress')
    .delete()
    .eq('student_id', studentId)
    .eq('action_item_id', actionItemId);

  if (error) throw new Error(error.message);
}

function mapLmsActionItemProgress(record: Record<string, unknown>): LmsActionItemProgress {
  return {
    id: record.id as string,
    studentId: record.student_id as string,
    actionItemId: record.action_item_id as string,
    completedAt: record.completed_at ? new Date(record.completed_at as string) : undefined,
    proofOfWork: record.proof_of_work as string | undefined,
    notes: record.notes as string | undefined,
    createdAt: new Date(record.created_at as string),
  };
}

// ============================================
// Student Enrollments
// ============================================

export async function fetchStudentEnrollments(studentId: string): Promise<StudentEnrollment[]> {
  const { data, error } = await supabase
    .from('student_cohorts')
    .select('*, lms_cohorts(*)')
    .eq('student_id', studentId);

  if (error) throw new Error(error.message);
  if (!data) return [];

  return data
    .filter(
      (row) => row.lms_cohorts && (row.lms_cohorts as Record<string, unknown>).status === 'Active'
    )
    .map((row) => ({
      studentId: row.student_id as string,
      cohortId: row.cohort_id as string,
      role: row.role as StudentEnrollment['role'],
      joinedAt: new Date(row.joined_at as string),
      accessLevel: row.access_level as string | undefined,
      onboardingCompletedAt: row.onboarding_completed_at
        ? new Date(row.onboarding_completed_at as string)
        : undefined,
      accessExpiresAt: row.access_expires_at
        ? new Date(row.access_expires_at as string)
        : undefined,
      enrollmentSource: row.enrollment_source as string | undefined,
      cohort: mapLmsCohort(row.lms_cohorts as Record<string, unknown>),
    }))
    .sort((a, b) => a.cohort.sortOrder - b.cohort.sortOrder);
}

export async function fetchAllStudentEnrollments(): Promise<
  Map<string, { cohortId: string; cohortName: string; accessLevel?: string }[]>
> {
  const { data, error } = await supabase
    .from('student_cohorts')
    .select('student_id, cohort_id, access_level, lms_cohorts(id, name, status)');

  if (error) throw new Error(error.message);
  if (!data) return new Map();

  const map = new Map<string, { cohortId: string; cohortName: string; accessLevel?: string }[]>();
  for (const row of data) {
    const cohort = row.lms_cohorts as unknown as {
      id: string;
      name: string;
      status: string;
    } | null;
    if (!cohort || cohort.status !== 'Active') continue;
    const studentId = row.student_id as string;
    if (!map.has(studentId)) map.set(studentId, []);
    map.get(studentId)!.push({
      cohortId: cohort.id,
      cohortName: cohort.name,
      accessLevel: row.access_level as string | undefined,
    });
  }
  return map;
}

export async function unenrollStudentFromCohort(
  studentId: string,
  cohortId: string
): Promise<void> {
  const { error } = await supabase
    .from('student_cohorts')
    .delete()
    .eq('student_id', studentId)
    .eq('cohort_id', cohortId);

  if (error) throw new Error(error.message);
}

export async function enrollStudentInCohort(
  studentId: string,
  cohortId: string,
  opts: {
    role?: string;
    accessLevel?: string;
    enrollmentSource?: string;
    enrollmentMetadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const { error } = await supabase.from('student_cohorts').upsert(
    {
      student_id: studentId,
      cohort_id: cohortId,
      role: opts.role || 'student',
      access_level: opts.accessLevel || 'Full Access',
      enrollment_source: opts.enrollmentSource,
      enrollment_metadata: opts.enrollmentMetadata || {},
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,cohort_id' }
  );

  if (error) throw new Error(error.message);
}

export async function completeEnrollmentOnboarding(
  studentId: string,
  cohortId: string
): Promise<void> {
  const { error } = await supabase
    .from('student_cohorts')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .eq('cohort_id', cohortId);

  if (error) throw new Error(error.message);
}

export async function fetchCohortByProductId(productId: string): Promise<LmsCohort | null> {
  const { data, error } = await supabase
    .from('lms_cohorts')
    .select(LMS_COHORT_COLUMNS)
    .eq('thrivecart_product_id', productId)
    .single();

  if (error || !data) return null;
  return mapLmsCohort(data);
}

// ============================================
// Aggregate Queries for UI
// ============================================

/**
 * Fetch complete curriculum data for a cohort
 * Used for both admin (all items) and student (visible items only) views
 */
export async function fetchLmsCurriculumByCohort(
  cohortId: string,
  visibleOnly: boolean = false
): Promise<LmsCurriculumData | null> {
  // Fetch cohort
  const cohort = await fetchLmsCohortById(cohortId);
  if (!cohort) return null;

  // Fetch weeks
  const weeks = visibleOnly
    ? await fetchVisibleLmsWeeksByCohort(cohortId)
    : await fetchLmsWeeksByCohort(cohortId);

  // Build week data with lessons and action items
  const weeksWithLessons: LmsWeekWithLessons[] = await Promise.all(
    weeks.map(async (week) => {
      const [lessons, actionItems] = await Promise.all([
        visibleOnly ? fetchVisibleLmsLessonsByWeek(week.id) : fetchLmsLessonsByWeek(week.id),
        visibleOnly
          ? fetchVisibleLmsActionItemsByWeek(week.id)
          : fetchLmsActionItemsByWeek(week.id),
      ]);

      // Fetch content items for each lesson
      const lessonsWithContent: LmsLessonWithContent[] = await Promise.all(
        lessons.map(async (lesson) => {
          const contentItems = visibleOnly
            ? await fetchVisibleLmsContentItemsByLesson(lesson.id)
            : await fetchLmsContentItemsByLesson(lesson.id);

          return {
            ...lesson,
            contentItems,
          };
        })
      );

      return {
        ...week,
        lessons: lessonsWithContent,
        actionItems,
      };
    })
  );

  return {
    cohort,
    weeks: weeksWithLessons,
  };
}

/**
 * Fetch curriculum for a student by their cohort name
 * Filters for visible items and respects assigned_to_email on action items
 */
export async function fetchLmsCurriculumForStudent(
  cohortName: string,
  userEmail: string
): Promise<LmsCurriculumData | null> {
  // Find cohort by name
  const cohort = await fetchLmsCohortByName(cohortName);
  if (!cohort) {
    // Fall back to Global cohort if student's cohort doesn't exist
    const globalCohort = await fetchLmsCohortByName('Global');
    if (!globalCohort) return null;
    return fetchLmsCurriculumByCohortForStudent(globalCohort.id, userEmail);
  }

  return fetchLmsCurriculumByCohortForStudent(cohort.id, userEmail);
}

async function fetchLmsCurriculumByCohortForStudent(
  cohortId: string,
  userEmail: string
): Promise<LmsCurriculumData | null> {
  const cohort = await fetchLmsCohortById(cohortId);
  if (!cohort) return null;

  const weeks = await fetchVisibleLmsWeeksByCohort(cohortId);

  const weeksWithLessons: LmsWeekWithLessons[] = await Promise.all(
    weeks.map(async (week) => {
      const [lessons, actionItems] = await Promise.all([
        fetchVisibleLmsLessonsByWeek(week.id),
        fetchVisibleLmsActionItemsByWeek(week.id, userEmail),
      ]);

      const lessonsWithContent: LmsLessonWithContent[] = await Promise.all(
        lessons.map(async (lesson) => {
          const contentItems = await fetchVisibleLmsContentItemsByLesson(lesson.id);
          return {
            ...lesson,
            contentItems,
          };
        })
      );

      return {
        ...week,
        lessons: lessonsWithContent,
        actionItems,
      };
    })
  );

  return {
    cohort,
    weeks: weeksWithLessons,
  };
}

// ============================================
// Legacy Adapter for Student Portal
// Converts new LMS data to existing CourseData format
// ============================================

import { CourseData, Week, Lesson, ActionItem } from '../types';

/**
 * Convert content item to legacy embedUrl format
 * LessonView already supports these formats:
 * - Direct video URLs (YouTube, Loom, etc.)
 * - text:content - for text content
 * - ai-tool:slug - for AI tools
 * - credentials:json - for credentials (needs LessonView addition)
 */
function contentItemToEmbedUrl(item: LmsContentItem): string {
  switch (item.contentType) {
    case 'video':
    case 'slide_deck':
    case 'guide':
    case 'clay_table':
    case 'external_link':
      return item.embedUrl || '';

    case 'ai_tool':
      return `ai-tool:${item.aiToolSlug || ''}`;

    case 'text':
      return `text:${item.contentText || ''}`;

    case 'credentials':
      // Encode credentials as JSON for the credentials renderer
      return `credentials:${JSON.stringify(item.credentialsData || {})}`;

    case 'sop_link':
      return item.embedUrl || '';

    default:
      return item.embedUrl || '';
  }
}

/**
 * Fetch student curriculum and convert to legacy CourseData format
 * This adapter allows the existing LessonView and Sidebar to work
 * with the new Supabase LMS data without changes
 */
export async function fetchStudentCurriculumAsLegacy(
  cohortName: string,
  userEmail: string
): Promise<CourseData> {
  const curriculum = await fetchLmsCurriculumForStudent(cohortName, userEmail);

  // If no curriculum found, return empty data
  if (!curriculum) {
    return {
      title: 'Modern Agency Sales',
      weeks: [],
      cohort: cohortName,
    };
  }

  // Convert LMS weeks to legacy Week format
  const weeks: Week[] = curriculum.weeks.map((lmsWeek) => {
    // Convert LMS lessons to legacy Lesson format
    // Each content item becomes a separate "lesson" in the legacy format
    const lessons: Lesson[] = [];

    for (const lmsLesson of lmsWeek.lessons) {
      // Extract SOP link items separately
      const sopLinkItems = lmsLesson.contentItems.filter((ci) => ci.contentType === 'sop_link');
      const sopLinks = sopLinkItems.map((ci) => ({
        id: ci.id,
        title: ci.title,
        url: ci.embedUrl || '',
      }));
      const nonSopItems = lmsLesson.contentItems.filter((ci) => ci.contentType !== 'sop_link');

      // If lesson has content items, combine video+text into single entries
      if (nonSopItems.length > 0) {
        // Separate primary content (video, etc.) from text content items
        const primaryItems = nonSopItems.filter((ci) => ci.contentType !== 'text');
        const textItems = nonSopItems.filter((ci) => ci.contentType === 'text');
        // Combine all text content into a single description
        const combinedText = textItems
          .map((ti) => ti.contentText || '')
          .filter(Boolean)
          .join('\n\n');

        if (primaryItems.length > 0) {
          // Attach text content as description on the primary item(s)
          for (const contentItem of primaryItems) {
            lessons.push({
              id: contentItem.id,
              title: contentItem.title,
              embedUrl: contentItemToEmbedUrl(contentItem),
              description: combinedText || contentItem.description || lmsLesson.description,
              cohort: curriculum.cohort.name,
              ...(sopLinks.length > 0 && { sopLinks }),
            });
          }
        } else {
          // Lesson only has text items — show as standalone text lesson
          for (const contentItem of textItems) {
            lessons.push({
              id: contentItem.id,
              title: contentItem.title,
              embedUrl: contentItemToEmbedUrl(contentItem),
              description: contentItem.description || lmsLesson.description,
              cohort: curriculum.cohort.name,
              ...(sopLinks.length > 0 && { sopLinks }),
            });
          }
        }
      } else if (sopLinks.length > 0) {
        // Lesson only has SOP links — show as text placeholder with SOPs
        lessons.push({
          id: lmsLesson.id,
          title: lmsLesson.title,
          embedUrl: `text:${lmsLesson.description || 'No content available'}`,
          description: lmsLesson.description,
          cohort: curriculum.cohort.name,
          sopLinks,
        });
      } else {
        // Lesson with no content items - create placeholder
        lessons.push({
          id: lmsLesson.id,
          title: lmsLesson.title,
          embedUrl: `text:${lmsLesson.description || 'No content available'}`,
          description: lmsLesson.description,
          cohort: curriculum.cohort.name,
        });
      }
    }

    // Convert LMS action items to legacy ActionItem format
    const actionItems: ActionItem[] = lmsWeek.actionItems.map((lmsAction) => ({
      id: lmsAction.id,
      text: lmsAction.text,
      cohort: curriculum.cohort.name,
      assignedTo: lmsAction.assignedToEmail,
    }));

    return {
      id: lmsWeek.id,
      title: lmsWeek.title,
      lessons,
      actionItems,
    };
  });

  return {
    title: 'Modern Agency Sales',
    weeks,
    cohort: curriculum.cohort.name,
  };
}
