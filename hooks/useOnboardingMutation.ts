import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMemberProgress } from '../services/supabase';
import { queryKeys } from '../lib/queryClient';
import { OnboardingCategoryGroup, ProgressStatus } from '../types/gc-types';

interface UpdateProgressParams {
  progressId: string | undefined;
  memberId: string;
  checklistItemId: string;
  status: ProgressStatus;
  notes?: string;
}

interface OnboardingData {
  categories: OnboardingCategoryGroup[];
  totalProgress: number;
}

export function useUpdateProgressMutation(memberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateProgressParams) =>
      updateMemberProgress(
        params.progressId,
        params.memberId,
        params.checklistItemId,
        params.status,
        params.notes
      ),

    // Optimistic update
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.gcOnboarding(memberId) });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<OnboardingData>(
        queryKeys.gcOnboarding(memberId)
      );

      // Optimistically update the cache
      if (previousData) {
        const updatedCategories = previousData.categories.map((category) => ({
          ...category,
          items: category.items.map((item) => {
            if (item.id === newData.checklistItemId) {
              return {
                ...item,
                progressStatus: newData.status,
                completedDate: newData.status === 'Complete' ? new Date() : undefined,
              };
            }
            return item;
          }),
          completedCount: category.items.filter((item) => {
            if (item.id === newData.checklistItemId) {
              return newData.status === 'Complete';
            }
            return item.progressStatus === 'Complete';
          }).length,
        }));

        // Recalculate total progress
        const totalItems = updatedCategories.reduce((sum, cat) => sum + cat.totalCount, 0);
        const completedItems = updatedCategories.reduce((sum, cat) => sum + cat.completedCount, 0);
        const newTotalProgress =
          totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        queryClient.setQueryData<OnboardingData>(queryKeys.gcOnboarding(memberId), {
          categories: updatedCategories,
          totalProgress: newTotalProgress,
        });
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },

    // If the mutation fails, rollback to the previous value
    onError: (_err, _newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.gcOnboarding(memberId), context.previousData);
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gcOnboarding(memberId) });
    },
  });
}

export function useCampaignMetricsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      metrics,
    }: {
      campaignId: string;
      metrics: {
        contactsReached?: number;
        opens?: number;
        replies?: number;
        positiveReplies?: number;
        meetingsBooked?: number;
      };
    }) => {
      const { updateCampaignMetrics } = await import('../services/supabase');
      return updateCampaignMetrics(campaignId, metrics);
    },

    onSuccess: () => {
      // Invalidate campaigns query to refetch
      queryClient.invalidateQueries({ queryKey: ['gc', 'campaigns'] });
    },
  });
}
