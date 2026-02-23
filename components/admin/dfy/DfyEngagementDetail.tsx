import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { queryKeys } from '../../../lib/queryClient';
import {
  fetchDfyEngagementById,
  fetchDfyDeliverables,
  fetchDfyActivityLog,
  fetchAutomationRuns,
  updateEngagement,
  updateDeliverable,
  retriggerOnboarding,
  triggerAutomation,
  retryAutomation,
  syncPlaybooks,
  resendMagicLink,
  postEngagementUpdate,
} from '../../../services/dfy-admin-supabase';
import type {
  DfyAdminEngagement,
  DfyAdminDeliverable,
  DfyActivityEntry,
  DfyAutomationRun,
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

  // ---- Manual refresh (for header button) ----
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagement(engagementId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyAutomationRuns(engagementId!) });
  };

  // ---- Mutations ----
  const engagementMutation = useMutation({
    mutationFn: (data: {
      status?: DfyEngagementStatus;
      onboarding_checklist?: Record<string, unknown>;
      communication_preference?: DfyCommunicationPreference;
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
  if (engLoading || delsLoading) {
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
        <DfyStatusBadge status={engagement.status} type="engagement" />
        <button
          onClick={refreshAll}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

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

      {/* 2. Overview Card */}
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoPair label="Client Email" value={engagement.client_email} />
          <InfoPair label="Monthly Rate" value={`${formatCurrency(engagement.monthly_rate)}/mo`} />
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
            href={`/portal/dfy/${engagement.portal_slug}`}
          />
          <InfoPair
            label="Linear Project"
            value={engagement.linear_project_id ? 'View Project' : '\u2014'}
            href={
              engagement.linear_project_id
                ? `https://linear.app/project/${engagement.linear_project_id}`
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
      />

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
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Deliverables
          </h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from(milestoneGroups.entries()).map(([milestoneId, items]) => (
            <MilestoneSection
              key={milestoneId || '__ungrouped'}
              milestoneId={milestoneId}
              items={items}
              allDeliverables={deliverables || []}
              onStatusChange={(id, status) => deliverableMutation.mutate({ id, data: { status } })}
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
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
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
                  isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'
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
}: {
  status: string;
  isLoading: boolean;
  onRetrigger: () => void;
  onPause: () => void;
  onResume: () => void;
  onSyncPlaybooks: () => void;
  isSyncing: boolean;
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
                    onBlur={(e) => {
                      commitNotes(key, e.target.value);
                      setLocalNotes((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
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
              href={`https://linear.app/issue/${deliverable.linear_issue_id}`}
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

export default DfyEngagementDetail;
