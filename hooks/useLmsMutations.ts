import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createLmsCohort,
  updateLmsCohort,
  deleteLmsCohort,
  duplicateLmsCohort,
  createLmsWeek,
  updateLmsWeek,
  deleteLmsWeek,
  reorderLmsWeeks,
  createLmsLesson,
  updateLmsLesson,
  deleteLmsLesson,
  reorderLmsLessons,
  createLmsContentItem,
  updateLmsContentItem,
  deleteLmsContentItem,
  reorderLmsContentItems,
  createLmsActionItem,
  updateLmsActionItem,
  deleteLmsActionItem,
  reorderLmsActionItems,
  markLessonComplete,
  markLessonIncomplete,
  markActionItemComplete,
  markActionItemIncomplete,
  importCurriculumFromCohort,
  ImportCurriculumOptions,
} from '../services/lms-supabase';
import { queryKeys } from '../lib/queryClient';
import {
  LmsCohortFormData,
  LmsWeekFormData,
  LmsLessonFormData,
  LmsContentItemFormData,
  LmsActionItemFormData,
} from '../types/lms-types';

// ============================================
// Cohort Mutations
// ============================================

export function useCreateLmsCohortMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cohort: LmsCohortFormData) => createLmsCohort(cohort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCohorts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsActiveCohorts() });
    },
  });
}

export function useUpdateLmsCohortMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cohortId,
      updates,
    }: {
      cohortId: string;
      updates: Partial<LmsCohortFormData>;
    }) => updateLmsCohort(cohortId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCohorts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsActiveCohorts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCohortById(variables.cohortId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useDeleteLmsCohortMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cohortId: string) => deleteLmsCohort(cohortId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCohorts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsActiveCohorts() });
    },
  });
}

export function useDuplicateLmsCohortMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceCohortId,
      newName,
      newDescription,
      newStatus,
    }: {
      sourceCohortId: string;
      newName: string;
      newDescription?: string;
      newStatus?: string;
    }) => duplicateLmsCohort(sourceCohortId, newName, newDescription, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCohorts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsActiveCohorts() });
    },
  });
}

// ============================================
// Week Mutations
// ============================================

export function useCreateLmsWeekMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (week: LmsWeekFormData) => createLmsWeek(week),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsWeeks(variables.cohortId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useUpdateLmsWeekMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { weekId: string; cohortId: string; updates: Partial<LmsWeekFormData> }) =>
      updateLmsWeek(params.weekId, params.updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsWeeks(variables.cohortId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsWeekById(variables.weekId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useDeleteLmsWeekMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { weekId: string; cohortId: string }) => deleteLmsWeek(params.weekId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsWeeks(variables.cohortId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useReorderLmsWeeksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weekIds, cohortId }: { weekIds: string[]; cohortId: string }) =>
      reorderLmsWeeks(weekIds, cohortId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsWeeks(variables.cohortId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

// ============================================
// Lesson Mutations
// ============================================

export function useCreateLmsLessonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { lesson: LmsLessonFormData; cohortId: string }) =>
      createLmsLesson(params.lesson),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsLessons(variables.lesson.weekId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useUpdateLmsLessonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      lessonId: string;
      weekId: string;
      cohortId: string;
      updates: Partial<LmsLessonFormData>;
    }) => updateLmsLesson(params.lessonId, params.updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsLessons(variables.weekId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsLessonById(variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useDeleteLmsLessonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { lessonId: string; weekId: string; cohortId: string }) =>
      deleteLmsLesson(params.lessonId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsLessons(variables.weekId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useReorderLmsLessonsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { lessonIds: string[]; weekId: string; cohortId: string }) =>
      reorderLmsLessons(params.lessonIds, params.weekId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsLessons(variables.weekId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

// ============================================
// Content Item Mutations
// ============================================

export function useCreateLmsContentItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { item: LmsContentItemFormData; cohortId: string }) =>
      createLmsContentItem(params.item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsContentItems(variables.item.lessonId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useUpdateLmsContentItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      itemId: string;
      lessonId: string;
      cohortId: string;
      updates: Partial<LmsContentItemFormData>;
    }) => updateLmsContentItem(params.itemId, params.updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsContentItems(variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsContentItemById(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useDeleteLmsContentItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { itemId: string; lessonId: string; cohortId: string }) =>
      deleteLmsContentItem(params.itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsContentItems(variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useReorderLmsContentItemsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { itemIds: string[]; lessonId: string; cohortId: string }) =>
      reorderLmsContentItems(params.itemIds, params.lessonId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsContentItems(variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

// ============================================
// Action Item Mutations
// ============================================

export function useCreateLmsActionItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { item: LmsActionItemFormData; cohortId: string }) =>
      createLmsActionItem(params.item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsActionItems(variables.item.weekId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useUpdateLmsActionItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      itemId: string;
      weekId: string;
      cohortId: string;
      updates: Partial<LmsActionItemFormData>;
    }) => updateLmsActionItem(params.itemId, params.updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsActionItems(variables.weekId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsActionItemById(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useDeleteLmsActionItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { itemId: string; weekId: string; cohortId: string }) =>
      deleteLmsActionItem(params.itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsActionItems(variables.weekId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

export function useReorderLmsActionItemsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { itemIds: string[]; weekId: string; cohortId: string }) =>
      reorderLmsActionItems(params.itemIds, params.weekId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsActionItems(variables.weekId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(variables.cohortId) });
    },
  });
}

// ============================================
// Import Curriculum Mutation
// ============================================

export function useImportCurriculumMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (opts: ImportCurriculumOptions) => importCurriculumFromCohort(opts),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsCurriculum(variables.targetCohortId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsWeeks(variables.targetCohortId) });
    },
  });
}

// ============================================
// Student Progress Mutations
// ============================================

export function useMarkLessonCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      lessonId,
      notes,
    }: {
      studentId: string;
      lessonId: string;
      notes?: string;
    }) => markLessonComplete(studentId, lessonId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsLessonProgress(variables.studentId, variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsStudentProgress(variables.studentId),
      });
    },
  });
}

export function useMarkLessonIncompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, lessonId }: { studentId: string; lessonId: string }) =>
      markLessonIncomplete(studentId, lessonId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsLessonProgress(variables.studentId, variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsStudentProgress(variables.studentId),
      });
    },
  });
}

export function useMarkActionItemCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      actionItemId,
      proofOfWork,
      notes,
    }: {
      studentId: string;
      actionItemId: string;
      proofOfWork?: string;
      notes?: string;
    }) => markActionItemComplete(studentId, actionItemId, proofOfWork, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsActionItemProgress(variables.studentId, variables.actionItemId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsStudentProgress(variables.studentId),
      });
    },
  });
}

export function useMarkActionItemIncompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, actionItemId }: { studentId: string; actionItemId: string }) =>
      markActionItemIncomplete(studentId, actionItemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsActionItemProgress(variables.studentId, variables.actionItemId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.lmsStudentProgress(variables.studentId),
      });
    },
  });
}
