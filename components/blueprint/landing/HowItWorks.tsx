/**
 * HowItWorks.tsx
 * "How It Works" section for the Blueprint landing page.
 * Three-step walkthrough: Submit Profile → AI Analysis → Get Blueprint.
 */

import React from 'react';
import { Linkedin, Sparkles, FileText } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

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

export default HowItWorks;
