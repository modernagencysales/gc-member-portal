import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import {
  BootcampSurveyFormData,
  COMPANY_SIZES,
  LINKEDIN_EXPERIENCE_LEVELS,
  MONTHLY_OUTREACH_VOLUMES,
  INDUSTRY_OPTIONS,
  CHALLENGE_OPTIONS,
  LEAD_GEN_METHOD_OPTIONS,
  TOOLS_OPTIONS,
} from '../../../types/bootcamp-types';
import { getProspectByEmail } from '../../../services/blueprint-supabase';
import type { Prospect } from '../../../types/blueprint-types';
import { logWarn } from '../../../lib/logError';

interface OnboardingSurveyProps {
  initialData?: BootcampSurveyFormData;
  onSave: (data: BootcampSurveyFormData, step: number) => void;
  onComplete: (data: BootcampSurveyFormData) => void;
  isLoading?: boolean;
  studentEmail?: string;
}

interface Question {
  id: keyof BootcampSurveyFormData | 'intro';
  type:
    | 'intro'
    | 'text'
    | 'textarea'
    | 'select'
    | 'single-select'
    | 'multi-select'
    | 'multi-select-pills';
  title: string;
  subtitle?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

const questions: Question[] = [
  {
    id: 'intro',
    type: 'intro',
    title: "Let's get to know you",
    subtitle: 'A few quick questions to personalize your experience. This takes about 2 minutes.',
  },
  {
    id: 'companyName',
    type: 'text',
    title: "What's your company name?",
    placeholder: 'Enter your company name',
  },
  {
    id: 'website',
    type: 'text',
    title: "What's your company website?",
    subtitle: 'Optional',
    placeholder: 'https://yourcompany.com',
  },
  {
    id: 'industry',
    type: 'select',
    title: 'What industry are you in?',
    options: INDUSTRY_OPTIONS,
  },
  {
    id: 'companySize',
    type: 'single-select',
    title: 'How big is your company?',
    options: COMPANY_SIZES,
  },
  {
    id: 'roleTitle',
    type: 'text',
    title: "What's your role?",
    placeholder: 'e.g., Founder, Sales Director, CEO',
  },
  {
    id: 'primaryGoal',
    type: 'textarea',
    title: "What's your #1 goal for this bootcamp?",
    subtitle: 'Be specific - this helps us tailor your experience',
    placeholder: 'e.g., Book 10 qualified meetings per month from LinkedIn outreach',
  },
  {
    id: 'biggestChallenges',
    type: 'multi-select',
    title: 'What are your biggest challenges right now?',
    subtitle: 'Select all that apply',
    options: CHALLENGE_OPTIONS,
  },
  {
    id: 'linkedinExperience',
    type: 'single-select',
    title: 'How much LinkedIn outreach experience do you have?',
    options: LINKEDIN_EXPERIENCE_LEVELS,
  },
  {
    id: 'targetAudience',
    type: 'textarea',
    title: 'Who is your target audience?',
    subtitle: 'Describe your ideal customer',
    placeholder: 'e.g., SaaS founders with 10-50 employees in the US',
  },
  {
    id: 'currentLeadGenMethods',
    type: 'multi-select-pills',
    title: 'How do you currently generate leads?',
    subtitle: 'Select all that apply',
    options: LEAD_GEN_METHOD_OPTIONS,
  },
  {
    id: 'monthlyOutreachVolume',
    type: 'single-select',
    title: 'How many outreach messages do you send per month?',
    options: MONTHLY_OUTREACH_VOLUMES,
  },
  {
    id: 'toolsCurrentlyUsing',
    type: 'multi-select-pills',
    title: 'What tools do you currently use?',
    subtitle: 'Select all that apply',
    options: TOOLS_OPTIONS,
  },
];

/**
 * Maps prospect data from Blueprint analysis to survey form fields.
 * Returns only fields that have data, so empty prospect fields don't overwrite existing form values.
 */
function mapProspectToSurveyData(prospect: Prospect): Partial<BootcampSurveyFormData> {
  const mapped: Partial<BootcampSurveyFormData> = {};

  // prospect.company → companyName
  if (prospect.company) {
    mapped.companyName = prospect.company;
  }

  // prospect.businessType → industry (approximate match to INDUSTRY_OPTIONS)
  if (prospect.businessType) {
    const bt = prospect.businessType.toLowerCase();
    const match = INDUSTRY_OPTIONS.find((opt) => bt.includes(opt.toLowerCase().split('/')[0]));
    if (match) {
      mapped.industry = match;
    }
  }

  // prospect.linkedinChallenge → biggestChallenges (try to match against CHALLENGE_OPTIONS)
  if (prospect.linkedinChallenge) {
    const challenge = prospect.linkedinChallenge.toLowerCase();
    const matched = CHALLENGE_OPTIONS.filter((opt) => {
      const words = opt.toLowerCase().split(/\s+/);
      return words.some((w) => w.length > 3 && challenge.includes(w));
    });
    if (matched.length > 0) {
      mapped.biggestChallenges = matched;
    }
  }

  // prospect.postingFrequency → linkedinExperience (approximate)
  if (prospect.postingFrequency) {
    const freq = prospect.postingFrequency.toLowerCase();
    if (freq.includes('never') || freq.includes('rarely') || freq.includes('none')) {
      mapped.linkedinExperience = 'None';
    } else if (freq.includes('beginner') || freq.includes('sometimes') || freq.includes('few')) {
      mapped.linkedinExperience = 'Beginner';
    } else if (
      freq.includes('intermediate') ||
      freq.includes('regular') ||
      freq.includes('weekly')
    ) {
      mapped.linkedinExperience = 'Intermediate';
    } else if (freq.includes('advanced') || freq.includes('daily') || freq.includes('expert')) {
      mapped.linkedinExperience = 'Advanced';
    }
  }

  // prospect.buyerPersona → targetAudience
  if (prospect.buyerPersona) {
    mapped.targetAudience = prospect.buyerPersona;
  }

  // prospect.linkedinHelpArea → primaryGoal (approximate)
  if (prospect.linkedinHelpArea) {
    mapped.primaryGoal = prospect.linkedinHelpArea;
  }

  return mapped;
}

const OnboardingSurvey: React.FC<OnboardingSurveyProps> = ({
  initialData,
  onSave,
  onComplete,
  isLoading,
  studentEmail,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BootcampSurveyFormData>(initialData || {});
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Blueprint pre-fill state
  const [blueprintPrefilledFields, setBlueprintPrefilledFields] = useState<
    Set<keyof BootcampSurveyFormData>
  >(new Set());
  const [showBlueprintBanner, setShowBlueprintBanner] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentStep];
  const progress = Math.round((currentStep / (totalQuestions - 1)) * 100);

  // Blueprint lookup on mount - non-blocking
  useEffect(() => {
    if (!studentEmail) return;

    let cancelled = false;

    const lookupBlueprint = async () => {
      try {
        const prospect = await getProspectByEmail(studentEmail);
        if (cancelled || !prospect) return;

        const mappedData = mapProspectToSurveyData(prospect);
        const prefilledKeys = Object.keys(mappedData) as (keyof BootcampSurveyFormData)[];

        if (prefilledKeys.length === 0) return;

        // Only pre-fill fields that don't already have data from initialData
        setFormData((prev) => {
          const merged = { ...prev };
          for (const key of prefilledKeys) {
            const existingValue = prev[key];
            const isEmpty =
              existingValue === undefined ||
              existingValue === null ||
              existingValue === '' ||
              (Array.isArray(existingValue) && existingValue.length === 0);
            if (isEmpty) {
              (merged as Record<string, unknown>)[key] = mappedData[key];
            }
          }
          return merged;
        });

        // Track which fields were pre-filled (only those that were actually empty)
        setBlueprintPrefilledFields((prev) => {
          const next = new Set(prev);
          for (const key of prefilledKeys) {
            const existingValue = initialData?.[key];
            const isEmpty =
              existingValue === undefined ||
              existingValue === null ||
              existingValue === '' ||
              (Array.isArray(existingValue) && existingValue.length === 0);
            if (isEmpty) {
              next.add(key);
            }
          }
          return next;
        });

        setShowBlueprintBanner(true);
      } catch (err) {
        // Non-blocking: if lookup fails, just show empty form
        logWarn('OnboardingSurvey:lookupBlueprint', 'Blueprint lookup skipped (non-blocking)');
      }
    };

    lookupBlueprint();
    return () => {
      cancelled = true;
    };
  }, [studentEmail, initialData]);

  // Focus input when question changes
  useEffect(() => {
    if (inputRef.current && !isAnimating) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isAnimating]);

  const updateField = <K extends keyof BootcampSurveyFormData>(
    field: K,
    value: BootcampSurveyFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: keyof BootcampSurveyFormData, value: string) => {
    const current = (formData[field] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateField(field, updated as BootcampSurveyFormData[typeof field]);
  };

  const goToNext = () => {
    if (isAnimating || isLoading) return;

    setIsAnimating(true);
    onSave(formData, currentStep);

    if (currentStep < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      onComplete(formData);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (currentQuestion.type !== 'textarea') {
        e.preventDefault();
        goToNext();
      }
    }
  };

  const handleSingleSelect = (field: keyof BootcampSurveyFormData, value: string) => {
    updateField(field, value as BootcampSurveyFormData[typeof field]);
    // Auto-advance after selection
    setTimeout(goToNext, 300);
  };

  const isFieldPrefilled = (fieldId: string): boolean => {
    return blueprintPrefilledFields.has(fieldId as keyof BootcampSurveyFormData);
  };

  const BlueprintTag = () => (
    <span className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full font-medium ml-2">
      <Sparkles className="w-3 h-3" />
      from Blueprint
    </span>
  );

  const renderQuestion = () => {
    const q = currentQuestion;

    if (q.type === 'intro') {
      return (
        <div className="text-center">
          <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-white mb-4">
            {q.title}
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            {q.subtitle}
          </p>
        </div>
      );
    }

    if (q.type === 'text') {
      const prefilled = isFieldPrefilled(q.id as string);
      return (
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            {q.title}
            {prefilled && <BlueprintTag />}
          </h1>
          {q.subtitle && <p className="text-zinc-500 dark:text-zinc-400 mb-6">{q.subtitle}</p>}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={(formData[q.id as keyof BootcampSurveyFormData] as string) || ''}
            onChange={(e) => updateField(q.id as keyof BootcampSurveyFormData, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={q.placeholder}
            className={`w-full text-lg md:text-xl px-0 py-3 bg-transparent border-0 border-b-2 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-0 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors ${
              prefilled
                ? 'border-sky-300 dark:border-sky-600'
                : 'border-zinc-300 dark:border-zinc-600'
            }`}
          />
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-4">
            Press{' '}
            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-medium">
              Enter
            </kbd>{' '}
            to continue
          </p>
        </div>
      );
    }

    if (q.type === 'textarea') {
      const prefilled = isFieldPrefilled(q.id as string);
      return (
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            {q.title}
            {prefilled && <BlueprintTag />}
          </h1>
          {q.subtitle && <p className="text-zinc-500 dark:text-zinc-400 mb-6">{q.subtitle}</p>}
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={(formData[q.id as keyof BootcampSurveyFormData] as string) || ''}
            onChange={(e) => updateField(q.id as keyof BootcampSurveyFormData, e.target.value)}
            placeholder={q.placeholder}
            rows={4}
            className={`w-full text-base px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors resize-none ${
              prefilled
                ? 'border-sky-300 dark:border-sky-600'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
          />
        </div>
      );
    }

    if (q.type === 'select') {
      const prefilled = isFieldPrefilled(q.id as string);
      return (
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white mb-6">
            {q.title}
            {prefilled && <BlueprintTag />}
          </h1>
          <select
            value={(formData[q.id as keyof BootcampSurveyFormData] as string) || ''}
            onChange={(e) => {
              updateField(q.id as keyof BootcampSurveyFormData, e.target.value);
              if (e.target.value) setTimeout(goToNext, 300);
            }}
            className={`w-full text-base px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-zinc-900 dark:text-white outline-none transition-colors cursor-pointer ${
              prefilled
                ? 'border-sky-300 dark:border-sky-600'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <option value="">Select an option</option>
            {q.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (q.type === 'single-select') {
      const prefilled = isFieldPrefilled(q.id as string);
      return (
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white mb-6">
            {q.title}
            {prefilled && <BlueprintTag />}
          </h1>
          <div className="space-y-2">
            {q.options?.map((option, index) => {
              const isSelected = formData[q.id as keyof BootcampSurveyFormData] === option;
              const letter = String.fromCharCode(65 + index);
              return (
                <button
                  key={option}
                  onClick={() => handleSingleSelect(q.id as keyof BootcampSurveyFormData, option)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-violet-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : letter}
                  </span>
                  <span
                    className={`text-base font-medium ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (q.type === 'multi-select') {
      const selected = (formData[q.id as keyof BootcampSurveyFormData] as string[]) || [];
      const prefilled = isFieldPrefilled(q.id as string);
      return (
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            {q.title}
            {prefilled && <BlueprintTag />}
          </h1>
          {q.subtitle && <p className="text-zinc-500 dark:text-zinc-400 mb-6">{q.subtitle}</p>}
          <div className="space-y-2">
            {q.options?.map((option, index) => {
              const isSelected = selected.includes(option);
              const letter = String.fromCharCode(65 + index);
              return (
                <button
                  key={option}
                  onClick={() => toggleArrayField(q.id as keyof BootcampSurveyFormData, option)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-violet-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : letter}
                  </span>
                  <span
                    className={`font-medium ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (q.type === 'multi-select-pills') {
      const selected = (formData[q.id as keyof BootcampSurveyFormData] as string[]) || [];
      return (
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            {q.title}
          </h1>
          {q.subtitle && <p className="text-zinc-500 dark:text-zinc-400 mb-6">{q.subtitle}</p>}
          <div className="flex flex-wrap gap-2">
            {q.options?.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggleArrayField(q.id as keyof BootcampSurveyFormData, option)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    isSelected
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[85vh]">
      {/* Blueprint Pre-fill Banner */}
      {showBlueprintBanner && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-800/30 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <p className="text-sm text-sky-700 dark:text-sky-300">
            We've pre-filled some answers from your Blueprint analysis. Feel free to edit them.
          </p>
          <button
            onClick={() => setShowBlueprintBanner(false)}
            className="ml-auto text-sky-400 hover:text-sky-600 dark:hover:text-sky-200 text-xs font-medium flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="h-1 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
        <div
          className="h-full bg-violet-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Counter */}
      <div className="px-6 pt-4 flex items-center justify-between text-sm flex-shrink-0">
        <span className="text-zinc-500 dark:text-zinc-400">
          {currentStep > 0 ? `${currentStep} of ${totalQuestions - 1}` : ''}
        </span>
        {currentStep > 0 && (
          <span className="text-zinc-500 dark:text-zinc-400">{progress}% complete</span>
        )}
      </div>

      {/* Question Content - Scrollable */}
      <div
        className={`flex-1 overflow-y-auto p-6 md:p-10 transition-opacity duration-150 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="min-h-full flex items-center justify-center">{renderQuestion()}</div>
      </div>

      {/* Navigation - Fixed at bottom */}
      <div className="p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={goToPrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={goToNext}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : currentStep === totalQuestions - 1 ? (
              <>
                Complete
                <Check className="w-4 h-4" />
              </>
            ) : currentStep === 0 ? (
              <>
                Get Started
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                OK
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSurvey;
