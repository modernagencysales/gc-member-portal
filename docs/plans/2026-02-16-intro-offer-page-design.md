# Intro Offer Page — Design Doc

**Date**: 2026-02-16
**Location**: Inside Bootcamp portal (`/bootcamp/intro-offer`), behind login, with sidebar
**Style**: Clean product page — concise, visual, scannable. Salesperson handles the pitch verbally on the call.
**Checkout**: Stripe payment links (3 bundle tiers)

## Page Structure

### 1. Hero Section
- Headline: "Start Getting Warm Leads From LinkedIn in 2 Weeks. Guaranteed."
- Subtext: Brief one-liner about what this is (done-for-you GTM launch)

### 2. What You Get (deliverables grid)
2-column card grid, each card with icon + title + one-line description:
- 4 LinkedIn posts written & published from your Blueprint
- 1 lead magnet fully built from your Blueprint
- Sourced & verified lead list for your ICP
- HeyReach set up + connection request campaigns running
- MagnetLab set up + full funnel built around your lead magnet

**Bonus section** (visually distinct, highlighted border):
- 5-email nurture flow written for you
- VSL script for lead magnet thank-you page

### 3. How It Works (3 steps, horizontal on desktop / vertical on mobile)
- Step 1: "30-min Interview + Data Dump" — You give us everything (call recordings, docs, etc.)
- Step 2: "Log Into MagnetLab" — Connect your LinkedIn so we can schedule your posts
- Step 3: "We Deliver, You Approve" — We build everything, you approve, it goes live

### 4. The Result (single punchy callout)
"In 10 days: a full funnel, a lead magnet that would have taken you 25 hours, and ideal prospects reaching out."

### 5. Pricing Tiers (3 cards side by side)
- **Core** — $2,500: Everything above
- **Core + LI Ads** — $3,500: Everything + LinkedIn ads account setup
- **Full Package** — $4,500: Everything + LinkedIn ads + cold email infrastructure setup
- Each card has its own Stripe checkout CTA button
- Stripe links stored as constants (placeholder URLs initially, user will provide real ones)

### 6. Guarantee (callout)
"If you're not getting connection requests approved in 2 weeks, we write another week of content for you — free."

## Technical Approach

- **New file**: `src/components/bootcamp/IntroOffer.tsx`
- **Routing**: Add view inside `BootcampApp.tsx` for path `/bootcamp/intro-offer`
- **Sidebar**: Add link with distinguishing icon (e.g., Sparkles or Gift)
- **Styling**: Tailwind, dark mode support, matches existing portal patterns
- **No new dependencies** — pure React + Tailwind + lucide-react icons
- **Stripe links**: Constants at top of file, easy to swap out
