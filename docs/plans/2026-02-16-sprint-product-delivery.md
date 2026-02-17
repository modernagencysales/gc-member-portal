# Sprint Product Delivery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically provision bootcamp student accounts with curriculum, content grants, and time-limited AI tool access when customers purchase the 30-Day LinkedIn Sprint via Stripe.

**Architecture:** Stripe `checkout.session.completed` webhook hits the existing gtm-system `/api/webhooks/stripe` route. The handler loads a configurable product mapping from `bootcamp_settings`, creates/updates student records, assigns cohorts, and grants content/tool access. Admin UI in copy-of-gtm-os for configuration.

**Tech Stack:** Next.js 16 (gtm-system), React/Vite (copy-of-gtm-os), Supabase, Stripe API, TanStack Query

---

### Task 1: Add SprintProductConfig Type (copy-of-gtm-os)

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/types/bootcamp-types.ts`

**Step 1: Add the SprintProductConfig interface**

After the `CallGrantConfig` interface (~line 277), add:

```typescript
export interface SprintProductConfig {
  enabled: boolean;
  products: {
    sprint: {
      stripeProductId: string;
      cohortId: string;
      accessLevel: BootcampAccessLevel;
      role: StudentCohortRole;
    };
    dmKit: {
      stripeProductId: string;
      contentGrantIds: string[];
    };
    gptSuite: {
      stripeProductId: string;
      toolSlugs: string[];
      creditsPerTool: number;
      accessDays: number;
    };
  };
}
```

**Step 2: Commit**

```bash
git add types/bootcamp-types.ts
git commit -m "feat: add SprintProductConfig type for product delivery"
```

---

### Task 2: Add Sprint Config Service Functions (copy-of-gtm-os)

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/services/bootcamp-supabase.ts`

**Step 1: Add fetch and save functions**

Follow the exact pattern of `fetchCallGrantConfig` / `saveCallGrantConfig` (around lines 1491-1517). Add after them:

```typescript
const DEFAULT_SPRINT_PRODUCT_CONFIG: SprintProductConfig = {
  enabled: false,
  products: {
    sprint: {
      stripeProductId: '',
      cohortId: '',
      accessLevel: 'Curriculum Only',
      role: 'student',
    },
    dmKit: {
      stripeProductId: '',
      contentGrantIds: ['dm_conversion_kit'],
    },
    gptSuite: {
      stripeProductId: '',
      toolSlugs: [],
      creditsPerTool: 10,
      accessDays: 30,
    },
  },
};

export async function fetchSprintProductConfig(): Promise<SprintProductConfig> {
  try {
    const { data, error } = await supabase
      .from('bootcamp_settings')
      .select('value')
      .eq('key', 'sprint_product_config')
      .single();

    if (error || !data) {
      return DEFAULT_SPRINT_PRODUCT_CONFIG;
    }

    return { ...DEFAULT_SPRINT_PRODUCT_CONFIG, ...(data.value as Partial<SprintProductConfig>) };
  } catch {
    return DEFAULT_SPRINT_PRODUCT_CONFIG;
  }
}

export async function saveSprintProductConfig(config: SprintProductConfig): Promise<void> {
  const { error } = await supabase.from('bootcamp_settings').upsert({
    key: 'sprint_product_config',
    value: config,
    description: 'Auto-provision students from Sprint product purchases',
  });

  if (error) throw new Error(`Failed to save sprint product config: ${error.message}`);
}
```

**Step 2: Add the import for `SprintProductConfig`**

At the top of the file, add `SprintProductConfig` to the import from `bootcamp-types.ts`.

**Step 3: Commit**

```bash
git add services/bootcamp-supabase.ts
git commit -m "feat: add fetch/save functions for sprint product config"
```

---

