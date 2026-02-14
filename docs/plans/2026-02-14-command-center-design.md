# Command Center: TripleWhale for GTM

**Date**: 2026-02-14
**Status**: Approved
**Repos**: gtm-system (backend), copy-of-gtm-os (frontend)

## Problem

GTM Conductor tracks leads, campaigns, and pipeline but has no revenue visibility. There's no way to answer "which channel actually makes money?" or "what's my CAC?" Revenue lives in Stripe, pipeline data lives in Supabase, and costs are tracked nowhere. Competitors like Equals ($1,250/mo) and RevyOps offer analytics dashboards but can't take action. Our advantage: see the data AND act on it from the same screen.

## Design

### Data Layer

#### New Table: `revenue_events`

Captures every Stripe payment with channel attribution.

```sql
CREATE TABLE revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  stripe_event_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,
  event_type TEXT NOT NULL,       -- 'payment', 'subscription_created', 'subscription_cancelled', 'refund'
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  product_name TEXT,              -- 'Bootcamp', 'Starter Infra', etc.
  product_category TEXT,          -- 'bootcamp', 'infrastructure', 'saas'
  is_recurring BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES leads(id),
  customer_email TEXT,
  attribution_channel TEXT,       -- 'heyreach', 'plusvibe', 'organic', etc.
  mrr_impact_cents INTEGER,       -- +$300 for new sub, -$300 for churn, $0 for one-time
  stripe_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### New Table: `channel_costs`

Tracks spend per channel for ROI/CAC calculation.

```sql
CREATE TABLE channel_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  channel TEXT NOT NULL,
  cost_type TEXT NOT NULL,        -- 'subscription', 'usage', 'ad_spend'
  amount_cents INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Stripe Webhook Handler

**Route**: `POST /api/webhooks/stripe` in gtm-system

**Events handled**:
- `checkout.session.completed` -> new payment event
- `invoice.paid` -> recurring payment event
- `customer.subscription.created` -> subscription + MRR impact
- `customer.subscription.updated` -> plan change + MRR delta
- `customer.subscription.deleted` -> churn + negative MRR
- `charge.refunded` -> refund event

**Attribution resolution** (in order):
1. Stripe customer email -> `leads` table lookup -> `source` column = channel
2. Stripe `customer_id` -> `bootcamp_students` table lookup -> trace to lead source
3. Stripe metadata (if tagged at checkout time)
4. Fallback: `unknown`

**Webhook verification**: Standard Stripe signature verification using `STRIPE_WEBHOOK_SECRET`.

### Backfill Task

Trigger.dev task: `backfill-stripe-revenue`
- Pages through Stripe charges/invoices for last 12 months
- Same attribution logic as webhook handler
- Idempotent via `stripe_event_id` unique constraint
- Run once after initial deploy

### Analytics API Endpoints

**New endpoints in gtm-system**:

`GET /api/analytics/revenue`
- Params: `tenant_id`, `from`, `to`, `granularity`
- Returns: total_revenue, mrr, arr, by_channel[], by_product[], by_period[], new_vs_recurring

`GET /api/analytics/unit-economics`
- Params: `tenant_id`, `from`, `to`
- Returns: cac_per_channel[], blended_cac, ltv_estimate, payback_period, channel_roi[]

`GET /api/analytics/command-center`
- Single endpoint for hero dashboard (one API call)
- Combines: revenue summary, funnel snapshot, pipeline velocity, active alerts, cost overview
- Leverages existing metric functions + new revenue/cost queries

**Enhancements to existing**:
- `FullDashboardData` type: add `revenue` and `costs` fields
- `getChannelAttribution()`: add `revenue` and `roi` per channel
- `/api/dashboard/kpis`: add `totalRevenue`, `mrr`, `avgCac`, `channelRoi`

### Dashboard UI: Command Center

**Route**: `/portal/command-center` in copy-of-gtm-os

**Row 1: Hero KPI Cards** (5 cards)
- Total Revenue (period) + trend %
- MRR + trend
- Blended CAC
- Best Channel (auto-detected by ROI)
- Pipeline Value

**Row 2: Revenue by Channel** (hero visualization)
- Stacked bar chart (Recharts): revenue by channel over time
- Toggle: weekly / monthly
- Table: channel | leads | qualified | meetings | revenue | CAC | ROI

**Row 3: Full Funnel**
- Visual funnel: Pool -> Enriched -> Contacted -> Replied -> Meeting -> Closed -> Revenue
- Conversion rates between stages
- Clickable: drill into leads at any stage

**Row 4: Pipeline Velocity + Alerts**
- Left: avg days per stage, stuck leads
- Right: actionable alerts with severity

**Row 5: Channel Costs + ROI**
- Editable cost cards per channel
- Auto-computed ROI, CAC, payback
- Color-coded profitability

### Actionability (Key Differentiator)

Every section has contextual action buttons:
- Revenue chart -> "Launch campaign" on best channel
- Funnel drop-off -> "View stuck leads" -> trigger enrichment
- Alerts -> "Pause campaign", "Send follow-up", "Retry enrichment"
- Pipeline -> "View lead" with full history

### Multi-Tenant Architecture

All tables keyed by `tenant_id`. Admin sees aggregate; members see own data. Same pattern as existing analytics.

## What This Is NOT

- Not a replacement for Stripe dashboard (we don't handle billing management)
- Not a CRM (Attio handles that)
- Not a BI tool (we don't support custom SQL queries like Equals)

## Implementation Phases

1. **Phase 1**: Stripe webhook + revenue_events table + backfill + `/api/analytics/revenue`
2. **Phase 2**: Command Center UI with KPIs + revenue by channel + funnel
3. **Phase 3**: channel_costs table + unit economics + ROI calculations
4. **Phase 4**: Alerts, velocity, action buttons, drill-downs
