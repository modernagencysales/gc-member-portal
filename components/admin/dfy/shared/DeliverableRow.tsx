/** DeliverableRow. Renders a single deliverable with status selector, automation trigger, and dependency info. */
import { useMemo } from 'react';
import { ExternalLink, Lock, BookOpen, Zap, MessageSquare } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { DELIVERABLE_STATUS_CONFIGS } from '../../../../types/dfy-admin-types';
import AutomationStatusBadge from './AutomationStatusBadge';

import type { DfyAdminDeliverable } from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface DeliverableRowProps {
  deliverable: DfyAdminDeliverable;
  allDeliverables: DfyAdminDeliverable[];
  onStatusChange: (status: string) => void;
  onTriggerAutomation: () => void;
  isUpdating: boolean;
  isTriggering: boolean;
}

// ─── Component ─────────────────────────────────────────
export default function DeliverableRow({
  deliverable,
  allDeliverables,
  onStatusChange,
  onTriggerAutomation,
  isUpdating,
  isTriggering,
}: DeliverableRowProps) {
  const { isDarkMode } = useTheme();
  const statuses = Object.keys(DELIVERABLE_STATUS_CONFIGS);

  const dependencyNames = useMemo(() => {
    if (!deliverable.depends_on || deliverable.depends_on.length === 0) return [];
    return deliverable.depends_on.map((depId) => {
      const dep = allDeliverables.find((d) => d.id === depId);
      return dep ? dep.name : depId;
    });
  }, [deliverable.depends_on, allDeliverables]);

  const canTriggerAutomation =
    deliverable.automation_type &&
    (deliverable.automation_status === 'pending' || deliverable.automation_status === 'failed');

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        isDarkMode ? 'bg-zinc-800/30' : 'bg-zinc-50'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {deliverable.name}
          </p>
          <AutomationStatusBadge status={deliverable.automation_status} />
          {deliverable.playbook_url && (
            <a
              href={deliverable.playbook_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open playbook"
              className={`${
                isDarkMode
                  ? 'text-indigo-400 hover:text-indigo-300'
                  : 'text-indigo-600 hover:text-indigo-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
            </a>
          )}
          {dependencyNames.length > 0 && (
            <span
              title={`Blocked by: ${dependencyNames.join(', ')}`}
              className={`flex items-center gap-0.5 text-[10px] ${
                isDarkMode ? 'text-amber-400' : 'text-amber-600'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">
                {dependencyNames.length} dep{dependencyNames.length > 1 ? 's' : ''}
              </span>
            </span>
          )}
        </div>
        <div
          className={`flex items-center gap-3 text-[11px] mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        >
          {deliverable.assignee && <span>Assignee: {deliverable.assignee}</span>}
          {deliverable.due_date && (
            <span>Due: {new Date(deliverable.due_date).toLocaleDateString()}</span>
          )}
          {deliverable.automation_type && (
            <span className="flex items-center gap-0.5">
              <Zap className="w-3 h-3" />
              {deliverable.automation_type}
            </span>
          )}
          {deliverable.linear_issue_id && (
            <a
              href={`https://linear.app/modern-agency-sales/issue/${deliverable.linear_issue_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-0.5 ${
                isDarkMode
                  ? 'text-violet-400 hover:text-violet-300'
                  : 'text-violet-600 hover:text-violet-700'
              }`}
            >
              Linear
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {deliverable.revision_count != null && deliverable.revision_count > 0 && (
            <span className="text-orange-500">
              {deliverable.revision_count} revision{deliverable.revision_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* Revision feedback */}
        {deliverable.status === 'revision_requested' && deliverable.revision_feedback && (
          <div
            className={`mt-2 p-2 rounded-lg text-xs ${
              isDarkMode
                ? 'bg-orange-900/20 border border-orange-800/30 text-orange-300'
                : 'bg-orange-50 border border-orange-200 text-orange-800'
            }`}
          >
            <div className="flex items-center gap-1 font-semibold mb-0.5">
              <MessageSquare className="w-3 h-3" />
              Client feedback:
            </div>
            <p>{deliverable.revision_feedback}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        {canTriggerAutomation && (
          <button
            onClick={onTriggerAutomation}
            disabled={isTriggering}
            title="Run Automation"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <Zap className="w-3 h-3" />
            {isTriggering ? 'Running...' : 'Run'}
          </button>
        )}
        <select
          value={deliverable.status}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={isUpdating}
          className={`text-xs px-2 py-1.5 rounded-lg border ${
            isDarkMode
              ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
              : 'bg-white border-zinc-300 text-zinc-700'
          } disabled:opacity-50`}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {DELIVERABLE_STATUS_CONFIGS[s as keyof typeof DELIVERABLE_STATUS_CONFIGS].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
