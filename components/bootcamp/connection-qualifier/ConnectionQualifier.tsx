import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { fetchMemberICP } from '../../../services/supabase';
import CsvUploader from './CsvUploader';
import QualificationCriteria from './QualificationCriteria';
import ProcessingProgress from './ProcessingProgress';
import QualificationResults from './QualificationResults';
import ModeSelector from './ModeSelector';
import AggressiveRankerCriteria from './AggressiveRankerCriteria';
import Phase1Progress from './Phase1Progress';
import Phase1Review from './Phase1Review';
import Phase2Progress from './Phase2Progress';
import RankingResults from './RankingResults';
import RunHistory from './RunHistory';
import { preFilterConnections } from './preFilter';
import { computeDeterministicScore, assignTier } from './scoring';
import {
  createRankingRun,
  insertRankingResults,
  updateRunStatus,
  updateRunPhase1Progress,
  fetchRankingRun,
  finalizeRanking,
  countEnrichmentPending,
} from '../../../services/connection-ranker-supabase';
import type {
  LinkedInConnection,
  QualificationCriteria as CriteriaType,
  QualifiedConnection,
  QualifierStep,
  QualificationResult,
  QualifierMode,
  AggressiveRankerStep,
  ProtectedKeywords,
  RankingRun,
  RankingTier,
} from '../../../types/connection-qualifier-types';
import type { MemberICP } from '../../../types/gc-types';
import { Filter } from 'lucide-react';

const BATCH_SIZE = 50;

interface ConnectionQualifierProps {
  userId: string;
}

