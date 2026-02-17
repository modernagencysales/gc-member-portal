/**
 * Connection Ranker Service
 * Handles all database operations for the aggressive connection ranking feature.
 * Follows pattern from services/enrichment-batch-supabase.ts
 */

import { supabase } from '../lib/supabaseClient';
import type {
  RankingRun,
  RankedConnection,
  RunStatus,
  EnrichmentStatus,
  QualificationCriteria,
  ProtectedKeywords,
  GroundingData,
  RankingTier,
} from '../types/connection-qualifier-types';
import { assignTier } from '../components/bootcamp/connection-qualifier/scoring';

// ============================================
// Column Lists (never select('*'))
// ============================================

const RUN_COLUMNS = [
  'id',
  'user_id',
  'name',
  'status',
  'total_connections',
  'phase1_processed',
  'phase2_total',
  'phase2_processed',
  'tier_definite_keep',
  'tier_strong_keep',
  'tier_borderline',
  'tier_likely_remove',
  'tier_definite_remove',
  'tier_protected',
  'criteria',
  'protected_keywords',
  'gemini_calls',
  'estimated_cost_cents',
  'created_at',
  'phase1_completed_at',
  'phase2_completed_at',
  'completed_at',
].join(', ');

const RESULT_COLUMNS = [
  'id',
  'run_id',
  'first_name',
  'last_name',
  'linkedin_url',
  'email_address',
  'company',
  'position',
  'connected_on',
  'deterministic_score',
  'title_score',
  'company_score',
  'recency_score',
  'is_protected',
  'protected_reason',
  'needs_enrichment',
  'enrichment_status',
  'grounding_data',
  'ai_score',
  'ai_reasoning',
  'ai_geography',
  'ai_industry',
  'ai_company_size',
  'total_score',
  'tier',
  'rank_position',
  'user_override',
  'created_at',
].join(', ');

