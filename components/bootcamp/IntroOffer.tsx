import React from 'react';
import {
  FileText,
  Magnet,
  Users,
  Link2,
  Layout,
  Mail,
  Video,
  CheckCircle2,
  Shield,
  Zap,
  Gift,
  Rocket,
  ArrowRight,
} from 'lucide-react';

// ============================================
// Stripe Payment Links (replace with real URLs)
// ============================================
const STRIPE_LINKS = {
  core: 'https://buy.stripe.com/PLACEHOLDER_CORE',
};

// ============================================
// Data
// ============================================

const DELIVERABLES = [
  {
    icon: FileText,
    title: '4 LinkedIn Posts',
    description: 'Written and published from your Blueprint',
  },
  {
    icon: Magnet,
    title: '1 Lead Magnet',
    description: 'Fully built from your Blueprint',
  },
  {
    icon: Users,
    title: 'Lead List Sourced',
    description: 'Verified prospects matched to your ICP',
  },
  {
    icon: Link2,
    title: 'HeyReach Setup',
    description: 'Connection request campaigns running',
  },
  {
    icon: Layout,
    title: 'MagnetLab Setup',
    description: 'Full funnel built around your lead magnet',
  },
];

const BONUSES = [
  {
    icon: Mail,
    title: '5-Email Nurture Flow',
    description: 'Written for post-lead-magnet delivery',
  },
  {
    icon: Video,
    title: 'VSL Script',
    description: 'For your lead magnet thank-you page',
  },
];

const STEPS = [
  {
    number: 1,
    title: '30-Min Interview + Data Dump',
    description:
      'You give us everything you have — call recordings, docs, existing content. We extract what we need.',
  },
  {
    number: 2,
    title: 'Log Into MagnetLab',
    description: 'Connect your LinkedIn account so we can schedule your posts directly.',
  },
  {
    number: 3,
    title: 'We Deliver, You Approve',
    description: 'We build everything. You review, approve, and it goes live.',
  },
];

const PRICE = '$2,500';
const PRICE_FEATURES = [
  '4 LinkedIn posts written & published',
  '1 lead magnet fully built',
  'Lead list sourced for your ICP',
  'HeyReach setup + campaigns running',
  'MagnetLab setup + full funnel',
  '5-email nurture flow',
  'VSL script for thank-you page',
];

// ============================================
// Component
// ============================================

const IntroOffer: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
          <Rocket size={14} />
          One-Time Offer
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white leading-tight">
          Start Getting Warm Leads From
          <br />
          LinkedIn in 2 Weeks. <span className="text-violet-500">Guaranteed.</span>
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
          We build your complete LinkedIn lead generation system — posts, lead magnet, funnel,
          outreach — and hand it to you running.
        </p>
      </section>

      {/* What You Get */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">What You Get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DELIVERABLES.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                <item.icon size={20} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bonuses */}
        <div className="border border-violet-200 dark:border-violet-500/20 rounded-xl p-5 bg-violet-50/50 dark:bg-violet-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Gift size={16} className="text-violet-500" />
            <h3 className="font-semibold text-violet-700 dark:text-violet-300 text-sm">
              Bonus — Included Free
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BONUSES.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <item.icon size={16} className="text-violet-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-zinc-900 dark:text-white text-sm">
                    {item.title}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className="relative p-5 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-sm mb-3">
                {step.number}
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-1">
                {step.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {step.description}
              </p>
              {i < STEPS.length - 1 && (
                <ArrowRight
                  size={16}
                  className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 z-10"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* The Result */}
      <section className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl p-8 text-center">
        <Zap size={24} className="text-white/80 mx-auto mb-3" />
        <p className="text-xl md:text-2xl font-bold text-white leading-snug">
          In 10 days: a full funnel, a lead magnet that would have taken you 25 hours to make, and
          ideal prospects reaching out.
        </p>
      </section>

      {/* Pricing */}
      <section className="max-w-lg mx-auto">
        <div className="border border-violet-500 rounded-xl p-8 bg-white dark:bg-zinc-800/50 ring-2 ring-violet-500/20 text-center">
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-2">
            One-Time Investment
          </p>
          <div className="mb-6">
            <span className="text-5xl font-bold text-zinc-900 dark:text-white">{PRICE}</span>
          </div>
          <ul className="space-y-2.5 mb-8 text-left">
            {PRICE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-violet-500 mt-0.5 shrink-0" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
              </li>
            ))}
          </ul>
          <a
            href={STRIPE_LINKS.core}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3.5 rounded-lg font-semibold text-base bg-violet-500 hover:bg-violet-600 text-white transition-colors"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Guarantee */}
      <section className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-6 flex items-start gap-4">
        <Shield size={24} className="text-violet-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">The Guarantee</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            If you're not getting connection requests approved in 2 weeks, we write another week of
            content for you — free. No questions asked.
          </p>
        </div>
      </section>
    </div>
  );
};

export default IntroOffer;
