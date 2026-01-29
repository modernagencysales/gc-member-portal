/**
 * Blueprint Types
 * Maps to the Supabase database schema for the LinkedIn Authority Blueprint feature.
 * Uses camelCase for TypeScript - the service layer handles snake_case conversion.
 */

// ============================================
// Enums and Constants
// ============================================

/**
 * Recommended offer types for prospects
 */
export type RecommendedOffer = 'bootcamp' | 'gc' | 'dfy' | 'none';

export const RECOMMENDED_OFFER_LABELS: Record<RecommendedOffer, string> = {
  bootcamp: 'Bootcamp',
  gc: 'Growth Collective',
  dfy: 'Done For You',
  none: 'None',
};

/**
 * Prospect processing status
 */
export type ProspectStatus =
  | 'pending_scrape'
  | 'scraping_profile'
  | 'scraping_posts'
  | 'pending_enrichment'
  | 'enriching'
  | 'enrichment_complete'
  | 'generating_posts'
  | 'complete'
  | 'error';

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  pending_scrape: 'Queued',
  scraping_profile: 'Scraping Profile',
  scraping_posts: 'Scraping Posts',
  pending_enrichment: 'Ready for Analysis',
  enriching: 'Analyzing',
  enrichment_complete: 'Analysis Complete',
  generating_posts: 'Generating Posts',
  complete: 'Complete',
  error: 'Error',
};

/**
 * Processing step enum
 */
export type ProcessingStep =
  | 'intake_validated'
  | 'Scraping Profile'
  | 'Scraping Posts'
  | 'Scraping Company'
  | 'AI Enrichment'
  | 'Generating Posts'
  | 'Complete';

/**
 * Analysis status
 */
export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'error';

/**
 * Content block types for blueprint marketing sections
 */
export type BlueprintContentBlockType =
  | 'testimonial'
  | 'case_study'
  | 'feature'
  | 'benefit'
  | 'faq'
  | 'pricing'
  | 'cta';

export const BLUEPRINT_CONTENT_BLOCK_TYPE_LABELS: Record<BlueprintContentBlockType, string> = {
  testimonial: 'Testimonial',
  case_study: 'Case Study',
  feature: 'Feature',
  benefit: 'Benefit',
  faq: 'FAQ',
  pricing: 'Pricing',
  cta: 'Call to Action',
};

// ============================================
// Lead Magnet Card Type
// ============================================

/**
 * Lead magnet card structure (stored as JSONB in lm_card_1/2/3)
 */
export interface LeadMagnetCard {
  contentType: string;
  headline: string;
  subheadline: string;
  match: string;
  estHours: string;
}

// ============================================
// Prospect Type
// ============================================

/**
 * Main Prospect interface
 * Maps to the prospects table in Supabase
 */
export interface Prospect {
  // Identity & Contact
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;

  // LinkedIn Profile
  linkedinUrl?: string;
  normalizedLinkedinUrl?: string;
  profilePhoto?: string;
  bannerImage?: string;
  companyLogo?: string;
  currentHeadline?: string;
  currentBio?: string;
  jobTitle?: string;
  connections?: number;

  // Form Submission Data
  businessType?: string;
  linkedinChallenge?: string;
  linkedinHelpArea?: string;
  postingFrequency?: string;
  hasFunnel?: string;
  learningInvestment?: string;
  monthlyIncome?: string;
  interestedInMas?: boolean;
  timezone?: string;
  sourceUrl?: string;
  leadMagnetSource?: string;
  submissionDate?: Date;

  // Scraped Content
  postsCleanText?: string;
  theirExistingPosts?: string;
  rawProfileJson?: Record<string, unknown>;
  rawCompanyResearch?: string;
  knowledgeBase?: string;

  // Authority Scores (1-100 for authority_score, 1-10 for subscores)
  authorityScore?: number;
  scoreProfileOptimization?: number;
  scoreContentPresence?: number;
  scoreOutboundSystems?: number;
  scoreInboundInfrastructure?: number;
  scoreSocialProof?: number;
  scoreSummary?: string;

  // What's Working Analysis
  whatsWorking1?: string;
  whatsWorking2?: string;
  whatsWorking3?: string;

  // Revenue Leaks Analysis
  revenueLeaks1?: string;
  revenueLeaks2?: string;
  revenueLeaks3?: string;

  // Strategic Analysis
  bottomLine?: string;
  buyerPersona?: string;
  strategicGap?: string;
  strategicOpportunity?: string;
  fitScore?: number;
  fitAssessment?: string;
  howToTakeFurther?: string;

  // Profile Rewrite - Headlines
  recommendedHeadline?: string;
  headlineOutcomeBased?: string;
  headlineAuthorityBased?: string;
  headlineHybrid?: string;
  headlineRecommendation?: string;
  headlineRecommendationReason?: string;

  // Profile Rewrite - Bio
  recommendedBio?: string;
  profileAnalysis?: string;
  profileRewrite?: string;
  voiceStyleGuide?: string;
  improvementSuggestions?: string[];