// ============================================
// Mappers
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRankingRun(data: any): RankingRun {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: (data.name as string) || null,
    status: data.status as RunStatus,
    totalConnections: (data.total_connections as number) || 0,
    phase1Processed: (data.phase1_processed as number) || 0,
    phase2Total: (data.phase2_total as number) || 0,
    phase2Processed: (data.phase2_processed as number) || 0,
    tierDefiniteKeep: (data.tier_definite_keep as number) || 0,
    tierStrongKeep: (data.tier_strong_keep as number) || 0,
    tierBorderline: (data.tier_borderline as number) || 0,
    tierLikelyRemove: (data.tier_likely_remove as number) || 0,
    tierDefiniteRemove: (data.tier_definite_remove as number) || 0,
    tierProtected: (data.tier_protected as number) || 0,
    criteria: (data.criteria as QualificationCriteria) || null,
    protectedKeywords: (data.protected_keywords as ProtectedKeywords) || null,
    geminiCalls: (data.gemini_calls as number) || 0,
    estimatedCostCents: (data.estimated_cost_cents as number) || 0,
    createdAt: data.created_at as string,
    phase1CompletedAt: (data.phase1_completed_at as string) || null,
    phase2CompletedAt: (data.phase2_completed_at as string) || null,
    completedAt: (data.completed_at as string) || null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRankedConnection(data: any): RankedConnection {
  return {
    id: data.id as string,
    runId: data.run_id as string,
    firstName: (data.first_name as string) || null,
    lastName: (data.last_name as string) || null,
    linkedinUrl: (data.linkedin_url as string) || null,
    emailAddress: (data.email_address as string) || null,
    company: (data.company as string) || null,
    position: (data.position as string) || null,
    connectedOn: (data.connected_on as string) || null,
    deterministicScore: (data.deterministic_score as number) || 0,
    titleScore: (data.title_score as number) || 0,
    companyScore: (data.company_score as number) || 0,
    recencyScore: (data.recency_score as number) || 0,
    isProtected: (data.is_protected as boolean) || false,
    protectedReason: (data.protected_reason as string) || null,
    needsEnrichment: (data.needs_enrichment as boolean) || false,
    enrichmentStatus: (data.enrichment_status as EnrichmentStatus) || 'pending',
    groundingData: (data.grounding_data as GroundingData) || null,
    aiScore: (data.ai_score as number) || 0,
    aiReasoning: (data.ai_reasoning as string) || null,
    aiGeography: (data.ai_geography as string) || null,
    aiIndustry: (data.ai_industry as string) || null,
    aiCompanySize: (data.ai_company_size as string) || null,
    totalScore: (data.total_score as number) || 0,
    tier: (data.tier as RankingTier) || null,
    rankPosition: (data.rank_position as number) || null,
    userOverride: (data.user_override as 'keep' | 'remove') || null,
    createdAt: data.created_at as string,
  };
}

// ============================================
// Run Operations
// ============================================

export async function createRankingRun(
  userId: string,
  name: string,
  criteria: QualificationCriteria,
  protectedKeywords: ProtectedKeywords
): Promise<RankingRun> {
  const { data, error } = await supabase
    .from('connection_ranking_runs')
    .insert({
      user_id: userId,
      name,
      criteria,
      protected_keywords: protectedKeywords,
    })
    .select(RUN_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return mapRankingRun(data);
}

export async function updateRunStatus(
  runId: string,
  status: RunStatus,
  extraFields?: Record<string, unknown>
): Promise<void> {
  const update: Record<string, unknown> = { status, ...extraFields };
  const { error } = await supabase.from('connection_ranking_runs').update(update).eq('id', runId);

  if (error) throw new Error(error.message);
}

export async function updateRunPhase1Progress(runId: string, processed: number): Promise<void> {
  const { error } = await supabase
    .from('connection_ranking_runs')
    .update({ phase1_processed: processed })
    .eq('id', runId);

  if (error) throw new Error(error.message);
}

export async function updateRunPhase2Progress(
  runId: string,
  processed: number,
  geminiCalls: number,
  costCents: number
): Promise<void> {
  const { error } = await supabase
    .from('connection_ranking_runs')
    .update({
      phase2_processed: processed,
      gemini_calls: geminiCalls,
      estimated_cost_cents: costCents,
    })
    .eq('id', runId);

  if (error) throw new Error(error.message);
}

export async function fetchRankingRun(runId: string): Promise<RankingRun | null> {
  const { data, error } = await supabase
    .from('connection_ranking_runs')
    .select(RUN_COLUMNS)
    .eq('id', runId)
    .single();

  if (error || !data) return null;
  return mapRankingRun(data);
}

export async function fetchRankingRunsByUser(userId: string): Promise<RankingRun[]> {
  const { data, error } = await supabase
    .from('connection_ranking_runs')
    .select(RUN_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data || []).map(mapRankingRun);
}

export async function deleteRankingRun(runId: string): Promise<void> {
  const { error } = await supabase.from('connection_ranking_runs').delete().eq('id', runId);

  if (error) throw new Error(error.message);
}

// ============================================
// Result Operations
// ============================================

interface InsertResult {
  run_id: string;
  first_name: string | null;
  last_name: string | null;
  linkedin_url: string | null;
  email_address: string | null;
  company: string | null;
  position: string | null;
  connected_on: string | null;
  deterministic_score: number;
  title_score: number;
  company_score: number;
  recency_score: number;
  is_protected: boolean;
  protected_reason: string | null;
  needs_enrichment: boolean;
  enrichment_status: string;
  total_score: number;
  tier: string;
}

export async function insertRankingResults(
  runId: string,
  results: Array<{
    connection: {
      firstName: string;
      lastName: string;
      url: string;
      emailAddress: string;
      company: string;
      position: string;
      connectedOn: string;
    };
    titleScore: number;
    companyScore: number;
    recencyScore: number;
    total: number;
    isProtected: boolean;
    protectedReason: string | null;
    needsEnrichment: boolean;
  }>
): Promise<void> {
  const rows: InsertResult[] = results.map((r) => ({
    run_id: runId,
    first_name: r.connection.firstName || null,
    last_name: r.connection.lastName || null,
    linkedin_url: r.connection.url || null,
    email_address: r.connection.emailAddress || null,
    company: r.connection.company || null,
    position: r.connection.position || null,
    connected_on: r.connection.connectedOn || null,
    deterministic_score: r.total,
    title_score: r.titleScore,
    company_score: r.companyScore,
    recency_score: r.recencyScore,
    is_protected: r.isProtected,
    protected_reason: r.protectedReason,
    needs_enrichment: r.needsEnrichment,
    enrichment_status: r.needsEnrichment ? 'pending' : 'skipped',
    total_score: r.total, // will be updated in phase 2
    tier: assignTier(r.total, r.isProtected),
  }));

  // Insert in chunks of 500
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase.from('connection_ranking_results').insert(chunk);
    if (error) throw new Error(`Chunk ${i}-${i + chunk.length}: ${error.message}`);
  }
}

export async function fetchPendingEnrichments(
  runId: string,
  limit: number
): Promise<RankedConnection[]> {
  const { data, error } = await supabase
    .from('connection_ranking_results')
    .select(RESULT_COLUMNS)
    .eq('run_id', runId)
    .eq('needs_enrichment', true)
    .eq('enrichment_status', 'pending')
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []).map(mapRankedConnection);
}