export default function ConnectionQualifier({ userId }: ConnectionQualifierProps) {
  // Mode selection
  const [mode, setMode] = useState<QualifierMode | null>(null);

  // Standard mode state
  const [step, setStep] = useState<QualifierStep>('upload');
  const [connections, setConnections] = useState<LinkedInConnection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<LinkedInConnection[]>([]);
  const [criteria, setCriteria] = useState<CriteriaType | null>(null);
  const [savedIcp, setSavedIcp] = useState<MemberICP | null>(null);
  const [results, setResults] = useState<QualifiedConnection[]>([]);

  // Standard progress tracking
  const [completedBatches, setCompletedBatches] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [qualifiedSoFar, setQualifiedSoFar] = useState(0);
  const [processedSoFar, setProcessedSoFar] = useState(0);

  // Aggressive mode state
  const [aggressiveStep, setAggressiveStep] = useState<AggressiveRankerStep>('upload');
  const [rankingRun, setRankingRun] = useState<RankingRun | null>(null);
  const [phase1TierCounts, setPhase1TierCounts] = useState<Record<RankingTier, number>>({
    definite_keep: 0,
    strong_keep: 0,
    borderline: 0,
    likely_remove: 0,
    definite_remove: 0,
    protected: 0,
  });
  const [phase1Processed, setPhase1Processed] = useState(0);

  // Load saved ICP on mount
  useEffect(() => {
    if (userId) {
      fetchMemberICP(userId).then((icp) => {
        if (icp) setSavedIcp(icp);
      });
    }
  }, [userId]);

  // ============================================
  // Standard Mode Handlers
  // ============================================

  const handleParsed = useCallback(
    (parsed: LinkedInConnection[]) => {
      setConnections(parsed);
      if (mode === 'standard') {
        setStep('criteria');
      } else if (mode === 'aggressive') {
        setAggressiveStep('criteria');
      }
    },
    [mode]
  );

  const handleCriteriaSubmit = useCallback(
    (c: CriteriaType) => {
      setCriteria(c);
      const filtered = preFilterConnections(connections, c);
      setFilteredConnections(filtered);
      setStep('preview');
    },
    [connections]
  );

  const handleRunQualification = useCallback(async () => {
    if (!criteria || filteredConnections.length === 0) return;

    setStep('processing');

    const batches: LinkedInConnection[][] = [];
    for (let i = 0; i < filteredConnections.length; i += BATCH_SIZE) {
      batches.push(filteredConnections.slice(i, i + BATCH_SIZE));
    }

    setTotalBatches(batches.length);
    setCompletedBatches(0);
    setQualifiedSoFar(0);
    setProcessedSoFar(0);

    const allResults: QualifiedConnection[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        const { data, error: fnError } = await supabase.functions.invoke('qualify-connections', {
          body: {
            connections: batch.map((c) => ({
              firstName: c.firstName,
              lastName: c.lastName,
              company: c.company,
              position: c.position,
            })),
            criteria: {
              targetTitles: criteria.targetTitles,
              targetIndustries: criteria.targetIndustries,
              freeTextDescription: criteria.freeTextDescription,
            },
          },
        });

        if (fnError) throw fnError;

        const batchResults: QualificationResult[] = data.results || [];

        batch.forEach((conn, idx) => {
          const result = batchResults[idx];
          allResults.push({
            ...conn,
            qualification: result?.qualification || 'not_qualified',
            confidence: result?.confidence || 'low',
            reasoning: result?.reasoning || 'No result returned',
          });
        });

        const newQualified = batchResults.filter(
          (r: QualificationResult) => r?.qualification === 'qualified'
        ).length;
        setCompletedBatches(i + 1);
        setProcessedSoFar((prev) => prev + batch.length);
        setQualifiedSoFar((prev) => prev + newQualified);
      } catch (err) {
        console.error(`Batch ${i + 1} failed:`, err);
        batch.forEach((conn) => {
          allResults.push({
            ...conn,
            qualification: 'not_qualified',
            confidence: 'low',
            reasoning: 'Batch processing failed — retry recommended',
          });
        });
        setCompletedBatches(i + 1);
        setProcessedSoFar((prev) => prev + batch.length);
      }
    }

    setResults(allResults);
    setStep('results');
  }, [criteria, filteredConnections]);

  // ============================================
  // Aggressive Mode Handlers
  // ============================================

  const handleAggressiveCriteriaSubmit = useCallback(
    async (c: CriteriaType, protectedKeywords: ProtectedKeywords, runName: string) => {
      let run: RankingRun | null = null;
      try {
        // Create the run in DB
        run = await createRankingRun(userId, runName, c, protectedKeywords);
        setRankingRun(run);
        setCriteria(c);
        setAggressiveStep('phase1');

        // Start Phase 1: deterministic scoring
        await updateRunStatus(run.id, 'phase1_running');

        const tierCounts: Record<RankingTier, number> = {
          definite_keep: 0,
          strong_keep: 0,
          borderline: 0,
          likely_remove: 0,
          definite_remove: 0,
          protected: 0,
        };

        // Process in chunks of 500 for DB insertion
        const CHUNK_SIZE = 500;
        let processed = 0;

        for (let i = 0; i < connections.length; i += CHUNK_SIZE) {
          const chunk = connections.slice(i, i + CHUNK_SIZE);

          const scored = chunk.map((conn) => {
            const score = computeDeterministicScore(conn, c, protectedKeywords);
            const tier = assignTier(score.total, score.isProtected);
            tierCounts[tier]++;
            return { connection: conn, ...score };
          });

          await insertRankingResults(run.id, scored);

          processed += chunk.length;
          setPhase1Processed(processed);
          setPhase1TierCounts({ ...tierCounts });

          // Update progress in DB every chunk
          await updateRunPhase1Progress(run.id, processed);
        }

        // Count gray zone for phase 2
        const grayZoneCount = await countEnrichmentPending(run.id);

        // Update run status (total_connections set here, not per-chunk)
        await updateRunStatus(run.id, 'phase1_complete', {
          total_connections: connections.length,
          phase1_completed_at: new Date().toISOString(),
          phase2_total: grayZoneCount,
          tier_definite_keep: tierCounts.definite_keep,
          tier_strong_keep: tierCounts.strong_keep,
          tier_borderline: tierCounts.borderline,
          tier_likely_remove: tierCounts.likely_remove,
          tier_definite_remove: tierCounts.definite_remove,
          tier_protected: tierCounts.protected,
        });

        // Refresh run from DB
        const updatedRun = await fetchRankingRun(run.id);
        if (updatedRun) setRankingRun(updatedRun);

        setAggressiveStep('phase1_review');
      } catch (err) {
        console.error('Phase 1 failed:', err);
        if (run) {
          await updateRunStatus(run.id, 'failed').catch(() => {});
        }
      }
    },
    [userId, connections]
  );

  const handleStartPhase2 = useCallback(async () => {
    if (!rankingRun) return;
    await updateRunStatus(rankingRun.id, 'phase2_running');
    const updatedRun = await fetchRankingRun(rankingRun.id);
    if (updatedRun) setRankingRun(updatedRun);
    setAggressiveStep('phase2');
  }, [rankingRun]);

  const handleSkipPhase2 = useCallback(async () => {
    if (!rankingRun) return;
    // Finalize ranking (assign rank positions + recount tiers) via fast RPC
    await finalizeRanking(rankingRun.id);
    await updateRunStatus(rankingRun.id, 'completed', {
      completed_at: new Date().toISOString(),
    });
    const updatedRun = await fetchRankingRun(rankingRun.id);
    if (updatedRun) setRankingRun(updatedRun);
    setAggressiveStep('results');
  }, [rankingRun]);

  const handlePhase2Complete = useCallback((updatedRun: RankingRun) => {
    setRankingRun(updatedRun);
    setAggressiveStep('results');
  }, []);

  const handlePhase2Pause = useCallback(() => {
    // Stay on phase2 step — the component handles pause UI
  }, []);

  const handleResumeRun = useCallback((run: RankingRun) => {
    setRankingRun(run);
    setMode('aggressive');

    if (run.status === 'completed' || run.status === 'phase2_complete') {
      setAggressiveStep('results');
    } else if (run.status === 'phase1_complete') {
      setAggressiveStep('phase1_review');
    } else if (run.status === 'phase2_running' || run.status === 'paused') {
      setAggressiveStep('phase2');
    } else {
      setAggressiveStep('results');
    }
  }, []);

  // ============================================
  // Reset
  // ============================================

  const handleStartOver = useCallback(() => {
    setMode(null);
    setStep('upload');
    setAggressiveStep('upload');
    setConnections([]);
    setFilteredConnections([]);
    setCriteria(null);
    setResults([]);
    setRankingRun(null);
    setCompletedBatches(0);
    setTotalBatches(0);
    setQualifiedSoFar(0);
    setProcessedSoFar(0);
    setPhase1Processed(0);
    setPhase1TierCounts({
      definite_keep: 0,
      strong_keep: 0,
      borderline: 0,
      likely_remove: 0,
      definite_remove: 0,
      protected: 0,
    });
  }, []);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Connection Qualifier</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Upload your LinkedIn connections and find the ones worth keeping.
        </p>
      </div>

      {/* Mode Selection */}
      {mode === null && (
        <ModeSelector
          onSelect={setMode}
          onViewHistory={() => {
            setMode('aggressive');
            setAggressiveStep('history');
          }}
        />
      )}

      {/* Standard Mode */}
      {mode === 'standard' && (
        <>
          {step === 'upload' && <CsvUploader onParsed={handleParsed} />}

          {step === 'criteria' && (
            <QualificationCriteria
              savedIcp={savedIcp}
              onSubmit={handleCriteriaSubmit}
              onBack={() => setStep('upload')}
            />
          )}

          {step === 'preview' && criteria && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Pre-filter Summary
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Review the numbers before running AI qualification.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {connections.length.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Connections</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <p className="text-2xl font-bold text-red-500">
                    {(connections.length - filteredConnections.length).toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Pre-filtered Out</p>
                </div>
                <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/10">
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {filteredConnections.length.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Sending to AI</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {Math.ceil(filteredConnections.length / BATCH_SIZE)} batches will be processed.
              </p>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('criteria')}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleRunQualification}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Run Qualification
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <ProcessingProgress
              completedBatches={completedBatches}
              totalBatches={totalBatches}
              qualifiedSoFar={qualifiedSoFar}
              processedSoFar={processedSoFar}
            />
          )}

          {step === 'results' && (
            <QualificationResults
              totalParsed={connections.length}
              preFiltered={filteredConnections.length}
              results={results}
              onStartOver={handleStartOver}
            />
          )}
        </>
      )}

      {/* Aggressive Mode */}
      {mode === 'aggressive' && (
        <>
          {aggressiveStep === 'upload' && <CsvUploader onParsed={handleParsed} />}

          {aggressiveStep === 'criteria' && (
            <AggressiveRankerCriteria
              savedIcp={savedIcp}
              totalConnections={connections.length}
              onSubmit={handleAggressiveCriteriaSubmit}
              onBack={() => setAggressiveStep('upload')}
            />
          )}

          {aggressiveStep === 'phase1' && (
            <Phase1Progress
              processed={phase1Processed}
              total={connections.length}
              tierCounts={phase1TierCounts}
            />
          )}

          {aggressiveStep === 'phase1_review' && rankingRun && (
            <Phase1Review
              run={rankingRun}
              onStartPhase2={handleStartPhase2}
              onSkipPhase2={handleSkipPhase2}
              onAdjustCriteria={() => setAggressiveStep('criteria')}
            />
          )}

          {aggressiveStep === 'phase2' && rankingRun && (
            <Phase2Progress
              run={rankingRun}
              onComplete={handlePhase2Complete}
              onPause={handlePhase2Pause}
            />
          )}

          {aggressiveStep === 'results' && rankingRun && (
            <RankingResults run={rankingRun} onStartOver={handleStartOver} />
          )}

          {aggressiveStep === 'history' && (
            <RunHistory userId={userId} onSelectRun={handleResumeRun} onBack={handleStartOver} />
          )}
        </>
      )}
    </div>
  );
}
