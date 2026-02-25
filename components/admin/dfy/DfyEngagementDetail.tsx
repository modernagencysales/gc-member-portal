import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Lock,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronRight,
  Loader2,
  Mail,
  MessageSquare,
  Eye,
  Send,
  Download,
  FileText,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { queryKeys } from '../../../lib/queryClient';
import {
  fetchDfyEngagementById,
  fetchDfyDeliverables,
  fetchDfyActivityLog,
  fetchAutomationRuns,
  fetchAdminAutomationOutput,
  updateEngagement,
  updateDeliverable,
  retriggerOnboarding,
  triggerAutomation,
  retryAutomation,
  syncPlaybooks,
  resendMagicLink,
  postEngagementUpdate,
  fetchIntakeFileUrls,
  deleteEngagement,
} from '../../../services/dfy-admin-supabase';
import type {
  DfyAdminEngagement,
  DfyAdminDeliverable,
  DfyActivityEntry,
  DfyAutomationRun,
  DfyAutomationOutput,
  ProfileRewriteOutput,
  OnboardingChecklist,
  DfyCommunicationPreference,
  DfyEngagementStatus,
} from '../../../types/dfy-admin-types';
import {
  DELIVERABLE_STATUS_CONFIGS,
  DEFAULT_ONBOARDING_CHECKLIST,
} from '../../../types/dfy-admin-types';
import DfyStatusBadge from './DfyStatusBadge';

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

