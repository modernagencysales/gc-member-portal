import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import {
  getProspectBySlug,
  getProspectPosts,
  getBlueprintSettings,
  getAllContentBlocks,
  getProspectCount,
  getClientLogos,
  ClientLogo,
} from '../../services/blueprint-supabase';
import {
  Prospect,
  ProspectPost,
  BlueprintSettings,
  BlueprintContentBlock,
} from '../../types/blueprint-types';

// Import blueprint components
import BlueprintHeader from './BlueprintHeader';
import LogoBar from './LogoBar';
import ScoreRadar from './ScoreRadar';
import AnalysisSection from './AnalysisSection';
import LinkedInProfileMock from './LinkedInProfileMock';
import ProfileRewrite from './ProfileRewrite';
import LeadMagnets from './LeadMagnets';
import ContentRoadmap from './ContentRoadmap';
import MarketingBlock from './MarketingBlock';
import CTAButton from './CTAButton';
import StickyCTA from './StickyCTA';
import CalEmbed, { buildCalBookingUrl, CalProspectInfo } from './CalEmbed';
import SectionBridge from './SectionBridge';
import ValueStack from './ValueStack';
import SimpleSteps from './SimpleSteps';
import TestimonialQuote from './TestimonialQuote';
import ThemeToggle from './ThemeToggle';
import ScrollReveal from './ScrollReveal';
import { useTenantBranding, getTenantColors } from '../../services/tenant-branding';

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

interface BlueprintData {
  prospect: Prospect;
  posts: ProspectPost[];
  settings: BlueprintSettings | null;
  contentBlocks: BlueprintContentBlock[];
  scorecardCount: number;
  clientLogos: ClientLogo[];
}

// ============================================
// Loading State Component
// ============================================

const BlueprintLoadingState: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-2 border-zinc-300 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
    <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
      Loading your blueprint...
    </p>
  </div>
);

// ============================================
// 404 State Component
// ============================================

const BlueprintNotFound: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-md">
      <h1 className="text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Blueprint Not Found
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        We couldn't find the blueprint you're looking for. Please check the URL or contact support
        if you believe this is an error.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Go Home
      </a>
    </div>
  </div>
);

// ============================================
// Error State Component
// ============================================

interface BlueprintErrorProps {
  message?: string;
  onRetry?: () => void;
}

