import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import {
  getProspectBySlug,
  getProspectPosts,
  getBlueprintSettings,
  getAllContentBlocks,
} from '../../services/blueprint-supabase';
import {
  Prospect,
  ProspectPost,
  BlueprintSettings,
  BlueprintContentBlock,
} from '../../types/blueprint-types';

// Import blueprint components
import BlueprintHeader from './BlueprintHeader';
import ScoreRadar from './ScoreRadar';
import AnalysisSection from './AnalysisSection';
import ProfileRewrite from './ProfileRewrite';
import LeadMagnets from './LeadMagnets';
import ContentRoadmap from './ContentRoadmap';
import MarketingBlock from './MarketingBlock';
import CTAButton from './CTAButton';
import StickyCTA from './StickyCTA';
import CalEmbed from './CalEmbed';

// ============================================
// Types
// ============================================

interface BlueprintData {
  prospect: Prospect;
  posts: ProspectPost[];
  settings: BlueprintSettings | null;
  contentBlocks: BlueprintContentBlock[];
}

// ============================================
// Loading State Component
// ============================================

const BlueprintLoadingState: React.FC = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
    <p className="mt-4 text-zinc-400 text-sm font-medium">Loading your blueprint...</p>
  </div>
);

// ============================================
// 404 State Component
// ============================================

const BlueprintNotFound: React.FC = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-md">
      <h1 className="text-6xl font-bold text-zinc-100 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-zinc-100 mb-2">Blueprint Not Found</h2>
      <p className="text-zinc-400 mb-8">
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
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-100 mb-2">Error Loading Blueprint</h2>
      <p className="text-zinc-400 mb-8">{message}</p>
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
      const [posts, settings, contentBlocks] = await Promise.all([
        getProspectPosts(prospect.id),
        getBlueprintSettings(),
        getAllContentBlocks(),
      ]);

      setData({
        prospect,
        posts,
        settings,
        contentBlocks,
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

  const { prospect, posts, settings, contentBlocks } = data;

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 1. BlueprintHeader */}
        <BlueprintHeader prospect={prospect} />

        {/* 2. ScoreRadar */}
        <ScoreRadar prospect={prospect} />

        {/* 3. MarketingBlock: "allbound_system" */}
        <MarketingBlock block={allboundSystemBlock} />

        {/* 4. AnalysisSection */}
        <AnalysisSection prospect={prospect} />

        {/* 5. CTAButton #1 */}
        <div className="flex justify-center">
          <CTAButton text="Book Your Strategy Call" onClick={scrollToCalEmbed} />
        </div>

        {/* 6. ProfileRewrite */}
        <ProfileRewrite prospect={prospect} />

        {/* 7. CTAButton #2 */}
        <div className="flex justify-center">
          <CTAButton text="Let's Talk Strategy" onClick={scrollToCalEmbed} icon="arrow" />
        </div>

        {/* 8. LeadMagnets */}
        <LeadMagnets prospect={prospect} />

        {/* 9. ContentRoadmap */}
        <ContentRoadmap posts={posts} />

        {/* 10. CTAButton #3 */}
        <div className="flex justify-center">
          <CTAButton text="Ready to Transform Your LinkedIn?" onClick={scrollToCalEmbed} />
        </div>

        {/* 11. MarketingBlock: "bootcamp_pitch" */}
        <MarketingBlock block={bootcampPitchBlock} />

        {/* 12. MarketingBlock: "faqs" */}
        <MarketingBlock block={faqBlock} />

        {/* 13. Testimonials (Senja embed) - Placeholder for future implementation */}
        {/* TODO: Add Senja testimonials embed when ready */}

        {/* 14. CalEmbed */}
        <CalEmbed ref={calEmbedRef} calLink={calBookingLink} />
      </div>

      {/* 15. StickyCTA (fixed position) */}
      <StickyCTA
        text="Book Your Strategy Call"
        calEmbedRef={calEmbedRef}
        isVisible={settings?.stickyCTAEnabled ?? true}
      />
    </div>
  );
};

export default BlueprintPage;
