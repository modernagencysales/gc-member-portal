/**
 * EnrichmentProcessingStep.tsx
 * Step 3 of the Email Enrichment wizard: progress bar and live stats while enrichment runs.
 * Constraint: no data fetching — enrichment state is passed in from the hook via props.
 */

import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { EnrichmentStats } from '../../../hooks/useEmailEnrichment';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  progress: number;
  stats: EnrichmentStats;
  error: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EnrichmentProcessingStep: React.FC<Props> = ({ progress, stats, error }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-6">
      <Loader2 size={40} className="mx-auto text-violet-500 animate-spin" />

      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Finding emails...</p>
        <p className="text-xs text-zinc-500 mt-1">
          Running waterfall enrichment across multiple providers
        </p>
      </div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>
            {stats.processedContacts} / {stats.totalContacts} processed
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Live stats */}
      <div className="flex items-center justify-center gap-8 text-xs">
        <div>
          <span className="text-zinc-500">Emails Found</span>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {stats.emailsFound}
          </p>
        </div>
        <div>
          <span className="text-zinc-500">Processed</span>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {stats.processedContacts}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2 text-red-600 text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};

export default EnrichmentProcessingStep;
