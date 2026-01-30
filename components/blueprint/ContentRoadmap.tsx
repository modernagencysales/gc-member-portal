import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, FileText, X } from 'lucide-react';
import { ProspectPost } from '../../types/blueprint-types';

// ============================================
// Types
// ============================================

interface ContentRoadmapProps {
  posts: ProspectPost[];
}

// ============================================
// Constants
// ============================================

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAYS_PER_WEEK = 7;

// ============================================
// Copy Button Component
// ============================================

interface CopyButtonProps {
  text: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded transition-colors"
      aria-label={copied ? 'Copied!' : 'Copy post content'}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

// ============================================
// Status Badge Component
// ============================================

interface StatusBadgeProps {
  postReady?: boolean;
  toFix?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ postReady, toFix }) => {
  if (postReady) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400 rounded">
        Ready
      </span>
    );
  }

  if (toFix) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded">
        Needs Review
      </span>
    );
  }

  return null;
};

// ============================================
// Action Items Renderer
// ============================================

const ActionItemsList: React.FC<{ actionItems: string }> = ({ actionItems }) => {
  // Split on common checkbox/list patterns: "☐", "□", "- [ ]", "- ", numbered items, or newlines
  const lines = actionItems
    .split(/\n|(?=☐)|(?=□)|(?=- \[[ x]\])/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="text-amber-500 mt-0.5 shrink-0">☐</span>
          <span>{line.replace(/^(☐|□|- \[[ x]\]|-|\d+[.)]\s*)/, '').trim()}</span>
        </li>
      ))}
    </ul>
  );
};

// ============================================
// Post Modal Component
// ============================================

interface PostModalProps {
  post: ProspectPost;
  onClose: () => void;
}

