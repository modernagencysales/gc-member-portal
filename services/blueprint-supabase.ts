/**
 * Blueprint Supabase Service
 * Handles all database operations for the LinkedIn Authority Blueprint feature
 */

import { supabase } from '../lib/supabaseClient';
import {
  Prospect,
  ProspectPost,
  BlueprintSettings,
  BlueprintContentBlock,
  ProspectStatus,
  RecommendedOffer,
  LeadMagnetCard,
  BlueprintContentBlockType,
} from '../types/blueprint-types';

// ============================================
// Prospect Filters Interface
// ============================================

export interface ProspectFilters {
  status?: ProspectStatus;
  search?: string; // searches fullName, email, company
  hasSlug?: boolean;
  offerUnlocked?: boolean;
  recommendedOffer?: RecommendedOffer;
  limit?: number;
  offset?: number;
}

// ============================================
// Slug Generation
// ============================================

/**
 * Generate a unique slug for a prospect
 * Format: name-slug-xxxx (lowercase, spaces to hyphens, no special chars, 4-char suffix)
 * Example: "Gabrielle San Nicola" -> "gabrielle-san-nicola-7x3k"
 */
export function generateSlug(fullName: string): string {
  // Normalize name: lowercase, remove special chars, replace spaces with hyphens
  const nameSlug = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Generate 4-char alphanumeric suffix (no confusing chars like 0/O/1/I/l)
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const suffix = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');

  return `${nameSlug}-${suffix}`;
}

// ============================================
// Mapper Functions
// ============================================

