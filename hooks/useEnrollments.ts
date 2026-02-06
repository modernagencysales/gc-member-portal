import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentEnrollments } from '../services/lms-supabase';
import { queryKeys } from '../lib/queryClient';
import { StudentEnrollment } from '../types/bootcamp-types';

const ACTIVE_COURSE_KEY = 'lms_active_course_id';

export function useEnrollments(studentId: string | null) {
  const [activeCourseId, setActiveCourseIdState] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_COURSE_KEY);
  });

  const {
    data: enrollments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.lmsStudentEnrollments(studentId || ''),
    queryFn: () => fetchStudentEnrollments(studentId!),
    enabled: !!studentId,
  });

  // Auto-select first enrollment if none saved or saved one isn't valid
  const resolvedCourseId = useMemo(() => {
    if (enrollments.length === 0) return null;

    // If active course is in enrollments, keep it
    if (activeCourseId && enrollments.some((e) => e.cohortId === activeCourseId)) {
      return activeCourseId;
    }

    // Otherwise select first enrollment
    return enrollments[0].cohortId;
  }, [activeCourseId, enrollments]);

  const setActiveCourseId = useCallback((courseId: string | null) => {
    setActiveCourseIdState(courseId);
    if (courseId) {
      localStorage.setItem(ACTIVE_COURSE_KEY, courseId);
    } else {
      localStorage.removeItem(ACTIVE_COURSE_KEY);
    }
  }, []);

  const activeEnrollment = useMemo(() => {
    if (!resolvedCourseId) return null;
    return enrollments.find((e) => e.cohortId === resolvedCourseId) || null;
  }, [enrollments, resolvedCourseId]);

  const needsOnboarding = useCallback(
    (cohortId: string) => {
      const enrollment = enrollments.find((e) => e.cohortId === cohortId);
      if (!enrollment) return false;
      const config = enrollment.cohort.onboardingConfig;
      return config?.enabled === true && !enrollment.onboardingCompletedAt;
    },
    [enrollments]
  );

  return {
    enrollments,
    isLoading,
    activeCourseId: resolvedCourseId,
    setActiveCourseId,
    activeEnrollment,
    needsOnboarding,
    refetch,
  };
}
