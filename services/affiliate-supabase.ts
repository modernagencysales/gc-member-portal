/**
 * Affiliate Program Supabase Service
 * Handles all database operations for the Affiliate Program
 */

import { supabase } from '../lib/supabaseClient';
import {
  Affiliate,
  Referral,
  AffiliatePayout,
  AffiliateAsset,
  AffiliateApplicationData,
  AffiliateStats,
  AffiliateAdminStats,
  AffiliateStatus,
  ReferralStatus,
  PayoutStatus,
  AssetType,
} from '../types/affiliate-types';

// ============================================
// Mappers
// ============================================

function mapAffiliate(record: Record<string, unknown>): Affiliate {
  return {
    id: record.id as string,
    email: record.email as string,
    name: record.name as string,
    company: record.company as string | null,
    slug: record.slug as string,
    code: record.code as string,
    status: (record.status as AffiliateStatus) || 'pending',
    commissionAmount: (record.commission_amount as number) || 0,
    stripeConnectAccountId: record.stripe_connect_account_id as string | null,
    stripeConnectOnboarded: (record.stripe_connect_onboarded as boolean) || false,
    bootcampStudentId: record.bootcamp_student_id as string | null,
    photoUrl: record.photo_url as string | null,
    bio: record.bio as string | null,
    applicationNote: record.application_note as string | null,
    createdAt: new Date(record.created_at as string),
    updatedAt: new Date(record.updated_at as string),
  };
}

function mapReferral(record: Record<string, unknown>): Referral {
  return {
    id: record.id as string,
    affiliateId: record.affiliate_id as string,
    referredEmail: record.referred_email as string | null,
    referredName: record.referred_name as string | null,
    bootcampStudentId: record.bootcamp_student_id as string | null,
    totalPrice: (record.total_price as number) || 0,
    amountPaid: (record.amount_paid as number) || 0,
    status: (record.status as ReferralStatus) || 'clicked',
    attributedAt: new Date(record.attributed_at as string),
    enrolledAt: record.enrolled_at ? new Date(record.enrolled_at as string) : null,
    paidInFullAt: record.paid_in_full_at ? new Date(record.paid_in_full_at as string) : null,
    commissionPaidAt: record.commission_paid_at
      ? new Date(record.commission_paid_at as string)
      : null,
    createdAt: new Date(record.created_at as string),
  };
}

function mapPayout(record: Record<string, unknown>): AffiliatePayout {
  return {
    id: record.id as string,
    affiliateId: record.affiliate_id as string,
    referralId: record.referral_id as string,
    amount: (record.amount as number) || 0,
    stripeTransferId: record.stripe_transfer_id as string | null,
    status: (record.status as PayoutStatus) || 'pending',
    createdAt: new Date(record.created_at as string),
    paidAt: record.paid_at ? new Date(record.paid_at as string) : null,
  };
}

function mapAsset(record: Record<string, unknown>): AffiliateAsset {
  return {
    id: record.id as string,
    title: record.title as string,
    description: record.description as string | null,
    assetType: (record.asset_type as AssetType) || 'swipe_copy',
    contentText: record.content_text as string | null,
    fileUrl: record.file_url as string | null,
    sortOrder: (record.sort_order as number) || 0,
    isVisible: (record.is_visible as boolean) !== false,
    createdAt: new Date(record.created_at as string),
  };
}

// ============================================
// Public / Affiliate-Facing
// ============================================

export async function fetchAffiliateBySlug(slug: string): Promise<Affiliate | null> {
  try {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      console.log('Affiliate not found by slug:', slug);
      return null;
    }

    return mapAffiliate(data);
  } catch (error) {
    console.error('Failed to fetch affiliate by slug:', error);
    return null;
  }
}

export async function fetchAffiliateByCode(code: string): Promise<Affiliate | null> {
  try {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('code', code)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      console.log('Affiliate not found by code:', code);
      return null;
    }

    return mapAffiliate(data);
  } catch (error) {
    console.error('Failed to fetch affiliate by code:', error);
    return null;
  }
}

export async function fetchAffiliateByEmail(email: string): Promise<Affiliate | null> {
  try {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .ilike('email', email)
      .single();

    if (error || !data) {
      console.log('Affiliate not found by email:', email);
      return null;
    }

    return mapAffiliate(data);
  } catch (error) {
    console.error('Failed to fetch affiliate by email:', error);
    return null;
  }
}

