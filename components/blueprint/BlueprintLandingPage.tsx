import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Linkedin,
  Mail,
  CheckCircle,
  Sparkles,
  FileText,
  ArrowUp,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LogoBar from './LogoBar';
import {
  getClientLogos,
  getBlueprintSettings,
  ClientLogo,
} from '../../services/blueprint-supabase';

import { GTM_SYSTEM_URL } from '../../lib/api-config';

const INTAKE_API_URL = `${GTM_SYSTEM_URL}/api/webhooks/blueprint-form`;

const SESSION_KEY = 'blueprint_partial';
const SESSION_MAX_AGE = 30 * 60 * 1000; // 30 minutes

// ============================================
// Types
// ============================================

interface FormData {
  email: string;
  fullName: string;
  linkedinUrl: string;
  phone: string;
  smsConsent: string;
  timezone: string;
  businessType: string;
  linkedinChallenge: string;
  postingFrequency: string;
  linkedinHelpArea: string;
  hasFunnel: string;
  learningInvestment: string;
  monthlyIncome: string;
}

type Phase = 'landing' | 'questionnaire';

// ============================================
// Questionnaire Step Config
// ============================================

interface StepOption {
  label: string;
  value: string;
}

interface StepConfig {
  id: string;
  question: string;
  subtitle?: string;
  type: 'text' | 'textarea' | 'single-select' | 'binary';
  field: keyof FormData;
  options?: StepOption[];
  placeholder?: string;
  required?: boolean; // defaults to true
  validation?: (value: string) => string | null;
}

const QUESTIONNAIRE_STEPS: StepConfig[] = [
  {
    id: 'linkedin-url',
    question: "What's your LinkedIn profile URL?",
    subtitle:
      'This is the only thing we need to generate your blueprint. Everything else helps us make it better.',
    type: 'text',
    field: 'linkedinUrl',
    placeholder: 'https://linkedin.com/in/your-profile',
    validation: (v) =>
      /linkedin\.com\/in\//i.test(v)
        ? null
        : 'Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/your-name)',
  },
  {
    id: 'phone',
    question: "What's the best number to reach you?",
    subtitle:
      'Optional — so we can follow up with a quick call if your blueprint reveals big opportunities.',
    type: 'text',
    field: 'phone',
    placeholder: '+1 (555) 123-4567',
    required: false,
  },
  {
    id: 'business-type',
    question: 'What type of business do you run?',
    type: 'single-select',
    field: 'businessType',
    options: [
      { label: 'Agency', value: 'Agency' },
      { label: 'Consulting', value: 'Consulting' },
      { label: 'Coaching', value: 'Coaching' },
      { label: 'SaaS', value: 'SaaS' },
      { label: 'Freelance', value: 'Freelance' },
      { label: 'Other', value: 'Other' },
    ],
  },
  {
    id: 'linkedin-challenge',
    question: "What's your biggest LinkedIn challenge right now?",
    subtitle: 'Be specific — this helps us tailor your blueprint.',
    type: 'textarea',
    field: 'linkedinChallenge',
    placeholder: 'e.g. I post regularly but get no inbound leads...',
  },
  {
    id: 'posting-frequency',
    question: 'How often do you post on LinkedIn?',
    subtitle: 'Roughly how often are you posting?',
    type: 'single-select',
    field: 'postingFrequency',
    options: [
      { label: 'Daily', value: 'Daily' },
      { label: 'Weekly', value: 'Weekly' },
      { label: 'Monthly', value: 'Monthly' },
      { label: 'Less than monthly', value: 'Less than monthly' },
    ],
  },
  {
    id: 'help-area',
    question: 'What do you need the most help with?',
    type: 'single-select',
    field: 'linkedinHelpArea',
    options: [
      { label: 'Profile optimization', value: 'Profile optimization' },
      { label: 'Content strategy', value: 'Content strategy' },
      { label: 'Lead generation', value: 'Lead generation' },
      { label: 'Building authority', value: 'Building authority' },
      { label: 'All of the above', value: 'All of the above' },
    ],
  },
  {
    id: 'has-funnel',
    question: 'Do you have a content-to-funnel system?',
    subtitle: 'A system that turns LinkedIn content into booked calls or sales.',
    type: 'binary',
    field: 'hasFunnel',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  },
  {
    id: 'learning-investment',
    question: 'How much have you invested in your own learning in the last year?',
    type: 'single-select',
    field: 'learningInvestment',
    options: [
      { label: 'Just free resources', value: 'Free resources only' },
      { label: 'Under $500', value: 'Under $500' },
      { label: '$500 - $2,000', value: '$500-$2000' },
      { label: '$2,000+', value: '$2000+' },
    ],
  },
  {
    id: 'monthly-revenue',
    question: "What's your current monthly revenue?",
    subtitle: 'This helps us calibrate recommendations to your stage.',
    type: 'single-select',
    field: 'monthlyIncome',
    options: [
      { label: 'Not generating revenue yet', value: 'Not generating revenue yet' },
      { label: 'Under $5k', value: 'Under $5k' },
      { label: '$5k - $10k', value: '$5k-$10k' },
      { label: '$10k - $30k', value: '$10k-$30k' },
      { label: '$30k - $50k', value: '$30k-$50k' },
      { label: '$50k - $100k', value: '$50k-$100k' },
      { label: '$100k+', value: '$100k+' },
    ],
  },
];

