import React from 'react';
import type { DfyDeliverable } from '../../services/dfy-service';

// ── Status config ──────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: {
    label: 'Pending',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
  },
  review: {
    label: 'Ready for Review',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-green-200 dark:bg-green-900/60',
    text: 'text-green-800 dark:text-green-200',
  },
};

// ── Category labels ────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  content: 'Content',
  funnel: 'Lead Magnet & Funnel',
  outbound: 'Outbound & DMs',
};

// ── Helpers ────────────────────────────────────────────
function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Component ──────────────────────────────────────────
interface DeliverableCardProps {
  deliverable: DfyDeliverable;
}

const DeliverableCard: React.FC<DeliverableCardProps> = ({ deliverable }) => {
  const status = STATUS_CONFIG[deliverable.status] ?? STATUS_CONFIG.pending;
  const categoryLabel = CATEGORY_LABELS[deliverable.category] ?? deliverable.category;

  return (
    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors">
      {/* Top section: name + description */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-gray-900 dark:text-zinc-100">{deliverable.name}</p>
          {deliverable.description && (
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
              {deliverable.description}
            </p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
        >
          {status.label}
        </span>
      </div>

      {/* Bottom row: category tag, due date, approval */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
        <span className="inline-flex items-center rounded bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 text-xs text-gray-600 dark:text-zinc-400">
          {categoryLabel}
        </span>

        {deliverable.due_date && <span>Due {formatShortDate(deliverable.due_date)}</span>}

        {deliverable.client_approved_at && (
          <span className="text-green-600 dark:text-green-400 ml-auto">
            Approved {formatShortDate(deliverable.client_approved_at)}
          </span>
        )}
      </div>
    </div>
  );
};

export default DeliverableCard;
