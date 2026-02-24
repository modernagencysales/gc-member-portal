# Personalized DFY Offer Page — Design

## Problem
The `/blueprint/:slug/offer` page currently pitches one of two bootcamps (Foundations or Engineering). We're shifting to DFY offers instead. Every prospect should see the same DFY offer ($2,500) with personalization (name + seller's note).

## Design Decisions
- **Rewrite `OfferPage.tsx`** to render DFY content instead of bootcamp content
- **Keep `DFYOfferPage.tsx` untouched** — standalone `/offer/dfy` stays as-is
- **Reuse `dfy-offer-data.ts`** as single source of truth for DFY copy
- **Payment URL**: Use existing `dfyOfferUrl` from `blueprint_settings` (already admin-configurable), fall back to `VITE_STRIPE_INTRO_OFFER_URL`
- **Spots remaining**: New `spots_remaining_dfy` column in `blueprint_settings`
- **Personalization**: First name + seller's note only
- **Urgency**: Limited spots counter + "Your system will be live in 10 days" future pacing banner
- **Removed**: All bootcamp/engineering branching logic, cohort dates, curriculum weeks
