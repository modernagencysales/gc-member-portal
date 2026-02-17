import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  X,
  Shield,
  Zap,
  Rocket,
  Gift,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { DFY_OFFER } from './dfy-offer-data';
import { FAQAccordionItem, ValueStackRow, TestimonialInline, SenjaEmbed } from './offer-components';
import ThemeToggle from './ThemeToggle';

// ============================================
// Stripe URL
// ============================================

const STRIPE_URL = import.meta.env.VITE_STRIPE_INTRO_OFFER_URL || '';

// ============================================
// Inline CTA Component
// ============================================

const DFYCta: React.FC<{ variant?: 'primary' | 'secondary' }> = ({ variant = 'primary' }) => {
  const isPrimary = variant === 'primary';

  if (!STRIPE_URL) {
    return (
      <div className="flex justify-center">
        <button
          disabled
          className="px-8 py-4 rounded-lg font-semibold text-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
        >
          Coming Soon
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <a
        href={STRIPE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block px-8 py-4 rounded-lg font-semibold text-center transition-colors ${
          isPrimary
            ? 'bg-violet-500 hover:bg-violet-600 text-white text-lg'
            : 'bg-violet-600 hover:bg-violet-700 text-white'
        }`}
      >
        {DFY_OFFER.ctaPrimary}
      </a>
    </div>
  );
};

// ============================================
// DFY Offer Page
// ============================================

const DFYOfferPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const offer = DFY_OFFER;
  const t = offer.testimonials;

  // Value stack total
  const valueTotal = offer.valueItems.reduce((sum, item) => {
    const num = parseInt(item.soloValue.replace(/[^0-9]/g, ''), 10);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <ThemeToggle />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* ===== HERO SECTION ===== */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/20 mb-6">
            <Rocket className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-300">
              One-Time Offer
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-6 whitespace-pre-line">
            {offer.headline}
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            {offer.subheadline}
          </p>

          <DFYCta variant="primary" />
        </section>

        <div className="space-y-16 sm:space-y-20">
          {/* ===== TESTIMONIAL #1 ===== */}
          {t[0] && <TestimonialInline testimonial={t[0]} />}

          {/* ===== PROBLEM / AGITATION SECTION ===== */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 sm:p-10">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              {offer.problemHeadline}
            </h2>

            <div className="space-y-4 mb-6">
              {offer.painPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mt-0.5">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>

            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-6">
              {offer.agitationText}
            </p>
          </section>

          {/* ===== SOLUTION SECTION ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {offer.solutionHeadline}
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              {offer.solutionDescription}
            </p>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                When we're done, you will have:
              </h3>
              <div className="space-y-4">
                {offer.solutionBullets.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-50 dark:bg-violet-500/20 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-zinc-800 dark:text-zinc-200">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== TESTIMONIAL #2 ===== */}
          {t[1] && <TestimonialInline testimonial={t[1]} />}

          {/* ===== DELIVERABLES GRID ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              What You Get
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Everything built, configured, and launched for you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offer.deliverables.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                    <item.icon size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ===== BONUSES ===== */}
          <section>
            <div className="border border-violet-200 dark:border-violet-500/20 rounded-xl p-6 sm:p-8 bg-violet-50/50 dark:bg-violet-500/5">
              <div className="flex items-center gap-2 mb-6">
                <Gift size={20} className="text-violet-500" />
                <h2 className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                  Bonus — Included Free
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offer.bonuses.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 p-4 bg-white/60 dark:bg-zinc-900/40 rounded-lg"
                  >
                    <item.icon size={20} className="text-violet-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {item.title}
                      </span>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== HOW IT WORKS ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              How It Works
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Three steps. About 1-2 hours of your time. We handle the rest.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {offer.steps.map((step, i) => (
                <div
                  key={step.number}
                  className="relative p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-lg mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                  {i < offer.steps.length - 1 && (
                    <ArrowRight
                      size={18}
                      className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 z-10"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ===== RESULT BANNER ===== */}
          <section className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl p-8 sm:p-10 text-center">
            <Zap size={28} className="text-white/80 mx-auto mb-4" />
            <p className="text-xl sm:text-2xl font-bold text-white leading-snug max-w-2xl mx-auto">
              {offer.resultStatement}
            </p>
          </section>

          {/* ===== MID-PAGE CTA ===== */}
          <section className="text-center">
            <DFYCta variant="secondary" />
          </section>

          {/* ===== VALUE STACK ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Everything You Get
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Here&rsquo;s what&rsquo;s included in the DFY package:
            </p>

            <div className="space-y-3 mb-6">
              {offer.valueItems.map((item, i) => (
                <ValueStackRow key={i} label={item.label} soloValue={item.soloValue} />
              ))}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 text-center">
              <p className="text-zinc-600 dark:text-zinc-400 mb-1">
                Total value: <span className="line-through">${valueTotal.toLocaleString()}</span>
              </p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Your price: {offer.price}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">One-time investment</p>
            </div>
          </section>

          {/* ===== TESTIMONIAL #3 ===== */}
          {t[2] && <TestimonialInline testimonial={t[2]} />}

          {/* ===== WHO IS THIS FOR / NOT FOR ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
              Is This For You?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* For You */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  This is for you if...
                </h3>
                <ul className="space-y-3">
                  {offer.isForYou.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700 dark:text-zinc-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Not For You */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5" />
                  This is NOT for you if...
                </h3>
                <ul className="space-y-3">
                  {offer.notForYou.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700 dark:text-zinc-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ===== ABOUT TIM (CREDIBILITY) ===== */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Why Tim?</h2>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">
              {offer.aboutTimBlurb}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">$4.7M</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Agency Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">20K+</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Opted-in Leads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">$200K+</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">LTV Deals Closed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">300+</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Founders Taught</p>
              </div>
            </div>
          </section>

          {/* ===== PRICING CARD + GUARANTEE ===== */}
          <section className="text-center">
            <div className="bg-white dark:bg-zinc-900 border-2 border-violet-500 rounded-xl p-8 sm:p-10 max-w-lg mx-auto">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                DFY Lead Gen System
              </h2>
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-2">
                One-Time Investment
              </p>
              <div className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {offer.price}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Everything built and launched in 10 days
              </p>

              <ul className="space-y-2.5 mb-8 text-left">
                {offer.priceFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-violet-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <DFYCta variant="primary" />

              {/* Guarantee */}
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-violet-400" />
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {offer.guarantee}
                  </h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{offer.guaranteeDetails}</p>
              </div>
            </div>
          </section>

          {/* ===== FAQ SECTION ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {offer.faqs.map((faq, i) => (
                <FAQAccordionItem
                  key={i}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === i}
                  onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              ))}
            </div>
          </section>

          {/* ===== PRE-SENJA CTA ===== */}
          <section className="text-center py-8">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Ready to Get Your System Built?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
              Stop building. Start closing. We&rsquo;ll have your lead gen system live in 10 days.
            </p>
            <DFYCta variant="primary" />
          </section>

          {/* ===== SENJA TESTIMONIAL EMBED ===== */}
          <SenjaEmbed />

          {/* ===== FINAL CTA ===== */}
          <section className="text-center py-8">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Ready to Get Your System Built?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
              Stop building. Start closing. We&rsquo;ll have your lead gen system live in 10 days.
            </p>
            <DFYCta variant="primary" />
          </section>
        </div>
      </div>
    </div>
  );
};

export default DFYOfferPage;
