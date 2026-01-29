import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Calendar,
  Check,
  X,
  Shield,
  Star,
  Zap,
  Clock,
} from 'lucide-react';
import { getProspectBySlug, getBlueprintSettings } from '../../services/blueprint-supabase';
import { Prospect, BlueprintSettings, getProspectDisplayName } from '../../types/blueprint-types';
import { OFFERS, OfferData, OfferTestimonial } from './offer-data';
import {
  getNextCohortDate,
  formatCohortDate,
  getDaysUntilCohort,
  getSpotsRemaining,
} from './offer-utils';
import TestimonialQuote from './TestimonialQuote';
import OfferCard from './OfferCard';

// ============================================
// Types
// ============================================

interface OfferPageData {
  prospect: Prospect;
  settings: BlueprintSettings | null;
}

// ============================================
// Loading State Component
// ============================================

const OfferLoadingState: React.FC = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
    <p className="mt-4 text-zinc-400 text-sm font-medium">Loading your offers...</p>
  </div>
);

// ============================================
// 404 State Component
// ============================================

const OfferNotFound: React.FC = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-md">
      <h1 className="text-6xl font-bold text-zinc-100 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-zinc-100 mb-2">Offer Page Not Found</h2>
      <p className="text-zinc-400 mb-8">
        We couldn&rsquo;t find the offer page you&rsquo;re looking for. Please check the URL or
        contact support if you believe this is an error.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
      >
        Go Home
      </a>
    </div>
  </div>
);

// ============================================
// Error State Component
// ============================================

interface OfferErrorProps {
  message?: string;
  onRetry?: () => void;
}

const OfferError: React.FC<OfferErrorProps> = ({
  message = 'Something went wrong while loading offers.',
  onRetry,
}) => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-100 mb-2">Error Loading Offers</h2>
      <p className="text-zinc-400 mb-8">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

// ============================================
// Offer Not Unlocked State
// ============================================

interface OfferLockedProps {
  prospectName: string;
}

const OfferLocked: React.FC<OfferLockedProps> = ({ prospectName }) => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-lg">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
        <Lock className="w-10 h-10 text-zinc-400" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-100 mb-4">Offers Not Yet Available</h1>
      <p className="text-zinc-400 mb-8 text-lg">
        Hi {prospectName}, your personalized offers are not yet available. This page will be
        unlocked after your strategy call.
      </p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <p className="text-zinc-300 mb-4">
          Haven&rsquo;t scheduled your call yet? Book a time to discuss your blueprint and unlock
          your exclusive offers.
        </p>
        <a
          href="#book-call"
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-lg transition-colors"
        >
          <Calendar className="w-5 h-5" />
          Book Your Strategy Call
        </a>
      </div>
    </div>
  </div>
);

// ============================================
// Helper Sub-Components
// ============================================

interface FAQAccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQAccordionItem: React.FC<FAQAccordionItemProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
}) => (
  <div className="border border-zinc-700 rounded-lg overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
      aria-expanded={isOpen}
    >
      <span className="font-medium text-zinc-200 pr-4">{question}</span>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="p-4 bg-zinc-900 border-t border-zinc-700">
        <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{answer}</p>
      </div>
    )}
  </div>
);

interface CurriculumWeekProps {
  week: number;
  title: string;
  bullets: string[];
  deliverable: string;
  isOpen: boolean;
  onToggle: () => void;
}

const CurriculumWeek: React.FC<CurriculumWeekProps> = ({
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
        <span className="text-lg font-semibold text-zinc-100">
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
                <span className="text-zinc-300 text-sm">{bullet}</span>
              </li>
            ))}
          </ul>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-violet-300">
              <span className="font-semibold">Deliverable:</span> {deliverable}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

interface ValueStackRowProps {
  label: string;
  soloValue: string;
}

const ValueStackRow: React.FC<ValueStackRowProps> = ({ label, soloValue }) => (
  <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 flex items-center justify-between gap-4">
    <span className="text-zinc-200 text-sm font-medium">{label}</span>
    <span className="text-zinc-500 text-sm line-through whitespace-nowrap">Value: {soloValue}</span>
  </div>
);

