import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Mail, FileText, Target, Monitor, ClipboardList, Zap } from 'lucide-react';
import { getBlueprintSettings } from '../../services/blueprint-supabase';
import { BlueprintSettings } from '../../types/blueprint-types';
import ThemeToggle from './ThemeToggle';

// ============================================
// Types
// ============================================

interface LocationState {
  slug?: string;
}

// ============================================
// Constants
// ============================================

const CHECKLIST_ITEMS = [
  {
    icon: Mail,
    text: 'Check your email for the calendar invite and add it to your calendar',
  },
  {
    icon: FileText,
    text: 'Review your LinkedIn Authority Blueprint',
    hasLink: true,
  },
  {
    icon: Target,
    text: 'Write down your top 3 LinkedIn goals or questions',
  },
  {
    icon: Monitor,
    text: 'Have your LinkedIn profile open during the call',
  },
];

const WHAT_TO_EXPECT = [
  { icon: ClipboardList, text: 'Review your blueprint together and identify quick wins' },
  { icon: Target, text: 'Map out your top priorities for LinkedIn growth' },
  { icon: Zap, text: 'Get a clear action plan you can start implementing immediately' },
];

const SENJA_WIDGET_ID = 'ec06dbf2-1417-4d3e-ba0a-0ade12fa83e1';

// ============================================
// Senja Embed Component
// ============================================

const SenjaEmbed: React.FC = () => {
  useEffect(() => {
    const scriptId = `senja-script-${SENJA_WIDGET_ID}`;
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://widget.senja.io/widget/${SENJA_WIDGET_ID}/platform.js`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, []);

  return (
    <div
      className="senja-embed"
      data-id={SENJA_WIDGET_ID}
      data-mode="shadow"
      data-lazyload="false"
      style={{ display: 'block', width: '100%' }}
    />
  );
};

// ============================================
// CallBookedThankYou Component
// ============================================

const CallBookedThankYou: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const slug = state?.slug;

  const [settings, setSettings] = useState<BlueprintSettings | null>(null);

  useEffect(() => {
    getBlueprintSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  const videoUrl = settings?.callBookedVideoUrl;

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
            You&apos;re Booked!
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Check your email for the calendar invite and Zoom link.
          </p>
        </div>

        {/* Video Embed */}
        {videoUrl && (
          <section className="mb-12">
            <div
              className="relative w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
              style={{ paddingBottom: '56.25%' }}
            >
              <iframe
                src={videoUrl}
                title="What to expect on your call"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Before Your Call Checklist */}
        <section className="mb-12">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 sm:p-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Before Your Call
            </h2>
            <div className="space-y-4">
              {CHECKLIST_ITEMS.map((item) => {
                const Icon = item.icon;
                const showLink = item.hasLink && slug;
                return (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {showLink ? (
                        <>
                          Review your{' '}
                          <a
                            href={`/blueprint/${slug}`}
                            className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 underline underline-offset-2 transition-colors"
                          >
                            LinkedIn Authority Blueprint
                          </a>
                        </>
                      ) : (
                        item.text
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="mb-12">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 sm:p-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              What to Expect
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Here&apos;s what we&apos;ll cover on your strategy call:
            </p>
            <div className="space-y-4">
              {WHAT_TO_EXPECT.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <span className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials — Senja widget */}
        <section className="mb-12">
          <SenjaEmbed />
        </section>
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

export default CallBookedThankYou;
