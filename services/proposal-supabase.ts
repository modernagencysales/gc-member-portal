import { supabase } from '../lib/supabaseClient';
import type {
  Proposal,
  ProposalAboutUs,
  ProposalClientSnapshot,
  ProposalGoal,
  ProposalService,
  ProposalRoadmapPhase,
  ProposalPricing,
  ProposalNextStep,
} from '../types/proposal-types';

const PROPOSAL_COLUMNS =
  'id, slug, prospect_id, status, client_name, client_title, client_company, client_logo_url, client_brand_color, client_website, headline, executive_summary, about_us, client_snapshot, goals, services, roadmap, pricing, next_steps, transcript_text, transcript_source, additional_notes, created_by, view_count, last_viewed_at, created_at, updated_at, monthly_rate_cents';

function mapProposal(record: Record<string, unknown>): Proposal {
  return {
    id: record.id as string,
    slug: record.slug as string,
    prospectId: (record.prospect_id as string) || null,
    status: record.status as Proposal['status'],
    clientName: record.client_name as string,
    clientTitle: (record.client_title as string) || null,
    clientCompany: record.client_company as string,
    clientLogoUrl: (record.client_logo_url as string) || null,
    clientBrandColor: (record.client_brand_color as string) || null,
    clientWebsite: (record.client_website as string) || null,
    headline: record.headline as string,
    executiveSummary: record.executive_summary as string,
    aboutUs: (record.about_us as ProposalAboutUs) || { blurb: '', stats: [], socialProof: [] },
    clientSnapshot: (record.client_snapshot as ProposalClientSnapshot) || {
      company: '',
      industry: '',
      size: '',
      revenue: '',
      currentState: '',
    },
    goals: (record.goals as ProposalGoal[]) || [],
    services: (record.services as ProposalService[]) || [],
    roadmap: (record.roadmap as ProposalRoadmapPhase[]) || [],
    pricing: (record.pricing as ProposalPricing) || {
      packages: [],
      customItems: [],
      total: '',
      paymentTerms: '',
    },
    nextSteps: (record.next_steps as ProposalNextStep[]) || [],
    transcriptText: (record.transcript_text as string) || null,
    transcriptSource: (record.transcript_source as string) || null,
    additionalNotes: (record.additional_notes as string) || null,
    createdBy: (record.created_by as string) || null,
    viewCount: (record.view_count as number) || 0,
    lastViewedAt: (record.last_viewed_at as string) || null,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    monthlyRateCents: (record.monthly_rate_cents as number) || null,
  };
}

export async function getProposalBySlug(slug: string): Promise<Proposal | null> {
  const { data, error } = await supabase
    .from('proposals')
    .select(PROPOSAL_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;

  // Increment view count in background
  supabase
    .from('proposals')
    .update({
      view_count: ((data.view_count as number) || 0) + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', data.id)
    .then(() => {});

  return mapProposal(data as Record<string, unknown>);
}

export async function listProposals(): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select(PROPOSAL_COLUMNS)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((r) => mapProposal(r as Record<string, unknown>));
}

export async function getProposalById(id: string): Promise<Proposal | null> {
  const { data, error } = await supabase
    .from('proposals')
    .select(PROPOSAL_COLUMNS)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapProposal(data as Record<string, unknown>);
}

export async function updateProposal(
  id: string,
  updates: Partial<Record<string, unknown>>
): Promise<Proposal | null> {
  const { data, error } = await supabase
    .from('proposals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(PROPOSAL_COLUMNS)
    .single();

  if (error || !data) return null;
  return mapProposal(data as Record<string, unknown>);
}

export async function deleteProposal(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('proposals')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  return !error;
}