const PostModal: React.FC<PostModalProps> = ({ post, onClose }) => {
  const hasActionItems = post.actionItems && post.actionItems.trim() !== '';

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge postReady={post.postReady} toFix={post.toFix} />
              {post.number && (
                <span className="text-xs text-zinc-500 font-medium">#{post.number}</span>
              )}
            </div>
            {post.name && (
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {post.name}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {post.postContent && <CopyButton text={post.postContent} />}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className={`flex-1 overflow-y-auto p-6 ${hasActionItems ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : ''}`}
        >
          {/* Post Content - Left (2/3) */}
          <div className={hasActionItems ? 'md:col-span-2' : ''}>
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Post Content
            </h4>
            <div className="bg-zinc-50 border border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700 rounded-lg p-4">
              <pre className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                {post.postContent}
              </pre>
            </div>
          </div>

          {/* Action Items - Right (1/3) */}
          {hasActionItems && (
            <div>
              <h4 className="text-xs font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-3">
                Action Items
              </h4>
              <div className="bg-amber-50 border border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20 rounded-lg p-4">
                <ActionItemsList actionItems={post.actionItems!} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Calendar Cell Component
// ============================================

interface CalendarCellProps {
  post: ProspectPost;
  onOpen: () => void;
}

const CalendarCell: React.FC<CalendarCellProps> = ({ post, onOpen }) => {
  const hasContent = post.postContent && post.postContent.trim() !== '';

  return (
    <button
      type="button"
      onClick={hasContent ? onOpen : undefined}
      className={`relative w-full text-left rounded-md border p-1.5 sm:p-2 min-h-[56px] sm:min-h-[72px] transition-colors ${
        hasContent
          ? 'bg-violet-50 border-violet-200 hover:border-violet-300 dark:bg-violet-500/10 dark:border-violet-500/30 dark:hover:border-violet-400/50 cursor-pointer'
          : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 cursor-default'
      }`}
    >
      {/* Status dot */}
      {(post.postReady || post.toFix) && (
        <span
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
            post.postReady ? 'bg-green-400' : 'bg-amber-400'
          }`}
        />
      )}
      <span className="block text-[10px] sm:text-xs text-zinc-500 font-medium">
        #{post.number ?? ''}
      </span>
      {post.name && (
        <span className="block text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-300 line-clamp-1 sm:line-clamp-2 leading-tight mt-0.5">
          {post.name}
        </span>
      )}
    </button>
  );
};

// ============================================
// Empty State Component
// ============================================

const EmptyState: React.FC = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center">
    <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">No Posts Yet</h3>
    <p className="text-sm text-zinc-500">
      Your personalized content roadmap will appear here once generated.
    </p>
  </div>
);

// ============================================
// Month Grid Component
// ============================================

interface MonthGridProps {
  label: string;
  posts: ProspectPost[];
  onSelectPost: (post: ProspectPost) => void;
}

/**
 * Renders a 7-column calendar grid (Mon-Sun).
 * Posts fill weekday slots (Mon-Fri) sequentially; weekend columns stay empty.
 */
const MonthGrid: React.FC<MonthGridProps> = ({ label, posts, onSelectPost }) => {
  // Build rows: each row = 1 week (7 cells). Posts fill all 7 days sequentially.
  const totalWeeks = Math.ceil(posts.length / DAYS_PER_WEEK);
  const weeks: (ProspectPost | null)[][] = [];

  let postIdx = 0;
  for (let w = 0; w < totalWeeks; w++) {
    const row: (ProspectPost | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if (postIdx < posts.length) {
        row.push(posts[postIdx]);
        postIdx++;
      } else {
        row.push(null);
      }
    }
    weeks.push(row);
  }

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{label}</h3>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d) => (
          <span key={d} className="text-[10px] sm:text-xs text-zinc-500 font-medium text-center">
            {d}
          </span>
        ))}
      </div>
      {/* Week rows */}
      <div className="grid gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell, di) =>
              cell ? (
                <CalendarCell key={cell.id} post={cell} onOpen={() => onSelectPost(cell)} />
              ) : (
                <div
                  key={`empty-${wi}-${di}`}
                  className="min-h-[56px] sm:min-h-[72px] rounded-md bg-zinc-50/50 border border-zinc-200/50 dark:bg-zinc-900/40 dark:border-zinc-800/50"
                />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ContentRoadmap Component
// ============================================

const ContentRoadmap: React.FC<ContentRoadmapProps> = ({ posts }) => {
  const [selectedPost, setSelectedPost] = useState<ProspectPost | null>(null);
  const [activeMonth, setActiveMonth] = useState<1 | 2>(1);

  // Sort posts by number if available, otherwise by creation date
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.number !== undefined && b.number !== undefined) {
      return a.number - b.number;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Split into two months: first 30, rest in second
  const midpoint = Math.ceil(sortedPosts.length / 2);
  const month1Posts = sortedPosts.slice(0, midpoint);
  const month2Posts = sortedPosts.slice(midpoint);

  // Count ready posts
  const readyCount = posts.filter((p) => p.postReady).length;

  // Don't render if there are no posts
  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          60 Days of Content, Ready to Post
        </h2>
        <EmptyState />
      </div>
    );
  }

  const hasMonth2 = month2Posts.length > 0;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          60 Days of Content, Ready to Post
        </h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {readyCount > 0 ? (
            <>
              <span className="text-green-600 dark:text-green-400 font-medium">{readyCount}</span>{' '}
              of {posts.length} posts ready for you
            </>
          ) : (
            <>{posts.length} posts ready for you</>
          )}
        </span>
      </div>

      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
        Every post is written in your voice and designed to build authority with your target buyer.
        Copy, customize, and post.
      </p>

      {/* Month Toggle Tabs */}
      {hasMonth2 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveMonth(1)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeMonth === 1
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            Month 1 <span className="text-xs opacity-75">({month1Posts.length} posts)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMonth(2)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeMonth === 2
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            Month 2 <span className="text-xs opacity-75">({month2Posts.length} posts)</span>
          </button>
        </div>
      )}

      {/* Calendar Grid - Full Width */}
      <MonthGrid
        label={hasMonth2 ? `Month ${activeMonth}` : 'Month 1'}
        posts={activeMonth === 1 ? month1Posts : month2Posts}
        onSelectPost={setSelectedPost}
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400" /> Ready
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Needs review
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-3 rounded-sm bg-violet-500/20 border border-violet-500/30" />{' '}
          Has content
        </span>
      </div>

      {/* Post Detail Modal — portal to body so ScrollReveal transforms don't break fixed positioning */}
      {selectedPost &&
        createPortal(
          <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />,
          document.body
        )}
    </div>
  );
};

export default ContentRoadmap;
