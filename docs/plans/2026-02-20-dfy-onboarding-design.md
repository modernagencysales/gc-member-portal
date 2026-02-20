# DFY Client Onboarding System — Design Document

**Date**: 2026-02-20
**Status**: Approved
**Repos**: copy-of-gtm-os (portal + signing), gtm-system (orchestration + integrations)

---

## Problem

We closed our first DFY client (Bobby Deraco / Synapse Marketing Solutions, $5,500/mo). We need a system to:

1. Get contracts signed and payment collected
2. Automatically provision all systems (Linear, Slack, MagnetLab)
3. Give clients a portal to track progress and approve deliverables
4. Give our team a Linear board with all tasks auto-created
5. Make the process repeatable and easy to iterate for future clients

## Design Principles

- **Proposal page is the entry point** — sign, pay, and onboard from the same branded experience
- **Data-driven, not code-driven** — deliverable templates stored in DB settings, not hardcoded
- **Slack for notifications, portal for status** — not all clients use Slack
- **Linear is the internal source of truth** — bidirectional sync with client portal
- **Easy to iterate** — first DFY client is a test; the system must be easy to adjust

---

## End-to-End Flow

```
1. Proposal page (/proposal/:slug)
   └── Client clicks "Accept & Sign"
   └── SOW summary displayed (auto-generated from proposal data)
   └── Client types name, agrees to MSA + SOW
   └── Signature captured (name, IP, timestamp, user agent)
   └── Proposal status → "signed"
   └── Redirect to Stripe Checkout (subscription)

2. Stripe payment succeeds
   └── Webhook fires → gtm-system /api/webhooks/stripe
   └── Triggers "onboard-dfy-client" Trigger.dev task

3. Onboarding task orchestrates (parallel where possible):
   a. Create dfy_engagements record (status: "onboarding")
   b. Create Linear project with full task board
   c. Create Slack Connect channel + invite client
   d. Set up MagnetLab workspace for client
   e. Send welcome email with portal link (Resend)
   f. Create Attio deal + update person record
   g. Notify #clients Slack channel internally

4. Client portal goes live (/client/:slug)
   └── Shows deliverable status, timeline, approval buttons
   └── Client can upload assets, approve deliverables, leave notes

5. Internal team works from Linear
   └── Linear issue updates → webhook → update dfy_deliverables → portal refreshes
   └── Client approvals in portal → update dfy_deliverables → update Linear issue
```

---

## Data Model

### `dfy_engagements` (new table)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| proposal_id | uuid FK → proposals | Links to the signed proposal |
| tenant_id | uuid FK → tenants | Multi-tenant support |
| client_name | text | |
| client_email | text | |
| client_company | text | |
| portal_slug | text UNIQUE | URL-safe slug for /client/:slug |
| portal_password_hash | text | Simple password auth for portal |
| status | text | pending_signature, pending_payment, onboarding, active, paused, churned |
| monthly_rate | integer | Amount in cents |
| stripe_subscription_id | text | |
| stripe_customer_id | text | |
| linear_project_id | text | |
| slack_channel_id | text | |
| magnetlab_user_id | text | |
| signed_name | text | Full name as typed |
| signed_at | timestamptz | |
| signed_ip | text | |
| signed_user_agent | text | |
| start_date | date | First day of engagement |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `dfy_deliverables` (new table)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| engagement_id | uuid FK → dfy_engagements | |
| name | text | e.g., "Profile rewrite" |
| description | text | |
| category | text | onboarding, content, funnel, outbound |
| status | text | pending, in_progress, review, approved, completed |
| assignee | text | Team member name |
| due_date | date | |
| sort_order | integer | Display order |
| linear_issue_id | text | Synced Linear issue |
| client_approved_at | timestamptz | |
| client_notes | text | Client feedback |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `dfy_activity_log` (new table)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| engagement_id | uuid FK → dfy_engagements | |
| deliverable_id | uuid FK → dfy_deliverables (nullable) | |
| action | text | status_change, client_approved, note_added, file_uploaded, email_sent |
| description | text | Human-readable description |
| actor | text | System, team member name, or client name |
| metadata | jsonb | Extra data (old_status, new_status, file_url, etc.) |
| created_at | timestamptz | |

### `bootcamp_settings` additions

**Key: `dfy_onboarding_template`**