export async function submitAffiliateApplication(
  data: AffiliateApplicationData
): Promise<Affiliate> {
  // Generate slug and code from name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const code = data.name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);

  const insertData = {
    name: data.name,
    email: data.email,
    company: data.company || null,
    bio: data.bio || null,
    application_note: data.applicationNote || null,
    bootcamp_student_id: data.bootcampStudentId || null,
    slug,
    code,
    status: 'pending',
    commission_amount: 0,
  };

  const { data: result, error } = await supabase
    .from('affiliates')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAffiliate(result);
}

// ============================================
// Affiliate Dashboard
// ============================================

export async function fetchAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  try {
    // Fetch referrals for this affiliate
    const { data: referrals, error: refError } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .eq('affiliate_id', affiliateId);

    if (refError) {
      console.error('Failed to fetch referral stats:', refError);
      return { totalReferrals: 0, activeReferrals: 0, totalEarned: 0, pendingPayouts: 0 };
    }

    // Fetch payouts for this affiliate
    const { data: payouts, error: payError } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', affiliateId);

    if (payError) {
      console.error('Failed to fetch payout stats:', payError);
    }

    const allReferrals = referrals || [];
    const allPayouts = payouts || [];

    const totalReferrals = allReferrals.length;
    const activeReferrals = allReferrals.filter(
      (r) => r.status === 'enrolled' || r.status === 'paying' || r.status === 'paid_in_full'
    ).length;
    const totalEarned = allPayouts
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);
    const pendingPayouts = allPayouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);

    return { totalReferrals, activeReferrals, totalEarned, pendingPayouts };
  } catch (error) {
    console.error('Failed to compute affiliate stats:', error);
    return { totalReferrals: 0, activeReferrals: 0, totalEarned: 0, pendingPayouts: 0 };
  }
}

export async function fetchAffiliateReferrals(affiliateId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('affiliate_referrals')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapReferral);
}

export async function fetchAffiliatePayouts(affiliateId: string): Promise<AffiliatePayout[]> {
  const { data, error } = await supabase
    .from('affiliate_payouts')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapPayout);
}

// ============================================
// Admin
// ============================================

export async function fetchAllAffiliates(): Promise<Affiliate[]> {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAffiliate);
}

export async function updateAffiliateStatus(
  id: string,
  status: AffiliateStatus
): Promise<Affiliate> {
  const { data, error } = await supabase
    .from('affiliates')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAffiliate(data);
}

export async function updateAffiliate(id: string, updates: Partial<Affiliate>): Promise<Affiliate> {
  const updateData: Record<string, unknown> = {};

  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.company !== undefined) updateData.company = updates.company;
  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.code !== undefined) updateData.code = updates.code;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.commissionAmount !== undefined)
    updateData.commission_amount = updates.commissionAmount;
  if (updates.stripeConnectAccountId !== undefined)
    updateData.stripe_connect_account_id = updates.stripeConnectAccountId;
  if (updates.stripeConnectOnboarded !== undefined)
    updateData.stripe_connect_onboarded = updates.stripeConnectOnboarded;
  if (updates.bootcampStudentId !== undefined)
    updateData.bootcamp_student_id = updates.bootcampStudentId;
  if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
  if (updates.bio !== undefined) updateData.bio = updates.bio;
  if (updates.applicationNote !== undefined) updateData.application_note = updates.applicationNote;

  const { data, error } = await supabase
    .from('affiliates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAffiliate(data);
}