function mapProspect(record: Record<string, unknown>): Prospect {
  return {
    // Identity & Contact
    id: record.id as string,
    fullName: record.full_name as string | undefined,
    firstName: record.first_name as string | undefined,
    lastName: record.last_name as string | undefined,
    email: record.email as string | undefined,
    phone: record.phone as string | undefined,
    company: record.company as string | undefined,
    location: record.location as string | undefined,

    // LinkedIn Profile
    linkedinUrl: record.linkedin_url as string | undefined,
    normalizedLinkedinUrl: record.normalized_linkedin_url as string | undefined,
    profilePhoto: record.profile_photo as string | undefined,
    bannerImage: record.banner_image as string | undefined,
    companyLogo: record.company_logo as string | undefined,
    currentHeadline: record.current_headline as string | undefined,
    currentBio: record.current_bio as string | undefined,
    jobTitle: record.job_title as string | undefined,
    connections: record.connections as number | undefined,

    // Form Submission Data
    businessType: record.business_type as string | undefined,
    linkedinChallenge: record.linkedin_challenge as string | undefined,
    linkedinHelpArea: record.linkedin_help_area as string | undefined,
    postingFrequency: record.posting_frequency as string | undefined,
    hasFunnel: record.has_funnel as string | undefined,
    learningInvestment: record.learning_investment as string | undefined,
    monthlyIncome: record.monthly_income as string | undefined,
    interestedInMas: record.interested_in_mas as boolean | undefined,
    timezone: record.timezone as string | undefined,
    sourceUrl: record.source_url as string | undefined,
    leadMagnetSource: record.lead_magnet_source as string | undefined,
    submissionDate: record.submission_date ? new Date(record.submission_date as string) : undefined,

    // Scraped Content
    postsCleanText: record.posts_clean_text as string | undefined,
    theirExistingPosts: record.their_existing_posts as string | undefined,
    rawProfileJson: record.raw_profile_json as Record<string, unknown> | undefined,
    rawCompanyResearch: record.raw_company_research as string | undefined,
    knowledgeBase: record.knowledge_base as string | undefined,

    // Authority Scores
    authorityScore: record.authority_score as number | undefined,
    scoreProfileOptimization: record.score_profile_optimization as number | undefined,
    scoreContentPresence: record.score_content_presence as number | undefined,
    scoreOutboundSystems: record.score_outbound_systems as number | undefined,
    scoreInboundInfrastructure: record.score_inbound_infrastructure as number | undefined,
    scoreSocialProof: record.score_social_proof as number | undefined,
    scoreSummary: record.score_summary as string | undefined,

    // What's Working Analysis
    whatsWorking1: record.whats_working_1 as string | undefined,
    whatsWorking2: record.whats_working_2 as string | undefined,
    whatsWorking3: record.whats_working_3 as string | undefined,

    // Revenue Leaks Analysis
    revenueLeaks1: record.revenue_leaks_1 as string | undefined,
    revenueLeaks2: record.revenue_leaks_2 as string | undefined,
    revenueLeaks3: record.revenue_leaks_3 as string | undefined,

    // Strategic Analysis
    bottomLine: record.bottom_line as string | undefined,
    buyerPersona: record.buyer_persona as string | undefined,
    strategicGap: record.strategic_gap as string | undefined,
    strategicOpportunity: record.strategic_opportunity as string | undefined,
    fitScore: record.fit_score as number | undefined,
    fitAssessment: record.fit_assessment as string | undefined,
    howToTakeFurther: record.how_to_take_further as string | undefined,

    // Profile Rewrite - Headlines
    recommendedHeadline: record.recommended_headline as string | undefined,
    headlineOutcomeBased: record.headline_outcome_based as string | undefined,
    headlineAuthorityBased: record.headline_authority_based as string | undefined,
    headlineHybrid: record.headline_hybrid as string | undefined,
    headlineRecommendation: record.headline_recommendation as string | undefined,
    headlineRecommendationReason: record.headline_recommendation_reason as string | undefined,

    // Profile Rewrite - Bio
    recommendedBio: record.recommended_bio as string | undefined,
    profileAnalysis: record.profile_analysis as string | undefined,
    profileRewrite: record.profile_rewrite as string | undefined,
    voiceStyleGuide: record.voice_style_guide as string | undefined,
    improvementSuggestions: record.improvement_suggestions as string[] | undefined,

    // Lead Magnets - Cards (JSONB)
    lmCard1: record.lm_card_1 as LeadMagnetCard | undefined,
    lmCard2: record.lm_card_2 as LeadMagnetCard | undefined,
    lmCard3: record.lm_card_3 as LeadMagnetCard | undefined,

    // Lead Magnets - Individual Fields
    lm1ContentType: record.lm_1_content_type as string | undefined,
    lm1Headline: record.lm_1_headline as string | undefined,
    lm1Subheadline: record.lm_1_subheadline as string | undefined,
    lm1Match: record.lm_1_match as string | undefined,
    lm1EstHours: record.lm_1_est_hours as string | undefined,
    lm2ContentType: record.lm_2_content_type as string | undefined,
    lm2Headline: record.lm_2_headline as string | undefined,
    lm2Subheadline: record.lm_2_subheadline as string | undefined,
    lm2Match: record.lm_2_match as string | undefined,
    lm2EstHours: record.lm_2_est_hours as string | undefined,
    lm3ContentType: record.lm_3_content_type as string | undefined,
    lm3Headline: record.lm_3_headline as string | undefined,
    lm3Subheadline: record.lm_3_subheadline as string | undefined,
    lm3Match: record.lm_3_match as string | undefined,
    lm3EstHours: record.lm_3_est_hours as string | undefined,

    // Lead Magnets - Descriptions & Posts
    leadMag1: record.lead_mag_1 as string | undefined,
    leadMag2: record.lead_mag_2 as string | undefined,
    leadMag3: record.lead_mag_3 as string | undefined,
    lmPost1: record.lm_post_1 as string | undefined,
    lmPost2: record.lm_post_2 as string | undefined,
    lmPost3: record.lm_post_3 as string | undefined,

    // Featured Section Recommendations
    featuredSlot1: record.featured_slot_1 as string | undefined,
    featuredSlot2: record.featured_slot_2 as string | undefined,
    featuredSlot3: record.featured_slot_3 as string | undefined,

    // Action Plans
    nextSteps30Day: record.next_steps_30_day as string | undefined,
    nextSteps90Day: record.next_steps_90_day as string | undefined,

    // Report & Status
    formattedReport: record.formatted_report as string | undefined,
    status: record.status as ProspectStatus | undefined,
    processingStep: record.processing_step as Prospect['processingStep'],
    analysisStatus: record.analysis_status as Prospect['analysisStatus'],
    analysisDate: record.analysis_date ? new Date(record.analysis_date as string) : undefined,
    errorLog: record.error_log as string | undefined,
    emailSentAt: record.email_sent_at ? new Date(record.email_sent_at as string) : undefined,
    sendEmail: record.send_email as boolean | undefined,

    // Blueprint-specific fields
    slug: record.slug as string | undefined,
    offerUnlocked: record.offer_unlocked as boolean | undefined,
    recommendedOffer: record.recommended_offer as RecommendedOffer | undefined,
    offerNote: record.offer_note as string | undefined,

    // Timestamps
    createdAt: new Date(record.created_at as string),
    updatedAt: record.updated_at ? new Date(record.updated_at as string) : undefined,
  };
}