```json
{
  "deliverables": [
    {
      "name": "Profile rewrite",
      "description": "Rewrite LinkedIn profile headline, about section, and featured section",
      "category": "onboarding",
      "assignee": "content_lead",
      "relative_due_days": 7
    },
    {
      "name": "Content interview",
      "description": "45-60 min interview to extract knowledge, frameworks, and voice",
      "category": "onboarding",
      "assignee": "content_lead",
      "relative_due_days": 7
    },
    {
      "name": "ICP and targeting buildout",
      "description": "Define ideal client profile, target verticals, and build lead list",
      "category": "outbound",
      "assignee": "tim",
      "relative_due_days": 10
    },
    {
      "name": "Brand voice guide",
      "description": "Create brand voice and messaging guide based on content interview",
      "category": "content",
      "assignee": "content_lead",
      "relative_due_days": 10
    },
    {
      "name": "Content calendar (Month 1)",
      "description": "20 posts written, edited, and scheduled for first month",
      "category": "content",
      "assignee": "content_lead",
      "relative_due_days": 14
    },
    {
      "name": "Lead magnet #1",
      "description": "First lead magnet asset created and approved",
      "category": "funnel",
      "assignee": "tim",
      "relative_due_days": 21
    },
    {
      "name": "Conversion funnel",
      "description": "Landing page, opt-in, qualification survey, Cal.com booking integration",
      "category": "funnel",
      "assignee": "tim",
      "relative_due_days": 21
    },
    {
      "name": "HeyReach campaign setup",
      "description": "Connection request campaign configured and ready to launch",
      "category": "outbound",
      "assignee": "tim",
      "relative_due_days": 14
    },
    {
      "name": "Kondo setup",
      "description": "DM inbox management tool configured (optional value-add)",
      "category": "outbound",
      "assignee": "tim",
      "relative_due_days": 14
    },
    {
      "name": "ClickUp integration",
      "description": "ClickUp pipeline connected to lead flow",
      "category": "outbound",
      "assignee": "tim",
      "relative_due_days": 14
    },
    {
      "name": "Cal.com / Calendly setup",
      "description": "Booking link configured with qualification and CRM integration",
      "category": "onboarding",
      "assignee": "tim",
      "relative_due_days": 7
    }
  ],
  "linear_template": {
    "team_id": "TBD",
    "labels": ["DFY", "Onboarding", "Content", "Funnel", "Outbound"],
    "default_assignee": "tim"
  },
  "slack_template": {
    "channel_prefix": "client-",
    "internal_notification_channel": "#clients"
  },
  "welcome_email_template_id": "TBD"
}
```

---

## Proposal Page Signing Extension

### New section at bottom of ProposalPage.tsx (replaces removed sign-off):

**SOW Summary Block:**
- Auto-generated from `proposal.services`, `proposal.pricing`, `proposal.roadmap`
- Formatted as a clean summary: scope, timeline, monthly rate, payment terms
- Link to `/terms/msa` for full MSA

**Signature Block:**
- Full name text input
- Checkbox: "I agree to the Master Service Agreement and Statement of Work above"
- "Sign & Proceed to Payment" button (uses clientAccent color)
- On click: POST to gtm-system `/api/proposals/[id]/sign` with name, IP, user agent
- Server updates proposal status to "signed", creates `dfy_engagements` record with status "pending_payment"
- Returns Stripe Checkout URL → redirect

**Stripe Checkout:**
- Creates a subscription (not one-time payment) at the proposal's monthly rate
- `metadata.proposal_id` and `metadata.engagement_id` passed through
- On success → webhook fires → onboarding task triggers

---

## Linear Integration

### New file: `src/lib/integrations/linear.ts` (gtm-system)

**API client using Linear SDK (`@linear/sdk`)**

Functions:
- `createProject(name, teamId)` → returns project ID
- `createIssue(projectId, title, description, labels, assignee, dueDate)` → returns issue ID
- `updateIssueStatus(issueId, stateId)` → update status
- `getProjectIssues(projectId)` → list all issues

**Webhook handler: `POST /api/webhooks/linear`**
- Validates signature
- On issue state change → update `dfy_deliverables` status
- On issue comment → log to `dfy_activity_log`

### Env vars needed:
- `LINEAR_API_KEY` — Personal API key or OAuth token
- `LINEAR_TEAM_ID` — Default team for DFY projects
- `LINEAR_WEBHOOK_SECRET` — For webhook validation

---

## Client Portal