const DfyEngagementDetail: React.FC = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [editingLinkedIn, setEditingLinkedIn] = useState(false);
  const [linkedInDraft, setLinkedInDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'profile_rewrite'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ---- Queries ----
  const { data: engagement, isLoading: engLoading } = useQuery({
    queryKey: queryKeys.dfyEngagement(engagementId!),
    queryFn: () => fetchDfyEngagementById(engagementId!),
    enabled: !!engagementId,
  });

  const { data: deliverables, isLoading: delsLoading } = useQuery({
    queryKey: queryKeys.dfyDeliverables(engagementId!),
    queryFn: () => fetchDfyDeliverables(engagementId!),
    enabled: !!engagementId,
  });

  const { data: activity } = useQuery({
    queryKey: queryKeys.dfyActivity(engagementId!),
    queryFn: () => fetchDfyActivityLog(engagementId!),
    enabled: !!engagementId,
  });

  const { data: automationRuns = [] } = useQuery({
    queryKey: queryKeys.dfyAutomationRuns(engagementId!),
    queryFn: () => fetchAutomationRuns(engagementId!),
    enabled: !!engagementId,
  });

  const { data: profileRewriteOutput, isLoading: outputLoading } = useQuery({
    queryKey: queryKeys.dfyAutomationOutput(engagementId!, 'profile_rewrite'),
    queryFn: () => fetchAdminAutomationOutput(engagementId!, 'profile_rewrite'),
    enabled: !!engagementId,
  });

  // ---- Derived: profile rewrite deliverable (for tab visibility) ----
  const profileRewriteDeliverable = useMemo(
    () => deliverables?.find((d) => d.automation_type === 'profile_rewrite') ?? null,
    [deliverables]
  );

  const showProfileRewriteTab = !!profileRewriteDeliverable;

  // ---- Manual refresh (for header button) ----
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagement(engagementId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyAutomationRuns(engagementId!) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.dfyAutomationOutput(engagementId!, 'profile_rewrite'),
    });
  };

  // ---- Mutations ----
  const engagementMutation = useMutation({
    mutationFn: (data: {
      status?: DfyEngagementStatus;
      onboarding_checklist?: Record<string, unknown>;
      communication_preference?: DfyCommunicationPreference;
      linkedin_url?: string | null;
    }) => updateEngagement(engagementId!, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dfyEngagement(engagementId!) });
      const previousEngagement = queryClient.getQueryData<DfyAdminEngagement>(
        queryKeys.dfyEngagement(engagementId!)
      );
      queryClient.setQueryData<DfyAdminEngagement | null>(
        queryKeys.dfyEngagement(engagementId!),
        (old) => (old ? ({ ...old, ...newData } as DfyAdminEngagement) : old)
      );
      return { previousEngagement };
    },
    onError: (err: Error, _newData, context) => {
      if (context?.previousEngagement) {
        queryClient.setQueryData(
          queryKeys.dfyEngagement(engagementId!),
          context.previousEngagement
        );
      }
      setError(err.message);
    },
    onSuccess: () => setError(null),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagement(engagementId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagements() });
    },
  });

  const deliverableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string } }) =>
      updateDeliverable(id, data),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId!) });
    },
    onError: (err: Error) => setError(err.message),
  });

  const retriggerMutation = useMutation({
    mutationFn: () => retriggerOnboarding(engagementId!),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagement(engagementId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagements() });
    },
    onError: (err: Error) => setError(err.message),
  });

  const triggerMutation = useMutation({
    mutationFn: triggerAutomation,
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyAutomationRuns(engagementId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId!) });
    },
    onError: (err: Error) => setError(err.message),
  });

  const retryMutation = useMutation({
    mutationFn: retryAutomation,
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyAutomationRuns(engagementId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId!) });
    },
    onError: (err: Error) => setError(err.message),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncPlaybooks(engagementId!),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId!) });
    },
    onError: (err: Error) => setError(err.message),
  });

  const magicLinkMutation = useMutation({
    mutationFn: () => resendMagicLink(engagementId!),
    onSuccess: () => setError(null),
    onError: (err: Error) => setError(err.message),
  });

  const postUpdateMutation = useMutation({
    mutationFn: (message: string) => postEngagementUpdate(engagementId!, message),
    onSuccess: () => {
      setError(null);
      setUpdateMessage('');
      setShowUpdateForm(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId!) });
    },
    onError: (err: Error) => setError(err.message),
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtmconductor.com'}/api/dfy/admin/engagements/${engagementId}/upgrade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': import.meta.env.VITE_ADMIN_API_KEY,
          },
          body: JSON.stringify({ monthly_rate: 250000 }),
        }
      );
      if (!res.ok) throw new Error('Upgrade failed');
      return res.json();
    },
    onSuccess: () => {
      refreshAll();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEngagement(engagementId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagements() });
      navigate('/admin/dfy');
    },
    onError: (err: Error) => {
      setError(err.message);
      setShowDeleteConfirm(false);
    },
  });

  // ---- Deliverables grouped by milestone ----
  const milestoneGroups = useMemo(() => {
    const groups = new Map<string | null, DfyAdminDeliverable[]>();
    if (!deliverables) return groups;
    for (const del of deliverables) {
      const key = del.milestone_id || null;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(del);
    }
    return groups;
  }, [deliverables]);

  // ---- Loading / not found ----
  if (engLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="p-8 text-center">
        <p className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Engagement not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/dfy')}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {engagement.client_name}
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {engagement.client_company}
          </p>
        </div>
        {engagement.engagement_type === 'intro_offer' && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            Intro Offer
          </span>
        )}
        <DfyStatusBadge status={engagement.status} type="engagement" />
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 rounded-lg transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-500"
          title="Delete engagement"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={refreshAll}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tab bar (only when profile_rewrite deliverable exists) */}
      {showProfileRewriteTab && (
        <div className={`flex border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? isDarkMode
                  ? 'border-violet-500 text-violet-400'
                  : 'border-violet-600 text-violet-600'
                : isDarkMode
                  ? 'border-transparent text-zinc-500 hover:text-zinc-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('profile_rewrite')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile_rewrite'
                ? isDarkMode
                  ? 'border-violet-500 text-violet-400'
                  : 'border-violet-600 text-violet-600'
                : isDarkMode
                  ? 'border-transparent text-zinc-500 hover:text-zinc-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Profile Rewrite Review
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            isDarkMode
              ? 'bg-red-900/20 border-red-800 text-red-300'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          {/* 2. Overview Card */}
          <div
            className={`rounded-xl border p-6 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <h3
              className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoPair label="Client Email" value={engagement.client_email} />
              <InfoPair
                label="Monthly Rate"
                value={`${formatCurrency(engagement.monthly_rate)}/mo`}
              />
              <InfoPair
                label="Start Date"
                value={
                  engagement.start_date
                    ? new Date(engagement.start_date).toLocaleDateString()
                    : '\u2014'
                }
              />
              <InfoPair
                label="Stripe Subscription"
                value={
                  engagement.stripe_subscription_id
                    ? `${engagement.stripe_subscription_id.slice(0, 20)}...`
                    : '\u2014'
                }
              />
              <InfoPair
                label="Portal Link"
                value={engagement.portal_slug}
                href={`/client/${engagement.portal_slug}`}
              />

              {/* LinkedIn URL — editable inline */}
              <div>
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                >
                  LinkedIn URL
                </p>
                {editingLinkedIn ? (
                  <input
                    type="url"
                    autoFocus
                    value={linkedInDraft}
                    onChange={(e) => setLinkedInDraft(e.target.value)}
                    onBlur={() => {
                      const trimmed = linkedInDraft.trim();
                      const current = engagement.linkedin_url || '';
                      if (trimmed !== current) {
                        engagementMutation.mutate({ linkedin_url: trimmed || null });
                      }
                      setEditingLinkedIn(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      if (e.key === 'Escape') {
                        setLinkedInDraft(engagement.linkedin_url || '');
                        setEditingLinkedIn(false);
                      }
                    }}
                    placeholder="https://linkedin.com/in/..."
                    className={`mt-0.5 w-full text-sm font-medium px-2 py-1 rounded border ${
                      isDarkMode
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500'
                        : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
                    } focus:ring-1 focus:ring-violet-500 focus:border-transparent`}
                  />
                ) : engagement.linkedin_url ? (
                  <a
                    href={engagement.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm font-medium flex items-center gap-1 mt-0.5 cursor-pointer ${
                      isDarkMode
                        ? 'text-violet-400 hover:text-violet-300'
                        : 'text-violet-600 hover:text-violet-700'
                    }`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey) return; // allow cmd+click to open link
                      e.preventDefault();
                      setLinkedInDraft(engagement.linkedin_url || '');
                      setEditingLinkedIn(true);
                    }}
                  >
                    {engagement.linkedin_url
                      .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
                      .replace(/\/$/, '') || engagement.linkedin_url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setLinkedInDraft('');
                      setEditingLinkedIn(true);
                    }}
                    className={`text-sm mt-0.5 ${
                      isDarkMode
                        ? 'text-zinc-500 hover:text-zinc-400'
                        : 'text-zinc-400 hover:text-zinc-500'
                    }`}
                  >
                    + Add LinkedIn URL
                  </button>
                )}
              </div>

              <InfoPair
                label="Linear Project"
                value={engagement.linear_project_id ? 'View Project' : '\u2014'}
                href={
                  engagement.linear_project_id
                    ? `https://linear.app/modern-agency-sales/project/${engagement.linear_project_id}`
                    : undefined
                }
              />
              <InfoPair label="Slack Channel" value={engagement.slack_channel_id || '\u2014'} />

              {/* Communication Preference */}
              <div>
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                >
                  Communication
                </p>
                <select
                  value={engagement.communication_preference || 'email'}
                  onChange={(e) =>
                    engagementMutation.mutate({
                      communication_preference: e.target.value as DfyCommunicationPreference,
                    })
                  }
                  disabled={engagementMutation.isPending}
                  className={`mt-0.5 text-sm font-medium px-2 py-1 rounded border ${
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                      : 'bg-white border-zinc-300 text-zinc-900'
                  } disabled:opacity-50`}
                >
                  <option value="email">Email</option>
                  <option value="slack">Slack</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            {/* Resend Magic Link */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => magicLinkMutation.mutate()}
                disabled={magicLinkMutation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                {magicLinkMutation.isPending
                  ? 'Sending...'
                  : magicLinkMutation.isSuccess
                    ? 'Magic link sent!'
                    : 'Resend Magic Link'}
              </button>
            </div>
          </div>

          {/* 3. Action Buttons */}
          <ActionButtons
            status={engagement.status}
            isLoading={engagementMutation.isPending || retriggerMutation.isPending}
            onRetrigger={() => retriggerMutation.mutate()}
            onPause={() => engagementMutation.mutate({ status: 'paused' })}
            onResume={() => engagementMutation.mutate({ status: 'active' })}
            onSyncPlaybooks={() => syncMutation.mutate()}
            isSyncing={syncMutation.isPending}
            engagementType={engagement.engagement_type}
            onUpgrade={() => upgradeMutation.mutate()}
            isUpgrading={upgradeMutation.isPending}
          />

          {/* 3.5 Intake Form Responses */}
          <IntakeFormSection engagement={engagement} />

          {/* 4. Onboarding Checklist */}
          <OnboardingChecklistSection
            engagement={engagement}
            isUpdating={engagementMutation.isPending}
            onUpdate={(checklist) => engagementMutation.mutate({ onboarding_checklist: checklist })}
            onInitialize={() =>
              engagementMutation.mutate({
                onboarding_checklist: DEFAULT_ONBOARDING_CHECKLIST as unknown as Record<
                  string,
                  unknown
                >,
              })
            }
          />

          {/* 5. Deliverables (grouped by milestone) */}
          <div
            className={`rounded-xl border ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div
              className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
            >
              <h3
                className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
              >
                Deliverables
              </h3>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {delsLoading ? (
                <div className="px-4 py-6 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  <span className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Loading deliverables...
                  </span>
                </div>
              ) : (
                <>
                  {Array.from(milestoneGroups.entries()).map(([milestoneId, items]) => (
                    <MilestoneSection
                      key={milestoneId || '__ungrouped'}
                      milestoneId={milestoneId}
                      items={items}
                      allDeliverables={deliverables || []}
                      onStatusChange={(id, status) =>
                        deliverableMutation.mutate({ id, data: { status } })
                      }
                      onTriggerAutomation={(id) => triggerMutation.mutate(id)}
                      isUpdating={deliverableMutation.isPending}
                      isTriggering={triggerMutation.isPending}
                    />
                  ))}
                  {(!deliverables || deliverables.length === 0) && (
                    <p
                      className={`px-4 py-6 text-sm text-center ${
                        isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                      }`}
                    >
                      No deliverables yet
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 6. Activity Log */}
          <div
            className={`rounded-xl border ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div
              className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
            >
              <h3
                className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
              >
                Activity Log
              </h3>
              <button
                onClick={() => setShowUpdateForm(!showUpdateForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Send className="w-3 h-3" />
                Post Update
              </button>
            </div>
            {showUpdateForm && (
              <div
                className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
              >
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Write an update visible to the client..."
                  rows={2}
                  className={`w-full text-sm px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
                  } focus:ring-1 focus:ring-blue-500 focus:border-transparent`}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() =>
                      updateMessage.trim() && postUpdateMutation.mutate(updateMessage.trim())
                    }
                    disabled={!updateMessage.trim() || postUpdateMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {postUpdateMutation.isPending ? 'Posting...' : 'Send to Client'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUpdateForm(false);
                      setUpdateMessage('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isDarkMode
                        ? 'text-zinc-400 hover:bg-zinc-800'
                        : 'text-zinc-500 hover:bg-zinc-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <span
                    className={`text-[11px] ml-auto ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                  >
                    This will appear in the client portal
                  </span>
                </div>
              </div>
            )}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(activity || []).length === 0 ? (
                <p
                  className={`px-4 py-6 text-sm text-center ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  No activity yet
                </p>
              ) : (
                (activity || []).map((entry) => <ActivityRow key={entry.id} entry={entry} />)
              )}
            </div>
          </div>

          {/* 7. Automation History */}
          {automationRuns.length > 0 && (
            <AutomationHistoryPanel
              runs={automationRuns}
              onRetry={(runId) => retryMutation.mutate(runId)}
              isRetrying={retryMutation.isPending}
            />
          )}
        </>
      )}

      {/* Profile Rewrite Review tab */}
      {activeTab === 'profile_rewrite' && profileRewriteDeliverable && (
        <ProfileRewriteReviewPanel
          output={profileRewriteOutput}
          isLoading={outputLoading}
          deliverable={profileRewriteDeliverable}
          onApproveAndShip={(deliverableId) =>
            deliverableMutation.mutate({ id: deliverableId, data: { status: 'review' } })
          }
          isShipping={deliverableMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`rounded-xl p-6 max-w-md w-full mx-4 shadow-xl ${
              isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              Delete Engagement
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Are you sure you want to permanently delete the engagement for{' '}
              <strong>{engagement.client_name}</strong>? This will remove all deliverables,
              automation runs, activity logs, and archive the Linear project. This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Sub-components
// ============================================

function InfoPair({ label, value, href }: { label: string; value: string; href?: string }) {
  const { isDarkMode } = useTheme();
  return (
    <div>
      <p
        className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
      >
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm font-medium flex items-center gap-1 mt-0.5 ${
            isDarkMode
              ? 'text-violet-400 hover:text-violet-300'
              : 'text-violet-600 hover:text-violet-700'
          }`}
        >
          {value}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <p
          className={`text-sm font-medium mt-0.5 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function ActionButtons({
  status,
  isLoading,
  onRetrigger,
  onPause,
  onResume,
  onSyncPlaybooks,
  isSyncing,
  engagementType,
  onUpgrade,
  isUpgrading,
}: {
  status: string;
  isLoading: boolean;
  onRetrigger: () => void;
  onPause: () => void;
  onResume: () => void;
  onSyncPlaybooks: () => void;
  isSyncing: boolean;
  engagementType?: string;
  onUpgrade?: () => void;
  isUpgrading?: boolean;
}) {
  const showActions = status === 'onboarding' || status === 'active' || status === 'paused';

  return (
    <div className="flex flex-wrap gap-3">
      {showActions && status === 'onboarding' && (
        <button
          onClick={onRetrigger}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {isLoading ? 'Re-triggering...' : 'Re-trigger Onboarding'}
        </button>
      )}
      {showActions && status === 'active' && (
        <button
          onClick={onPause}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 transition-colors"
        >
          <Pause className="w-4 h-4" />
          {isLoading ? 'Pausing...' : 'Pause'}
        </button>
      )}
      {showActions && status === 'paused' && (
        <button
          onClick={onResume}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Play className="w-4 h-4" />
          {isLoading ? 'Resuming...' : 'Resume'}
        </button>
      )}
      <button
        onClick={onSyncPlaybooks}
        disabled={isSyncing}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        <BookOpen className="w-4 h-4" />
        {isSyncing ? 'Syncing...' : 'Sync Playbooks'}
      </button>
      {engagementType === 'intro_offer' &&
        (status === 'active' || status === 'completed') &&
        onUpgrade && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Convert this intro offer to a full DFY engagement? This will add additional deliverables and set the monthly rate to $2,500/mo.'
                )
              ) {
                onUpgrade!();
              }
            }}
            disabled={isUpgrading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <ArrowUpCircle className="w-4 h-4" />
            {isUpgrading ? 'Upgrading...' : 'Convert to Full DFY'}
          </button>
        )}
    </div>
  );
}

function OnboardingChecklistSection({
  engagement,
  isUpdating,
  onUpdate,
  onInitialize,
}: {
  engagement: DfyAdminEngagement;
  isUpdating: boolean;
  onUpdate: (checklist: Record<string, unknown>) => void;
  onInitialize: () => void;
}) {
  const { isDarkMode } = useTheme();
  const checklist = engagement.onboarding_checklist as OnboardingChecklist | null;
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const completedCount = checklist
    ? Object.values(checklist).filter((item) => item.completed).length
    : 0;
  const totalCount = checklist ? Object.keys(checklist).length : 0;

  const toggleItem = (key: string) => {
    if (!checklist) return;
    const updated = {
      ...checklist,
      [key]: { ...checklist[key], completed: !checklist[key].completed },
    };
    onUpdate(updated as unknown as Record<string, unknown>);
  };

  const commitNotes = (key: string, notes: string) => {
    if (!checklist) return;
    const serverNotes = checklist[key]?.notes || '';
    if (notes === serverNotes) return;
    const updated = { ...checklist, [key]: { ...checklist[key], notes } };
    onUpdate(updated as unknown as Record<string, unknown>);
  };

  const handleNotesBlur = (key: string, value: string) => {
    commitNotes(key, value);
    setLocalNotes((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div
      className={`rounded-xl border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        <div>
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Onboarding Checklist
          </h3>
          {checklist && (
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {completedCount} of {totalCount} complete
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {engagement.linkedin_connected_at ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              LinkedIn Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              LinkedIn Not Connected
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        {!checklist ? (
          <div className="text-center py-4">
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              No checklist initialized for this engagement.
            </p>
            <button
              onClick={onInitialize}
              disabled={isUpdating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Initializing...' : 'Initialize Checklist'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(checklist).map(([key, item]) => (
              <div
                key={key}
                className={`flex items-start gap-3 p-2 rounded-lg ${
                  isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(key)}
                  disabled={isUpdating}
                  className="mt-1 w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      item.completed
                        ? isDarkMode
                          ? 'text-zinc-500 line-through'
                          : 'text-zinc-400 line-through'
                        : isDarkMode
                          ? 'text-zinc-200'
                          : 'text-zinc-900'
                    }`}
                  >
                    {item.label}
                  </p>
                  <input
                    type="text"
                    placeholder="Notes..."
                    value={localNotes[key] ?? item.notes ?? ''}
                    onChange={(e) => setLocalNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                    onBlur={(e) => handleNotesBlur(key, e.target.value)}
                    className={`mt-1 w-full text-xs px-2 py-1 rounded border ${
                      isDarkMode
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-600'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 placeholder:text-zinc-400'
                    } focus:ring-1 focus:ring-violet-500 focus:border-transparent`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MilestoneSection({
  milestoneId,
  items,
  allDeliverables,
  onStatusChange,
  onTriggerAutomation,
  isUpdating,
  isTriggering,
}: {
  milestoneId: string | null;
  items: DfyAdminDeliverable[];
  allDeliverables: DfyAdminDeliverable[];
  onStatusChange: (id: string, status: string) => void;
  onTriggerAutomation: (id: string) => void;
  isUpdating: boolean;
  isTriggering: boolean;
}) {
  const { isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(true);

  const completedCount = items.filter((d) => d.status === 'completed').length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const label = milestoneId || 'Ungrouped';

  return (
    <div className="p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full text-left mb-3 ${
          isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
        }`}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        <h4 className="text-xs font-semibold uppercase tracking-wider flex-1">{label}</h4>
        <span className={`text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {completedCount}/{totalCount}
        </span>
      </button>

      {/* Progress bar */}
      <div className={`h-1.5 rounded-full mb-3 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {expanded && (
        <div className="space-y-2">
          {items.map((d) => (
            <DeliverableRow
              key={d.id}
              deliverable={d}
              allDeliverables={allDeliverables}
              onStatusChange={(status) => onStatusChange(d.id, status)}
              onTriggerAutomation={() => onTriggerAutomation(d.id)}
              isUpdating={isUpdating}
              isTriggering={isTriggering}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AutomationStatusBadge({ status }: { status: string }) {
  if (!status || status === 'none') return null;

  const configs: Record<string, { label: string; classes: string; spinning?: boolean }> = {
    pending: {
      label: 'Pending',
      classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    running: {
      label: 'Running',
      classes: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      spinning: true,
    },
    completed: {
      label: 'Auto-completed',
      classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    failed: {
      label: 'Failed',
      classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.classes}`}
    >
      {cfg.spinning && <Loader2 className="w-3 h-3 animate-spin" />}
      {cfg.label}
    </span>
  );
}

function DeliverableRow({
  deliverable,
  allDeliverables,
  onStatusChange,
  onTriggerAutomation,
  isUpdating,
  isTriggering,
}: {
  deliverable: DfyAdminDeliverable;
  allDeliverables: DfyAdminDeliverable[];
  onStatusChange: (status: string) => void;
  onTriggerAutomation: () => void;
  isUpdating: boolean;
  isTriggering: boolean;
}) {
  const { isDarkMode } = useTheme();
  const statuses = Object.keys(DELIVERABLE_STATUS_CONFIGS);

  // Look up dependency names
  const dependencyNames = useMemo(() => {
    if (!deliverable.depends_on || deliverable.depends_on.length === 0) return [];
    return deliverable.depends_on.map((depId) => {
      const dep = allDeliverables.find((d) => d.id === depId);
      return dep ? dep.name : depId;
    });
  }, [deliverable.depends_on, allDeliverables]);

  const canTriggerAutomation =
    deliverable.automation_type &&
    (deliverable.automation_status === 'pending' || deliverable.automation_status === 'failed');

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        isDarkMode ? 'bg-zinc-800/30' : 'bg-zinc-50'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {deliverable.name}
          </p>
          <AutomationStatusBadge status={deliverable.automation_status} />
          {deliverable.playbook_url && (
            <a
              href={deliverable.playbook_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open playbook"
              className={`${
                isDarkMode
                  ? 'text-indigo-400 hover:text-indigo-300'
                  : 'text-indigo-600 hover:text-indigo-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
            </a>
          )}
          {dependencyNames.length > 0 && (
            <span
              title={`Blocked by: ${dependencyNames.join(', ')}`}
              className={`flex items-center gap-0.5 text-[10px] ${
                isDarkMode ? 'text-amber-400' : 'text-amber-600'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">
                {dependencyNames.length} dep{dependencyNames.length > 1 ? 's' : ''}
              </span>
            </span>
          )}
        </div>
        <div
          className={`flex items-center gap-3 text-[11px] mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        >
          {deliverable.assignee && <span>Assignee: {deliverable.assignee}</span>}
          {deliverable.due_date && (
            <span>Due: {new Date(deliverable.due_date).toLocaleDateString()}</span>
          )}
          {deliverable.automation_type && (
            <span className="flex items-center gap-0.5">
              <Zap className="w-3 h-3" />
              {deliverable.automation_type}
            </span>
          )}
          {deliverable.linear_issue_id && (
            <a
              href={`https://linear.app/modern-agency-sales/issue/${deliverable.linear_issue_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-0.5 ${
                isDarkMode
                  ? 'text-violet-400 hover:text-violet-300'
                  : 'text-violet-600 hover:text-violet-700'
              }`}
            >
              Linear
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {deliverable.revision_count != null && deliverable.revision_count > 0 && (
            <span className="text-orange-500">
              {deliverable.revision_count} revision{deliverable.revision_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* Revision feedback */}
        {deliverable.status === 'revision_requested' && deliverable.revision_feedback && (
          <div
            className={`mt-2 p-2 rounded-lg text-xs ${
              isDarkMode
                ? 'bg-orange-900/20 border border-orange-800/30 text-orange-300'
                : 'bg-orange-50 border border-orange-200 text-orange-800'
            }`}
          >
            <div className="flex items-center gap-1 font-semibold mb-0.5">
              <MessageSquare className="w-3 h-3" />
              Client feedback:
            </div>
            <p>{deliverable.revision_feedback}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        {canTriggerAutomation && (
          <button
            onClick={onTriggerAutomation}
            disabled={isTriggering}
            title="Run Automation"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <Zap className="w-3 h-3" />
            {isTriggering ? 'Running...' : 'Run'}
          </button>
        )}
        <select
          value={deliverable.status}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={isUpdating}
          className={`text-xs px-2 py-1.5 rounded-lg border ${
            isDarkMode
              ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
              : 'bg-white border-zinc-300 text-zinc-700'
          } disabled:opacity-50`}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {DELIVERABLE_STATUS_CONFIGS[s as keyof typeof DELIVERABLE_STATUS_CONFIGS].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AutomationHistoryPanel({
  runs,
  onRetry,
  isRetrying,
}: {
  runs: DfyAutomationRun[];
  onRetry: (runId: string) => void;
  isRetrying: boolean;
}) {
  const { isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    pending: isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    running: isDarkMode ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-100 text-violet-700',
    completed: isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
    failed: isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700',
  };

  return (
    <div
      className={`rounded-xl border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center justify-between border-b ${
          isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Automation History ({runs.length})
        </h3>
        {expanded ? (
          <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
        ) : (
          <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
        )}
      </button>
      {expanded && (
        <div className="p-4 space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isDarkMode ? 'bg-zinc-800/30' : 'bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <span
                  className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}
                >
                  {run.automation_type}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    statusColors[run.status] || statusColors.pending
                  }`}
                >
                  {run.status}
                </span>
                <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {run.created_at ? new Date(run.created_at).toLocaleDateString() : ''}
                </span>
                {run.error_log && (
                  <span
                    className="text-xs text-red-500 truncate max-w-[300px]"
                    title={run.error_log}
                  >
                    {run.error_log}
                  </span>
                )}
              </div>
              {run.status === 'failed' && (
                <button
                  onClick={() => onRetry(run.id)}
                  disabled={isRetrying}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors ml-3 flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ entry }: { entry: DfyActivityEntry }) {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
              isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {entry.action}
          </span>
          {entry.actor && (
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              by {entry.actor}
            </span>
          )}
          {entry.client_visible && (
            <span
              title="Visible to client"
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
              }`}
            >
              <Eye className="w-3 h-3" />
              Client
            </span>
          )}
        </div>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {entry.description}
        </p>
      </div>
      <span
        className={`text-[11px] flex-shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
      >
        {new Date(entry.created_at).toLocaleString()}
      </span>
    </div>
  );
}

function ProfileRewriteReviewPanel({
  output,
  isLoading,
  deliverable,
  onApproveAndShip,
  isShipping,
}: {
  output: DfyAutomationOutput | null | undefined;
  isLoading: boolean;
  deliverable: DfyAdminDeliverable;
  onApproveAndShip: (deliverableId: string) => void;
  isShipping: boolean;
}) {
  const { isDarkMode } = useTheme();

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-500" />
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Loading automation output...
        </p>
      </div>
    );
  }

  if (deliverable.automation_status === 'running') {
    return (
      <div
        className={`rounded-xl border p-6 text-center ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-500 mb-3" />
        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
          Profile rewrite is currently running...
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          This page will show the output once the automation completes.
        </p>
      </div>
    );
  }

  if (!output?.output_data) {
    return (
      <div
        className={`rounded-xl border p-6 text-center ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <AlertCircle
          className={`w-6 h-6 mx-auto mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        />
        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
          No profile rewrite output yet
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {deliverable.automation_status === 'failed'
            ? 'The last automation run failed. Try re-running from the Overview tab.'
            : 'Run the profile rewrite automation from the Overview tab.'}
        </p>
      </div>
    );
  }

  // Handle both shapes: flat { headlines, ... } or wrapped { rewrite: { headlines, ... } }
  const raw = output.output_data as Record<string, unknown>;
  const data = (raw.rewrite ? raw.rewrite : raw) as unknown as ProfileRewriteOutput;
  const alreadyShipped = ['review', 'approved', 'completed'].includes(deliverable.status);

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div
        className={`rounded-xl border p-4 flex items-center justify-between ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
            Profile Rewrite Output
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Completed {output.completed_at ? new Date(output.completed_at).toLocaleString() : ''}
          </p>
        </div>
        {alreadyShipped ? (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Shipped to Client (
            {
              DELIVERABLE_STATUS_CONFIGS[
                deliverable.status as keyof typeof DELIVERABLE_STATUS_CONFIGS
              ]?.label
            }
            )
          </span>
        ) : (
          <button
            onClick={() => onApproveAndShip(deliverable.id)}
            disabled={isShipping}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            {isShipping ? 'Shipping...' : 'Approve & Ship to Client'}
          </button>
        )}
      </div>

      {/* Headlines */}
      {data.headlines && (
        <div
          className={`rounded-xl border p-5 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            Headline Options
          </h4>
          <div className="space-y-2">
            {Object.entries(data.headlines).map(([key, value]) => (
              <div
                key={key}
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}
              >
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  {key.replace(/_/g, ' ')}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Section */}
      {data.about_section && (
        <div
          className={`rounded-xl border p-5 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            About Section
          </h4>
          <div
            className={`text-sm whitespace-pre-wrap leading-relaxed ${
              isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
            }`}
          >
            {data.about_section}
          </div>
        </div>
      )}

      {/* Featured Suggestions */}
      {data.featured_suggestions && data.featured_suggestions.length > 0 && (
        <div
          className={`rounded-xl border p-5 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            Featured Section Suggestions
          </h4>
          <ul className="space-y-2">
            {data.featured_suggestions.map((s, i) => (
              <li
                key={i}
                className={`text-sm flex items-start gap-2 ${
                  isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                }`}
              >
                <span className={`mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  &bull;
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Banner Concept */}
      {data.banner_concept && (
        <div
          className={`rounded-xl border p-5 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            Banner Concept
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
            {data.banner_concept}
          </p>
        </div>
      )}
    </div>
  );
}

function IntakeFileRow({
  file,
  engagementId,
  isDarkMode,
}: {
  file: { name: string; path?: string; size: number; type: string };
  engagementId: string;
  isDarkMode: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleDownload = async () => {
    if (url) {
      window.open(url, '_blank');
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const result = await fetchIntakeFileUrls(engagementId);
      const match = result.find((f) => f.name === file.name);
      if (match?.url) {
        setUrl(match.url);
        window.open(match.url, '_blank');
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
        isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileText
          className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        />
        <span className={`truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
          {file.name}
        </span>
        <span className={`text-xs flex-shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {(file.size / 1024).toFixed(0)} KB
        </span>
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 px-2 py-1 rounded transition-colors ${
          error
            ? 'text-red-400'
            : isDarkMode
              ? 'text-violet-400 hover:bg-zinc-700'
              : 'text-violet-600 hover:bg-zinc-100'
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {error ? 'Failed' : loading ? '' : 'Download'}
      </button>
    </div>
  );
}

function IntakeFormSection({ engagement }: { engagement: DfyAdminEngagement }) {
  const { isDarkMode } = useTheme();

  const intakeData = engagement.intake_data as {
    ideal_client?: string;
    crm_type?: string;
    crm_access?: string;
    notetaker_tool?: string;
    notetaker_other?: string;
    linkedin_url?: string;
    files?: Array<{ name: string; path: string; size: number; type: string }>;
  } | null;

  const hasFiles = (intakeData?.files?.length ?? 0) > 0;

  if (!engagement.intake_submitted_at) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Intake Form Responses
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Not yet submitted
        </p>
      </div>
    );
  }

  const notetaker = intakeData?.notetaker_tool
    ? intakeData.notetaker_tool +
      (intakeData.notetaker_other ? ` (${intakeData.notetaker_other})` : '')
    : '\u2014';

  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Intake Form Responses
        </h3>
        <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Submitted {new Date(engagement.intake_submitted_at!).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3">
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
          >
            Ideal Client
          </p>
          <p
            className={`text-sm font-medium mt-0.5 whitespace-pre-wrap ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}
          >
            {intakeData?.ideal_client || '\u2014'}
          </p>
        </div>
        <InfoPair label="CRM Type" value={intakeData?.crm_type || '\u2014'} />
        <InfoPair label="CRM Access" value={intakeData?.crm_access || '\u2014'} />
        <InfoPair label="Notetaker Tool" value={notetaker} />
        <InfoPair
          label="LinkedIn URL"
          value={
            intakeData?.linkedin_url
              ? intakeData.linkedin_url
                  .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
                  .replace(/\/$/, '')
              : '\u2014'
          }
          href={intakeData?.linkedin_url || undefined}
        />
      </div>

      {/* Files */}
      {hasFiles && (
        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
          >
            Uploaded Files ({intakeData!.files!.length})
          </p>
          <div className="space-y-1.5">
            {intakeData!.files!.map((file, i) => (
              <IntakeFileRow
                key={i}
                file={file}
                engagementId={engagement.id}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DfyEngagementDetail;
