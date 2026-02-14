# Command Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Stripe revenue tracking and a "TripleWhale for GTM" Command Center dashboard that shows revenue per channel, full funnel, pipeline velocity, and actionable alerts — all from one screen.

**Architecture:** Stripe webhooks land in gtm-system, which writes to a `revenue_events` table in Supabase with channel attribution resolved by joining to the `leads` table. A `channel_costs` table stores spend per channel (manual entry initially). New analytics endpoints aggregate revenue + cost data. The Command Center UI lives in copy-of-gtm-os as a new GC portal page using Recharts.

**Tech Stack:** Next.js 16 (gtm-system), React 18 + Vite (copy-of-gtm-os), Supabase (Postgres), Stripe webhooks, Recharts, Tailwind CSS, Trigger.dev v3

---

## Phase 1: Data Layer (gtm-system)

### Task 1: Create revenue_events and channel_costs migration

**Files:**
- Create: `/Users/timlife/Documents/claude code/gtm-system/supabase/migrations/20260214_revenue_tracking.sql`

**Step 1: Write the migration SQL**

```sql
-- Revenue Tracking Tables
-- Stores Stripe payment events with channel attribution for GTM analytics

-- =============================================================================
-- Table: revenue_events
-- =============================================================================
CREATE TABLE IF NOT EXISTS revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_event_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,

  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'payment', 'subscription_created', 'subscription_updated',
    'subscription_cancelled', 'refund'
  )),

  -- Revenue data
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  product_name TEXT,
  product_category TEXT CHECK (product_category IN (
    'bootcamp', 'infrastructure', 'saas', 'other'
  )),
  is_recurring BOOLEAN NOT NULL DEFAULT false,

  -- Attribution
  lead_id UUID,
  customer_email TEXT,
  attribution_channel TEXT,  -- 'heyreach', 'plusvibe', 'organic', 'magnetlab', etc.

  -- MRR tracking
  mrr_impact_cents INTEGER DEFAULT 0,

  -- Timestamps
  stripe_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_events_tenant ON revenue_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_channel ON revenue_events(tenant_id, attribution_channel);
CREATE INDEX IF NOT EXISTS idx_revenue_events_date ON revenue_events(tenant_id, stripe_created_at);
CREATE INDEX IF NOT EXISTS idx_revenue_events_customer ON revenue_events(stripe_customer_id);

ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON revenue_events FOR ALL USING (true);

-- =============================================================================
-- Table: channel_costs
-- =============================================================================
CREATE TABLE IF NOT EXISTS channel_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  channel TEXT NOT NULL,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('subscription', 'usage', 'ad_spend')),
  amount_cents INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_costs_tenant ON channel_costs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channel_costs_period ON channel_costs(tenant_id, period_start, period_end);

ALTER TABLE channel_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON channel_costs FOR ALL USING (true);
```

**Step 2: Apply the migration**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npx supabase db push --linked`

If that doesn't work (common with this project), apply directly via Supabase Management API:

```bash
# Extract token
TOKEN=$(security find-generic-password -s "Supabase CLI" -w | sed 's/go-keyring-base64://' | base64 -D)

# Apply migration
curl -X POST "https://api.supabase.com/v1/projects/qvawbxpijxlwdkolmjrs/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "<paste SQL here>"}'
```

**Step 3: Commit**

```bash
cd "/Users/timlife/Documents/claude code/gtm-system"
git add supabase/migrations/20260214_revenue_tracking.sql
git commit -m "feat: add revenue_events and channel_costs tables for GTM analytics"
```

---

### Task 2: Add Stripe webhook verification

**Files:**
- Modify: `/Users/timlife/Documents/claude code/gtm-system/src/lib/webhooks/verify.ts`

**Step 1: Read the existing verify.ts file**

Read the full file to understand the current verification pattern. The file uses `crypto.timingSafeEqual()` for HMAC verification.

**Step 2: Add Stripe verification function**

Add this function following the existing pattern (after the other verify functions):

```typescript
/**
 * Verify Stripe webhook signature using the official stripe-signature header.
 * Stripe uses HMAC-SHA256 with a `t=timestamp,v1=signature` header format.
 */
export async function verifyStripeWebhook(
  request: NextRequest,
  rawBody: string
): Promise<{ valid: boolean; error?: string }> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return requireSecretInProduction('Stripe', 'STRIPE_WEBHOOK_SECRET');
  }

  const sigHeader = request.headers.get('stripe-signature');
  if (!sigHeader) {
    return { valid: false, error: 'Missing stripe-signature header' };
  }

  // Parse Stripe signature header: t=timestamp,v1=signature
  const elements = sigHeader.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
  const signature = elements.find(e => e.startsWith('v1='))?.slice(3);

  if (!timestamp || !signature) {
    return { valid: false, error: 'Invalid stripe-signature format' };
  }

  // Verify timestamp is within 5 minutes (300 seconds)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age > 300) {
    return { valid: false, error: 'Webhook timestamp too old' };
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${rawBody}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  const expectedSignature = hmac.digest('hex');

  try {
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (sigBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: 'Signature length mismatch' };
    }
    const valid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    return { valid };
  } catch {
    return { valid: false, error: 'Signature verification failed' };
  }
}
```

**Step 3: Run type check**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/webhooks/verify.ts
git commit -m "feat: add Stripe webhook signature verification"
```

---

### Task 3: Create revenue attribution helper

**Files:**
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/lib/analytics/revenue.ts`

**Step 1: Write the attribution resolver**

This module resolves which GTM channel a Stripe customer came from.

```typescript
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logging/logger';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface AttributionResult {
  lead_id: string | null;
  attribution_channel: string;
}

/**
 * Resolve the GTM channel that brought a Stripe customer.
 * Priority: leads table (by email) → bootcamp_students → fallback 'unknown'
 */
