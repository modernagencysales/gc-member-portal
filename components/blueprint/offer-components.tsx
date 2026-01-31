import React, { useEffect } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { OfferData, OfferTestimonial } from './offer-data';
import TestimonialQuote from './TestimonialQuote';

// ============================================
// Senja Embed Component
// ============================================

const SENJA_WIDGET_ID = 'ec06dbf2-1417-4d3e-ba0a-0ade12fa83e1';

export const SenjaEmbed: React.FC = () => {
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
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        What People Are Saying
      </h2>
      <div
        className="senja-embed"
        data-id={SENJA_WIDGET_ID}
        data-mode="shadow"
        data-lazyload="false"
        style={{ display: 'block', width: '100%' }}
      />
    </section>
  );
};

// ============================================
// FAQ Accordion Item
// ============================================

export interface FAQAccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const FAQAccordionItem: React.FC<FAQAccordionItemProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
}) => (
  <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 transition-colors"
      aria-expanded={isOpen}
    >
      <span className="font-medium text-zinc-800 dark:text-zinc-200 pr-4">{question}</span>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
          {answer}
        </p>
      </div>
    )}
  </div>
);

// ============================================
// Curriculum Week
// ============================================

export interface CurriculumWeekProps {
  week: number;
  title: string;
  bullets: string[];
  deliverable: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const CurriculumWeek: React.FC<CurriculumWeekProps> = ({
  week,
  title,
  bullets,
  deliverable,
  isOpen,
  onToggle,
}) => (
  <div className="border-l-2 border-violet-500/40 relative">
    {/* Week number dot */}
    <div className="absolute -left-[11px] top-4 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
      <span className="text-xs font-bold text-white">{week}</span>
    </div>
    <div className="ml-6">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Week {week}: {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6">
          <ul className="space-y-2 mb-4">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 text-sm">{bullet}</span>
              </li>
            ))}
          </ul>
          <div className="bg-violet-50 border border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-violet-700 dark:text-violet-300">
              <span className="font-semibold">Deliverable:</span> {deliverable}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ============================================
// Value Stack Row
// ============================================

export interface ValueStackRowProps {
  label: string;
  soloValue: string;
}

export const ValueStackRow: React.FC<ValueStackRowProps> = ({ label, soloValue }) => (
  <div className="bg-zinc-50 border border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700/50 rounded-lg p-4 flex items-center justify-between gap-4">
    <span className="text-zinc-800 dark:text-zinc-200 text-sm font-medium">{label}</span>
    <span className="text-zinc-500 text-sm line-through whitespace-nowrap">Value: {soloValue}</span>
  </div>
);

// ============================================
// Testimonial Inline
// ============================================

export interface TestimonialInlineProps {
  testimonial: OfferTestimonial;
}

export const TestimonialInline: React.FC<TestimonialInlineProps> = ({ testimonial }) => (
  <TestimonialQuote
    quote={testimonial.quote}
    author={testimonial.author}
    role={testimonial.role}
    result={testimonial.result}
  />
);

// ============================================
// CTA Button (reusable within page)
// ============================================

export interface CTASectionProps {
  paymentUrl?: string;
  offer: OfferData;
  variant?: 'primary' | 'secondary';
}

export const CTASection: React.FC<CTASectionProps> = ({
  paymentUrl,
  offer,
  variant = 'primary',
}) => {
  const isPrimary = variant === 'primary';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      {paymentUrl ? (
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full sm:w-auto px-8 py-4 rounded-lg font-semibold text-center transition-colors ${
            isPrimary
              ? 'bg-violet-500 hover:bg-violet-600 text-white text-lg'
              : 'bg-violet-600 hover:bg-violet-700 text-white'
          }`}
        >
          {offer.ctaPrimary}
        </a>
      ) : (
        <button
          disabled
          className="w-full sm:w-auto px-8 py-4 rounded-lg font-semibold text-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
        >
          Coming Soon
        </button>
      )}
    </div>
  );
};
