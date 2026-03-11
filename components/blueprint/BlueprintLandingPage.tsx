/**
 * BlueprintLandingPage.tsx
 * Orchestrator for the Blueprint landing page.
 * Delegates all state/logic to useBlueprintForm.
 * Renders landing phase (NavBar → Hero → StatsRow → SocialProof → HowItWorks → Footer)
 * or questionnaire phase (BlueprintQuestionnaire full-screen overlay).
 */

import React from 'react';
import { ArrowUp } from 'lucide-react';
import { useIClosedLiftWidget } from '../shared/IClosedBooking';
import { useBlueprintForm } from '../../hooks/useBlueprintForm';
import NavBar from './landing/NavBar';
import Hero from './landing/Hero';
import { StatsRow, SocialProof } from './landing/Hero';
import HowItWorks from './landing/HowItWorks';
import Footer from './landing/Footer';
import BlueprintQuestionnaire from './BlueprintQuestionnaire';

// ─── CSS Animations ───────────────────────────────────────────────────────────

const animationStyles = `
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-slide-in-right { animation: slideInRight 0.4s ease-out both; }
.animate-slide-in-left { animation: slideInLeft 0.4s ease-out both; }
.animate-fade-in { animation: fadeIn 0.2s ease-out both; }
`;

// ─── Component ───────────────────────────────────────────────────────────────

const BlueprintLandingPage: React.FC = () => {
  useIClosedLiftWidget();

  const {
    phase,
    setPhase,
    formData,
    setFormData,
    isSubmitting,
    error,
    logos,
    maxLogosLanding,
    showStickyCta,
    heroRef,
    handleContinueToQuestionnaire,
    handleQuestionnaireComplete,
  } = useBlueprintForm();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <style>{animationStyles}</style>

      {phase === 'landing' ? (
        <>
          <NavBar />
          <div ref={heroRef}>
            <Hero
              formData={formData}
              setFormData={setFormData}
              onContinue={handleContinueToQuestionnaire}
            />
          </div>
          <StatsRow />
          <SocialProof logos={logos} maxLogos={maxLogosLanding} />
          <HowItWorks />
          <Footer />

          {/* Sticky CTA — appears after scrolling past the form */}
          <div
            className={`
              fixed bottom-0 left-0 right-0 z-50
              bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm
              border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-none
              transform transition-all duration-300 ease-in-out
              ${showStickyCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
            `}
          >
            <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Free personalized blueprint — $3,000+ value
                  </span>
                </div>
                <button
                  onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-lg shadow-violet-500/25 ml-auto"
                >
                  <ArrowUp className="w-4 h-4" />
                  Get Your Blueprint Now
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <BlueprintQuestionnaire
          formData={formData}
          setFormData={setFormData}
          onComplete={handleQuestionnaireComplete}
          onExit={() => setPhase('landing')}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </div>
  );
};

export default BlueprintLandingPage;
