/** ProfileRewriteReviewPanel. Displays profile rewrite output with approve-and-ship workflow. */
import { Loader2, AlertCircle, Send } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { DELIVERABLE_STATUS_CONFIGS } from '../../../../types/dfy-admin-types';

import type {
  DfyAdminDeliverable,
  DfyAutomationOutput,
  ProfileRewriteOutput,
} from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface ProfileRewriteReviewPanelProps {
  output: DfyAutomationOutput | null | undefined;
  isLoading: boolean;
  deliverable: DfyAdminDeliverable;
  onApproveAndShip: (deliverableId: string) => void;
  isShipping: boolean;
}

// ─── Component ─────────────────────────────────────────
export default function ProfileRewriteReviewPanel({
  output,
  isLoading,
  deliverable,
  onApproveAndShip,
  isShipping,
}: ProfileRewriteReviewPanelProps) {
  const { isDarkMode } = useTheme();

  // ─── Early returns ─────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-500" />
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Loading automation output...
        </p>
      </div>
    );
  }

  if (deliverable.automation_status === 'running') {
    return (
      <div
        className={`rounded-xl border p-6 text-center ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-500 mb-3" />
        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
          Profile rewrite is currently running...
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          This page will show the output once the automation completes.
        </p>
      </div>
    );
  }

  if (!output?.output_data) {
    return (
      <div
        className={`rounded-xl border p-6 text-center ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <AlertCircle
          className={`w-6 h-6 mx-auto mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        />
        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
          No profile rewrite output yet
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {deliverable.automation_status === 'failed'
            ? 'The last automation run failed. Try re-running from the Overview tab.'
            : 'Run the profile rewrite automation from the Overview tab.'}
        </p>
      </div>
    );
  }

  // ─── Data parsing ──────────────────────────────────────
  const raw = output.output_data as Record<string, unknown>;
  const data = (raw.rewrite ? raw.rewrite : raw) as unknown as ProfileRewriteOutput;
  const alreadyShipped = ['review', 'approved', 'completed'].includes(deliverable.status);

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div
        className={`rounded-xl border p-4 flex items-center justify-between ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
            Profile Rewrite Output
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Completed {output.completed_at ? new Date(output.completed_at).toLocaleString() : ''}
          </p>
        </div>
        {alreadyShipped ? (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Shipped to Client (
            {
              DELIVERABLE_STATUS_CONFIGS[
                deliverable.status as keyof typeof DELIVERABLE_STATUS_CONFIGS
              ]?.label
            }
            )
          </span>
        ) : (
          <button
            onClick={() => onApproveAndShip(deliverable.id)}
            disabled={isShipping}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            {isShipping ? 'Shipping...' : 'Approve & Ship to Client'}
          </button>
        )}
      </div>

      {/* Headlines */}
      {data.headlines && (
        <div
          className={`rounded-xl border p-5 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            Headline Options
          </h4>
          <div className="space-y-2">
            {Object.entries(data.headlines).map(([key, value]) => (
              <div
                key={key}
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}
              >
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  {key.replace(/_/g, ' ')}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Section */}
      {data.about_section && (
        <div
          className={`rounded-xl border p-5 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            About Section
          </h4>
          <div
            className={`text-sm whitespace-pre-wrap leading-relaxed ${
              isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
            }`}
          >
            {data.about_section}
          </div>
        </div>
      )}

      {/* Featured Suggestions */}
      {data.featured_suggestions && data.featured_suggestions.length > 0 && (
        <div
          className={`rounded-xl border p-5 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            Featured Section Suggestions
          </h4>
          <ul className="space-y-2">
            {data.featured_suggestions.map((s, i) => (
              <li
                key={i}
                className={`text-sm flex items-start gap-2 ${
                  isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                }`}
              >
                <span className={`mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  &bull;
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Banner Concept */}
      {data.banner_concept && (
        <div
          className={`rounded-xl border p-5 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            Banner Concept
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
            {data.banner_concept}
          </p>
        </div>
      )}
    </div>
  );
}
