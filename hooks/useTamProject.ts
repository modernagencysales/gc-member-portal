import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  fetchTamProjectsByUser,
  fetchTamProject,
  fetchTamCompanies,
  fetchTamContacts,
  fetchTamContactsByCompany,
  fetchTamJobs,
  fetchTamProjectStats,
  createTamProject,
  updateTamProject,
  updateTamCompany,
  updateCompanyFeedback,
  createTamJob,
  updateTamJob,
} from '../services/tam-supabase';
import {
  TamProject,
  TamCompany,
  TamCompanyFeedback,
  TamJob,
  TamProjectInput,
} from '../types/tam-types';

// ============================================
// Query Hooks
// ============================================

export function useTamProjects(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tamProjects(userId || ''),
    queryFn: () => fetchTamProjectsByUser(userId!),
    enabled: !!userId,
  });
}

export function useTamProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tamProject(projectId || ''),
    queryFn: () => fetchTamProject(projectId!),
    enabled: !!projectId,
  });
}

export function useTamCompanies(
  projectId: string | undefined,
  filters?: { qualificationStatus?: string; source?: string }
) {
  return useQuery({
    queryKey: queryKeys.tamCompanies(projectId || ''),
    queryFn: () => fetchTamCompanies(projectId!, filters),
    enabled: !!projectId,
  });
}

export function useTamContacts(
  projectId: string | undefined,
  filters?: { emailStatus?: string; linkedinActive?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.tamContacts(projectId || ''),
    queryFn: () => fetchTamContacts(projectId!, filters),
    enabled: !!projectId,
  });
}

export function useTamContactsByCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tamContactsByCompany(companyId || ''),
    queryFn: () => fetchTamContactsByCompany(companyId!),
    enabled: !!companyId,
  });
}

export function useTamJobs(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tamJobs(projectId || ''),
    queryFn: () => fetchTamJobs(projectId!),
    enabled: !!projectId,
    refetchInterval: (query) => {
      return query.state.data?.some((j) => j.status === 'running') ? 3000 : false;
    },
  });
}

export function useTamStats(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tamStats(projectId || ''),
    queryFn: () => fetchTamProjectStats(projectId!),
    enabled: !!projectId,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateTamProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TamProjectInput & { userId: string }) => createTamProject(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tamProjects(variables.userId) });
    },
  });
}

export function useUpdateTamProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: Partial<TamProject> }) =>
      updateTamProject(projectId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tamProject(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tamProjects(data.userId) });
    },
  });
}

export function useUpdateTamCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, updates }: { companyId: string; updates: Partial<TamCompany> }) =>
      updateTamCompany(companyId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tamCompanies(data.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tamStats(data.projectId) });
    },
  });
}

export function useCompanyFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      feedback,
    }: {
      companyId: string;
      feedback: TamCompanyFeedback | null;
    }) => updateCompanyFeedback(companyId, feedback),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tamCompanies(data.projectId) });
    },
  });
}

export function useCreateTamJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (job: { projectId: string; jobType: string; config?: Record<string, unknown> }) =>
      createTamJob(job as Parameters<typeof createTamJob>[0]),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tamJobs(data.projectId) });
    },
  });
}

export function useUpdateTamJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, updates }: { jobId: string; updates: Partial<TamJob> }) =>
      updateTamJob(jobId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tamJobs(data.projectId) });
    },
  });
}
