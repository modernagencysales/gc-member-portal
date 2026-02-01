# Affiliate Program Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an affiliate/referral program where partners earn $500 (configurable) when someone they refer pays for the Bootcamp in full, with Stripe Connect automated payouts.

**Architecture:** New `affiliate` product area alongside existing `bootcamp` and `gc` areas. Service layer (`services/affiliate-supabase.ts`) for all DB ops. Supabase Edge Functions for Stripe Connect. React components following existing design system (zinc palette, violet accents, Lucide icons). Cookie-based + code-based attribution.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Supabase, Stripe Connect Express, Lucide React, TanStack Query, React Router v6.

**Design doc:** `docs/plans/2026-02-01-affiliate-program-design.md`

---

## Task 1: Database Migration — Affiliate Tables

**Files:**
- Create: `supabase/migrations/20260201000000_affiliate_tables.sql`

**Step 1: Write the migration**

```sql
-- Affiliate Program Tables
-- Supports referral tracking, commission payouts via Stripe Connect

-- ============================================
-- Affiliates
-- ============================================
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  slug TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'active', 'rejected', 'suspended')),
  commission_amount INTEGER NOT NULL DEFAULT 500,
  stripe_connect_account_id TEXT,
  stripe_connect_onboarded BOOLEAN NOT NULL DEFAULT false,
  bootcamp_student_id UUID REFERENCES bootcamp_students(id),
  photo_url TEXT,
  bio TEXT,
  application_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate slug from name if not provided
CREATE OR REPLACE FUNCTION generate_affiliate_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM affiliates WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_affiliate_slug
  BEFORE INSERT ON affiliates
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION generate_affiliate_slug();

-- Auto-generate short referral code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM affiliates WHERE code = new_code);
  END LOOP;
  NEW.code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_affiliate_code
  BEFORE INSERT ON affiliates
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_affiliate_code();

-- Updated_at trigger
CREATE TRIGGER set_affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================
-- Referrals
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_name TEXT,
  bootcamp_student_id UUID REFERENCES bootcamp_students(id),
  total_price INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'clicked'
    CHECK (status IN ('clicked', 'enrolled', 'paying', 'paid_in_full', 'commission_paid')),
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enrolled_at TIMESTAMPTZ,
  paid_in_full_at TIMESTAMPTZ,
  commission_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_affiliate_id ON referrals(affiliate_id);
CREATE INDEX idx_referrals_referred_email ON referrals(referred_email);
CREATE INDEX idx_referrals_bootcamp_student_id ON referrals(bootcamp_student_id);

-- ============================================
-- Affiliate Payouts
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);

-- ============================================
-- Affiliate Assets (marketing materials)
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL
    CHECK (asset_type IN ('swipe_copy', 'image', 'video', 'document')),
  content_text TEXT,
  file_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_assets ENABLE ROW LEVEL SECURITY;

-- Public can read active affiliates (for landing pages)
CREATE POLICY "Public can read active affiliates"
  ON affiliates FOR SELECT
  USING (status = 'active');

-- Service role has full access (all operations go through service role via edge functions)
-- Anon key can read active affiliates and visible assets
CREATE POLICY "Anon can read visible assets"
  ON affiliate_assets FOR SELECT
  USING (is_visible = true);

-- Indexes for common queries
CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_affiliates_email ON affiliates(email);
CREATE INDEX idx_affiliates_code ON affiliates(code);
CREATE INDEX idx_affiliates_slug ON affiliates(slug);
```

**Step 2: Apply the migration**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx supabase db push`

Or if using the Supabase dashboard, paste the SQL into the SQL editor.

**Step 3: Commit**

```bash
git add supabase/migrations/20260201000000_affiliate_tables.sql
git commit -m "feat: add affiliate program database tables and RLS policies"
```

---

## Task 2: TypeScript Types — Affiliate Types

**Files:**
- Create: `types/affiliate-types.ts`

**Step 1: Create the types file**

```typescript
/**
 * Affiliate Program Types
 */

export type AffiliateStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';
export type ReferralStatus = 'clicked' | 'enrolled' | 'paying' | 'paid_in_full' | 'commission_paid';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';
export type AssetType = 'swipe_copy' | 'image' | 'video' | 'document';

export interface Affiliate {
  id: string;
  email: string;
  name: string;
  company: string | null;
  slug: string;
  code: string;
  status: AffiliateStatus;
  commissionAmount: number;
  stripeConnectAccountId: string | null;
  stripeConnectOnboarded: boolean;
  bootcampStudentId: string | null;
  photoUrl: string | null;
  bio: string | null;
  applicationNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  affiliateId: string;
  referredEmail: string | null;
  referredName: string | null;
  bootcampStudentId: string | null;
  totalPrice: number;
  amountPaid: number;
  status: ReferralStatus;
  attributedAt: Date;
  enrolledAt: Date | null;
  paidInFullAt: Date | null;
  commissionPaidAt: Date | null;
  createdAt: Date;
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  referralId: string;
  amount: number;
  stripeTransferId: string | null;
  status: PayoutStatus;
  createdAt: Date;
  paidAt: Date | null;
}

export interface AffiliateAsset {
  id: string;
  title: string;
  description: string | null;
  assetType: AssetType;
  contentText: string | null;
  fileUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
}

// Form data for affiliate application
export interface AffiliateApplicationData {
  name: string;
  email: string;
  company?: string;
  bio?: string;
  applicationNote?: string;
  bootcampStudentId?: string;
}

// Stats for affiliate dashboard
export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  pendingPayouts: number;
}

