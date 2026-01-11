/**
 * Growth Collective Member Portal - Airtable Service
 *
 * Provides CRUD operations for GC portal tables.
 * Base ID: appxQJMeJCq5tqgjW
 */

import {
  GCMember,
  GCMemberFields,
  ToolAccess,
  ToolAccessFields,
  OnboardingChecklistItem,
  OnboardingChecklistFields,
  MemberProgress,
  MemberProgressFields,
  OnboardingProgressItem,
  OnboardingCategoryGroup,
  MemberICP,
  MemberICPFields,
  Campaign,
  CampaignFields,
  CampaignMetrics,
  Resource,
  ResourceFields,
  AirtableRecord,
  MemberPlan,
  OnboardingCategory,
  ProgressStatus,
} from '../types/gc-types';

// ============================================
// Configuration
// ============================================
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Table names
const GC_TABLES = {
  MEMBERS: 'GC Members',
  TOOL_ACCESS: 'Tool Access',
  ONBOARDING_CHECKLIST: 'Onboarding Checklist',
  MEMBER_PROGRESS: 'Member Progress',
  MEMBER_ICP: 'Member ICP',
  CAMPAIGNS: 'Campaigns',
  RESOURCES: 'Resources',
} as const;

// ============================================
// Helper Functions
// ============================================

async function airtableFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}/${encodeURIComponent(endpoint)}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || `Airtable request failed: ${response.status}`);
  }

  return response.json();
}

async function airtableGet<T>(
  table: string,
  params?: Record<string, string>
): Promise<{ records: AirtableRecord<T>[] }> {
  let url = table;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url = `${table}?${searchParams.toString()}`;
  }
  return airtableFetch<{ records: AirtableRecord<T>[] }>(url);
}

async function airtablePatch<T>(
  table: string,
  recordId: string,
  fields: Partial<T>
): Promise<AirtableRecord<T>> {
  const url = `${BASE_URL}/${encodeURIComponent(table)}/${recordId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Update failed' } }));
    throw new Error(error.error?.message || 'Failed to update record');
  }

  return response.json();
}

async function airtableCreate<T>(
  table: string,
  fields: Partial<T>
): Promise<AirtableRecord<T>> {
  const url = `${BASE_URL}/${encodeURIComponent(table)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Create failed' } }));
    throw new Error(error.error?.message || 'Failed to create record');
  }

  return response.json();
}

// ============================================
// GC Members
// ============================================

export async function verifyGCMember(email: string): Promise<GCMember | null> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const filter = encodeURIComponent(`LOWER({Email}) = '${cleanEmail}'`);

    const response = await airtableGet<GCMemberFields>(
      `${GC_TABLES.MEMBERS}?filterByFormula=${filter}`
    );

    if (response.records && response.records.length > 0) {
      return mapGCMember(response.records[0]);
    }
    return null;
  } catch (error) {
    console.error('GC Member verification failed:', error);
    return null;
  }
}

function mapGCMember(record: AirtableRecord<GCMemberFields>): GCMember {
  const f = record.fields;
  return {
    id: record.id,
    email: f.Email,
    name: f.Name,
    company: f.Company,
    website: f.Website,
    linkedIn: f.LinkedIn,
    plan: f.Plan || 'Trial',
    status: f.Status || 'Onboarding',
    startDate: f['Start Date'] ? new Date(f['Start Date']) : undefined,
    slackHandle: f['Slack Handle'],
    calendarLink: f['Calendar Link'],
    notes: f.Notes,
  };
}

// ============================================
// Tool Access
// ============================================

export async function fetchMemberTools(memberId: string): Promise<ToolAccess[]> {
  try {
    const filter = encodeURIComponent(`FIND('${memberId}', ARRAYJOIN({Member}))`);

    const response = await airtableGet<ToolAccessFields>(
      `${GC_TABLES.TOOL_ACCESS}?filterByFormula=${filter}`
    );

    return response.records.map(mapToolAccess);
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    return [];
  }
}

function mapToolAccess(record: AirtableRecord<ToolAccessFields>): ToolAccess {
  const f = record.fields;
  return {
    id: record.id,
    recordName: f['Record Name'],
    memberId: f.Member?.[0],
    tool: f.Tool || 'Clay',
    loginUrl: f['Login URL'],
    username: f.Username,
    password: f.Password,
    accessType: f['Access Type'] || 'Shared Account',
    status: f.Status || 'Not Set Up',
    setupDoc: f['Setup Doc'],
    notes: f.Notes,
  };
}

// ============================================
// Onboarding Checklist & Progress
// ============================================