export async function fetchAdminAffiliateStats(): Promise<AffiliateAdminStats> {
  try {
    // Fetch all affiliates
    const { data: affiliates, error: affError } = await supabase
      .from('affiliates')
      .select('status');

    if (affError) {
      console.error('Failed to fetch affiliate stats:', affError);
      return {
        totalAffiliates: 0,
        activeAffiliates: 0,
        pendingApplications: 0,
        totalReferrals: 0,
        totalCommissionsPaid: 0,
        pendingPayouts: 0,
      };
    }

    const allAffiliates = affiliates || [];
    const totalAffiliates = allAffiliates.length;
    const activeAffiliates = allAffiliates.filter((a) => a.status === 'active').length;
    const pendingApplications = allAffiliates.filter((a) => a.status === 'pending').length;

    // Fetch all referrals
    const { data: referrals, error: refError } = await supabase
      .from('affiliate_referrals')
      .select('id');

    if (refError) {
      console.error('Failed to fetch referral count:', refError);
    }

    const totalReferrals = (referrals || []).length;

    // Fetch all payouts
    const { data: payouts, error: payError } = await supabase
      .from('affiliate_payouts')
      .select('amount, status');

    if (payError) {
      console.error('Failed to fetch payout stats:', payError);
    }

    const allPayouts = payouts || [];
    const totalCommissionsPaid = allPayouts
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);
    const pendingPayouts = allPayouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);

    return {
      totalAffiliates,
      activeAffiliates,
      pendingApplications,
      totalReferrals,
      totalCommissionsPaid,
      pendingPayouts,
    };
  } catch (error) {
    console.error('Failed to compute admin affiliate stats:', error);
    return {
      totalAffiliates: 0,
      activeAffiliates: 0,
      pendingApplications: 0,
      totalReferrals: 0,
      totalCommissionsPaid: 0,
      pendingPayouts: 0,
    };
  }
}

// ============================================
// Attribution
// ============================================

export async function createReferralClick(affiliateId: string, email?: string): Promise<Referral> {
  // First-touch attribution: check if a referral already exists for this email + affiliate
  if (email) {
    const { data: existing } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .ilike('referred_email', email)
      .maybeSingle();

    if (existing) {
      return mapReferral(existing);
    }
  }

  const insertData: Record<string, unknown> = {
    affiliate_id: affiliateId,
    status: 'clicked',
    attributed_at: new Date().toISOString(),
  };

  if (email) {
    insertData.referred_email = email;
  }

  const { data, error } = await supabase
    .from('affiliate_referrals')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapReferral(data);
}

export async function attributeReferralToStudent(
  email: string,
  studentId: string,
  totalPrice: number
): Promise<Referral | null> {
  try {
    // Find the most recent clicked referral for this email
    const { data: existing, error: findError } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .ilike('referred_email', email)
      .eq('status', 'clicked')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError || !existing) {
      console.log('No pending referral found for email:', email);
      return null;
    }

    // Update the referral with student info
    const { data, error } = await supabase
      .from('affiliate_referrals')
      .update({
        bootcamp_student_id: studentId,
        total_price: totalPrice,
        status: 'enrolled',
        enrolled_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapReferral(data);
  } catch (error) {
    console.error('Failed to attribute referral to student:', error);
    return null;
  }
}

// ============================================
// Assets
// ============================================

export async function fetchAffiliateAssets(): Promise<AffiliateAsset[]> {
  const { data, error } = await supabase
    .from('affiliate_assets')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAsset);
}

export async function fetchAllAffiliateAssets(): Promise<AffiliateAsset[]> {
  const { data, error } = await supabase
    .from('affiliate_assets')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAsset);
}

export async function createAffiliateAsset(
  asset: Partial<AffiliateAsset>
): Promise<AffiliateAsset> {
  const insertData = {
    title: asset.title,
    description: asset.description || null,
    asset_type: asset.assetType || 'swipe_copy',
    content_text: asset.contentText || null,
    file_url: asset.fileUrl || null,
    sort_order: asset.sortOrder || 0,
    is_visible: asset.isVisible !== false,
  };

  const { data, error } = await supabase
    .from('affiliate_assets')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAsset(data);
}

export async function updateAffiliateAsset(
  id: string,
  updates: Partial<AffiliateAsset>
): Promise<AffiliateAsset> {
  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.assetType !== undefined) updateData.asset_type = updates.assetType;
  if (updates.contentText !== undefined) updateData.content_text = updates.contentText;
  if (updates.fileUrl !== undefined) updateData.file_url = updates.fileUrl;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible;

  const { data, error } = await supabase
    .from('affiliate_assets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAsset(data);
}

export async function deleteAffiliateAsset(id: string): Promise<void> {
  const { error } = await supabase.from('affiliate_assets').delete().eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================
// Admin Lists
// ============================================

export async function fetchAllReferrals(): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('affiliate_referrals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapReferral);
}

export async function fetchAllPayouts(): Promise<AffiliatePayout[]> {
  const { data, error } = await supabase
    .from('affiliate_payouts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapPayout);
}
