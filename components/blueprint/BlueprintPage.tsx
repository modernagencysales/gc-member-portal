import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import {
  getProspectBySlug,
  getProspectPosts,
  getBlueprintSettings,
  getAllContentBlocks,
  getProspectCount,
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
      const [posts, settings, contentBlocks, scorecardCount] = await Promise.all([
        getProspectPosts(prospect.id),
        getBlueprintSettings(),
        getAllContentBlocks(),
        getProspectCount(),
      ]);

      setData({
        prospect,
        posts,
        settings,
        contentBlocks,
        scorecardCount,
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

  const { prospect, posts, settings, contentBlocks, scorecardCount } = data;

  // Filter content blocks by type for marketing sections
  const allboundSystemBlock = contentBlocks.find(
    (b) => b.blockType === 'feature' || b.title?.toLowerCase().includes('allbound')
  );
  const bootcampPitchBlock = contentBlocks.find(
    (b) => b.blockType === 'cta' || b.title?.toLowerCase().includes('bootcamp')
  );
  const faqBlock = contentBlocks.find((b) => b.blockType === 'faq');

  // Get calBookingLink from settings with fallback
  const calBookingLink = settings?.calBookingLink || 'timkeen/30min';

  // Scroll to CalEmbed handler
  const scrollToCalEmbed = () => {
    calEmbedRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <ThemeToggle />
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 sm:space-y-16">
        {/* 1. Hero — BlueprintHeader with stats bar + authority score + CTA */}
        <BlueprintHeader
          prospect={prospect}
          onCTAClick={scrollToCalEmbed}
          ctaText="See What You're Missing"
          scorecardCount={scorecardCount}
        />

        {/* 2. Logo Bar — instant social proof */}
        <LogoBar />

        {/* 3. Bridge: problem identification intro */}
        <SectionBridge
          text="Here's where you stand right now — and what's standing between you and a full pipeline."
          variant="accent"
        />

        {/* 4. ScoreRadar — problem identification */}
        <ScoreRadar prospect={prospect} />

        {/* 4.5. Video walkthrough */}
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

        {/* 5. AnalysisSection — what's working vs revenue leaks */}
        <AnalysisSection
          prospect={prospect}
          introParagraph="We analyzed your LinkedIn presence across 5 key dimensions. Here's what stands out."
        />

        {/* 6. Testimonial #1 — social proof right after problem reveal */}
        <TestimonialQuote
          quote="The blueprint showed me exactly where I was leaving money on the table. Within 30 days of implementing the profile rewrite and content plan, I had 3 new discovery calls booked from LinkedIn alone."
          author="Recent Blueprint Client"
          role="B2B Consultant"
          result="3 calls in 30 days"
        />

        {/* 7. MarketingBlock: allbound system (if exists) */}
        <MarketingBlock block={allboundSystemBlock} />

        {/* 8. Bridge: transition to solution */}
        <SectionBridge
          text="Now let's fix it. Here's your new profile — optimized to attract and convert your ideal buyers."
          variant="gradient"
        />

        {/* 9. LinkedInProfileMock — visual showcase */}
        <LinkedInProfileMock prospect={prospect} />

        {/* 10. ProfileRewrite — detailed before/after */}
        <ProfileRewrite prospect={prospect} />

        {/* 11. CTA #1 (secondary — save primary for later) */}
        <div className="flex justify-center">
          <CTAButton
            text="Get Help Implementing This"
            subtext="Book a 30-min strategy call"
            onClick={scrollToCalEmbed}
            size="large"
            variant="secondary"
          />
        </div>

        {/* 12. Bridge: transition to content engine */}
        <SectionBridge
          text="But a great profile isn't enough. You need a content engine that keeps your pipeline full."
          variant="accent"
        />

        {/* 13. LeadMagnets */}
        <LeadMagnets prospect={prospect} />

        {/* 14. ValueStack — moved up before calendar to establish value */}
        <ValueStack />

        {/* 15. ContentRoadmap */}
        <ContentRoadmap posts={posts} />

        {/* 16. Testimonial #2 — proof before the conversion push */}
        <TestimonialQuote
          quote="I was posting on LinkedIn randomly with no strategy. After implementing this blueprint, my pipeline went from empty to consistently booking 5+ calls per week. The content roadmap alone was a game changer."
          author="Agency Owner"
          role="Marketing Services"
          result="5+ calls/week"
        />

        {/* 17. CTA #2 (primary — main conversion point) */}
        <div className="flex justify-center">
          <CTAButton
            text="Turn This Blueprint Into Revenue"
            subtext="Let's map out your implementation plan"
            onClick={scrollToCalEmbed}
            size="large"
            icon="arrow"
          />
        </div>

        {/* 18. Testimonials — Senja embed if available */}
        {settings?.senjaWidgetUrl && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              What People Are Saying
            </h2>
            <div className="rounded-xl overflow-hidden">
              <iframe
                src={settings.senjaWidgetUrl}
                title="Client testimonials"
                className="w-full border-0"
                style={{ minHeight: '500px' }}
                loading="lazy"
              />
            </div>
          </section>
        )}

        {/* 19. SimpleSteps — right before final CTA to reduce friction */}
        <SimpleSteps />

        {/* 20. MarketingBlock: bootcamp pitch */}
        <MarketingBlock block={bootcampPitchBlock} />

        {/* 21. MarketingBlock: FAQs — address objections before final ask */}
        <MarketingBlock block={faqBlock} />

        {/* 22. CTA #3 (primary + urgency) */}
        <div className="flex flex-col items-center gap-3">
          <CTAButton
            text="Book Your Strategy Call Now"
            subtext="30 minutes. Zero pressure. Let's talk."
            onClick={scrollToCalEmbed}
            size="large"
            icon="calendar"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Limited spots available each month for hands-on implementation support.
          </p>
        </div>

        {/* 23. CalEmbed */}
        <CalEmbed ref={calEmbedRef} calLink={calBookingLink} />
      </div>

      {/* 24. StickyCTA (fixed position) */}
      <StickyCTA
        text="Book Your Strategy Call"
        calEmbedRef={calEmbedRef}
        isVisible={settings?.stickyCTAEnabled ?? true}
      />
    </div>
  );
};

export default BlueprintPage;
