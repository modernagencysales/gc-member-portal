/** AutomationStatusBadge. Renders a colored badge for automation run status (pending, running, completed, failed). */
import { Loader2 } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────
export interface AutomationStatusBadgeProps {
  status: string;
}

// ─── Constants ─────────────────────────────────────────
const STATUS_CONFIGS: Record<string, { label: string; classes: string; spinning?: boolean }> = {
  pending: {
    label: 'Pending',
    classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  running: {
    label: 'Running',
    classes: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    spinning: true,
  },
  completed: {
    label: 'Auto-completed',
    classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  failed: {
    label: 'Failed',
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

// ─── Component ─────────────────────────────────────────
export default function AutomationStatusBadge({ status }: AutomationStatusBadgeProps) {
  if (!status || status === 'none') return null;

  const cfg = STATUS_CONFIGS[status];
  if (!cfg) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.classes}`}
    >
      {cfg.spinning && <Loader2 className="w-3 h-3 animate-spin" />}
      {cfg.label}
    </span>
  );
}
