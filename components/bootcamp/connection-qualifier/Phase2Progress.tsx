import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Pause, Play, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import type { RankingRun } from '../../../types/connection-qualifier-types';
import {
  fetchRankingRun,
  fetchPendingEnrichments,
  markEnrichmentProcessing,
  updateEnrichmentResult,
  updateEnrichmentFailed,
  updateRunPhase2Progress,
  updateRunStatus,
  finalizeRanking,
} from '../../../services/connection-ranker-supabase';

interface Phase2ProgressProps {
  run: RankingRun;
  onComplete: (updatedRun: RankingRun) => void;
  onPause: () => void;
}

const BATCH_SIZE = 10;
// Gemini Flash Lite with grounding: ~$0.0012 per call
const COST_PER_CALL_CENTS = 0.12;

export default function Phase2Progress({ run, onComplete, onPause }: Phase2ProgressProps) {
  // Use refs for counters to avoid stale closures in the processing loop
  const processedRef = useRef(run.phase2Processed);
  const geminiCallsRef = useRef(run.geminiCalls);

  // State for UI rendering
  const [processed, setProcessed] = useState(run.phase2Processed);
  const [total] = useState(run.phase2Total);
  const [geminiCalls, setGeminiCalls] = useState(run.geminiCalls);
  const [costCents, setCostCents] = useState(run.estimatedCostCents);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pauseRef = useRef(false);
  const runningRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
  const remainingCalls = total - processed;
  const estMinutesRemaining = Math.round((remainingCalls * 2.5) / 60);

  const processBatch = async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      while (!pauseRef.current) {
        const pending = await fetchPendingEnrichments(run.id, BATCH_SIZE);
        if (pending.length === 0) break;

        await markEnrichmentProcessing(pending.map((p) => p.id));

        for (const conn of pending) {
          if (pauseRef.current) break;

          try {
            const { data, error: fnError } = await supabase.functions.invoke(
              'rank-connections-enrich',
              {
                body: {
                  connections: [
                    {
                      id: conn.id,
                      firstName: conn.firstName,
                      lastName: conn.lastName,
                      company: conn.company,
                      position: conn.position,
                      deterministicScore: conn.deterministicScore,
                    },
                  ],
                  criteria: run.criteria,
                },
              }
            );

            if (fnError) throw fnError;

            const result = data?.results?.[0];
            if (result && !result.error) {
              await updateEnrichmentResult(
                conn.id,
                result.groundingData || {},
                result.totalAiScore || 0,
                result.reasoning || '',
                result.geography || '',
                result.industry || '',
                result.companySize || ''
              );
            } else {
              await updateEnrichmentFailed(conn.id, result?.error || 'No result returned');
            }
          } catch (err) {
            console.error(`Enrichment failed for ${conn.id}:`, err);
            await updateEnrichmentFailed(conn.id, String(err));
          }

          // Increment refs (source of truth) and sync to state
          processedRef.current += 1;
          geminiCallsRef.current += 1;
          const newCost = Math.round(geminiCallsRef.current * COST_PER_CALL_CENTS);

          setProcessed(processedRef.current);
          setGeminiCalls(geminiCallsRef.current);
          setCostCents(newCost);

          // Persist progress to DB
          await updateRunPhase2Progress(
            run.id,
            processedRef.current,
            geminiCallsRef.current,
            newCost
          );
        }
      }

      // Check if all done
      if (!pauseRef.current) {
        setIsFinalizing(true);
        await updateRunStatus(run.id, 'phase2_complete', {
          phase2_completed_at: new Date().toISOString(),
        });
        await finalizeRanking(run.id);
        await updateRunStatus(run.id, 'completed', { completed_at: new Date().toISOString() });

        const updatedRun = await fetchRankingRun(run.id);
        setIsComplete(true);
        setIsFinalizing(false);
        if (updatedRun) onCompleteRef.current(updatedRun);
      }
    } catch (err) {
      console.error('Phase 2 error:', err);
      setError(String(err));
    } finally {
      runningRef.current = false;
    }
  };

  useEffect(() => {
    processBatch();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePause = () => {
    pauseRef.current = true;
    setIsPaused(true);
    updateRunStatus(run.id, 'paused');
    onPause();
  };

  const handleResume = () => {
    pauseRef.current = false;
    setIsPaused(false);
    updateRunStatus(run.id, 'phase2_running');
    processBatch();
  };

  if (isComplete) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Phase 2 Complete — Finalizing Rankings
          </h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enriched {processed.toLocaleString()} connections. Loading results...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {isFinalizing ? (
          <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
        ) : (
          <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
        )}
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {isFinalizing ? 'Finalizing Rankings...' : 'Phase 2: Web Enrichment'}
        </h2>
      </div>

      {!isFinalizing && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enriching gray zone connections with Gemini + Google Search grounding. You can pause and
          resume at any time.
        </p>
      )}

      {/* Progress bar */}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
          <p className="text-lg font-bold text-zinc-900 dark:text-white">
            {geminiCalls.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">API Calls</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
          <p className="text-lg font-bold text-zinc-900 dark:text-white">
            ${(costCents / 100).toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Cost</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
          <p className="text-lg font-bold text-zinc-900 dark:text-white">~{estMinutesRemaining}m</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Remaining</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Pause/Resume */}
      {!isFinalizing && (
        <div className="flex items-center gap-3">
          {isPaused ? (
            <button
              onClick={handleResume}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            You can close this page and come back — progress is saved.
          </p>
        </div>
      )}
    </div>
  );
}
