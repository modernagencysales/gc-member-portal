import React, { useState, useEffect } from 'react';
import { History, Trash2, Play, BarChart3, ArrowLeft } from 'lucide-react';
import type { RankingRun, RankingTier } from '../../../types/connection-qualifier-types';
import { TIER_CONFIG } from '../../../types/connection-qualifier-types';
import {
  fetchRankingRunsByUser,
  deleteRankingRun,
} from '../../../services/connection-ranker-supabase';

interface RunHistoryProps {
  userId: string;
  onSelectRun: (run: RankingRun) => void;
  onBack: () => void;
}

function MiniTierBar({ run }: { run: RankingRun }) {
  const total = run.totalConnections || 1;
  const tiers: Array<{ tier: RankingTier; count: number }> = [
    { tier: 'protected', count: run.tierProtected },
    { tier: 'definite_keep', count: run.tierDefiniteKeep },
    { tier: 'strong_keep', count: run.tierStrongKeep },
    { tier: 'borderline', count: run.tierBorderline },
    { tier: 'likely_remove', count: run.tierLikelyRemove },
    { tier: 'definite_remove', count: run.tierDefiniteRemove },
  ];

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
      {tiers.map(({ tier, count }) => {
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <div
            key={tier}
            className="h-full"
            style={{ width: `${pct}%`, backgroundColor: TIER_CONFIG[tier].color }}
            title={`${TIER_CONFIG[tier].label}: ${count.toLocaleString()}`}
          />
        );
      })}
    </div>
  );
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-zinc-500' },
  phase1_running: { label: 'Phase 1 Running', color: 'text-blue-500' },
  phase1_complete: { label: 'Phase 1 Complete', color: 'text-blue-600' },
  phase2_running: { label: 'Phase 2 Running', color: 'text-orange-500' },
  phase2_complete: { label: 'Phase 2 Complete', color: 'text-orange-600' },
  completed: { label: 'Completed', color: 'text-green-600' },
  failed: { label: 'Failed', color: 'text-red-500' },
  paused: { label: 'Paused', color: 'text-amber-500' },
};

export default function RunHistory({ userId, onSelectRun, onBack }: RunHistoryProps) {
  const [runs, setRuns] = useState<RankingRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRankingRunsByUser(userId);
        setRuns(data);
      } catch (err) {
        console.error('Failed to load runs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const handleDelete = async (runId: string) => {
    if (!window.confirm('Delete this ranking run? This cannot be undone.')) return;
    try {
      await deleteRankingRun(runId);
      setRuns((prev) => prev.filter((r) => r.id !== runId));
    } catch (err) {
      console.error('Failed to delete run:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-zinc-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Past Ranking Runs</h2>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>}

      {!loading && runs.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No ranking runs yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {runs.map((run) => {
          const statusInfo = STATUS_LABELS[run.status] || STATUS_LABELS.pending;
          const canResume = ['phase1_complete', 'phase2_running', 'paused', 'completed'].includes(
            run.status
          );

          return (
            <div
              key={run.id}
              className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-white">
                    {run.name || 'Untitled Run'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {new Date(run.createdAt).toLocaleDateString()} —{' '}
                    {run.totalConnections.toLocaleString()} connections
                  </p>
                </div>
                <span className={`text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              {run.totalConnections > 0 && <MiniTierBar run={run} />}

              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                  {run.geminiCalls > 0 &&
                    `${run.geminiCalls} API calls · $${(run.estimatedCostCents / 100).toFixed(2)}`}
                </div>
                <div className="flex items-center gap-2">
                  {canResume && (
                    <button
                      onClick={() => onSelectRun(run)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      {run.status === 'completed' ? 'View' : 'Resume'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(run.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                    title="Delete run"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
