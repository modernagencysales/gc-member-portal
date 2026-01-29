import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, BarChart3, AlertTriangle, User, Lightbulb, Calendar } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import CalEmbed from './CalEmbed';

// ============================================
// Types
// ============================================

interface LocationState {
  prospectId?: string;
  reportUrl?: string;
}

// ============================================
// Constants
// ============================================

const BLUEPRINT_CONTENTS = [
  { icon: BarChart3, text: 'LinkedIn Authority Score across 5 dimensions' },
  { icon: AlertTriangle, text: "What's working + revenue leaks analysis" },
  { icon: User, text: 'Complete profile rewrite (headline, bio, featured section)' },
  { icon: Lightbulb, text: '3 custom lead magnets with promotion posts' },
  { icon: Calendar, text: '60-day content calendar with ready-to-post content' },
];

// ============================================
// BlueprintThankYou Component
// ============================================

const CAL_BOOKING_LINK = 'vlad-timinski-pqqica/30min';

const BlueprintThankYou: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const reportUrl = state?.reportUrl;
  const calEmbedRef = useRef<HTMLDivElement>(null);

  const scrollToCalEmbed = () => {
    calEmbedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <ThemeToggle />

      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        {/* Success Banner */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Your Blueprint is Being Generated!
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            You&apos;ll receive your personalized LinkedIn Authority Blueprint in about 15 minutes.
            Check your email.
          </p>
        </div>

        {/* Video Embed — add a videoUrl here when ready */}

        {/* Book a Call CTA */}
        <section className="mb-12">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-none p-6 sm:p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              Want Me to Walk You Through It Live?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-lg mx-auto">
              Book a free 30-minute strategy call. I&apos;ll walk you through your blueprint, answer
              your questions, and map out your next steps.
            </p>
            <button
              onClick={scrollToCalEmbed}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold bg-violet-500 hover:bg-violet-600 text-white transition-colors shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
            >
              <Calendar className="w-5 h-5" />
              Book Your Free Walkthrough
            </button>
          </div>
        </section>

        {/* What You'll Get */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center">
            What&apos;s in Your Blueprint
          </h2>
          <div className="space-y-3">
            {BLUEPRINT_CONTENTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.text}
                  className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-4 py-3"
                >
                  <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.text}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* View Blueprint Link (if reportUrl available) */}
        {reportUrl && (
          <div className="text-center mb-12">
            <a
              href={reportUrl}
              className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              View your blueprint once it&apos;s ready &rarr;
            </a>
          </div>
        )}
      </div>

      {/* CalEmbed — wider container so month view doesn't collapse to mobile */}
      <div className="max-w-5xl mx-auto px-4 pb-12 sm:pb-16">
        <CalEmbed ref={calEmbedRef} calLink={CAL_BOOKING_LINK} />
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Modern Agency Sales. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlueprintThankYou;
