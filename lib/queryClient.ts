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

  // Bootcamp
  bootcampUser: (email: string) => ['bootcamp', 'user', email] as const,
  bootcampModules: () => ['bootcamp', 'modules'] as const,
  bootcampLessons: (moduleId: string) => ['bootcamp', 'lessons', moduleId] as const,
  bootcampProgress: (userId: string) => ['bootcamp', 'progress', userId] as const,
};
