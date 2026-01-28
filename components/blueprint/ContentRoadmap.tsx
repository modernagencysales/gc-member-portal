import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, FileText, X } from 'lucide-react';
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

const INITIAL_DISPLAY_COUNT = 12;

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
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
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
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded">
        Ready
      </span>
    );
  }

  if (toFix) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded">
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
        <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
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
        className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-zinc-800 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge postReady={post.postReady} toFix={post.toFix} />
              {post.number && (
                <span className="text-xs text-zinc-500 font-medium">#{post.number}</span>
              )}
            </div>
            {post.name && <h3 className="text-lg font-semibold text-zinc-100">{post.name}</h3>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {post.postContent && <CopyButton text={post.postContent} />}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
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
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <pre className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                {post.postContent}
              </pre>
            </div>
          </div>

          {/* Action Items - Right (1/3) */}
          {hasActionItems && (
            <div>
              <h4 className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-3">
                Action Items
              </h4>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
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
// Post Card Component
// ============================================

interface PostCardProps {
  post: ProspectPost;
  onOpen: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onOpen }) => {
  const hasContent = post.postContent && post.postContent.trim() !== '';
  const hasFirstSentence = post.firstSentence && post.firstSentence.trim() !== '';

  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors cursor-pointer"
      onClick={hasContent ? onOpen : undefined}
    >
      <div className="p-4">
        {/* Top Row: Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <StatusBadge postReady={post.postReady} toFix={post.toFix} />
          {post.number && <span className="text-xs text-zinc-500 font-medium">#{post.number}</span>}
        </div>

        {/* Title */}
        {post.name && (
          <h4 className="font-semibold text-zinc-100 mb-2 line-clamp-2" title={post.name}>
            {post.name}
          </h4>
        )}

        {/* Preview Text */}
        {hasFirstSentence && (
          <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{post.firstSentence}</p>
        )}

        {/* View prompt */}
        {hasContent && <span className="text-sm font-medium text-violet-400">View post →</span>}
      </div>
    </div>
  );
};

// ============================================
// Empty State Component
// ============================================

const EmptyState: React.FC = () => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
    <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-zinc-300 mb-2">No Posts Yet</h3>
    <p className="text-sm text-zinc-500">
      Your personalized content roadmap will appear here once generated.
    </p>
  </div>
);

// ============================================
// ContentRoadmap Component
// ============================================

const ContentRoadmap: React.FC<ContentRoadmapProps> = ({ posts }) => {
  const [selectedPost, setSelectedPost] = useState<ProspectPost | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Sort posts by number if available, otherwise by creation date
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.number !== undefined && b.number !== undefined) {
      return a.number - b.number;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Determine how many posts to display
  const displayedPosts = showAll ? sortedPosts : sortedPosts.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMorePosts = sortedPosts.length > INITIAL_DISPLAY_COUNT;
  const remainingCount = sortedPosts.length - INITIAL_DISPLAY_COUNT;

  // Count ready posts
  const readyCount = posts.filter((p) => p.postReady).length;

  // Don't render if there are no posts
  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-100">60 Days of Content, Ready to Post</h2>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-2xl font-bold text-zinc-100">60 Days of Content, Ready to Post</h2>
        <span className="text-sm text-zinc-400">
          {readyCount > 0 ? (
            <>
              <span className="text-green-400 font-medium">{readyCount}</span> of {posts.length}{' '}
              posts ready for you
            </>
          ) : (
            <>{posts.length} posts ready for you</>
          )}
        </span>
      </div>

      <p className="text-zinc-400 leading-relaxed">
        Every post is written in your voice and designed to build authority with your target buyer.
        Copy, customize, and post.
      </p>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedPosts.map((post) => (
          <PostCard key={post.id} post={post} onOpen={() => setSelectedPost(post)} />
        ))}
      </div>

      {/* Show More / Show Less Button */}
      {hasMorePosts && (
        <div className="text-center pt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 rounded-lg transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show fewer posts
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {remainingCount} more {remainingCount === 1 ? 'post' : 'posts'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
};

export default ContentRoadmap;