export async function resolveAttribution(
  tenantId: string,
  email: string,
  stripeCustomerId?: string
): Promise<AttributionResult> {
  const supabase = getSupabase();

  // 1. Check leads table by email
  const { data: lead } = await supabase
    .from('leads')
    .select('id, source')
    .eq('tenant_id', tenantId)
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lead?.source) {
    return { lead_id: lead.id, attribution_channel: lead.source };
  }

  // 2. Check opt_in_data source on leads table
  const { data: leadWithOptIn } = await supabase
    .from('leads')
    .select('id, opt_in_data')
    .eq('tenant_id', tenantId)
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (leadWithOptIn?.opt_in_data?.source) {
    return {
      lead_id: leadWithOptIn.id,
      attribution_channel: leadWithOptIn.opt_in_data.source,
    };
  }

  // 3. Check bootcamp_students by stripe_customer_id
  if (stripeCustomerId) {
    const { data: student } = await supabase
      .from('bootcamp_students')
      .select('id, payment_source')
      .eq('stripe_customer_id', stripeCustomerId)
      .limit(1)
      .single();

    if (student) {
      return {
        lead_id: null,
        attribution_channel: student.payment_source || 'organic',
      };
    }
  }

  // 4. Fallback
  logger.info('Revenue attribution: no match found', { email, stripeCustomerId });
  return { lead_id: null, attribution_channel: 'unknown' };
}

/**
 * Map a Stripe product/price to a human-readable name and category.
 */
export function classifyProduct(
  productName?: string,
  priceAmount?: number
): { name: string; category: string } {
  if (!productName) return { name: 'Unknown', category: 'other' };

  const lower = productName.toLowerCase();

  // Bootcamp products
  if (lower.includes('bootcamp') || lower.includes('linkedin')) {
    return { name: productName, category: 'bootcamp' };
  }

  // Infrastructure provisioning
  if (lower.includes('starter') || lower.includes('growth') || lower.includes('scale')) {
    return { name: productName, category: 'infrastructure' };
  }

  // SaaS / Lead magnet
  if (lower.includes('magnet') || lower.includes('saas') || lower.includes('pro')) {
    return { name: productName, category: 'saas' };
  }

  return { name: productName, category: 'other' };
}
```

**Step 2: Run type check**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/lib/analytics/revenue.ts
git commit -m "feat: add revenue attribution resolver for Stripe→channel mapping"
```

---

### Task 4: Create Stripe webhook handler

