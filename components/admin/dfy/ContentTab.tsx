/** Admin content tab — shows all posts with revision history. Never calls supabase directly. */

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { diffWords } from 'diff';
import {
  getContentItems,
  getRevisionHistory,
  adminUpdateContent,
} from '../../../services/dfy-content-service';
import { useTheme } from '../../../context/ThemeContext';

import type {
  DfyContentItem,
  DfyContentRevision,
  ContentType,
} from '../../../types/dfy-content-types';

// ─── Props ──────────────────────────────────────────

interface ContentTabProps {
  engagementId: string;
}

// ─── Constants ──────────────────────────────────────

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; bgDark: string; textDark: string }
> = {
  review: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    bgDark: 'bg-purple-900/40',
    textDark: 'text-purple-300',
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    bgDark: 'bg-green-900/40',
    textDark: 'text-green-300',
  },
  revision_requested: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    bgDark: 'bg-orange-900/40',
    textDark: 'text-orange-300',
  },
  revision_ready: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    bgDark: 'bg-blue-900/40',
    textDark: 'text-blue-300',
  },
};

const SECTION_LABELS: Record<ContentType, string> = {
  lead_magnet_post: 'Lead Magnet Posts',
  content_post: 'Content Posts',
};

const AUTHOR_COLORS: Record<
  string,
  { bg: string; text: string; bgDark: string; textDark: string }
> = {
  original: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    bgDark: 'bg-zinc-700',
    textDark: 'text-zinc-300',
  },
  ai: {
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    bgDark: 'bg-violet-900/40',
    textDark: 'text-violet-300',
  },
  human: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    bgDark: 'bg-blue-900/40',
    textDark: 'text-blue-300',
  },
};

// ─── Diff Renderer ──────────────────────────────────

function DiffView({ oldText, newText }: { oldText: string; newText: string }) {
  const changes = diffWords(oldText, newText);

  return (
    <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
      {changes.map((part, i) => (
        <span
          key={i}
          className={
            part.added
              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
              : part.removed
                ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 line-through'
                : 'text-gray-700 dark:text-zinc-300'
          }
        >
          {part.value}
        </span>
      ))}
    </div>
  );
}

// ─── Revision Timeline ──────────────────────────────

