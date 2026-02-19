import { useMemo } from 'react';
import { BootcampStudent } from '../types/bootcamp-types';
import { useSubscription } from './useSubscription';
import { LmsCohort } from '../types/lms-types';

export type NudgeTier = 'subtle' | 'persistent' | 'urgent' | 'locked' | 'none';

export interface FunnelAccessState {
  isFunnelAccess: boolean;
  isExpired: boolean;
  nudgeTier: NudgeTier;
  daysRemaining: number | null;
  totalDays: number | null;
  percentElapsed: number | null;
  canUseTools: boolean;
}

export function useFunnelAccess(
  student: BootcampStudent | null,
  cohort: LmsCohort | null = null
): FunnelAccessState {
  const subscription = useSubscription(student, cohort);

  return useMemo(() => {
    if (!student || student.accessLevel !== 'Sprint + AI Tools' || !student.accessExpiresAt) {
      return {
        isFunnelAccess: false,
        isExpired: false,
        nudgeTier: 'none' as NudgeTier,
        daysRemaining: null,
        totalDays: null,
        percentElapsed: null,
        canUseTools: true,
      };
    }

    const percentElapsed = subscription.percentElapsed ?? 0;
    const isExpired = subscription.accessState === 'expired';

    // Calculate total days from creation to expiry
    const createdAt = new Date(student.createdAt);
    const expiresAt = new Date(student.accessExpiresAt);
    const totalDays = Math.ceil((expiresAt.getTime() - createdAt.getTime()) / 86400000);

    let nudgeTier: NudgeTier;
    if (isExpired) {
      nudgeTier = 'locked';
    } else if (percentElapsed >= 80) {
      nudgeTier = 'urgent';
    } else if (percentElapsed >= 50) {
      nudgeTier = 'persistent';
    } else {
      nudgeTier = 'subtle';
    }

    return {
      isFunnelAccess: true,
      isExpired,
      nudgeTier,
      daysRemaining: subscription.daysRemaining,
      totalDays,
      percentElapsed,
      canUseTools: !isExpired,
    };
  }, [student, subscription]);
}
