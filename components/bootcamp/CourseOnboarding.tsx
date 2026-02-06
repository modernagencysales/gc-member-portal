import React, { useState, useCallback } from 'react';
import { CohortOnboardingConfig } from '../../types/lms-types';
import { BootcampSurveyFormData } from '../../types/bootcamp-types';
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle2, PlayCircle, Calendar } from 'lucide-react';
import { OnboardingSurvey } from './onboarding';

interface CourseOnboardingProps {
  cohortName: string;
  config: CohortOnboardingConfig;
  studentName?: string;
  studentEmail?: string;
  onComplete: () => void;
  onSaveSurvey?: (data: BootcampSurveyFormData, complete: boolean) => void;
  isSurveyLoading?: boolean;
}

// Convert YouTube/Loom URL to embed URL
const getEmbedUrl = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?modestbranding=1&rel=0&showinfo=0`;
  }
  if (url.includes('loom.com')) {
    const loomMatch = url.match(/loom\.com\/(share|embed)\/([a-zA-Z0-9]+)/);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[2]}?hide_title=true&hide_owner=true&hide_share=true`;
    }
  }
  return url;
};

const CourseOnboarding: React.FC<CourseOnboardingProps> = ({
  cohortName,
  config,
  studentName,
  studentEmail,
  onComplete,
  onSaveSurvey,
  isSurveyLoading,
}) => {
  const steps = config.steps || ['welcome', 'complete'];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [surveyData, setSurveyData] = useState<BootcampSurveyFormData>({});
  const [qualifiesForBooking, setQualifiesForBooking] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const goNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      // If we're finishing the survey step and there's a booking step, check qualification
      if (currentStep === 'survey' && steps.includes('booking')) {
        const qualifyField = config.calcomQualifyField;
        const qualifyValues = config.calcomQualifyValues;
        if (qualifyField && qualifyValues) {
          const fieldValue = (surveyData as Record<string, unknown>)[qualifyField] as string;
          setQualifiesForBooking(qualifyValues.includes(fieldValue));
        } else {
          setQualifiesForBooking(true);
        }
      }
      setCurrentStepIndex((i) => i + 1);
    }
  }, [isLastStep, onComplete, currentStep, steps, config, surveyData]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  }, [currentStepIndex]);

  const handleSurveyComplete = (data: BootcampSurveyFormData) => {
    setSurveyData(data);
    onSaveSurvey?.(data, true);
    goNext();
  };

  const handleSurveySave = (data: BootcampSurveyFormData, _step: number) => {
    setSurveyData(data);
    onSaveSurvey?.(data, false);
  };

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Progress bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {cohortName} Setup
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-violet-500 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center p-6 md:p-10">
        <div className="w-full max-w-2xl">
          {currentStep === 'welcome' && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="bg-gradient-to-br from-violet-600 to-violet-700 p-8 md:p-10 text-white">
                <div className="flex items-center gap-2 text-violet-200 text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span>Welcome to {cohortName}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-3">
                  {studentName ? `Hey ${studentName.split(' ')[0]}!` : 'Welcome!'}
                </h1>
                {config.welcomeMessage && (
                  <p className="text-violet-100 leading-relaxed">{config.welcomeMessage}</p>
                )}
              </div>
              <div className="p-8 flex justify-end">
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                >
                  Get Started <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'video' && config.welcomeVideoUrl && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <PlayCircle size={16} className="text-violet-500" />
                  Watch This First
                </div>
              </div>
              <div className="aspect-video">
                <iframe
                  src={getEmbedUrl(config.welcomeVideoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Welcome video"
                />
              </div>
              <div className="p-6 flex justify-between">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'survey' && config.surveyEnabled && (
            <div>
              <OnboardingSurvey
                initialData={surveyData}
                onSave={handleSurveySave}
                onComplete={handleSurveyComplete}
                isLoading={isSurveyLoading}
                studentEmail={studentEmail}
              />
            </div>
          )}

          {currentStep === 'booking' && config.calcomEnabled && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <Calendar size={16} className="text-violet-500" />
                  Schedule Your Kickoff Call
                </div>
              </div>
              <div className="p-6">
                {qualifiesForBooking && config.calcomBookingUrl ? (
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                      Based on your answers, you qualify for a 1-on-1 strategy call. Book a time
                      that works for you.
                    </p>
                    <iframe
                      src={config.calcomBookingUrl}
                      className="w-full min-h-[500px] rounded-lg border border-zinc-200 dark:border-zinc-700"
                      title="Book a call"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Thank you for completing the survey! You&apos;re all set to dive into the
                    curriculum.
                  </p>
                )}
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                >
                  {qualifiesForBooking ? 'Skip for Now' : 'Continue'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-10 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                You&apos;re all set!
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                Your setup for {cohortName} is complete. Let&apos;s get started with the curriculum.
              </p>
              <button
                onClick={onComplete}
                className="inline-flex items-center gap-2 px-8 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
              >
                Enter Curriculum <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseOnboarding;