interface TestimonialInlineProps {
  testimonial: OfferTestimonial;
}

const TestimonialInline: React.FC<TestimonialInlineProps> = ({ testimonial }) => (
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

interface CTASectionProps {
  paymentUrl?: string;
  calBookingLink?: string;
  offer: OfferData;
  variant?: 'primary' | 'secondary';
}

const CTASection: React.FC<CTASectionProps> = ({
  paymentUrl,
  calBookingLink,
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
          className="w-full sm:w-auto px-8 py-4 rounded-lg font-semibold text-center bg-zinc-800 text-zinc-500 cursor-not-allowed"
        >
          Coming Soon
        </button>
      )}
      {calBookingLink && (
        <a
          href={`https://cal.com/${calBookingLink}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-8 py-4 rounded-lg font-semibold text-center transition-colors bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
        >
          {offer.ctaSecondary}
        </a>
      )}
    </div>
  );
};

// ============================================
// Main OfferPage Component
// ============================================

const OfferPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<OfferPageData | null>(null);

  // Accordion states
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [openWeek, setOpenWeek] = useState<number | null>(0);

  // Fetch data
  const fetchOfferData = async () => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const prospect = await getProspectBySlug(slug);

      if (!prospect) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const settings = await getBlueprintSettings();

      setData({ prospect, settings });
    } catch (err) {
      console.error('Failed to load offer data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Handle loading state
  if (loading) return <OfferLoadingState />;
  if (notFound) return <OfferNotFound />;
  if (error) return <OfferError message={error} onRetry={fetchOfferData} />;
  if (!data) return <OfferError message="No data available" onRetry={fetchOfferData} />;

  const { prospect, settings } = data;

  // Determine recommended offer
  const recommendedType: 'foundations' | 'engineering' =
    prospect.recommendedOffer === 'bootcamp' ? 'foundations' : 'engineering';
  const otherType: 'foundations' | 'engineering' =
    recommendedType === 'foundations' ? 'engineering' : 'foundations';

  const offer = OFFERS[recommendedType];
  const otherOffer = OFFERS[otherType];

  // Payment URLs
  const foundationsPaymentUrl =
    settings?.bootcampOfferUrl || settings?.foundationsPaymentUrl || undefined;
  const engineeringPaymentUrl =
    settings?.gcOfferUrl || settings?.engineeringPaymentUrl || undefined;
  const getPaymentUrl = (type: 'foundations' | 'engineering') =>
    type === 'foundations' ? foundationsPaymentUrl : engineeringPaymentUrl;
  const calBookingLink = settings?.calBookingLink || 'timkeen/30min';

  // Cohort info
  const cohortDate = getNextCohortDate(recommendedType, settings, offer);
  const cohortDateStr = formatCohortDate(cohortDate);
  const daysUntil = getDaysUntilCohort(cohortDate);
  const spotsRemaining = getSpotsRemaining(recommendedType, settings, offer);

  // Value stack total
  const valueTotal = offer.valueItems.reduce((sum, item) => {
    const num = parseInt(item.soloValue.replace(/[^0-9]/g, ''), 10);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  // Split testimonials for scattering
  const t = offer.testimonials;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* ===== Personalized Header ===== */}
        <div className="text-center mb-4">
          <p className="text-zinc-400 text-lg">
            Prepared for{' '}
            <span className="text-zinc-200 font-medium">
              {prospect.firstName || getProspectDisplayName(prospect)}
            </span>
          </p>
        </div>

        {/* Seller's Personalized Note */}
        {prospect.offerNote && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10">
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">A Note For You</h2>
            <p className="text-zinc-300 whitespace-pre-wrap">{prospect.offerNote}</p>
          </div>
        )}

        {/* ===== HERO SECTION ===== */}
        <section className="text-center mb-16">
          {/* Cohort date badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">
              Next cohort: {cohortDateStr}
            </span>
            {daysUntil <= 30 && <span className="text-xs text-violet-400">({daysUntil} days)</span>}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-100 leading-tight mb-6 whitespace-pre-line">
            {offer.headline}
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            {offer.subheadline}
          </p>

          <CTASection
            paymentUrl={getPaymentUrl(recommendedType)}
            calBookingLink={calBookingLink}
            offer={offer}
            variant="primary"
          />
        </section>

        <div className="space-y-16 sm:space-y-20">
          {/* ===== TESTIMONIAL #1 ===== */}
          {t[0] && <TestimonialInline testimonial={t[0]} />}

          {/* ===== PROBLEM / AGITATION SECTION ===== */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-10">
            <h2 className="text-3xl font-bold text-zinc-100 mb-6">{offer.problemHeadline}</h2>

            <div className="space-y-4 mb-6">
              {offer.painPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center mt-0.5">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>

            <p className="text-zinc-400 leading-relaxed border-t border-zinc-800 pt-6">
              {offer.agitationText}
            </p>
          </section>

          {/* ===== SOLUTION SECTION ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-100 mb-4">{offer.solutionHeadline}</h2>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              {offer.solutionDescription}
            </p>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-zinc-100 mb-6">
                By the end, you will have:
              </h3>
              <div className="space-y-4">
                {offer.solutionBullets.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-zinc-200">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== TESTIMONIAL #2 ===== */}
          {t[1] && <TestimonialInline testimonial={t[1]} />}

          {/* ===== CURRICULUM SECTION ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-100 mb-2">What We Build Together</h2>
            <p className="text-zinc-400 mb-8">
              Week by week, step by step. You build it. Tim gives you feedback. By the end,
              it&rsquo;s running.
            </p>

            <div className="space-y-2">
              {offer.weeks.map((week, i) => (
                <CurriculumWeek
                  key={week.week}
                  week={week.week}
                  title={week.title}
                  bullets={week.bullets}
                  deliverable={week.deliverable}
                  isOpen={openWeek === i}
                  onToggle={() => setOpenWeek(openWeek === i ? null : i)}
                />
              ))}
            </div>
          </section>

          {/* ===== MID-PAGE CTA ===== */}
          <section className="text-center">
            <CTASection
              paymentUrl={getPaymentUrl(recommendedType)}
              calBookingLink={calBookingLink}
              offer={offer}
              variant="secondary"
            />
          </section>

          {/* ===== VALUE STACK ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-100 mb-2">Everything You Get</h2>
            <p className="text-zinc-400 mb-8">Here&rsquo;s what&rsquo;s included when you join:</p>

            <div className="space-y-3 mb-6">
              {offer.valueItems.map((item, i) => (
                <ValueStackRow key={i} label={item.label} soloValue={item.soloValue} />
              ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-zinc-400 mb-1">
                Total value: <span className="line-through">${valueTotal.toLocaleString()}</span>
              </p>
              <p className="text-3xl font-bold text-zinc-100">Your price: {offer.price}</p>
              <p className="text-sm text-zinc-400 mt-1">{offer.paymentPlan}</p>
            </div>
          </section>

          {/* ===== AI TOOLS INCLUDED ===== */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-violet-400" />
              <h2 className="text-3xl font-bold text-zinc-100">The AI Tools You Get</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              8 weeks of access to proprietary AI tools built to run this exact system.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offer.toolsIncluded.map((tool) => (
                <div key={tool.name} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <p className="font-semibold text-zinc-200 mb-1">{tool.name}</p>
                  <p className="text-sm text-zinc-400">{tool.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ===== TESTIMONIAL #3 ===== */}
          {t[2] && <TestimonialInline testimonial={t[2]} />}

          {/* ===== WHO IS THIS FOR / NOT FOR ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-100 mb-8">Is This For You?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* For You */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  This is for you if...
                </h3>
                <ul className="space-y-3">
                  {offer.isForYou.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Not For You */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5" />
                  This is NOT for you if...
                </h3>
                <ul className="space-y-3">
                  {offer.notForYou.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ===== ABOUT TIM (CREDIBILITY) ===== */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">Why Tim?</h2>
            <p className="text-zinc-300 leading-relaxed mb-6">{offer.aboutTimBlurb}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-400">$4.7M</p>
                <p className="text-xs text-zinc-400">Agency Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-400">20K+</p>
                <p className="text-xs text-zinc-400">Opted-in Leads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-400">$200K+</p>
                <p className="text-xs text-zinc-400">LTV Deals Closed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-400">300+</p>
                <p className="text-xs text-zinc-400">Founders Taught</p>
              </div>
            </div>
          </section>

          {/* ===== PRICING CARD + GUARANTEE ===== */}
          <section className="text-center">
            <div className="bg-zinc-900 border-2 border-violet-500 rounded-xl p-8 sm:p-10 max-w-lg mx-auto">
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">{offer.name}</h2>
              <div className="text-5xl font-bold text-zinc-100 mb-2">{offer.price}</div>
              <p className="text-zinc-400 mb-6">{offer.paymentPlan}</p>

              <CTASection
                paymentUrl={getPaymentUrl(recommendedType)}
                calBookingLink={calBookingLink}
                offer={offer}
                variant="primary"
              />

              {/* Guarantee */}
              <div className="mt-8 pt-6 border-t border-zinc-800">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-violet-400" />
                  <h3 className="font-semibold text-zinc-200">{offer.guarantee}</h3>
                </div>
                <p className="text-sm text-zinc-400">{offer.guaranteeDetails}</p>
              </div>
            </div>
          </section>

          {/* ===== URGENCY BANNER ===== */}
          <section className="bg-gradient-to-r from-violet-600/20 to-violet-500/10 border border-violet-500/30 rounded-xl p-6 sm:p-8 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-400" />
                <span className="text-zinc-200 font-medium">Next cohort: {cohortDateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-violet-400" />
                <span className="text-zinc-200 font-medium">{spotsRemaining} spots remaining</span>
              </div>
              {daysUntil <= 30 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-violet-400" />
                  <span className="text-zinc-200 font-medium">{daysUntil} days left to enroll</span>
                </div>
              )}
            </div>
            {offer.urgencyText && <p className="text-sm text-zinc-400 mt-3">{offer.urgencyText}</p>}
          </section>

          {/* ===== FAQ SECTION ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-100 mb-8">Frequently Asked Questions</h2>
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

          {/* ===== FINAL CTA ===== */}
          <section className="text-center py-8">
            <h2 className="text-3xl font-bold text-zinc-100 mb-4">Ready to Build Your System?</h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Next cohort starts {cohortDateStr}. {spotsRemaining} spots remaining.
            </p>
            <CTASection
              paymentUrl={getPaymentUrl(recommendedType)}
              calBookingLink={calBookingLink}
              offer={offer}
              variant="primary"
            />
          </section>

          {/* ===== MORE TESTIMONIALS ===== */}
          {t.length > 3 && (
            <section>
              <h2 className="text-2xl font-bold text-zinc-100 text-center mb-8">
                What People Are Saying
              </h2>
              <div className="space-y-6">
                {t.slice(3).map((testimonial, i) => (
                  <TestimonialInline key={i} testimonial={testimonial} />
                ))}
              </div>
            </section>
          )}

          {/* ===== OTHER OFFER — COMPACT CARD ===== */}
          <section>
            <div className="text-center mb-6">
              <p className="text-zinc-400 text-lg">Looking for something different?</p>
            </div>
            <OfferCard
              offer={otherOffer}
              paymentUrl={getPaymentUrl(otherType)}
              calBookingLink={calBookingLink}
            />
          </section>

          {/* ===== BOOK A CALL FALLBACK ===== */}
          <section className="text-center py-8 border-t border-zinc-800">
            <h3 className="text-xl font-semibold text-zinc-100 mb-3">Still Have Questions?</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Not sure which program is right for you? Book a call and we&rsquo;ll help you decide.
            </p>
            <a
              href={`https://cal.com/${calBookingLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium rounded-lg transition-colors border border-zinc-700"
            >
              <Calendar className="w-5 h-5" />
              Book a Call
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OfferPage;
