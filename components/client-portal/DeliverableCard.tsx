import React, { useState } from 'react';
import type { DfyDeliverable } from '../../services/dfy-service';
import { approveDeliverable } from '../../services/dfy-service';

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
  portalSlug?: string;
  onApproved?: () => void;
}

const DeliverableCard: React.FC<DeliverableCardProps> = ({
  deliverable,
  portalSlug,
  onApproved,
}) => {
  const status = STATUS_CONFIG[deliverable.status] ?? STATUS_CONFIG.pending;
  const categoryLabel = CATEGORY_LABELS[deliverable.category] ?? deliverable.category;

  const [showApproval, setShowApproval] = useState(false);
  const [notes, setNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  const isReview = deliverable.status === 'review' && portalSlug;

  async function handleApprove() {
    if (!portalSlug) return;
    setApproving(true);
    setApproveError(null);
    try {
      await approveDeliverable(deliverable.id, portalSlug, notes || undefined);
      setApproved(true);
      onApproved?.();
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Failed to approve deliverable');
    } finally {
      setApproving(false);
    }
  }

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

      {/* ── Approval section (review status only) ────── */}
      {isReview && !approved && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
          {!showApproval ? (
            <button
              onClick={() => setShowApproval(true)}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              Review & Approve
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional feedback or notes..."
                rows={3}
                className="w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent resize-none"
              />

              {approveError && (
                <p className="text-xs text-red-600 dark:text-red-400">{approveError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-1 rounded-md bg-green-600 dark:bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {approving ? 'Approving...' : 'Approve Deliverable'}
                </button>
                <button
                  onClick={() => {
                    setShowApproval(false);
                    setNotes('');
                    setApproveError(null);
                  }}
                  disabled={approving}
                  className="rounded-md border border-gray-200 dark:border-zinc-700 px-3 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Success state ───────────────────────────── */}
      {isReview && approved && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
          <p className="text-xs font-medium text-green-600 dark:text-green-400">
            Approved successfully
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliverableCard;