function RevisionTimeline({
  contentItemId,
  isDarkMode,
}: {
  contentItemId: string;
  isDarkMode: boolean;
}) {
  const { data: revisions, isLoading } = useQuery<DfyContentRevision[]>({
    queryKey: ['dfy-revisions', contentItemId],
    queryFn: () => getRevisionHistory(contentItemId),
  });

  if (isLoading) {
    return (
      <p className={isDarkMode ? 'text-zinc-400 text-sm py-3' : 'text-gray-500 text-sm py-3'}>
        Loading revisions...
      </p>
    );
  }

  if (!revisions || revisions.length === 0) {
    return (
      <p className={isDarkMode ? 'text-zinc-500 text-sm py-3' : 'text-gray-400 text-sm py-3'}>
        No revision history.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {revisions.map((rev, idx) => {
        const authorStyle = AUTHOR_COLORS[rev.author] ?? AUTHOR_COLORS.original;
        const prevRevision = idx > 0 ? revisions[idx - 1] : null;

        return (
          <div
            key={rev.id}
            className={
              isDarkMode
                ? 'border border-zinc-700 rounded-md p-3 bg-zinc-800/50'
                : 'border border-gray-200 rounded-md p-3 bg-gray-50'
            }
          >
            {/* Revision header */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={
                  isDarkMode
                    ? 'text-sm font-medium text-zinc-200'
                    : 'text-sm font-medium text-gray-800'
                }
              >
                Round {rev.round}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isDarkMode
                    ? `${authorStyle.bgDark} ${authorStyle.textDark}`
                    : `${authorStyle.bg} ${authorStyle.text}`
                }`}
              >
                {rev.author}
              </span>
              <span
                className={
                  isDarkMode ? 'text-xs text-zinc-500 ml-auto' : 'text-xs text-gray-400 ml-auto'
                }
              >
                {new Date(rev.created_at).toLocaleString()}
              </span>
            </div>

            {/* Feedback for this revision */}
            {rev.feedback && (
              <div
                className={
                  isDarkMode
                    ? 'mb-2 rounded bg-amber-900/20 border border-amber-800 px-2 py-1.5'
                    : 'mb-2 rounded bg-amber-50 border border-amber-200 px-2 py-1.5'
                }
              >
                <p className={isDarkMode ? 'text-xs text-amber-400' : 'text-xs text-amber-600'}>
                  {rev.feedback}
                </p>
              </div>
            )}

            {/* Diff between previous and this revision */}
            {prevRevision ? (
              <div>
                <p
                  className={
                    isDarkMode ? 'text-xs text-zinc-500 mb-1' : 'text-xs text-gray-400 mb-1'
                  }
                >
                  Changes (red = removed, green = added)
                </p>
                <DiffView oldText={prevRevision.content} newText={rev.content} />
              </div>
            ) : (
              <div
                className={`text-sm whitespace-pre-wrap leading-relaxed ${
                  isDarkMode ? 'text-zinc-300' : 'text-gray-700'
                }`}
              >
                {rev.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Post Card ──────────────────────────────────────

function PostCard({
  item,
  engagementId,
  isDarkMode,
}: {
  item: DfyContentItem;
  engagementId: string;
  isDarkMode: boolean;
}) {
  const queryClient = useQueryClient();
  const [showFullContent, setShowFullContent] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(item.content);
  const [saving, setSaving] = useState(false);

  const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.review;
  const statusLabel = item.status.replace(/_/g, ' ');

  const handleSave = async () => {
    if (editDraft.trim() === item.content) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await adminUpdateContent(item.id, engagementId, editDraft);
      queryClient.invalidateQueries({ queryKey: ['dfy-content-items', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['dfy-revisions', item.id] });
      setEditing(false);
    } catch (err) {
      window.alert(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={
        isDarkMode
          ? 'border border-zinc-700 rounded-lg p-4 bg-zinc-800/60'
          : 'border border-gray-200 rounded-lg p-4 bg-white'
      }
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={isDarkMode ? 'text-xs text-zinc-500' : 'text-xs text-gray-400'}>
            #{item.sort_order}
          </span>
          <h4
            className={`text-sm font-semibold truncate ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}
          >
            {item.title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => {
                setEditDraft(item.content);
                setEditing(true);
                setShowFullContent(true);
              }}
              className={`text-xs font-medium ${
                isDarkMode
                  ? 'text-zinc-500 hover:text-zinc-300'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Edit
            </button>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
              isDarkMode
                ? `${statusStyle.bgDark} ${statusStyle.textDark}`
                : `${statusStyle.bg} ${statusStyle.text}`
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Content — view or edit */}
      {editing ? (
        <div>
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            rows={Math.max(10, editDraft.split('\n').length + 2)}
            className={`w-full text-sm font-mono rounded-md border p-3 resize-y ${
              isDarkMode
                ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditDraft(item.content);
              }}
              disabled={saving}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                isDarkMode ? 'border-zinc-600 text-zinc-400' : 'border-gray-300 text-gray-500'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div onClick={() => setShowFullContent(!showFullContent)} className="cursor-pointer">
          <p
            className={`text-sm whitespace-pre-wrap leading-relaxed ${
              isDarkMode ? 'text-zinc-300' : 'text-gray-700'
            } ${!showFullContent ? 'line-clamp-3' : ''}`}
          >
            {item.content}
          </p>
          {!showFullContent && item.content.split('\n').length > 3 && (
            <span
              className={
                isDarkMode
                  ? 'text-xs text-zinc-500 mt-1 inline-block'
                  : 'text-xs text-gray-400 mt-1 inline-block'
              }
            >
              Click to expand
            </span>
          )}
        </div>
      )}

      {/* Feedback banner */}
      {item.feedback && (
        <div
          className={
            isDarkMode
              ? 'mt-3 rounded-md bg-amber-900/20 border border-amber-800 px-3 py-2'
              : 'mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2'
          }
        >
          <p
            className={
              isDarkMode
                ? 'text-xs font-medium text-amber-300 mb-0.5'
                : 'text-xs font-medium text-amber-700 mb-0.5'
            }
          >
            Feedback
          </p>
          <p className={isDarkMode ? 'text-sm text-amber-400' : 'text-sm text-amber-600'}>
            {item.feedback}
          </p>
        </div>
      )}

      {/* Revision history */}
      <div className="mt-3 flex items-center gap-3">
        {item.revision_count > 0 && (
          <button
            onClick={() => setShowRevisions(!showRevisions)}
            className={`text-xs font-medium ${
              isDarkMode
                ? 'text-violet-400 hover:text-violet-300'
                : 'text-violet-600 hover:text-violet-700'
            }`}
          >
            {showRevisions ? 'Hide' : 'Show'} revision history ({item.revision_count} revision
            {item.revision_count !== 1 ? 's' : ''})
          </button>
        )}
      </div>

      {showRevisions && (
        <div className="mt-3">
          <RevisionTimeline contentItemId={item.id} isDarkMode={isDarkMode} />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────

export default function ContentTab({ engagementId }: ContentTabProps) {
  const { isDarkMode } = useTheme();

  const { data: items, isLoading } = useQuery<DfyContentItem[]>({
    queryKey: ['dfy-content-items', engagementId],
    queryFn: () => getContentItems(engagementId),
  });

  const grouped = useMemo(() => {
    if (!items) return new Map<ContentType, DfyContentItem[]>();

    const map = new Map<ContentType, DfyContentItem[]>();
    for (const item of items) {
      const list = map.get(item.content_type) ?? [];
      list.push(item);
      map.set(item.content_type, list);
    }
    return map;
  }, [items]);

  // ─── Loading state ─────────────────────────────────

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}
      >
        Loading content...
      </div>
    );
  }

  // ─── Empty state ───────────────────────────────────

  if (!items || items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}
      >
        <div className="text-center">
          <p className="text-sm font-medium mb-1">No content items yet</p>
          <p className="text-xs">Content will appear here once posts are generated.</p>
        </div>
      </div>
    );
  }

  // ─── Content sections ─────────────────────────────

  const sectionOrder: ContentType[] = ['lead_magnet_post', 'content_post'];

  return (
    <div className="space-y-8">
      {sectionOrder.map((type) => {
        const sectionItems = grouped.get(type);
        if (!sectionItems || sectionItems.length === 0) return null;

        return (
          <div key={type}>
            <h3
              className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                isDarkMode ? 'text-zinc-400' : 'text-gray-500'
              }`}
            >
              {SECTION_LABELS[type]} ({sectionItems.length})
            </h3>
            <div className="space-y-3">
              {sectionItems.map((item) => (
                <PostCard
                  key={item.id}
                  item={item}
                  engagementId={engagementId}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