const LETTER_PREFIXES = ['A', 'B', 'C', 'D', 'E', 'F'];

// ============================================
// Constants
// ============================================

const STATS = [
  { value: '300+', label: 'Blueprints Delivered' },
  { value: '$4.7M', label: 'Agency Revenue Built on LinkedIn' },
  { value: '20K+', label: 'Opted-in Leads Generated' },
];

const STEPS = [
  {
    number: 1,
    icon: Linkedin,
    title: 'Submit Your Profile',
    description:
      "Enter your LinkedIn URL and we'll analyze your entire presence — profile, content, and engagement.",
  },
  {
    number: 2,
    icon: Sparkles,
    title: 'AI Analysis',
    description:
      "Our system scores you across 5 key dimensions and identifies exactly where you're leaving pipeline on the table.",
  },
  {
    number: 3,
    icon: FileText,
    title: 'Get Your Blueprint',
    description:
      'Receive a personalized report with specific rewrites, content ideas, and a 60-day content calendar.',
  },
];

// ============================================
// CSS Animations
// ============================================

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

// ============================================
// Nav Bar
// ============================================

const NavBar: React.FC = () => (
  <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Modern Agency Sales
      </span>
      <div className="flex items-center gap-3 sm:gap-5">
        <Link
          to="/programs"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          What We Do
        </Link>
        <Link
          to="/case-studies"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Case Studies
        </Link>
        <Link
          to="/affiliate/apply"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Affiliates
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        >
          Login
        </Link>
        <ThemeToggle inline />
      </div>
    </div>
  </nav>
);

// ============================================
// Hero Section (email-only opt-in)
// ============================================

interface HeroProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onContinue: () => void;
}

