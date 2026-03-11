/**
 * useDfyEngagementData. All TanStack Query hooks for a single DFY engagement detail view.
 * Constraint: No routing, no UI state (error/form visibility), no theme or context imports.
 * Callers inject side-effect callbacks (onError, onPostUpdateSuccess, onDeleteSuccess).
 */

import { useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { queryKeys } from '../lib/queryClient';
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
  deleteEngagement,
  upgradeEngagement,
} from '../services/dfy-admin-supabase';
import type {
  DfyAdminEngagement,
  DfyAdminDeliverable,
  DfyCommunicationPreference,
  DfyEngagementStatus,
} from '../types/dfy-admin-types';

// ─── Parameter Types ──────────────────────────────────────────────────────────

export interface UseDfyEngagementDataCallbacks {
  /** Called when any mutation encounters an error. Typically sets UI error state. */
  onError?: (message: string) => void;
  /** Called after postUpdateMutation succeeds. Typically resets form state. */
  onPostUpdateSuccess?: () => void;
  /** Called after deleteMutation succeeds. Typically navigates away. */
  onDeleteSuccess?: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Encapsulates all data fetching and mutations for the DFY engagement detail page.
 *
 * @param engagementId - The UUID of the engagement to load.
 * @param callbacks - Optional side-effect handlers for error display and post-mutation UI changes.
 */
export function useDfyEngagementData(
  engagementId: string,
  callbacks: UseDfyEngagementDataCallbacks = {}
) {
  const { onError, onPostUpdateSuccess, onDeleteSuccess } = callbacks;
  const queryClient = useQueryClient();

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: engagement, isLoading: engLoading } = useQuery({
    queryKey: queryKeys.dfyEngagement(engagementId),
    queryFn: () => fetchDfyEngagementById(engagementId),
    enabled: !!engagementId,
  });

  const { data: deliverables, isLoading: delsLoading } = useQuery({
    queryKey: queryKeys.dfyDeliverables(engagementId),
    queryFn: () => fetchDfyDeliverables(engagementId),
    enabled: !!engagementId,
  });

  const { data: activity } = useQuery({
    queryKey: queryKeys.dfyActivity(engagementId),
    queryFn: () => fetchDfyActivityLog(engagementId),
    enabled: !!engagementId,
  });

  const { data: automationRuns = [] } = useQuery({
    queryKey: queryKeys.dfyAutomationRuns(engagementId),
    queryFn: () => fetchAutomationRuns(engagementId),
    enabled: !!engagementId,
  });

  const { data: profileRewriteOutput, isLoading: outputLoading } = useQuery({
    queryKey: queryKeys.dfyAutomationOutput(engagementId, 'profile_rewrite'),
    queryFn: () => fetchAdminAutomationOutput(engagementId, 'profile_rewrite'),
    enabled: !!engagementId,
  });

  const { data: contentCallPrepOutput, isLoading: callPrepLoading } = useQuery({
    queryKey: queryKeys.dfyAutomationOutput(engagementId, 'prepare_content_call'),
    queryFn: () => fetchAdminAutomationOutput(engagementId, 'prepare_content_call'),
    enabled: !!engagementId,
  });

  // ─── Derived (deliverable lookups) ──────────────────────────────────────────

  const profileRewriteDeliverable = useMemo(
    () => deliverables?.find((d) => d.automation_type === 'profile_rewrite') ?? null,
    [deliverables]
  );

  const contentCallPrepDeliverable = useMemo(
    () => deliverables?.find((d) => d.automation_type === 'prepare_content_call') ?? null,
    [deliverables]
  );

  // ─── Deliverables grouped by milestone ──────────────────────────────────────

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

  // ─── Manual refresh ─────────────────────────────────────────────────────────

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagement(engagementId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyAutomationRuns(engagementId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyIntakeFiles(engagementId) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.dfyAutomationOutput(engagementId, 'profile_rewrite'),
    });
  };

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const engagementMutation = useMutation({
    mutationFn: (data: {
      status?: DfyEngagementStatus;
      onboarding_checklist?: Record<string, unknown>;
      communication_preference?: DfyCommunicationPreference;
      linkedin_url?: string | null;
      call_transcript?: string | null;
    }) => updateEngagement(engagementId, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dfyEngagement(engagementId) });
      const previousEngagement = queryClient.getQueryData<DfyAdminEngagement>(
        queryKeys.dfyEngagement(engagementId)
      );
      queryClient.setQueryData<DfyAdminEngagement | null>(
        queryKeys.dfyEngagement(engagementId),
        (old) => (old ? ({ ...old, ...newData } as DfyAdminEngagement) : old)
      );
      return { previousEngagement };
    },
    onError: (err: Error, _newData, context) => {
      if (context?.previousEngagement) {
        queryClient.setQueryData(queryKeys.dfyEngagement(engagementId), context.previousEngagement);
      }
      onError?.(err.message);
    },
    onSuccess: () => onError?.(''),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagement(engagementId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagements() });
    },
  });

  const deliverableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string } }) =>
      updateDeliverable(id, data),
    onSuccess: () => {
      onError?.('');
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId) });
    },
    onError: (err: Error) => onError?.(err.message),
  });

  const retriggerMutation = useMutation({
    mutationFn: () => retriggerOnboarding(engagementId),
    onSuccess: () => {
      onError?.('');
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagement(engagementId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagements() });
    },
    onError: (err: Error) => onError?.(err.message),
  });

  const triggerMutation = useMutation({
    mutationFn: triggerAutomation,
    onSuccess: () => {
      onError?.('');
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyAutomationRuns(engagementId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId) });
    },
    onError: (err: Error) => onError?.(err.message),
  });

  const retryMutation = useMutation({
    mutationFn: retryAutomation,
    onSuccess: () => {
      onError?.('');
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyAutomationRuns(engagementId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId) });
    },
    onError: (err: Error) => onError?.(err.message),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncPlaybooks(engagementId),
    onSuccess: () => {
      onError?.('');
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyDeliverables(engagementId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId) });
    },
    onError: (err: Error) => onError?.(err.message),
  });

  const magicLinkMutation = useMutation({
    mutationFn: () => resendMagicLink(engagementId),
    onSuccess: () => onError?.(''),
    onError: (err: Error) => onError?.(err.message),
  });

  const postUpdateMutation = useMutation({
    mutationFn: (message: string) => postEngagementUpdate(engagementId, message),
    onSuccess: () => {
      onError?.('');
      onPostUpdateSuccess?.();
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyActivity(engagementId) });
    },
    onError: (err: Error) => onError?.(err.message),
  });

  const upgradeMutation = useMutation({
    mutationFn: () => upgradeEngagement(engagementId),
    onSuccess: () => {
      refreshAll();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEngagement(engagementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagements() });
      onDeleteSuccess?.();
    },
    onError: (err: Error) => {
      onError?.(err.message);
    },
  });

  // ─── Return ──────────────────────────────────────────────────────────────────

  return {
    // Queries
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

    // Derived
    profileRewriteDeliverable,
    contentCallPrepDeliverable,
    milestoneGroups,

    // Actions
    refreshAll,

    // Mutations
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
  };
}
