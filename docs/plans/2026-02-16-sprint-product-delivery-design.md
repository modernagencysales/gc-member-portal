# 30-Day LinkedIn Sprint — Product Delivery Design

## Overview

Automatically deliver the 30-Day LinkedIn Sprint product (and optional add-ons) when customers purchase via Stripe. Purchases flow through ThriveCart or GHL, but we listen to Stripe webhooks directly for reliability.

## Products

| Product | Price | Stripe Product ID | What it grants |
|---------|-------|-------------------|----------------|
| 30-Day LinkedIn Sprint | $27 | TBD (set in admin) | Bootcamp student account + Sprint cohort curriculum |
| LinkedIn DM Conversion Kit | $27 | TBD (set in admin) | Extra content module (content grant) |
| LinkedIn Automation GPT Suite | $79 | TBD (set in admin) | 30-day time-limited AI tool credits |

## Architecture

```
Customer buys on ThriveCart/GHL
  → Stripe checkout.session.completed
  → gtm-system /api/webhooks/stripe (existing route)
  → Checks product IDs against config in bootcamp_settings
  → Creates bootcamp_students record
  → Assigns to Sprint cohort (student_cohorts)
  → If DM Kit purchased → student_content_grants entry
  → If GPT Suite purchased → student_tool_credits with 30-day expiry
```

## Config (bootcamp_settings, key: sprint_product_config)

```typescript
{
  enabled: true,
  products: {
    sprint: {
      stripeProductId: "prod_XXXXX",
      cohortId: "uuid-of-sprint-cohort",
      accessLevel: "Curriculum Only",
      role: "student"
    },
    dmKit: {
      stripeProductId: "prod_YYYYY",
      contentGrantIds: ["dm_conversion_kit"]
    },
    gptSuite: {
      stripeProductId: "prod_ZZZZZ",
      toolSlugs: ["post-generator", "profile-optimizer", "dm-chat-helper"],
      creditsPerTool: 10,
      accessDays: 30
    }
  }
}
```

## Webhook Handler Logic (gtm-system)

Extends existing `/api/webhooks/stripe/route.ts`:

1. On `checkout.session.completed`, expand line items via Stripe API
2. Load `sprint_product_config` from `bootcamp_settings`
3. Match product IDs against config
4. **Sprint product**: Upsert `bootcamp_students` (dedup by email), upsert `student_cohorts`
5. **DM Kit**: Insert `student_content_grants` with configured content IDs
6. **GPT Suite**: Set `access_expires_at` on student, insert `student_tool_credits` per tool
7. Log `subscription_event` for audit trail

Idempotency: `granted_by_code = 'stripe:{checkout_session_id}'` prevents double-granting.
Student dedup: Upsert by email — existing students get updated access.
CSRF: Route under `/api/webhooks/` already in skip list.

## DB Actions Per Product

| Product | Table | Action |
|---------|-------|--------|
| Sprint | `bootcamp_students` | Upsert (email, name, status=Onboarding, access_level from config) |
| Sprint | `student_cohorts` | Upsert (student_id, cohort_id, role=student) |
| DM Kit | `student_content_grants` | Insert (week_id='dm_conversion_kit', granted_by_code) |
| GPT Suite | `bootcamp_students` | Update access_expires_at = now + accessDays |
| GPT Suite | `student_tool_credits` | Insert per tool slug (credits_total, granted_by_code) |

## Admin UI (copy-of-gtm-os)

New `SprintProductConfigEditor` component at `/admin/bootcamp/settings`, following `CallGrantConfigEditor` pattern:

- Stripe product ID inputs for each product
- Cohort selector for Sprint
- Tool slug multi-select for GPT Suite (from `ai_tools` table)
- Credits per tool input
- Access duration (days) input
- Enable/disable toggle

## Portal Access (copy-of-gtm-os)

- **Sprint curriculum**: Already works via cohort assignment
- **DM Kit**: Check `student_content_grants` for `week_id = 'dm_conversion_kit'` to show/hide bonus content
- **GPT Suite tools**: Already works via `student_tool_credits` + `access_expires_at`

## What Needs Building

| Component | Repo | Effort |
|-----------|------|--------|
| Extend Stripe webhook handler | gtm-system | Medium |
| Sprint product config type + DB seed | shared Supabase | Small |
| Admin config editor UI | copy-of-gtm-os | Medium |
| DM Kit content visibility check | copy-of-gtm-os | Small |
