/**
 * Deterministic Scoring Algorithm for Aggressive Connection Ranking
 *
 * Phase 1: Client-side scoring of LinkedIn connections
 * - Title scoring (0-40 pts, can go negative)
 * - Company scoring (0-10 pts, can go negative)
 * - Recency scoring (0-10 pts)
 * - Protected category detection (film/music)
 */

import type {
  LinkedInConnection,
  QualificationCriteria,
  ProtectedKeywords,
  DeterministicScoreBreakdown,
  RankingTier,
} from '../../../types/connection-qualifier-types';

// ============================================
// Title Scoring (0-40 pts, can go negative)
// ============================================

const TITLE_SCORES: Array<{ score: number; patterns: RegExp[] }> = [
  // Negative signals first (checked before positives)
  {
    score: -40,
    patterns: [
      /\bstudent\b/i,
      /\bintern\b/i,
      /\bseeking\b/i,
      /\bretired\b/i,
      /\bunemployed\b/i,
      /\blooking for/i,
    ],
  },
  {
    score: -20,
    patterns: [
      /\brecruiter\b/i,
      /\btalent acquisition\b/i,
      /\bhuman resources\b/i,
      /\b(?:^|\s)hr\b/i,
    ],
  },
  // Positive signals (highest first)
  {
    score: 40,
    patterns: [
      /\bfounder\b/i,
      /\bceo\b/i,
      /\bowner\b/i,
      /\bco-?founder\b/i,
      /\bchief executive\b/i,
    ],
  },
  {
    score: 35,
    patterns: [
      /\bcmo\b/i,
      /\bcro\b/i,
      /\bcto\b/i,
      /\bcoo\b/i,
      /\bcfo\b/i,
      /\bchief\s+\w+\s+officer\b/i,
    ],
  },
  {
    score: 30,
    patterns: [/\bvp\b/i, /\bvice president\b/i, /\bsvp\b/i, /\bevp\b/i, /\bhead of\b/i],
  },
  {
    score: 25,
    patterns: [/\bdirector\b/i],
  },
  {
    score: 20,
    patterns: [/\bmanager\b/i, /\blead\b/i, /\bprincipal\b/i],
  },
  {
    score: 15,
    patterns: [/\bsenior\b/i, /\bsr\.\b/i],
  },
  {
    score: 10,
    patterns: [/\bconsultant\b/i, /\badvisor\b/i, /\bstrategist\b/i, /\bpartner\b/i],
  },
  {
    score: 5,
    patterns: [/\bspecialist\b/i, /\bcoordinator\b/i, /\bassociate\b/i, /\banalyst\b/i],
  },
];

function computeTitleScore(position: string): number {
  if (!position || !position.trim()) return 0;

  for (const tier of TITLE_SCORES) {
    for (const pattern of tier.patterns) {
      if (pattern.test(position)) {
        return tier.score;
      }
    }
  }
  return 0;
}

// ============================================
// Company Scoring (0-10 pts, can go negative)
// ============================================

const B2B_SIGNALS =
  /\b(software|tech|platform|ai|saas|cloud|digital|analytics|automation|data|cyber|fintech|martech|adtech|devops|infra)\b/i;
const SELF_EMPLOYED = /\b(self[- ]employed|freelanc|independent|solopreneur|self employed)\b/i;
const UNIVERSITY = /\b(university|college|school|institute|academia|student)\b/i;

function computeCompanyScore(company: string, targetIndustries: string[]): number {
  if (!company || company.trim().length <= 3) return 0;

  // Check for university/school
  if (UNIVERSITY.test(company)) return -5;

  // Check for self-employed
  if (SELF_EMPLOYED.test(company)) return 0;

  // Check ICP industry match
  const companyLower = company.toLowerCase();
  for (const industry of targetIndustries) {
    if (industry && companyLower.includes(industry.toLowerCase())) {
      return 10;
    }
  }

  // Check B2B/tech signals
  if (B2B_SIGNALS.test(company)) return 8;

  // Has a real company name
  return 5;
}

// ============================================
// Recency Scoring (0-10 pts)
// ============================================

function computeRecencyScore(connectedOn: string): number {
  if (!connectedOn) return 0;

  const connected = new Date(connectedOn);
  if (isNaN(connected.getTime())) return 0;

  const now = new Date();
  const monthsAgo = (now.getTime() - connected.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsAgo < 6) return 10;
  if (monthsAgo < 12) return 8;
  if (monthsAgo < 24) return 5;
  if (monthsAgo < 36) return 3;
  if (monthsAgo < 60) return 1;
  return 0;
}

// ============================================
// Protected Detection
// ============================================

function detectProtected(
  position: string,
  company: string,
  keywords: ProtectedKeywords
): { isProtected: boolean; reason: string | null } {
  const combined = `${position} ${company}`.toLowerCase();
  const allKeywords = [
    ...keywords.film.map((k) => ({ keyword: k, category: 'film/TV' })),
    ...keywords.music.map((k) => ({ keyword: k, category: 'music' })),
  ];

  for (const { keyword, category } of allKeywords) {
    if (combined.includes(keyword.toLowerCase())) {
      return { isProtected: true, reason: `${category}: "${keyword}"` };
    }
  }

  return { isProtected: false, reason: null };
}

// ============================================
// Phase 2 Threshold
// ============================================

function needsEnrichment(deterministicScore: number, isProtected: boolean): boolean {
  if (isProtected) return false;
  if (deterministicScore >= 56) return false; // clearly qualified
  if (deterministicScore <= 14) return false; // clearly unqualified
  return true; // gray zone: 15-55
}

// ============================================
// Tier Assignment
// ============================================

function assignTier(totalScore: number, isProtected: boolean): RankingTier {
  if (isProtected) return 'protected';
  if (totalScore >= 70) return 'definite_keep';
  if (totalScore >= 50) return 'strong_keep';
  if (totalScore >= 30) return 'borderline';
  if (totalScore >= 10) return 'likely_remove';
  return 'definite_remove';
}

// ============================================
// Main Export
// ============================================

export function computeDeterministicScore(
  connection: LinkedInConnection,
  criteria: QualificationCriteria,
  protectedKeywords: ProtectedKeywords
): DeterministicScoreBreakdown {
  const titleScore = computeTitleScore(connection.position);
  const companyScore = computeCompanyScore(connection.company, criteria.targetIndustries);
  const recencyScore = computeRecencyScore(connection.connectedOn);

  // Clamp deterministic total to 0-60
  const rawTotal = titleScore + companyScore + recencyScore;
  const total = Math.max(0, Math.min(60, rawTotal));

  const protection = detectProtected(connection.position, connection.company, protectedKeywords);

  return {
    titleScore,
    companyScore,
    recencyScore,
    total,
    isProtected: protection.isProtected,
    protectedReason: protection.reason,
    needsEnrichment: needsEnrichment(total, protection.isProtected),
  };
}

export { assignTier, needsEnrichment, detectProtected };
