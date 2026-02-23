# Intro Offer Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a clean, beautiful "Intro Offer" page inside the Bootcamp portal that salespeople walk prospects through on calls, with 3 tiered Stripe checkout options.

**Architecture:** New `IntroOffer.tsx` component rendered as a virtual view inside `BootcampApp.tsx` (same pattern as TAM Builder, Infrastructure, etc.). Sidebar gets a new highlighted link. No database changes, no new dependencies — pure React + Tailwind + lucide-react.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, lucide-react icons

---

### Task 1: Create IntroOffer component

**Files:**
- Create: `components/bootcamp/IntroOffer.tsx`

**Step 1: Create the component file**

```tsx
import React from 'react';
import {
  FileText,
  Magnet,
  Users,
  Link2,
  Layout,
  Mail,
  Video,
  Mic,
  Linkedin,
  Truck,
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
  coreAds: 'https://buy.stripe.com/PLACEHOLDER_CORE_ADS',
  full: 'https://buy.stripe.com/PLACEHOLDER_FULL',
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
    description: 'You give us everything you have — call recordings, docs, existing content. We extract what we need.',
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

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  stripeUrl: string;
  highlighted?: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: 'Core',
    price: '$2,500',
    description: 'Done-for-you GTM launch',
    features: [
      '4 LinkedIn posts written & published',
      '1 lead magnet fully built',
      'Lead list sourced for your ICP',
      'HeyReach setup + campaigns running',
      'MagnetLab setup + full funnel',
      '5-email nurture flow',
      'VSL script for thank-you page',
    ],
    stripeUrl: STRIPE_LINKS.core,
  },
  {
    name: 'Core + LI Ads',
    price: '$3,500',
    description: 'GTM launch + paid amplification',
    features: [
      'Everything in Core',
      'LinkedIn ads account setup',
      'Thought Leader Ad campaigns configured',
      'Retargeting audience built',
    ],
    stripeUrl: STRIPE_LINKS.coreAds,
    highlighted: true,
  },
  {
    name: 'Full Package',
    price: '$4,500',
    description: 'GTM launch + ads + cold email',
    features: [
      'Everything in Core + LI Ads',
      'Cold email infrastructure setup',
      'Domains, DNS, warmup configured',
      'Email sequences written & loaded',
    ],
    stripeUrl: STRIPE_LINKS.full,
  },
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
          LinkedIn in 2 Weeks.{' '}
          <span className="text-violet-500">Guaranteed.</span>
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
          We build your complete LinkedIn lead generation system — posts, lead magnet, funnel, outreach — and hand it to you running.
        </p>
      </section>

      {/* What You Get */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          What You Get
        </h2>
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
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          How It Works
        </h2>
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
          In 10 days: a full funnel, a lead magnet that would have taken you 25 hours to make, and ideal prospects reaching out.
        </p>
      </section>

      {/* Pricing Tiers */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white text-center">
          Choose Your Package
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col p-6 rounded-xl border ${
                tier.highlighted
                  ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-500/5 ring-2 ring-violet-500/20'
                  : 'border-zinc-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-500 text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {tier.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {tier.description}
              </p>
              <div className="mt-4 mb-5">
                <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {tier.price}
                </span>
                <span className="text-sm text-zinc-400 ml-1">one-time</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2
                      size={14}
                      className="text-violet-500 mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href={tier.stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full text-center py-3 rounded-lg font-semibold text-sm transition-colors ${
                  tier.highlighted
                    ? 'bg-violet-500 hover:bg-violet-600 text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900'
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Guarantee */}
      <section className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-6 flex items-start gap-4">
        <Shield size={24} className="text-violet-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
            The Guarantee
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            If you're not getting connection requests approved in 2 weeks, we write another week of content for you — free. No questions asked.
          </p>
        </div>
      </section>
    </div>
  );
};

export default IntroOffer;
```

**Step 2: Verify the file was created**

Run: `ls components/bootcamp/IntroOffer.tsx`
Expected: File exists

---

### Task 2: Wire IntroOffer into BootcampApp.tsx

**Files:**
- Modify: `pages/bootcamp/BootcampApp.tsx`

**Step 1: Add lazy import at the top (after the other lazy imports around line 68)**

Add after the `EmailEnrichmentPage` lazy import:

```tsx
const IntroOffer = lazy(
  () => import('../../components/bootcamp/IntroOffer')
);
```

**Step 2: Add the virtual view conditional in the render chain**

In the main content area where virtual views are rendered (around line 701-783), add a new condition **before** the final `else` (`LessonView` fallback). Insert before the `) : currentLesson.id === 'virtual:my-posts'` line:

```tsx
) : currentLesson.id === 'virtual:intro-offer' ? (
  <Suspense
    fallback={
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    }
  >
    <IntroOffer />
  </Suspense>
```

**Step 3: Verify build compiles**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npm run build 2>&1 | tail -20`
Expected: Build succeeds (may have existing warnings, but no errors from new code)

**Step 4: Commit**

```bash
git add components/bootcamp/IntroOffer.tsx pages/bootcamp/BootcampApp.tsx
git commit -m "feat: add intro offer page as virtual view in Bootcamp portal"
```

---

### Task 3: Add sidebar link for Intro Offer

**Files:**
- Modify: `components/bootcamp/Sidebar.tsx`

**Step 1: Import Rocket icon**

Add `Rocket` to the lucide-react import at the top of `Sidebar.tsx` (line ~2-33).

**Step 2: Add the sidebar link**

Add a new button **above** the "Tools" divider (before line 460: `{/* Tools divider */}`). This makes it a top-level, prominent link — not buried inside a collapsible group.

```tsx
{/* Intro Offer */}
<div className="px-1">
  <button
    onClick={() => {
      onSelectLesson({
        id: 'virtual:intro-offer',
        title: 'Intro Offer',
        embedUrl: 'virtual:intro-offer',
      });
      onCloseMobile();
    }}
    className={`flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs font-semibold transition-all ${
      currentLessonId === 'virtual:intro-offer'
        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20'
        : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20'
    }`}
  >
    <div className="w-6 h-6 rounded-md bg-violet-500 flex items-center justify-center shrink-0">
      <Rocket size={14} className="text-white" />
    </div>
    <span>Intro Offer</span>
  </button>
</div>
```

**Step 3: Verify build compiles**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add components/bootcamp/Sidebar.tsx
git commit -m "feat: add intro offer link to bootcamp sidebar"
```

---

### Task 4: Visual QA and final adjustments

**Step 1: Start dev server and inspect in browser**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npm run dev`

Check in browser:
- Navigate to `/bootcamp`, log in
- Click "Intro Offer" in sidebar
- Verify all 6 sections render correctly
- Check dark mode toggle
- Check mobile responsive layout (resize browser)
- Click pricing CTA buttons (should open placeholder Stripe URLs in new tab)

**Step 2: Fix any visual issues found during QA**

Adjust spacing, typography, or layout as needed.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: intro offer page visual polish"
```
