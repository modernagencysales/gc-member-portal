import { useMemo } from 'react';
import { BootcampStudent } from '../types/bootcamp-types';
import { LmsCohort } from '../types/lms-types';

export type AccessState = 'active' | 'expiring' | 'expired' | 'subscribed';

interface UseSubscriptionResult {
  accessState: AccessState;
  daysRemaining: number | null;
  canUseAiTools: boolean;
  isReadOnly: boolean;
  accessExpiresAt: Date | null;
  percentElapsed: number | null;
  isFunnelAccess: boolean;
}

export function useSubscription(
  student: BootcampStudent | null,
  cohort: LmsCohort | null
): UseSubscriptionResult {
  return useMemo(() => {
    // Default state if no student
    if (!student) {
      return {
        accessState: 'expired' as AccessState,
        daysRemaining: null,
        canUseAiTools: false,
        isReadOnly: true,
        accessExpiresAt: null,
        percentElapsed: null,
        isFunnelAccess: false,
      };
    }

    // Subscribed users always have full access
    if (student.subscriptionStatus === 'active') {
      return {
        accessState: 'subscribed' as AccessState,
        daysRemaining: null,
        canUseAiTools: true,
        isReadOnly: false,
        accessExpiresAt: null,
        percentElapsed: null,
        isFunnelAccess: false,
      };
    }

    // Time-limited access: use access_expires_at for Sprint + AI Tools and Curriculum Only
    const isTimeLimited =
      (student.accessLevel === 'Sprint + AI Tools' || student.accessLevel === 'Curriculum Only') &&
      student.accessExpiresAt;

    if (isTimeLimited) {
      const now = new Date();
      const expiresAt = new Date(student.accessExpiresAt!);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000);
      const isCurriculumOnly = student.accessLevel === 'Curriculum Only';

      // Calculate percent elapsed based on creation date
      const createdAt = new Date(student.createdAt);
      const totalDuration = expiresAt.getTime() - createdAt.getTime();
      const elapsed = now.getTime() - createdAt.getTime();
      const percentElapsed =
        totalDuration > 0
          ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))
          : 100;

      if (daysRemaining <= 0) {
        return {
          accessState: 'expired' as AccessState,
          daysRemaining: 0,
          canUseAiTools: false,
          isReadOnly: true,
          accessExpiresAt: expiresAt,
          percentElapsed: 100,
          isFunnelAccess: !isCurriculumOnly,
        };
      }

      if (daysRemaining <= 7) {
        return {
          accessState: 'expiring' as AccessState,
          daysRemaining,
          canUseAiTools: !isCurriculumOnly,
          isReadOnly: false,
          accessExpiresAt: expiresAt,
          percentElapsed,
          isFunnelAccess: !isCurriculumOnly,
        };
      }

      return {
        accessState: 'active' as AccessState,
        daysRemaining,
        canUseAiTools: !isCurriculumOnly,
        isReadOnly: false,
        accessExpiresAt: expiresAt,
        percentElapsed,
        isFunnelAccess: !isCurriculumOnly,
      };
    }

    // Calculate access expiration (cohort end + 4 weeks)
    const cohortEndDate = cohort?.endDate ? new Date(cohort.endDate) : null;

    if (!cohortEndDate) {
      // No end date means unlimited access (for now)
      return {
        accessState: 'active' as AccessState,
        daysRemaining: null,
        canUseAiTools: true,
        isReadOnly: false,
        accessExpiresAt: null,
        percentElapsed: null,
        isFunnelAccess: false,
      };
    }

    const accessExpiresAt = new Date(cohortEndDate);
    accessExpiresAt.setDate(accessExpiresAt.getDate() + 28); // +4 weeks

    const now = new Date();
    const msRemaining = accessExpiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    // Expired
    if (daysRemaining <= 0) {
      return {
        accessState: 'expired' as AccessState,
        daysRemaining: 0,
        canUseAiTools: false,
        isReadOnly: true,
        accessExpiresAt,
        percentElapsed: null,
        isFunnelAccess: false,
      };
    }

    // Expiring (final 7 days)
    if (daysRemaining <= 7) {
      return {
        accessState: 'expiring' as AccessState,
        daysRemaining,
        canUseAiTools: true,
        isReadOnly: false,
        accessExpiresAt,
        percentElapsed: null,
        isFunnelAccess: false,
      };
    }

    // Active
    return {
      accessState: 'active' as AccessState,
      daysRemaining,
      canUseAiTools: true,
      isReadOnly: false,
      accessExpiresAt,
      percentElapsed: null,
      isFunnelAccess: false,
    };
  }, [student, cohort]);
}
