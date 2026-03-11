/**
 * useAdminMutations. TanStack Query mutation hooks for admin-level GC tool access and onboarding checklist CRUD.
 * Constraint: Never called outside admin components. Never reads — write/invalidate only.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createToolAccess,
  updateToolAccess,
  deleteToolAccess,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '../services/supabase';
import { queryKeys } from '../lib/queryClient';
import { ToolAccess, OnboardingChecklistItem } from '../types/gc-types';

// ============================================
// Tool Access Mutations
// ============================================

export function useCreateToolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, tool }: { memberId: string; tool: Partial<ToolAccess> }) =>
      createToolAccess(memberId, tool),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gcTools(variables.memberId) });
    },
  });
}

export function useUpdateToolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ toolId, updates }: { toolId: string; updates: Partial<ToolAccess> }) =>
      updateToolAccess(toolId, updates),
    onSuccess: () => {
      // Invalidate all tool queries since we may not have memberId
      queryClient.invalidateQueries({ queryKey: ['gc', 'tools'] });
    },
  });
}

export function useDeleteToolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toolId: string) => deleteToolAccess(toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc', 'tools'] });
    },
  });
}

// ============================================
// Checklist Item Mutations
// ============================================

export function useCreateChecklistItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Partial<OnboardingChecklistItem>) => createChecklistItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChecklist() });
      // Also invalidate member onboarding queries
      queryClient.invalidateQueries({ queryKey: ['gc', 'onboarding'] });
    },
  });
}

export function useUpdateChecklistItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: Partial<OnboardingChecklistItem>;
    }) => updateChecklistItem(itemId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChecklist() });
      queryClient.invalidateQueries({ queryKey: ['gc', 'onboarding'] });
    },
  });
}

export function useDeleteChecklistItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteChecklistItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChecklist() });
      queryClient.invalidateQueries({ queryKey: ['gc', 'onboarding'] });
    },
  });
}