export async function fetchOnboardingChecklist(): Promise<OnboardingChecklistItem[]> {
  try {
    const response = await airtableGet<OnboardingChecklistFields>(
      `${GC_TABLES.ONBOARDING_CHECKLIST}?sort%5B0%5D%5Bfield%5D=Order&sort%5B0%5D%5Bdirection%5D=asc`
    );

    return response.records.map(mapOnboardingChecklistItem);
  } catch (error) {
    console.error('Failed to fetch checklist:', error);
    return [];
  }
}

function mapOnboardingChecklistItem(record: AirtableRecord<OnboardingChecklistFields>): OnboardingChecklistItem {
  const f = record.fields;
  return {
    id: record.id,
    item: f.Item || '',
    category: f.Category || 'Week 1',
    supportType: f['Support Type'] || 'Self-Service',
    order: f.Order || 0,
    description: f.Description,
    docLink: f['Doc Link'],
    planRequired: f['Plan Required'] || 'All Plans',
  };
}

export async function fetchMemberProgress(memberId: string): Promise<MemberProgress[]> {
  try {
    const filter = encodeURIComponent(`FIND('${memberId}', ARRAYJOIN({Member}))`);

    const response = await airtableGet<MemberProgressFields>(
      `${GC_TABLES.MEMBER_PROGRESS}?filterByFormula=${filter}`
    );

    return response.records.map(mapMemberProgress);
  } catch (error) {
    console.error('Failed to fetch progress:', error);
    return [];
  }
}

