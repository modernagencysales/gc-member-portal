/**
 * BootcampOnboardingFlow — Onboarding gate rendered before the main curriculum.
 *
 * Covers two distinct flows:
 *   1. Global onboarding (welcome → survey → ai-tools → complete) via useBootcampOnboarding.
 *   2. Per-course (enrollment) onboarding via CourseOnboarding.
 *
 * Constraint: never imports router hooks, never owns state — all state lives in BootcampApp.
 */

import React from 'react';
import CourseOnboarding from './CourseOnboarding';
import {
  OnboardingLayout,
  OnboardingWelcome,
  OnboardingSurvey,
  OnboardingAITools,
  OnboardingComplete,
} from './onboarding';
import type {
  BootcampStudent,
  StudentEnrollment,
  OnboardingStep,
  BootcampSurveyFormData,
  BootcampSettings,
} from '../../types/bootcamp-types';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface BootcampOnboardingFlowProps {
  // Which flow is active
  needsOnboarding: boolean;
  activeEnrollment: StudentEnrollment | null;
  checkEnrollmentOnboarding: (cohortId: string) => boolean;
  showDashboard: boolean;

  // Global onboarding state
  onboardingStep: OnboardingStep;
  completedOnboardingSteps: OnboardingStep[];
  surveyData: BootcampSurveyFormData;
  settings: Partial<BootcampSettings> | undefined;
  isSurveyPending: boolean;
  calculateOnboardingProgress: () => number;
  goToStep: (step: OnboardingStep) => void;
  handleWelcomeContinue: () => void;
  handleSurveySave: (data: BootcampSurveyFormData, step: number) => void;
  handleSurveyComplete: (data: BootcampSurveyFormData) => void;
  handleAIToolsContinue: () => void;
  handleEnterCurriculum: () => void;

  // Student identity
  bootcampStudent: BootcampStudent | null;

  // Course onboarding callbacks
  onCourseOnboardingComplete: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const BootcampOnboardingFlow: React.FC<BootcampOnboardingFlowProps> = ({
  needsOnboarding,
  activeEnrollment,
  checkEnrollmentOnboarding,
  showDashboard,
  onboardingStep,
  completedOnboardingSteps,
  surveyData,
  settings,
  isSurveyPending,
  calculateOnboardingProgress,
  goToStep,
  handleWelcomeContinue,
  handleSurveySave,
  handleSurveyComplete,
  handleAIToolsContinue,
  handleEnterCurriculum,
  bootcampStudent,
  onCourseOnboardingComplete,
}) => {
  // ─── Global onboarding flow ───────────────────────────────────────────────

  if (needsOnboarding) {
    return (
      <OnboardingLayout
        currentStep={onboardingStep}
        completedSteps={completedOnboardingSteps}
        totalProgress={calculateOnboardingProgress()}
        studentName={bootcampStudent?.name}
        onStepClick={goToStep}
      >
        {onboardingStep === 'welcome' && (
          <OnboardingWelcome
            studentName={bootcampStudent?.name}
            welcomeMessage={
              typeof settings?.welcomeMessage === 'string' ? settings.welcomeMessage : undefined
            }
            videoUrl={
              typeof settings?.introVideoUrl === 'string' ? settings.introVideoUrl : undefined
            }
            onContinue={handleWelcomeContinue}
          />
        )}
        {onboardingStep === 'survey' && (
          <OnboardingSurvey
            initialData={surveyData}
            onSave={handleSurveySave}
            onComplete={handleSurveyComplete}
            isLoading={isSurveyPending}
            studentEmail={bootcampStudent?.email}
          />
        )}
        {onboardingStep === 'ai-tools' && (
          <OnboardingAITools
            title={typeof settings?.aiToolsTitle === 'string' ? settings.aiToolsTitle : undefined}
            subtitle={
              typeof settings?.aiToolsSubtitle === 'string' ? settings.aiToolsSubtitle : undefined
            }
            infoTitle={
              typeof settings?.aiToolsInfoTitle === 'string' ? settings.aiToolsInfoTitle : undefined
            }
            infoText={
              typeof settings?.aiToolsInfoText === 'string' ? settings.aiToolsInfoText : undefined
            }
            onContinue={handleAIToolsContinue}
            onBack={() => goToStep('survey')}
          />
        )}
        {onboardingStep === 'complete' && (
          <OnboardingComplete
            studentName={bootcampStudent?.name}
            onEnterCurriculum={handleEnterCurriculum}
          />
        )}
      </OnboardingLayout>
    );
  }

  // ─── Per-course (enrollment) onboarding ──────────────────────────────────

  if (
    activeEnrollment &&
    checkEnrollmentOnboarding(activeEnrollment.cohortId) &&
    activeEnrollment.cohort.onboardingConfig &&
    !showDashboard
  ) {
    return (
      <CourseOnboarding
        cohortName={activeEnrollment.cohort.sidebarLabel || activeEnrollment.cohort.name}
        config={activeEnrollment.cohort.onboardingConfig}
        studentName={bootcampStudent?.name}
        studentEmail={bootcampStudent?.email}
        onComplete={onCourseOnboardingComplete}
        onSaveSurvey={(data, complete) => {
          if (bootcampStudent) {
            // surveyMutation is owned by useBootcampOnboarding; re-use handleSurveySave
            // for save (step 0) and handleSurveyComplete for final (complete=true)
            if (complete) handleSurveyComplete(data);
            else handleSurveySave(data, 0);
          }
        }}
        isSurveyLoading={isSurveyPending}
      />
    );
  }

  return null;
};

export default BootcampOnboardingFlow;
