# GTM Infrastructure Provisioning Module — Design

## Overview

A new "GTM Infrastructure" module in the Bootcamp sidebar that lets students automatically provision their entire cold email + LinkedIn outreach infrastructure through a guided wizard. The system orchestrates three platforms — **Zapmail** (domains + mailboxes), **PlusVibe** (cold email sending + warmup), and **HeyReach** (LinkedIn lead lists) — to deliver a turnkey setup.

Students pay a one-time setup fee (domain registration + provisioning) plus a monthly subscription for ongoing infrastructure access. The operator profits from agency-tier pricing arbitrage plus a per-mailbox markup (~$1/mailbox).

## User Flow

### Access
- New sidebar section: **"GTM Infrastructure"** under Resources (same level as "AI Tools")
- Shows **Setup Wizard** if no infrastructure provisioned, or **Infrastructure Dashboard** if already set up
- Gated by bootcamp authentication (same as AI tools)

### Setup Wizard (4 Steps)

**Step 1 — Choose Package**
- Display admin-configurable tiers (stored in `infra_tiers` table)
- Default tiers:
  - **Starter**: 3 domains × 2 mailboxes = 6 mailboxes
  - **Growth**: 5 domains × 2 mailboxes = 10 mailboxes
  - **Scale**: 10 domains × 2 mailboxes = 20 mailboxes
- Each tier shows: one-time setup fee + monthly subscription price
- Pricing includes domain registration cost + per-mailbox markup

**Step 2 — Pick Domains**
- Student enters their company/brand name
- System generates domain name variations using a deterministic algorithm:
  - Prefixed: getacme.com, tryacme.com, goacme.com, heyacme.com...
  - Suffixed: acmehq.com, acmemail.com, acmeteam.com...
  - Multi-TLD: acme.com, acme.io, acme.net...
  - Hyphenated: acme-hq.com, get-acme.com...
