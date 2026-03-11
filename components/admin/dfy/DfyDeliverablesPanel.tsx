/** DfyDeliverablesPanel. Deliverables grouped by milestone with status updates and automation triggers. */
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import MilestoneSection from './shared/MilestoneSection';

import type { DfyAdminDeliverable } from '../../../types/dfy-admin-types';
import type { UseMutationResult } from '@tanstack/react-query';

// ─── Types ─────────────────────────────────────────────
export interface DfyDeliverablesPanelProps {
  deliverables: DfyAdminDeliverable[] | undefined;
  delsLoading: boolean;
  milestoneGroups: Map<string | null, DfyAdminDeliverable[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deliverableMutation: UseMutationResult<any, Error, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerMutation: UseMutationResult<any, Error, any>;
}

// ─── Component ─────────────────────────────────────────
export default function DfyDeliverablesPanel({
  deliverables,
  delsLoading,
  milestoneGroups,
  deliverableMutation,
  triggerMutation,
}: DfyDeliverablesPanelProps) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-xl border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Deliverables
        </h3>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {delsLoading ? (
          <div className="px-4 py-6 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            <span className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Loading deliverables...
            </span>
          </div>
        ) : (
          <>
            {Array.from(milestoneGroups.entries()).map(([milestoneId, items]) => (
              <MilestoneSection
                key={milestoneId || '__ungrouped'}
                milestoneId={milestoneId}
                items={items}
                allDeliverables={deliverables || []}
                onStatusChange={(id, status) =>
                  deliverableMutation.mutate({ id, data: { status } })
                }
                onTriggerAutomation={(id) => triggerMutation.mutate(id)}
                isUpdating={deliverableMutation.isPending}
                isTriggering={triggerMutation.isPending}
              />
            ))}
            {(!deliverables || deliverables.length === 0) && (
              <p
                className={`px-4 py-6 text-sm text-center ${
                  isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                No deliverables yet
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
