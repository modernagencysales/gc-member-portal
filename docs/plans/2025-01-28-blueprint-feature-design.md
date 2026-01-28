# Blueprint Feature Design

**Date:** 2025-01-28
**Status:** Approved

---

## Overview

Integrate the LinkedIn Lead Magnet "Blueprint" into the GTM OS app ecosystem. Currently this is a Webflow frontend with a Supabase backend. The Blueprint presents analyzed information about a prospect's LinkedIn profile, rewrites their profile, and gives them 60 days of posts. It serves as a powerful lead magnet that drives call bookings.

### Goals

1. **Zero-friction access** - Public pages accessible via personalized URL (for cold email outreach)
2. **Conversion optimized** - Strategic CTAs throughout to drive call bookings
3. **Seamless lead-to-customer transition** - Blueprint data links to student account when they convert
4. **Seller enablement** - Post-call offer page with personalized recommendations
5. **Maintainable** - Editable marketing content without code changes

---

## Architecture

### New Routes

```
/blueprint/:slug          → Public Blueprint page (no auth)
/blueprint/:slug/offer    → Offer page (unlocked by seller)
/admin/blueprints         → Blueprint admin dashboard
```

### URL Structure

Personalized, memorable URLs with collision protection:
- Format: `/blueprint/[name-slug]-[4-char-code]`
- Example: `/blueprint/gabrielle-san-nicola-7x3k`

### Database Changes

**Existing `prospects` table - new fields:**
- `slug` (string, unique) - URL slug
- `offer_unlocked` (boolean, default false) - Whether offer page is accessible
- `recommended_offer` (enum: 'foundations' | 'engineering' | null)
- `offer_note` (text, nullable) - Personalized note from seller

**Existing `students` table - new field:**
- `prospect_id` (UUID, FK → prospects.id, nullable) - Links student to their Blueprint

**New `blueprint_settings` table:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| sticky_cta_enabled | boolean | Global toggle for sticky CTA |
| foundations_payment_url | text | Payment link for Foundations |
| engineering_payment_url | text | Payment link for Engineering |
| updated_at | timestamp | Last modified |

**New `blueprint_content_blocks` table:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| block_key | string | Identifier (e.g., "allbound_system") |
| content | jsonb | Block content (supports rich text) |
| updated_at | timestamp | Last modified |

### Component Structure

```
components/blueprint/
├── BlueprintPage.tsx        → Main public page
├── BlueprintHeader.tsx      → Name, photo, authority score
├── ScoreRadar.tsx           → Radar chart (5 subscores)
├── AnalysisSection.tsx      → What's working / Revenue leaks
├── ProfileRewrite.tsx       → Before/after headline + bio
├── LeadMagnets.tsx          → 3 concept cards
├── ContentRoadmap.tsx       → 60-day posts grid
├── MarketingBlock.tsx       → Renders editable static content
├── CTAButton.tsx            → Contextual CTA component
├── StickyCTA.tsx            → Floating CTA bar
├── CalEmbed.tsx             → Cal.com integration
├── OfferPage.tsx            → Post-call offer page
├── OfferCard.tsx            → Individual offer display
└── BlueprintNotFound.tsx    → 404 state

components/admin/blueprints/
├── AdminBlueprintsPage.tsx  → Main dashboard
├── BlueprintTable.tsx       → Prospects list
├── BlueprintDetailPanel.tsx → Individual prospect controls
├── BlueprintSettingsModal.tsx → Global settings
└── ContentEditor.tsx        → Marketing content editor
```

---

## Blueprint Page

### Layout (top to bottom)

1. **Header**
   - Profile photo (from `profile_photo`)
   - "GTM BLUEPRINT FOR [NAME]" + company
   - Authority score (large number) + `score_summary`

2. **Score Breakdown**
   - Radar chart with 5 axes:
     - Profile Optimization (`score_profile_optimization`)
     - Content Presence (`score_content_presence`)
     - Outbound Systems (`score_outbound_systems`)
     - Inbound Infrastructure (`score_inbound_infrastructure`)
     - Social Proof (`score_social_proof`)