### New route in copy-of-gtm-os: `/client/:slug`

**Auth:** Simple password-based (password set during onboarding, sent in welcome email). No Supabase auth session — similar to how the GC admin portal uses `x-admin-key`.

**Components:**
- `ClientPortalPage.tsx` — Main dashboard
- `DeliverableCard.tsx` — Status badge, approve button, notes
- `ActivityTimeline.tsx` — Chronological log of all activity
- `AssetUpload.tsx` — Client can upload brand assets, logos, content

**Data fetching:** Direct Supabase reads (portal_slug → engagement → deliverables + activity)

**Client actions:**
- Approve a deliverable (status: review → approved)
- Leave a note on a deliverable
- Upload files (stored in Supabase Storage)

**Notifications on client action:**
- Approval → update Linear issue + post to Slack Connect channel
- Note → post to Slack Connect channel + log to activity

---

## Slack Integration

**Uses existing `src/lib/integrations/slack.ts` in gtm-system.**

### Channel creation:
- On engagement start: `conversations.create` with name `client-{company-slug}`
- Invite internal team members
- For Slack Connect: `conversations.inviteShared` with client's email

### Notifications posted to channel:
- Engagement started (welcome message with links)
- Deliverable moved to "review" (client needs to approve)
- Client approved a deliverable
- Milestone completed (e.g., "Content calendar delivered")
- Monthly recap

### Internal-only notifications:
- Post to `#clients` channel: new engagement, payment received, client churned

---

## Trigger.dev Task: `onboard-dfy-client`

**Location:** `src/trigger/onboard-dfy-client.ts` (gtm-system)

**Triggered by:** Stripe webhook on subscription creation (or manual API call)

**Steps:**
1. Fetch engagement record + proposal data
2. **Create Linear project** — name: "[Company] — DFY", populate issues from template
3. **Create Slack channel** — name: `client-{slug}`, invite team + client
4. **Set up MagnetLab** — create workspace, user account (reuse intro offer provisioning pattern)
5. **Send welcome email** — portal link, what to expect, first steps
6. **Update Attio** — create/update person, create deal, set stage to "Onboarding"
7. **Update engagement** — status: "onboarding" → all IDs stored (linear, slack, magnetlab)
8. **Log activity** — "Engagement started" entry

**Error handling:** Each step is independent. If one fails, others continue. Failed steps logged and retried.

---

## Implementation Phases

### Phase 1: Core Flow (Bobby's onboarding — this week)
- Database tables (dfy_engagements, dfy_deliverables, dfy_activity_log)
- Proposal signing block on ProposalPage
- `/api/proposals/[id]/sign` endpoint
- Stripe subscription checkout + webhook handler
- `onboard-dfy-client` task (basic: create records, send email)
- Client portal at `/client/:slug` (read-only dashboard)
- Deliverable template in bootcamp_settings

### Phase 2: Internal Tooling (next week)
- Linear integration (create project, populate issues, webhook sync)
- Slack Connect channel creation + notifications
- Client portal approval flow (approve deliverables, leave notes)
- Activity timeline on portal
- Internal Slack notifications to #clients

### Phase 3: Full Automation (ongoing)
- MagnetLab auto-provisioning (reuse intro offer pattern)
- Bidirectional Linear ↔ portal sync
- Monthly recurring deliverable generation (auto-create next month's tasks)
- Client asset upload (Supabase Storage)
- Reporting/analytics on engagement health
- SOW PDF auto-generation and email

---

## MSA Page

New static page at `/terms/msa` in copy-of-gtm-os:
- Standard MSA covering: scope of work (references SOW), payment terms, confidentiality (Bobby specifically asked about NDA), IP ownership, termination (month-to-month per the call), liability, governing law
- Styled consistently with the rest of the site
- Referenced from the proposal signing block

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Contract signing | On proposal page | Modern, on-brand, no vendor dependency |
| Payment | Stripe subscription | Recurring billing, automatic, webhook-triggered |
| Internal task tracking | Linear (full project) | Team already uses Linear, auto-created from template |
| Client communication | Slack Connect + portal | Slack for real-time, portal for status (not all clients use Slack) |
| Client portal auth | Simple password | No Supabase session needed, same pattern as GC admin |
| Deliverable templates | DB settings (bootcamp_settings) | Easy to update without code changes |
| Architecture | gtm-system orchestrates, copy-of-gtm-os displays | Consistent with existing repo responsibilities |