// Admin stats
export interface AffiliateAdminStats {
  totalAffiliates: number;
  activeAffiliates: number;
  pendingApplications: number;
  totalReferrals: number;
  totalCommissionsPaid: number;
  pendingPayouts: number;
}
```

**Step 2: Commit**

```bash
git add types/affiliate-types.ts
git commit -m "feat: add affiliate program TypeScript types"
```

---

## Task 3: Service Layer — Affiliate Supabase Service

**Files:**
- Create: `services/affiliate-supabase.ts`

Follow the exact pattern from `services/bootcamp-supabase.ts`:
- Import `supabase` from `../lib/supabaseClient`
- Import types from `../types/affiliate-types`
- Mapper functions to convert DB snake_case to TypeScript camelCase
- Async functions that return typed results

**Step 1: Create the service file**

```typescript
/**
 * Affiliate Program Supabase Service
 * Handles all database operations for the affiliate/referral program
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
} from '../types/affiliate-types';

// ============================================
// Mappers
// ============================================

function mapAffiliate(data: Record<string, unknown>): Affiliate {
  return {
    id: data.id as string,
    email: data.email as string,
    name: data.name as string,
    company: (data.company as string) || null,
    slug: data.slug as string,
    code: data.code as string,
    status: data.status as Affiliate['status'],
    commissionAmount: data.commission_amount as number,
    stripeConnectAccountId: (data.stripe_connect_account_id as string) || null,
    stripeConnectOnboarded: data.stripe_connect_onboarded as boolean,
    bootcampStudentId: (data.bootcamp_student_id as string) || null,
    photoUrl: (data.photo_url as string) || null,
    bio: (data.bio as string) || null,
    applicationNote: (data.application_note as string) || null,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

function mapReferral(data: Record<string, unknown>): Referral {
  return {
    id: data.id as string,
    affiliateId: data.affiliate_id as string,
    referredEmail: (data.referred_email as string) || null,
    referredName: (data.referred_name as string) || null,
    bootcampStudentId: (data.bootcamp_student_id as string) || null,
    totalPrice: data.total_price as number,
    amountPaid: data.amount_paid as number,
    status: data.status as Referral['status'],
    attributedAt: new Date(data.attributed_at as string),
    enrolledAt: data.enrolled_at ? new Date(data.enrolled_at as string) : null,
    paidInFullAt: data.paid_in_full_at ? new Date(data.paid_in_full_at as string) : null,
    commissionPaidAt: data.commission_paid_at ? new Date(data.commission_paid_at as string) : null,
    createdAt: new Date(data.created_at as string),
  };
}

function mapPayout(data: Record<string, unknown>): AffiliatePayout {
  return {
    id: data.id as string,
    affiliateId: data.affiliate_id as string,
    referralId: data.referral_id as string,
    amount: data.amount as number,
    stripeTransferId: (data.stripe_transfer_id as string) || null,
    status: data.status as AffiliatePayout['status'],
    createdAt: new Date(data.created_at as string),
    paidAt: data.paid_at ? new Date(data.paid_at as string) : null,
  };
}

function mapAsset(data: Record<string, unknown>): AffiliateAsset {
  return {
    id: data.id as string,
    title: data.title as string,
    description: (data.description as string) || null,
    assetType: data.asset_type as AffiliateAsset['assetType'],
    contentText: (data.content_text as string) || null,
    fileUrl: (data.file_url as string) || null,
    sortOrder: data.sort_order as number,
    isVisible: data.is_visible as boolean,
    createdAt: new Date(data.created_at as string),
  };
}

// ============================================
// Affiliates — Public / Affiliate-facing
// ============================================

export async function fetchAffiliateBySlug(slug: string): Promise<Affiliate | null> {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  return mapAffiliate(data);
}

export async function fetchAffiliateByCode(code: string): Promise<Affiliate | null> {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  return mapAffiliate(data);
}

export async function fetchAffiliateByEmail(email: string): Promise<Affiliate | null> {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  if (error || !data) return null;
  return mapAffiliate(data);
}

export async function submitAffiliateApplication(
  application: AffiliateApplicationData
): Promise<Affiliate> {
  const { data, error } = await supabase
    .from('affiliates')
    .insert({
      email: application.email,
      name: application.name,
      company: application.company || null,
      bio: application.bio || null,
      application_note: application.applicationNote || null,
      bootcamp_student_id: application.bootcampStudentId || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAffiliate(data);
}

// ============================================
// Affiliates — Affiliate Dashboard
// ============================================

export async function fetchAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const { data: referrals } = await supabase
    .from('referrals')
    .select('status, amount_paid')
    .eq('affiliate_id', affiliateId);

  const { data: payouts } = await supabase
    .from('affiliate_payouts')
    .select('amount, status')
    .eq('affiliate_id', affiliateId);

  const refs = referrals || [];
  const pays = payouts || [];

  return {
    totalReferrals: refs.length,
    activeReferrals: refs.filter((r) => !['clicked', 'commission_paid'].includes(r.status)).length,
    totalEarned: pays.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pendingPayouts: pays.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
  };
}

export async function fetchAffiliateReferrals(affiliateId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
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
// Affiliates — Admin
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
  affiliateId: string,
  status: Affiliate['status']
): Promise<Affiliate> {
  const { data, error } = await supabase
    .from('affiliates')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', affiliateId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAffiliate(data);
}

export async function updateAffiliate(
  affiliateId: string,
  updates: Partial<{
    name: string;
    company: string;
    bio: string;
    commissionAmount: number;
    status: string;
    stripeConnectAccountId: string;
    stripeConnectOnboarded: boolean;
    photoUrl: string;
  }>
): Promise<Affiliate> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.company !== undefined) updateData.company = updates.company;
  if (updates.bio !== undefined) updateData.bio = updates.bio;
  if (updates.commissionAmount !== undefined) updateData.commission_amount = updates.commissionAmount;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.stripeConnectAccountId !== undefined)
    updateData.stripe_connect_account_id = updates.stripeConnectAccountId;
  if (updates.stripeConnectOnboarded !== undefined)
    updateData.stripe_connect_onboarded = updates.stripeConnectOnboarded;
  if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;

  const { data, error } = await supabase
    .from('affiliates')
    .update(updateData)
    .eq('id', affiliateId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAffiliate(data);
}

export async function fetchAdminAffiliateStats(): Promise<AffiliateAdminStats> {
  const { data: affiliates } = await supabase.from('affiliates').select('status');
  const { data: referrals } = await supabase.from('referrals').select('status');
  const { data: payouts } = await supabase.from('affiliate_payouts').select('amount, status');

  const affs = affiliates || [];
  const refs = referrals || [];
  const pays = payouts || [];

  return {
    totalAffiliates: affs.length,
    activeAffiliates: affs.filter((a) => a.status === 'active').length,
    pendingApplications: affs.filter((a) => a.status === 'pending').length,
    totalReferrals: refs.length,
    totalCommissionsPaid: pays.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pendingPayouts: pays.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
  };
}

// ============================================
// Referrals — Attribution
// ============================================

export async function createReferralClick(
  affiliateId: string,
  email?: string
): Promise<Referral> {
  // Check for existing referral by email (first-touch attribution)
  if (email) {
    const { data: existing } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_email', email)
      .maybeSingle();

    if (existing) return mapReferral(existing);
  }

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      affiliate_id: affiliateId,
      referred_email: email || null,
      status: 'clicked',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapReferral(data);
}

export async function attributeReferralToStudent(
  referredEmail: string,
  studentId: string,
  totalPrice: number
): Promise<void> {
  // Find referral by email
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .ilike('referred_email', referredEmail)
    .in('status', ['clicked', 'enrolled'])
    .maybeSingle();

  if (!referral) return;

  await supabase
    .from('referrals')
    .update({
      bootcamp_student_id: studentId,
      total_price: totalPrice,
      status: 'enrolled',
      enrolled_at: new Date().toISOString(),
    })
    .eq('id', referral.id);
}

export async function fetchAllReferrals(): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
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
  asset: Omit<AffiliateAsset, 'id' | 'createdAt'>
): Promise<AffiliateAsset> {
  const { data, error } = await supabase
    .from('affiliate_assets')
    .insert({
      title: asset.title,
      description: asset.description,
      asset_type: asset.assetType,
      content_text: asset.contentText,
      file_url: asset.fileUrl,
      sort_order: asset.sortOrder,
      is_visible: asset.isVisible,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAsset(data);
}

export async function updateAffiliateAsset(
  assetId: string,
  updates: Partial<Omit<AffiliateAsset, 'id' | 'createdAt'>>
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
    .eq('id', assetId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAsset(data);
}

export async function deleteAffiliateAsset(assetId: string): Promise<void> {
  const { error } = await supabase.from('affiliate_assets').delete().eq('id', assetId);
  if (error) throw new Error(error.message);
}
```

**Step 2: Commit**

```bash
git add services/affiliate-supabase.ts
git commit -m "feat: add affiliate service layer with all CRUD operations"
```

---

## Task 4: Cookie Utility — Referral Attribution

**Files:**
- Create: `lib/referral-cookie.ts`

**Step 1: Create the cookie utility**

```typescript
/**
 * Referral cookie utility for affiliate attribution.
 * Sets a first-touch cookie that persists for 30 days.
 */