  // Lead Magnets - Cards (JSONB)
  lmCard1?: LeadMagnetCard;
  lmCard2?: LeadMagnetCard;
  lmCard3?: LeadMagnetCard;

  // Lead Magnets - Individual Fields (Flattened)
  lm1ContentType?: string;
  lm1Headline?: string;
  lm1Subheadline?: string;
  lm1Match?: string;
  lm1EstHours?: string;
  lm2ContentType?: string;
  lm2Headline?: string;
  lm2Subheadline?: string;
  lm2Match?: string;
  lm2EstHours?: string;
  lm3ContentType?: string;
  lm3Headline?: string;
  lm3Subheadline?: string;
  lm3Match?: string;
  lm3EstHours?: string;

  // Lead Magnets - Descriptions & Posts
  leadMag1?: string;
  leadMag2?: string;
  leadMag3?: string;
  lmPost1?: string;
  lmPost2?: string;
  lmPost3?: string;

  // Featured Section Recommendations
  featuredSlot1?: string;
  featuredSlot2?: string;
  featuredSlot3?: string;

  // Action Plans
  nextSteps30Day?: string;
  nextSteps90Day?: string;

  // Report & Status
  formattedReport?: string;
  status?: ProspectStatus;
  processingStep?: ProcessingStep;
  analysisStatus?: AnalysisStatus;
  analysisDate?: Date;
  errorLog?: string;
  emailSentAt?: Date;
  sendEmail?: boolean;

