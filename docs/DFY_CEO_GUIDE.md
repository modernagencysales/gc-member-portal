# DFY Operations Guide — CEO Edition

This guide teaches you everything you need to run the DFY (Done-For-You) automation system. It covers the full client lifecycle — from creating a proposal to delivering results — and explains what's automated versus what needs your attention.

---

## 1. System Overview

The DFY system automates client onboarding and service delivery for done-for-you engagements. When a client signs a proposal and pays, the system automatically creates their engagement, sets up deliverables, creates project management tasks in Linear, opens a Slack channel, and starts running automations like LinkedIn profile rewrites and lead magnet creation.

### Your Three Tools

| Tool | URL | What It's For |
|------|-----|---------------|
| **Admin Panel** | [modernagencysales.com/admin/dfy](https://modernagencysales.com/admin/dfy) | Manage engagements, deliverables, automations, templates |
| **Magnetlab** | [magnetlab.app](https://magnetlab.app) | Create lead magnets, content autopilot, funnels |
| **Linear** | [linear.app](https://linear.app) | Track all deliverables as issues, report bugs |

**How they connect:** You manage engagements in the Admin Panel. Behind the scenes, gtm-system (the automation engine) executes tasks — creating Linear issues, triggering profile rewrites, calling Magnetlab to build lead magnets. Linear mirrors every deliverable so you can track progress in either place. Bug reports go into Linear for the developer to fix.

---

## 2. The Client Lifecycle

### Step 1: Create a Proposal

1. Go to **Admin Panel → Proposals → New Proposal**
2. Enter client info: name, company, title, email, website
3. Paste the call transcript or notes from your sales conversation
4. Select the packages/services to include
5. Optionally add notes for the AI to consider
6. Click **Generate** — the AI creates a branded proposal (~2 minutes)
7. Review the generated proposal: headline, executive summary, services, pricing, roadmap
8. Edit any section that needs adjustment
9. Click **Publish** when ready

### Step 2: Send the Proposal

1. Copy the proposal URL: `https://modernagencysales.com/proposal/{slug}`
2. Share it with the client via email or DM
3. You can track view counts in the Proposals list — see when they've looked at it

### Step 3: Client Signs and Pays

The client sees a professional proposal page with:
- Executive summary and goals
- Service details and roadmap
- Investment/pricing
- **Statement of Work** section at the bottom with a signature block

When the client signs:
1. They type their full name and check the agreement box
2. Click **"Sign & Proceed to Payment"**
3. They're redirected to Stripe checkout for the monthly subscription
4. After payment completes, everything kicks off automatically

### Step 4: What Happens Automatically After Payment

You don't need to do anything for this — the system handles it all:

| Action | What Happens |
|--------|-------------|
| **Engagement created** | Status set to `onboarding`, start date = tomorrow |
| **Deliverables created** | 14 deliverables from the template, grouped into 5 milestones |
| **Linear project created** | `{Company} — DFY` project with all issues, milestones, dependencies |
| **Slack channel created** | Private channel, client invited via Slack Connect, welcome message posted |
| **Welcome email sent** | Via Resend to the client's email |
| **CRM updated** | Attio funnel stage set to "DFY Client" |
| **Profile rewrite fires** | AI-powered LinkedIn profile optimization starts immediately |
| **Internal notification** | Posted to #clients Slack channel |

### Step 5: The Onboarding Checklist

1. Go to **Admin Panel → DFY → click the new engagement**
2. You'll see the **Onboarding Checklist** with 9 items:
   - Transcripts access
   - Content call on books
   - Existing content/resources
   - LinkedIn login
   - ClickUp access
   - Lead list (workshop/filters)
   - Clear primary offer
   - Benchmark metrics
   - Best case studies
3. If the checklist hasn't been initialized yet, click **"Initialize Checklist"**
4. Check off items as you complete them with the client
5. Add notes to any item for context

The client can also see onboarding progress on their portal at `modernagencysales.com/client/{slug}`.

### Step 6: Managing Deliverables

Deliverables are grouped by **milestone** (5 total):

| Milestone | Focus |
|-----------|-------|
| **Onboarding** | Content interview, profile rewrite, brand voice, ICP targeting |
| **Content Engine** | Content calendar, lead magnet creation |
| **Funnel Build** | Conversion funnel setup |
| **Outbound Launch** | Email infrastructure, HeyReach campaign, Cal.com, ClickUp |
| **Optimize** | Monthly content refresh, analytics review |

**Status flow for each deliverable:**
```
pending → in_progress → review → approved → completed
```

- **pending**: Waiting to start (may be blocked by dependencies)
- **in_progress**: Work underway (manual or automation running)
- **review**: Ready for client review/approval
- **approved**: Client approved via portal
- **completed**: Done

**Dependencies:** Some deliverables can't start until prerequisites finish. A lock icon means it's blocked. For example, "Lead Magnet #1" depends on both "Brand Voice Guide" and "ICP + Targeting" being completed first.

**Changing status:** Use the status dropdown on any deliverable. Changes sync to Linear automatically, and vice versa — updating a Linear issue status updates the admin panel.

### Step 7: Automated vs Manual Deliverables

| Deliverable | Type | What Happens |
|------------|------|-------------|
| Content interview | **Manual** | You schedule and conduct this with the client |
| Profile rewrite | **Automated** | AI rewrites LinkedIn profile immediately on engagement creation |
| Brand voice guide | **Manual** | You create this after the content interview |
| ICP + targeting | **Manual** | You define ideal customer profile with the client |
| Content calendar Month 1 | **Automated** | Fires when Brand Voice Guide is done |
| Lead magnet #1 | **Automated** | Fires when Brand Voice Guide AND ICP are done |
| Conversion funnel | **Manual** | You set this up after lead magnet is created |
| Email infra setup | **Automated** | Fires when ICP is done — provisions domains + mailboxes |
| HeyReach campaign setup | **Automated** | Fires when ICP AND Email Infra are done |
| HeyReach campaign launch | **Manual** | You review and launch the campaign |
| Cal.com setup | **Manual** | You configure booking links |
| ClickUp setup | **Manual** | You set up project management for the client |
| Monthly content refresh | **Automated** | Generates fresh content each month |
| Analytics review | **Manual** | You review metrics and adjust strategy |

**Your job:** Complete manual tasks and make sure automated ones succeed. When you finish a manual task (like the content interview), update its status. This may unblock automated tasks that depend on it.

### Step 8: Triggering and Monitoring Automations

**Automation status badges:**
- **none** — Manual task, no automation
- **pending** — Waiting (dependencies not yet met, or ready to trigger)
- **running** — In progress (usually takes 1-5 minutes)
- **completed** — Finished successfully
- **failed** — Something went wrong

**To trigger an automation:**
1. Find the deliverable with a pending automation
2. Click the **"Run Automation"** button
3. Watch the status change to "running"

**To retry a failed automation:**
1. Scroll down to **Automation History**
2. Find the failed run — it shows the error message
3. Click **"Retry"**

**Daily health check:** The system runs an automatic check every day at 8 AM UTC. It catches:
- Missed automations (dependencies were met but automation didn't fire)
- Past-due deliverables
- Stuck runs (running for more than 1 hour)
- Posts a summary to the internal Slack channel

### Step 9: Using Magnetlab for Delivery

Lead magnet creation is automated — it fires when the Brand Voice Guide and ICP are both complete. The system:

1. Creates a lead magnet in Magnetlab with the client's business context
2. AI generates the content (title, toolkit, extraction)
3. Auto-publishes a funnel opt-in page
4. Generates an email sequence

You can also manually create lead magnets in Magnetlab:
1. Log into [magnetlab.app](https://magnetlab.app)
2. Use the wizard to create a new lead magnet for the client
3. The content autopilot can generate LinkedIn posts from the client's knowledge base
4. Review and approve content before publishing

---

## 3. The Template System

Templates define what deliverables get created for each new engagement. You can customize them.

### Viewing and Editing Templates

1. Go to **Admin Panel → DFY → Templates** (or navigate to `/admin/dfy/templates`)
2. Select a template from the dropdown (Standard is the default)
3. The **Edit tab** shows:
   - **Milestones:** Named phases with target day offsets (e.g., "Onboarding" at day 0, "Content Engine" at day 14)
   - **Deliverables:** Under each milestone — name, description, category, assignee, due date, dependencies, automation config
4. The **Preview tab** shows a tree view with dependency arrows and automation tags

### Editing a Template

- **Add a milestone:** Click "Add Milestone", set name, description, and target day
- **Add a deliverable:** Click "Add Deliverable" under a milestone
- **Set dependencies:** Expand a deliverable and check which other deliverables it depends on
- **Configure automation:** Check "Automatable", select the automation type (profile_rewrite, lead_magnet_create, content_calendar, heyreach_campaign, infra_provision), and set the trigger (on_create, on_prerequisite_complete, manual)
- **Reorder:** Use the up/down arrows to change order
- **Save:** Click "Save Template"

The next new engagement will use your updated template.

---

## 4. When Things Go Wrong

| Problem | What to Do |
|---------|-----------|
| **Automation failed** | Go to engagement detail → scroll to Automation History → see the error → click Retry |
| **Deliverable stuck at pending** | Check if dependencies are met (look for lock icon). If all deps are done, click "Run Automation" |
| **Client not seeing updates** | Verify the client portal link works (`/client/{slug}`). Check if Linear sync is working |
| **Status not syncing to Linear** | The Linear webhook may be misconfigured. Report as a bug |
| **Something broken in the software** | Create a Linear issue (see below) |

---

## 5. Reporting Bugs in Linear

When something breaks, create a clear bug report in Linear so the developer can fix it quickly.

### How to Create an Issue

1. Open the DFY project in [Linear](https://linear.app)
2. Click **"New Issue"**
3. Fill in:
   - **Title:** Short description of what's wrong (e.g., "Profile rewrite automation fails for new engagement")
   - **Description:** Include all of the following:
     - What you were doing (step by step)
     - What you expected to happen
     - What actually happened
     - The engagement ID or client name
     - Screenshot if possible
   - **Label:** `Bug` (for broken things), `Feature Request` (for new ideas), or `Question` (for clarification)
   - **Priority:** Urgent (system down), High (blocking client work), Medium (annoying but workaround exists), Low (nice to fix)

### What Makes a Good Bug Report

**Good example:**
> **Title:** Lead magnet automation stuck at "running" for 3 hours
>
> **Description:**
> - Engagement: Acme Corp (ID: abc-123)
> - Deliverable: "Lead magnet #1"
> - I triggered the automation at 10:00 AM by clicking "Run Automation"
> - Expected: Should complete in ~5 minutes
> - Actual: Still showing "running" 3 hours later
> - The Automation History shows no error message
> - Screenshot attached

**Bad example:**
> **Title:** Lead magnet broken
>
> **Description:** It doesn't work

---

## 6. Key URLs & Access

| Resource | URL |
|----------|-----|
| Admin Panel — DFY | `https://modernagencysales.com/admin/dfy` |
| Admin Panel — Proposals | `https://modernagencysales.com/admin/proposals` |
| Admin Panel — Templates | `https://modernagencysales.com/admin/dfy/templates` |
| Magnetlab | `https://magnetlab.app` |
| Client Portal | `https://modernagencysales.com/client/{slug}` |
| Proposal Page | `https://modernagencysales.com/proposal/{slug}` |
| Linear | `https://linear.app` (DFY project) |
| Trigger.dev Dashboard | `https://cloud.trigger.dev` (automation monitoring) |
| Stripe Dashboard | `https://dashboard.stripe.com` (payments) |

---

## Quick Reference: Daily Workflow

1. **Morning check:** Open Admin Panel → DFY. Look at stats cards — any engagements in "Onboarding" that need attention?
2. **Check automations:** Click into each active engagement. Any failed automations? Retry them.
3. **Update manual tasks:** Did you complete a content interview or brand voice guide? Update the deliverable status. This may unblock automated tasks.
4. **Review client portals:** Check if clients have approved any deliverables in "review" status.
5. **Check Linear:** Look for any new issues or status changes from the developer.
6. **Check Slack:** The daily health check posts a summary at 8 AM UTC with metrics on active engagements, past-due items, and stuck automations.

---

*For technical issues and bug reports, create a Linear issue in the DFY project. The developer uses the [DFY Developer Guide](https://github.com/modernagencysales/gtm-system/blob/main/docs/DFY_DEVELOPER_GUIDE.md) to diagnose and fix problems.*
