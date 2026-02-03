import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, BarChart3, AlertTriangle, User, Lightbulb, Calendar } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import CalEmbed from './CalEmbed';
import { getBlueprintSettings } from '../../services/blueprint-supabase';
import { queryKeys } from '../../lib/queryClient';

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
  const state = location.state as {
    prospectId?: string;
    reportUrl?: string;
    monthlyIncome?: string;
  } | null;
  const showBooking = state?.monthlyIncome !== 'Not generating revenue yet';
  const calEmbedRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery({
    queryKey: queryKeys.blueprintSettings(),
    queryFn: getBlueprintSettings,
  });

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

        {/* Video Embed */}
        {settings?.thankYouVideoUrl && (
          <section className="mb-12">
            <div
              className="relative w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
              style={{ paddingBottom: '56.25%' }}
            >
              <iframe
                src={settings.thankYouVideoUrl}
                title="Thank you video"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Book a Call CTA */}
        {showBooking && (
          <section className="mb-12">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-none p-6 sm:p-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                Want Us to Walk You Through It Live?
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-lg mx-auto">
                Book a free 30-minute strategy call. We&apos;ll walk you through your blueprint,
                answer your questions, and map out your next steps.
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
        )}

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

        {/* Blueprint is generated async (~15 min) — link removed to avoid
            users clicking through to an incomplete page. They'll receive the
            link via email once it's ready. */}
      </div>

      {/* CalEmbed — wider container so month view doesn't collapse to mobile */}
      {showBooking && (
        <div className="max-w-5xl mx-auto px-4 pb-12 sm:pb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-6">
            Book Your Free Walkthrough Now
          </h2>
          <CalEmbed ref={calEmbedRef} calLink={CAL_BOOKING_LINK} />
        </div>
      )}

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
