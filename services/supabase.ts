/**
 * Supabase Service for GC Member Portal
 * Replaces gc-airtable.ts with proper database operations
 */

import { supabase } from '../lib/supabaseClient';
import {
  GCMember,
  ToolAccess,
  OnboardingChecklistItem,
  MemberProgress,
  OnboardingCategoryGroup,
  OnboardingProgressItem,
  MemberICP,
  Campaign,
  CampaignMetrics,
  Resource,
  MemberPlan,
  OnboardingCategory,
  ProgressStatus,
} from '../types/gc-types';

// ============================================
// GC Members
// ============================================

export async function verifyGCMember(email: string): Promise<GCMember | null> {
  try {
    const { data, error } = await supabase
      .from('gc_members')
      .select('*')
      .ilike('email', email)
      .single();

    if (error || !data) {
      console.log('Member not found:', email);
      return null;
    }

    return mapGCMember(data);
  } catch (error) {
    console.error('GC Member verification failed:', error);
    return null;
  }
}

function mapGCMember(record: Record<string, unknown>): GCMember {
  return {
    id: record.id as string,
    email: record.email as string,
    name: record.name as string | undefined,
    company: record.company as string | undefined,
    website: record.website as string | undefined,
    linkedIn: record.linkedin as string | undefined,
    plan: (record.plan as MemberPlan) || 'Trial',
    status: (record.status as GCMember['status']) || 'Onboarding',
    startDate: record.start_date ? new Date(record.start_date as string) : undefined,
    slackHandle: record.slack_handle as string | undefined,
    calendarLink: record.calendar_link as string | undefined,
    notes: record.notes as string | undefined,
  };
}

// ============================================
// Tool Access
// ============================================

export async function fetchMemberTools(memberId: string): Promise<ToolAccess[]> {
  try {
    const { data, error } = await supabase
      .from('tool_access')
      .select('*')
      .eq('member_id', memberId);

    if (error) {
      console.error('Failed to fetch tools:', error);
      return [];
    }

    return (data || []).map(mapToolAccess);
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    return [];
  }
}

function mapToolAccess(record: Record<string, unknown>): ToolAccess {
  return {
    id: record.id as string,
    recordName: record.record_name as string | undefined,
    memberId: record.member_id as string | undefined,
    tool: record.tool as ToolAccess['tool'],
    loginUrl: record.login_url as string | undefined,
    username: record.username as string | undefined,
    password: record.password as string | undefined,
    accessType: record.access_type as ToolAccess['accessType'],
    status: (record.status as ToolAccess['status']) || 'Not Set Up',
    setupDoc: record.setup_doc as string | undefined,
    notes: record.notes as string | undefined,
  };
}

// ============================================
// Onboarding Checklist
// ============================================

export async function fetchOnboardingChecklist(): Promise<OnboardingChecklistItem[]> {
  try {
    const { data, error } = await supabase
      .from('onboarding_checklist')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch checklist:', error);
      return [];
    }

    return (data || []).map(mapOnboardingChecklistItem);
  } catch (error) {
    console.error('Failed to fetch checklist:', error);
    return [];
  }
}

function mapOnboardingChecklistItem(record: Record<string, unknown>): OnboardingChecklistItem {
  return {
    id: record.id as string,
    item: record.item as string,
    category: record.category as OnboardingCategory,
    supportType: record.support_type as OnboardingChecklistItem['supportType'],
    order: (record.sort_order as number) || 0,
    description: record.description as string | undefined,
    docLink: record.doc_link as string | undefined,
    planRequired: (record.plan_required as OnboardingChecklistItem['planRequired']) || 'All Plans',
  };
}

// ============================================
// Member Progress
// ============================================

export async function fetchMemberProgress(memberId: string): Promise<MemberProgress[]> {
  try {
    const { data, error } = await supabase
      .from('member_progress')
      .select('*')
      .eq('member_id', memberId);

    if (error) {
      console.error('Failed to fetch progress:', error);
      return [];
    }

    return (data || []).map(mapMemberProgress);
  } catch (error) {
    console.error('Failed to fetch progress:', error);
    return [];
  }
}

function mapMemberProgress(record: Record<string, unknown>): MemberProgress {
  return {
    id: record.id as string,
    memberId: record.member_id as string | undefined,
    checklistItemId: record.checklist_item_id as string | undefined,
    status: (record.status as ProgressStatus) || 'Not Started',
    completedDate: record.completed_date ? new Date(record.completed_date as string) : undefined,
    notes: record.notes as string | undefined,
  };
}

/**
 * Fetch onboarding checklist with member progress combined
 */