const COOKIE_NAME = 'gtm_ref';
const COOKIE_DAYS = 30;

export function setReferralCookie(code: string): void {
  // First-touch: don't overwrite existing cookie
  if (getReferralCode()) return;

  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getReferralCode(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearReferralCookie(): void {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Get referral code from URL param or cookie.
 * URL param takes priority for the current session but doesn't overwrite cookie.
 */
export function getActiveReferralCode(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || getReferralCode();
}
```

**Step 2: Commit**

```bash
git add lib/referral-cookie.ts
git commit -m "feat: add referral cookie utility for affiliate attribution"
```

---

## Task 5: Referral Landing Page — `/refer/:slug`

**Files:**
- Create: `components/affiliate/ReferralLandingPage.tsx`

This is a public page. Follows the pattern from `components/blueprint/BlueprintLandingPage.tsx` and `components/bootcamp/Login.tsx`.

**Step 1: Create the landing page component**

```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Users, CheckCircle, Star } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { fetchAffiliateBySlug } from '../../services/affiliate-supabase';
import { setReferralCookie } from '../../lib/referral-cookie';
import { Affiliate } from '../../types/affiliate-types';

const ReferralLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const aff = await fetchAffiliateBySlug(slug);
        if (aff) {
          setAffiliate(aff);
          setReferralCookie(aff.code);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (notFound || !affiliate) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Page Not Found
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            This referral link is no longer active.
          </p>
        </div>
      </div>
    );
  }

  const handleCTA = () => {
    navigate(`/bootcamp/register?ref=${affiliate.code}`);
  };

  const benefits = [
    'Build your LinkedIn Authority Blueprint',
    'Weekly live coaching sessions',
    'AI-powered content generation tools',
    'Proven lead generation frameworks',
    'Private community of B2B founders',
    'Lifetime access to all course materials',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-12">
        {/* Affiliate Info */}
        <div className="text-center mb-12">
          {affiliate.photoUrl && (
            <img
              src={affiliate.photoUrl}
              alt={affiliate.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-violet-500"
            />
          )}
          <p className="text-sm text-violet-500 font-medium mb-2">Referred by</p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            {affiliate.name}
          </h2>
          {affiliate.company && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{affiliate.company}</p>
          )}
          {affiliate.bio && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 max-w-md mx-auto">
              {affiliate.bio}
            </p>
          )}
        </div>

        {/* Program Info */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            LinkedIn Authority Bootcamp
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            The proven system for B2B founders to generate leads, build authority, and close deals on LinkedIn.
          </p>
        </div>

        {/* Benefits */}
        <div className={`rounded-xl border p-6 mb-8 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-violet-500" />
            What You Get
          </h3>
          <div className="space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 px-8 py-4 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-zinc-400 mt-3">
            Join hundreds of B2B founders already generating leads on LinkedIn.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} Modern Agency Sales
        </p>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 md:hidden">
        <button
          onClick={handleCTA}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-lg transition-colors"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ReferralLandingPage;
```

**Step 2: Commit**

```bash
git add components/affiliate/ReferralLandingPage.tsx
git commit -m "feat: add personalized referral landing page"
```

---

## Task 6: Affiliate Application Page — `/affiliate/apply`

**Files:**
- Create: `components/affiliate/AffiliateApply.tsx`

**Step 1: Create the application form**

Follow the exact pattern from `components/bootcamp/Register.tsx` — centered card, form fields, same styling.

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { submitAffiliateApplication, fetchAffiliateByEmail } from '../../services/affiliate-supabase';
import { useBootcampUser } from '../../context/AuthContext';

const AffiliateApply: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const bootcampUser = useBootcampUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [applicationNote, setApplicationNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Pre-fill if bootcamp student
  useEffect(() => {
    if (bootcampUser) {
      setEmail(bootcampUser.email);
      setName(bootcampUser.name || '');
    }
  }, [bootcampUser]);

  // Check if already applied
  useEffect(() => {
    if (!email) return;
    const check = async () => {
      const existing = await fetchAffiliateByEmail(email);
      if (existing) setAlreadyApplied(true);
    };
    const timeout = setTimeout(check, 500);
    return () => clearTimeout(timeout);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await submitAffiliateApplication({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        bio: bio.trim() || undefined,
        applicationNote: applicationNote.trim() || undefined,
        bootcampStudentId: bootcampUser?.id || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Application failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-10 border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-500 rounded-lg text-white">
              <CheckCircle size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Application Received
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
            We'll review your application and get back to you soon. You'll receive an email once approved.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-violet-500 hover:text-violet-400 font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-10 border border-zinc-200 dark:border-zinc-800 animate-slide-in">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-violet-500 rounded-lg text-white">
            <Users size={32} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Become an Affiliate
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Earn $500 for every person you refer who completes the Bootcamp.
          </p>
        </div>

        {bootcampUser && (
          <div className="mb-6 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
            <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
              Bootcamp Student — your info has been pre-filled
            </p>
          </div>
        )}

        {alreadyApplied && (
          <div className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              You've already applied. Check your email for updates.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`block w-full px-4 py-3 rounded-lg border transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`block w-full px-4 py-3 rounded-lg border transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={`block w-full px-4 py-3 rounded-lg border transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="Acme Inc."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Short Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className={`block w-full px-4 py-3 rounded-lg border resize-none transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="A brief intro about you (shown on your referral page)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              How will you promote the Bootcamp?
            </label>
            <textarea
              value={applicationNote}
              onChange={(e) => setApplicationNote(e.target.value)}
              rows={3}
              className={`block w-full px-4 py-3 rounded-lg border resize-none transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="LinkedIn posts, email list, podcast, word of mouth..."
            />
          </div>

          {error && <p className="text-xs font-medium text-red-500 px-1">{error}</p>}

          <button
            type="submit"
            disabled={loading || alreadyApplied || !name.trim() || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white py-3 px-4 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Submit Application <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Affiliate Program &middot; &copy; {new Date().getFullYear()} Modern Agency Sales
          </p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateApply;
```

**Step 2: Commit**

```bash
git add components/affiliate/AffiliateApply.tsx
git commit -m "feat: add affiliate application page"
```

---

## Task 7: Stripe Connect Edge Functions

**Files:**
- Create: `supabase/functions/create-connect-account/index.ts`
- Create: `supabase/functions/create-connect-login-link/index.ts`
- Create: `supabase/functions/process-affiliate-payout/index.ts`

Follow the exact pattern from `supabase/functions/create-checkout/index.ts` (CORS, Stripe init, error handling).

**Step 1: Create `create-connect-account` edge function**

```typescript
// supabase/functions/create-connect-account/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const ALLOWED_ORIGINS = [
  'https://modernagencysales.com',
  'https://www.modernagencysales.com',
  'http://localhost:3000',
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY is required');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { affiliateId, email, returnUrl } = await req.json();

    if (!affiliateId || !email) {
      return new Response(JSON.stringify({ error: 'Missing affiliateId or email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Stripe Express connected account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { affiliate_id: affiliateId },
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Save account ID to affiliates table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from('affiliates')
      .update({
        stripe_connect_account_id: account.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliateId);

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: returnUrl || `${req.headers.get('origin')}/affiliate/onboard`,
      return_url: returnUrl || `${req.headers.get('origin')}/affiliate/onboard?complete=true`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ accountId: account.id, onboardingUrl: accountLink.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Connect account error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 2: Create `create-connect-login-link` edge function**

```typescript
// supabase/functions/create-connect-login-link/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const ALLOWED_ORIGINS = [
  'https://modernagencysales.com',
  'https://www.modernagencysales.com',
  'http://localhost:3000',
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY is required');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { stripeAccountId } = await req.json();

    if (!stripeAccountId) {
      return new Response(JSON.stringify({ error: 'Missing stripeAccountId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    return new Response(JSON.stringify({ url: loginLink.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Connect login link error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 3: Create `process-affiliate-payout` edge function**

```typescript
// supabase/functions/process-affiliate-payout/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY is required');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  // This function is called internally (from stripe-webhook), no CORS needed
  try {
    const { referralId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get referral with affiliate info
    const { data: referral, error: refError } = await supabase
      .from('referrals')
      .select('*, affiliates(*)')
      .eq('id', referralId)
      .single();

    if (refError || !referral) {
      throw new Error(`Referral not found: ${referralId}`);
    }

    const affiliate = referral.affiliates;
    if (!affiliate?.stripe_connect_account_id || !affiliate?.stripe_connect_onboarded) {
      console.error(`Affiliate ${affiliate?.id} not set up for payouts`);
      return new Response(JSON.stringify({ error: 'Affiliate not set up for payouts' }), {
        status: 400,
      });
    }

    const commissionAmount = affiliate.commission_amount * 100; // Convert to cents

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_id: affiliate.id,
        referral_id: referralId,
        amount: affiliate.commission_amount,
        status: 'processing',
      })
      .select()
      .single();

    if (payoutError) throw new Error(payoutError.message);

    // Create Stripe Transfer
    const transfer = await stripe.transfers.create({
      amount: commissionAmount,
      currency: 'usd',
      destination: affiliate.stripe_connect_account_id,
      metadata: {
        affiliate_id: affiliate.id,
        referral_id: referralId,
        payout_id: payout.id,
      },
    });

    // Update payout with transfer ID and mark as paid
    await supabase
      .from('affiliate_payouts')
      .update({
        stripe_transfer_id: transfer.id,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payout.id);

    // Update referral status
    await supabase
      .from('referrals')
      .update({
        status: 'commission_paid',
        commission_paid_at: new Date().toISOString(),
      })
      .eq('id', referralId);

    console.log(`Payout of $${affiliate.commission_amount} sent to affiliate ${affiliate.id}`);

    return new Response(JSON.stringify({ success: true, transferId: transfer.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payout error:', message);

    // If we have a payout record, mark it as failed
    // (error handling is best-effort here)

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 4: Commit**

```bash
git add supabase/functions/create-connect-account/index.ts supabase/functions/create-connect-login-link/index.ts supabase/functions/process-affiliate-payout/index.ts
git commit -m "feat: add Stripe Connect edge functions for affiliate payouts"
```

---

## Task 8: Modify Stripe Webhook — Referral Payment Tracking

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts` (lines 271-327, the `invoice.paid` case)

**Step 1: Add referral payment tracking after the existing `invoice.paid` handler**

After line 324 (`console.log(\`Payment received for student ${student.id}\``);), add:

```typescript
          // --- Affiliate Referral Tracking ---
          // Check if this student was referred by an affiliate
          const { data: referral } = await supabase
            .from('referrals')
            .select('id, affiliate_id, total_price, amount_paid, status')
            .eq('bootcamp_student_id', student.id)
            .in('status', ['enrolled', 'paying'])
            .maybeSingle();

          if (referral) {
            const newAmountPaid = (referral.amount_paid || 0) + (invoice.amount_paid || 0) / 100;
            const newStatus = newAmountPaid >= referral.total_price ? 'paid_in_full' : 'paying';

            await supabase
              .from('referrals')
              .update({
                amount_paid: newAmountPaid,
                status: newStatus,
                ...(newStatus === 'paid_in_full' ? { paid_in_full_at: new Date().toISOString() } : {}),
              })
              .eq('id', referral.id);

            console.log(`Updated referral ${referral.id}: $${newAmountPaid} paid, status: ${newStatus}`);

            // Trigger payout if paid in full
            if (newStatus === 'paid_in_full') {
              try {
                const payoutUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-affiliate-payout`;
                await fetch(payoutUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  },
                  body: JSON.stringify({ referralId: referral.id }),
                });
                console.log(`Triggered payout for referral ${referral.id}`);
              } catch (payoutErr) {
                console.error('Failed to trigger payout:', payoutErr);
                // Non-blocking: payout can be retried manually from admin
              }
            }
          }
```

**Step 2: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat: add referral payment tracking to stripe webhook"
```

---

## Task 9: Modify Registration — Referral Code Attribution

**Files:**
- Modify: `components/bootcamp/Register.tsx`

**Step 1: Add referral code field and attribution**

Add after the email field (after line 186), before the submit button:

```typescript
          {/* Referral Code (optional) */}
          <div>
            <label
              htmlFor="referralCode"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1"
            >
              Referral Code <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              id="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-zinc-900 dark:text-white font-mono tracking-wider"
              placeholder="ABC123"
              maxLength={10}
            />
          </div>
```

Add state and imports at the top of the component:

```typescript
import { getActiveReferralCode } from '../../lib/referral-cookie';
```

Add state:
```typescript
const [referralCode, setReferralCode] = useState(getActiveReferralCode() || '');
```

In the `handleSubmit` function, after `onRegister(user)` (line 81), add attribution:

```typescript
      // Attribute referral if code present
      if (referralCode.trim()) {
        try {
          const { fetchAffiliateByCode, attributeReferralToStudent } = await import('../../services/affiliate-supabase');
          const affiliate = await fetchAffiliateByCode(referralCode.trim());
          if (affiliate) {
            await attributeReferralToStudent(email.trim(), student.id, 3500); // Default bootcamp price
          }
        } catch {
          // Non-blocking: referral attribution failure shouldn't break registration
        }
      }
```

**Step 2: Commit**

```bash
git add components/bootcamp/Register.tsx
git commit -m "feat: add referral code field to bootcamp registration"
```

---

## Task 10: Affiliate Dashboard — Layout and Overview

**Files:**
- Create: `components/affiliate/AffiliateDashboard.tsx`
- Create: `components/affiliate/AffiliateSidebar.tsx`
- Create: `components/affiliate/AffiliateOverview.tsx`
- Create: `hooks/useAffiliate.ts`

**Step 1: Create the `useAffiliate` hook**

```typescript
// hooks/useAffiliate.ts
import { useState, useEffect } from 'react';
import {
  Affiliate,
  AffiliateStats,
  Referral,
  AffiliatePayout,
  AffiliateAsset,
} from '../types/affiliate-types';
import {
  fetchAffiliateByEmail,
  fetchAffiliateStats,
  fetchAffiliateReferrals,
  fetchAffiliatePayouts,
  fetchAffiliateAssets,
} from '../services/affiliate-supabase';

const AFFILIATE_KEY = 'affiliate_user';

export function useAffiliate() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem(AFFILIATE_KEY);
      if (!saved) {
        setLoading(false);
        return;
      }
      try {
        const { email } = JSON.parse(saved);
        const aff = await fetchAffiliateByEmail(email);
        if (aff && aff.status === 'active') {
          setAffiliate(aff);
          const s = await fetchAffiliateStats(aff.id);
          setStats(s);
        } else {
          localStorage.removeItem(AFFILIATE_KEY);
        }
      } catch {
        localStorage.removeItem(AFFILIATE_KEY);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const login = async (email: string): Promise<boolean> => {
    const aff = await fetchAffiliateByEmail(email);
    if (aff && aff.status === 'active') {
      localStorage.setItem(AFFILIATE_KEY, JSON.stringify({ email: aff.email }));
      setAffiliate(aff);
      const s = await fetchAffiliateStats(aff.id);
      setStats(s);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AFFILIATE_KEY);
    setAffiliate(null);
    setStats(null);
  };

  const refreshStats = async () => {
    if (!affiliate) return;
    const s = await fetchAffiliateStats(affiliate.id);
    setStats(s);
  };

  return { affiliate, stats, loading, login, logout, refreshStats };
}

export function useAffiliateReferrals(affiliateId: string | undefined) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!affiliateId) return;
    fetchAffiliateReferrals(affiliateId)
      .then(setReferrals)
      .finally(() => setLoading(false));
  }, [affiliateId]);

  return { referrals, loading };
}

export function useAffiliatePayoutsList(affiliateId: string | undefined) {
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!affiliateId) return;
    fetchAffiliatePayouts(affiliateId)
      .then(setPayouts)
      .finally(() => setLoading(false));
  }, [affiliateId]);

  return { payouts, loading };
}

export function useAffiliateAssetsList() {
  const [assets, setAssets] = useState<AffiliateAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAffiliateAssets()
      .then(setAssets)
      .finally(() => setLoading(false));
  }, []);

  return { assets, loading };
}
```

**Step 2: Create the sidebar**

```typescript
// components/affiliate/AffiliateSidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, DollarSign, FileText, Settings, LogOut, X, Link2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AffiliateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const navItems = [
  { to: '/affiliate/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/affiliate/dashboard/referrals', icon: Users, label: 'My Referrals' },
  { to: '/affiliate/dashboard/payouts', icon: DollarSign, label: 'Payouts' },
  { to: '/affiliate/dashboard/assets', icon: FileText, label: 'Marketing Assets' },
  { to: '/affiliate/dashboard/settings', icon: Settings, label: 'Settings' },
];

const AffiliateSidebar: React.FC<AffiliateSidebarProps> = ({ isOpen, onClose, onLogout }) => {
  const { isDarkMode } = useTheme();

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border-r`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`h-16 flex items-center justify-between px-4 border-b ${
              isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-violet-500" />
              <span className="font-semibold text-zinc-900 dark:text-white">Affiliate Portal</span>
            </div>
            <button
              onClick={onClose}
              className={`lg:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? isDarkMode
                        ? 'bg-violet-400/10 text-violet-400'
                        : 'bg-violet-100 text-violet-700'
                      : isDarkMode
                        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className={`p-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AffiliateSidebar;
```

**Step 3: Create the dashboard layout and overview**

```typescript
// components/affiliate/AffiliateDashboard.tsx
import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAffiliate } from '../../hooks/useAffiliate';
import AffiliateSidebar from './AffiliateSidebar';
import AffiliateLogin from './AffiliateLogin';

const AffiliateDashboard: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { affiliate, stats, loading, login, logout } = useAffiliate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!affiliate) {
    return <AffiliateLogin onLogin={login} />;
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <AffiliateSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className={`h-16 flex items-center justify-between px-4 border-b shrink-0 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Welcome, {affiliate.name}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ affiliate, stats }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AffiliateDashboard;
```

**Step 4: Create the affiliate login component**

```typescript
// components/affiliate/AffiliateLogin.tsx
import React, { useState } from 'react';
import { Link2, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface AffiliateLoginProps {
  onLogin: (email: string) => Promise<boolean>;
}

const AffiliateLogin: React.FC<AffiliateLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const success = await onLogin(email.trim());
      if (!success) setError('No active affiliate account found for this email.');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-10 border border-zinc-200 dark:border-zinc-800 animate-slide-in">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-violet-500 rounded-lg text-white">
            <Link2 size={32} />
          </div>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">Affiliate Portal</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Sign in with your affiliate email.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none text-zinc-900 dark:text-white"
                placeholder="you@company.com"
                required
              />
            </div>
            {error && <p className="mt-3 text-xs font-medium text-red-500 px-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white py-3 px-4 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>
        <div className="mt-8 text-center">
          <a
            href="/affiliate/apply"
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Not an affiliate? <span className="font-medium">Apply now</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AffiliateLogin;
```

**Step 5: Create the overview page**

```typescript
// components/affiliate/AffiliateOverview.tsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy, Check, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Affiliate, AffiliateStats } from '../../types/affiliate-types';

const AffiliateOverview: React.FC = () => {
  const { affiliate, stats } = useOutletContext<{ affiliate: Affiliate; stats: AffiliateStats }>();
  const { isDarkMode } = useTheme();
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);

  const referralUrl = `${window.location.origin}/refer/${affiliate.slug}`;

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    await navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const statCards = [
    { label: 'Total Referrals', value: stats?.totalReferrals || 0, icon: Users, color: 'text-violet-500' },
    { label: 'Active Referrals', value: stats?.activeReferrals || 0, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Total Earned', value: `$${stats?.totalEarned || 0}`, icon: DollarSign, color: 'text-green-500' },
    { label: 'Pending Payouts', value: `$${stats?.pendingPayouts || 0}`, icon: Clock, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm mt-1 text-zinc-400">Your affiliate performance at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Referral Link & Code */}
      <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <h3 className="text-lg font-semibold mb-4">Your Referral Link & Code</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Referral Link
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralUrl}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-mono ${
                  isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              />
              <button
                onClick={() => copyToClipboard(referralUrl, 'link')}
                className="px-4 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Referral Code
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={affiliate.code}
                className={`w-40 px-4 py-2.5 rounded-lg border text-sm font-mono tracking-widest text-center ${
                  isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              />
              <button
                onClick={() => copyToClipboard(affiliate.code, 'code')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mt-4">
          Share your link or code. You earn ${affiliate.commissionAmount} for each referral who pays in full.
        </p>
      </div>
    </div>
  );
};

export default AffiliateOverview;
```

**Step 6: Commit**

```bash
git add hooks/useAffiliate.ts components/affiliate/AffiliateSidebar.tsx components/affiliate/AffiliateDashboard.tsx components/affiliate/AffiliateLogin.tsx components/affiliate/AffiliateOverview.tsx
git commit -m "feat: add affiliate dashboard with sidebar, login, and overview"
```

---

## Task 11: Affiliate Dashboard — Referrals, Payouts, Assets, Settings Pages

**Files:**
- Create: `components/affiliate/AffiliateReferrals.tsx`
- Create: `components/affiliate/AffiliatePayoutsPage.tsx`
- Create: `components/affiliate/AffiliateAssetsPage.tsx`
- Create: `components/affiliate/AffiliateSettingsPage.tsx`
- Create: `components/affiliate/AffiliateOnboard.tsx`

These are standard table/card pages following the same patterns as the admin pages. Implementation should follow the exact table styles from `components/admin/bootcamp/students/StudentTable.tsx` and card styles from the design system.

Each page uses `useOutletContext` to get the affiliate, and the corresponding hooks from `useAffiliate.ts` for data.

**Step 1: Create all four pages plus onboard page**

Create each file following the patterns. The referrals page shows a table with status badges. The payouts page shows a table of payouts. The assets page shows marketing materials with copy-to-clipboard for swipe copy and download links for files. The settings page shows profile info and Stripe Connect status. The onboard page handles Stripe Connect setup flow.

*(Full code for each follows the same card/table patterns shown in Tasks 5, 6, and 10. Each is a straightforward data display page.)*

**Step 2: Commit**

```bash
git add components/affiliate/AffiliateReferrals.tsx components/affiliate/AffiliatePayoutsPage.tsx components/affiliate/AffiliateAssetsPage.tsx components/affiliate/AffiliateSettingsPage.tsx components/affiliate/AffiliateOnboard.tsx
git commit -m "feat: add affiliate referrals, payouts, assets, and settings pages"
```

---

## Task 12: Admin Affiliates Page

**Files:**
- Create: `components/admin/affiliates/AdminAffiliatesPage.tsx`
- Create: `hooks/useAffiliateAdmin.ts`

Tabbed admin page following the pattern from `AdminStudentsPage.tsx`. Tabs: Applications, Affiliates, Referrals, Payouts, Assets, Settings.

**Step 1: Create admin hook**

```typescript
// hooks/useAffiliateAdmin.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllAffiliates,
  fetchAllReferrals,
  fetchAllPayouts,
  fetchAllAffiliateAssets,
  fetchAdminAffiliateStats,
  updateAffiliateStatus,
  updateAffiliate,
  createAffiliateAsset,
  updateAffiliateAsset,
  deleteAffiliateAsset,
} from '../services/affiliate-supabase';

export function useAffiliateAdmin() {
  const queryClient = useQueryClient();

  const affiliatesQuery = useQuery({
    queryKey: ['admin', 'affiliates'],
    queryFn: fetchAllAffiliates,
  });

  const referralsQuery = useQuery({
    queryKey: ['admin', 'referrals'],
    queryFn: fetchAllReferrals,
  });

  const payoutsQuery = useQuery({
    queryKey: ['admin', 'payouts'],
    queryFn: fetchAllPayouts,
  });

  const assetsQuery = useQuery({
    queryKey: ['admin', 'affiliate-assets'],
    queryFn: fetchAllAffiliateAssets,
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'affiliate-stats'],
    queryFn: fetchAdminAffiliateStats,
  });

  const approveAffiliate = useMutation({
    mutationFn: (id: string) => updateAffiliateStatus(id, 'approved'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] }),
  });

  const rejectAffiliate = useMutation({
    mutationFn: (id: string) => updateAffiliateStatus(id, 'rejected'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] }),
  });

  const suspendAffiliate = useMutation({
    mutationFn: (id: string) => updateAffiliateStatus(id, 'suspended'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] }),
  });

  const updateAffiliateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateAffiliate>[1] }) =>
      updateAffiliate(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] }),
  });

  const createAssetMutation = useMutation({
    mutationFn: createAffiliateAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-assets'] }),
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateAffiliateAsset>[1] }) =>
      updateAffiliateAsset(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-assets'] }),
  });

  const deleteAssetMutation = useMutation({
    mutationFn: deleteAffiliateAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-assets'] }),
  });

  return {
    affiliates: affiliatesQuery.data || [],
    referrals: referralsQuery.data || [],
    payouts: payoutsQuery.data || [],
    assets: assetsQuery.data || [],
    stats: statsQuery.data,
    loading: affiliatesQuery.isLoading,
    approveAffiliate,
    rejectAffiliate,
    suspendAffiliate,
    updateAffiliate: updateAffiliateMutation,
    createAsset: createAssetMutation,
    updateAsset: updateAssetMutation,
    deleteAsset: deleteAssetMutation,
  };
}
```

**Step 2: Create the admin page** (tabbed layout following existing admin patterns)

**Step 3: Commit**

```bash
git add hooks/useAffiliateAdmin.ts components/admin/affiliates/AdminAffiliatesPage.tsx
git commit -m "feat: add admin affiliates page with all tabs"
```

---

## Task 13: Wire Up Routes — App.tsx and AdminSidebar

**Files:**
- Modify: `App.tsx` (add lazy imports and routes)
- Modify: `components/admin/AdminSidebar.tsx` (add nav item)

**Step 1: Add lazy imports to `App.tsx`**

After line 64 (`const TamBuilder = ...`), add:

```typescript
// Lazy-loaded: Affiliate
const ReferralLandingPage = lazy(() => import('./components/affiliate/ReferralLandingPage'));
const AffiliateApply = lazy(() => import('./components/affiliate/AffiliateApply'));
const AffiliateDashboard = lazy(() => import('./components/affiliate/AffiliateDashboard'));
const AffiliateOverview = lazy(() => import('./components/affiliate/AffiliateOverview'));
const AffiliateReferrals = lazy(() => import('./components/affiliate/AffiliateReferrals'));
const AffiliatePayoutsPage = lazy(() => import('./components/affiliate/AffiliatePayoutsPage'));
const AffiliateAssetsPage = lazy(() => import('./components/affiliate/AffiliateAssetsPage'));
const AffiliateSettingsPage = lazy(() => import('./components/affiliate/AffiliateSettingsPage'));
const AffiliateOnboard = lazy(() => import('./components/affiliate/AffiliateOnboard'));
const AdminAffiliatesPage = lazy(() => import('./components/admin/affiliates/AdminAffiliatesPage'));
```

**Step 2: Add routes**

After the bootcamp routes (line 183), before the blueprint routes (line 185), add:

```typescript
        {/* Affiliate — Public */}
        <Route path="/refer/:slug" element={<ReferralLandingPage />} />
        <Route path="/affiliate/apply" element={<AffiliateApply />} />
        <Route path="/affiliate/onboard" element={<AffiliateOnboard />} />

        {/* Affiliate — Dashboard */}
        <Route path="/affiliate/dashboard" element={<AffiliateDashboard />}>
          <Route index element={<AffiliateOverview />} />
          <Route path="referrals" element={<AffiliateReferrals />} />
          <Route path="payouts" element={<AffiliatePayoutsPage />} />
          <Route path="assets" element={<AffiliateAssetsPage />} />
          <Route path="settings" element={<AffiliateSettingsPage />} />
        </Route>
```

Add the admin affiliates route inside the Admin Dashboard routes (after line 158):

```typescript
          <Route path="affiliates" element={<AdminAffiliatesPage />} />
```

**Step 3: Add nav item to AdminSidebar**

In `components/admin/AdminSidebar.tsx`, add `Users` to the import on line 3:

```typescript
import { Wrench, ListChecks, ArrowLeft, X, Shield, GraduationCap, Users } from 'lucide-react';
```

Add to `navItems` array (after line 14):

```typescript
  { to: '/admin/affiliates', icon: Users, label: 'Affiliates' },
```

**Step 4: Commit**

```bash
git add App.tsx components/admin/AdminSidebar.tsx
git commit -m "feat: wire up affiliate routes and admin nav"
```

---

## Task 14: Stripe Connect Environment Variables

**Files:**
- Document only (no code change needed)

Ensure the following env vars are set in Supabase Edge Function environment:

- `STRIPE_SECRET_KEY` — already exists (used by create-checkout and stripe-webhook)
- `SUPABASE_URL` — already exists
- `SUPABASE_SERVICE_ROLE_KEY` — already exists

No new env vars needed. Stripe Connect uses the same `STRIPE_SECRET_KEY` — Express connected accounts are created under your existing Stripe platform account.

**Action item:** Enable Stripe Connect in your Stripe dashboard (Settings > Connect > Get started). This is a one-time setup.

---

## Task 15: Smoke Test & Verify

**Step 1:** Run `npm run build` to verify no TypeScript errors.

**Step 2:** Run `npm run dev` and manually test:
- Visit `/affiliate/apply` — form renders and submits
- Visit `/refer/test-slug` — shows not found (no test data yet)
- Visit `/affiliate/dashboard` — shows login page
- Visit `/admin/affiliates` — shows in admin sidebar and loads

**Step 3:** Run existing tests to verify no regressions: `npm run test`

**Step 4: Commit any fixes**

```bash
git commit -m "fix: resolve any build or test issues from affiliate feature"
```