**Files:**
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/webhooks/stripe/route.ts`

**Step 1: Write the webhook handler**

Follow the established webhook pattern (see PlusVibe handler at `src/app/api/webhooks/plusvibe/route.ts`).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyStripeWebhook } from '@/lib/webhooks/verify';
import { logger } from '@/lib/logging/logger';
import { getTenantId } from '@/lib/auth/tenant';
import { resolveAttribution, classifyProduct } from '@/lib/analytics/revenue';
import { captureApiError, setWebhookContext } from '@/lib/sentry';
import { checkRateLimit } from '@/lib/webhooks/rate-limit';
import { claimWebhookEvent } from '@/lib/webhooks/idempotency';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'invoice.paid',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'charge.refunded',
]);

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);

    // Rate limit
    const rateLimit = checkRateLimit(request, {
      maxRequests: 100,
      windowMs: 60_000,
      prefix: 'webhook:stripe',
    });
    if (rateLimit) return rateLimit;

    const body = await request.text();
    setWebhookContext({ service: 'stripe', tenantId });

    // Verify signature
    const verification = await verifyStripeWebhook(request, body);
    if (!verification.valid) {
      logger.warn('Stripe webhook verification failed', { error: verification.error });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.type as string;
    const eventId = event.id as string;

    // Skip unhandled events
    if (!HANDLED_EVENTS.has(eventType)) {
      return NextResponse.json({ success: true, action: 'ignored' });
    }

    // Idempotency check
    const claimed = await claimWebhookEvent(eventId);
    if (!claimed) {
      return NextResponse.json({ success: true, action: 'duplicate' });
    }

    const supabase = getSupabase();
    const obj = event.data.object;

    // Extract customer email
    const customerEmail =
      obj.customer_email ||
      obj.receipt_email ||
      obj.billing_details?.email ||
      obj.customer_details?.email ||
      null;

    const stripeCustomerId = obj.customer || null;

    // Resolve attribution
    const attribution = customerEmail
      ? await resolveAttribution(tenantId, customerEmail, stripeCustomerId)
      : { lead_id: null, attribution_channel: 'unknown' };

    // Process based on event type
    if (eventType === 'checkout.session.completed') {
      const amountCents = obj.amount_total || 0;
      const product = classifyProduct(obj.metadata?.product_name, amountCents);

      await supabase.from('revenue_events').insert({
        tenant_id: tenantId,
        stripe_event_id: eventId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: obj.subscription || null,
        event_type: obj.subscription ? 'subscription_created' : 'payment',
        amount_cents: amountCents,
        currency: obj.currency || 'usd',
        product_name: product.name,
        product_category: product.category,
        is_recurring: !!obj.subscription,
        lead_id: attribution.lead_id,
        customer_email: customerEmail,
        attribution_channel: attribution.attribution_channel,
        mrr_impact_cents: obj.subscription ? amountCents : 0,
        stripe_created_at: new Date(event.created * 1000).toISOString(),
      });
    }

    if (eventType === 'invoice.paid') {
      const amountCents = obj.amount_paid || 0;
      const product = classifyProduct(
        obj.lines?.data?.[0]?.description,
        amountCents
      );

      await supabase.from('revenue_events').insert({
        tenant_id: tenantId,
        stripe_event_id: eventId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: obj.subscription || null,
        stripe_invoice_id: obj.id,
        event_type: 'payment',
        amount_cents: amountCents,
        currency: obj.currency || 'usd',
        product_name: product.name,
        product_category: product.category,
        is_recurring: !!obj.subscription,
        lead_id: attribution.lead_id,
        customer_email: customerEmail,
        attribution_channel: attribution.attribution_channel,
        mrr_impact_cents: 0, // MRR tracked via subscription events
        stripe_created_at: new Date(event.created * 1000).toISOString(),
      });
    }

    if (eventType === 'customer.subscription.deleted') {
      // Find the original subscription amount for MRR impact
      const { data: originalEvent } = await supabase
        .from('revenue_events')
        .select('amount_cents')
        .eq('stripe_subscription_id', obj.id)
        .eq('event_type', 'subscription_created')
        .limit(1)
        .single();

      const mrrImpact = -(originalEvent?.amount_cents || 0);

      await supabase.from('revenue_events').insert({
        tenant_id: tenantId,
        stripe_event_id: eventId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: obj.id,
        event_type: 'subscription_cancelled',
        amount_cents: 0,
        currency: obj.currency || 'usd',
        product_name: obj.metadata?.product_name || null,
        product_category: null,
        is_recurring: false,
        lead_id: attribution.lead_id,
        customer_email: customerEmail,
        attribution_channel: attribution.attribution_channel,
        mrr_impact_cents: mrrImpact,
        stripe_created_at: new Date(event.created * 1000).toISOString(),
      });
    }

    if (eventType === 'charge.refunded') {
      const refundAmount = obj.amount_refunded || 0;

      await supabase.from('revenue_events').insert({
        tenant_id: tenantId,
        stripe_event_id: eventId,
        stripe_customer_id: stripeCustomerId,
        stripe_charge_id: obj.id,
        event_type: 'refund',
        amount_cents: -refundAmount,
        currency: obj.currency || 'usd',
        product_name: null,
        product_category: null,
        is_recurring: false,
        lead_id: attribution.lead_id,
        customer_email: customerEmail,
        attribution_channel: attribution.attribution_channel,
        mrr_impact_cents: 0,
        stripe_created_at: new Date(event.created * 1000).toISOString(),
      });
    }

    logger.info('Stripe webhook processed', {
      eventType,
      eventId,
      channel: attribution.attribution_channel,
      amountCents: obj.amount_total || obj.amount_paid || 0,
    });

    return NextResponse.json({ success: true, action: 'processed' });
  } catch (error) {
    captureApiError(error, 'stripe-webhook');
    logger.error('Stripe webhook error', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 2: Add CSRF exemption in middleware**

Open `/Users/timlife/Documents/claude code/gtm-system/src/middleware.ts`. Verify that `/api/webhooks/*` is already exempted from CSRF (it should be based on existing pattern). No change expected.

**Step 3: Run type check**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat: add Stripe webhook handler with revenue attribution"
```

---

### Task 5: Add revenue and unit economics analytics endpoints

**Files:**
- Modify: `/Users/timlife/Documents/claude code/gtm-system/src/lib/analytics/types.ts` (add RevenueMetrics, UnitEconomics, CommandCenterData types)
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/lib/analytics/revenue-metrics.ts` (query functions)
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/analytics/revenue/route.ts`
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/analytics/unit-economics/route.ts`
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/analytics/command-center/route.ts`

**Step 1: Add types to types.ts**

Append to `/Users/timlife/Documents/claude code/gtm-system/src/lib/analytics/types.ts`:

```typescript
// ─── Revenue Metrics ─────────────────────────────────────────────────

export interface RevenueMetrics {
  total_revenue_cents: number;
  mrr_cents: number;
  arr_cents: number;
  new_revenue_cents: number;
  recurring_revenue_cents: number;
  refund_cents: number;
  by_channel: ChannelRevenue[];
  by_product: ProductRevenue[];
  by_period: PeriodRevenue[];
}

export interface ChannelRevenue {
  channel: string;
  revenue_cents: number;
  customer_count: number;
  avg_revenue_per_customer_cents: number;
}

export interface ProductRevenue {
  product_name: string;
  product_category: string;
  revenue_cents: number;
  transaction_count: number;
}

export interface PeriodRevenue {
  date: string;  // YYYY-MM-DD or YYYY-WXX or YYYY-MM depending on granularity
  revenue_cents: number;
  new_revenue_cents: number;
  recurring_revenue_cents: number;
}

// ─── Unit Economics ──────────────────────────────────────────────────

export interface UnitEconomics {
  blended_cac_cents: number | null;
  ltv_estimate_cents: number | null;
  payback_period_months: number | null;
  by_channel: ChannelUnitEconomics[];
}

export interface ChannelUnitEconomics {
  channel: string;
  cost_cents: number;
  revenue_cents: number;
  new_customers: number;
  cac_cents: number | null;
  roi_percentage: number | null;
}

// ─── Command Center (combined) ───────────────────────────────────────

export interface CommandCenterData {
  period: {
    from: string;
    to: string;
    granularity: Granularity;
  };
  kpis: {
    total_revenue_cents: number;
    mrr_cents: number;
    blended_cac_cents: number | null;
    best_channel: string | null;
    pipeline_value_cents: number;
  };
  revenue: RevenueMetrics;
  funnel: FunnelMetrics;
  channels: ChannelAttribution;
  unit_economics: UnitEconomics;
  alerts: CommandCenterAlert[];
}

export interface CommandCenterAlert {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action_label?: string;
  action_url?: string;
}
```

**Step 2: Create revenue-metrics.ts query functions**

Create `/Users/timlife/Documents/claude code/gtm-system/src/lib/analytics/revenue-metrics.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type {
  DateRange,
  RevenueMetrics,
  UnitEconomics,
  CommandCenterAlert,
  ChannelRevenue,
  ProductRevenue,
  PeriodRevenue,
  ChannelUnitEconomics,
} from './types';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getRevenueMetrics(
  tenantId: string,
  range: DateRange
): Promise<RevenueMetrics> {
  const supabase = getSupabase();

  const { data: events } = await supabase
    .from('revenue_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('stripe_created_at', range.from.toISOString())
    .lte('stripe_created_at', range.to.toISOString())
    .order('stripe_created_at', { ascending: true });

  const rows = events || [];

  // Totals
  const payments = rows.filter(r => r.event_type === 'payment' || r.event_type === 'subscription_created');
  const refunds = rows.filter(r => r.event_type === 'refund');
  const totalRevenue = payments.reduce((sum, r) => sum + r.amount_cents, 0);
  const refundTotal = Math.abs(refunds.reduce((sum, r) => sum + r.amount_cents, 0));
  const newRevenue = payments.filter(r => !r.is_recurring).reduce((sum, r) => sum + r.amount_cents, 0);
  const recurringRevenue = payments.filter(r => r.is_recurring).reduce((sum, r) => sum + r.amount_cents, 0);

  // MRR: sum of all mrr_impact_cents
  const mrrCents = rows.reduce((sum, r) => sum + (r.mrr_impact_cents || 0), 0);

  // By channel
  const channelMap = new Map<string, { revenue: number; customers: Set<string> }>();
  for (const r of payments) {
    const ch = r.attribution_channel || 'unknown';
    const entry = channelMap.get(ch) || { revenue: 0, customers: new Set() };
    entry.revenue += r.amount_cents;
    if (r.customer_email) entry.customers.add(r.customer_email);
    channelMap.set(ch, entry);
  }
  const by_channel: ChannelRevenue[] = Array.from(channelMap.entries()).map(
    ([channel, data]) => ({
      channel,
      revenue_cents: data.revenue,
      customer_count: data.customers.size,
      avg_revenue_per_customer_cents:
        data.customers.size > 0 ? Math.round(data.revenue / data.customers.size) : 0,
    })
  ).sort((a, b) => b.revenue_cents - a.revenue_cents);

  // By product
  const productMap = new Map<string, { category: string; revenue: number; count: number }>();
  for (const r of payments) {
    const key = r.product_name || 'Unknown';
    const entry = productMap.get(key) || { category: r.product_category || 'other', revenue: 0, count: 0 };
    entry.revenue += r.amount_cents;
    entry.count += 1;
    productMap.set(key, entry);
  }
  const by_product: ProductRevenue[] = Array.from(productMap.entries()).map(
    ([name, data]) => ({
      product_name: name,
      product_category: data.category,
      revenue_cents: data.revenue,
      transaction_count: data.count,
    })
  ).sort((a, b) => b.revenue_cents - a.revenue_cents);

  // By day
  const dayMap = new Map<string, { total: number; new_rev: number; recurring: number }>();
  for (const r of payments) {
    const day = r.stripe_created_at.substring(0, 10);
    const entry = dayMap.get(day) || { total: 0, new_rev: 0, recurring: 0 };
    entry.total += r.amount_cents;
    if (r.is_recurring) entry.recurring += r.amount_cents;
    else entry.new_rev += r.amount_cents;
    dayMap.set(day, entry);
  }
  const by_period: PeriodRevenue[] = Array.from(dayMap.entries())
    .map(([date, data]) => ({
      date,
      revenue_cents: data.total,
      new_revenue_cents: data.new_rev,
      recurring_revenue_cents: data.recurring,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_revenue_cents: totalRevenue,
    mrr_cents: mrrCents,
    arr_cents: mrrCents * 12,
    new_revenue_cents: newRevenue,
    recurring_revenue_cents: recurringRevenue,
    refund_cents: refundTotal,
    by_channel,
    by_product,
    by_period,
  };
}

export async function getUnitEconomics(
  tenantId: string,
  range: DateRange
): Promise<UnitEconomics> {
  const supabase = getSupabase();

  // Get costs
  const { data: costs } = await supabase
    .from('channel_costs')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('period_start', range.from.toISOString().substring(0, 10))
    .lte('period_end', range.to.toISOString().substring(0, 10));

  // Get revenue by channel
  const { data: events } = await supabase
    .from('revenue_events')
    .select('attribution_channel, amount_cents, customer_email, event_type')
    .eq('tenant_id', tenantId)
    .in('event_type', ['payment', 'subscription_created'])
    .gte('stripe_created_at', range.from.toISOString())
    .lte('stripe_created_at', range.to.toISOString());

  const costRows = costs || [];
  const revenueRows = events || [];

  // Aggregate costs by channel
  const costByChannel = new Map<string, number>();
  for (const c of costRows) {
    costByChannel.set(c.channel, (costByChannel.get(c.channel) || 0) + c.amount_cents);
  }

  // Aggregate revenue + customers by channel
  const revenueByChannel = new Map<string, { revenue: number; customers: Set<string> }>();
  for (const r of revenueRows) {
    const ch = r.attribution_channel || 'unknown';
    const entry = revenueByChannel.get(ch) || { revenue: 0, customers: new Set() };
    entry.revenue += r.amount_cents;
    if (r.customer_email) entry.customers.add(r.customer_email);
    revenueByChannel.set(ch, entry);
  }

  // All channels (union of cost and revenue channels)
  const allChannels = new Set([...costByChannel.keys(), ...revenueByChannel.keys()]);

  const by_channel: ChannelUnitEconomics[] = Array.from(allChannels).map(channel => {
    const cost = costByChannel.get(channel) || 0;
    const rev = revenueByChannel.get(channel);
    const revenue = rev?.revenue || 0;
    const newCustomers = rev?.customers.size || 0;
    const cac = newCustomers > 0 ? Math.round(cost / newCustomers) : null;
    const roi = cost > 0 ? Math.round(((revenue - cost) / cost) * 100) : null;

    return { channel, cost_cents: cost, revenue_cents: revenue, new_customers: newCustomers, cac_cents: cac, roi_percentage: roi };
  });

  // Blended
  const totalCost = costRows.reduce((sum, c) => sum + c.amount_cents, 0);
  const totalCustomers = new Set(revenueRows.map(r => r.customer_email).filter(Boolean)).size;
  const totalRevenue = revenueRows.reduce((sum, r) => sum + r.amount_cents, 0);

  const blendedCac = totalCustomers > 0 ? Math.round(totalCost / totalCustomers) : null;
  const ltv = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : null;
  const payback = blendedCac && ltv && ltv > 0
    ? Math.round((blendedCac / (ltv / 12)) * 10) / 10
    : null;

  return { blended_cac_cents: blendedCac, ltv_estimate_cents: ltv, payback_period_months: payback, by_channel };
}

export async function generateAlerts(
  tenantId: string,
  range: DateRange
): Promise<CommandCenterAlert[]> {
  const supabase = getSupabase();
  const alerts: CommandCenterAlert[] = [];

  // Check for revenue trend (compare last 7 days vs prior 7 days)
  const now = range.to;
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const { data: recentRevenue } = await supabase
    .from('revenue_events')
    .select('amount_cents')
    .eq('tenant_id', tenantId)
    .in('event_type', ['payment', 'subscription_created'])
    .gte('stripe_created_at', sevenDaysAgo.toISOString())
    .lte('stripe_created_at', now.toISOString());

  const { data: priorRevenue } = await supabase
    .from('revenue_events')
    .select('amount_cents')
    .eq('tenant_id', tenantId)
    .in('event_type', ['payment', 'subscription_created'])
    .gte('stripe_created_at', fourteenDaysAgo.toISOString())
    .lt('stripe_created_at', sevenDaysAgo.toISOString());

  const recentTotal = (recentRevenue || []).reduce((s, r) => s + r.amount_cents, 0);
  const priorTotal = (priorRevenue || []).reduce((s, r) => s + r.amount_cents, 0);

  if (priorTotal > 0 && recentTotal < priorTotal * 0.7) {
    const dropPct = Math.round((1 - recentTotal / priorTotal) * 100);
    alerts.push({
      severity: 'warning',
      title: `Revenue dropped ${dropPct}% this week`,
      description: `$${(recentTotal / 100).toFixed(0)} vs $${(priorTotal / 100).toFixed(0)} prior week.`,
    });
  }

  // Check for stuck pipeline leads
  const { count: stuckCount } = await supabase
    .from('reply_pipeline')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .lt('created_at', sevenDaysAgo.toISOString());

  if (stuckCount && stuckCount > 0) {
    alerts.push({
      severity: 'critical',
      title: `${stuckCount} pipeline leads stuck > 7 days`,
      description: 'These leads have been in pending status for over a week.',
      action_label: 'View pipeline',
      action_url: '/portal/campaigns',
    });
  }

  // Check for meetings with no close
  const { data: recentMeetings } = await supabase
    .from('leads')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'meeting_booked')
    .lt('updated_at', sevenDaysAgo.toISOString());

  if (recentMeetings && recentMeetings.length >= 3) {
    alerts.push({
      severity: 'info',
      title: `${recentMeetings.length} meetings with no close yet`,
      description: 'Follow up on meetings booked more than 7 days ago.',
    });
  }

  return alerts;
}
```

**Step 3: Create the three API route files**

Create `/Users/timlife/Documents/claude code/gtm-system/src/app/api/analytics/revenue/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/tenant';
import { getRevenueMetrics } from '@/lib/analytics/revenue-metrics';
import { parseDateRange } from '@/lib/analytics/utils';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const range = parseDateRange(request.nextUrl.searchParams);
    const revenue = await getRevenueMetrics(tenantId, range);

    return NextResponse.json(revenue);
  } catch (error) {
    logger.error('Revenue analytics error', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Create `/Users/timlife/Documents/claude code/gtm-system/src/app/api/analytics/unit-economics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/tenant';
import { getUnitEconomics } from '@/lib/analytics/revenue-metrics';
import { parseDateRange } from '@/lib/analytics/utils';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const range = parseDateRange(request.nextUrl.searchParams);
    const economics = await getUnitEconomics(tenantId, range);

    return NextResponse.json(economics);
  } catch (error) {
    logger.error('Unit economics error', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Create `/Users/timlife/Documents/claude code/gtm-system/src/app/api/analytics/command-center/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/tenant';
import {
  getRevenueMetrics,
  getUnitEconomics,
  generateAlerts,
} from '@/lib/analytics/revenue-metrics';
import {
  getFunnelMetrics,
  getChannelAttribution,
} from '@/lib/analytics/metrics';
import { parseDateRange } from '@/lib/analytics/utils';
import { logger } from '@/lib/logging/logger';
import type { Granularity, CommandCenterData } from '@/lib/analytics/types';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = parseDateRange(searchParams);
    const granularity: Granularity =
      (searchParams.get('granularity') as Granularity) || 'day';

    // Fetch everything in parallel
    const [revenue, funnel, channels, unitEconomics, alerts] = await Promise.all([
      getRevenueMetrics(tenantId, range),
      getFunnelMetrics(tenantId, range),
      getChannelAttribution(tenantId, range),
      getUnitEconomics(tenantId, range),
      generateAlerts(tenantId, range),
    ]);

    // Find best channel by revenue
    const bestChannel =
      revenue.by_channel.length > 0 ? revenue.by_channel[0].channel : null;

    // Pipeline value estimate (leads in active stages × avg deal value)
    const activeStages = funnel.stages.filter(s =>
      ['meeting_booked', 'qualified'].includes(s.name)
    );
    const avgDealValue = revenue.total_revenue_cents > 0 && channels.channels.length > 0
      ? Math.round(
          revenue.total_revenue_cents /
          channels.channels.reduce((sum, c) => sum + c.closed, 0) || 1
        )
      : 0;
    const pipelineValue = activeStages.reduce((sum, s) => sum + s.count, 0) * avgDealValue;

    const response: CommandCenterData = {
      period: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        granularity,
      },
      kpis: {
        total_revenue_cents: revenue.total_revenue_cents,
        mrr_cents: revenue.mrr_cents,
        blended_cac_cents: unitEconomics.blended_cac_cents,
        best_channel: bestChannel,
        pipeline_value_cents: pipelineValue,
      },
      revenue,
      funnel,
      channels,
      unit_economics: unitEconomics,
      alerts,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Command center error', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 4: Run type check**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/lib/analytics/types.ts src/lib/analytics/revenue-metrics.ts \
  src/app/api/analytics/revenue/route.ts \
  src/app/api/analytics/unit-economics/route.ts \
  src/app/api/analytics/command-center/route.ts
git commit -m "feat: add revenue analytics, unit economics, and command center endpoints"
```

---

### Task 6: Add CORS for command-center routes in middleware

**Files:**
- Modify: `/Users/timlife/Documents/claude code/gtm-system/src/middleware.ts`

**Step 1: Read current middleware.ts**

Read the full file to see where CORS headers are applied.

**Step 2: Add CORS for `/api/analytics/command-center` and `/api/analytics/revenue` and `/api/analytics/unit-economics`**

Follow the existing `infraCorsHeaders()` pattern. The analytics routes may already be covered if there's a broad `/api/analytics/*` CORS rule. If not, add one:

- Add `analyticsCorsHeaders()` function (or extend existing CORS to cover `/api/analytics/*`)
- Ensure `copy-of-gtm-os.vercel.app`, `modernagencysales.com`, `gtmconductor.com` are in allowed origins
- Handle OPTIONS preflight for these routes

**Step 3: Run type check and commit**

```bash
npx tsc --noEmit
git add src/middleware.ts
git commit -m "feat: add CORS for analytics command center routes"
```

---

### Task 7: Create Stripe backfill Trigger.dev task

**Files:**
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/trigger/backfill-stripe-revenue.ts`

**Step 1: Write the backfill task**

```typescript
import { task, logger } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { resolveAttribution, classifyProduct } from '@/lib/analytics/revenue';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const backfillStripeRevenue = task({
  id: 'backfill-stripe-revenue',
  run: async (payload: { tenant_id: string; months_back?: number }) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });
    const supabase = getSupabase();
    const tenantId = payload.tenant_id;
    const monthsBack = payload.months_back || 12;

    const since = Math.floor(
      new Date(Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000).getTime() / 1000
    );

    let processed = 0;
    let skipped = 0;

    // Page through all charges
    for await (const charge of stripe.charges.list({
      created: { gte: since },
      limit: 100,
    })) {
      if (charge.status !== 'succeeded') continue;

      const email = charge.receipt_email || charge.billing_details?.email || null;
      const attribution = email
        ? await resolveAttribution(tenantId, email, charge.customer as string)
        : { lead_id: null, attribution_channel: 'unknown' };

      const product = classifyProduct(charge.description || undefined, charge.amount);

      const { error } = await supabase.from('revenue_events').upsert(
        {
          tenant_id: tenantId,
          stripe_event_id: `backfill_charge_${charge.id}`,
          stripe_customer_id: charge.customer as string,
          stripe_charge_id: charge.id,
          event_type: 'payment',
          amount_cents: charge.amount,
          currency: charge.currency,
          product_name: product.name,
          product_category: product.category,
          is_recurring: !!charge.invoice,
          lead_id: attribution.lead_id,
          customer_email: email,
          attribution_channel: attribution.attribution_channel,
          mrr_impact_cents: 0,
          stripe_created_at: new Date(charge.created * 1000).toISOString(),
        },
        { onConflict: 'stripe_event_id' }
      );

      if (error) {
        logger.warn('Backfill upsert error', { chargeId: charge.id, error: error.message });
        skipped++;
      } else {
        processed++;
      }

      // Rate limit: ~2 per second to be safe
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info('Stripe backfill complete', { processed, skipped });
    return { processed, skipped };
  },
});
```

**Step 2: Run type check**

Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npx tsc --noEmit`

Note: This task requires `stripe` npm package. Install if not present:
Run: `cd "/Users/timlife/Documents/claude code/gtm-system" && npm install stripe`

**Step 3: Commit**

```bash
git add src/trigger/backfill-stripe-revenue.ts package.json package-lock.json
git commit -m "feat: add Stripe revenue backfill Trigger.dev task"
```

---

## Phase 2: Command Center UI (copy-of-gtm-os)

### Task 8: Create Command Center types

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/types/command-center-types.ts`

**Step 1: Write the type definitions**

Mirror the gtm-system types for the frontend:

```typescript
export interface CommandCenterData {
  period: {
    from: string;
    to: string;
    granularity: 'day' | 'week' | 'month';
  };
  kpis: {
    total_revenue_cents: number;
    mrr_cents: number;
    blended_cac_cents: number | null;
    best_channel: string | null;
    pipeline_value_cents: number;
  };
  revenue: RevenueMetrics;
  funnel: FunnelMetrics;
  channels: ChannelAttribution;
  unit_economics: UnitEconomics;
  alerts: CommandCenterAlert[];
}

export interface RevenueMetrics {
  total_revenue_cents: number;
  mrr_cents: number;
  arr_cents: number;
  new_revenue_cents: number;
  recurring_revenue_cents: number;
  refund_cents: number;
  by_channel: ChannelRevenue[];
  by_product: ProductRevenue[];
  by_period: PeriodRevenue[];
}

export interface ChannelRevenue {
  channel: string;
  revenue_cents: number;
  customer_count: number;
  avg_revenue_per_customer_cents: number;
}

export interface ProductRevenue {
  product_name: string;
  product_category: string;
  revenue_cents: number;
  transaction_count: number;
}

export interface PeriodRevenue {
  date: string;
  revenue_cents: number;
  new_revenue_cents: number;
  recurring_revenue_cents: number;
}

export interface FunnelMetrics {
  stages: { name: string; count: number; percentage_of_total: number }[];
  conversion_rates: { from_stage: string; to_stage: string; rate: number; count_from: number; count_to: number }[];
  overall_conversion_rate: number;
}

export interface ChannelAttribution {
  channels: ChannelMetrics[];
  best_for_leads: string | null;
  best_for_meetings: string | null;
  best_for_conversion: string | null;
}

export interface ChannelMetrics {
  channel: string;
  leads: number;
  qualified: number;
  meetings_booked: number;
  closed: number;
  conversion_rate: number;
  lead_to_meeting_rate: number;
}

export interface UnitEconomics {
  blended_cac_cents: number | null;
  ltv_estimate_cents: number | null;
  payback_period_months: number | null;
  by_channel: {
    channel: string;
    cost_cents: number;
    revenue_cents: number;
    new_customers: number;
    cac_cents: number | null;
    roi_percentage: number | null;
  }[];
}

export interface CommandCenterAlert {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action_label?: string;
  action_url?: string;
}
```

**Step 2: Commit**

```bash
git add types/command-center-types.ts
git commit -m "feat: add Command Center TypeScript types"
```

---

### Task 9: Create Command Center service layer

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/services/command-center.ts`

**Step 1: Write the service**

Follow the pattern from `services/supabase.ts` (explicit fetching, error handling, return empty on failure):

```typescript
import type { CommandCenterData } from '../types/command-center-types';

const GTM_SYSTEM_URL =
  import.meta.env.VITE_GTM_SYSTEM_URL ||
  'https://gtm-system-production.up.railway.app';

export async function fetchCommandCenterData(
  tenantId: string,
  from?: string,
  to?: string,
  granularity?: 'day' | 'week' | 'month'
): Promise<CommandCenterData | null> {
  try {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (granularity) params.set('granularity', granularity);

    const response = await fetch(
      `${GTM_SYSTEM_URL}/api/analytics/command-center?${params}`,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      console.error('Command center fetch failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch command center data:', error);
    return null;
  }
}

/** Format cents to dollar string */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