export async function fetchOnboardingWithProgress(
  memberId: string,
  memberPlan: MemberPlan
): Promise<{ categories: OnboardingCategoryGroup[]; totalProgress: number }> {
  const [checklist, progress] = await Promise.all([
    fetchOnboardingChecklist(),
    fetchMemberProgress(memberId),
  ]);

  // Create lookup map for progress by checklist item ID
  const progressMap = new Map<string, MemberProgress>();
  progress.forEach((p) => {
    if (p.checklistItemId) {
      progressMap.set(p.checklistItemId, p);
    }
  });

  // Filter checklist by member's plan
  const isFullPlan = memberPlan === 'Full ($1000/mo)';
  const filteredChecklist = checklist.filter((item) => {
    if (item.planRequired === 'All Plans') return true;
    if (item.planRequired === 'Full Only' && isFullPlan) return true;
    return false;
  });

  // Merge checklist with progress
  const itemsWithProgress: OnboardingProgressItem[] = filteredChecklist.map((item) => {
    const prog = progressMap.get(item.id);
    return {
      ...item,
      progressId: prog?.id,
      progressStatus: prog?.status || 'Not Started',
      completedDate: prog?.completedDate,
      progressNotes: prog?.notes,
    };
  });

  // Group by category
  const categoryOrder: OnboardingCategory[] = [
    'Before Kickoff',
    'Week 1',
    'Week 2',
    'Week 3-4',
    'Ongoing',
  ];
  const categoryMap = new Map<OnboardingCategory, OnboardingProgressItem[]>();

  itemsWithProgress.forEach((item) => {
    const existing = categoryMap.get(item.category) || [];
    existing.push(item);
    categoryMap.set(item.category, existing);
  });

  const categories: OnboardingCategoryGroup[] = categoryOrder
    .filter((cat) => categoryMap.has(cat))
    .map((name) => {
      const items = categoryMap.get(name) || [];
      const sortedItems = items.sort((a, b) => a.order - b.order);
      const completedCount = items.filter((i) => i.progressStatus === 'Complete').length;
      return {
        name,
        items: sortedItems,
        completedCount,
        totalCount: items.length,
      };
    });

  // Calculate overall progress
  const totalCompleted = itemsWithProgress.filter((i) => i.progressStatus === 'Complete').length;
  const totalProgress =
    itemsWithProgress.length > 0
      ? Math.round((totalCompleted / itemsWithProgress.length) * 100)
      : 0;

  return { categories, totalProgress };
}

/**
 * Update or create member progress record
 */
export async function updateMemberProgress(
  progressId: string | undefined,
  memberId: string,
  checklistItemId: string,
  status: ProgressStatus,
  notes?: string
): Promise<MemberProgress> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  if (status === 'Complete') {
    updateData.completed_date = new Date().toISOString().split('T')[0];
  } else {
    updateData.completed_date = null;
  }

  if (progressId) {
    // Update existing record
    const { data, error } = await supabase
      .from('member_progress')
      .update(updateData)
      .eq('id', progressId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update progress:', error);
      throw new Error(error.message);
    }

    return mapMemberProgress(data);
  } else {
    // Create new record using upsert (handles unique constraint)
    const { data, error } = await supabase
      .from('member_progress')
      .upsert(
        {
          member_id: memberId,
          checklist_item_id: checklistItemId,
          ...updateData,
        },
        {
          onConflict: 'member_id,checklist_item_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to create progress:', error);
      throw new Error(error.message);
    }

    return mapMemberProgress(data);
  }
}

// ============================================
// Member ICP
// ============================================

export async function fetchMemberICP(memberId: string): Promise<MemberICP | null> {
  try {
    const { data, error } = await supabase
      .from('member_icp')
      .select('*')
      .eq('member_id', memberId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch ICP:', error);
      return null;
    }

    if (!data) return null;

    return mapMemberICP(data);
  } catch (error) {
    console.error('Failed to fetch ICP:', error);
    return null;
  }
}

function mapMemberICP(record: Record<string, unknown>): MemberICP {
  return {
    id: record.id as string,
    memberId: record.member_id as string | undefined,
    companyName: record.company_name as string | undefined,
    targetDescription: record.target_description as string | undefined,
    verticals: record.verticals as string | undefined,
    companySize: record.company_size as string | undefined,
    jobTitles: record.job_titles as string | undefined,
    geography: record.geography as string | undefined,
    painPoints: record.pain_points as string | undefined,
    socialProof: record.social_proof as string | undefined,
    differentiator: record.differentiator as string | undefined,
    commonObjections: record.common_objections as string | undefined,
    offer: record.offer as string | undefined,
  };
}

export async function updateMemberICP(
  icpId: string | undefined,
  memberId: string,
  updates: Partial<MemberICP>
): Promise<MemberICP> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Map camelCase to snake_case
  if (updates.companyName !== undefined) updateData.company_name = updates.companyName;
  if (updates.targetDescription !== undefined)
    updateData.target_description = updates.targetDescription;
  if (updates.verticals !== undefined) updateData.verticals = updates.verticals;
  if (updates.companySize !== undefined) updateData.company_size = updates.companySize;
  if (updates.jobTitles !== undefined) updateData.job_titles = updates.jobTitles;
  if (updates.geography !== undefined) updateData.geography = updates.geography;
  if (updates.painPoints !== undefined) updateData.pain_points = updates.painPoints;
  if (updates.socialProof !== undefined) updateData.social_proof = updates.socialProof;
  if (updates.differentiator !== undefined) updateData.differentiator = updates.differentiator;
  if (updates.commonObjections !== undefined)
    updateData.common_objections = updates.commonObjections;
  if (updates.offer !== undefined) updateData.offer = updates.offer;

  if (icpId) {
    const { data, error } = await supabase
      .from('member_icp')
      .update(updateData)
      .eq('id', icpId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update ICP:', error);
      throw new Error(error.message);
    }

    return mapMemberICP(data);
  } else {
    const { data, error } = await supabase
      .from('member_icp')
      .upsert(
        {
          member_id: memberId,
          ...updateData,
        },
        {
          onConflict: 'member_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to create ICP:', error);
      throw new Error(error.message);
    }

    return mapMemberICP(data);
  }
}

