import { useQuery } from '@tanstack/react-query';
import { getStudentGrants, StudentGrants } from '../services/bootcamp-supabase';

export function useStudentGrants(studentId: string | undefined, accessLevel: string) {
  const needsGrants = accessLevel === 'Lead Magnet' || accessLevel === 'Sprint + AI Tools';

  const { data, isLoading, refetch } = useQuery<StudentGrants>({
    queryKey: ['studentGrants', studentId],
    queryFn: () => getStudentGrants(studentId!),
    enabled: !!studentId && needsGrants,
  });

  // Full Access / Curriculum Only users get null (meaning "everything")
  if (!needsGrants) {
    return {
      grantedTools: null,
      grantedWeekIds: null,
      isLoading: false,
      refetchGrants: refetch,
    };
  }

  // Sprint + AI Tools users see all curriculum (no week filtering) but have filtered tools
  if (accessLevel === 'Sprint + AI Tools') {
    return {
      grantedTools: data?.tools ?? [],
      grantedWeekIds: null, // See all curriculum
      isLoading,
      refetchGrants: refetch,
    };
  }

  return {
    grantedTools: data?.tools ?? [],
    grantedWeekIds: data?.weekIds ?? [],
    isLoading,
    refetchGrants: refetch,
  };
}