const Hero: React.FC<HeroProps> = ({ formData, setFormData, onContinue }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue();
  };

  return (
    <section className="bg-gradient-to-b from-violet-50/50 to-white dark:from-zinc-950 dark:to-zinc-950 py-12 sm:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Trust Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-xs sm:text-sm font-medium text-violet-700 dark:text-violet-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered — 300+ blueprints delivered
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 dark:text-zinc-100 text-center leading-[1.1] tracking-tight mb-4 max-w-4xl mx-auto">
          We&apos;ll Build Your Next 60 Days on LinkedIn
          <span className="text-violet-600 dark:text-violet-400"> — For Free</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 text-center max-w-2xl mx-auto mb-8 leading-relaxed">
          Get a free personalized blueprint: profile rewrite, 60-day content calendar, 3 lead
          magnets, and a full authority audit.
        </p>

        {/* Opt-In */}
        <div className="max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                id="email"
                type="email"
                required
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-base border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 whitespace-nowrap"
            >
              Get My Free Blueprint
            </button>
          </form>

          {/* Proof Points */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-5 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" /> Free forever
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" /> $3,000+ value
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" /> No credit card
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// Blueprint Questionnaire
// ============================================

interface QuestionnaireProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onComplete: (finalData: FormData) => void;
  onExit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

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
                <label className="flex items-start gap-2.5 mt-4 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={formData.smsConsent === 'true'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        smsConsent: e.target.checked ? 'true' : '',
                      }))
                    }
                    className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-violet-500 focus:ring-violet-500 flex-shrink-0"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    I agree to receive SMS messages from Modern Agency Sales. Msg frequency varies.
                    Msg & data rates may apply. Reply STOP to unsubscribe, HELP for help.{' '}
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

          {/* Error */}
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

// ============================================
// Stats Row
// ============================================