- System checks availability via Zapmail API (`POST /v2/domains/available`)
- Student selects N domains from available suggestions (N = tier's domain_count)
- Manual search fallback: student can type specific domain names to check
- Allowed TLDs: com, net, io, biz, live, info (Zapmail constraint)
- Shows per-domain price from Zapmail availability response

**Step 3 — Configure Mailboxes**
- Student enters 2 name patterns that cascade across all domains:
  - Pattern 1: e.g., "tim" → tim@getacme.com, tim@acmehq.com, ...
  - Pattern 2: e.g., "tim.keen" → tim.keen@getacme.com, tim.keen@acmehq.com, ...
- Preview grid shows ALL mailboxes that will be created
- Validation: no leading/trailing `.`, `_`, or `-` in usernames (Zapmail constraint)

**Step 4 — Pay & Provision**
- Pricing summary: one-time fee (domain costs + setup) + first month subscription
- Stripe Checkout (two line items: one-time setup + recurring monthly)
- On successful payment → kick off Trigger.dev provisioning task
- Redirect to Provisioning Progress page

### Provisioning Progress
- Real-time status page with step-by-step checkmarks:
  1. Creating Zapmail workspace... ✓
  2. Purchasing domains... ✓
  3. Waiting for DNS setup... ✓
  4. Setting up DMARC... ✓
  5. Creating mailboxes... ✓
  6. Setting up PlusVibe workspace... ✓
  7. Exporting mailboxes to PlusVibe... ✓
  8. Configuring warmup... ✓
  9. Creating HeyReach lead list... ✓
  10. Setup complete! ✓
- Student can leave and come back — status persists
- Frontend polls `provisioning_log` JSONB field for updates

### Infrastructure Dashboard (Post-Setup)
- Domain status cards: domain name, connection status, mailbox count
- Warmup progress: per-account warmup health scores, reply rates, daily send counts
  (via Partner API `partner-list-email-accounts` which returns rich analytics:
  7d_overall_warmup_health, 7d_google/microsoft/other_warmup_health,
  7d_replyrate, email_sent_today, warmup_email_sent_today)
- HeyReach lead list status: lead count, link to HeyReach
- PlusVibe quick-access: link to student's PlusVibe client login
- Upgrade option: move to higher tier (adds more domains/mailboxes)

---

## Architecture Decisions (Resolved)

### Per-Student Workspace Isolation
Each student gets their own isolated infrastructure:
- **Zapmail**: Dedicated workspace per student (created via `POST /v2/workspaces`)
  - The student's Zapmail workspace is linked to their PlusVibe workspace via the PIPL integration
  - Each workspace has its own `x-workspace-key` for API calls
- **PlusVibe**: Dedicated workspace per student (created via create_workspace API)
  - Student gets a client login (via PlusVibe Client Access API) to manage their own campaigns
- **HeyReach**: Shared organization, student gets their own lead list
  - Campaign creation is NOT available via HeyReach API
  - System creates a lead list; students create campaigns manually in HeyReach

### Domain Purchase
- Domains purchased via Zapmail API: `POST /v2/domains/buy` with `useWallet: true`
- Operator pre-funds Zapmail wallet; domain costs recouped via student's one-time setup fee
- Domains purchased through Zapmail are auto-configured (DNS, nameservers handled automatically)
- No manual NS changes needed when buying through Zapmail (unlike connecting external domains)

### Zapmail → PlusVibe Integration
- Zapmail has a full third-party integration system that handles per-workspace targeting
- **Step A**: Create PlusVibe client login for student (captures email + password)
- **Step B**: Register PlusVibe credentials in the student's Zapmail workspace:
  `POST /v2/exports/accounts/third-party` with `{ email, password, app: "PIPL" }`
  Uses `x-workspace-key` header → scoped to that student's Zapmail workspace
- **Step C**: Export mailboxes: `POST /v2/exports/mailboxes` with `apps: ["PIPL"]`
  Zapmail pushes SMTP credentials directly to the registered PlusVibe account
- This is fully automated — no CSV export, no manual SMTP credential handling

### HeyReach Limitations
- HeyReach API does NOT support campaign creation
- System will auto-create a lead list per student via `create_empty_list`
- Students manually create their connection request campaign in HeyReach and attach the list
- Operator provides template campaign copy via bootcamp curriculum/instructions

---

## Data Model

### `infra_tiers` — Admin-configurable packages

```sql
CREATE TABLE infra_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Starter", "Growth", "Scale"
  slug TEXT UNIQUE NOT NULL,             -- "starter", "growth", "scale"
  domain_count INT NOT NULL,             -- 3, 5, 10
  mailboxes_per_domain INT NOT NULL DEFAULT 2,
  setup_fee_cents INT NOT NULL,          -- One-time Stripe price in cents
  monthly_fee_cents INT NOT NULL,        -- Recurring monthly price in cents
  stripe_setup_price_id TEXT,            -- Stripe Price ID for one-time
  stripe_monthly_price_id TEXT,          -- Stripe Price ID for recurring
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `infra_provisions` — Tracks each student's provisioning

```sql
CREATE TABLE infra_provisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES bootcamp_students(id),
  tier_id UUID NOT NULL REFERENCES infra_tiers(id),
  status TEXT NOT NULL DEFAULT 'pending_payment',
    -- pending_payment | provisioning | active | failed | cancelled | upgrading
  stripe_checkout_session_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  mailbox_pattern_1 TEXT NOT NULL,       -- e.g., "tim"
  mailbox_pattern_2 TEXT NOT NULL,       -- e.g., "tim.keen"
  zapmail_workspace_id TEXT,             -- Created Zapmail workspace ID
  zapmail_workspace_key TEXT,            -- Zapmail workspace key for API calls
  plusvibe_workspace_id TEXT,            -- Created PlusVibe workspace ID
  plusvibe_client_id TEXT,               -- PlusVibe client login ID
  plusvibe_client_email TEXT,            -- PlusVibe client email (for partner API)
  plusvibe_client_password TEXT,         -- PlusVibe client password (auto-generated, for Zapmail integration + partner API)
  heyreach_list_id BIGINT,              -- Created HeyReach lead list ID
  provisioning_log JSONB DEFAULT '[]',  -- Step-by-step status updates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)                     -- One provision per student
);
```

### `infra_domains` — Individual domains per provision

```sql
CREATE TABLE infra_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provision_id UUID NOT NULL REFERENCES infra_provisions(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  zapmail_domain_id TEXT,               -- From Zapmail API
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending | purchasing | dns_pending | connected | active | failed
  mailboxes JSONB DEFAULT '[]',
    -- Array of {username, email, zapmail_mailbox_id, plusvibe_account_id}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies
- Students can only SELECT their own provisions/domains (via `student_id = auth.uid()` join)
- Admin can read/write all
- Service role (Trigger.dev) writes via service key

---

## Provisioning Pipeline (Trigger.dev)

Task: `provision-gtm-infrastructure` in **gtm-system** repo

### Input Payload
```typescript
interface ProvisionPayload {
  provisionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  tierSlug: string;
  domains: string[];          // ["getacme.com", "acmehq.com", ...]
  mailboxPattern1: string;    // "tim"
  mailboxPattern2: string;    // "tim.keen"
}
```

### Step-by-Step Pipeline

**Step 1: Create Zapmail Workspace**
```
POST https://api.zapmail.ai/api/v2/workspaces
Headers: { x-auth-zapmail: AGENCY_API_KEY }
Body: {
  name: "{studentName}'s Infrastructure",
  billingDetails: { ... student info ... }
}
→ Store workspace id + workspace key in infra_provisions
→ All subsequent Zapmail calls use x-workspace-key header
```

**Step 2: Purchase Domains**
```
POST https://api.zapmail.ai/api/v2/domains/buy
Headers: { x-auth-zapmail: AGENCY_API_KEY, x-workspace-key: STUDENT_WS_KEY }
Body: {
  domains: [{ domainName: "getacme.com", years: 1 }, ...],
  useWallet: true
}
→ Purchases from operator's pre-funded wallet
→ Domains auto-configured (DNS + NS handled by Zapmail)
→ Update infra_domains status = 'purchasing'
```

**Step 3: Poll Domain Connection Status**
```
GET https://api.zapmail.ai/api/v2/domains/connection-requests
Headers: { x-auth-zapmail: AGENCY_API_KEY, x-workspace-key: STUDENT_WS_KEY }
→ Poll until all domains reach SUCCESS status
→ Domain connection statuses: PENDING → CHECKING_IF_DOMAIN_IS_REGISTERED
  → CHECKING_NS_IN_WHOIS → CREATING_ZONE → SUCCESS
→ Update infra_domains status as they progress
→ Timeout after 10 minutes with retry logic
```

**Step 4: Set Up DMARC Records**
```
POST https://api.zapmail.ai/api/v2/domains/dmarc
Headers: { x-auth-zapmail: AGENCY_API_KEY, x-workspace-key: STUDENT_WS_KEY }
Body: {
  domainIds: [all_domain_ids],
  email: "{studentEmail}",
  contains: "", status: [], tagIds: []
}
→ Adds DMARC records for email deliverability
```

**Step 5: Create Mailboxes**
```
For each domain (once connected):
  POST https://api.zapmail.ai/api/v2/mailboxes
  Headers: { x-auth-zapmail: AGENCY_API_KEY, x-workspace-key: STUDENT_WS_KEY }
  Body: {
    [zapmail_domain_id]: [
      { firstName: "Tim", lastName: "Keen", mailboxUsername: "tim", domainName: "getacme.com" },
      { firstName: "Tim", lastName: "Keen", mailboxUsername: "tim.keen", domainName: "getacme.com" }
    ]
  }
  → Store zapmail_mailbox_ids
  → Update infra_domains.mailboxes JSONB
```
- Max 5 mailboxes per domain per request (we need 2)
- 24-hour cooldown between mailbox assignments to same domain
- Can batch multiple domains in parallel (different domain IDs)
- Poll `GET /v2/domains/assignable` to verify mailboxes reach ACTIVE status

**Step 6: Create PlusVibe Workspace + Client Login**
```
1. Create workspace:
   POST (PlusVibe create_workspace API)
   Body: { workspace_id: AGENCY_WORKSPACE_ID, workspace_name: "{studentName}'s Workspace" }
   → Store new workspace_id in infra_provisions.plusvibe_workspace_id

2. Create client login (MUST happen before Zapmail export — we need the password):
   POST https://api.plusvibe.ai/api/v1/client
   Headers: { x-api-key: PLUSVIBE_API_KEY }
   Body: {
     workspace_id: AGENCY_WORKSPACE_ID,
     client_email: studentEmail,
     client_first_name: studentFirstName,
     client_last_name: studentLastName,
     client_business_name: "{studentName}'s GTM",
     workspaces: [{
       id: NEW_WORKSPACE_ID,
       permissions: ["UNIBOX_FULL_ACCESS"],
       hide_labels: []
     }]
   }
   → Response: { client_id, email, password }
   → CRITICAL: Capture password — only shown on creation!
   → Store client_id in infra_provisions.plusvibe_client_id
   → Store encrypted password for Zapmail integration
```

**Step 7: Register PlusVibe in Zapmail + Export Mailboxes**
```
1. Register PlusVibe credentials in the student's Zapmail workspace:
   POST https://api.zapmail.ai/api/v2/exports/accounts/third-party
   Headers: { x-auth-zapmail: AGENCY_API_KEY, x-workspace-key: STUDENT_ZM_WS_KEY }
   Body: {
     email: "{plusvibe_client_email}",     // from create_client response
     password: "{plusvibe_client_password}", // from create_client response
     app: "PIPL"
   }
   → Links this Zapmail workspace to the student's PlusVibe account
   → Zapmail validates credentials (400 if invalid)

2. Export mailboxes to PlusVibe:
   POST https://api.zapmail.ai/api/v2/exports/mailboxes
   Headers: { x-auth-zapmail: AGENCY_API_KEY, x-workspace-key: STUDENT_ZM_WS_KEY }
   Body: {
     apps: ["PIPL"],
     ids: [all_mailbox_ids],
     excludeIds: [], tagIds: [],
     status: "ACTIVE", contains: ""
   }
   → Zapmail pushes SMTP credentials directly to the student's PlusVibe workspace
   → Async: "may take some time to export"
```
- Export is async — poll PlusVibe to verify accounts appear
- Zapmail rate limit: 3 re-exports per mailbox per week

**FALLBACK** (if PIPL export fails or credentials rejected):
```
Use PlusVibe Partner API to bulk-add accounts directly:
POST https://api.plusvibe.ai/v1/partner-upload-regular-accounts
Body: {
  workspace_id: NEW_WORKSPACE_ID,
  pipl_username: plusvibe_client_email,
  pipl_password: plusvibe_client_password,
  notification_email: OPERATOR_EMAIL,
  accounts: [{ first_name, last_name, email, daily_limit: 30,
    username, password, imap_host, imap_port, smtp_host, smtp_username,
    smtp_password, smtp_port, min_interval: 5,
    enable_warmup: "yes", warmup_daily_limit: 30,
    enable_warmup_rampup: "yes", warmup_rampup_start: 2, warmup_rampup_increment: 2
  }, ...]
}
→ Sets warmup config inline — no separate warmup configuration step needed
```

**Step 8: Configure Warmup Settings**
```
1. Poll PlusVibe until accounts appear (use Partner API for rich data):
   GET https://api.plusvibe.ai/api/v1/webhook/partner-list-email-accounts
   Params: { pipl_username, pipl_password, workspace_id: NEW_WORKSPACE_ID }
   → Wait for all expected accounts to show up
   → Get account IDs

2. Bulk update with opinionated settings:
   bulk_update_email_accounts({
     workspace_id: NEW_WORKSPACE_ID,
     ids: [account_ids],
     warmup_initial_daily_limit: 2,
     warmup_pace_increment: 2,
     warmup_max_daily_limit: 30,
     warmup_reply_rate: 0.3,
     warmup_randomize: "yes",
     warmup_randomize_num: 20,
     bulk_warmup_is_slow_rampup: "yes",
     daily_limit: 30,
     interval_limit_in_min: 5,
     first_name: "{studentFirstName}",
     last_name: "{studentLastName}"
   })

3. Enable warmup:
   bulk_update_warmup({
     workspace_id: NEW_WORKSPACE_ID,
     ids: [account_ids],
     warmup_status: "ACTIVE"
   })

4. Store plusvibe_account_ids in infra_domains.mailboxes JSONB
```

**Step 9: Create HeyReach Lead List**
```
create_empty_list({
  listName: "{studentName}'s Prospects",
  listType: "USER_LIST"
})
→ Store list_id in infra_provisions.heyreach_list_id
```

**Step 10: Finalize**
```
1. Update infra_provisions.status = 'active'
2. Final provisioning_log entry with summary
3. (Future) Send email notification to student with:
   - PlusVibe login credentials
   - HeyReach list link
   - Getting started guide
```

### Provisioning Log Format
```typescript
type ProvisioningStep = {
  step: number;
  name: string;           // "Purchasing domains"
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  details?: Record<string, any>;
};
```

### Error Handling & Retries
- Each step is idempotent where possible (check if resource exists before creating)
- Failed steps log the error and mark provisioning as 'failed'
- Admin can retry failed provisioning from the failed step (not restart from scratch)
- Zapmail rate limits: 5 req/s general, 10 req/30min domain queries — build in delays
- PlusVibe rate limit: 5 req/s — batch operations where possible

---

## Stripe Integration

### Products & Prices
Create in Stripe Dashboard:
- **Product**: "GTM Infrastructure - Starter" (one per tier)
  - **Price 1**: One-time setup fee (e.g., $97) — `type: one_time`
  - **Price 2**: Monthly recurring (e.g., $47/mo) — `type: recurring`
- Repeat for Growth and Scale tiers with higher prices

### Checkout Flow
1. Frontend calls Supabase Edge Function `create-infra-checkout`
2. Edge Function creates Stripe Checkout Session:
   ```typescript
   {
     line_items: [
       { price: tier.stripe_setup_price_id, quantity: 1 },
       { price: tier.stripe_monthly_price_id, quantity: 1 }
     ],
     mode: 'subscription',  // supports one-time + recurring together
     metadata: { provisionId, studentId, tierSlug },
     success_url: '/bootcamp/infrastructure?provisioning=true',
     cancel_url: '/bootcamp/infrastructure'
   }
   ```
3. On webhook `checkout.session.completed`:
   - Update infra_provisions: status → 'provisioning', store stripe IDs
   - Trigger the `provision-gtm-infrastructure` Trigger.dev task

### Subscription Lifecycle
- `customer.subscription.deleted` → mark provision 'cancelled'
- `customer.subscription.updated` → handle tier upgrade if applicable
- `invoice.payment_failed` → flag provision, send notification

---

## Frontend Components

### New Files (copy-of-gtm-os)

```
components/bootcamp/infrastructure/
├── InfrastructurePage.tsx          — Router: shows Wizard, Progress, or Dashboard
├── wizard/
│   ├── InfraWizard.tsx             — 4-step wizard container with progress bar
│   ├── TierSelection.tsx           — Package cards with pricing
│   ├── DomainPicker.tsx            — Brand input → suggestions → availability check → select
│   ├── MailboxConfig.tsx           — Name pattern inputs + cascading preview grid
│   └── CheckoutStep.tsx            — Pricing summary + Stripe redirect
├── dashboard/
│   ├── InfraDashboard.tsx          — Overview with status cards + quick links
│   ├── DomainStatusCard.tsx        — Per-domain: status, mailboxes, health
│   ├── WarmupProgress.tsx          — Warmup metrics per account (pulls from PlusVibe API)
│   └── HeyReachStatus.tsx          — Lead list info + link to HeyReach
├── ProvisioningProgress.tsx        — Real-time step tracker with polling
└── UpgradeTierModal.tsx            — Tier upgrade flow

services/
└── infrastructure-supabase.ts      — CRUD for infra_tiers, infra_provisions, infra_domains

hooks/
├── useInfraProvision.ts            — Query + poll provision status (React Query)
└── useInfraTiers.ts                — Fetch active tiers

types/
└── infrastructure-types.ts         — TypeScript interfaces for all infra types
```

### Backend API Routes (gtm-system)

```
src/app/api/infrastructure/
├── tiers/route.ts                  — GET: list active tiers (reads from Supabase)
├── domains/suggest/route.ts        — POST: generate domain name variations from brand name
├── domains/check/route.ts          — POST: check availability via Zapmail API
├── provision/route.ts              — POST: initiate provisioning (called after Stripe success)
├── status/[id]/route.ts            — GET: provision status + log (polled by frontend)
└── dashboard/[studentId]/route.ts  — GET: aggregated dashboard data (warmup stats, domain health)
```

### Supabase Edge Functions

```
supabase/functions/
├── create-infra-checkout/index.ts  — Create Stripe checkout session for infra
└── stripe-webhook/index.ts         — Extend existing handler for infra subscription events
```

### Sidebar Integration
In `components/bootcamp/Sidebar.tsx`, add under Resources section:
```
Resources
├── AI Tools (existing)
└── GTM Infrastructure (NEW)
    └── Single link → InfrastructurePage
    └── Icon: server/cloud/rocket
```

---

## AI Domain Suggestion Algorithm

Deterministic, no LLM needed:

```typescript
function suggestDomains(brandName: string): string[] {
  const clean = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const prefixes = ['get', 'try', 'use', 'go', 'hey', 'meet', 'with', 'join'];
  const suffixes = ['hq', 'app', 'mail', 'team', 'co', 'now', 'pro'];
  const tlds = ['com', 'io', 'net'];

  const suggestions: string[] = [];

  // brand.tld variations
  tlds.forEach(tld => suggestions.push(`${clean}.${tld}`));
  // prefix + brand.com
  prefixes.forEach(p => suggestions.push(`${p}${clean}.com`));
  // brand + suffix.com
  suffixes.forEach(s => suggestions.push(`${clean}${s}.com`));
  // brand-suffix.com (hyphenated)
  suffixes.slice(0, 4).forEach(s => suggestions.push(`${clean}-${s}.com`));
  // prefix + brand with other TLDs
  prefixes.slice(0, 3).forEach(p =>
    tlds.slice(1).forEach(tld => suggestions.push(`${p}${clean}.${tld}`))
  );

  return [...new Set(suggestions)];
}
```

Then batch-check availability via Zapmail API (`POST /v2/domains/available`) and display only available ones with pricing.

---

## Opinionated Settings Reference

### PlusVibe Warmup Config
| Setting | Value | Notes |
|---------|-------|-------|
| warmup_initial_daily_limit | 2 | Start slow |
| warmup_pace_increment | 2 | +2 emails/day |
| warmup_max_daily_limit | 30 | Cap warmup volume |
| warmup_reply_rate | 0.3 | 30% reply rate |
| warmup_randomize | yes | Randomize timing |
| warmup_randomize_num | 20 | ±20% variation |
| bulk_warmup_is_slow_rampup | yes | Gradual ramp |
| daily_limit (campaign sending) | 30 | Per-account campaign limit |
| interval_limit_in_min | 5 | Min 5 min between sends |

### DMARC Config
- Added via Zapmail API for every domain
- DMARC report email: student's email address
- Applied automatically after domain connection

---

## Tier Upgrade Flow

When a student wants to upgrade (e.g., Starter → Growth):
1. Show UpgradeTierModal with price difference
2. Create new Stripe checkout for the price difference (prorated subscription swap)
3. On payment success, kick off an **upgrade** provisioning task:
   - Purchase additional domains (Growth has 2 more than Starter)
   - Create mailboxes on new domains using existing patterns
   - Export new mailboxes to existing PlusVibe workspace
   - Configure warmup on new accounts
4. Update tier_id on infra_provisions

---

## Zapmail API Reference (Endpoints Used)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/workspaces` | POST | Create student workspace |
| `/v2/domains/available` | POST | Check domain availability + pricing |
| `/v2/domains/buy` | POST | Purchase domains (wallet) |
| `/v2/domains/connection-requests` | GET | Poll domain setup status |
| `/v2/domains/dmarc` | POST | Add DMARC records |
| `/v2/domains/assignable` | GET | List connected domains + mailbox counts |
| `/v2/mailboxes` | POST | Create mailboxes on domains |
| `/v2/mailboxes` | PUT | Update mailbox details |
| `/v2/exports/accounts/third-party` | POST | Register PlusVibe credentials per workspace |
| `/v2/exports/accounts/third-party` | PUT | Update PlusVibe credentials if needed |
| `/v2/exports/mailboxes` | POST | Export mailboxes to PlusVibe (PIPL) |
| `/v2/dns` | POST | Add DNS records (if needed) |
| `/v2/dns/` | GET | Get DNS records (for dashboard) |

### Zapmail Rate Limits
- General: 5 req/s, 20 req/min
- Domain queries: 10 req/30min
- Mailbox re-exports: 3 req/mailbox/week

---

## PlusVibe API Reference (Endpoints Used)

### Standard API (x-api-key auth, base: /api/v1)
| Operation | Purpose |
|-----------|---------|
| create_workspace | Create student workspace |
| bulk_update_email_accounts | Set warmup + sending config |
| bulk_update_warmup | Enable warmup (ACTIVE) |
| list_email_accounts | Get account IDs after import |
| create_client | Create student client login (returns password!) |

### Partner API (pipl_username/pipl_password auth, base: /v1)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/webhook/partner-list-workspace` | POST | List workspaces (verify creation) |
| `/webhook/partner-list-email-accounts` | GET | Rich account data: warmup health scores, reply rates, daily counters (for dashboard) |
| `/partner-upload-regular-accounts` | POST | Bulk add SMTP accounts with inline warmup config (fallback if PIPL export fails) |
| `/webhook/partner-google-oauth-url` | POST | Google OAuth flow with inline warmup config (alternative import method) |

### Key: create_client Response
```json
{
  "client_id": "70218d5e05561a3877dcb77f",
  "email": "nova.smith@example.com",
  "password": "Xp9#Ld2!ak"  // Auto-generated, only shown on creation!
}
```
- Password is captured and used to register PIPL credentials in Zapmail
- Also used for partner API calls (pipl_username/pipl_password)
- Client gets UNIBOX_FULL_ACCESS or FULL_ACCESS to their workspace

---

## HeyReach API Reference (Endpoints Used)

| Operation | Purpose |
|-----------|---------|
| create_empty_list | Create student's lead list |
| add_leads_to_list_v2 | Add leads to list (future) |
| get_leads_from_list | Dashboard: list stats |

---

## Implementation Order

### Phase 1: Core Infrastructure (MVP)
1. Database migration: `infra_tiers`, `infra_provisions`, `infra_domains` tables + RLS
2. Seed default tiers (Starter/Growth/Scale with placeholder Stripe price IDs)
3. Create Stripe products + prices, update tier records
4. Frontend: `InfrastructurePage` + Setup Wizard (4 steps)
5. Supabase Edge Function: `create-infra-checkout`
6. Extend `stripe-webhook` for infra checkout events
7. gtm-system API routes: tiers, domain suggest, domain check, provision, status
8. Trigger.dev task: `provision-gtm-infrastructure` (Steps 1-10)
9. Frontend: `ProvisioningProgress` with polling
10. Sidebar integration in `Sidebar.tsx`

### Phase 2: Dashboard
11. Frontend: `InfraDashboard` with domain status cards
12. `WarmupProgress` — pulls from PlusVibe warmup stats API
13. `HeyReachStatus` — shows lead list info
14. gtm-system dashboard API route (aggregates data from all 3 platforms)

### Phase 3: Polish & Upgrades
15. Upgrade tier flow (UpgradeTierModal + upgrade provisioning task)
16. Admin tier management UI (CRUD for infra_tiers)
17. Error recovery: retry failed provisioning from last successful step
18. Email notifications on provisioning complete/failure

### Dependencies / Blockers
- **Zapmail wallet must be pre-funded** before any provisioning can run
- **Stripe products**: Must be created in Stripe Dashboard before tiers can reference them
- **Trigger.dev deploy**: New task must be deployed to Trigger.dev production

### Resolved Dependencies
- **PlusVibe client password**: RESOLVED — `create_client` API returns auto-generated password in the response (`{ client_id, email, password }`). Password is only shown on creation, so we capture and store it immediately for Zapmail integration.
