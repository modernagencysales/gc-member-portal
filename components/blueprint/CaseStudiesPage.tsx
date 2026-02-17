import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, Target, MessageSquare, FileText } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// ============================================
// Types
// ============================================

interface CaseStudy {
  name: string;
  business: string;
  videoId: string;
  challenge: string;
  solution: string;
  results: string[];
  quote: string;
  metrics: { label: string; value: string }[];
}

// ============================================
// Case Study Data (from YouTube transcripts)
// ============================================

const CASE_STUDIES: CaseStudy[] = [
  {
    name: 'Alex Olim',
    business: 'Content Creation Agency',
    videoId: 's7QDYug_ya8',
    challenge:
      'Alex was stuck at $20K/month and unsure which offer to take to market. He was equivocating between two different offers and not making a clear decision, which was holding back his growth.',
    solution:
      'We helped Alex lock in his positioning and pick the right offer for his ICP. Once he had clarity, we installed DM outreach systems and helped him close deals more effectively with the right messaging.',
    results: [
      'Doubled revenue from $20K to $40K/month in two months',
      'Continued growing well beyond that milestone',
      'Broke limiting beliefs on adding new elements to his offer',
    ],
    quote:
      "It definitely made all the difference. Some simple details and tips that were actionable, easy to understand on those group calls just made all the difference and broke our limiting beliefs. It'll not only help you grow on LinkedIn but it will help you grow your business.",
    metrics: [
      { label: 'Revenue Growth', value: '2x' },
      { label: 'Timeline', value: '2 months' },
      { label: 'Starting MRR', value: '$20K' },
    ],
  },
  {
    name: 'Tyler Cook',
    business: 'B2B Email Marketing Agency',
    videoId: 'EmaDGqWFdn4',
    challenge:
      'Tyler was a great email expert but was scattered across niches -- doing ecom, coaches, consultants. He had no LinkedIn system and was missing out on a massive inbound channel.',
    solution:
      'We helped Tyler niche down into B2B email, installed DM automation systems, and built a deliverability audit as a lead magnet. He also used the DM chat helper GPT to re-engage cold leads.',
    results: [
      'Signed 5 new clients directly from LinkedIn',
      'Closed OfferPad (major real estate company)',
      'Reactivated leads who had previously rejected him',
      'Booked multiple calls per week from DM outreach',
    ],
    quote:
      "I booked two calls off of the general connection requests this last week. I've closed three. I think total we've signed on five new clients from the stuff.",
    metrics: [
      { label: 'New Clients', value: '5+' },
      { label: 'Key Win', value: 'OfferPad' },
      { label: 'Channel', value: 'DM Outreach' },
    ],
  },
  {
    name: 'Viktor Fazekas',
    business: 'Brand Agency',
    videoId: 'sqBwukZ_S6A',
    challenge:
      "Viktor had strong case studies and had worked with heavy hitters, but had a small profile and wasn't messaging himself properly. He wasn't getting the traction his credibility deserved.",
    solution:
      'We fixed his positioning, started targeted outreach, and got him connecting with ideal clients. We focused on letting his existing credibility do the heavy lifting once the messaging was clear.',
    results: [
      'Closed multiple clients within weeks',
      'Signed $5K+/month retainer deals',
      'Generated first-ever lead magnet response',
      'Built an inbound engine from a small profile',
    ],
    quote:
      "I wasn't expecting this kind of traction. People are coming in pretty much from the brands. They already know that you work with this guy. Can you help me as well?",
    metrics: [
      { label: 'Monthly Retainers', value: '$5K+' },
      { label: 'Profile Size', value: 'Small' },
      { label: 'Method', value: 'Positioning' },
    ],
  },
  {
    name: 'Jessie Healy',
    business: 'Performance Marketing Coach',
    videoId: 'pO98lKHWSr0',
    challenge:
      "Jessie had 15,000 followers and was getting some leads, but didn't have a system or process. She was creating content without frameworks and didn't have clarity on her avatar.",
    solution:
      'We gave her lead magnet templates, viral growth frameworks, and systematic content creation processes. We also helped her get real clarity on her target avatar and optimized her profile for booking calls.',
    results: [
      'Grew from 15K to 18K+ followers (250/week)',
      'Became fully booked with qualified leads',
      'Estimated ~$400K in revenue since working together',
      'Built a repeatable content system',
    ],
    quote:
      "I have too many leads right now. It\'s too crazy. I can\'t handle this. The important thing I\'ve really noticed is actually the number of booked calls with qualified leads. I\'m really fully booked actually at the moment.",
    metrics: [
      { label: 'Revenue Impact', value: '~$400K' },
      { label: 'Weekly Growth', value: '250 followers' },
      { label: 'Result', value: 'Fully Booked' },
    ],
  },
  {
    name: 'Caterina Mariani',
    business: 'Ecommerce Google Ads Freelancer',
    videoId: 'GRfRh_0q_5A',
    challenge:
      'Caterina had never done outreach or content. She relied entirely on referrals and was in the very competitive ecom niche. She had no system for generating new business.',
    solution:
      'We clarified her messaging to speak at the executive level (not getting stuck in the weeds), started her on content and outreach, and helped her build a paid audit front-end product to transition prospects into larger engagements.',
    results: [
      'Landed a $70K/month ad spend client from a cold DM',
      'Built a paid audit product for client acquisition',
      'Multiple pipeline opportunities from LinkedIn outreach',
    ],
    quote:
      "Someone wrote to me randomly and they spend $70K a month. I got the call today and I sold the audit and I think they're going to work with me.",
    metrics: [
      { label: 'Client Ad Spend', value: '$70K/mo' },
      { label: 'Source', value: 'Cold Inbound' },
      { label: 'Niche', value: 'Ecom Ads' },
    ],
  },
  {
    name: 'Chirag Kulkarni',
    business: 'Enterprise SEO Agency (Taco)',
    videoId: 'EDBtl6943nU',
    challenge:
      "Chirag ran an enterprise SEO company with clients like LinkedIn and Expedia, but wasn't getting any leads from LinkedIn. Growth came only from referrals and agency partnerships.",
    solution:
      'We helped him set up a consistent content cadence using proven frameworks. The focus was on showing up regularly with content that speaks directly to enterprise decision-makers.',
    results: [
      'LinkedIn became a lead generation source (was zero before)',
      'Attracting high-value enterprise leads',
      'Built a sustainable content system',
    ],
    quote:
      "Since posting, LinkedIn has become definitely a lead gen source for us, which is awesome. It was nothing before. If you're actually serious about implementing the tactics, I don't see a way where anyone who takes this isn't successful.",
    metrics: [
      { label: 'Before', value: '0 leads' },
      { label: 'After', value: 'Enterprise leads' },
      { label: 'Clients', value: 'LinkedIn, Expedia' },
    ],
  },
  {
    name: 'Evan Carroll',
    business: 'Performance Creative Agency',
    videoId: '0QJCxCVJkhU',
    challenge:
      "Evan was getting most clients through outbound and didn't understand LinkedIn. He wasn't doing content, DM outreach, or lead magnets. He knew there was opportunity but didn't know how to capitalize on it.",
    solution:
      'We built a complete LinkedIn system -- lead magnet strategy, DM outreach, content frameworks, partnership strategy, and LinkedIn Lives. Evan applied his outbound energy to LinkedIn with structure and went all-in.',
    results: [
      'Became a dominant player in his niche on LinkedIn',
      'Built consistent inbound pipeline from content',
      'Mastered lead magnets, partnerships, and LinkedIn Lives',
      'Completed a successful agency merger',
    ],
    quote:
      "The price to value ratio is one of the best I've ever seen. I've definitely got a lot, lot, lot more value than I paid for it. If anyone's on the fence, would definitely recommend it.",
    metrics: [
      { label: 'Status', value: 'Dominating' },
      { label: 'Method', value: 'Full System' },
      { label: 'Outcome', value: 'Agency Merger' },
    ],
  },
];