function mapMemberProgress(record: AirtableRecord<MemberProgressFields>): MemberProgress {
  const f = record.fields;
  return {
    id: record.id,
    recordId: f['Record ID'],
    memberId: f.Member?.[0],
    checklistItemId: f['Checklist Item']?.[0],
    status: f.Status || 'Not Started',
    completedDate: f['Completed Date'] ? new Date(f['Completed Date']) : undefined,
    notes: f.Notes,
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
  const categoryOrder: OnboardingCategory[] = ['Before Kickoff', 'Week 1', 'Week 2', 'Week 3-4', 'Ongoing'];
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
  const fields: Partial<MemberProgressFields> = {
    Status: status,
  };

  if (notes !== undefined) {
    fields.Notes = notes;
  }

  if (status === 'Complete') {
    fields['Completed Date'] = new Date().toISOString().split('T')[0];
  }

  if (progressId) {
    // Update existing record
    const updated = await airtablePatch<MemberProgressFields>(
      GC_TABLES.MEMBER_PROGRESS,
      progressId,
      fields
    );
    return mapMemberProgress(updated);
  } else {
    // Create new record
    const created = await airtableCreate<MemberProgressFields>(GC_TABLES.MEMBER_PROGRESS, {
      ...fields,
      Member: [memberId],
      'Checklist Item': [checklistItemId],
    });
    return mapMemberProgress(created);
  }
}

// ============================================
// Member ICP
// ============================================

export async function fetchMemberICP(memberId: string): Promise<MemberICP | null> {
  try {
    const filter = encodeURIComponent(`FIND('${memberId}', ARRAYJOIN({Member}))`);

    const response = await airtableGet<MemberICPFields>(
      `${GC_TABLES.MEMBER_ICP}?filterByFormula=${filter}`
    );

    if (response.records.length > 0) {
      return mapMemberICP(response.records[0]);
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch ICP:', error);
    return null;
  }
}

function mapMemberICP(record: AirtableRecord<MemberICPFields>): MemberICP {
  const f = record.fields;
  return {
    id: record.id,
    companyName: f['Company Name'],
    memberId: f.Member?.[0],
    targetDescription: f['Target Description'],
    verticals: f.Verticals,
    companySize: f['Company Size'],
    jobTitles: f['Job Titles'],
    geography: f.Geography,
    painPoints: f['Pain Points'],
    socialProof: f['Social Proof'],
    differentiator: f.Differentiator,
    commonObjections: f['Common Objections'],
    offer: f.Offer,
  };
}

export async function updateMemberICP(
  icpId: string | undefined,
  memberId: string,
  data: Partial<Omit<MemberICP, 'id' | 'memberId'>>
): Promise<MemberICP> {
  const fields: Partial<MemberICPFields> = {};

  if (data.companyName !== undefined) fields['Company Name'] = data.companyName;
  if (data.targetDescription !== undefined) fields['Target Description'] = data.targetDescription;
  if (data.verticals !== undefined) fields.Verticals = data.verticals;
  if (data.companySize !== undefined) fields['Company Size'] = data.companySize;
  if (data.jobTitles !== undefined) fields['Job Titles'] = data.jobTitles;
  if (data.geography !== undefined) fields.Geography = data.geography;
  if (data.painPoints !== undefined) fields['Pain Points'] = data.painPoints;
  if (data.socialProof !== undefined) fields['Social Proof'] = data.socialProof;
  if (data.differentiator !== undefined) fields.Differentiator = data.differentiator;
  if (data.commonObjections !== undefined) fields['Common Objections'] = data.commonObjections;
  if (data.offer !== undefined) fields.Offer = data.offer;

  if (icpId) {
    const updated = await airtablePatch<MemberICPFields>(GC_TABLES.MEMBER_ICP, icpId, fields);
    return mapMemberICP(updated);
  } else {
    const created = await airtableCreate<MemberICPFields>(GC_TABLES.MEMBER_ICP, {
      ...fields,
      Member: [memberId],
    });
    return mapMemberICP(created);
  }
}

// ============================================
// Campaigns
// ============================================

export async function fetchMemberCampaigns(memberId: string): Promise<Campaign[]> {
  try {
    const filter = encodeURIComponent(`FIND('${memberId}', ARRAYJOIN({Member}))`);

    const response = await airtableGet<CampaignFields>(
      `${GC_TABLES.CAMPAIGNS}?filterByFormula=${filter}&sort%5B0%5D%5Bfield%5D=Start%20Date&sort%5B0%5D%5Bdirection%5D=desc`
    );

    return response.records.map(mapCampaign);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return [];
  }
}

function mapCampaign(record: AirtableRecord<CampaignFields>): Campaign {
  const f = record.fields;
  return {
    id: record.id,
    campaignName: f['Campaign Name'] || 'Untitled Campaign',
    memberId: f.Member?.[0],
    channel: f.Channel || 'Cold Email',
    status: f.Status || 'Draft',
    icpSegment: f['ICP Segment'],
    messagingAngle: f['Messaging Angle'],
    email1: f['Email 1'],
    email2: f['Email 2'],
    linkedInDM: f['LinkedIn DM'],
    startDate: f['Start Date'] ? new Date(f['Start Date']) : undefined,
    metrics: {
      contactsReached: f['Contacts Reached'] || 0,
      opens: f.Opens || 0,
      replies: f['Replies (Self-Reported)'] || 0,
      positiveReplies: f['Positive Replies (Self-Reported)'] || 0,
      meetingsBooked: f['Meetings Booked (Self-Reported)'] || 0,
    },
    lastUpdatedByMember: f['Last Updated By Member']
      ? new Date(f['Last Updated By Member'])
      : undefined,
    notes: f.Notes,
  };
}

export async function updateCampaignMetrics(
  campaignId: string,
  metrics: Partial<CampaignMetrics>
): Promise<Campaign> {
  const fields: Partial<CampaignFields> = {
    'Last Updated By Member': new Date().toISOString().split('T')[0],
  };

  if (metrics.contactsReached !== undefined) fields['Contacts Reached'] = metrics.contactsReached;
  if (metrics.opens !== undefined) fields.Opens = metrics.opens;
  if (metrics.replies !== undefined) fields['Replies (Self-Reported)'] = metrics.replies;
  if (metrics.positiveReplies !== undefined)
    fields['Positive Replies (Self-Reported)'] = metrics.positiveReplies;
  if (metrics.meetingsBooked !== undefined)
    fields['Meetings Booked (Self-Reported)'] = metrics.meetingsBooked;

  const updated = await airtablePatch<CampaignFields>(GC_TABLES.CAMPAIGNS, campaignId, fields);
  return mapCampaign(updated);
}

// ============================================
// Resources
// ============================================

export async function fetchResources(memberPlan: MemberPlan): Promise<Resource[]> {
  try {
    const response = await airtableGet<ResourceFields>(
      `${GC_TABLES.RESOURCES}?sort%5B0%5D%5Bfield%5D=Order&sort%5B0%5D%5Bdirection%5D=asc`
    );

    const isFullPlan = memberPlan === 'Full ($1000/mo)';

    return response.records
      .map(mapResource)
      .filter((r) => {
        if (r.planRequired === 'All Plans') return true;
        if (r.planRequired === 'Full Only' && isFullPlan) return true;
        return false;
      });
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return [];
  }
}

function mapResource(record: AirtableRecord<ResourceFields>): Resource {
  const f = record.fields;
  return {
    id: record.id,
    title: f.Title || 'Untitled',
    category: f.Category || 'Getting Started',
    description: f.Description,
    url: f.URL,
    tool: f.Tool || 'General',
    order: f.Order || 0,
    planRequired: f['Plan Required'] || 'All Plans',
    featured: f.Featured || false,
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
  const resources = await fetchResources(memberPlan);
  return resources.filter((r) => r.featured);
}
// Build 1768156918
