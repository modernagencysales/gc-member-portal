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

  // LMS (Learning Management System)
  lmsCohorts: () => ['lms', 'cohorts'] as const,
  lmsActiveCohorts: () => ['lms', 'cohorts', 'active'] as const,
  lmsCohortById: (cohortId: string) => ['lms', 'cohort', cohortId] as const,
  lmsCurriculum: (cohortId: string) => ['lms', 'curriculum', cohortId] as const,
  lmsStudentCurriculum: (cohortName: string, email: string) =>
    ['lms', 'curriculum', 'student', cohortName, email] as const,
  lmsWeeks: (cohortId: string) => ['lms', 'weeks', cohortId] as const,
  lmsWeekById: (weekId: string) => ['lms', 'week', weekId] as const,
  lmsLessons: (weekId: string) => ['lms', 'lessons', weekId] as const,
  lmsLessonById: (lessonId: string) => ['lms', 'lesson', lessonId] as const,
  lmsContentItems: (lessonId: string) => ['lms', 'contentItems', lessonId] as const,
  lmsContentItemById: (itemId: string) => ['lms', 'contentItem', itemId] as const,
  lmsActionItems: (weekId: string) => ['lms', 'actionItems', weekId] as const,
  lmsActionItemById: (itemId: string) => ['lms', 'actionItem', itemId] as const,
  lmsStudentProgress: (studentId: string) => ['lms', 'progress', studentId] as const,
  lmsLessonProgress: (studentId: string, lessonId: string) =>
    ['lms', 'progress', 'lesson', studentId, lessonId] as const,
  lmsActionItemProgress: (studentId: string, itemId: string) =>
    ['lms', 'progress', 'actionItem', studentId, itemId] as const,
  lmsStudentEnrollments: (studentId: string) => ['lms', 'enrollments', studentId] as const,

  // Blueprint
  blueprintProspect: (slug: string) => ['blueprint', 'prospect', slug] as const,
  blueprintPosts: (prospectId: string) => ['blueprint', 'posts', prospectId] as const,
  blueprintSettings: () => ['blueprint', 'settings'] as const,
  blueprintContentBlocks: () => ['blueprint', 'contentBlocks'] as const,
  blueprintAdminProspects: () => ['blueprint', 'admin', 'prospects'] as const,

  // TAM Builder
  tamProjects: (userId: string) => ['tam', 'projects', userId] as const,
  tamProject: (projectId: string) => ['tam', 'project', projectId] as const,
  tamCompanies: (projectId: string) => ['tam', 'companies', projectId] as const,
  tamContacts: (projectId: string) => ['tam', 'contacts', projectId] as const,
  tamContactsByCompany: (companyId: string) => ['tam', 'contacts', 'company', companyId] as const,
  tamJobs: (projectId: string) => ['tam', 'jobs', projectId] as const,
  tamStats: (projectId: string) => ['tam', 'stats', projectId] as const,

  // Cold Email Recipes
  coldEmailRecipes: (studentId: string) => ['coldEmail', 'recipes', studentId] as const,
  coldEmailRecipe: (recipeId: string) => ['coldEmail', 'recipe', recipeId] as const,
  coldEmailContactLists: (studentId: string) => ['coldEmail', 'contactLists', studentId] as const,
  coldEmailContacts: (listId: string, limit?: number, offset?: number) =>
    ['coldEmail', 'contacts', listId, limit, offset] as const,

  // Intro Offers
  introOffers: () => ['introOffer', 'list'] as const,
  introOffer: (offerId: string) => ['introOffer', 'detail', offerId] as const,
  introOfferDeliverables: (offerId: string) => ['introOffer', 'deliverables', offerId] as const,

  // Proposals
  proposalBySlug: (slug: string) => ['proposal', slug] as const,
  proposalById: (id: string) => ['proposal', 'detail', id] as const,
  proposalsList: () => ['proposals', 'list'] as const,
  proposalPackages: () => ['proposals', 'packages'] as const,
};
