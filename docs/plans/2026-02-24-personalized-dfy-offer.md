# Personalized DFY Offer Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the bootcamp pitch on `/blueprint/:slug/offer` with the DFY offer content, keeping name + note personalization, with admin-configurable payment URL and spots remaining.

**Architecture:** Rewrite `OfferPage.tsx` to use `DFY_OFFER` data from `dfy-offer-data.ts` and render the same page structure as `DFYOfferPage.tsx`, plus personalization header and urgency elements. Add `spots_remaining_dfy` to `blueprint_settings` DB and admin UI. Reuse existing `dfyOfferUrl` setting for the payment URL.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Supabase, Lucide icons

---

### Task 1: Add `spots_remaining_dfy` column to Supabase

**Files:**
- None (SQL migration against shared Supabase)

**Step 1: Run migration**

```sql
ALTER TABLE blueprint_settings
ADD COLUMN IF NOT EXISTS spots_remaining_dfy integer;
```

Run via Supabase SQL editor or CLI.

**Step 2: Verify column exists**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'blueprint_settings' AND column_name = 'spots_remaining_dfy';
```

Expected: 1 row with `integer` type.

**Step 3: Set initial value**

```sql
UPDATE blueprint_settings SET spots_remaining_dfy = 5;
```

---

### Task 2: Update TypeScript types for DFY spots

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/types/blueprint-types.ts:287-329` (BlueprintSettings + BlueprintSettingsFormData)

**Step 1: Add `spotsRemainingDfy` to `BlueprintSettings` interface**

In `BlueprintSettings` (after line 315 `spotsRemainingEngineering`), add:

```typescript
spotsRemainingDfy?: number;
```

**Step 2: Add `spotsRemainingDfy` to `BlueprintSettingsFormData`**

In `BlueprintSettingsFormData` (after line 357 `spotsRemainingEngineering`), add:

```typescript
spotsRemainingDfy?: number;
```

---

### Task 3: Update service layer for DFY spots

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/services/blueprint-supabase.ts`

**Step 1: Add column to `BLUEPRINT_SETTINGS_COLUMNS` (line 30-31)**

Add `spots_remaining_dfy` to the end of the column string (before `created_at`):

```
..., max_logos_blueprint, spots_remaining_dfy, created_at, updated_at
```

**Step 2: Add mapping in `mapBlueprintSettings` (after line 274)**

```typescript
spotsRemainingDfy: record.spots_remaining_dfy as number | undefined,
```

**Step 3: Add to `updateBlueprintSettings` parameter type (after `spotsRemainingEngineering`)**

```typescript
spotsRemainingDfy: number;
```

**Step 4: Add mapping in `updateBlueprintSettings` body (after line 748)**

```typescript
if (settings.spotsRemainingDfy !== undefined) {
  updateData.spots_remaining_dfy = settings.spotsRemainingDfy;
}
```

---

### Task 4: Update admin UI — BlueprintSettingsModal

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/admin/blueprints/BlueprintSettingsModal.tsx`

**Step 1: Add `spotsRemainingDfy` to FormData interface and default state**

Add field to the form data type and initial state, alongside existing spots fields.

**Step 2: Add form field in the DFY section**

Add a number input for "DFY Spots Remaining" near the existing DFY fields (dfyOfferUrl, etc.):

```tsx
<div>
  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
    DFY Spots Remaining
  </label>
  <input
    type="number"
    min={0}
    value={formData.spotsRemainingDfy ?? ''}
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        spotsRemainingDfy: e.target.value ? parseInt(e.target.value, 10) : undefined,
      }))
    }
    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
    placeholder="e.g., 5"
  />
</div>
```

**Step 3: Wire up load and save**

In the settings load effect, add:
```typescript
spotsRemainingDfy: settings.spotsRemainingDfy,
```

In the save handler, include `spotsRemainingDfy` in the update call.

**Step 4: Commit**

```bash
git add types/blueprint-types.ts services/blueprint-supabase.ts components/admin/blueprints/BlueprintSettingsModal.tsx
git commit -m "feat: add DFY spots remaining to settings"
```

---

