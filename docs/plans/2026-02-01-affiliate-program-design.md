# Affiliate Program Design

## Overview

An affiliate/referral program for the Bootcamp. Affiliates (current students or external partners) earn a flat commission ($500 default) when someone they refer pays for the Bootcamp in full. Payouts are automated via Stripe Connect.

## Data Model

### `affiliates`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| email | text | unique |
| name | text | |
| company | text | nullable |
| slug | text | unique, used in URL `/refer/:slug` |
| code | text | unique, short referral code |
| status | text | `pending` / `approved` / `active` / `rejected` / `suspended` |
| commission_amount | integer | default 500, per-affiliate override |
| stripe_connect_account_id | text | nullable, filled after Stripe onboarding |
| stripe_connect_onboarded | boolean | default false |
| bootcamp_student_id | UUID | nullable FK to `bootcamp_students` |
| photo_url | text | nullable |
| bio | text | nullable |
| application_note | text | nullable, "how will you promote" |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Status flow: `pending` -> `approved` (you approve) -> `active` (Stripe Connect complete)

### `referrals`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| affiliate_id | UUID | FK to `affiliates` |
| referred_email | text | |
| referred_name | text | nullable |
| bootcamp_student_id | UUID | nullable FK to `bootcamp_students` |
| total_price | integer | bootcamp price for this student |
| amount_paid | integer | default 0, updated as payments come in |
| status | text | `clicked` / `enrolled` / `paying` / `paid_in_full` / `commission_paid` |
| attributed_at | timestamptz | when link/code was first used |
| enrolled_at | timestamptz | nullable |
| paid_in_full_at | timestamptz | nullable |
| commission_paid_at | timestamptz | nullable |
| created_at | timestamptz | |

### `affiliate_payouts`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| affiliate_id | UUID | FK |
| referral_id | UUID | FK |
| amount | integer | commission amount at time of payout |
| stripe_transfer_id | text | nullable |
| status | text | `pending` / `processing` / `paid` / `failed` |
| created_at | timestamptz | |
| paid_at | timestamptz | nullable |

### `affiliate_assets`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| title | text | |
| description | text | nullable |
| asset_type | text | `swipe_copy` / `image` / `video` / `document` |
| content_text | text | nullable, for swipe copy |
| file_url | text | nullable, for uploaded files |
| sort_order | integer | default 0 |
| is_visible | boolean | default true |
| created_at | timestamptz | |

## Affiliate Lifecycle

1. Visitor applies at `/affiliate/apply` (public form: name, email, company, bio, promotion plan)
2. If they're a logged-in bootcamp student, form pre-fills from `bootcamp_students`
3. Row created in `affiliates` with status `pending`
4. Admin sees application in `/admin/affiliates`, approves or rejects
5. On approval: status -> `approved`, email sent with setup link
6. Affiliate visits `/affiliate/onboard`, triggers Stripe Connect Express onboarding (Stripe-hosted)
7. On completion: `stripe_connect_account_id` saved, `stripe_connect_onboarded` = true, status -> `active`
8. Affiliate accesses dashboard at `/affiliate/dashboard`

## Referral Attribution

### Two entry points

1. **Link**: someone visits `/refer/:slug`, cookie `gtm_ref` set with affiliate code (30-day expiry), redirected to bootcamp info/checkout with `?ref=CODE`
2. **Code**: someone manually enters a referral code during registration

### Attribution rules

- First-touch: first affiliate to touch a lead gets credit, no overwriting
- Cookie lasts 30 days
- `referrals` row created with status `clicked` on first visit (by cookie/email)
- Status -> `enrolled` when the person registers as a bootcamp student
- Status -> `paying` on first payment
- `amount_paid` incremented on each `invoice.paid` webhook

## Commission & Payout

- Commission triggers when `amount_paid >= total_price` (bootcamp paid in full, typically $3,500-$4,000)
- Referral status -> `paid_in_full`
- `affiliate_payouts` row created with status `pending`
- Edge function `process-affiliate-payout` creates Stripe Transfer to affiliate's connected account
- On transfer success: payout status -> `paid`, referral status -> `commission_paid`
- On transfer failure: payout status -> `failed`, admin notified

