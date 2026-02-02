import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { OFFERS } from './offer-data';

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
        Whether you&apos;re just getting started or ready to scale, we have a program that fits
        where you are right now.
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
// Self-Selection Guide
// ============================================

interface DiagnosticQuestion {
  question: string;
  options: { label: string; answer: 'foundations' | 'engineering' }[];
}

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
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

const PROGRAM_LABELS: Record<'foundations' | 'engineering', string> = {
  foundations: 'Foundations',
  engineering: 'Engineering',
};

const SelfSelectionGuide: React.FC = () => (
  <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16 sm:py-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-4">
        Which Path Fits You?
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-2xl mx-auto mb-12">
        Two quick questions to help you pick the right program.
      </p>

      <div className="space-y-8">
        {DIAGNOSTIC_QUESTIONS.map((dq) => (
          <div key={dq.question}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              {dq.question}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dq.options.map((opt) => (
                <div
                  key={opt.label}
                  className={`p-4 rounded-xl border-2 ${
                    opt.answer === 'engineering'
                      ? 'border-violet-200 dark:border-violet-500/30 bg-violet-50/50 dark:bg-violet-500/5'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">{opt.label}</p>
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                      opt.answer === 'engineering'
                        ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {PROGRAM_LABELS[opt.answer]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ============================================
// Program Cards
// ============================================

interface ProgramCardProps {
  offer: typeof foundations;
  labelTag: string;
  isForYouItems: string[];
  isPremium?: boolean;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ offer, labelTag, isForYouItems, isPremium }) => (
  <div
    className={`rounded-2xl border-2 p-6 sm:p-8 flex flex-col ${
      isPremium
        ? 'border-violet-400 dark:border-violet-500/50 bg-white dark:bg-zinc-900'
        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
    }`}
  >
    <span
      className={`inline-block self-start text-xs font-semibold px-3 py-1 rounded-full mb-4 ${
        isPremium
          ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
      }`}
    >
      {labelTag}
    </span>

    <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
      {offer.name}
    </h3>
    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{offer.tagline}</p>
    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">{offer.price}</p>

    <div className="mb-6">
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
        What You Get
      </h4>
      <ul className="space-y-2">
        {offer.solutionBullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="mb-6">
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
        This Is For You If
      </h4>
      <ul className="space-y-2">
        {isForYouItems.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <ArrowRight className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="mt-auto">
      <Link
        to={`/offer/${offer.id}`}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
          isPremium
            ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25'
            : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900'
        }`}
      >
        Learn More <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </div>
);

const ProgramCards: React.FC = () => (
  <section className="bg-white dark:bg-zinc-950 py-16 sm:py-20">
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-4">
        Two Programs. One Goal.
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-2xl mx-auto mb-12">
        Both programs give you a complete system. Pick the one that matches your stage.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <ProgramCard
          offer={foundations}
          labelTag="For Beginners"
          isForYouItems={foundations.isForYou.slice(0, 4)}
        />
        <ProgramCard
          offer={engineering}
          labelTag="For Scaling"
          isForYouItems={engineering.isForYou.slice(0, 4)}
          isPremium
        />
      </div>
    </div>
  </section>
);

// ============================================
// Comparison Table
// ============================================

interface ComparisonRow {
  label: string;
  foundations: string;
  engineering: string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: 'Best For',
    foundations: 'Getting started with LinkedIn lead gen',
    engineering: 'Scaling an existing business with multi-channel outbound',
  },
  {
    label: 'Price',
    foundations: foundations.price,
    engineering: engineering.price,
  },
  {
    label: 'Format',
    foundations: '4x 90-min live sessions + async support',
    engineering: '4x 90-min live sessions + async support',
  },
  {
    label: 'What You Build',
    foundations: 'Profile, outreach, content system, lead magnet, daily routine',
    engineering:
      'Lead magnet funnel, enriched lists, cold email + LinkedIn automation, LinkedIn ads',
  },
  {
    label: 'Tooling Cost',
    foundations: '~$15-50/month (Linked Helper only)',
    engineering: '~$300-500/month (Clay, Smartlead, HeyReach, LinkedIn Ads)',
  },
  {
    label: 'Prerequisite',
    foundations: 'None — we start from scratch',
    engineering: 'Validated offer + $10k+/mo revenue recommended',
  },
];

const ComparisonTable: React.FC = () => (
  <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16 sm:py-20">
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-12">
        Quick Comparison
      </h2>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-zinc-200 dark:border-zinc-700">
              <th className="py-3 pr-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400 w-1/4" />
              <th className="py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 w-[37.5%]">
                {foundations.name}
              </th>
              <th className="py-3 pl-4 text-sm font-semibold text-violet-600 dark:text-violet-400 w-[37.5%]">
                {engineering.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {row.label}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {row.foundations}
                </td>
                <td className="py-3 pl-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {row.engineering}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-4">
        {COMPARISON_ROWS.map((row) => (
          <div
            key={row.label}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              {row.label}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Foundations
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.foundations}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">
                  Engineering
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.engineering}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-lg shadow-violet-500/25"
        >
          Get a Free Blueprint <ArrowRight className="w-4 h-4" />
        </Link>
        <a
          href={import.meta.env.VITE_CALCOM_BOOKING_URL || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold border-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
        >
          Book a Call
        </a>
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
    </div>
  </footer>
);

// ============================================
// ProgramsPage
// ============================================

const ProgramsPage: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-zinc-950">
    <NavBar />
    <Hero />
    <SelfSelectionGuide />
    <ProgramCards />
    <ComparisonTable />
    <FallbackCTA />
    <Footer />
  </div>
);

export default ProgramsPage;