### Task 3: Build SprintProductConfigEditor Component (copy-of-gtm-os)

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/admin/bootcamp/settings/SprintProductConfigEditor.tsx`

**Step 1: Create the component**

Follow the `CallGrantConfigEditor.tsx` pattern exactly. The component should:

1. Use `useQuery` to fetch `sprintProductConfig` via `fetchSprintProductConfig()`
2. Use `useQuery` to fetch AI tools via `fetchAllAITools()`
3. Use `useQuery` to fetch LMS cohorts (for cohort dropdown) — check `services/lms-supabase.ts` for `fetchCohorts()` or similar
4. Local state with `useState<SprintProductConfig | null>`
5. `hasChanges` tracking
6. `useMutation` to save via `saveSprintProductConfig()`

UI sections:
- **Header**: Shopping cart icon + "Sprint Product Delivery" title + Save button (shown when changes exist)
- **Description**: "Automatically create student accounts when customers purchase the 30-Day LinkedIn Sprint via Stripe."
- **Enabled toggle**: Same pattern as CallGrantConfigEditor
- **Sprint Product ID**: Text input for Stripe product ID (`products.sprint.stripeProductId`)
- **Sprint Cohort**: Dropdown of LMS cohorts (`products.sprint.cohortId`)
- **Sprint Access Level**: Dropdown of access levels (`products.sprint.accessLevel`)
- **DM Kit Product ID**: Text input (`products.dmKit.stripeProductId`)
- **GPT Suite Product ID**: Text input (`products.gptSuite.stripeProductId`)
- **GPT Suite Access Days**: Number input (`products.gptSuite.accessDays`)
- **GPT Suite Credits per Tool**: Number input (`products.gptSuite.creditsPerTool`)
- **GPT Suite Tool Selection**: Same tool toggle buttons as CallGrantConfigEditor (`products.gptSuite.toolSlugs`)

Use the same Tailwind classes, dark mode support via `useTheme()`, and Lucide icons as the existing editor.

**Step 2: Commit**

```bash
git add components/admin/bootcamp/settings/SprintProductConfigEditor.tsx
git commit -m "feat: add SprintProductConfigEditor admin component"
```

---

### Task 4: Wire SprintProductConfigEditor into Settings Page (copy-of-gtm-os)

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/admin/bootcamp/settings/AdminBootcampSettingsPage.tsx`

**Step 1: Import the new component**

Add alongside the existing imports:

```typescript
import SprintProductConfigEditor from './SprintProductConfigEditor';
```

**Step 2: Render the component**

Add `<SprintProductConfigEditor />` in the settings page, after `<CallGrantConfigEditor />` (around line 319). It's self-contained like CallGrantConfigEditor — just drop it in.

**Step 3: Commit**

```bash
git add components/admin/bootcamp/settings/AdminBootcampSettingsPage.tsx
git commit -m "feat: add Sprint product config to bootcamp settings page"
```

---

### Task 5: Add Sprint Purchase Handler to Stripe Webhook (gtm-system)