function mapProspectPost(record: Record<string, unknown>): ProspectPost {
  return {
    id: record.id as string,
    prospectId: record.prospect_id as string,
    templateId: record.template_id as string | undefined,
    name: record.name as string | undefined,
    postContent: record.post_content as string | undefined,
    firstSentence: record.first_sentence as string | undefined,
    postReady: record.post_ready as boolean | undefined,
    toFix: record.to_fix as boolean | undefined,
    actionItems: record.action_items as string | undefined,
    number: record.number as number | undefined,
    createdAt: new Date(record.created_at as string),
  };
}

function mapBlueprintSettings(record: Record<string, unknown>): BlueprintSettings {
  return {
    id: record.id as string,
    stickyCTAEnabled: (record.sticky_cta_enabled as boolean) ?? true,
    foundationsPaymentUrl: (record.foundations_payment_url as string) || '',
    engineeringPaymentUrl: (record.engineering_payment_url as string) || '',
    calBookingLink: (record.cal_booking_link as string) || '',
    showBootcampOffer: (record.show_bootcamp_offer as boolean) ?? true,
    showGcOffer: (record.show_gc_offer as boolean) ?? true,
    showDfyOffer: (record.show_dfy_offer as boolean) ?? true,
    bootcampOfferTitle: (record.bootcamp_offer_title as string) || '',
    bootcampOfferDescription: (record.bootcamp_offer_description as string) || '',
    bootcampOfferCta: (record.bootcamp_offer_cta as string) || '',
    bootcampOfferUrl: (record.bootcamp_offer_url as string) || '',
    gcOfferTitle: (record.gc_offer_title as string) || '',
    gcOfferDescription: (record.gc_offer_description as string) || '',
    gcOfferCta: (record.gc_offer_cta as string) || '',
    gcOfferUrl: (record.gc_offer_url as string) || '',
    dfyOfferTitle: (record.dfy_offer_title as string) || '',
    dfyOfferDescription: (record.dfy_offer_description as string) || '',
    dfyOfferCta: (record.dfy_offer_cta as string) || '',
    dfyOfferUrl: (record.dfy_offer_url as string) || '',
    defaultOfferUnlocked: (record.default_offer_unlocked as boolean) ?? false,
    nextCohortDateFoundations: record.next_cohort_date_foundations as string | undefined,
    nextCohortDateEngineering: record.next_cohort_date_engineering as string | undefined,
    spotsRemainingFoundations: record.spots_remaining_foundations as number | undefined,
    spotsRemainingEngineering: record.spots_remaining_engineering as number | undefined,
    blueprintVideoUrl: record.blueprint_video_url as string | undefined,
    senjaWidgetUrl: record.senja_widget_url as string | undefined,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

function mapBlueprintContentBlock(record: Record<string, unknown>): BlueprintContentBlock {
  return {
    id: record.id as string,
    blockType: record.block_type as BlueprintContentBlockType,
    title: record.title as string | undefined,
    content: record.content as string | undefined,
    imageUrl: record.image_url as string | undefined,
    ctaText: record.cta_text as string | undefined,
    ctaUrl: record.cta_url as string | undefined,
    sortOrder: (record.sort_order as number) || 0,
    isVisible: (record.is_visible as boolean) !== false,
    targetOffer: record.target_offer as RecommendedOffer | undefined,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

// ============================================
// Prospect Functions
// ============================================

/**
 * Fetch a prospect by their unique slug
 * Returns null if not found (handles 404)
 */
export async function getProspectBySlug(slug: string): Promise<Prospect | null> {
  try {
    const { data, error } = await supabase.from('prospects').select('*').eq('slug', slug).single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Row not found - this is expected for 404 scenarios
        console.log('Prospect not found for slug:', slug);
        return null;
      }
      console.error('Error fetching prospect by slug:', error);
      return null;
    }

    if (!data) return null;
    return mapProspect(data);
  } catch (error) {
    console.error('Failed to fetch prospect by slug:', error);
    return null;
  }
}

/**
 * Fetch a prospect by ID
 */
export async function getProspectById(id: string): Promise<Prospect | null> {
  try {
    const { data, error } = await supabase.from('prospects').select('*').eq('id', id).single();

    if (error || !data) {
      console.error('Error fetching prospect by id:', error);
      return null;
    }

    return mapProspect(data);
  } catch (error) {
    console.error('Failed to fetch prospect by id:', error);
    return null;
  }
}

/**
 * List prospects with optional filters (for admin)
 */
export async function listProspects(filters?: ProspectFilters): Promise<Prospect[]> {
  try {
    let query = supabase.from('prospects').select('*').order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.hasSlug !== undefined) {
      if (filters.hasSlug) {
        query = query.not('slug', 'is', null);
      } else {
        query = query.is('slug', null);
      }
    }

    if (filters?.offerUnlocked !== undefined) {
      query = query.eq('offer_unlocked', filters.offerUnlocked);
    }

    if (filters?.recommendedOffer) {
      query = query.eq('recommended_offer', filters.recommendedOffer);
    }

    if (filters?.search) {
      // Search across multiple fields using ilike
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
      );
    }

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing prospects:', error);
      throw new Error(error.message);
    }

    return (data || []).map(mapProspect);
  } catch (error) {
    console.error('Failed to list prospects:', error);
    throw error;
  }
}