3. **Marketing Block: "The Allbound System"** (editable)

4. **Analysis Section**
   - What's Working (3 green-tinted cards from `whats_working_1/2/3`)
   - Revenue Leaks (3 red-tinted cards from `revenue_leaks_1/2/3`)
   - Bottom Line (callout box from `bottom_line`)
   - **Contextual CTA #1**

5. **Profile Rewrite**
   - Headline: Current → Recommended (side by side)
   - Headline options tabs (Outcome/Authority/Hybrid)
   - Bio: Current → Recommended (stacked)
   - **Contextual CTA #2**

6. **Lead Magnet Concepts**
   - 3 cards from `lm_card_1/2/3`
   - Each shows: content type badge, headline, subheadline, match reason, est. hours
   - Expandable for full description + sample promo post

7. **60-Day Content Roadmap**
   - Grid/list of posts from `posts` table
   - Each post: title, preview, copy button
   - Grouped by week or scrollable
   - **Contextual CTA #3**

8. **Marketing Block: Bootcamp Pitch** (editable)

9. **Marketing Block: FAQs** (editable, accordion)

10. **Testimonials** (Senja embed)

11. **Final CTA**
    - Cal.com embed for booking

12. **Sticky CTA** (if enabled globally)
    - Fixed bottom bar
    - Hides when final Cal.com embed is in view

### Data Flow

```
BlueprintPage
├─ Fetch prospect by slug (Supabase)
├─ Fetch posts by prospect_id (Supabase)
├─ Fetch content blocks (Supabase)
├─ Fetch global settings (Supabase)
└─ Render sections with data
```

---

## Offer Page

### Access Control

- URL: `/blueprint/:slug/offer`
- If `offer_unlocked` is false → show "not yet available" message
- No auth required (same public access model)

### Layout

1. **Header (condensed)**
   - "Your Personalized Offer"
   - Profile photo + name (smaller)
   - "Based on your Blueprint analysis..."

2. **Recommended Offer** (highlighted)
   - "RECOMMENDED FOR YOU" badge
   - Offer name (GTM Foundations or GTM Engineering)
   - Price ($997 or $3,500)
   - Personalized note from seller (if provided)
   - Key bullets (3-5 highlights)
   - [Enroll Now] button → payment link
   - Payment plan option text

3. **Other Option** (muted, collapsed by default)
   - "See other options" expandable
   - Shows other offer in secondary styling
   - No "recommended" badge

4. **Testimonials** (Senja embed)

5. **Questions?**
   - "Book another call" link

### Two Offers

| Offer | Price | Target |
|-------|-------|--------|
| GTM Foundations | $997 (or 3x $367) | Solopreneurs getting started, need niche clarity |
| GTM Engineering | $3,500 (or 4x $1,000) | $10k+/mo businesses ready to scale |

---

## Admin Dashboard

### URL: `/admin/blueprints`

Fits into existing admin layout as new sidebar item.

### Dashboard View

- **Header:** "Blueprints" + [Settings] button
- **Filters:** Search by name/email, filter by status, filter by offer status
- **Table columns:** Name, Score, Status, Offer, Actions

### Prospect Detail Panel

Slide-out panel with:
- Name + email
- Blueprint URL with copy button
- Offer controls:
  - Unlocked toggle
  - Recommended offer dropdown
  - Personal note text field
- Quick stats (authority score, fit score, created date, status)
- Quick links: View Blueprint, View Offer Page

### Global Settings Modal

- Sticky CTA toggle (on/off)
- Payment links (Foundations URL, Engineering URL)
- [Edit Marketing Content] button

### Marketing Content Editor

Tabbed interface:
- **Blueprint Page tab:** Allbound System, Bootcamp Pitch, FAQs
- **Offer Page tab:** Foundations content, Engineering content
- **CTAs tab:** Contextual CTA copy (3), Sticky CTA copy