/** Format channel name for display */
export function formatChannelName(channel: string): string {
  const map: Record<string, string> = {
    heyreach: 'LinkedIn (HeyReach)',
    plusvibe: 'Cold Email (PlusVibe)',
    organic: 'Organic / Inbound',
    magnetlab: 'Lead Magnets',
    blueprint: 'Blueprint Form',
    unknown: 'Unattributed',
  };
  return map[channel] || channel.charAt(0).toUpperCase() + channel.slice(1);
}
```

**Step 2: Commit**

```bash
git add services/command-center.ts
git commit -m "feat: add Command Center service layer for gtm-system API"
```

---

### Task 10: Create Command Center page component

**Files:**
- Create: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/gc/command-center/CommandCenter.tsx`

**Step 1: Write the main component**

This is the largest UI task. Build it as a single component with sub-sections. Uses Recharts (already installed — used by CampaignAnalytics).

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, Target, Users,
  AlertTriangle, AlertCircle, Info, Zap, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingState } from '../../shared/LoadingSpinner';
import {
  fetchCommandCenterData,
  formatCents,
  formatChannelName,
} from '../../../services/command-center';
import type { CommandCenterData } from '../../../types/command-center-types';

const TENANT_ID = '7a3474f9-dd56-4ce0-a8b2-0372452ba90e';