/**
 * Update prospect offer settings (unlocked status, recommended offer, note)
 */
export async function updateProspectOffer(
  id: string,
  updates: {
    unlocked?: boolean;
    recommended?: RecommendedOffer;
    note?: string;
  }
): Promise<Prospect> {
  const updateData: Record<string, unknown> = {};

  if (updates.unlocked !== undefined) {
    updateData.offer_unlocked = updates.unlocked;
  }
  if (updates.recommended !== undefined) {
    updateData.recommended_offer = updates.recommended;
  }
  if (updates.note !== undefined) {
    updateData.offer_note = updates.note;
  }

  const { data, error } = await supabase
    .from('prospects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating prospect offer:', error);
    throw new Error(error.message);
  }

  return mapProspect(data);
}

/**
 * Update prospect slug
 */
export async function updateProspectSlug(id: string, slug: string): Promise<Prospect> {
  const { data, error } = await supabase
    .from('prospects')
    .update({ slug })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating prospect slug:', error);
    throw new Error(error.message);
  }

  return mapProspect(data);
}

// ============================================
// Landing Page Prospect Creation
// ============================================

/**
 * Create a new prospect from the landing page opt-in form
 * Returns the generated slug for redirect to thank-you page
 */
export async function createProspectFromLanding(data: {
  linkedinUrl: string;
  email: string;
  businessType: string;
}): Promise<{ slug: string }> {
  // Normalize LinkedIn URL
  let normalizedUrl = data.linkedinUrl.trim().toLowerCase();
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }
  // Remove trailing slashes
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');

  // Extract name from LinkedIn URL for slug (e.g., "john-doe" from ".../in/john-doe")
  const urlMatch = normalizedUrl.match(/\/in\/([^/?]+)/);
  const nameFromUrl = urlMatch ? urlMatch[1].replace(/-/g, ' ') : 'prospect';

  const slug = generateSlug(nameFromUrl);

  const insertData: Record<string, unknown> = {
    linkedin_url: normalizedUrl,
    normalized_linkedin_url: normalizedUrl,
    email: data.email.trim(),
    business_type: data.businessType,
    slug,
    status: 'pending_scrape',
    full_name: nameFromUrl
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  };

  const { error } = await supabase.from('prospects').insert(insertData);

  if (error) {
    console.error('Error creating prospect from landing:', error);
    throw new Error(error.message);
  }

  return { slug };
}

// ============================================
// Prospect Posts Functions
// ============================================

/**
 * Fetch all posts for a prospect
 */
