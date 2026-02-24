import React, { useEffect, useState } from 'react';
import type { IntakeWizardData } from '../../../types/dfy-intake-types';
import { INTAKE_STEPS, STEP_TITLES } from '../../../types/dfy-intake-types';
import { submitIntakeWizard, fetchBlueprintData } from '../../../services/dfy-intake-service';
import StepBestClients from './StepBestClients';
import StepDreamClients from './StepDreamClients';
import StepDataDump from './StepDataDump';
import StepQuickConfirms from './StepQuickConfirms';

interface IntroOfferIntakeWizardProps {
  portalSlug: string;
  clientName: string;
  blueprintProspectId: string | null;
  onComplete: () => void;
}

const TOTAL_STEPS = INTAKE_STEPS.length;

function createInitialData(): IntakeWizardData {
  return {
    bestClientUrls: [
      { url: '', notes: '' },
      { url: '', notes: '' },
      { url: '', notes: '' },
    ],
    dreamClientUrls: [
      { url: '', notes: '' },
      { url: '', notes: '' },
      { url: '', notes: '' },
    ],
    files: [],
    rawTextDump: '',
    confirms: {
      niche: '',
      tone: '',
      keyTopics: [],
      offer: '',
      avoid: '',
    },
  };
}

const IntroOfferIntakeWizard: React.FC<IntroOfferIntakeWizardProps> = ({
  portalSlug,
  clientName,
  blueprintProspectId,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<IntakeWizardData>(createInitialData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blueprintLoaded, setBlueprintLoaded] = useState(false);

  const firstName = clientName.split(' ')[0] || clientName;
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  // Pre-fill confirms from Blueprint data on mount
  useEffect(() => {
    if (!blueprintProspectId || blueprintLoaded) return;

    let cancelled = false;

    async function loadBlueprint() {
      try {
        const result = await fetchBlueprintData(blueprintProspectId!);
        if (cancelled || !result) return;

        setData((prev) => ({
          ...prev,
          confirms: {
            ...prev.confirms,
            niche: result.niche || prev.confirms.niche,
            tone: result.tone || prev.confirms.tone,
            keyTopics: result.keyTopics.length > 0 ? result.keyTopics : prev.confirms.keyTopics,
            offer: result.offer || prev.confirms.offer,
          },
        }));
        setBlueprintLoaded(true);
      } catch {
        // Silently handle — user can still fill in manually
        setBlueprintLoaded(true);
      }
    }

    loadBlueprint();
    return () => {
      cancelled = true;
    };
  }, [blueprintProspectId, blueprintLoaded]);

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const goForward = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await submitIntakeWizard(portalSlug, data);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepBestClients
            entries={data.bestClientUrls}
            onChange={(bestClientUrls) => setData((prev) => ({ ...prev, bestClientUrls }))}
          />
        );
      case 1:
        return (
          <StepDreamClients
            entries={data.dreamClientUrls}
            onChange={(dreamClientUrls) => setData((prev) => ({ ...prev, dreamClientUrls }))}
          />
        );
      case 2:
        return (
          <StepDataDump
            files={data.files}
            rawTextDump={data.rawTextDump}
            onFilesChange={(files) => setData((prev) => ({ ...prev, files }))}
            onTextChange={(rawTextDump) => setData((prev) => ({ ...prev, rawTextDump }))}
          />
        );
      case 3:
        return (
          <StepQuickConfirms
            confirms={data.confirms}
            onChange={(confirms) => setData((prev) => ({ ...prev, confirms }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* ── Header ────────────────────────────────────── */}
        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">
            Intro Offer Setup
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
            Welcome, {firstName}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Complete this form and we'll build your entire LinkedIn lead generation system.
          </p>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
              <span>
                Step {currentStep + 1} of {TOTAL_STEPS}: {STEP_TITLES[INTAKE_STEPS[currentStep]]}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        {/* ── Step Content ──────────────────────────────── */}
        <main className="mb-8">{renderStep()}</main>

        {/* ── Error ─────────────────────────────────────── */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* ── Navigation ────────────────────────────────── */}
        <footer className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-zinc-800">
          {/* Back button */}
          {currentStep > 0 ? (
            <button
              onClick={goBack}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800/50 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
          ) : (
            <div /> // Spacer to keep flex layout
          )}

          {/* Forward / Submit button */}
          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Building your system...
                </>
              ) : (
                <>
                  Build My System
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={goForward}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/25 transition-all"
            >
              Continue
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </footer>

        {/* ── Footer help ───────────────────────────────── */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Questions? Contact us at{' '}
            <a
              href="mailto:tim@modernagencysales.com"
              className="underline hover:text-gray-600 dark:hover:text-zinc-300"
            >
              tim@modernagencysales.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntroOfferIntakeWizard;