export async function updateEnrichmentResult(
  resultId: string,
  groundingData: GroundingData,
  aiScore: number,
  aiReasoning: string,
  geo: string,
  industry: string,
  companySize: string
): Promise<void> {
  const { error } = await supabase
    .from('connection_ranking_results')
    .update({
      grounding_data: groundingData,
      ai_score: aiScore,
      ai_reasoning: aiReasoning,
      ai_geography: geo,
      ai_industry: industry,
      ai_company_size: companySize,
      enrichment_status: 'completed',
    })
    .eq('id', resultId);

  if (error) throw new Error(error.message);
}

export async function updateEnrichmentFailed(resultId: string, errorMsg: string): Promise<void> {
  const { error } = await supabase
    .from('connection_ranking_results')
    .update({
      enrichment_status: 'failed',
      ai_reasoning: `Error: ${errorMsg}`,
    })
    .eq('id', resultId);

  if (error) throw new Error(error.message);
}

export async function markEnrichmentProcessing(resultIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('connection_ranking_results')
    .update({ enrichment_status: 'processing' })
    .in('id', resultIds);

  if (error) throw new Error(error.message);
}

// ============================================
// Finalization
// ============================================

export async function finalizeRanking(runId: string): Promise<void> {
  // Single RPC call — handles score recomputation, tier assignment,
  // rank positions, and tier counts all server-side in SQL.
  const { error } = await supabase.rpc('finalize_ranking_run', { p_run_id: runId });
  if (error) throw new Error(error.message);
}

// ============================================
// Results Fetching (with filtering/pagination)
// ============================================

export interface FetchResultsOpts {
  tier?: RankingTier;
  search?: string;
  sortBy?: 'total_score' | 'rank_position' | 'first_name';
  sortAsc?: boolean;
  limit?: number;
  offset?: number;
}

export async function fetchRankingResults(
  runId: string,
  opts: FetchResultsOpts = {}
): Promise<{ results: RankedConnection[]; total: number }> {
  const { tier, search, sortBy = 'rank_position', sortAsc = true, limit = 50, offset = 0 } = opts;

  let query = supabase
    .from('connection_ranking_results')
    .select(RESULT_COLUMNS, { count: 'exact' })
    .eq('run_id', runId);

  if (tier) {
    query = query.eq('tier', tier);
  }

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%,position.ilike.%${search}%`
    );
  }

  query = query.order(sortBy, { ascending: sortAsc }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);
  return {
    results: (data || []).map(mapRankedConnection),
    total: count || 0,
  };
}

// ============================================
// User Override
// ============================================

export async function updateUserOverride(
  resultId: string,
  override: 'keep' | 'remove' | null
): Promise<void> {
  const { error } = await supabase
    .from('connection_ranking_results')
    .update({ user_override: override })
    .eq('id', resultId);

  if (error) throw new Error(error.message);
}

// ============================================
// Export Helpers
// ============================================

export async function fetchResultsForExport(
  runId: string,
  filter: 'all' | 'removal' | 'keep'
): Promise<RankedConnection[]> {
  const allResults: RankedConnection[] = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let pageQuery = supabase
      .from('connection_ranking_results')
      .select(RESULT_COLUMNS)
      .eq('run_id', runId)
      .order('rank_position', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (filter === 'removal') {
      pageQuery = pageQuery.or('tier.in.(likely_remove,definite_remove),user_override.eq.remove');
    } else if (filter === 'keep') {
      pageQuery = pageQuery.or(
        'tier.in.(definite_keep,strong_keep,protected),user_override.eq.keep'
      );
    }

    const { data, error } = await pageQuery;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    allResults.push(...data.map(mapRankedConnection));
    hasMore = data.length === pageSize;
    offset += pageSize;
  }

  return allResults;
}

// ============================================
// Phase 2 count helper
// ============================================

export async function countEnrichmentPending(runId: string): Promise<number> {
  const { count, error } = await supabase
    .from('connection_ranking_results')
    .select('id', { count: 'exact', head: true })
    .eq('run_id', runId)
    .eq('needs_enrichment', true)
    .eq('enrichment_status', 'pending');

  if (error) throw new Error(error.message);
  return count || 0;
}