**Files:**
- Modify: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/webhooks/stripe/route.ts`

**Step 1: Add Stripe SDK import**

At the top of the file, add:

```typescript
import Stripe from 'stripe';
```

Verify `stripe` is already a dependency in gtm-system's `package.json`. If not, install it.

**Step 2: Create a helper function for Sprint purchase processing**

Add above the `POST` handler:

```typescript
async function processSprintPurchase(
  checkoutSessionId: string,
  customerEmail: string,
  customerName: string | null,
  stripeCustomerId: string | null,
  lineItems: Stripe.LineItem[],
  supabase: ReturnType<typeof getSupabase>
) {
  // Load sprint product config
  const { data: configRow } = await supabase
    .from('bootcamp_settings')
    .select('value')
    .eq('key', 'sprint_product_config')
    .single();

  if (!configRow?.value) return null;

  const config = configRow.value as {
    enabled: boolean;
    products: {
      sprint: { stripeProductId: string; cohortId: string; accessLevel: string; role: string };
      dmKit: { stripeProductId: string; contentGrantIds: string[] };
      gptSuite: { stripeProductId: string; toolSlugs: string[]; creditsPerTool: number; accessDays: number };
    };
  };

  if (!config.enabled) return null;

  // Match purchased product IDs against config
  const purchasedProductIds = lineItems
    .map((item) => item.price?.product)
    .filter(Boolean) as string[];

  const hasSprint = purchasedProductIds.includes(config.products.sprint.stripeProductId);
  const hasDmKit = purchasedProductIds.includes(config.products.dmKit.stripeProductId);
  const hasGptSuite = purchasedProductIds.includes(config.products.gptSuite.stripeProductId);

  if (!hasSprint && !hasDmKit && !hasGptSuite) return null;

  const grantCode = `stripe:${checkoutSessionId}`;
  const purchased: string[] = [];

  // 1. Create or find student
  let studentId: string;

  const { data: existingStudent } = await supabase
    .from('bootcamp_students')
    .select('id, access_level')
    .ilike('email', customerEmail)
    .maybeSingle();

  if (existingStudent) {
    studentId = existingStudent.id;
    // Update Stripe customer ID if not set
    if (stripeCustomerId) {
      await supabase
        .from('bootcamp_students')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', studentId);
    }
  } else {
    const { data: newStudent, error: createError } = await supabase
      .from('bootcamp_students')
      .insert({
        email: customerEmail.toLowerCase(),
        name: customerName,
        status: 'Onboarding',
        access_level: config.products.sprint.accessLevel || 'Curriculum Only',
        cohort: 'Sprint',
        payment_source: 'stripe',
        payment_id: checkoutSessionId,
        stripe_customer_id: stripeCustomerId,
        purchase_date: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (createError) {
      logger.error('Failed to create bootcamp student for Sprint purchase', {
        error: createError.message,
        email: customerEmail,
      });
      throw createError;
    }
    studentId = newStudent.id;
  }

  // 2. Assign to Sprint cohort
  if (hasSprint && config.products.sprint.cohortId) {
    await supabase.from('student_cohorts').upsert(
      {
        student_id: studentId,
        cohort_id: config.products.sprint.cohortId,
        role: config.products.sprint.role || 'student',
        access_level: config.products.sprint.accessLevel || 'Curriculum Only',
        enrollment_source: 'stripe_sprint',
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,cohort_id' }
    );
    purchased.push('sprint');
  }

  // 3. Grant DM Kit content
  if (hasDmKit && config.products.dmKit.contentGrantIds?.length) {
    for (const weekId of config.products.dmKit.contentGrantIds) {
      await supabase.from('student_content_grants').upsert(
        {
          student_id: studentId,
          week_id: weekId,
          granted_by_code: grantCode,
        },
        { onConflict: 'student_id,week_id' }
      );
    }
    purchased.push('dm_kit');
  }

  // 4. Grant GPT Suite (time-limited tool access)
  if (hasGptSuite) {
    // Set access expiry on student record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (config.products.gptSuite.accessDays || 30));

    await supabase
      .from('bootcamp_students')
      .update({ access_expires_at: expiresAt.toISOString() })
      .eq('id', studentId);

    // Grant tool credits
    for (const toolSlug of config.products.gptSuite.toolSlugs) {
      const { data: tool } = await supabase
        .from('ai_tools')
        .select('id')
        .eq('slug', toolSlug)
        .maybeSingle();

      if (!tool) {
        logger.warn(`Sprint GPT Suite: tool not found for slug: ${toolSlug}`);
        continue;
      }

      await supabase.from('student_tool_credits').upsert(
        {
          student_id: studentId,
          tool_id: tool.id,
          credits_total: config.products.gptSuite.creditsPerTool,
          credits_used: 0,
          granted_by_code: grantCode,
        },
        { onConflict: 'student_id,tool_id,granted_by_code' }
      );
    }
    purchased.push('gpt_suite');
  }

  // 5. Log subscription event for audit trail
  await supabase.from('subscription_events').insert({
    student_id: studentId,
    event_type: 'sprint_purchase',
    stripe_event_id: checkoutSessionId,
    metadata: {
      products_purchased: purchased,
      customer_email: customerEmail,
      grant_code: grantCode,
    },
  });

  logger.info('Sprint purchase processed', {
    studentId,
    email: customerEmail,
    products: purchased,
  });

  return { studentId, purchased };
}
```

**Step 3: Call the handler from checkout.session.completed**

In the existing `checkout.session.completed` block (after the intro offer handling, around line 143), add:

```typescript
      // Handle Sprint product purchases
      if (customerEmail) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          const lineItems = await stripe.checkout.sessions.listLineItems(obj.id, { limit: 10 });

          const sprintResult = await processSprintPurchase(
            obj.id,
            customerEmail,
            obj.customer_details?.name || null,
            stripeCustomerId,
            lineItems.data,
            supabase
          );

          if (sprintResult) {
            logger.info('Sprint purchase provisioned', {
              studentId: sprintResult.studentId,
              products: sprintResult.purchased,
            });
          }
        } catch (sprintError) {
          logger.error('Sprint purchase processing failed', {
            error: sprintError instanceof Error ? sprintError.message : String(sprintError),
            checkoutSessionId: obj.id,
            customerEmail,
          });
          // Don't fail the whole webhook — revenue event already recorded
        }
      }
```

**Step 4: Verify `STRIPE_SECRET_KEY` env var exists**

Check that `STRIPE_SECRET_KEY` is set in Railway env vars for gtm-system. This is needed for the `stripe.checkout.sessions.listLineItems()` call.

**Step 5: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat: handle Sprint product purchases in Stripe webhook"
```

---

### Task 6: Verify subscription_events Table Schema (gtm-system)

**Files:**
- Check: Supabase `subscription_events` table columns

**Step 1: Verify the table has the columns we need**

Run a query against Supabase to check the `subscription_events` table schema:

```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscription_events' ORDER BY ordinal_position;
```

We need: `student_id`, `event_type`, `stripe_event_id`, `metadata`. If `stripe_event_id` doesn't exist, use whatever ID column is available, or store the checkout session ID in `metadata` instead.

**Step 2: Adjust the insert in Task 5 if columns don't match**

If the schema differs, update the `processSprintPurchase` function's subscription_events insert to match actual columns.

**Step 3: Commit if changes needed**

---

### Task 7: Test End-to-End Flow

**Step 1: Set up the admin config**

1. Go to the admin settings page in copy-of-gtm-os (`/admin/courses/settings`)
2. In the Sprint Product Config editor, enter the 3 Stripe product IDs
3. Select the Sprint cohort
4. Select AI tools for the GPT Suite
5. Enable the config and save

**Step 2: Create a Stripe test checkout**

Use Stripe's test mode to create a checkout session with the Sprint product. Verify the webhook fires and:
- A `bootcamp_students` record is created
- The student is assigned to the Sprint cohort in `student_cohorts`
- If DM Kit was included: `student_content_grants` has an entry
- If GPT Suite was included: `student_tool_credits` has entries and `access_expires_at` is set

**Step 3: Verify idempotency**

Re-send the same webhook event. Verify no duplicate records are created.

**Step 4: Verify portal access**

Log into the bootcamp portal with the test email. Verify:
- Curriculum is visible
- AI tools show up (if GPT Suite was purchased)

---

### Task 8: Deploy

**Step 1: Deploy copy-of-gtm-os to Vercel**

```bash
cd "/Users/timlife/Documents/claude code/copy-of-gtm-os"
vercel --prod
```

**Step 2: Deploy gtm-system to Railway**

Push changes to the main branch — Railway auto-deploys.

```bash
cd "/Users/timlife/Documents/claude code/gtm-system"
git push origin main
```

**Step 3: Verify Stripe webhook endpoint is configured**

In Stripe Dashboard → Developers → Webhooks, verify that `https://gtmconductor.com/api/webhooks/stripe` is configured to receive `checkout.session.completed` events. If not, add it with the webhook signing secret.
