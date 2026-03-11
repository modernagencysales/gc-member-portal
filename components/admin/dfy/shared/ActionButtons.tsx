/** ActionButtons. Renders engagement action buttons (retrigger, pause, resume, sync, upgrade). */
import { ArrowUpCircle, RotateCcw, Play, Pause, BookOpen } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────
export interface ActionButtonsProps {
  status: string;
  isLoading: boolean;
  onRetrigger: () => void;
  onPause: () => void;
  onResume: () => void;
  onSyncPlaybooks: () => void;
  isSyncing: boolean;
  engagementType?: string;
  onUpgrade?: () => void;
  isUpgrading?: boolean;
}

// ─── Component ─────────────────────────────────────────
export default function ActionButtons({
  status,
  isLoading,
  onRetrigger,
  onPause,
  onResume,
  onSyncPlaybooks,
  isSyncing,
  engagementType,
  onUpgrade,
  isUpgrading,
}: ActionButtonsProps) {
  const showActions = status === 'onboarding' || status === 'active' || status === 'paused';

  return (
    <div className="flex flex-wrap gap-3">
      {showActions && status === 'onboarding' && (
        <button
          onClick={onRetrigger}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {isLoading ? 'Re-triggering...' : 'Re-trigger Onboarding'}
        </button>
      )}
      {showActions && status === 'active' && (
        <button
          onClick={onPause}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 transition-colors"
        >
          <Pause className="w-4 h-4" />
          {isLoading ? 'Pausing...' : 'Pause'}
        </button>
      )}
      {showActions && status === 'paused' && (
        <button
          onClick={onResume}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Play className="w-4 h-4" />
          {isLoading ? 'Resuming...' : 'Resume'}
        </button>
      )}
      <button
        onClick={onSyncPlaybooks}
        disabled={isSyncing}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        <BookOpen className="w-4 h-4" />
        {isSyncing ? 'Syncing...' : 'Sync Playbooks'}
      </button>
      {engagementType === 'intro_offer' &&
        (status === 'active' || status === 'completed') &&
        onUpgrade && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Convert this intro offer to a full DFY engagement? This will add additional deliverables and set the monthly rate to $2,500/mo.'
                )
              ) {
                onUpgrade!();
              }
            }}
            disabled={isUpgrading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <ArrowUpCircle className="w-4 h-4" />
            {isUpgrading ? 'Upgrading...' : 'Convert to Full DFY'}
          </button>
        )}
    </div>
  );
}
