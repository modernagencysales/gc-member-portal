import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time: how long inactive data stays in cache
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as Error & { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },

      // Refetch configuration
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query keys factory for type-safe query keys
export const queryKeys = {
  // GC Portal
  gcMember: (email: string) => ['gc', 'member', email] as const,
  gcOnboarding: (memberId: string) => ['gc', 'onboarding', memberId] as const,
  gcCampaigns: (memberId: string) => ['gc', 'campaigns', memberId] as const,
  gcTools: (memberId: string) => ['gc', 'tools', memberId] as const,
  gcICP: (memberId: string) => ['gc', 'icp', memberId] as const,
  gcResources: () => ['gc', 'resources'] as const,

  // Admin (GC)
  adminMembers: () => ['admin', 'members'] as const,
  adminChecklist: () => ['admin', 'checklist'] as const,
  adminMemberProgress: (checklistItemId: string) => ['admin', 'progress', checklistItemId] as const,

  // Bootcamp (Legacy - Airtable)
  bootcampUser: (email: string) => ['bootcamp', 'user', email] as const,
  bootcampModules: () => ['bootcamp', 'modules'] as const,
  bootcampLessons: (moduleId: string) => ['bootcamp', 'lessons', moduleId] as const,
  bootcampProgress: (userId: string) => ['bootcamp', 'progress', userId] as const,

  // Bootcamp Students (Supabase)
  bootcampStudent: (email: string) => ['bootcamp', 'student', email] as const,
  bootcampStudentById: (studentId: string) => ['bootcamp', 'student', 'id', studentId] as const,
  bootcampStudentOnboarding: (studentId: string) =>
    ['bootcamp', 'student', 'onboarding', studentId] as const,
  bootcampStudentSurvey: (studentId: string) =>
    ['bootcamp', 'student', 'survey', studentId] as const,
  bootcampSettings: () => ['bootcamp', 'settings'] as const,

  // Bootcamp Admin
  bootcampAdminStudents: () => ['bootcamp', 'admin', 'students'] as const,
  bootcampAdminChecklist: () => ['bootcamp', 'admin', 'checklist'] as const,
  bootcampAdminStudentProgress: (checklistItemId: string) =>
    ['bootcamp', 'admin', 'progress', checklistItemId] as const,

  // Cohorts
  bootcampCohorts: () => ['bootcamp', 'cohorts'] as const,
  bootcampActiveCohorts: () => ['bootcamp', 'cohorts', 'active'] as const,
  bootcampCohortById: (cohortId: string) => ['bootcamp', 'cohort', cohortId] as const,
  bootcampCohortStudentCounts: () => ['bootcamp', 'cohorts', 'studentCounts'] as const,

  // Invite Codes
  bootcampInviteCodes: () => ['bootcamp', 'inviteCodes'] as const,
  bootcampInviteCodesByCohort: (cohortId: string) =>
    ['bootcamp', 'inviteCodes', 'cohort', cohortId] as const,

  // AI Tools
  aiTools: () => ['ai', 'tools'] as const,
  aiToolById: (toolId: string) => ['ai', 'tools', toolId] as const,
  aiToolBySlug: (slug: string) => ['ai', 'tools', 'slug', slug] as const,

  // Chat
  chatConversations: (studentId: string) => ['chat', 'conversations', studentId] as const,
  chatConversationsByTool: (studentId: string, toolId: string) =>
    ['chat', 'conversations', studentId, toolId] as const,
  chatMessages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
};