// ============================================
// Senja Embed
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
    <div
      className="senja-embed"
      data-id={SENJA_WIDGET_ID}
      data-mode="shadow"
      data-lazyload="false"
      style={{ display: 'block', width: '100%' }}
    />
  );
};

// ============================================
// Nav Bar
// ============================================

const NavBar: React.FC = () => (
  <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Modern Agency Sales
      </span>
      <div className="flex items-center gap-4 sm:gap-6">
        <Link
          to="/blueprint"
          onClick={() => window.scrollTo(0, 0)}
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Get Your Blueprint
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        >
          Login
        </Link>
      </div>
    </div>
  </nav>
);

// ============================================
// Hero
// ============================================

const Hero: React.FC = () => (
  <section className="bg-white dark:bg-zinc-950 py-16 sm:py-24">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-sm font-medium text-violet-700 dark:text-violet-300 mb-8">
        <TrendingUp className="w-4 h-4" />
        Real Results from Real Clients
      </span>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-6">
        Case Studies
      </h1>
      <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        See how agency owners, freelancers, and consultants are using LinkedIn to double revenue,
        land enterprise clients, and build predictable pipelines.
      </p>
    </div>
  </section>
);

// ============================================
// Case Study Card
// ============================================

const CaseStudyCard: React.FC<{ study: CaseStudy; index: number }> = ({ study, index }) => (
  <section className="bg-white dark:bg-zinc-950 py-16 sm:py-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
          Case Study #{index + 1}
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
          {study.name}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">{study.business}</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {study.metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center"
          >
            <div className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400">
              {metric.value}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Challenge */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              The Challenge
            </h3>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            {study.challenge}
          </p>
        </div>

        {/* Solution */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              What We Did
            </h3>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            {study.solution}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Results
          </h3>
        </div>
        <ul className="space-y-2">
          {study.results.map((result, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-zinc-700 dark:text-zinc-300 text-sm">{result}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quote */}
      <div className="bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/20 rounded-xl p-6 mb-10">
        <MessageSquare className="w-5 h-5 text-violet-500 mb-3" />
        <blockquote className="text-zinc-800 dark:text-zinc-200 text-base sm:text-lg leading-relaxed italic">
          &ldquo;{study.quote}&rdquo;
        </blockquote>
        <cite className="block mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 not-italic">
          &mdash; {study.name}, {study.business}
        </cite>
      </div>

      {/* Video Embed */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
        style={{ paddingBottom: '56.25%' }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${study.videoId}`}
          title={`Case Study: ${study.name}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  </section>
);

// ============================================
// CTA Section
// ============================================

const CTASection: React.FC = () => (
  <section className="bg-violet-600 dark:bg-violet-700 py-16 sm:py-20">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
        Ready to Be the Next Case Study?
      </h2>
      <p className="text-violet-100 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
        Get a free personalized blueprint with a complete profile rewrite, 60-day content calendar,
        and full authority audit.
      </p>
      <Link
        to="/blueprint"
        onClick={() => window.scrollTo(0, 0)}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold bg-white text-violet-700 hover:bg-violet-50 transition-colors shadow-lg"
      >
        Get Your Blueprint Now
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  </section>
);

// ============================================
// Footer
// ============================================

const Footer: React.FC = () => (
  <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-2">
      <p className="text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Modern Agency Sales. All rights reserved.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          to="/privacy"
          className="text-[11px] text-zinc-400 hover:text-zinc-500 transition-colors"
        >
          Privacy Policy
        </Link>
        <span className="text-[11px] text-zinc-300 dark:text-zinc-700">&middot;</span>
        <Link
          to="/terms"
          className="text-[11px] text-zinc-400 hover:text-zinc-500 transition-colors"
        >
          Terms of Service
        </Link>
      </div>
    </div>
  </footer>
);

// ============================================
// Main Page
// ============================================

const CaseStudiesPage: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-zinc-950">
    <ThemeToggle />
    <NavBar />
    <Hero />

    {/* Case Studies */}
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {CASE_STUDIES.map((study, i) => (
        <CaseStudyCard key={study.videoId} study={study} index={i} />
      ))}
    </div>

    {/* Mid-page CTA */}
    <CTASection />

    {/* Testimonials Wall */}
    <section className="bg-white dark:bg-zinc-950 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-10">
          What People Are Saying
        </h2>
        <SenjaEmbed />
      </div>
    </section>

    {/* Bottom CTA */}
    <CTASection />

    <Footer />

    {/* Sticky CTA */}
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-none">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Free personalized blueprint — $3,000+ value
            </span>
          </div>
          <Link
            to="/blueprint"
            onClick={() => window.scrollTo(0, 0)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-lg shadow-violet-500/25"
          >
            <FileText className="w-4 h-4" />
            Get Your Blueprint Now
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default CaseStudiesPage;