export async function getProspectPosts(prospectId: string): Promise<ProspectPost[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('number', { ascending: true });

    if (error) {
      console.error('Error fetching prospect posts:', error);
      return [];
    }

    return (data || []).map(mapProspectPost);
  } catch (error) {
    console.error('Failed to fetch prospect posts:', error);
    return [];
  }
}

// ============================================
// Prospect Count Function
// ============================================

/**
 * Get total number of prospects (scorecards delivered)
 */
export async function getProspectCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching prospect count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('Failed to fetch prospect count:', error);
    return 0;
  }
}

// ============================================
// Blueprint Settings Functions
// ============================================

/**
 * Fetch global blueprint settings
 * Returns the first (and should be only) settings row
 */
export async function getBlueprintSettings(): Promise<BlueprintSettings | null> {
  try {
    const { data, error } = await supabase.from('blueprint_settings').select('*').limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found - return null
        console.log('No blueprint settings found');
        return null;
      }
      console.error('Error fetching blueprint settings:', error);
      return null;
    }

    if (!data) return null;
    return mapBlueprintSettings(data);
  } catch (error) {
    console.error('Failed to fetch blueprint settings:', error);
    return null;
  }
}

/**
 * Update blueprint settings
 */
export async function updateBlueprintSettings(
  settings: Partial<{
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
    nextCohortDateFoundations: string;
    nextCohortDateEngineering: string;
    spotsRemainingFoundations: number;
    spotsRemainingEngineering: number;
    blueprintVideoUrl: string;
    senjaWidgetUrl: string;
  }>
): Promise<BlueprintSettings> {
  const updateData: Record<string, unknown> = {};

  if (settings.stickyCTAEnabled !== undefined) {
    updateData.sticky_cta_enabled = settings.stickyCTAEnabled;
  }
  if (settings.foundationsPaymentUrl !== undefined) {
    updateData.foundations_payment_url = settings.foundationsPaymentUrl;
  }
  if (settings.engineeringPaymentUrl !== undefined) {
    updateData.engineering_payment_url = settings.engineeringPaymentUrl;
  }
  if (settings.calBookingLink !== undefined) {
    updateData.cal_booking_link = settings.calBookingLink;
  }
  if (settings.showBootcampOffer !== undefined) {
    updateData.show_bootcamp_offer = settings.showBootcampOffer;
  }
  if (settings.showGcOffer !== undefined) {
    updateData.show_gc_offer = settings.showGcOffer;
  }
  if (settings.showDfyOffer !== undefined) {
    updateData.show_dfy_offer = settings.showDfyOffer;
  }
  if (settings.bootcampOfferTitle !== undefined) {
    updateData.bootcamp_offer_title = settings.bootcampOfferTitle;
  }
  if (settings.bootcampOfferDescription !== undefined) {
    updateData.bootcamp_offer_description = settings.bootcampOfferDescription;
  }
  if (settings.bootcampOfferCta !== undefined) {
    updateData.bootcamp_offer_cta = settings.bootcampOfferCta;
  }
  if (settings.bootcampOfferUrl !== undefined) {
    updateData.bootcamp_offer_url = settings.bootcampOfferUrl;
  }
  if (settings.gcOfferTitle !== undefined) {
    updateData.gc_offer_title = settings.gcOfferTitle;
  }
  if (settings.gcOfferDescription !== undefined) {
    updateData.gc_offer_description = settings.gcOfferDescription;
  }
  if (settings.gcOfferCta !== undefined) {
    updateData.gc_offer_cta = settings.gcOfferCta;
  }
  if (settings.gcOfferUrl !== undefined) {
    updateData.gc_offer_url = settings.gcOfferUrl;
  }
  if (settings.dfyOfferTitle !== undefined) {
    updateData.dfy_offer_title = settings.dfyOfferTitle;
  }
  if (settings.dfyOfferDescription !== undefined) {
    updateData.dfy_offer_description = settings.dfyOfferDescription;
  }
  if (settings.dfyOfferCta !== undefined) {
    updateData.dfy_offer_cta = settings.dfyOfferCta;
  }
  if (settings.dfyOfferUrl !== undefined) {
    updateData.dfy_offer_url = settings.dfyOfferUrl;
  }
  if (settings.defaultOfferUnlocked !== undefined) {
    updateData.default_offer_unlocked = settings.defaultOfferUnlocked;
  }
  if (settings.nextCohortDateFoundations !== undefined) {
    updateData.next_cohort_date_foundations = settings.nextCohortDateFoundations;
  }
  if (settings.nextCohortDateEngineering !== undefined) {
    updateData.next_cohort_date_engineering = settings.nextCohortDateEngineering;
  }
  if (settings.spotsRemainingFoundations !== undefined) {
    updateData.spots_remaining_foundations = settings.spotsRemainingFoundations;
  }
  if (settings.spotsRemainingEngineering !== undefined) {
    updateData.spots_remaining_engineering = settings.spotsRemainingEngineering;
  }
  if (settings.blueprintVideoUrl !== undefined) {
    updateData.blueprint_video_url = settings.blueprintVideoUrl;
  }
  if (settings.senjaWidgetUrl !== undefined) {
    updateData.senja_widget_url = settings.senjaWidgetUrl;
  }

  // Update the first settings row (upsert pattern)
  const { data: existing } = await supabase
    .from('blueprint_settings')
    .select('id')
    .limit(1)
    .single();

  let data;
  let error;

  if (existing?.id) {
    // Update existing
    const result = await supabase
      .from('blueprint_settings')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    // Insert new
    const result = await supabase.from('blueprint_settings').insert(updateData).select().single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error('Error updating blueprint settings:', error);
    throw new Error(error.message);
  }

  return mapBlueprintSettings(data);
}

