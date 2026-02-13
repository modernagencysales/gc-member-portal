/**
 * TAM Builder Supabase Service
 * Handles all database operations for the Total Addressable Market Builder
 */

import { supabase } from '../lib/supabaseClient';
import {
  TamProject,
  TamCompany,
  TamCompanyFeedback,
  TamContact,
  TamJob,
  TamProjectInput,
  TamProjectStats,
} from '../types/tam-types';

// Explicit column lists (avoid select('*'))
const TAM_PROJECT_COLUMNS =
  'id, user_id, name, status, icp_profile, sourcing_strategy, created_at, updated_at';

const TAM_COMPANY_COLUMNS =
  'id, project_id, name, domain, linkedin_url, source, industry, employee_count, location, description, qualification_status, qualification_reason, us_employee_pct, digital_footprint_score, similarity_score, feedback, segment_tags, raw_data, created_at';

const TAM_CONTACT_COLUMNS =
  'id, company_id, project_id, first_name, last_name, title, linkedin_url, email, email_status, phone, linkedin_last_post_date, linkedin_active, source, raw_data, created_at';

const TAM_JOB_COLUMNS =
  'id, project_id, job_type, status, config, progress, result_summary, created_at, completed_at';

// ============================================
// Mapper Functions
// ============================================

function mapTamProject(record: Record<string, unknown>): TamProject {
  return {
    id: record.id as string,
    userId: record.user_id as string,
    name: record.name as string,
    status: (record.status as TamProject['status']) || 'draft',
    icpProfile: record.icp_profile as TamProject['icpProfile'],
    sourcingStrategy: record.sourcing_strategy as TamProject['sourcingStrategy'],
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
  };
}

function mapTamCompany(record: Record<string, unknown>): TamCompany {
  return {
    id: record.id as string,
    projectId: record.project_id as string,
    name: record.name as string,
    domain: record.domain as string | null,
    linkedinUrl: record.linkedin_url as string | null,
    source: record.source as TamCompany['source'],
    industry: record.industry as string | null,
    employeeCount: record.employee_count as number | null,
    location: record.location as string | null,
    description: record.description as string | null,
    qualificationStatus:
      (record.qualification_status as TamCompany['qualificationStatus']) || 'pending',
    qualificationReason: record.qualification_reason as string | null,
    usEmployeePct: record.us_employee_pct as number | null,
    digitalFootprintScore: record.digital_footprint_score as number | null,
    similarityScore: record.similarity_score as number | null,
    feedback: (record.feedback as TamCompanyFeedback) || null,
    segmentTags: record.segment_tags as Record<string, string> | null,
    rawData: record.raw_data as Record<string, unknown> | null,
    createdAt: record.created_at as string,
  };
}

function mapTamContact(record: Record<string, unknown>): TamContact {
  return {
    id: record.id as string,
    companyId: record.company_id as string,
    projectId: record.project_id as string,
    firstName: record.first_name as string | null,
    lastName: record.last_name as string | null,
    title: record.title as string | null,
    linkedinUrl: record.linkedin_url as string | null,
    email: record.email as string | null,
    emailStatus: record.email_status as TamContact['emailStatus'],
    phone: record.phone as string | null,
    linkedinLastPostDate: record.linkedin_last_post_date as string | null,
    linkedinActive: record.linkedin_active as boolean | null,
    source: record.source as TamContact['source'],
    rawData: record.raw_data as Record<string, unknown> | null,
    createdAt: record.created_at as string,
  };
}

function mapTamJob(record: Record<string, unknown>): TamJob {
  return {
    id: record.id as string,
    projectId: record.project_id as string,
    jobType: record.job_type as TamJob['jobType'],
    status: (record.status as TamJob['status']) || 'pending',
    config: record.config as Record<string, unknown> | null,
    progress: (record.progress as number) || 0,
    resultSummary: record.result_summary as Record<string, unknown> | null,
    createdAt: record.created_at as string,
    completedAt: record.completed_at as string | null,
  };
}

// ============================================
// TAM Projects
// ============================================

export async function createImportProject(
  userId: string,
  name: string
): Promise<{ project: TamProject; companyId: string }> {
  // Create project with no ICP profile (import bypasses wizard)
  const { data: projectData, error: projectError } = await supabase
    .from('tam_projects')
    .insert({
      user_id: userId,
      name,
      status: 'enriching',
      icp_profile: null,
      sourcing_strategy: null,
    })
    .select()
    .single();

  if (projectError) throw new Error(projectError.message);

  // Create a placeholder company for the imported contacts
  const { data: companyData, error: companyError } = await supabase
    .from('tam_companies')
    .insert({
      project_id: projectData.id,
      name: 'Imported List',
      source: 'csv_import',
      qualification_status: 'qualified',
    })
    .select('id')
    .single();

  if (companyError) throw new Error(companyError.message);

  return {
    project: mapTamProject(projectData),
    companyId: companyData.id as string,
  };
}