const StatsRow: React.FC = () => (
  <section className="bg-zinc-50 dark:bg-zinc-900/50 py-10 sm:py-16">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div className="text-2xl sm:text-5xl font-bold text-violet-600 dark:text-violet-400 mb-1 sm:mb-2">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ============================================
// Social Proof
// ============================================

interface SocialProofProps {
  logos: ClientLogo[];
  maxLogos?: number;
}

const SocialProof: React.FC<SocialProofProps> = ({ logos, maxLogos }) => (
  <section className="bg-white dark:bg-zinc-950 py-16 sm:py-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Trusted by B2B Founders, Agency Owners, and Consultants
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
        From solopreneurs to 7-figure agencies, we&apos;ve helped 300+ business owners fix their
        LinkedIn presence.
      </p>

      <LogoBar logos={logos} maxLogos={maxLogos} hideLabel />
    </div>
  </section>
);

// ============================================
// How It Works
// ============================================

const HowItWorks: React.FC = () => (
  <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16 sm:py-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-4">
        How It Works
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-2xl mx-auto mb-12">
        Three simple steps to your personalized LinkedIn Authority Blueprint.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">
                Step {step.number}
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ============================================
// Footer
// ============================================

const Footer: React.FC = () => (
  <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-2">
      <p className="text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Modern Agency Sales. All rights reserved.
      </p>
      <Link
        to="/affiliate/apply"
        className="inline-block text-sm text-zinc-400 hover:text-violet-500 transition-colors"
      >
        Become an Affiliate
      </Link>
      <div className="flex justify-center gap-3">
        <Link
          to="/privacy"
          className="text-[11px] text-zinc-400 hover:text-zinc-500 transition-colors"
        >
          Privacy Policy
        </Link>
        <span className="text-[11px] text-zinc-300 dark:text-zinc-700">&middot;</span>
        <Link
          to="/terms"
          className="text-[11px] text-zinc-400 hover:text-zinc-500 transition-colors"
        >
          Terms of Service
        </Link>
      </div>
    </div>
  </footer>
);

// ============================================
// BlueprintLandingPage Component
// ============================================

const BlueprintLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('landing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [maxLogosLanding, setMaxLogosLanding] = useState<number | undefined>(6);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    fullName: '',
    linkedinUrl: '',
    phone: '',
    smsConsent: '',
    timezone: '',
    businessType: '',
    linkedinChallenge: '',
    postingFrequency: '',
    linkedinHelpArea: '',
    hasFunnel: '',
    learningInvestment: '',
    monthlyIncome: '',
  });

  // Auto-detect timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setFormData((prev) => ({ ...prev, timezone: tz }));
    } catch {
      // ignore — timezone will be empty
    }
  }, []);

  // Restore email from sessionStorage on mount (only on actual page refresh, not fresh navigation)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.timestamp && Date.now() - parsed.timestamp < SESSION_MAX_AGE) {
          setFormData((prev) => ({
            ...prev,
            email: parsed.email || prev.email,
          }));
          // Only restore questionnaire phase on actual page reload (not fresh navigation)
          const navEntries = window.performance.getEntriesByType('navigation');
          const isReload =
            navEntries.length > 0 && (navEntries[0] as { type?: string }).type === 'reload';
          if (parsed.phase === 'questionnaire' && isReload) {
            setPhase('questionnaire');
          }
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    getClientLogos().then(setLogos);
    getBlueprintSettings().then((s) => {
      if (s) setMaxLogosLanding(s.maxLogosLanding ?? 6);
    });
  }, []);

  // Show sticky CTA once hero scrolls out of view (only in landing phase)
  useEffect(() => {
    if (phase !== 'landing') return;
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [phase]);

  const handleContinueToQuestionnaire = () => {
    // Save partial data to sessionStorage
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          email: formData.email,
          phase: 'questionnaire',
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore storage errors
    }
    setPhase('questionnaire');
  };

  const handleQuestionnaireComplete = async (finalData: FormData) => {
    // Belt-and-suspenders: ref guard prevents duplicate submissions even if
    // React hasn't flushed the isSubmitting state update yet
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const webhookSecret = import.meta.env.VITE_BLUEPRINT_WEBHOOK_SECRET;
      if (webhookSecret) {
        headers['x-webhook-secret'] = webhookSecret;
      }

      const payload = {
        linkedin_url: finalData.linkedinUrl,
        full_name: finalData.fullName,
        email: finalData.email,
        phone: finalData.phone || undefined,
        sms_consent: finalData.smsConsent === 'true',
        timezone: finalData.timezone || undefined,
        business_type: finalData.businessType,
        monthly_income: finalData.monthlyIncome,
        linkedin_challenge: finalData.linkedinChallenge,
        posting_frequency: finalData.postingFrequency,
        linkedin_help_area: finalData.linkedinHelpArea,
        has_funnel: finalData.hasFunnel,
        learning_investment: finalData.learningInvestment,
        send_email: true,
        source_url: window.location.href,
        lead_magnet_source: 'blueprint-landing',
        referral_code: (() => {
          const match = document.cookie.match(/(?:^|; )gtm_ref=([^;]*)/);
          return match ? decodeURIComponent(match[1]) : undefined;
        })(),
      };

      console.log('[Blueprint] Submitting to:', INTAKE_API_URL);
      console.log('[Blueprint] Payload:', payload);

      const response = await fetch(INTAKE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      console.log('[Blueprint] Response status:', response.status);

      let data;
      try {
        data = await response.json();
      } catch {
        const text = await response.text().catch(() => '(no body)');
        console.error('[Blueprint] Non-JSON response:', response.status, text);
        setError(`Server error (${response.status}). Please try again.`);
        // Re-enable on error so user can retry
        submittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      console.log('[Blueprint] Response data:', data);

      if (response.ok) {
        // Success — keep button disabled, navigate away
        sessionStorage.removeItem(SESSION_KEY);
        navigate('/blueprint/thank-you', {
          state: {
            prospectId: data.prospect_id,
            reportUrl: data.report_url,
            monthlyIncome: finalData.monthlyIncome,
          },
        });
      } else if (response.status === 409) {
        // Duplicate — still a success, navigate away
        sessionStorage.removeItem(SESSION_KEY);
        navigate('/blueprint/thank-you', {
          state: {
            prospectId: data.existing_prospect_id,
            reportUrl: data.report_url,
            monthlyIncome: finalData.monthlyIncome,
          },
        });
      } else {
        console.error('[Blueprint] Error response:', response.status, data);
        setError(
          data.error ||
            data.message ||
            `Something went wrong (${response.status}). Please try again.`
        );
        // Re-enable on error so user can retry
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('[Blueprint] Network/fetch error:', err);
      setError('Something went wrong. Please check your connection and try again.');
      // Re-enable on error so user can retry
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

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
