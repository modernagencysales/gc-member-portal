import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { OFFERS, type OfferData } from './offer-data';

const foundations = OFFERS.foundations;
const engineering = OFFERS.engineering;

// ============================================
// Nav Bar
// ============================================

const NavBar: React.FC = () => (
  <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Modern Agency Sales
      </Link>
      <div className="flex items-center gap-3 sm:gap-5">
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
          to="/"
          onClick={() => window.scrollTo(0, 0)}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
        >
          Get Your Blueprint
        </Link>
        <ThemeToggle inline />
      </div>
    </div>
  </nav>
);

// ============================================
// Hero
// ============================================

const STATS = [
  { value: '$4.7M', label: 'Agency Revenue Built on LinkedIn' },
  { value: '20K+', label: 'Opted-in Leads Generated' },
  { value: '$200K+', label: 'LTV Deals Closed' },
  { value: '300+', label: 'Founders Trained' },
];

const Hero: React.FC = () => (
  <section className="bg-gradient-to-b from-violet-50/50 to-white dark:from-zinc-950 dark:to-zinc-950 py-12 sm:py-16 lg:py-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-xs sm:text-sm font-medium text-violet-700 dark:text-violet-300 shadow-sm mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        LinkedIn Lead Generation for B2B
      </span>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-[1.1] tracking-tight mb-4 max-w-4xl mx-auto">
        We Help B2B Founders Build Client Acquisition Systems on LinkedIn
      </h1>

      <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Answer two quick questions and we&apos;ll show you the right program for where you are right
        now.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400 mb-1">
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
// Quiz
// ============================================

type ProgramKey = 'foundations' | 'engineering';

interface QuizOption {
  label: string;
  answer: ProgramKey;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "What's your main goal right now?",
    options: [
      {
        label: 'Learn how to generate leads on LinkedIn and build a daily system',
        answer: 'foundations',
      },
      {
        label: 'Build a full lead generation machine across LinkedIn, email, and ads',
        answer: 'engineering',
      },
    ],
  },
  {
    question: 'Where is your business right now?',
    options: [
      {
        label: "I'm getting started or looking for my first consistent lead source",
        answer: 'foundations',
      },
      {
        label: 'I have an established business and want to scale my pipeline',
        answer: 'engineering',
      },
    ],
  },
];

interface QuizProps {
  onResult: (result: ProgramKey) => void;
}

const Quiz: React.FC<QuizProps> = ({ onResult }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ProgramKey[]>([]);

  const handleSelect = (answer: ProgramKey) => {
    const next = [...answers, answer];
    setAnswers(next);

    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Tally: if any answer is "engineering", recommend engineering
      const result = next.includes('engineering') ? 'engineering' : 'foundations';
      onResult(result);
    }
  };

  const q = QUIZ_QUESTIONS[step];

  return (
    <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16 sm:py-20">
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">
          Question {step + 1} of {QUIZ_QUESTIONS.length}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
          {q.question}
        </h2>

        <div className="space-y-4">
          {q.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.answer)}
              className="w-full text-left p-5 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-violet-400 dark:hover:border-violet-500/50 transition-colors"
            >
              <span className="text-base font-medium text-zinc-800 dark:text-zinc-200">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// Recommendation Result
// ============================================

interface RecommendationProps {
  recommended: ProgramKey;
  onReset: () => void;
}

const Recommendation: React.FC<RecommendationProps> = ({ recommended, onReset }) => {
  const offer = OFFERS[recommended];
  const altKey: ProgramKey = recommended === 'foundations' ? 'engineering' : 'foundations';
  const altOffer = OFFERS[altKey];
  const [showCompare, setShowCompare] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      {/* Recommended program */}
      <section ref={resultRef} className="bg-zinc-50 dark:bg-zinc-900/50 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 mb-4">
              <CheckCircle className="w-3.5 h-3.5" />
              Your Recommended Program
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              {offer.name}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">{offer.tagline}</p>
          </div>

          <ProgramDetail offer={offer} />

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-lg shadow-violet-500/25"
            >
              Get Your Blueprint <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Secondary actions */}
          <div className="mt-6 flex flex-col items-center gap-3 text-sm">
            <button
              onClick={() => setShowCompare((v) => !v)}
              className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showCompare ? 'rotate-180' : ''}`}
              />
              {showCompare ? 'Hide comparison' : `Compare with ${altOffer.name}`}
            </button>
            <button
              onClick={onReset}
              className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Retake quiz
            </button>
          </div>
        </div>
      </section>

      {/* Comparison (hidden by default) */}
      {showCompare && (
        <section className="bg-white dark:bg-zinc-950 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-10">
              Side-by-Side Comparison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CompareCard offer={offer} label="Recommended for You" isRecommended />
              <CompareCard offer={altOffer} label="Also Available" />
            </div>
          </div>
        </section>
      )}
    </>
  );
};

// ============================================
// Program Detail (single card for recommendation)
// ============================================

const ProgramDetail: React.FC<{ offer: OfferData }> = ({ offer }) => (
  <div className="rounded-2xl border-2 border-violet-400 dark:border-violet-500/50 bg-white dark:bg-zinc-900 p-6 sm:p-8">
    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">{offer.price}</p>

    <div className="mb-6">
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
        What You Get
      </h4>
      <ul className="space-y-2.5">
        {offer.solutionBullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
        This Is For You If
      </h4>
      <ul className="space-y-2.5">
        {offer.isForYou.slice(0, 4).map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <ArrowRight className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// ============================================
// Compare Card (compact, for side-by-side)
// ============================================

const CompareCard: React.FC<{
  offer: OfferData;
  label: string;
  isRecommended?: boolean;
}> = ({ offer, label, isRecommended }) => (
  <div
    className={`rounded-2xl border-2 p-6 flex flex-col ${
      isRecommended
        ? 'border-violet-400 dark:border-violet-500/50 bg-white dark:bg-zinc-900'
        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
    }`}
  >
    <span
      className={`inline-block self-start text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
        isRecommended
          ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
      }`}
    >
      {label}
    </span>
    <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">{offer.name}</h4>
    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{offer.tagline}</p>
    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">{offer.price}</p>

    <ul className="space-y-2 mb-6">
      {offer.solutionBullets.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
          <span>{b}</span>
        </li>
      ))}
    </ul>

    <div className="mt-auto">
      <Link
        to="/"
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          isRecommended
            ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25'
            : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900'
        }`}
      >
        Get Your Blueprint <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </div>
);

// ============================================
// Fallback CTA
// ============================================

const FallbackCTA: React.FC = () => (
  <section className="bg-white dark:bg-zinc-950 py-16 sm:py-20">
    <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Still Not Sure?
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        Start with a free LinkedIn Authority Blueprint. We&apos;ll analyze your profile and show you
        exactly where to focus.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-lg shadow-violet-500/25"
      >
        Get Your Blueprint <ArrowRight className="w-4 h-4" />
      </Link>
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
// ProgramsPage
// ============================================

const ProgramsPage: React.FC = () => {
  const [result, setResult] = useState<ProgramKey | null>(null);

  const handleReset = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <NavBar />
      <Hero />
      {result === null ? (
        <Quiz onResult={setResult} />
      ) : (
        <Recommendation recommended={result} onReset={handleReset} />
      )}
      <FallbackCTA />
      <Footer />
    </div>
  );
};

export default ProgramsPage;