// ============================================
// Campaigns
// ============================================

export async function fetchMemberCampaigns(memberId: string): Promise<Campaign[]> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('member_id', memberId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Failed to fetch campaigns:', error);
      return [];
    }

    return (data || []).map(mapCampaign);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return [];
  }
}

function mapCampaign(record: Record<string, unknown>): Campaign {
  return {
    id: record.id as string,
    campaignName: record.campaign_name as string,
    memberId: record.member_id as string | undefined,
    channel: record.channel as Campaign['channel'],
    status: (record.status as Campaign['status']) || 'Draft',
    icpSegment: record.icp_segment as string | undefined,
    messagingAngle: record.messaging_angle as string | undefined,
    email1: record.email_1 as string | undefined,
    email2: record.email_2 as string | undefined,
    linkedInDM: record.linkedin_dm as string | undefined,
    startDate: record.start_date ? new Date(record.start_date as string) : undefined,
    metrics: {
      contactsReached: (record.contacts_reached as number) || 0,
      opens: (record.opens as number) || 0,
      replies: (record.replies as number) || 0,
      positiveReplies: (record.positive_replies as number) || 0,
      meetingsBooked: (record.meetings_booked as number) || 0,
    },
    lastUpdatedByMember: record.last_updated_by_member
      ? new Date(record.last_updated_by_member as string)
      : undefined,
    notes: record.notes as string | undefined,
  };
}

export async function updateCampaignMetrics(
  campaignId: string,
  metrics: Partial<CampaignMetrics>
): Promise<Campaign> {
  const updateData: Record<string, unknown> = {
    last_updated_by_member: new Date().toISOString().split('T')[0],
  };

  if (metrics.contactsReached !== undefined) updateData.contacts_reached = metrics.contactsReached;
  if (metrics.opens !== undefined) updateData.opens = metrics.opens;
  if (metrics.replies !== undefined) updateData.replies = metrics.replies;
  if (metrics.positiveReplies !== undefined) updateData.positive_replies = metrics.positiveReplies;
  if (metrics.meetingsBooked !== undefined) updateData.meetings_booked = metrics.meetingsBooked;

  const { data, error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('id', campaignId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update campaign metrics:', error);
    throw new Error(error.message);
  }

  return mapCampaign(data);
}

// ============================================
// Resources
// ============================================

export async function fetchResources(memberPlan: MemberPlan): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch resources:', error);
      return [];
    }

    const isFullPlan = memberPlan === 'Full ($1000/mo)';

    return (data || []).map(mapResource).filter((r) => {
      if (r.planRequired === 'All Plans') return true;
      if (r.planRequired === 'Full Only' && isFullPlan) return true;
      return false;
    });
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return [];
  }
}

function mapResource(record: Record<string, unknown>): Resource {
  return {
    id: record.id as string,
    title: (record.title as string) || 'Untitled',
    category: (record.category as Resource['category']) || 'Getting Started',
    description: record.description as string | undefined,
    url: record.url as string | undefined,
    tool: (record.tool as Resource['tool']) || 'General',
    order: (record.sort_order as number) || 0,
    planRequired: (record.plan_required as Resource['planRequired']) || 'All Plans',
    featured: (record.featured as boolean) || false,
  };
}

/**
 * Get resources grouped by category
 */
export async function fetchResourcesByCategory(
  memberPlan: MemberPlan
): Promise<Map<string, Resource[]>> {
  const resources = await fetchResources(memberPlan);

  const categoryMap = new Map<string, Resource[]>();
  resources.forEach((resource) => {
    const existing = categoryMap.get(resource.category) || [];
    existing.push(resource);
    categoryMap.set(resource.category, existing);
  });

  return categoryMap;
}

/**
 * Get featured resources for dashboard
 */
export async function fetchFeaturedResources(memberPlan: MemberPlan): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('featured', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch featured resources:', error);
      return [];
    }

    const isFullPlan = memberPlan === 'Full ($1000/mo)';

    return (data || []).map(mapResource).filter((r) => {
      if (r.planRequired === 'All Plans') return true;
      if (r.planRequired === 'Full Only' && isFullPlan) return true;
      return false;
    });
  } catch (error) {
    console.error('Failed to fetch featured resources:', error);
    return [];
  }
}
