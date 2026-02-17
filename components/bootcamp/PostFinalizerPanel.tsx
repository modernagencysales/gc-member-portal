import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { X, Sparkles, Save, Copy, CheckCheck, RotateCcw, Loader2 } from 'lucide-react';
import { ProspectPost } from '../../types/blueprint-types';
import { updatePostFinalizedContent } from '../../services/blueprint-supabase';

interface PostFinalizerPanelProps {
  post: ProspectPost;
  studentId: string;
  onClose: () => void;
  onSaved: (postId: string, finalizedContent: string) => void;
}

type Phase = 'form' | 'streaming' | 'result';

function parseActionItems(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.replace(/^[\s]*[-•*\d.)\]]+[\s]*/, '').trim())
    .filter((line) => line.length > 0);
}

const PostFinalizerPanel: React.FC<PostFinalizerPanelProps> = ({
  post,
  studentId,
  onClose,
  onSaved,
}) => {
  const items = useMemo(() => parseActionItems(post.actionItems), [post.actionItems]);
  const [answers, setAnswers] = useState<string[]>(() => items.map(() => ''));
  const [phase, setPhase] = useState<Phase>('form');
  const [streamingText, setStreamingText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    setPhase('streaming');
    setStreamingText('');
    setError(null);

    // Build prompt with original post + action items and answers
    const parts = [
      'Here is the original LinkedIn post draft:\n',
      '---',
      post.postContent || '',
      '---\n',
      "Here are the action items and the user's responses:\n",
    ];

    items.forEach((item, i) => {
      parts.push(`Action item: ${item}`);
      parts.push(`Response: ${answers[i] || '(no response provided)'}\n`);
    });

    parts.push('\nPlease produce the finalized post incorporating all responses.');

    const message = parts.join('\n');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Supabase URL not configured');

      abortRef.current = new AbortController();

      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          toolSlug: 'post-finalizer',
          message,
          studentId,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate finalized post';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Non-JSON error response (e.g., proxy error)
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new globalThis.TextDecoder();
      let accumulated = '';
      let reachedDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'delta' && data.text) {
                accumulated += data.text;
                setStreamingText(accumulated);
              } else if (data.type === 'done') {
                reachedDone = true;
                setFinalText(accumulated);
                setPhase('result');
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Stream error');
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // If stream ended without a 'done' event, use what we have
      if (accumulated && !reachedDone) {
        setFinalText(accumulated);
        setPhase('result');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPhase('form');
    } finally {
      abortRef.current = null;
    }
  }, [post.postContent, items, answers, studentId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const success = await updatePostFinalizedContent(post.id, finalText);
    setSaving(false);

    if (success) {
      onSaved(post.id, finalText);
    } else {
      setError('Failed to save. Please try again.');
    }
  }, [post.id, finalText, onSaved]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(finalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = finalText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      try {
        textarea.select();
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [finalText]);

  const handleTryAgain = useCallback(() => {
    setPhase('form');
    setStreamingText('');
    setFinalText('');
    setError(null);
  }, []);

  const hasAnswers = answers.some((a) => a.trim().length > 0);

  return (
    <>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Slide-over panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col"
        style={{ animation: 'slideInRight 200ms ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Finalize Post #{post.number ?? '?'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Original post preview */}
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
              Original Post
            </p>
            <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700/50 max-h-40 overflow-y-auto">
              <pre className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                {post.postContent || 'No content'}
              </pre>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Phase: Form */}
          {phase === 'form' && (
            <div>
              {items.length > 0 ? (
                <>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wide">
                    Action Items ({items.length})
                  </p>
                  <div className="space-y-4">
                    {items.map((item, i) => (
                      <div key={i}>
                        <label className="block text-xs text-zinc-700 dark:text-zinc-300 mb-1.5 leading-relaxed">
                          {item}
                        </label>
                        <textarea
                          value={answers[i]}
                          onChange={(e) => {
                            const next = [...answers];
                            next[i] = e.target.value;
                            setAnswers(next);
                          }}
                          placeholder="Your response..."
                          rows={2}
                          className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No action items to resolve. You can generate a polished version of this post.
                </p>
              )}
            </div>
          )}

          {/* Phase: Streaming */}
          {phase === 'streaming' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Loader2 size={14} className="text-violet-500 animate-spin" />
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                  Generating finalized post...
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700/50 min-h-[120px]">
                <pre className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {streamingText || '...'}
                </pre>
              </div>
            </div>
          )}

          {/* Phase: Result */}
          {phase === 'result' && (
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                Finalized Post
              </p>
              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800/30">
                <pre className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {finalText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          {phase === 'form' && (
            <button
              onClick={handleGenerate}
              disabled={items.length > 0 && !hasAnswers}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles size={14} />
              Generate Final Post
            </button>
          )}

          {phase === 'streaming' && (
            <button
              onClick={() => {
                abortRef.current?.abort();
                setPhase('form');
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Cancel
            </button>
          )}

          {phase === 'result' && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save & Mark Ready'}
              </button>
              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleTryAgain}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                <RotateCcw size={14} />
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PostFinalizerPanel;
