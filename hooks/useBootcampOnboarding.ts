/**
 * useBootcampOnboarding. Manages the multi-step onboarding flow for new bootcamp students.
 * Never imports React Router components, UI elements, or rendering concerns.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  saveBootcampStudentSurvey,
  fetchAllBootcampSettings,
  completeStudentOnboarding,
} from '../services/bootcamp-supabase';
import { logError } from '../lib/logError';
import { queryKeys } from '../lib/queryClient';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '../types';
import type {
  BootcampStudent,
  BootcampSurveyFormData,
  OnboardingStep,
} from '../types/bootcamp-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseBootcampOnboardingOptions {
  bootcampStudent: BootcampStudent | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  setBootcampStudent: Dispatch<SetStateAction<BootcampStudent | null>>;
  user: User | null;
}

export interface UseBootcampOnboardingReturn {
  // State
  onboardingStep: OnboardingStep;
  completedOnboardingSteps: OnboardingStep[];
  surveyData: BootcampSurveyFormData;
  needsOnboarding: boolean;

  // Query data
  settings: ReturnType<typeof useFetchSettings>['data'];

  // Mutation pending state
  isSurveyPending: boolean;
  isCompletingOnboarding: boolean;

  // Step navigation
  goToStep: (step: OnboardingStep) => void;

  // Handlers
  handleWelcomeContinue: () => void;
  handleSurveySave: (data: BootcampSurveyFormData, step: number) => void;
  handleSurveyComplete: (data: BootcampSurveyFormData) => void;
  handleAIToolsContinue: () => void;
  handleEnterCurriculum: () => Promise<void>;

  // Utility
  calculateOnboardingProgress: () => number;
}

// ─── Internal helper (typed query return) ────────────────────────────────────

function useFetchSettings(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.bootcampSettings(),
    queryFn: fetchAllBootcampSettings,
    enabled,
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBootcampOnboarding({
  bootcampStudent,
  setUser,
  setBootcampStudent,
  user,
}: UseBootcampOnboardingOptions): UseBootcampOnboardingReturn {
  const queryClient = useQueryClient();

  // ─── Onboarding step state ─────────────────────────────────────────────────
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [completedOnboardingSteps, setCompletedOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [surveyData, setSurveyData] = useState<BootcampSurveyFormData>({});

  // ─── Derived ──────────────────────────────────────────────────────────────
  const needsOnboarding =
    !!bootcampStudent &&
    bootcampStudent.status === 'Onboarding' &&
    !bootcampStudent.onboardingCompletedAt;

  // ─── Settings query ────────────────────────────────────────────────────────
  const { data: settings } = useFetchSettings(
    !!bootcampStudent && !bootcampStudent.onboardingCompletedAt
  );

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const surveyMutation = useMutation({
    mutationFn: ({ data, complete }: { data: BootcampSurveyFormData; complete: boolean }) =>
      saveBootcampStudentSurvey(bootcampStudent!.id, data, complete),
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: () => completeStudentOnboarding(bootcampStudent!.id),
    onSuccess: (updatedStudent) => {
      setBootcampStudent(updatedStudent);
      queryClient.invalidateQueries({ queryKey: ['bootcamp', 'student'] });
    },
  });

  // ─── Step navigation ───────────────────────────────────────────────────────

  const goToStep = useCallback((step: OnboardingStep) => {
    setOnboardingStep(step);
  }, []);

  const completeStep = useCallback((step: OnboardingStep) => {
    setCompletedOnboardingSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleWelcomeContinue = () => {
    completeStep('welcome');
    goToStep('survey');
  };

  const handleSurveySave = (data: BootcampSurveyFormData, _step: number) => {
    setSurveyData(data);
    if (bootcampStudent) {
      surveyMutation.mutate({ data, complete: false });
    }
  };

  const handleSurveyComplete = (data: BootcampSurveyFormData) => {
    setSurveyData(data);
    if (bootcampStudent) {
      surveyMutation.mutate({ data, complete: true });
    }
    completeStep('survey');

    // Check if AI tools step should be shown
    const showAITools = settings?.aiToolsVisible !== false;
    goToStep(showAITools ? 'ai-tools' : 'complete');
  };

  const handleAIToolsContinue = () => {
    completeStep('ai-tools');
    goToStep('complete');
  };

  const handleEnterCurriculum = async () => {
    try {
      const updatedStudent = await completeOnboardingMutation.mutateAsync();

      // Update user state with correct access level for curriculum view
      if (user && updatedStudent) {
        const updatedUser: User = {
          ...user,
          status: updatedStudent.accessLevel || 'Full Access',
        };
        setUser(updatedUser);
        localStorage.setItem('lms_user_obj', JSON.stringify(updatedUser));
      }

      completeStep('complete');
    } catch (error) {
      logError('useBootcampOnboarding:enterCurriculum', error);
    }
  };

  // ─── Progress calculation ──────────────────────────────────────────────────

  const calculateOnboardingProgress = () => {
    const steps: OnboardingStep[] = ['welcome', 'survey', 'ai-tools', 'complete'];
    const completed = completedOnboardingSteps.length;
    const currentIndex = steps.indexOf(onboardingStep);
    const progress = Math.round(
      ((currentIndex + (completed > currentIndex ? 1 : 0)) / steps.length) * 100
    );
    return Math.min(progress, 100);
  };

  return {
    onboardingStep,
    completedOnboardingSteps,
    surveyData,
    needsOnboarding,
    settings,
    isSurveyPending: surveyMutation.isPending,
    isCompletingOnboarding: completeOnboardingMutation.isPending,
    goToStep,
    handleWelcomeContinue,
    handleSurveySave,
    handleSurveyComplete,
    handleAIToolsContinue,
    handleEnterCurriculum,
    calculateOnboardingProgress,
  };
}
