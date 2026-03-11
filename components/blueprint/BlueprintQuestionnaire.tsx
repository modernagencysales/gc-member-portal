/**
 * BlueprintQuestionnaire.tsx
 * Multi-step wizard that collects LinkedIn profile and business context
 * after the user enters their email on the landing page.
 * Manages its own step state, direction animation, keyboard nav, and auto-advance.
 * Never manages submission — calls onComplete with final FormData.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { FormData } from '../../hooks/useBlueprintForm';
import { QUESTIONNAIRE_STEPS, LETTER_PREFIXES } from './questionnaire-steps';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuestionnaireProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onComplete: (finalData: FormData) => void;
  onExit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

// ─── SMS Consent ──────────────────────────────────────────────────────────────

interface SmsConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SmsConsent: React.FC<SmsConsentProps> = ({ checked, onChange }) => (
  <label className="flex items-start gap-2.5 mt-4 cursor-pointer select-none group">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-violet-500 focus:ring-violet-500 flex-shrink-0"
    />
    <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
      I agree to receive SMS messages from Modern Agency Sales. Msg frequency varies. Msg & data
      rates may apply. Reply STOP to unsubscribe, HELP for help.{' '}
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        Privacy Policy
      </a>
      {' & '}
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        Terms of Service
      </a>
      .
    </span>
  </label>
);

// ─── Component ───────────────────────────────────────────────────────────────

const BlueprintQuestionnaire: React.FC<QuestionnaireProps> = ({
  formData,
  setFormData,
  onComplete,
  onExit,
  isSubmitting,
  error,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [stepError, setStepError] = useState<string | null>(null);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<ReturnType<typeof setTimeout> | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const totalSteps = QUESTIONNAIRE_STEPS.length;
  const step = QUESTIONNAIRE_STEPS[currentStep];
  const value = formData[step.field];

  // Auto-focus input on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Cleanup auto-advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    };
  }, [autoAdvanceTimer]);

  const validateAndAdvance = useCallback(() => {
    if (isSubmitting) return;
    const isOptional = step.required === false;
    if (step.validation && value.trim()) {
      const err = step.validation(value);
      if (err) {
        setStepError(err);
        return;
      }
    }
    if (!value.trim() && step.type !== 'textarea' && !isOptional) {
      setStepError('Please provide an answer to continue.');
      return;
    }
    setStepError(null);

    if (currentStep < totalSteps - 1) {
      setDirection('forward');
      setCurrentStep((s) => s + 1);
    } else {
      onComplete(formData);
    }
  }, [step, value, currentStep, totalSteps, onComplete, formData, isSubmitting]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setStepError(null);
      setDirection('backward');
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
        return;
      }
      if (e.key === 'Enter' && step.type !== 'textarea') {
        e.preventDefault();
        validateAndAdvance();
      }
      if (e.key === 'Enter' && step.type === 'textarea' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        validateAndAdvance();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step.type, validateAndAdvance, onExit]);

  const handleOptionSelect = (optValue: string) => {
    if (isSubmitting) return;
    const updated = { ...formData, [step.field]: optValue };
    setFormData(updated);
    setStepError(null);
    // Auto-advance after brief delay — pass snapshot to avoid stale closure
    const timer = setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setDirection('forward');
        setCurrentStep((s) => s + 1);
      } else {
        onComplete(updated);
      }
    }, 300);
    setAutoAdvanceTimer(timer);
  };

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;
  const animClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left';
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-2">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 tabular-nums whitespace-nowrap">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 overflow-y-auto">
        <div key={currentStep} className={`w-full max-w-xl ${animClass}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {step.question}
          </h2>
          {step.subtitle && (
            <p className="text-base text-zinc-500 dark:text-zinc-400 mb-6">{step.subtitle}</p>
          )}
          {!step.subtitle && <div className="mb-6" />}

          {/* Text input */}
          {step.type === 'text' && (
            <div>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={value}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, [step.field]: e.target.value }));
                  setStepError(null);
                }}
                placeholder={step.placeholder}
                className="w-full px-4 py-3.5 rounded-xl text-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
              />
              {step.id === 'phone' && (
                <SmsConsent
                  checked={formData.smsConsent === 'true'}
                  onChange={(checked) =>
                    setFormData((prev) => ({ ...prev, smsConsent: checked ? 'true' : '' }))
                  }
                />
              )}
            </div>
          )}

          {/* Textarea */}
          {step.type === 'textarea' && (
            <div>
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={value}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, [step.field]: e.target.value }));
                  setStepError(null);
                }}
                placeholder={step.placeholder}
                rows={4}
                className="w-full px-4 py-3.5 rounded-xl text-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors resize-none"
              />
            </div>
          )}

          {/* Single select cards */}
          {step.type === 'single-select' && step.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {step.options.map((opt, i) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionSelect(opt.value)}
                    disabled={isSubmitting}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-violet-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {LETTER_PREFIXES[i] || String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-base font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Binary (yes/no) */}
          {step.type === 'binary' && step.options && (
            <div className="flex gap-4">
              {step.options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionSelect(opt.value)}
                    disabled={isSubmitting}
                    className={`flex-1 py-4 rounded-xl border-2 text-center text-lg font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Errors */}
          {stepError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{stepError}</p>}
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-6 pt-2">
        <div className="max-w-xl mx-auto">
          {(step.type === 'text' || step.type === 'textarea') && (
            <button
              onClick={
                isLastStep && step.type !== 'textarea'
                  ? () => onComplete(formData)
                  : validateAndAdvance
              }
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-base font-semibold bg-violet-500 hover:bg-violet-600 disabled:bg-violet-400 text-white transition-colors shadow-lg shadow-violet-500/25"
            >
              {isSubmitting ? 'Submitting...' : isLastStep ? 'Get My Blueprint' : 'Continue'}
              {!isSubmitting && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500 text-center">
            {step.type === 'textarea'
              ? 'Press Ctrl+Enter to continue'
              : step.type === 'text'
                ? 'Press Enter to continue'
                : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlueprintQuestionnaire;
