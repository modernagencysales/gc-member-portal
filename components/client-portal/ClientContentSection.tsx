/** ClientContentSection. Shows content items (posts) for client review in the portal. Handles approve/revision actions on individual posts. */

import { useState } from 'react';
import { logError } from '../../lib/logError';
import { approveContentItem, requestContentItemRevision } from '../../services/dfy-content-service';

import type { DfyContentItem, ContentType } from '../../types/dfy-content-types';

// ─── Constants ─────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  review: {
    label: 'Ready for Review',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  revision_requested: {
    label: 'Revision Requested',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
  revision_ready: {
    label: 'Revised — Ready for Review',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
};

const SECTION_LABELS: Record<ContentType, string> = {
  lead_magnet_post: 'Lead Magnet Posts',
  content_post: 'Content Posts',
};

// ─── Post Card ─────────────────────────────────────────

interface PostCardProps {
  item: DfyContentItem;
  onAction: () => void;
}

function PostCard({ item, onAction }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [approving, setApproving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionDone, setActionDone] = useState<'approved' | 'revision_sent' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.review;
  const canAct = (item.status === 'review' || item.status === 'revision_ready') && !actionDone;
  const isLong = item.content.split('\n').length > 4 || item.content.length > 300;

  async function handleApprove() {
    setApproving(true);
    setError(null);
    try {
      await approveContentItem(item.id, item.engagement_id);
      setActionDone('approved');
      onAction();
    } catch (err) {
      logError('ClientContentSection:approve', err);
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setApproving(false);
    }
  }

  async function handleRevision() {
    if (!feedback.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestContentItemRevision(item.id, item.engagement_id, feedback.trim());
      setActionDone('revision_sent');
      onAction();
    } catch (err) {
      logError('ClientContentSection:revision', err);
      setError(err instanceof Error ? err.message : 'Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-400 dark:text-zinc-500">#{item.sort_order}</span>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
            {item.title}
          </h4>
        </div>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Content */}
      <div onClick={() => setExpanded(!expanded)} className="cursor-pointer">
        <p
          className={`text-sm whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-zinc-300 ${
            !expanded && isLong ? 'line-clamp-4' : ''
          }`}
        >
          {item.content}
        </p>
        {!expanded && isLong && (
          <span className="text-xs text-gray-400 dark:text-zinc-500 mt-1 inline-block">
            Click to expand
          </span>
        )}
      </div>

      {/* Feedback banner (from previous revision request) */}
      {item.feedback && item.status === 'revision_ready' && (
        <div className="mt-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">
            Your feedback was addressed
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">{item.feedback}</p>
        </div>
      )}

      {/* Action buttons */}
      {canAct && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
          {!showRevisionForm ? (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors disabled:opacity-50"
              >
                {approving ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => setShowRevisionForm(true)}
                className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
              >
                Request Revision
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe what changes you'd like..."
                rows={3}
                className="w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRevision}
                  disabled={submitting || !feedback.trim()}
                  className="flex-1 rounded-md bg-orange-600 dark:bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Revision Request'}
                </button>
                <button
                  onClick={() => {
                    setShowRevisionForm(false);
                    setFeedback('');
                    setError(null);
                  }}
                  disabled={submitting}
                  className="rounded-md border border-gray-200 dark:border-zinc-700 px-3 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {/* Success states */}
      {actionDone === 'approved' && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
          <p className="text-xs font-medium text-green-600 dark:text-green-400">
            Approved successfully
          </p>
        </div>
      )}
      {actionDone === 'revision_sent' && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
          <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
            Revision request submitted
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

interface ClientContentSectionProps {
  items: DfyContentItem[];
  onRefresh: () => void;
}

export default function ClientContentSection({ items, onRefresh }: ClientContentSectionProps) {
  if (!items.length) return null;

  const sectionOrder: ContentType[] = ['lead_magnet_post', 'content_post'];

  // Group by content_type
  const grouped = new Map<ContentType, DfyContentItem[]>();
  for (const item of items) {
    const list = grouped.get(item.content_type) ?? [];
    list.push(item);
    grouped.set(item.content_type, list);
  }

  // Count actionable items
  const actionableCount = items.filter(
    (i) => i.status === 'review' || i.status === 'revision_ready'
  ).length;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
          Content for Review
        </h2>
        {actionableCount > 0 && (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {actionableCount} post{actionableCount !== 1 ? 's' : ''} need
            {actionableCount === 1 ? 's' : ''} review
          </span>
        )}
      </div>

      {sectionOrder.map((type) => {
        const sectionItems = grouped.get(type);
        if (!sectionItems?.length) return null;

        return (
          <div key={type}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2">
              {SECTION_LABELS[type]} ({sectionItems.length})
            </h3>
            <div className="space-y-3">
              {sectionItems.map((item) => (
                <PostCard key={item.id} item={item} onAction={onRefresh} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
