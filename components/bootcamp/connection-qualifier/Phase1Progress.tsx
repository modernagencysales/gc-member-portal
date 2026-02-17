import React from 'react';
import { Loader2 } from 'lucide-react';
import { TIER_CONFIG } from '../../../types/connection-qualifier-types';
import type { RankingTier } from '../../../types/connection-qualifier-types';

interface Phase1ProgressProps {
  processed: number;
  total: number;
  tierCounts: Record<RankingTier, number>;
}

export default function Phase1Progress({ processed, total, tierCounts }: Phase1ProgressProps) {
  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;

  const tiers: RankingTier[] = [
    'protected',
    'definite_keep',
    'strong_keep',
    'borderline',
    'likely_remove',
    'definite_remove',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Phase 1: Deterministic Scoring
        </h2>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Scoring {total.toLocaleString()} connections by title, company, and recency...
      </p>

      <div>
        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
          <span>
            {processed.toLocaleString()} of {total.toLocaleString()}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Live tier distribution */}
      {processed > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Tier Distribution (so far)
          </h3>
          <div className="space-y-2">
            {tiers.map((tier) => {
              const count = tierCounts[tier] || 0;
              const pct = processed > 0 ? Math.round((count / processed) * 100) : 0;
              const config = TIER_CONFIG[tier];
              return (
                <div key={tier} className="flex items-center gap-3">
                  <span className={`text-xs font-medium w-28 ${config.textColor}`}>
                    {config.label}
                  </span>
                  <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: config.color }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16 text-right">
                    {count.toLocaleString()} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
