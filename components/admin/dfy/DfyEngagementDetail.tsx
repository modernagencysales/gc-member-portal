/** DfyEngagementDetail. Root page for a single DFY engagement — orchestrates tabs, header, and child panels. */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Trash2, FileText, Eye } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { DEFAULT_ONBOARDING_CHECKLIST } from '../../../types/dfy-admin-types';
import DfyStatusBadge from './DfyStatusBadge';
import { useDfyEngagementData } from '../../../hooks/useDfyEngagementData';
import ActionButtons from './shared/ActionButtons';
import DeleteConfirmationModal from './shared/DeleteConfirmationModal';
import AutomationHistoryPanel from './shared/AutomationHistoryPanel';
import DfyOverviewCard from './DfyOverviewCard';
import DfyActivityPanel from './DfyActivityPanel';
import DfyDeliverablesPanel from './DfyDeliverablesPanel';
import OnboardingChecklistSection from './panels/OnboardingChecklistSection';
import ContentCallPrepPanel from './panels/ContentCallPrepPanel';
import ProfileRewriteReviewPanel from './panels/ProfileRewriteReviewPanel';
import CallTranscriptSection from './panels/CallTranscriptSection';
import ResourceFilesSection from './panels/ResourceFilesSection';
import IntakeFormSection from './panels/IntakeFormSection';

// ─── Component ─────────────────────────────────────────
const DfyEngagementDetail = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile_rewrite' | 'content_call_prep'>(
    'overview'
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    engagement,
    engLoading,
    deliverables,
    delsLoading,
    activity,
    automationRuns,
    profileRewriteOutput,
    outputLoading,
    contentCallPrepOutput,
    callPrepLoading,
    profileRewriteDeliverable,
    contentCallPrepDeliverable,
    milestoneGroups,
    refreshAll,
    engagementMutation,
    deliverableMutation,
    retriggerMutation,
    triggerMutation,
    retryMutation,
    syncMutation,
    magicLinkMutation,
    postUpdateMutation,
    upgradeMutation,
    deleteMutation,
  } = useDfyEngagementData(engagementId!, {
    onError: (msg) => setError(msg || null),
    onDeleteSuccess: () => navigate('/admin/dfy'),
  });

  const showProfileRewriteTab = !!profileRewriteDeliverable;
  const showContentCallPrepTab = !!contentCallPrepDeliverable;
  // ─── Loading / Not Found ─────────────────────────────
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

  // ─── Render ────────────────────────────────────────────
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

      {/* Tab bar */}
      {(showProfileRewriteTab || showContentCallPrepTab) && (
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
          {showContentCallPrepTab && (
            <button
              onClick={() => setActiveTab('content_call_prep')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'content_call_prep'
                  ? isDarkMode
                    ? 'border-violet-500 text-violet-400'
                    : 'border-violet-600 text-violet-600'
                  : isDarkMode
                    ? 'border-transparent text-zinc-500 hover:text-zinc-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Content Call Prep
            </button>
          )}
          {showProfileRewriteTab && (
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
          )}
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

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <>
          <DfyOverviewCard
            engagement={engagement}
            engagementMutation={engagementMutation}
            magicLinkMutation={magicLinkMutation}
          />

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

          <IntakeFormSection engagement={engagement} />

          <CallTranscriptSection
            engagement={engagement}
            isUpdating={engagementMutation.isPending}
            onSave={(transcript) => engagementMutation.mutate({ call_transcript: transcript })}
          />

          <ResourceFilesSection engagementId={engagement.id} />

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

          <DfyDeliverablesPanel
            deliverables={deliverables}
            delsLoading={delsLoading}
            milestoneGroups={milestoneGroups}
            deliverableMutation={deliverableMutation}
            triggerMutation={triggerMutation}
          />

          <DfyActivityPanel activity={activity} postUpdateMutation={postUpdateMutation} />

          {automationRuns.length > 0 && (
            <AutomationHistoryPanel
              runs={automationRuns}
              onRetry={(runId) => retryMutation.mutate(runId)}
              isRetrying={retryMutation.isPending}
            />
          )}
        </>
      )}

      {/* Content Call Prep tab */}
      {activeTab === 'content_call_prep' && contentCallPrepDeliverable && (
        <ContentCallPrepPanel
          output={contentCallPrepOutput}
          isLoading={callPrepLoading}
          deliverable={contentCallPrepDeliverable}
        />
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
        <DeleteConfirmationModal
          clientName={engagement.client_name}
          isDeleting={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutateAsync().catch(() => setShowDeleteConfirm(false))}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default DfyEngagementDetail;
