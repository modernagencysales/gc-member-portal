/**
 * EmailEnrichmentPage.tsx
 * Email Enrichment wizard — step router and chrome (header, step indicator, past-runs panel).
 * Delegates all state to useEnrichmentPageState; each step is its own component.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useEnrichmentPageState } from '../../../hooks/useEnrichmentPageState';
import type { BatchRun } from '../../../services/enrichment-batch-supabase';
import type { EnrichmentStep } from './enrichment-types';
import EnrichmentUploadStep from './EnrichmentUploadStep';
import EnrichmentMapStep from './EnrichmentMapStep';
import EnrichmentProcessingStep from './EnrichmentProcessingStep';
import EnrichmentResultsStep from './EnrichmentResultsStep';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_LABELS: Record<EnrichmentStep, string> = {
  upload: 'Upload',
  map: 'Map Columns',
  processing: 'Processing',
  results: 'Results',
};

const STEPS: EnrichmentStep[] = ['upload', 'map', 'processing', 'results'];

// ─── Component ────────────────────────────────────────────────────────────────

const EmailEnrichmentPage: React.FC<Props> = ({ userId }) => {
  const state = useEnrichmentPageState(userId);

  const {
    step,
    csvHeaders,
    csvRows,
    columnMap,
    fileName,
    uploadError,
    results,
    pastRuns,
    showPastRuns,
    isSubmitting,
    isMapValid,
    enrichment,
    setColumnMap,
    setShowPastRuns,
    handleDrop,
    handleFileInput,
    handleStartEnrichment,
    handleShowPastRuns,
    handleViewRun,
    handleDownload,
    handleReset,
  } = state;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Email Enrichment</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Upload a CSV with contacts and find their verified work emails
          </p>
        </div>
        <div className="flex gap-2">
          {step !== 'upload' && step !== 'processing' && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              New Upload
            </button>
          )}
          {step === 'upload' && (
            <button
              onClick={handleShowPastRuns}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Past Runs
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <ChevronRight size={12} className="text-zinc-300" />}
            <span
              className={`px-2 py-1 rounded ${
                s === step
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                  : s < step || (step === 'results' && s !== 'results')
                    ? 'text-zinc-400'
                    : 'text-zinc-300'
              }`}
            >
              {i + 1}. {STEP_LABELS[s]}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Past Runs panel */}
      {showPastRuns && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Past Enrichment Runs
            </h3>
            <button
              onClick={() => setShowPastRuns(false)}
              className="text-xs text-zinc-500 hover:text-zinc-700"
            >
              Close
            </button>
          </div>
          {pastRuns.length === 0 ? (
            <p className="text-xs text-zinc-500">No past runs found</p>
          ) : (
            <div className="space-y-2">
              {pastRuns.map((run: BatchRun) => (
                <button
                  key={run.id}
                  onClick={() => handleViewRun(run)}
                  className="w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {run.name || 'Untitled'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        run.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : run.status === 'running'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {run.totalContacts} contacts, {run.emailsFound} emails found &middot;{' '}
                    {new Date(run.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step router */}
      {step === 'upload' && !showPastRuns && (
        <EnrichmentUploadStep
          uploadError={uploadError}
          onDrop={handleDrop}
          onFileInput={handleFileInput}
        />
      )}

      {step === 'map' && (
        <EnrichmentMapStep
          fileName={fileName}
          csvRows={csvRows}
          csvHeaders={csvHeaders}
          columnMap={columnMap}
          isMapValid={isMapValid}
          isSubmitting={isSubmitting}
          onColumnMapChange={setColumnMap}
          onBack={handleReset}
          onStartEnrichment={handleStartEnrichment}
        />
      )}

      {step === 'processing' && (
        <EnrichmentProcessingStep
          progress={enrichment.progress}
          stats={enrichment.stats}
          error={enrichment.error}
        />
      )}

      {step === 'results' && (
        <EnrichmentResultsStep results={results} onDownload={handleDownload} />
      )}
    </div>
  );
};

export default EmailEnrichmentPage;
