export interface LinkedInConnection {
  firstName: string;
  lastName: string;
  url: string;
  emailAddress: string;
  company: string;
  position: string;
  connectedOn: string;
}

export interface QualificationCriteria {
  targetTitles: string[];
  targetIndustries: string[];
  excludeTitles: string[];
  excludeCompanies: string[];
  connectedAfter: string | null;
  freeTextDescription: string;
}

export interface QualificationResult {
  qualification: 'qualified' | 'not_qualified';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface QualifiedConnection extends LinkedInConnection {
  qualification: string;
  confidence: string;
  reasoning: string;
}

export type QualifierStep = 'upload' | 'criteria' | 'preview' | 'processing' | 'results';

export const DEFAULT_EXCLUDE_TITLES = ['Student', 'Intern', 'Retired', 'Unemployed', 'Seeking'];

export const DEFAULT_EXCLUDE_COMPANIES: string[] = [];

// ============================================
// Aggressive Ranker Types
// ============================================

export type QualifierMode = 'standard' | 'aggressive';

export type AggressiveRankerStep =
  | 'mode_select'
  | 'upload'
  | 'criteria'
  | 'preview'
  | 'phase1'
  | 'phase1_review'
  | 'phase2'
  | 'results'
  | 'history';

export type RankingTier =
  | 'definite_keep'
  | 'strong_keep'
  | 'borderline'
  | 'likely_remove'
  | 'definite_remove'
  | 'protected';

export type RunStatus =
  | 'pending'
  | 'phase1_running'
  | 'phase1_complete'
  | 'phase2_running'
  | 'phase2_complete'
  | 'completed'
  | 'failed'
  | 'paused';

export type EnrichmentStatus = 'pending' | 'skipped' | 'processing' | 'completed' | 'failed';

export interface RankingRun {
  id: string;
  userId: string;
  name: string | null;
  status: RunStatus;
  totalConnections: number;
  phase1Processed: number;
  phase2Total: number;
  phase2Processed: number;
  tierDefiniteKeep: number;
  tierStrongKeep: number;
  tierBorderline: number;
  tierLikelyRemove: number;
  tierDefiniteRemove: number;
  tierProtected: number;
  criteria: QualificationCriteria | null;
  protectedKeywords: ProtectedKeywords | null;
  geminiCalls: number;
  estimatedCostCents: number;
  createdAt: string;
  phase1CompletedAt: string | null;
  phase2CompletedAt: string | null;
  completedAt: string | null;
}

export interface ProtectedKeywords {
  film: string[];
  music: string[];
}

export interface RankedConnection {
  id: string;
  runId: string;
  firstName: string | null;
  lastName: string | null;
  linkedinUrl: string | null;
  emailAddress: string | null;
  company: string | null;
  position: string | null;
  connectedOn: string | null;
  deterministicScore: number;
  titleScore: number;
  companyScore: number;
  recencyScore: number;
  isProtected: boolean;
  protectedReason: string | null;
  needsEnrichment: boolean;
  enrichmentStatus: EnrichmentStatus;
  groundingData: GroundingData | null;
  aiScore: number;
  aiReasoning: string | null;
  aiGeography: string | null;
  aiIndustry: string | null;
  aiCompanySize: string | null;
  totalScore: number;
  tier: RankingTier | null;
  rankPosition: number | null;
  userOverride: 'keep' | 'remove' | null;
  createdAt: string;
}

export interface GroundingData {
  searchQueries?: string[];
  sourceUrls?: string[];
  rawMetadata?: unknown;
}

export interface DeterministicScoreBreakdown {
  titleScore: number;
  companyScore: number;
  recencyScore: number;
  total: number;
  isProtected: boolean;
  protectedReason: string | null;
  needsEnrichment: boolean;
}

export interface AiScoreResult {
  geographyScore: number;
  industryScore: number;
  seniorityScore: number;
  totalAiScore: number;
  geography: string;
  industry: string;
  companySize: string;
  reasoning: string;
}

export interface TierConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  minScore: number;
  maxScore: number;
}

export const TIER_CONFIG: Record<RankingTier, TierConfig> = {
  protected: {
    label: 'Protected',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-300',
    minScore: -Infinity,
    maxScore: Infinity,
  },
  definite_keep: {
    label: 'Definite Keep',
    color: '#059669',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    minScore: 70,
    maxScore: 100,
  },
  strong_keep: {
    label: 'Strong Keep',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
    minScore: 50,
    maxScore: 69,
  },
  borderline: {
    label: 'Borderline',
    color: '#F59E0B',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    minScore: 30,
    maxScore: 49,
  },
  likely_remove: {
    label: 'Likely Remove',
    color: '#F97316',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-300',
    minScore: 10,
    maxScore: 29,
  },
  definite_remove: {
    label: 'Definite Remove',
    color: '#EF4444',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
    minScore: -Infinity,
    maxScore: 9,
  },
};

export const DEFAULT_PROTECTED_KEYWORDS: ProtectedKeywords = {
  film: [
    'film',
    'filmmaker',
    'director',
    'producer',
    'actor',
    'actress',
    'cinematographer',
    'screenwriter',
    'post production',
    'vfx',
    'visual effects',
    'stunt',
    'gaffer',
    'grip',
    'set design',
  ],
  music: [
    'musician',
    'music',
    'band',
    'artist',
    'songwriter',
    'composer',
    'dj',
    'singer',
    'rapper',
    'vocalist',
    'recording',
    'audio engineer',
    'sound engineer',
    'music producer',
    'record label',
  ],
};