export async function createTamProject(
  input: TamProjectInput & { userId: string }
): Promise<TamProject> {
  const insertData = {
    user_id: input.userId,
    name: input.name,
    status: 'draft',
    icp_profile: input.icpProfile,
    sourcing_strategy: null,
  };

  const { data, error } = await supabase.from('tam_projects').insert(insertData).select().single();

  if (error) throw new Error(error.message);
  return mapTamProject(data);
}

export async function fetchTamProject(projectId: string): Promise<TamProject | null> {
  const { data, error } = await supabase
    .from('tam_projects')
    .select(TAM_PROJECT_COLUMNS)
    .eq('id', projectId)
    .single();

  if (error || !data) return null;
  return mapTamProject(data);
}

export async function fetchTamProjectsByUser(userId: string): Promise<TamProject[]> {
  const { data, error } = await supabase
    .from('tam_projects')
    .select(TAM_PROJECT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTamProject);
}

export async function updateTamProject(
  projectId: string,
  updates: Partial<TamProject>
): Promise<TamProject> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.icpProfile !== undefined) updateData.icp_profile = updates.icpProfile;
  if (updates.sourcingStrategy !== undefined)
    updateData.sourcing_strategy = updates.sourcingStrategy;

  const { data, error } = await supabase
    .from('tam_projects')
    .update(updateData)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTamProject(data);
}

// ============================================
// TAM Companies
// ============================================

export async function fetchTamCompanies(
  projectId: string,
  filters?: { qualificationStatus?: string; source?: string }
): Promise<TamCompany[]> {
  let query = supabase
    .from('tam_companies')
    .select(TAM_COMPANY_COLUMNS)
    .eq('project_id', projectId);

  if (filters?.qualificationStatus) {
    query = query.eq('qualification_status', filters.qualificationStatus);
  }

  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTamCompany);
}

export async function insertTamCompanies(
  companies: Array<Partial<TamCompany> & { projectId: string; name: string }>
): Promise<void> {
  const insertData = companies.map((company) => ({
    project_id: company.projectId,
    name: company.name,
    domain: company.domain || null,
    linkedin_url: company.linkedinUrl || null,
    source: company.source || null,
    industry: company.industry || null,
    employee_count: company.employeeCount || null,
    location: company.location || null,
    description: company.description || null,
    qualification_status: company.qualificationStatus || 'pending',
    qualification_reason: company.qualificationReason || null,
    us_employee_pct: company.usEmployeePct || null,
    digital_footprint_score: company.digitalFootprintScore || null,
    similarity_score: company.similarityScore || null,
    feedback: company.feedback || null,
    segment_tags: company.segmentTags || null,
    raw_data: company.rawData || null,
  }));

  const { error } = await supabase.from('tam_companies').insert(insertData);

  if (error) throw new Error(error.message);
}

export async function updateTamCompany(
  companyId: string,
  updates: Partial<TamCompany>
): Promise<TamCompany> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.domain !== undefined) updateData.domain = updates.domain;
  if (updates.linkedinUrl !== undefined) updateData.linkedin_url = updates.linkedinUrl;
  if (updates.source !== undefined) updateData.source = updates.source;
  if (updates.industry !== undefined) updateData.industry = updates.industry;
  if (updates.employeeCount !== undefined) updateData.employee_count = updates.employeeCount;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.qualificationStatus !== undefined)
    updateData.qualification_status = updates.qualificationStatus;
  if (updates.qualificationReason !== undefined)
    updateData.qualification_reason = updates.qualificationReason;
  if (updates.usEmployeePct !== undefined) updateData.us_employee_pct = updates.usEmployeePct;
  if (updates.digitalFootprintScore !== undefined)
    updateData.digital_footprint_score = updates.digitalFootprintScore;
  if (updates.similarityScore !== undefined) updateData.similarity_score = updates.similarityScore;
  if (updates.feedback !== undefined) updateData.feedback = updates.feedback;
  if (updates.segmentTags !== undefined) updateData.segment_tags = updates.segmentTags;
  if (updates.rawData !== undefined) updateData.raw_data = updates.rawData;

  const { data, error } = await supabase
    .from('tam_companies')
    .update(updateData)
    .eq('id', companyId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTamCompany(data);
}