FAQs use structured editor (question/answer pairs with add/delete).

---

## Account Linking

### Auto-match on Registration

When a student registers for bootcamp:
1. Check if `students.email` matches any `prospects.email`
2. If match found, set `students.prospect_id` to the prospect's ID
3. Happens automatically, no user action needed

### Manual Claim Fallback

In bootcamp LMS Settings → "Your Blueprint":
- If linked: Show connected Blueprint with link to view
- If not linked: Input field to enter Blueprint URL/code and connect

### Surfacing Blueprint Data in LMS

Once linked:
- Dashboard widget showing authority score
- Link to view full Blueprint
- AI tools pull `voice_style_guide` and `knowledge_base` to personalize outputs

---

## Visual Design

Following the Linear-inspired design system (dark mode default):

| Element | Styling |
|---------|---------|
| Page background | `zinc-950` |
| Cards/sections | `zinc-900` with `border-zinc-800` |
| Authority score | `text-4xl font-semibold`, violet accent |
| Radar chart | Violet fill, zinc grid lines |
| What's Working cards | `bg-green-500/10 border-green-500/20` |
| Revenue Leaks cards | `bg-red-500/10 border-red-500/20` |
| Primary CTAs | `bg-violet-500 hover:bg-violet-600` |
| Sticky CTA | `bg-zinc-900/95 backdrop-blur`, border top |
| Before/After | Side-by-side, "Before" muted, "After" highlighted |

### Mobile Responsiveness

- Single column layout
- Sticky CTA becomes full-width bottom bar
- Radar chart scales or switches to bar chart
- Before/After stacks vertically

---

## Services Layer

### New Service: `blueprint-supabase.ts`

```typescript
// Prospect fetching
getProspectBySlug(slug: string): Promise<Prospect>
getProspectPosts(prospectId: string): Promise<Post[]>

// Admin operations
listProspects(filters): Promise<Prospect[]>
updateProspectOffer(id, { unlocked, recommended, note }): Promise<void>
generateProspectSlug(prospect): string

// Settings
getBlueprintSettings(): Promise<BlueprintSettings>
updateBlueprintSettings(settings): Promise<void>

// Content blocks
getContentBlock(key: string): Promise<ContentBlock>
getAllContentBlocks(): Promise<ContentBlock[]>
updateContentBlock(key, content): Promise<void>

// Account linking
linkProspectToStudent(studentId, prospectId): Promise<void>
findProspectByEmail(email: string): Promise<Prospect | null>
```

---

## Implementation Phases

### Phase 1: Core Blueprint Page
- Database migrations (new fields + tables)
- Blueprint page components
- Supabase service layer
- Basic routing

### Phase 2: Admin Dashboard
- Admin blueprints page
- Prospect management
- Global settings

### Phase 3: Offer Page
- Offer page components
- Seller controls (unlock, recommend, note)
- Payment link integration

### Phase 4: Marketing Content Editor
- Content blocks CRUD
- Rich text editing
- FAQ structured editor

### Phase 5: Account Linking
- Auto-match on registration
- Manual claim in LMS settings
- AI tools integration

### Phase 6: Polish
- Mobile responsiveness
- Loading states
- Error handling
- Analytics/tracking

---

## Open Questions (Resolved)

1. ~~URL structure~~ → Name slug with suffix (e.g., `gabrielle-san-nicola-7x3k`)
2. ~~Auth model~~ → Public pages, no auth required
3. ~~Offer display~~ → Show both, highlight recommended, secondary collapsed
4. ~~Sticky CTA scope~~ → Global setting
5. ~~Marketing content scope~~ → Global (one version for all)

---

## Future Enhancements

- Progress tracking ("Your score was 52, let's improve it")
- Blueprint refresh (re-run analysis after improvements)
- A/B testing different CTA copy
- Automated follow-up emails based on Blueprint views
- Integration with CRM for lead scoring