  // Blueprint-specific fields
  slug?: string;
  offerUnlocked?: boolean;
  recommendedOffer?: RecommendedOffer;
  offerNote?: string;

  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// ProspectPost Type
// ============================================

/**
 * Post generated for a prospect
 * Maps to the posts table in Supabase
 */
export interface ProspectPost {
  id: string;
  prospectId: string;
  templateId?: string;
  name?: string;
  postContent?: string;
  firstSentence?: string;
  postReady?: boolean;
  toFix?: boolean;
  actionItems?: string;
  number?: number;
  createdAt: Date;
}

// ============================================
// Blueprint Settings Type
// ============================================

/**
 * Blueprint feature settings
 * Maps to the blueprint_settings table in Supabase
 */
export interface BlueprintSettings {
  id: string;
  // Global settings
  stickyCTAEnabled: boolean;
  foundationsPaymentUrl: string;
  engineeringPaymentUrl: string;
  calBookingLink: string;
  // Offer visibility controls
  showBootcampOffer: boolean;
  showGcOffer: boolean;
  showDfyOffer: boolean;
  // Offer content
  bootcampOfferTitle: string;
  bootcampOfferDescription: string;
  bootcampOfferCta: string;
  bootcampOfferUrl: string;
  gcOfferTitle: string;
  gcOfferDescription: string;
  gcOfferCta: string;
  gcOfferUrl: string;
  dfyOfferTitle: string;
  dfyOfferDescription: string;
  dfyOfferCta: string;
  dfyOfferUrl: string;
  // Default unlock settings
  defaultOfferUnlocked: boolean;
  // Cohort settings
  nextCohortDateFoundations?: string;
  nextCohortDateEngineering?: string;
  spotsRemainingFoundations?: number;
  spotsRemainingEngineering?: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form data for editing blueprint settings
 */
export interface BlueprintSettingsFormData {
  stickyCTAEnabled: boolean;
  foundationsPaymentUrl: string;
  engineeringPaymentUrl: string;
  calBookingLink: string;
  showBootcampOffer: boolean;
  showGcOffer: boolean;
  showDfyOffer: boolean;
  bootcampOfferTitle: string;
  bootcampOfferDescription: string;
  bootcampOfferCta: string;
  bootcampOfferUrl: string;
  gcOfferTitle: string;
  gcOfferDescription: string;
  gcOfferCta: string;
  gcOfferUrl: string;
  dfyOfferTitle: string;
  dfyOfferDescription: string;
  dfyOfferCta: string;
  dfyOfferUrl: string;
  defaultOfferUnlocked: boolean;
  nextCohortDateFoundations?: string;
  nextCohortDateEngineering?: string;
  spotsRemainingFoundations?: number;
  spotsRemainingEngineering?: number;
}

// ============================================
// Blueprint Content Block Type
// ============================================

/**
 * Marketing content block for blueprint pages
 * Maps to the blueprint_content_blocks table in Supabase
 */
export interface BlueprintContentBlock {
  id: string;
  blockType: BlueprintContentBlockType;
  title?: string;
  content?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  sortOrder: number;
  isVisible: boolean;
  targetOffer?: RecommendedOffer;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form data for editing content blocks
 */
export interface BlueprintContentBlockFormData {
  blockType: BlueprintContentBlockType;
  title?: string;
  content?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  sortOrder: number;
  isVisible: boolean;
  targetOffer?: RecommendedOffer;
}

// ============================================
// Aggregate/View Types for UI
// ============================================

/**
 * Prospect with their generated posts
 */
export interface ProspectWithPosts extends Prospect {
  posts: ProspectPost[];
}

/**
 * Blueprint page data (for public-facing view)
 */
export interface BlueprintPageData {
  prospect: Prospect;
  posts: ProspectPost[];
  settings: BlueprintSettings;
  contentBlocks: BlueprintContentBlock[];
}

/**
 * Score data for radar chart display
 */
export interface BlueprintScoreData {
  profileOptimization: number;
  contentPresence: number;
  outboundSystems: number;
  inboundInfrastructure: number;
  socialProof: number;
}

/**
 * Analysis section grouping for display
 */
export interface BlueprintAnalysisGroup {
  whatsWorking: string[];
  revenueLeaks: string[];
  bottomLine?: string;
  buyerPersona?: string;
  strategicGap?: string;
  strategicOpportunity?: string;
}

/**
 * Lead magnet option for display
 */
export interface LeadMagnetOption {
  number: 1 | 2 | 3;
  card?: LeadMagnetCard;
  description?: string;
  promotionPost?: string;
}

/**
 * Headline option for display
 */
export interface HeadlineOption {
  type: 'outcome' | 'authority' | 'hybrid';
  label: string;
  value?: string;
  isRecommended: boolean;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract score data from a prospect for radar chart
 */
export function extractScoreData(prospect: Prospect): BlueprintScoreData {
  return {
    profileOptimization: prospect.scoreProfileOptimization ?? 0,
    contentPresence: prospect.scoreContentPresence ?? 0,
    outboundSystems: prospect.scoreOutboundSystems ?? 0,
    inboundInfrastructure: prospect.scoreInboundInfrastructure ?? 0,
    socialProof: prospect.scoreSocialProof ?? 0,
  };
}

/**
 * Extract analysis groups from a prospect
 */
export function extractAnalysisGroup(prospect: Prospect): BlueprintAnalysisGroup {
  const whatsWorking: string[] = [];
  if (prospect.whatsWorking1) whatsWorking.push(prospect.whatsWorking1);
  if (prospect.whatsWorking2) whatsWorking.push(prospect.whatsWorking2);
  if (prospect.whatsWorking3) whatsWorking.push(prospect.whatsWorking3);

  const revenueLeaks: string[] = [];
  if (prospect.revenueLeaks1) revenueLeaks.push(prospect.revenueLeaks1);
  if (prospect.revenueLeaks2) revenueLeaks.push(prospect.revenueLeaks2);
  if (prospect.revenueLeaks3) revenueLeaks.push(prospect.revenueLeaks3);

  return {
    whatsWorking,
    revenueLeaks,
    bottomLine: prospect.bottomLine,
    buyerPersona: prospect.buyerPersona,
    strategicGap: prospect.strategicGap,
    strategicOpportunity: prospect.strategicOpportunity,
  };
}

/**
 * Extract lead magnet options from a prospect
 */
export function extractLeadMagnetOptions(prospect: Prospect): LeadMagnetOption[] {
  return [
    {
      number: 1,
      card: prospect.lmCard1,
      description: prospect.leadMag1,
      promotionPost: prospect.lmPost1,
    },
    {
      number: 2,
      card: prospect.lmCard2,
      description: prospect.leadMag2,
      promotionPost: prospect.lmPost2,
    },
    {
      number: 3,
      card: prospect.lmCard3,
      description: prospect.leadMag3,
      promotionPost: prospect.lmPost3,
    },
  ];
}

/**
 * Extract headline options from a prospect
 */
export function extractHeadlineOptions(prospect: Prospect): HeadlineOption[] {
  const recommended = prospect.headlineRecommendation?.toLowerCase() ?? '';

  return [
    {
      type: 'outcome',
      label: 'Outcome-Based',
      value: prospect.headlineOutcomeBased,
      isRecommended: recommended.includes('outcome'),
    },
    {
      type: 'authority',
      label: 'Authority-Based',
      value: prospect.headlineAuthorityBased,
      isRecommended: recommended.includes('authority'),
    },
    {
      type: 'hybrid',
      label: 'Hybrid',
      value: prospect.headlineHybrid,
      isRecommended: recommended.includes('hybrid'),
    },
  ];
}

/**
 * Get progress percentage based on prospect status
 */
export function getProgressPercentage(status?: ProspectStatus): number {
  const progressMap: Record<ProspectStatus, number> = {
    pending_scrape: 0,
    scraping_profile: 20,
    scraping_posts: 40,
    pending_enrichment: 40,
    enriching: 60,
    enrichment_complete: 80,
    generating_posts: 90,
    complete: 100,
    error: 0,
  };
  return status ? progressMap[status] : 0;
}

/**
 * Check if prospect analysis is complete
 */
export function isAnalysisComplete(prospect: Prospect): boolean {
  return prospect.status === 'complete' || prospect.status === 'enrichment_complete';
}

/**
 * Get display name for prospect
 */
export function getProspectDisplayName(prospect: Prospect): string {
  if (prospect.fullName) return prospect.fullName;
  if (prospect.firstName && prospect.lastName) {
    return `${prospect.firstName} ${prospect.lastName}`;
  }
  if (prospect.firstName) return prospect.firstName;
  if (prospect.email) return prospect.email;
  return 'Unknown Prospect';
}