export async function updateCompanyFeedback(
  companyId: string,
  feedback: TamCompanyFeedback | null
): Promise<TamCompany> {
  const { data, error } = await supabase
    .from('tam_companies')
    .update({ feedback })
    .eq('id', companyId)
    .select(TAM_COMPANY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return mapTamCompany(data);
}

// ============================================
// TAM Contacts
// ============================================

export async function fetchTamContacts(
  projectId: string,
  filters?: { emailStatus?: string; linkedinActive?: boolean }
): Promise<TamContact[]> {
  let query = supabase.from('tam_contacts').select(TAM_CONTACT_COLUMNS).eq('project_id', projectId);

  if (filters?.emailStatus) {
    query = query.eq('email_status', filters.emailStatus);
  }

  if (filters?.linkedinActive !== undefined) {
    query = query.eq('linkedin_active', filters.linkedinActive);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTamContact);
}

export async function fetchTamContactsByCompany(companyId: string): Promise<TamContact[]> {
  const { data, error } = await supabase
    .from('tam_contacts')
    .select(TAM_CONTACT_COLUMNS)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTamContact);
}

export async function insertTamContacts(
  contacts: Array<Partial<TamContact> & { companyId: string; projectId: string }>
): Promise<void> {
  const insertData = contacts.map((contact) => ({
    company_id: contact.companyId,
    project_id: contact.projectId,
    first_name: contact.firstName || null,
    last_name: contact.lastName || null,
    title: contact.title || null,
    linkedin_url: contact.linkedinUrl || null,
    email: contact.email || null,
    email_status: contact.emailStatus || null,
    phone: contact.phone || null,
    linkedin_last_post_date: contact.linkedinLastPostDate || null,
    linkedin_active: contact.linkedinActive || null,
    source: contact.source || null,
    raw_data: contact.rawData || null,
  }));

  const { error } = await supabase.from('tam_contacts').insert(insertData);

  if (error) throw new Error(error.message);
}

// ============================================
// TAM Jobs
// ============================================

export async function fetchTamJobs(projectId: string): Promise<TamJob[]> {
  const { data, error } = await supabase
    .from('tam_job_queue')
    .select(TAM_JOB_COLUMNS)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTamJob);
}

export async function createTamJob(
  job: Pick<TamJob, 'projectId' | 'jobType'> & { config?: Record<string, unknown> }
): Promise<TamJob> {
  const insertData = {
    project_id: job.projectId,
    job_type: job.jobType,
    status: 'pending',
    config: job.config || null,
    progress: 0,
    result_summary: null,
  };

  const { data, error } = await supabase.from('tam_job_queue').insert(insertData).select().single();

  if (error) throw new Error(error.message);
  return mapTamJob(data);
}

export async function updateTamJob(jobId: string, updates: Partial<TamJob>): Promise<TamJob> {
  const updateData: Record<string, unknown> = {};

  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.config !== undefined) updateData.config = updates.config;
  if (updates.progress !== undefined) updateData.progress = updates.progress;
  if (updates.resultSummary !== undefined) updateData.result_summary = updates.resultSummary;
  if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;

  const { data, error } = await supabase
    .from('tam_job_queue')
    .update(updateData)
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTamJob(data);
}

// ============================================
// TAM Project Stats
// ============================================

export async function fetchTamProjectStats(projectId: string): Promise<TamProjectStats> {
  // Count companies by qualification status
  const [
    totalCompaniesResult,
    qualifiedCompaniesResult,
    disqualifiedCompaniesResult,
    pendingCompaniesResult,
  ] = await Promise.all([
    supabase
      .from('tam_companies')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabase
      .from('tam_companies')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('qualification_status', 'qualified'),
    supabase
      .from('tam_companies')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('qualification_status', 'disqualified'),
    supabase
      .from('tam_companies')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('qualification_status', 'pending'),
  ]);

  // Count contacts and email statuses
  const [
    totalContactsResult,
    emailsVerifiedResult,
    emailsCatchAllResult,
    emailsNotFoundResult,
    linkedinActiveResult,
    linkedinInactiveResult,
  ] = await Promise.all([
    supabase
      .from('tam_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabase
      .from('tam_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('email_status', 'verified'),
    supabase
      .from('tam_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('email_status', 'catch_all'),
    supabase
      .from('tam_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('email_status', 'not_found'),
    supabase
      .from('tam_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('linkedin_active', true),
    supabase
      .from('tam_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('linkedin_active', false),
  ]);

  return {
    totalCompanies: totalCompaniesResult.count || 0,
    qualifiedCompanies: qualifiedCompaniesResult.count || 0,
    disqualifiedCompanies: disqualifiedCompaniesResult.count || 0,
    pendingCompanies: pendingCompaniesResult.count || 0,
    totalContacts: totalContactsResult.count || 0,
    emailsVerified: emailsVerifiedResult.count || 0,
    emailsCatchAll: emailsCatchAllResult.count || 0,
    emailsNotFound: emailsNotFoundResult.count || 0,
    linkedinActive: linkedinActiveResult.count || 0,
    linkedinInactive: linkedinInactiveResult.count || 0,
  };
}
