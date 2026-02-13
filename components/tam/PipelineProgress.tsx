import React from 'react';
import { Check, Loader2, AlertCircle, Building2, Shield, Users, RotateCcw } from 'lucide-react';
import { PipelineStepState } from '../../hooks/useTamPipeline';

interface PipelineProgressProps {
  steps: PipelineStepState[];
  error: string | null;
  onNewProject?: () => void;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  source_companies: <Building2 className="w-5 h-5" />,
  qualify: <Shield className="w-5 h-5" />,
  find_contacts: <Users className="w-5 h-5" />,
};

const PipelineProgress: React.FC<PipelineProgressProps> = ({ steps, error, onNewProject }) => {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Building Your Target Market
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          We're sourcing companies, qualifying them, and finding the right contacts
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.step}
            className={`rounded-xl border p-5 transition-all ${
              step.status === 'running'
                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/10'
                : step.status === 'completed'
                  ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                  : step.status === 'failed'
                    ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Step number / status icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  step.status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                    : step.status === 'running'
                      ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400'
                      : step.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                }`}
              >
                {step.status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : step.status === 'running' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step.status === 'failed' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  STEP_ICONS[step.step]
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={`font-semibold text-sm ${
                      step.status === 'pending'
                        ? 'text-zinc-400 dark:text-zinc-500'
                        : 'text-zinc-900 dark:text-white'
                    }`}
                  >
                    {step.label}
                  </h3>
                  {step.status === 'running' && (
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                      {step.progress}%
                    </span>
                  )}
                </div>

                {/* Progress bar for running step */}
                {step.status === 'running' && (
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-500 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                )}

                {/* Result summary for completed step */}
                {step.status === 'completed' && step.resultSummary && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {formatResultSummary(step.step, step.resultSummary)}
                  </p>
                )}

                {/* Error message for failed step */}
                {step.status === 'failed' && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Step failed. Try creating a new project with adjusted criteria.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center space-y-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          {onNewProject && (
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start New Project
            </button>
          )}
        </div>
      )}
    </div>
  );
};

function formatResultSummary(step: string, summary: Record<string, unknown>): string {
  switch (step) {
    case 'source_companies': {
      const total = summary.companiesFound || 0;
      const parts: string[] = [];
      if (summary.prospeoCount) parts.push(`${summary.prospeoCount} from Prospeo`);
      if (summary.discolikeCount) parts.push(`${summary.discolikeCount} from Discolike`);
      if (summary.blitzapiCount) parts.push(`${summary.blitzapiCount} from BlitzAPI`);
      if (summary.failed) parts.push(`${summary.failed} failed to insert`);
      if (parts.length > 0) {
        return `Found ${total} companies (${parts.join(', ')})`;
      }
      return `Found ${total} companies via ${summary.source || 'search'}`;
    }
    case 'qualify':
      return `${summary.qualified || 0} qualified, ${summary.disqualified || 0} disqualified out of ${summary.total || 0}`;
    case 'find_contacts':
      return `${summary.contactsFound || 0} contacts found, ${summary.emailsFound || 0} with emails`;
    default:
      return '';
  }
}

export default PipelineProgress;
