import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBootcampStudent,
  updateBootcampStudent,
  createBootcampChecklistItem,
  updateBootcampChecklistItem,
  deleteBootcampChecklistItem,
  updateBootcampSetting,
  markStudentSlackInvited,
  markStudentCalendarAdded,
  updateBootcampStudentProgress,
  saveBootcampStudentSurvey,
  completeStudentOnboarding,
  createCohort,
  updateCohort,
  deleteCohort,
  createInviteCode,
  updateInviteCode,
  deleteInviteCode,
} from '../services/bootcamp-supabase';
import { queryKeys } from '../lib/queryClient';
import {
  BootcampStudent,
  BootcampChecklistItem,
  BootcampSettings,
  BootcampProgressStatus,
  BootcampSurveyFormData,
  BootcampCohort,
  BootcampInviteCode,
  ToolGrant,
} from '../types/bootcamp-types';

// ============================================
// Student Mutations
// ============================================

export function useCreateBootcampStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (student: Partial<BootcampStudent>) => createBootcampStudent(student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminStudents() });
    },
  });
}

export function useUpdateBootcampStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      updates,
    }: {
      studentId: string;
      updates: Partial<BootcampStudent>;
    }) => updateBootcampStudent(studentId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminStudents() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bootcampStudentById(variables.studentId),
      });
    },
  });
}

export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => completeStudentOnboarding(studentId),
    onSuccess: (_, studentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminStudents() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampStudentById(studentId) });
      queryClient.invalidateQueries({ queryKey: ['bootcamp', 'student'] });
    },
  });
}

// ============================================
// Checklist Item Mutations
// ============================================

export function useCreateBootcampChecklistItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Partial<BootcampChecklistItem>) => createBootcampChecklistItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminChecklist() });
      queryClient.invalidateQueries({ queryKey: ['bootcamp', 'student', 'onboarding'] });
    },
  });
}

export function useUpdateBootcampChecklistItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: Partial<BootcampChecklistItem>;
    }) => updateBootcampChecklistItem(itemId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminChecklist() });
      queryClient.invalidateQueries({ queryKey: ['bootcamp', 'student', 'onboarding'] });
    },
  });
}

export function useDeleteBootcampChecklistItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteBootcampChecklistItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminChecklist() });
      queryClient.invalidateQueries({ queryKey: ['bootcamp', 'student', 'onboarding'] });
    },
  });
}

// ============================================
// Progress Mutations
// ============================================

export function useUpdateBootcampProgressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      progressId,
      studentId,
      checklistItemId,
      status,
      notes,
    }: {
      progressId?: string;
      studentId: string;
      checklistItemId: string;
      status: BootcampProgressStatus;
      notes?: string;
    }) => updateBootcampStudentProgress(progressId, studentId, checklistItemId, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bootcampStudentOnboarding(variables.studentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminStudents() });
    },
  });
}

// ============================================
// Survey Mutations
// ============================================

export function useSaveBootcampSurveyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      surveyData,
      markComplete,
    }: {
      studentId: string;
      surveyData: BootcampSurveyFormData;
      markComplete?: boolean;
    }) => saveBootcampStudentSurvey(studentId, surveyData, markComplete),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bootcampStudentSurvey(variables.studentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminStudents() });
    },
  });
}

// ============================================
// Settings Mutations
// ============================================

export function useUpdateBootcampSettingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      value,
    }: {
      key: keyof BootcampSettings;
      value: BootcampSettings[keyof BootcampSettings];
    }) => updateBootcampSetting(key, value as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampSettings() });
    },
  });
}

// ============================================
// Manual Status Mutations (v1 - manual tracking)
// ============================================

export function useMarkSlackInvitedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => markStudentSlackInvited(studentId),
    onSuccess: (_, studentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminStudents() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampStudentById(studentId) });
    },
  });
}

export function useMarkCalendarAddedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => markStudentCalendarAdded(studentId),
    onSuccess: (_, studentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminStudents() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampStudentById(studentId) });
    },
  });
}

// ============================================
// Cohort Mutations
// ============================================

export function useCreateCohortMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cohort: Partial<BootcampCohort>) => createCohort(cohort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampCohorts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampActiveCohorts() });
    },
  });
}

export function useUpdateCohortMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cohortId, updates }: { cohortId: string; updates: Partial<BootcampCohort> }) =>
      updateCohort(cohortId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampCohorts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampActiveCohorts() });
    },
  });
}

export function useDeleteCohortMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cohortId: string) => deleteCohort(cohortId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampCohorts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampActiveCohorts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampInviteCodes() });
    },
  });
}

// ============================================
// Invite Code Mutations
// ============================================

export function useCreateInviteCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cohortId,
      options,
    }: {
      cohortId: string;
      options?: {
        maxUses?: number;
        expiresAt?: Date;
        customCode?: string;
        accessLevel?: string;
        toolGrants?: ToolGrant[];
        contentGrants?: string[];
      };
    }) => createInviteCode(cohortId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampInviteCodes() });
    },
  });
}

export function useUpdateInviteCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ codeId, updates }: { codeId: string; updates: Partial<BootcampInviteCode> }) =>
      updateInviteCode(codeId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampInviteCodes() });
    },
  });
}

export function useDeleteInviteCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (codeId: string) => deleteInviteCode(codeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampInviteCodes() });
    },
  });
}
