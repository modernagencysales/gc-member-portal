import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { DfyEngagement, DfyDeliverable, DfyActivityEntry } from '../../services/dfy-service';
import {
  getEngagementBySlug,
  getDeliverables,
  getActivityLog,
  requestLinkedInConnect,
  updateClientChecklist,
  validatePortalToken,
  storePortalToken,
} from '../../services/dfy-service';
import DeliverableCard from './DeliverableCard';
import ActivityTimeline from './ActivityTimeline';
import ClientDashboard from './ClientDashboard';
import IntakeForm from './IntakeForm';
import IntroOfferIntakeWizard from './intake-wizard/IntroOfferIntakeWizard';

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
  revision_requested: 1,
  in_progress: 2,
  pending: 3,
  approved: 4,
  completed: 5,
};

function statusSort(a: DfyDeliverable, b: DfyDeliverable): number {
  return (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
}

// ── Processing state (intro offer) ───────────────────────
function ProcessingState({ clientName }: { clientName: string }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto border-4 border-violet-200 dark:border-violet-800 border-t-violet-500 rounded-full animate-spin" />
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Building your system, {clientName.split(' ')[0]}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          We're processing your data and building everything. This usually takes a few minutes.
          We'll email you when it's ready.
        </p>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────
const ClientPortalPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const [engagement, setEngagement] = useState<DfyEngagement | null>(null);
  const [deliverables, setDeliverables] = useState<DfyDeliverable[]>([]);
  const [activity, setActivity] = useState<DfyActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isWelcome = searchParams.get('welcome') === 'true';
  const linkedInJustConnected = searchParams.get('linkedin') === 'connected';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'deliverables' | 'activity'>(
    'dashboard'
  );
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [recorderTool, setRecorderTool] = useState('');
  const [recorderNotes, setRecorderNotes] = useState('');
  const [recorderSaved, setRecorderSaved] = useState(false);

  const loadData = useCallback(async (engagementId: string) => {
    const [dels, acts] = await Promise.all([
      getDeliverables(engagementId),
      getActivityLog(engagementId),
    ]);
    setDeliverables(dels);
    setActivity(acts);
  }, []);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function load() {
      try {
        // Handle magic link token from URL
        const token = searchParams.get('token');
        if (token) {
          const result = await validatePortalToken(token);
          if (!cancelled && result.valid) {
            storePortalToken(token);
          }
        }

        const eng = await getEngagementBySlug(slug!);
        if (cancelled) return;

        if (!eng) {
          setEngagement(null);
          setLoading(false);
          return;
        }

        setEngagement(eng);

        const [dels, acts] = await Promise.all([getDeliverables(eng.id), getActivityLog(eng.id)]);
        if (cancelled) return;
        setDeliverables(dels);
        setActivity(acts);
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
  }, [slug, searchParams]);

  // Reload function for after approvals or other mutations
  const reload = useCallback(() => {
    if (engagement) {
      loadData(engagement.id);
    }
  }, [engagement, loadData]);

  // Re-fetch engagement data (used after intake form submission)
  const reloadEngagement = useCallback(async () => {
    if (!slug) return;
    const eng = await getEngagementBySlug(slug);
    if (eng) {
      setEngagement(eng);
      await loadData(eng.id);
    }
  }, [slug, loadData]);

  // Optimistic handler for intake wizard completion (avoids race condition on reload)
  const handleIntakeComplete = useCallback(async () => {
    // Optimistically show processing state
    setEngagement((prev) => (prev ? { ...prev, intake_status: 'submitted' as const } : prev));
    // Also reload from DB after a short delay to get server state
    setTimeout(() => reloadEngagement(), 2000);
  }, [reloadEngagement]);

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

  // ── Intro offer intake wizard gate ──────────────────
  if (engagement.engagement_type === 'intro_offer' && engagement.intake_status === 'pending') {
    return (
      <IntroOfferIntakeWizard
        portalSlug={slug!}
        clientName={engagement.client_name}
        blueprintProspectId={engagement.blueprint_prospect_id}
        onComplete={handleIntakeComplete}
      />
    );
  }

  // ── Intro offer processing state ────────────────────
  if (
    engagement.engagement_type === 'intro_offer' &&
    (engagement.intake_status === 'submitted' || engagement.intake_status === 'processing')
  ) {
    return <ProcessingState clientName={engagement.client_name} />;
  }

  // ── Full DFY intake gate ────────────────────────────
  if (!engagement.intake_submitted_at) {
    return (
      <IntakeForm
        portalSlug={slug!}
        clientName={engagement.client_name}
        onComplete={reloadEngagement}
      />
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

        {/* ── Onboarding Steps (when status is onboarding) ── */}
        {engagement.status === 'onboarding' && (
          <div className="mb-8 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
              Onboarding Steps
            </h2>

            {/* Step 1: Connect LinkedIn */}
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {engagement.linkedin_connected_at || linkedInJustConnected ? (
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600 dark:text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-zinc-400">
                      1
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                      Connect LinkedIn
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      {engagement.linkedin_connected_at || linkedInJustConnected
                        ? 'Connected'
                        : 'Connect your LinkedIn account so we can manage your profile'}
                    </p>
                  </div>
                </div>
                {!engagement.linkedin_connected_at && !linkedInJustConnected && (
                  <button
                    onClick={async () => {
                      setLinkedInLoading(true);
                      try {
                        const { url } = await requestLinkedInConnect(slug!);
                        window.open(url, '_blank');
                      } catch {
                        // Silently handle — user can retry
                      } finally {
                        setLinkedInLoading(false);
                      }
                    }}
                    disabled={linkedInLoading}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {linkedInLoading ? 'Opening...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Recording Tool */}
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-3 mb-3">
                {recorderSaved ? (
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-zinc-400">
                    2
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                    Recording Tool
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Which tool do you use to record calls?
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ml-9">
                <select
                  value={recorderTool}
                  onChange={(e) => setRecorderTool(e.target.value)}
                  className="flex-1 text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-2 py-1.5"
                >
                  <option value="">Select tool...</option>
                  <option value="Grain">Grain</option>
                  <option value="Fireflies">Fireflies</option>
                  <option value="Otter">Otter</option>
                  <option value="Fathom">Fathom</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={recorderNotes}
                  onChange={(e) => setRecorderNotes(e.target.value)}
                  className="flex-1 text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-2 py-1.5"
                />
                <button
                  onClick={async () => {
                    if (!recorderTool) return;
                    try {
                      await updateClientChecklist(slug!, {
                        transcripts_access: {
                          completed: true,
                          notes: `${recorderTool}${recorderNotes ? ` — ${recorderNotes}` : ''}`,
                        },
                      });
                      setRecorderSaved(true);
                    } catch {
                      // Silently handle
                    }
                  }}
                  disabled={!recorderTool}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Step 3: Content Call */}
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                {engagement.onboarding_checklist?.content_call?.completed ? (
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-zinc-400">
                    3
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                    Content Call
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {engagement.onboarding_checklist?.content_call?.completed
                      ? 'Scheduled'
                      : "We'll schedule a content call to learn your voice and expertise"}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            {(() => {
              const steps = [
                !!(engagement.linkedin_connected_at || linkedInJustConnected),
                recorderSaved,
                !!engagement.onboarding_checklist?.content_call?.completed,
              ];
              const done = steps.filter(Boolean).length;
              return (
                <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
                  {done} of 3 onboarding steps complete
                </p>
              );
            })()}
          </div>
        )}

        {/* ── Progress bar ────────────────────────── */}
        {total > 0 && (
          <div className="mb-6">
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

        {/* ── Tab Navigation ──────────────────────── */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-zinc-800">
          {(['dashboard', 'deliverables', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
              }`}
            >
              {tab === 'dashboard'
                ? 'Dashboard'
                : tab === 'deliverables'
                  ? 'Deliverables'
                  : 'Activity'}
            </button>
          ))}
        </div>

        {/* ── Dashboard Tab ───────────────────────── */}
        {activeTab === 'dashboard' && slug && <ClientDashboard portalSlug={slug} />}

        {/* ── Deliverables Tab ────────────────────── */}
        {activeTab === 'deliverables' && (
          <>
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
                          <DeliverableCard
                            key={d.id}
                            deliverable={d}
                            portalSlug={slug}
                            onApproved={reload}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  Your deliverables are being set up.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Activity Tab ────────────────────────── */}
        {activeTab === 'activity' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-4">
              Recent Activity
            </h2>
            <ActivityTimeline entries={activity} />
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
