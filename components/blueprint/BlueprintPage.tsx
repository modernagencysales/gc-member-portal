import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
import CalEmbed from './CalEmbed';
import SectionBridge from './SectionBridge';
import ValueStack from './ValueStack';
import SimpleSteps from './SimpleSteps';
import TestimonialQuote from './TestimonialQuote';
import ThemeToggle from './ThemeToggle';

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

  // Score-based intro paragraph
  const authorityScore = prospect.authorityScore ?? 0;
  const introParagraph = getScoreBasedIntro(authorityScore);

  // Scroll to CalEmbed handler
  const scrollToCalEmbed = () => {
    const el = calEmbedRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Re-scroll after a brief delay in case layout shifts from lazy-loaded content
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <ThemeToggle />
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 sm:space-y-16">
        {/* 1. Hero — BlueprintHeader (no CTA button, hook subtitle, score context) */}
        <BlueprintHeader prospect={prospect} scorecardCount={scorecardCount} />

        {/* 2. Logo Bar — instant social proof */}
        <LogoBar logos={clientLogos} />

        {/* 3. Bridge: problem identification intro */}
        <SectionBridge
          text="Here's where you stand right now — and what's standing between you and a full pipeline."
          variant="accent"
          stepNumber={1}
          stepLabel="Diagnose"
        />

        {/* 4. ScoreRadar — problem identification */}
        <ScoreRadar prospect={prospect} />

        {/* 5. Video walkthrough */}
        {settings?.blueprintVideoUrl && (
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
                src={settings.blueprintVideoUrl}
                title="Blueprint scorecard walkthrough"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* 6. AnalysisSection — with score-based intro */}
        <AnalysisSection prospect={prospect} introParagraph={introParagraph} />

        {/* 7. Bridge: transition to solution */}
        <SectionBridge
          text="Now let's fix it. Here's your new profile — optimized to attract and convert your ideal buyers."
          variant="gradient"
          stepNumber={2}
          stepLabel="Rebuild"
        />

        {/* 8. LinkedInProfileMock — visual showcase */}
        <LinkedInProfileMock prospect={prospect} />

        {/* 9. ProfileRewrite — detailed before/after */}
        <ProfileRewrite prospect={prospect} />

        {/* 10. Bridge: transition to content engine */}
        <SectionBridge
          text="A great profile gets attention. Now you need a content engine that turns that attention into pipeline."
          variant="accent"
          stepNumber={3}
          stepLabel="Activate"
        />

        {/* 11. LeadMagnets */}
        <LeadMagnets prospect={prospect} />

        {/* 12. ValueStack */}
        <ValueStack />

        {/* 13. ContentRoadmap */}
        <ContentRoadmap posts={posts} />

        {/* 14. CTA #1 — "Book Your 30-Min Strategy Call" */}
        <div className="flex justify-center">
          <CTAButton
            text="Book Your 30-Min Strategy Call"
            subtext="We'll map your quickest wins and build your 90-day plan"
            onClick={scrollToCalEmbed}
            size="large"
            icon="calendar"
          />
        </div>

        {/* 15. TestimonialQuote — specific, with before/after metrics */}
        <TestimonialQuote
          quote="I was posting randomly with zero strategy — maybe 1 inbound lead a quarter. After implementing the content roadmap, I booked 5 calls in my first month. The profile rewrite alone doubled my connection acceptance rate."
          author="Marketing Agency Owner"
          role="$500K+ revenue"
          result="5 calls in first month"
        />

        {/* 15.5. Senja testimonials wall */}
        <SenjaEmbed />

        {/* 16. FAQ — objections cleared before final CTA */}
        <MarketingBlock block={faqBlock} />

        {/* 17. What Happens Next — rewritten SimpleSteps */}
        <SimpleSteps />

        {/* 18. CalEmbed */}
        <CalEmbed ref={calEmbedRef} calLink={calBookingLink} />

        {/* 20. Facilitator credibility note */}
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Your call is with a senior strategist from the Modern Agency Sales team — 200+ blueprints
          delivered, $4.7M+ in client pipeline. No juniors, no scripts.
        </p>
      </div>

      {/* 22. StickyCTA (fixed position) */}
      <StickyCTA
        text="Book Your Strategy Call"
        calEmbedRef={calEmbedRef}
        isVisible={settings?.stickyCTAEnabled ?? true}
      />
    </div>
  );
};

export default BlueprintPage;
