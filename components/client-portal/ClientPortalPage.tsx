import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { DfyEngagement, DfyDeliverable } from '../../services/dfy-service';
import { getEngagementBySlug, getDeliverables } from '../../services/dfy-service';
import DeliverableCard from './DeliverableCard';

// ── Category config ────────────────────────────────────
const CATEGORIES = ['onboarding', 'content', 'funnel', 'outbound'] as const;

const CATEGORY_HEADINGS: Record<string, string> = {
  onboarding: 'Onboarding',
  content: 'Content',
  funnel: 'Lead Magnet & Funnel',
  outbound: 'Outbound & DMs',
};

// Status sort priority (lower = shown first)
const STATUS_PRIORITY: Record<string, number> = {
  review: 0,
  in_progress: 1,
  pending: 2,
  approved: 3,
  completed: 4,
};

function statusSort(a: DfyDeliverable, b: DfyDeliverable): number {
  return (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
}

// ── Component ──────────────────────────────────────────
const ClientPortalPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const [engagement, setEngagement] = useState<DfyEngagement | null>(null);
  const [deliverables, setDeliverables] = useState<DfyDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isWelcome = searchParams.get('welcome') === 'true';

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function load() {
      try {
        const eng = await getEngagementBySlug(slug!);
        if (cancelled) return;

        if (!eng) {
          setEngagement(null);
          setLoading(false);
          return;
        }

        setEngagement(eng);

        const dels = await getDeliverables(eng.id);
        if (cancelled) return;
        setDeliverables(dels);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
        <p className="text-sm text-gray-500 dark:text-zinc-400 animate-pulse">Loading portal...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">Error</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  // ── Not-found state ────────────────────────────────
  if (!engagement) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">Not Found</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            This portal link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  // ── Progress calculation ───────────────────────────
  const total = deliverables.length;
  const doneCount = deliverables.filter(
    (d) => d.status === 'approved' || d.status === 'completed'
  ).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6">
        {/* ── Header ─────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">
              Client Portal
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
              {engagement.client_company || engagement.client_name}
            </h1>
            {engagement.client_company && (
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                {engagement.client_name}
              </p>
            )}
          </div>
          <span className="text-xs font-medium text-gray-400 dark:text-zinc-500 pt-1">
            Modern Agency Sales
          </span>
        </div>

        {/* ── Welcome banner (conditional) ────────── */}
        {isWelcome && (
          <div className="mb-6 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              Welcome to your Client Portal
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              This is where you can track the progress of your deliverables. Bookmark this page for
              easy access.
            </p>
          </div>
        )}

        {/* ── Progress bar ────────────────────────── */}
        {total > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
              <span>
                {doneCount} of {total} deliverables complete
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 dark:bg-green-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Deliverables by category ────────────── */}
        {total > 0 ? (
          <div className="space-y-8">
            {CATEGORIES.map((cat) => {
              const items = deliverables.filter((d) => d.category === cat).sort(statusSort);

              if (items.length === 0) return null;

              return (
                <section key={cat}>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                    {CATEGORY_HEADINGS[cat]}
                  </h2>
                  <div className="space-y-3">
                    {items.map((d) => (
                      <DeliverableCard key={d.id} deliverable={d} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* ── Empty state ──────────────────────── */
          <div className="text-center py-16">
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Your deliverables are being set up.
            </p>
          </div>
        )}

        {/* ── Footer ──────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Questions? Contact us at{' '}
            <a
              href="mailto:tim@modernagencysales.com"
              className="underline hover:text-gray-600 dark:hover:text-zinc-300"
            >
              tim@modernagencysales.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientPortalPage;
