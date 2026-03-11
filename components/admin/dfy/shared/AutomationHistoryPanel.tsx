/** AutomationHistoryPanel. Collapsible panel showing past automation runs with retry capability. */
import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

import type { DfyAutomationRun } from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface AutomationHistoryPanelProps {
  runs: DfyAutomationRun[];
  onRetry: (runId: string) => void;
  isRetrying: boolean;
}

// ─── Component ─────────────────────────────────────────
export default function AutomationHistoryPanel({
  runs,
  onRetry,
  isRetrying,
}: AutomationHistoryPanelProps) {
  const { isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    pending: isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    running: isDarkMode ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-100 text-violet-700',
    completed: isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
    failed: isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700',
  };

  return (
    <div
      className={`rounded-xl border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center justify-between border-b ${
          isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Automation History ({runs.length})
        </h3>
        {expanded ? (
          <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
        ) : (
          <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
        )}
      </button>
      {expanded && (
        <div className="p-4 space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isDarkMode ? 'bg-zinc-800/30' : 'bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <span
                  className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}
                >
                  {run.automation_type}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    statusColors[run.status] || statusColors.pending
                  }`}
                >
                  {run.status}
                </span>
                <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {run.created_at ? new Date(run.created_at).toLocaleDateString() : ''}
                </span>
                {run.error_log && (
                  <span
                    className="text-xs text-red-500 truncate max-w-[300px]"
                    title={run.error_log}
                  >
                    {run.error_log}
                  </span>
                )}
              </div>
              {run.status === 'failed' && (
                <button
                  onClick={() => onRetry(run.id)}
                  disabled={isRetrying}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors ml-3 flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