const BlueprintError: React.FC<BlueprintErrorProps> = ({
  message = 'Something went wrong while loading your blueprint.',
  onRetry,
}) => (
  <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Error Loading Blueprint
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

// ============================================
// Senja Embed Component
// ============================================

const SENJA_WIDGET_ID = 'ec06dbf2-1417-4d3e-ba0a-0ade12fa83e1';

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
// Score-based intro paragraph helper
// ============================================

function getScoreBasedIntro(authorityScore: number): string {
  if (authorityScore > 70) {
    return "You're ahead of most professionals on LinkedIn. These refinements will help you maximize the pipeline from your existing presence.";
  }
  if (authorityScore >= 40) {
    return "You have a solid foundation. These targeted optimizations will help you convert more of the attention you're already getting.";
  }
  return 'Your LinkedIn presence has significant untapped potential. The good news: small changes here will have an outsized impact on your pipeline.';
}

// ============================================
// Main BlueprintPage Component
// ============================================

const BlueprintPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  // Tenant branding from query param ?tenant_id=xxx
  const tenantId = searchParams.get('tenant_id');
  const { branding: tenantBranding } = useTenantBranding(tenantId);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<BlueprintData | null>(null);

  // Ref for CalEmbed intersection observer
  const calEmbedRef = useRef<HTMLDivElement>(null);

  // Fetch data
  const fetchBlueprintData = async () => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      // Fetch prospect by slug first
      const prospect = await getProspectBySlug(slug);

      if (!prospect) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Fetch remaining data in parallel
      const [posts, settings, contentBlocks, scorecardCount, clientLogos] = await Promise.all([
        getProspectPosts(prospect.id),
        getBlueprintSettings(),
        getAllContentBlocks(),
        getProspectCount(),
        getClientLogos(),
      ]);

      setData({
        prospect,
        posts,
        settings,
        contentBlocks,
        scorecardCount,
        clientLogos,
      });
    } catch (err) {
      console.error('Failed to load blueprint data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlueprintData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Handle loading state
  if (loading) {
    return <BlueprintLoadingState />;
  }

  // Handle 404 state
  if (notFound) {
    return <BlueprintNotFound />;
  }

  // Handle error state
  if (error) {
    return <BlueprintError message={error} onRetry={fetchBlueprintData} />;
  }

  // Handle no data (shouldn't happen, but TypeScript safety)
  if (!data) {
    return <BlueprintError message="No data available" onRetry={fetchBlueprintData} />;
  }

  const { prospect, posts, settings, contentBlocks, scorecardCount, clientLogos } = data;

  // Filter content blocks — only FAQ needed now (bootcamp removed)
  const faqBlock = contentBlocks.find((b) => b.blockType === 'faq');

  // Get calBookingLink from settings with fallback
  const calBookingLink = settings?.calBookingLink || 'timkeen/30min';

  // Build prospect info for Cal.com pre-filling
  const prospectInfo: CalProspectInfo = {
    name: prospect.fullName,
    email: prospect.email,
    company: prospect.company,
    authorityScore: prospect.authorityScore,
  };

  // Build a standalone (new-tab) Cal.com booking URL with pre-filled prospect data
  const calNewTabUrl = buildCalBookingUrl(calBookingLink, { prospectInfo });

  // Score-based intro paragraph
  const authorityScore = prospect.authorityScore ?? 0;
  const introParagraph = getScoreBasedIntro(authorityScore);

  // Hide booking UI for disqualified survey respondents (low revenue)
  // Cold email leads (no monthlyIncome) still see booking
  const DISQUALIFYING_REVENUE = ['Not generating revenue yet', 'Under $5k', '$5k-$10k'];
  const showBooking =
    !prospect.monthlyIncome || !DISQUALIFYING_REVENUE.includes(prospect.monthlyIncome);

  // Dynamic CTA: offer unlock → "View Your Offer", otherwise default
  const offerUrl =
    prospect.offerUnlocked && prospect.slug ? `/blueprint/${prospect.slug}/offer` : undefined;

  // Tenant branding takes priority, then offer unlock, then default
  const hasTenantBranding = !!tenantBranding;
  const ctaText =
    tenantBranding?.offer_cta_text ||
    (offerUrl ? 'View Your Offer' : 'Book Your 30-Min Strategy Call');
  const ctaSubtext =
    tenantBranding?.offer_description ||
    (offerUrl
      ? 'See your personalized program recommendation'
      : "We'll map your quickest wins and build your 90-day plan");
  const ctaHref = tenantBranding?.offer_cta_url || offerUrl || undefined;
  const stickyCtaText =
    tenantBranding?.offer_cta_text || (offerUrl ? 'View Your Offer' : 'Book Your Strategy Call');
  const stickyCtaHref = tenantBranding?.offer_cta_url || offerUrl || undefined;
  const tenantColorStyles = getTenantColors(tenantBranding);

  // Scroll to CalEmbed handler
  const scrollToCalEmbed = () => {
    const el = calEmbedRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Re-scroll after a brief delay in case layout shifts from lazy-loaded content
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 800);
  };

  return (
    <div
      className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans"
      style={tenantColorStyles}
    >
      <ThemeToggle />
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-20 sm:space-y-28">
        {/* 1. Hero — BlueprintHeader (no CTA button, hook subtitle, score context) */}
        <ScrollReveal>
          <BlueprintHeader
            prospect={prospect}
            scorecardCount={scorecardCount}
            tenantBranding={tenantBranding}
          />
        </ScrollReveal>

        {/* 2. Video walkthrough — moved above ValueStack */}
        {settings?.blueprintVideoUrl && (
          <ScrollReveal delay={50}>
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Watch: Your Scorecard Explained
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                A quick walkthrough of what your scores mean and what to do next.
              </p>
              <div
                className="relative w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                style={{ paddingBottom: '56.25%' }}
              >
                <iframe
                  src={toEmbedUrl(settings.blueprintVideoUrl)}
                  title="Blueprint scorecard walkthrough"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* 3. ValueStack — what's in your blueprint */}
        <ScrollReveal delay={100}>
          <ValueStack />
        </ScrollReveal>

        {/* 3. Logo Bar — instant social proof */}
        <ScrollReveal delay={200}>
          <LogoBar logos={clientLogos} maxLogos={settings?.maxLogosBlueprint} />
        </ScrollReveal>

        {/* 3. Bridge: problem identification intro */}
        <ScrollReveal>
          <SectionBridge
            text="Here's where you stand right now — and what's standing between you and a full pipeline."
            variant="accent"
            stepNumber={1}
            stepLabel="Diagnose"
          />
        </ScrollReveal>

        {/* 4. ScoreRadar — problem identification */}
        <ScrollReveal delay={100}>
          <ScoreRadar prospect={prospect} />
        </ScrollReveal>

        {/* 5. AnalysisSection — with score-based intro */}
        <ScrollReveal delay={150}>
          <AnalysisSection prospect={prospect} introParagraph={introParagraph} />
        </ScrollReveal>

        {/* 7. Bridge: transition to solution */}
        <ScrollReveal>
          <SectionBridge
            text="Now let's fix it. Here's your new profile — optimized to attract and convert your ideal buyers."
            variant="gradient"
            stepNumber={2}
            stepLabel="Rebuild"
          />
        </ScrollReveal>

        {/* 8. LinkedInProfileMock — visual showcase */}
        <ScrollReveal delay={100}>
          <LinkedInProfileMock prospect={prospect} />
        </ScrollReveal>

        {/* 9. ProfileRewrite — detailed before/after */}
        <ScrollReveal delay={150}>
          <ProfileRewrite prospect={prospect} />
        </ScrollReveal>

        {/* 10. Bridge: transition to content engine */}
        <ScrollReveal>
          <SectionBridge
            text="A great profile gets attention. Now you need a content engine that turns that attention into pipeline."
            variant="accent"
            stepNumber={3}
            stepLabel="Activate"
          />
        </ScrollReveal>

        {/* 11. LeadMagnets */}
        <ScrollReveal delay={100}>
          <LeadMagnets prospect={prospect} />
        </ScrollReveal>

        {/* 12. ContentRoadmap */}
        <ScrollReveal delay={150}>
          <ContentRoadmap posts={posts} />
        </ScrollReveal>

        {/* 14. CTA #1 — "Book Your 30-Min Strategy Call" (hidden for disqualified unless offer/tenant link) */}
        {(ctaHref || showBooking) && (
          <ScrollReveal delay={100}>
            <div className="flex flex-col items-center gap-4">
              <CTAButton
                text={ctaText}
                subtext={ctaSubtext}
                onClick={ctaHref ? undefined : scrollToCalEmbed}
                href={ctaHref}
                size="large"
                icon={offerUrl ? 'arrow' : 'calendar'}
                useBrandColors={hasTenantBranding}
              />
              {authorityScore > 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Your Authority Score:{' '}
                  <span className="font-semibold text-violet-600 dark:text-violet-400">
                    {authorityScore}/100
                  </span>{' '}
                  — let&apos;s unlock the rest.
                </p>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* 15. TestimonialQuote — specific, with before/after metrics */}
        <ScrollReveal>
          <TestimonialQuote
            quote="I was posting randomly with zero strategy — maybe 1 inbound lead a quarter. After implementing the content roadmap, I booked 5 calls in my first month. The profile rewrite alone doubled my connection acceptance rate."
            author="Marketing Agency Owner"
            role="$500K+ revenue"
            result="5 calls in first month"
          />
        </ScrollReveal>

        {/* 15.5. Senja testimonials wall */}
        <SenjaEmbed />

        {/* 16. FAQ — objections cleared before final CTA */}
        {faqBlock && faqBlock.isVisible && (
          <ScrollReveal delay={100}>
            <MarketingBlock block={faqBlock} />
          </ScrollReveal>
        )}

        {/* 17. What Happens Next — rewritten SimpleSteps (hidden for disqualified) */}
        {showBooking && (
          <ScrollReveal>
            <SimpleSteps />
          </ScrollReveal>
        )}
      </div>

      {/* Bottom section — headline, Cal embed, credibility note (hidden for disqualified) */}
      {showBooking && (
        <div className="max-w-4xl mx-auto px-4 pb-12 sm:pb-16 space-y-6">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-zinc-900 dark:text-zinc-100">
              {tenantBranding?.offer_title || 'Book Your Free Strategy Call Now'}
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <CalEmbed ref={calEmbedRef} calLink={calBookingLink} prospectInfo={prospectInfo} />
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Your call is with a senior strategist from the Modern Agency Sales team — 200+
              blueprints delivered, $4.7M+ in client pipeline. No juniors, no scripts.
            </p>
          </ScrollReveal>
        </div>
      )}

      {/* 22. StickyCTA (fixed position) */}
      <StickyCTA
        text={stickyCtaText}
        calEmbedRef={calEmbedRef}
        isVisible={(settings?.stickyCTAEnabled ?? true) && (!!stickyCtaHref || showBooking)}
        href={stickyCtaHref}
        useBrandColors={hasTenantBranding}
      />
    </div>
  );
};

export default BlueprintPage;
