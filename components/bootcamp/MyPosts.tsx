import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Copy,
  CheckCheck,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ProspectPost } from '../../types/blueprint-types';
import { getProspectPosts } from '../../services/blueprint-supabase';
import PostFinalizerPanel from './PostFinalizerPanel';

interface MyPostsProps {
  prospectId?: string;
  studentId?: string;
}

type FilterType = 'all' | 'ready' | 'needs-review' | 'finalized';

const POSTS_PER_PAGE = 20;

function countActionItems(raw?: string): number {
  if (!raw) return 0;
  return raw
    .split('\n')
    .map((line) => line.replace(/^[\s]*[-\u2022*\d.)\]]+[\s]*/, '').trim())
    .filter((line) => line.length > 0).length;
}

const MyPosts: React.FC<MyPostsProps> = ({ prospectId, studentId }) => {
  const [posts, setPosts] = useState<ProspectPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [finalizerPostId, setFinalizerPostId] = useState<string | null>(null);

  // Fetch posts on mount
  useEffect(() => {
    if (!prospectId) {
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProspectPosts(prospectId);
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError('Failed to load your posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [prospectId]);

  // Counts
  const readyCount = useMemo(
    () => posts.filter((p) => p.postReady && !p.toFix && !p.finalizedContent).length,
    [posts]
  );
  const needsReviewCount = useMemo(() => posts.filter((p) => p.toFix).length, [posts]);
  const finalizedCount = useMemo(() => posts.filter((p) => !!p.finalizedContent).length, [posts]);

  // Filtered + searched posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Apply filter
    if (filter === 'ready') {
      result = result.filter((p) => p.postReady && !p.toFix && !p.finalizedContent);
    } else if (filter === 'needs-review') {
      result = result.filter((p) => p.toFix);
    } else if (filter === 'finalized') {
      result = result.filter((p) => !!p.finalizedContent);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.postContent && p.postContent.toLowerCase().includes(q)) ||
          (p.firstSentence && p.firstSentence.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, filter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  // Copy to clipboard
  const handleCopy = useCallback(async (postId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
    }
  }, []);

  // Toggle expand
  const toggleExpand = useCallback((postId: string) => {
    setExpandedPostId((prev) => (prev === postId ? null : postId));
  }, []);

  // Handle finalizer save
  const handleFinalizerSaved = useCallback((postId: string, finalizedContent: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, finalizedContent, toFix: false, postReady: true } : p
      )
    );
    setFinalizerPostId(null);
  }, []);

  const finalizerPost = finalizerPostId ? posts.find((p) => p.id === finalizerPostId) : null;

  // No Blueprint / no prospectId CTA
  if (!prospectId) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-violet-500/10 rounded-2xl flex items-center justify-center">
            <Sparkles size={28} className="text-violet-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Unlock Your LinkedIn Posts
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
              Get your Blueprint to unlock 60 personalized LinkedIn posts written in your voice,
              tailored to your audience, and ready to publish.
            </p>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700/50 max-w-sm mx-auto">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Connect your Blueprint in Settings to see your posts here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your posts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="text-center space-y-4">
          <AlertTriangle size={32} className="mx-auto text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center">
            <FileText size={28} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              No Posts Yet
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
              No posts generated yet. Your Blueprint is still processing. Check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Progress bar percentages
  const total = posts.length;
  const finalizedPct = Math.round((finalizedCount / total) * 100);
  const readyPct = Math.round((readyCount / total) * 100);
  const reviewPct = Math.round((needsReviewCount / total) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          My LinkedIn Posts
        </h1>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {finalizedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {finalizedCount} Finalized
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            {readyCount} Ready
          </span>
          {needsReviewCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {needsReviewCount} Needs Review
            </span>
          )}
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {posts.length} total posts
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
          {finalizedPct > 0 && (
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${finalizedPct}%` }}
            />
          )}
          {readyPct > 0 && (
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${readyPct}%` }}
            />
          )}
          {reviewPct > 0 && (
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${reviewPct}%` }}
            />
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1 border border-zinc-200 dark:border-zinc-700/50">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'finalized', label: 'Finalized' },
              { key: 'ready', label: 'Ready to Post' },
              { key: 'needs-review', label: 'Needs Review' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === key
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all"
          />
        </div>
      </div>

      {/* Results count */}
      {(filter !== 'all' || searchQuery.trim()) && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
          Showing {filteredPosts.length} of {posts.length} posts
        </p>
      )}

      {/* Posts List */}
      <div className="space-y-3">
        {paginatedPosts.map((post) => {
          const isExpanded = expandedPostId === post.id;
          const isCopied = copiedPostId === post.id;
          const isFinalized = !!post.finalizedContent;
          const isReady = post.postReady && !post.toFix;
          const actionItemCount = countActionItems(post.actionItems);
          const displayContent = post.finalizedContent || post.postContent;

          return (
            <div
              key={post.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            >
              {/* Post Header (always visible) */}
              <div className="flex items-center gap-4 p-4">
                <button
                  onClick={() => toggleExpand(post.id)}
                  className="flex items-center gap-4 flex-1 min-w-0 text-left group"
                >
                  {/* Post number */}
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      #{post.number ?? '?'}
                    </span>
                  </div>

                  {/* Title + preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {post.name || `Post #${post.number ?? '?'}`}
                      </h3>
                      {isFinalized ? (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Finalized
                        </span>
                      ) : isReady ? (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          Ready
                        </span>
                      ) : post.toFix ? (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Needs Review
                        </span>
                      ) : null}
                      {post.toFix && actionItemCount > 0 && (
                        <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
                          {actionItemCount} action item{actionItemCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {post.firstSentence && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate leading-relaxed">
                        {post.firstSentence}
                      </p>
                    )}
                  </div>

                  {/* Expand icon */}
                  <div className="shrink-0 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Finalize button (in header, always visible for needs-review posts) */}
                {post.toFix && studentId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFinalizerPostId(post.id);
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all"
                  >
                    <Sparkles size={12} />
                    Finalize
                  </button>
                )}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-zinc-200 dark:border-zinc-800">
                  {/* Action items callout */}
                  {post.toFix && post.actionItems && (
                    <div className="mx-4 mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                        <div>
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                            Action Items
                          </p>
                          <p className="text-xs text-amber-700/80 dark:text-amber-300/70 leading-relaxed whitespace-pre-wrap">
                            {post.actionItems}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Post content */}
                  <div className="p-4">
                    {isFinalized && (
                      <p className="text-[10px] font-medium text-blue-500 dark:text-blue-400 mb-1.5 uppercase tracking-wide">
                        Finalized Version
                      </p>
                    )}
                    {displayContent ? (
                      <div
                        className={`rounded-lg p-4 border ${
                          isFinalized
                            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30'
                            : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/50'
                        }`}
                      >
                        <pre className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                          {displayContent}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                        No content available for this post.
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  {displayContent && (
                    <div className="px-4 pb-4 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(post.id, displayContent);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                          isCopied
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                            : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <CheckCheck size={14} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copy to Clipboard
                          </>
                        )}
                      </button>
                      {post.toFix && studentId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFinalizerPostId(post.id);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all"
                        >
                          <Sparkles size={14} />
                          Finalize with AI
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No results from search/filter */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <Search size={24} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No posts match your current filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pb-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                page === currentPage
                  ? 'bg-violet-500 text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Post Finalizer Panel */}
      {finalizerPost && studentId && (
        <PostFinalizerPanel
          post={finalizerPost}
          studentId={studentId}
          onClose={() => setFinalizerPostId(null)}
          onSaved={handleFinalizerSaved}
        />
      )}
    </div>
  );
};

export default MyPosts;