// ============================================
// Content Block Functions
// ============================================

/**
 * Fetch a single content block by key (block_type)
 */
export async function getContentBlock(
  key: BlueprintContentBlockType
): Promise<BlueprintContentBlock | null> {
  try {
    const { data, error } = await supabase
      .from('blueprint_content_blocks')
      .select('*')
      .eq('block_type', key)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching content block:', error);
      return null;
    }

    if (!data) return null;
    return mapBlueprintContentBlock(data);
  } catch (error) {
    console.error('Failed to fetch content block:', error);
    return null;
  }
}

/**
 * Fetch all visible content blocks
 */
export async function getAllContentBlocks(): Promise<BlueprintContentBlock[]> {
  try {
    const { data, error } = await supabase
      .from('blueprint_content_blocks')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching content blocks:', error);
      return [];
    }

    return (data || []).map(mapBlueprintContentBlock);
  } catch (error) {
    console.error('Failed to fetch content blocks:', error);
    return [];
  }
}

/**
 * Fetch all content blocks (including hidden) for admin
 */
export async function getAllContentBlocksAdmin(): Promise<BlueprintContentBlock[]> {
  try {
    const { data, error } = await supabase
      .from('blueprint_content_blocks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching content blocks:', error);
      throw new Error(error.message);
    }

    return (data || []).map(mapBlueprintContentBlock);
  } catch (error) {
    console.error('Failed to fetch content blocks:', error);
    throw error;
  }
}

/**
 * Update a content block by ID
 */
export async function updateContentBlock(
  id: string,
  content: Partial<{
    blockType: BlueprintContentBlockType;
    title: string;
    content: string;
    imageUrl: string;
    ctaText: string;
    ctaUrl: string;
    sortOrder: number;
    isVisible: boolean;
    targetOffer: RecommendedOffer;
  }>
): Promise<BlueprintContentBlock> {
  const updateData: Record<string, unknown> = {};

  if (content.blockType !== undefined) {
    updateData.block_type = content.blockType;
  }
  if (content.title !== undefined) {
    updateData.title = content.title;
  }
  if (content.content !== undefined) {
    updateData.content = content.content;
  }
  if (content.imageUrl !== undefined) {
    updateData.image_url = content.imageUrl;
  }
  if (content.ctaText !== undefined) {
    updateData.cta_text = content.ctaText;
  }
  if (content.ctaUrl !== undefined) {
    updateData.cta_url = content.ctaUrl;
  }
  if (content.sortOrder !== undefined) {
    updateData.sort_order = content.sortOrder;
  }
  if (content.isVisible !== undefined) {
    updateData.is_visible = content.isVisible;
  }
  if (content.targetOffer !== undefined) {
    updateData.target_offer = content.targetOffer;
  }

  const { data, error } = await supabase
    .from('blueprint_content_blocks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating content block:', error);
    throw new Error(error.message);
  }

  return mapBlueprintContentBlock(data);
}