## Pages & Routes

### Public

| Route | Component | Purpose |
|-------|-----------|---------|
| `/refer/:slug` | `ReferralLandingPage` | Personalized affiliate landing page |
| `/affiliate/apply` | `AffiliateApply` | Application form |

### Affiliate (authenticated)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/affiliate/onboard` | `AffiliateOnboard` | Stripe Connect setup |
| `/affiliate/dashboard` | `AffiliateDashboard` | Overview, stats, link/code |
| `/affiliate/dashboard/referrals` | `AffiliateReferrals` | Referral detail table |
| `/affiliate/dashboard/payouts` | `AffiliatePayouts` | Payout history |
| `/affiliate/dashboard/assets` | `AffiliateAssets` | Marketing materials |
| `/affiliate/dashboard/settings` | `AffiliateSettings` | Profile, Stripe account |

### Admin

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/affiliates` | `AdminAffiliatesPage` | Tabbed view: Applications, Affiliates, Referrals, Payouts, Assets, Settings |

## UI Design

All pages use the existing design system:

- **Colors**: zinc palette, violet-500 primary, violet-600 hover
- **Icons**: Lucide React
- **Cards**: `rounded-xl border bg-zinc-900 border-zinc-800 p-4`
- **Tables**: `rounded-xl border overflow-hidden`, header `text-xs font-medium uppercase tracking-wide text-zinc-500`, row hover `hover:bg-zinc-800/30`
- **Buttons**: violet primary `bg-violet-500 hover:bg-violet-600 text-white rounded-lg`, secondary `text-zinc-400 hover:bg-zinc-800`
- **Forms**: inputs `bg-zinc-800 border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500`
- **Badges**: status badges with colored backgrounds (`green` for paid, `amber` for paying, `zinc` for enrolled)
- **Layout**: affiliate dashboard uses sidebar layout (`w-64 bg-zinc-900`) with violet active states; admin uses existing admin layout with amber active states

### Landing page (`/refer/:slug`)

- `min-h-screen bg-white dark:bg-zinc-950`
- Affiliate photo, name, bio at top
- Bootcamp value prop content below
- Violet CTA button, sticky on mobile

### Application page (`/affiliate/apply`)

- Centered card layout like Login page
- `max-w-md rounded-xl border bg-zinc-900 p-10`
- Pre-fills for logged-in students

### Affiliate dashboard

- 4 stat cards: Total Referrals, Active Referrals, Total Earned, Pending Payouts
- Prominent link/code section with copy buttons
- Standard table for referrals with status badges and payment progress

## Technical Integration

### New Supabase Edge Functions

- `create-connect-account` — creates Stripe Express connected account, returns onboarding URL
- `create-connect-login-link` — generates Stripe dashboard link for affiliates
- `process-affiliate-payout` — creates Stripe Transfer when referral is paid in full

### Modified Files

- `stripe-webhook/index.ts` — extend `invoice.paid` handler to check for referrals, update `amount_paid`, trigger payout when paid in full
- `Register.tsx` — add optional "Referral code" field, read `ref` param and `gtm_ref` cookie
- `App.tsx` — add `/affiliate/*` and `/refer/:slug` routes (lazy-loaded)
- `AdminSidebar.tsx` — add Affiliates nav item

### New Files

- `services/affiliate-supabase.ts` — affiliate DB operations
- `services/affiliate-stripe.ts` — Stripe Connect edge function wrappers
- `hooks/useAffiliate.ts` — affiliate profile, referrals, payouts queries
- `hooks/useAffiliateAdmin.ts` — admin queries for all affiliates
- Cookie utility for `gtm_ref` (30-day, first-touch)

### RLS Policies

- Affiliates read/update own row only
- Affiliates read own referrals and payouts only
- `affiliate_assets` readable by all active affiliates
- Admin full access to all affiliate tables
- Public read `affiliates` where status = `active` (for landing pages)

### Supabase Migration

Single migration file creates all four tables, indexes, RLS policies, and a trigger to auto-generate slug/code on insert.
