import { useQuery } from '@tanstack/react-query';
import { getStudentGrants, StudentGrants } from '../services/bootcamp-supabase';

export function useStudentGrants(studentId: string | undefined, accessLevel: string) {
  const { data, isLoading, refetch } = useQuery<StudentGrants>({
    queryKey: ['studentGrants', studentId],
    queryFn: () => getStudentGrants(studentId!),
    enabled: !!studentId && accessLevel === 'Lead Magnet',
  });

  // Full Access users get null (meaning "everything")
  if (accessLevel !== 'Lead Magnet') {
    return {
      grantedTools: null,
      grantedWeekIds: null,
      isLoading: false,
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