/**
 * Create a new content block
 */
export async function createContentBlock(block: {
  blockType: BlueprintContentBlockType;
  title?: string;
  content?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  sortOrder?: number;
  isVisible?: boolean;
  targetOffer?: RecommendedOffer;
}): Promise<BlueprintContentBlock> {
  const insertData: Record<string, unknown> = {
    block_type: block.blockType,
    title: block.title,
    content: block.content,
    image_url: block.imageUrl,
    cta_text: block.ctaText,
    cta_url: block.ctaUrl,
    sort_order: block.sortOrder ?? 0,
    is_visible: block.isVisible ?? true,
    target_offer: block.targetOffer,
  };

  const { data, error } = await supabase
    .from('blueprint_content_blocks')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating content block:', error);
    throw new Error(error.message);
  }

  return mapBlueprintContentBlock(data);
}

/**
 * Delete a content block
 */
export async function deleteContentBlock(id: string): Promise<void> {
  const { error } = await supabase.from('blueprint_content_blocks').delete().eq('id', id);

  if (error) {
    console.error('Error deleting content block:', error);
    throw new Error(error.message);
  }
}

// ============================================
// Client Logos Functions
// ============================================

export interface ClientLogo {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
}

function mapClientLogo(record: Record<string, unknown>): ClientLogo {
  return {
    id: record.id as string,
    name: record.name as string,
    imageUrl: record.image_url as string,
    sortOrder: record.sort_order as number,
    isVisible: record.is_visible as boolean,
    createdAt: record.created_at as string,
  };
}

/**
 * Fetch all visible client logos ordered by sort_order
 */
export async function getClientLogos(): Promise<ClientLogo[]> {
  try {
    const { data, error } = await supabase
      .from('client_logos')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching client logos:', error);
      return [];
    }

    return (data || []).map(mapClientLogo);
  } catch (error) {
    console.error('Failed to fetch client logos:', error);
    return [];
  }
}

/**
 * Fetch all client logos (including hidden) for admin
 */
export async function getAllClientLogos(): Promise<ClientLogo[]> {
  try {
    const { data, error } = await supabase
      .from('client_logos')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching all client logos:', error);
      return [];
    }

    return (data || []).map(mapClientLogo);
  } catch (error) {
    console.error('Failed to fetch all client logos:', error);
    return [];
  }
}

/**
 * Create a new client logo
 */
export async function createClientLogo(logo: {
  name: string;
  imageUrl: string;
  sortOrder?: number;
}): Promise<ClientLogo> {
  const { data, error } = await supabase
    .from('client_logos')
    .insert({
      name: logo.name,
      image_url: logo.imageUrl,
      sort_order: logo.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client logo:', error);
    throw new Error(error.message);
  }

  return mapClientLogo(data);
}

/**
 * Update a client logo
 */
export async function updateClientLogo(
  id: string,
  updates: Partial<{ name: string; imageUrl: string; sortOrder: number; isVisible: boolean }>
): Promise<ClientLogo> {
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible;

  const { data, error } = await supabase
    .from('client_logos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client logo:', error);
    throw new Error(error.message);
  }

  return mapClientLogo(data);
}

/**
 * Delete a client logo
 */
export async function deleteClientLogo(id: string): Promise<void> {
  const { error } = await supabase.from('client_logos').delete().eq('id', id);

  if (error) {
    console.error('Error deleting client logo:', error);
    throw new Error(error.message);
  }
}

// ============================================
// Composite Functions
// ============================================

/**
 * Fetch all data needed for a blueprint page
 */
export async function getBlueprintPageData(slug: string): Promise<{
  prospect: Prospect;
  posts: ProspectPost[];
  settings: BlueprintSettings | null;
  contentBlocks: BlueprintContentBlock[];
} | null> {
  const prospect = await getProspectBySlug(slug);
  if (!prospect) return null;

  const [posts, settings, contentBlocks] = await Promise.all([
    getProspectPosts(prospect.id),
    getBlueprintSettings(),
    getAllContentBlocks(),
  ]);

  return {
    prospect,
    posts,
    settings,
    contentBlocks,
  };
}
