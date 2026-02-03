import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Calendar, Check, X, Shield, Star, Zap, Clock } from 'lucide-react';
import { getProspectBySlug, getBlueprintSettings } from '../../services/blueprint-supabase';
import { Prospect, BlueprintSettings, getProspectDisplayName } from '../../types/blueprint-types';
import { OFFERS } from './offer-data';
import {
  getNextCohortDate,
  formatCohortDate,
  getDaysUntilCohort,
  getSpotsRemaining,
} from './offer-utils';
import {
  FAQAccordionItem,
  CurriculumWeek,
  ValueStackRow,
  TestimonialInline,
  CTASection,
  SenjaEmbed,
} from './offer-components';
import ThemeToggle from './ThemeToggle';

// ============================================
// Helpers
// ============================================

/**
 * Convert YouTube watch URLs to embed format with clean player settings
 */
function toEmbedUrl(url: string): string {
  if (!url) return url;
  const ytParams = 'modestbranding=1&rel=0&showinfo=0&iv_load_policy=3';
  if (url.includes('youtube.com/embed/')) {
    return url.includes('?') ? url : `${url}?${ytParams}`;
  }
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?${ytParams}`;
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?${ytParams}`;
  return url;
}

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
  <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
    <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
      Loading your offers...
    </p>
  </div>
);

// ============================================
// 404 State Component
// ============================================

const OfferNotFound: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-md">
      <h1 className="text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Offer Page Not Found
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
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
  <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Error Loading Offers
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">{message}</p>
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
  const offer = OFFERS[recommendedType];

  // Payment URLs
  const foundationsPaymentUrl = settings?.foundationsPaymentUrl || undefined;
  const engineeringPaymentUrl = settings?.engineeringPaymentUrl || undefined;
  const getPaymentUrl = (type: 'foundations' | 'engineering') =>
    type === 'foundations' ? foundationsPaymentUrl : engineeringPaymentUrl;

  // Video URLs
  const offerVideoUrl =
    recommendedType === 'foundations'
      ? settings?.foundationsOfferVideoUrl
      : settings?.engineeringOfferVideoUrl;

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
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <ThemeToggle />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* ===== Personalized Header ===== */}
        <div className="text-center mb-4">
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Prepared for{' '}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">
              {prospect.firstName || getProspectDisplayName(prospect)}
            </span>
          </p>
        </div>

        {/* Seller's Personalized Note */}
        {prospect.offerNote && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-10">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              A Note For You
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {prospect.offerNote}
            </p>
          </div>
        )}

        {/* ===== HERO SECTION ===== */}
        <section className="text-center mb-16">
          {/* Cohort date badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/20 mb-6">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">
              Next cohort: {cohortDateStr}
            </span>
            {daysUntil <= 30 && <span className="text-xs text-violet-400">({daysUntil} days)</span>}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-6 whitespace-pre-line">
            {offer.headline}
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            {offer.subheadline}
          </p>

          <CTASection paymentUrl={getPaymentUrl(recommendedType)} offer={offer} variant="primary" />
        </section>

        {/* ===== OFFER VIDEO ===== */}
        {offerVideoUrl && (
          <section className="mb-16">
            <div
              className="relative w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
              style={{ paddingBottom: '56.25%' }}
            >
              <iframe
                src={toEmbedUrl(offerVideoUrl)}
                title="Offer video"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

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
                By the end, you will have:
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

          {/* ===== CURRICULUM SECTION ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              What We Build Together
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
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
              offer={offer}
              variant="secondary"
            />
          </section>

          {/* ===== VALUE STACK ===== */}
          <section>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Everything You Get
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Here&rsquo;s what&rsquo;s included when you join:
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
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{offer.paymentPlan}</p>
            </div>
          </section>

          {/* ===== AI TOOLS INCLUDED ===== */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-violet-400" />
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                The AI Tools You Get
              </h2>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              8 weeks of access to proprietary AI tools built to run this exact system.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offer.toolsIncluded.map((tool) => (
                <div
                  key={tool.name}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                >
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{tool.name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{tool.description}</p>
                </div>
              ))}
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
                {offer.name}
              </h2>
              <div className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {offer.price}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">{offer.paymentPlan}</p>

              <CTASection
                paymentUrl={getPaymentUrl(recommendedType)}
                offer={offer}
                variant="primary"
              />

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

          {/* ===== URGENCY BANNER ===== */}
          <section className="bg-gradient-to-r from-violet-100 to-violet-50 border border-violet-200 dark:from-violet-600/20 dark:to-violet-500/10 dark:border-violet-500/30 rounded-xl p-6 sm:p-8 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-400" />
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                  Next cohort: {cohortDateStr}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-violet-400" />
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                  {spotsRemaining} spots remaining
                </span>
              </div>
              {daysUntil <= 30 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-violet-400" />
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                    {daysUntil} days left to enroll
                  </span>
                </div>
              )}
            </div>
            {offer.urgencyText && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">{offer.urgencyText}</p>
            )}
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

          {/* ===== FINAL CTA ===== */}
          <section className="text-center py-8">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Ready to Build Your System?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
              Next cohort starts {cohortDateStr}. {spotsRemaining} spots remaining.
            </p>
            <CTASection
              paymentUrl={getPaymentUrl(recommendedType)}
              offer={offer}
              variant="primary"
            />
          </section>

          {/* ===== SENJA TESTIMONIAL EMBED ===== */}
          <SenjaEmbed />

          {/* ===== FINAL ENROLL CTA ===== */}
          <section className="text-center py-8">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
              Join the next cohort and build your client acquisition system.
            </p>
            <CTASection
              paymentUrl={getPaymentUrl(recommendedType)}
              offer={offer}
              variant="primary"
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default OfferPage;
