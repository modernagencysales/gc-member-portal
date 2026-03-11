/**
 * Hero.tsx
 * Hero section with email opt-in for the Blueprint landing page.
 * Includes StatsRow and SocialProof (co-located as they are small and tightly coupled to Hero).
 */

import React from 'react';
import { Mail, CheckCircle, Sparkles } from 'lucide-react';
import LogoBar from '../LogoBar';
import type { FormData } from '../../../hooks/useBlueprintForm';
import type { ClientLogo } from '../../../services/blueprint-supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HeroProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onContinue: () => void;
}

interface StatsRowProps {
  // no props — data is static
}

interface SocialProofProps {
  logos: ClientLogo[];
  maxLogos?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATS = [
  { value: '300+', label: 'Blueprints Delivered' },
  { value: '$4.7M', label: 'Agency Revenue Built on LinkedIn' },
  { value: '20K+', label: 'Opted-in Leads Generated' },
];

// ─── StatsRow ─────────────────────────────────────────────────────────────────

export const StatsRow: React.FC<StatsRowProps> = () => (
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

// ─── SocialProof ──────────────────────────────────────────────────────────────

export const SocialProof: React.FC<SocialProofProps> = ({ logos, maxLogos }) => (
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

// ─── Hero ─────────────────────────────────────────────────────────────────────

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

export default Hero;
