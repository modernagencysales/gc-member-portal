/** MilestoneSection. Collapsible group of deliverables under a milestone with progress bar. */
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import DeliverableRow from './DeliverableRow';

import type { DfyAdminDeliverable } from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface MilestoneSectionProps {
  milestoneId: string | null;
  items: DfyAdminDeliverable[];
  allDeliverables: DfyAdminDeliverable[];
  onStatusChange: (id: string, status: string) => void;
  onTriggerAutomation: (id: string) => void;
  isUpdating: boolean;
  isTriggering: boolean;
}

// ─── Component ─────────────────────────────────────────
export default function MilestoneSection({
  milestoneId,
  items,
  allDeliverables,
  onStatusChange,
  onTriggerAutomation,
  isUpdating,
  isTriggering,
}: MilestoneSectionProps) {
  const { isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(true);

  const completedCount = items.filter((d) => d.status === 'completed').length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const label = milestoneId || 'Ungrouped';

  return (
    <div className="p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full text-left mb-3 ${
          isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
        }`}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        <h4 className="text-xs font-semibold uppercase tracking-wider flex-1">{label}</h4>
        <span className={`text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {completedCount}/{totalCount}
        </span>
      </button>

      {/* Progress bar */}
      <div className={`h-1.5 rounded-full mb-3 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {expanded && (
        <div className="space-y-2">
          {items.map((d) => (
            <DeliverableRow
              key={d.id}
              deliverable={d}
              allDeliverables={allDeliverables}
              onStatusChange={(status) => onStatusChange(d.id, status)}
              onTriggerAutomation={() => onTriggerAutomation(d.id)}
              isUpdating={isUpdating}
              isTriggering={isTriggering}
            />
          ))}
        </div>
      )}
    </div>
  );
}