const CHANNEL_COLORS: Record<string, string> = {
  heyreach: '#3b82f6',
  plusvibe: '#8b5cf6',
  organic: '#22c55e',
  magnetlab: '#f59e0b',
  blueprint: '#06b6d4',
  unknown: '#94a3b8',
};

const CommandCenter: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();
    const granularity = period === '7d' ? 'day' : period === '30d' ? 'week' : 'month';

    const result = await fetchCommandCenterData(TENANT_ID, from, to, granularity);
    setData(result);
    setLoading(false);
  };

  if (loading) return <LoadingState message="Loading Command Center..." />;
  if (!data) return <div className="text-center py-12 text-slate-500">Failed to load data.</div>;

  const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-6">
      {/* Header + Period Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold ${textPrimary}`}>Command Center</h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>
            Revenue, pipeline, and GTM performance at a glance
          </p>
        </div>
        <div className={`inline-flex rounded-lg p-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm'
                  : isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Hero KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          label="Total Revenue"
          value={formatCents(data.kpis.total_revenue_cents)}
          icon={DollarSign}
          isDarkMode={isDarkMode}
          accent="text-green-500"
        />
        <KPICard
          label="MRR"
          value={formatCents(data.kpis.mrr_cents)}
          icon={TrendingUp}
          isDarkMode={isDarkMode}
          accent="text-blue-500"
        />
        <KPICard
          label="Blended CAC"
          value={data.kpis.blended_cac_cents != null ? formatCents(data.kpis.blended_cac_cents) : '—'}
          icon={Target}
          isDarkMode={isDarkMode}
          accent="text-orange-500"
        />
        <KPICard
          label="Best Channel"
          value={data.kpis.best_channel ? formatChannelName(data.kpis.best_channel) : '—'}
          icon={Zap}
          isDarkMode={isDarkMode}
          accent="text-violet-500"
        />
        <KPICard
          label="Pipeline Value"
          value={formatCents(data.kpis.pipeline_value_cents)}
          icon={Users}
          isDarkMode={isDarkMode}
          accent="text-cyan-500"
        />
      </div>

      {/* Row 2: Revenue by Channel (Stacked Bar Chart) */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Revenue by Channel</h2>
        {data.revenue.by_period.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenue.by_period}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`}
                tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
              />
              <Tooltip
                formatter={(value: number) => [`$${(value / 100).toFixed(2)}`, '']}
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="new_revenue_cents" name="One-time" fill="#22c55e" stackId="rev" />
              <Bar dataKey="recurring_revenue_cents" name="Recurring" fill="#3b82f6" stackId="rev" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={`text-center py-8 ${textSecondary}`}>No revenue data for this period.</p>
        )}

        {/* Channel breakdown table */}
        {data.revenue.by_channel.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <th className={`text-left py-2 font-medium ${textSecondary}`}>Channel</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Revenue</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Customers</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Avg/Customer</th>
                </tr>
              </thead>
              <tbody>
                {data.revenue.by_channel.map((ch) => (
                  <tr key={ch.channel} className={`border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <td className={`py-2 ${textPrimary}`}>
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: CHANNEL_COLORS[ch.channel] || '#94a3b8' }}
                      />
                      {formatChannelName(ch.channel)}
                    </td>
                    <td className={`text-right py-2 font-medium ${textPrimary}`}>{formatCents(ch.revenue_cents)}</td>
                    <td className={`text-right py-2 ${textSecondary}`}>{ch.customer_count}</td>
                    <td className={`text-right py-2 ${textSecondary}`}>{formatCents(ch.avg_revenue_per_customer_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 3: Full Funnel */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Full Funnel</h2>
        {data.funnel.stages.length > 0 ? (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-1/2">
              <ResponsiveContainer width="100%" height={250}>
                <FunnelChart>
                  <Tooltip formatter={(value: number) => [value, '']} />
                  <Funnel
                    dataKey="count"
                    data={data.funnel.stages.map((s, i) => ({
                      name: s.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      count: s.count,
                      fill: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#22c55e', '#f59e0b'][i % 6],
                    }))}
                  >
                    <LabelList position="right" fill={isDarkMode ? '#e2e8f0' : '#334155'} fontSize={12} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-2">
              {data.funnel.conversion_rates.map((cr) => (
                <div key={`${cr.from_stage}-${cr.to_stage}`} className="flex items-center justify-between">
                  <span className={`text-sm ${textSecondary}`}>
                    {cr.from_stage.replace(/_/g, ' ')} <ArrowRight className="w-3 h-3 inline mx-1" /> {cr.to_stage.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-sm font-medium ${cr.rate > 20 ? 'text-green-500' : cr.rate > 10 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {cr.rate.toFixed(1)}%
                  </span>
                </div>
              ))}
              <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <span className={`text-sm font-medium ${textPrimary}`}>
                  Overall: {data.funnel.overall_conversion_rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className={`text-center py-8 ${textSecondary}`}>No funnel data for this period.</p>
        )}
      </div>

      {/* Row 4: Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className={`text-lg font-semibold ${textPrimary}`}>Alerts</h2>
          {data.alerts.map((alert, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 flex items-start gap-3 ${
                alert.severity === 'critical'
                  ? isDarkMode ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                  : alert.severity === 'warning'
                    ? isDarkMode ? 'border-yellow-800 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'
                    : isDarkMode ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'
              }`}
            >
              {alert.severity === 'critical' ? (
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              ) : alert.severity === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${textPrimary}`}>{alert.title}</p>
                <p className={`text-xs mt-0.5 ${textSecondary}`}>{alert.description}</p>
              </div>
              {alert.action_label && (
                <button className="text-xs font-medium text-violet-500 hover:text-violet-400 shrink-0">
                  {alert.action_label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Row 5: Channel ROI */}
      {data.unit_economics.by_channel.length > 0 && (
        <div className={`rounded-xl border p-6 ${cardBg}`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Channel ROI</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <th className={`text-left py-2 font-medium ${textSecondary}`}>Channel</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Cost</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Revenue</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Customers</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>CAC</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.unit_economics.by_channel.map((ch) => (
                  <tr key={ch.channel} className={`border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <td className={`py-2 ${textPrimary}`}>{formatChannelName(ch.channel)}</td>
                    <td className={`text-right py-2 ${textSecondary}`}>{formatCents(ch.cost_cents)}</td>
                    <td className={`text-right py-2 font-medium ${textPrimary}`}>{formatCents(ch.revenue_cents)}</td>
                    <td className={`text-right py-2 ${textSecondary}`}>{ch.new_customers}</td>
                    <td className={`text-right py-2 ${textSecondary}`}>
                      {ch.cac_cents != null ? formatCents(ch.cac_cents) : '—'}
                    </td>
                    <td className={`text-right py-2 font-medium ${
                      ch.roi_percentage != null && ch.roi_percentage > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {ch.roi_percentage != null ? `${ch.roi_percentage}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  isDarkMode: boolean;
  accent: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon: Icon, isDarkMode, accent }) => (
  <div className={`rounded-xl border p-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${accent}`} />
      <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
    </div>
    <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
  </div>
);

export default CommandCenter;
```

**Step 2: Commit**

```bash
git add components/gc/command-center/CommandCenter.tsx
git commit -m "feat: add Command Center dashboard page component"
```

---

### Task 11: Wire Command Center into router

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/App.tsx`

**Step 1: Add lazy import**

After the existing GC portal lazy imports (around line 23), add:

```typescript
const CommandCenter = lazy(() => import('./components/gc/command-center/CommandCenter'));
```

**Step 2: Add route**

Inside the `/portal` route group (around line 129, after `resources` route), add:

```tsx
<Route path="command-center" element={<CommandCenter />} />
```

**Step 3: Run build to verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: wire Command Center into GC portal router at /portal/command-center"
```

---

### Task 12: Add Command Center link to GC sidebar/navigation

**Files:**
- Modify: `/Users/timlife/Documents/claude code/copy-of-gtm-os/components/gc/GCLayout.tsx`

**Step 1: Read GCLayout.tsx**

Read the full file to see how navigation items are defined.

**Step 2: Add Command Center nav item**

Add a new navigation item with the `BarChart3` icon (from lucide-react) pointing to `/portal/command-center`. Place it as the first item in the nav list — this is the hero feature.

**Step 3: Run build and commit**

```bash
npm run build
git add components/gc/GCLayout.tsx
git commit -m "feat: add Command Center to GC portal navigation"
```

---

## Phase 3: Deployment & Stripe Setup

### Task 13: Set environment variables and configure Stripe webhook

**Step 1: Set STRIPE_WEBHOOK_SECRET in Railway**

Use Railway MCP tools or CLI:
- `STRIPE_WEBHOOK_SECRET` — from Stripe dashboard webhook endpoint config
- `STRIPE_SECRET_KEY` — for the backfill task

**Step 2: Create Stripe webhook endpoint**

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://gtmconductor.com/api/webhooks/stripe?tenant_id=7a3474f9-dd56-4ce0-a8b2-0372452ba90e`
- Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`
- Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`

**Step 3: Set STRIPE_SECRET_KEY in Trigger.dev env**

For the backfill task:
```bash
curl -X POST "https://api.trigger.dev/api/v1/projects/proj_yymkdpugnlvvgbslvnno/envvars/prod" \
  -H "Authorization: Bearer $TRIGGER_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "STRIPE_SECRET_KEY", "value": "<your-stripe-secret-key>"}'
```

**Step 4: Deploy gtm-system**

```bash
cd "/Users/timlife/Documents/claude code/gtm-system"
git push  # triggers Railway deploy
TRIGGER_SECRET_KEY=tr_prod_Fxgn6CdrH6v2NSMVhSJL npx trigger.dev@4.3.3 deploy
```

**Step 5: Deploy copy-of-gtm-os**

```bash
cd "/Users/timlife/Documents/claude code/copy-of-gtm-os"
vercel --prod
```

**Step 6: Run backfill**

Trigger the backfill task from Trigger.dev dashboard or via SDK:
```typescript
await tasks.trigger('backfill-stripe-revenue', {
  tenant_id: '7a3474f9-dd56-4ce0-a8b2-0372452ba90e',
  months_back: 12,
});
```

---

## Phase 4: Channel Costs + Polish (follow-up)

### Task 14: Add channel cost management API

**Files:**
- Create: `/Users/timlife/Documents/claude code/gtm-system/src/app/api/analytics/channel-costs/route.ts`

GET (list costs) and POST (add cost entry). Simple CRUD for the admin to enter monthly spend per channel.

### Task 15: Add cost entry UI to Command Center

Editable cost cards in the Channel ROI section. Inline edit with save to `POST /api/analytics/channel-costs`.

### Task 16: Add action buttons to dashboard sections

Wire up the "View stuck leads", "Launch campaign", "Send follow-up" buttons to navigate to appropriate pages or trigger API calls.

---

## Summary of All Tasks

| # | Phase | Task | Repo |
|---|-------|------|------|
| 1 | Data | Create revenue_events + channel_costs migration | gtm-system |
| 2 | Data | Add Stripe webhook verification | gtm-system |
| 3 | Data | Create revenue attribution helper | gtm-system |
| 4 | Data | Create Stripe webhook handler | gtm-system |
| 5 | Data | Add analytics endpoints (revenue, unit-economics, command-center) | gtm-system |
| 6 | Data | Add CORS for new routes | gtm-system |
| 7 | Data | Create Stripe backfill Trigger.dev task | gtm-system |
| 8 | UI | Create Command Center types | copy-of-gtm-os |
| 9 | UI | Create Command Center service layer | copy-of-gtm-os |
| 10 | UI | Create Command Center page component | copy-of-gtm-os |
| 11 | UI | Wire into router | copy-of-gtm-os |
| 12 | UI | Add to GC sidebar nav | copy-of-gtm-os |
| 13 | Deploy | Set env vars + Stripe webhook + deploy + backfill | both |
| 14-16 | Polish | Channel costs CRUD + cost UI + action buttons | both |