### Task 5: Rewrite OfferPage.tsx for DFY content

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/blueprint/OfferPage.tsx` (full rewrite)

This is the main task. Rewrite the component to render DFY offer content with personalization.

**Step 1: Update imports**

Replace:
```typescript
import { OFFERS } from './offer-data';
import {
  getNextCohortDate,
  formatCohortDate,
  getDaysUntilCohort,
  getSpotsRemaining,
} from './offer-utils';
import {
  FAQAccordionItem,
  CurriculumWeek,
  ValueStackRow,
  TestimonialInline,
  CTASection,
  SenjaEmbed,
} from './offer-components';
```

With:
```typescript
import {
  AlertCircle,
  Check,
  X,
  Shield,
  Zap,
  Rocket,
  Gift,
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
  Calendar,
} from 'lucide-react';
import { DFY_OFFER } from './dfy-offer-data';
import { FAQAccordionItem, ValueStackRow, TestimonialInline, SenjaEmbed } from './offer-components';
```

**Step 2: Replace the component body**

The new component should:

1. Keep the existing data fetching logic (slug → getProspectBySlug → getBlueprintSettings)
2. Keep OfferLoadingState, OfferNotFound, OfferError components as-is
3. Remove all bootcamp/engineering branching (`recommendedType`, `OFFERS[]`, cohort dates, etc.)
4. Use `DFY_OFFER` as the offer data source
5. Get payment URL from `settings?.dfyOfferUrl || import.meta.env.VITE_STRIPE_INTRO_OFFER_URL || ''`
6. Get spots from `settings?.spotsRemainingDfy ?? 5` (default 5)
7. Render the DFY page structure (matching `DFYOfferPage.tsx` layout) with personalization header

**Page structure (in order):**

```
1. ThemeToggle (fixed)
2. Personalized header: "Prepared for [First Name]"
3. Seller's note card (if offerNote exists)
4. Hero: badge ("One-Time Offer") + headline + subheadline + CTA
5. Urgency banner: "[X] spots remaining this month" + "Your system will be live in 10 days"
6. Testimonial #1
7. Problem/Agitation section
8. Solution section
9. Testimonial #2
10. Deliverables grid (5 items with icons)
11. Bonuses section (2 items, violet bg)
12. How It Works (3 steps)
13. Result banner (violet gradient)
14. Mid-page CTA
15. Value stack + pricing summary
16. Testimonial #3
17. Is This For You / Not For You
18. About Tim (credibility + stats)
19. Pricing card + guarantee
20. FAQ accordion
21. Pre-Senja CTA
22. Senja embed
23. Final CTA
```

**Step 3: Inline DFY CTA component**

Create inline CTA component (like DFYOfferPage has):

```tsx
const DfyCta: React.FC<{ paymentUrl: string; variant?: 'primary' | 'secondary' }> = ({
  paymentUrl,
  variant = 'primary',
}) => {
  const isPrimary = variant === 'primary';

  if (!paymentUrl) {
    return (
      <div className="flex justify-center">
        <button
          disabled
          className="px-8 py-4 rounded-lg font-semibold text-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
        >
          Coming Soon
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <a
        href={paymentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block px-8 py-4 rounded-lg font-semibold text-center transition-colors ${
          isPrimary
            ? 'bg-violet-500 hover:bg-violet-600 text-white text-lg'
            : 'bg-violet-600 hover:bg-violet-700 text-white'
        }`}
      >
        {DFY_OFFER.ctaPrimary}
      </a>
    </div>
  );
};
```

**Step 4: Urgency banner section**

Add after hero, before first testimonial:

```tsx
{/* ===== URGENCY BANNER ===== */}
<section className="bg-gradient-to-r from-violet-100 to-violet-50 border border-violet-200 dark:from-violet-600/20 dark:to-violet-500/10 dark:border-violet-500/30 rounded-xl p-6 sm:p-8 text-center">
  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
    <div className="flex items-center gap-2">
      <Star className="w-5 h-5 text-violet-400" />
      <span className="text-zinc-800 dark:text-zinc-200 font-medium">
        {spotsRemaining} spots remaining this month
      </span>
    </div>
    <div className="flex items-center gap-2">
      <Clock className="w-5 h-5 text-violet-400" />
      <span className="text-zinc-800 dark:text-zinc-200 font-medium">
        Your system will be live in 10 days
      </span>
    </div>
  </div>
</section>
```

**Step 5: Commit**

```bash
git add components/blueprint/OfferPage.tsx
git commit -m "feat: rewrite personalized offer page for DFY offer"
```

---

### Task 6: Verify and test

**Step 1: Run type check**

```bash
cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit
```

Expected: No type errors.

**Step 2: Run dev server and verify**

```bash
npm run dev
```

Visit:
- `/blueprint/{any-existing-slug}/offer` — should show DFY page with prospect name
- `/offer/dfy` — should still work as before (standalone)
- Admin settings modal — should show DFY spots remaining field

**Step 3: Run existing tests**

```bash
npm run test:unit
```

Fix any broken imports or references.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix any remaining type/test issues"
```

---

## Files Changed Summary

| File | Change Type | What |
|------|------------|------|
| `types/blueprint-types.ts` | Modify | Add `spotsRemainingDfy` to settings interfaces |
| `services/blueprint-supabase.ts` | Modify | Add column to query, mapping, and update function |
| `components/admin/blueprints/BlueprintSettingsModal.tsx` | Modify | Add DFY spots field |
| `components/blueprint/OfferPage.tsx` | Rewrite | DFY content + personalization |

## Files NOT Changed

| File | Reason |
|------|--------|
| `DFYOfferPage.tsx` | Standalone page stays as-is |
| `dfy-offer-data.ts` | Reused as-is |
| `offer-components.tsx` | Reused as-is |
| `GenericOfferPage.tsx` | Unrelated |
| `App.tsx` | Routes unchanged |
| `offer-data.ts` | Still used by GenericOfferPage |
| `offer-utils.ts` | Still used by GenericOfferPage |
