/**
 * MyBlueprint Component
 * Displays the student's personalized Blueprint dashboard within the bootcamp area.
 * Shows authority analysis, score breakdown, recommendations, and action plans.
 */

import React, { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle2,
  AlertTriangle,
  Target,
  ArrowRight,
  ExternalLink,
  Loader2,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  Calendar,
  Pen,
  Mic,
  Link2,
} from 'lucide-react';
import { BootcampStudent } from '../../types/bootcamp-types';
import {
  Prospect,
  getProspectDisplayName,
  PROSPECT_STATUS_LABELS,
} from '../../types/blueprint-types';
import { getProspectById, getProspectByEmail } from '../../services/blueprint-supabase';
import { logError } from '../../lib/logError';

// ============================================
// Types
// ============================================

interface MyBlueprintProps {
  student: BootcampStudent;
}

interface ScoreDataItem {
  axis: string;
  score: number;
  fullMark: number;
}

// ============================================
// Helper: Score color
// ============================================

function scoreColor(score: number, max: number = 10): string {
  const ratio = score / max;
  if (ratio >= 0.7) return 'text-green-500';
  if (ratio >= 0.4) return 'text-yellow-500';
  return 'text-red-500';
}

function scoreBgColor(score: number, max: number = 10): string {
  const ratio = score / max;
  if (ratio >= 0.7) return 'bg-green-500/10 border-green-500/20';
  if (ratio >= 0.4) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function statusBadge(status?: string): { label: string; className: string } {
  if (!status)
    return { label: 'Unknown', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
  if (status === 'complete') {
    return { label: 'Complete', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
  }
  if (status === 'error') {
    return { label: 'Error', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
  }
  const label = PROSPECT_STATUS_LABELS[status as keyof typeof PROSPECT_STATUS_LABELS] || status;
  return { label, className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
}

// ============================================
// MyBlueprint Component
// ============================================

const MyBlueprint: React.FC<MyBlueprintProps> = ({ student }) => {
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBlueprint = async () => {
      setLoading(true);
      setError(null);

      try {
        let data: Prospect | null = null;

        // First try by prospectId if linked
        if (student.prospectId) {
          data = await getProspectById(student.prospectId);
        }

        // Fallback: look up by student email
        if (!data && student.email) {
          data = await getProspectByEmail(student.email);
        }

        if (!cancelled) {
          setProspect(data);
        }
      } catch (err) {
        logError('MyBlueprint:fetchBlueprintData', err);
        if (!cancelled) {
          setError('Failed to load your Blueprint data. Please try again later.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBlueprint();
    return () => {
      cancelled = true;
    };
  }, [student.prospectId, student.email]);

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={32} className="animate-spin text-violet-500" />
        <p className="text-sm text-zinc-400 font-medium">Loading your Blueprint...</p>
      </div>
    );
  }

  // ---------- Error ----------
  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <ShieldAlert size={28} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">Something went wrong</h3>
          <p className="text-sm text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---------- No Blueprint ----------
  if (!prospect) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="w-14 h-14 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Sparkles size={24} className="text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-3">
            You don&apos;t have a Blueprint yet
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-md mx-auto">
            Get your free LinkedIn Authority Blueprint to unlock personalized insights, authority
            score analysis, and tailored recommendations for your profile.
          </p>
          <a
            href="/blueprint"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm rounded-lg transition-colors"
          >
            Get Your Free Blueprint
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  // ---------- Blueprint exists - render dashboard ----------
  const displayName = getProspectDisplayName(prospect);
  const badge = statusBadge(prospect.status);

  // Score data
  const radarData: ScoreDataItem[] = [
    { axis: 'Profile', score: prospect.scoreProfileOptimization ?? 0, fullMark: 10 },
    { axis: 'Content', score: prospect.scoreContentPresence ?? 0, fullMark: 10 },
    { axis: 'Outbound', score: prospect.scoreOutboundSystems ?? 0, fullMark: 10 },
    { axis: 'Inbound', score: prospect.scoreInboundInfrastructure ?? 0, fullMark: 10 },
    { axis: 'Social Proof', score: prospect.scoreSocialProof ?? 0, fullMark: 10 },
  ];

  const scoreItems = [
    { label: 'Profile Optimization', score: prospect.scoreProfileOptimization ?? 0 },
    { label: 'Content Presence', score: prospect.scoreContentPresence ?? 0 },
    { label: 'Outbound Systems', score: prospect.scoreOutboundSystems ?? 0 },
    { label: 'Inbound Infrastructure', score: prospect.scoreInboundInfrastructure ?? 0 },
    { label: 'Social Proof', score: prospect.scoreSocialProof ?? 0 },
  ];

  // What's working
  const whatsWorking = [
    prospect.whatsWorking1,
    prospect.whatsWorking2,
    prospect.whatsWorking3,
  ].filter(Boolean) as string[];

  // Revenue leaks
  const revenueLeaks = [
    prospect.revenueLeaks1,
    prospect.revenueLeaks2,
    prospect.revenueLeaks3,
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ========== HERO CARD ========== */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Authority Score */}
          <div className="flex-shrink-0">
            <div
              className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center ${scoreBgColor(prospect.authorityScore ?? 0, 100)}`}
            >
              <span
                className={`text-3xl font-bold ${scoreColor(prospect.authorityScore ?? 0, 100)}`}
              >
                {prospect.authorityScore ?? '—'}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mt-0.5">
                /100
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-xl font-bold text-zinc-100 truncate">{displayName}</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>

            {prospect.currentHeadline && (
              <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{prospect.currentHeadline}</p>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              {prospect.linkedinUrl && (
                <a
                  href={prospect.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Link2 size={12} />
                  LinkedIn Profile
                </a>
              )}
              {prospect.company && (
                <span className="text-xs text-zinc-500">{prospect.company}</span>
              )}
            </div>
          </div>

          {/* Score Summary */}
          {prospect.scoreSummary && (
            <div className="md:max-w-xs">
              <p className="text-xs text-zinc-400 leading-relaxed">{prospect.scoreSummary}</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== SCORE BREAKDOWN ========== */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">Score Breakdown</h3>
        <p className="text-sm text-zinc-400 mb-6">
          Your authority across 5 key dimensions of LinkedIn presence.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#3f3f46" strokeOpacity={0.6} />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  tickCount={6}
                  stroke="#3f3f46"
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="rgb(139, 92, 246)"
                  fill="rgb(139, 92, 246)"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score List */}
          <div className="space-y-3">
            {scoreItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3"
              >
                <span className="text-sm text-zinc-300">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.score >= 7
                          ? 'bg-green-500'
                          : item.score >= 4
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${(item.score / 10) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-6 text-right ${scoreColor(item.score)}`}>
                    {item.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== WHAT'S WORKING ========== */}
      {whatsWorking.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-500" />
            What&apos;s Working
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {whatsWorking.map((item, i) => (
              <div key={i} className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={14} className="text-green-400" />
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== REVENUE LEAKS ========== */}
      {revenueLeaks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Revenue Leaks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {revenueLeaks.map((item, i) => (
              <div key={i} className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={14} className="text-amber-400" />
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== STRATEGIC ANALYSIS ========== */}
      {(prospect.buyerPersona ||
        prospect.strategicGap ||
        prospect.strategicOpportunity ||
        prospect.bottomLine) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Target size={18} className="text-violet-400" />
            Strategic Analysis
          </h3>
          <div className="space-y-4">
            {prospect.buyerPersona && (
              <div>
                <h4 className="text-xs font-medium text-violet-400 uppercase tracking-wider mb-1.5">
                  Buyer Persona
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{prospect.buyerPersona}</p>
              </div>
            )}
            {prospect.strategicGap && (
              <div>
                <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1.5">
                  Strategic Gap
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{prospect.strategicGap}</p>
              </div>
            )}
            {prospect.strategicOpportunity && (
              <div>
                <h4 className="text-xs font-medium text-green-400 uppercase tracking-wider mb-1.5">
                  Strategic Opportunity
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {prospect.strategicOpportunity}
                </p>
              </div>
            )}
            {prospect.bottomLine && (
              <div className="border-t border-zinc-800 pt-4">
                <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  Bottom Line
                </h4>
                <p className="text-sm text-zinc-100 leading-relaxed font-medium">
                  {prospect.bottomLine}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== PROFILE RECOMMENDATIONS ========== */}
      {(prospect.currentHeadline || prospect.recommendedHeadline || prospect.voiceStyleGuide) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Pen size={18} className="text-blue-400" />
            Profile Recommendations
          </h3>
          <div className="space-y-4">
            {/* Headline comparison */}
            {(prospect.currentHeadline || prospect.recommendedHeadline) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prospect.currentHeadline && (
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                      Current Headline
                    </h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {prospect.currentHeadline}
                    </p>
                  </div>
                )}
                {prospect.recommendedHeadline && (
                  <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg p-4">
                    <h4 className="text-xs font-medium text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lightbulb size={12} />
                      Recommended Headline
                    </h4>
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {prospect.recommendedHeadline}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Voice Style Guide */}
            {prospect.voiceStyleGuide && (
              <div>
                <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Mic size={12} className="text-zinc-400" />
                  Voice Style Guide
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{prospect.voiceStyleGuide}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== ACTION PLANS ========== */}
      {(prospect.nextSteps30Day || prospect.nextSteps90Day) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-emerald-400" />
            Action Plans
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prospect.nextSteps30Day && (
              <div className="bg-zinc-800/50 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <h4 className="text-sm font-semibold text-zinc-100">30-Day Plan</h4>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {prospect.nextSteps30Day}
                </p>
              </div>
            )}
            {prospect.nextSteps90Day && (
              <div className="bg-zinc-800/50 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} className="text-violet-400" />
                  <h4 className="text-sm font-semibold text-zinc-100">90-Day Plan</h4>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {prospect.nextSteps90Day}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== QUICK LINK ========== */}
      {prospect.slug && (
        <div className="text-center py-4">
          <a
            href={`/blueprint/${prospect.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            View Full Blueprint
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
};

export default MyBlueprint;
