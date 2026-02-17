import React, { useState, useEffect } from 'react';
import { Zap, SkipForward, ArrowLeft } from 'lucide-react';
import { TIER_CONFIG } from '../../../types/connection-qualifier-types';
import type {
  RankingRun,
  RankedConnection,
  RankingTier,
} from '../../../types/connection-qualifier-types';
import { fetchRankingResults } from '../../../services/connection-ranker-supabase';

interface Phase1ReviewProps {
  run: RankingRun;
  onStartPhase2: () => void;
  onSkipPhase2: () => void;
  onAdjustCriteria: () => void;
}

export default function Phase1Review({
  run,
  onStartPhase2,
  onSkipPhase2,
  onAdjustCriteria,
}: Phase1ReviewProps) {
  const [samples, setSamples] = useState<Record<string, RankedConnection[]>>({});

  const tiers: RankingTier[] = [
    'protected',
    'definite_keep',
    'strong_keep',
    'borderline',
    'likely_remove',
    'definite_remove',
  ];

  const tierData = [
    { tier: 'protected' as RankingTier, count: run.tierProtected },
    { tier: 'definite_keep' as RankingTier, count: run.tierDefiniteKeep },
    { tier: 'strong_keep' as RankingTier, count: run.tierStrongKeep },
    { tier: 'borderline' as RankingTier, count: run.tierBorderline },
    { tier: 'likely_remove' as RankingTier, count: run.tierLikelyRemove },
    { tier: 'definite_remove' as RankingTier, count: run.tierDefiniteRemove },
  ];

  const grayZoneCount = run.phase2Total;
  // ~$0.0012 per Gemini Flash Lite call with grounding
  const estimatedCostCents = Math.round(grayZoneCount * 0.12);

  useEffect(() => {
    // Load 3 samples from each tier
    async function loadSamples() {
      const s: Record<string, RankedConnection[]> = {};
      for (const tier of tiers) {
        try {
          const { results } = await fetchRankingResults(run.id, { tier, limit: 3 });
          s[tier] = results;
        } catch {
          s[tier] = [];
        }
      }
      setSamples(s);
    }
    loadSamples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id]);

  const maxCount = Math.max(...tierData.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Phase 1 Complete — Review Results
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {run.totalConnections.toLocaleString()} connections scored deterministically.
        </p>
      </div>

      {/* Tier Distribution Bar Chart */}
      <div className="space-y-2">
        {tierData.map(({ tier, count }) => {
          const config = TIER_CONFIG[tier];
          const pct = Math.max(1, Math.round((count / maxCount) * 100));
          return (
            <div key={tier}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {count.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-6 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center px-2 transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: config.color }}
                >
                  {count > 0 && (
                    <span className="text-[10px] font-medium text-white truncate">
                      {Math.round((count / run.totalConnections) * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Samples */}
              {samples[tier] && samples[tier].length > 0 && (
                <div className="mt-1 mb-2 ml-2 space-y-0.5">
                  {samples[tier].map((s) => (
                    <p key={s.id} className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                      {s.firstName} {s.lastName} — {s.position || 'No title'} at{' '}
                      {s.company || 'Unknown'} (score: {s.deterministicScore})
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Phase 2 Info */}
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Phase 2: Web Enrichment
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {grayZoneCount.toLocaleString()} connections in the gray zone (score 15-55) can be
              enriched with Gemini + Google Search grounding for geography, industry, and seniority
              data.
            </p>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mt-2">
              Estimated cost: ~${(estimatedCostCents / 100).toFixed(2)}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              ~{Math.round((grayZoneCount * 2.5) / 60)} minutes estimated processing time. You can
              pause and resume.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onStartPhase2}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Start Phase 2 ({grayZoneCount.toLocaleString()} connections)
        </button>
        <button
          onClick={onSkipPhase2}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Skip Phase 2 (deterministic only)
        </button>
        <button
          onClick={onAdjustCriteria}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Adjust Criteria
        </button>
      </div>
    </div>
  );
}
