/**
 * useColdEmailRecipes. TanStack Query hooks for cold email recipe management: recipes, contact lists, and contact enrichment.
 * Constraint: Never imports from the GTM System API directly — all data access goes through services/cold-email-supabase.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  fetchRecipes,
  fetchRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  fetchContactLists,
  createContactList,
  deleteContactList,
  fetchContacts,
  insertContacts,
  updateContactEnrichment,
  resetContactEnrichment,
} from '../services/cold-email-recipes-supabase';
import type { RecipeStep, EmailTemplate, EnrichmentStatus } from '../types/cold-email-recipe-types';

// ============================================
// Recipe hooks
// ============================================

export function useRecipes(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.coldEmailRecipes(studentId!),
    queryFn: () => fetchRecipes(studentId!),
    enabled: !!studentId,
  });
}

export function useRecipe(recipeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.coldEmailRecipe(recipeId!),
    queryFn: () => fetchRecipeById(recipeId!),
    enabled: !!recipeId,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      studentId: string;
      name: string;
      slug: string;
      description: string;
      steps: RecipeStep[];
      emailTemplate: EmailTemplate | null;
    }) => createRecipe(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coldEmailRecipes(variables.studentId),
      });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      recipeId: string;
      studentId: string;
      updates: {
        name?: string;
        slug?: string;
        description?: string;
        steps?: RecipeStep[];
        emailTemplate?: EmailTemplate | null;
        isActive?: boolean;
      };
    }) => updateRecipe(input.recipeId, input.updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coldEmailRecipes(variables.studentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.coldEmailRecipe(variables.recipeId),
      });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { recipeId: string; studentId: string }) => deleteRecipe(input.recipeId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coldEmailRecipes(variables.studentId),
      });
    },
  });
}

// ============================================
// Contact List hooks
// ============================================

export function useContactLists(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.coldEmailContactLists(studentId!),
    queryFn: () => fetchContactLists(studentId!),
    enabled: !!studentId,
  });
}

export function useCreateContactList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      studentId: string;
      name: string;
      columnMapping: Record<string, string>;
    }) => createContactList(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coldEmailContactLists(variables.studentId),
      });
    },
  });
}

export function useDeleteContactList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { listId: string; studentId: string }) => deleteContactList(input.listId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coldEmailContactLists(variables.studentId),
      });
    },
  });
}

// ============================================
// Contact hooks
// ============================================

export function useContacts(listId: string | undefined, limit = 100, offset = 0) {
  return useQuery({
    queryKey: queryKeys.coldEmailContacts(listId!, limit, offset),
    queryFn: () => fetchContacts(listId!, limit, offset),
    enabled: !!listId,
  });
}

export function useInsertContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      contacts: Array<{
        listId: string;
        studentId: string;
        firstName: string;
        lastName: string;
        email: string;
        company: string;
        title: string;
        linkedinUrl: string;
        customFields: Record<string, string>;
      }>;
    }) => insertContacts(input.contacts),
    onSuccess: (_data, variables) => {
      if (variables.contacts.length > 0) {
        const { listId, studentId } = variables.contacts[0];
        // Prefix match — invalidates all paginated variants of this list's contacts
        queryClient.invalidateQueries({
          queryKey: ['coldEmail', 'contacts', listId],
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.coldEmailContactLists(studentId),
        });
      }
    },
  });
}

export function useUpdateContactEnrichment() {
  return useMutation({
    mutationFn: (input: {
      contactId: string;
      stepOutputs: Record<string, string>;
      status: EnrichmentStatus;
    }) => updateContactEnrichment(input.contactId, input.stepOutputs, input.status),
  });
}

export function useResetContactEnrichment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => resetContactEnrichment(listId),
    onSuccess: (_data, listId) => {
      // Prefix match — invalidates all paginated variants of this list's contacts
      queryClient.invalidateQueries({
        queryKey: ['coldEmail', 'contacts', listId],
      });
    },
  });
}
