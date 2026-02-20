# DFY Client Onboarding System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the signing → payment → onboarding → client portal flow so Bobby Deraco (and future DFY clients) can sign, pay, and track progress from one branded experience.

**Architecture:** Proposal page (copy-of-gtm-os) gets a signing block that POSTs to gtm-system, which creates a Stripe subscription checkout. On payment success, a Trigger.dev task orchestrates provisioning (deliverables, email, Attio). The client portal at `/client/:slug` is a read-only dashboard in copy-of-gtm-os.

**Tech Stack:** React/Vite (copy-of-gtm-os), Next.js 16 + Trigger.dev (gtm-system), Supabase (shared DB), Stripe (subscriptions), Resend (email)

**Design Doc:** `docs/plans/2026-02-20-dfy-onboarding-design.md`

---

## Phase 1: Core Flow (Bobby's onboarding)

### Task 1: Create Database Tables

**Files:**
- Create: SQL migration via Supabase Management API (no file — run directly)

**Step 1: Create `dfy_engagements` table**

```sql
CREATE TABLE IF NOT EXISTS dfy_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id),
  tenant_id uuid,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_company text,
  portal_slug text UNIQUE NOT NULL,
  portal_password_hash text,
  status text NOT NULL DEFAULT 'pending_signature',
  monthly_rate integer,
  stripe_subscription_id text,
  stripe_customer_id text,
  linear_project_id text,
  slack_channel_id text,
  magnetlab_user_id text,
  signed_name text,
  signed_at timestamptz,
  signed_ip text,
  signed_user_agent text,
  start_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_dfy_engagements_portal_slug ON dfy_engagements(portal_slug);
CREATE INDEX idx_dfy_engagements_proposal_id ON dfy_engagements(proposal_id);
CREATE INDEX idx_dfy_engagements_tenant_id ON dfy_engagements(tenant_id);
```

**Step 2: Create `dfy_deliverables` table**

```sql
CREATE TABLE IF NOT EXISTS dfy_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES dfy_engagements(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  status text NOT NULL DEFAULT 'pending',
  assignee text,
  due_date date,
  sort_order integer DEFAULT 0,
  linear_issue_id text,
  client_approved_at timestamptz,
  client_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_dfy_deliverables_engagement ON dfy_deliverables(engagement_id);
```

**Step 3: Create `dfy_activity_log` table**

```sql
CREATE TABLE IF NOT EXISTS dfy_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES dfy_engagements(id) ON DELETE CASCADE,
  deliverable_id uuid REFERENCES dfy_deliverables(id) ON DELETE SET NULL,
  action text NOT NULL,
  description text,
  actor text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_dfy_activity_log_engagement ON dfy_activity_log(engagement_id);
```

**Step 4: Create RLS policies**

```sql
-- Enable RLS
ALTER TABLE dfy_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfy_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfy_activity_log ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (gtm-system uses service role)
CREATE POLICY "service_role_all" ON dfy_engagements FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON dfy_deliverables FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON dfy_activity_log FOR ALL TO service_role USING (true);

-- Anon can read engagements by portal_slug (for client portal)
CREATE POLICY "anon_read_by_slug" ON dfy_engagements FOR SELECT TO anon
  USING (true);

-- Anon can read deliverables for any engagement they can see
CREATE POLICY "anon_read_deliverables" ON dfy_deliverables FOR SELECT TO anon
  USING (true);

-- Anon can read activity log for any engagement they can see
CREATE POLICY "anon_read_activity" ON dfy_activity_log FOR SELECT TO anon
  USING (true);
```

Note: The portal slug acts as the access token (same pattern as intro offer tracker). The anon policies are permissive for reads — the portal service filters by slug. We'll add password auth in Phase 2.

**Step 5: Verify tables exist**

Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'dfy_%';`

Expected: 3 rows — `dfy_engagements`, `dfy_deliverables`, `dfy_activity_log`

**Step 6: Commit**

```bash
git add docs/plans/2026-02-20-dfy-onboarding-plan.md
git commit -m "feat(dfy): create database tables for DFY onboarding system"
```

---

### Task 2: Insert Deliverable Template into bootcamp_settings

**Files:**
- Modify: `bootcamp_settings` table (Supabase, key: `dfy_onboarding_template`)

**Step 1: Insert the template**

```sql
INSERT INTO bootcamp_settings (key, value)
VALUES ('dfy_onboarding_template', '{
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
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

**Step 2: Verify the template**

Run: `SELECT value->'deliverables' FROM bootcamp_settings WHERE key = 'dfy_onboarding_template';`

Expected: JSON array with 11 deliverable objects

---

### Task 3: MSA Page

**Files:**
- Create: `components/legal/MSAPage.tsx` (copy-of-gtm-os)
- Modify: `App.tsx` (add route)

**Step 1: Create MSA component**

Create `components/legal/MSAPage.tsx`:

```tsx
import React from 'react';

export default function MSAPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Master Service Agreement
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
          Modern Agency Sales LLC — Last updated February 2026
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2>1. Services</h2>
            <p>
              Modern Agency Sales LLC ("Provider") agrees to perform the services described in the
              accompanying Statement of Work ("SOW") for the client identified in the SOW ("Client").
              The SOW is incorporated by reference into this Agreement.
            </p>
          </section>

          <section>
            <h2>2. Term and Termination</h2>
            <p>
              This Agreement begins on the date the Client signs the SOW and continues on a
              month-to-month basis. Either party may terminate with 30 days' written notice.
              The initial commitment period, if any, is specified in the SOW.
            </p>
          </section>

          <section>
            <h2>3. Payment</h2>
            <p>
              Client agrees to pay the monthly fee specified in the SOW. Payment is collected
              automatically via Stripe on the same day each month. Late payments accrue interest
              at 1.5% per month. Provider may suspend services after 15 days of non-payment.
            </p>
          </section>

          <section>
            <h2>4. Confidentiality</h2>
            <p>
              Both parties agree to keep confidential all non-public information shared during
              the engagement, including business strategies, client lists, financial data, and
              proprietary methodologies. This obligation survives termination for 2 years.
            </p>
            <p>
              Neither party will disclose confidential information to third parties without
              prior written consent, except as required by law or to professional advisors
              bound by confidentiality obligations.
            </p>
          </section>

          <section>
            <h2>5. Intellectual Property</h2>
            <p>
              <strong>Client Content:</strong> All content created specifically for the Client
              (LinkedIn posts, lead magnets, profile copy, landing pages) is owned by the Client
              upon full payment for the month in which it was created.
            </p>
            <p>
              <strong>Provider Tools:</strong> Provider retains ownership of its proprietary tools,
              templates, frameworks, and methodologies. Client receives a non-exclusive license
              to use deliverables that incorporate these tools for the duration of the engagement.
            </p>
          </section>

          <section>
            <h2>6. Representations and Warranties</h2>
            <p>
              Provider warrants that services will be performed in a professional and workmanlike
              manner consistent with industry standards. Provider does not guarantee specific
              business outcomes such as revenue, lead volume, or conversion rates.
            </p>
          </section>

          <section>
            <h2>7. Limitation of Liability</h2>
            <p>
              Neither party shall be liable for indirect, incidental, special, or consequential
              damages. Provider's total liability under this Agreement shall not exceed the fees
              paid by Client in the 3 months preceding the claim.
            </p>
          </section>

          <section>
            <h2>8. Indemnification</h2>
            <p>
              Each party agrees to indemnify the other against third-party claims arising from
              a breach of this Agreement or negligent acts.
            </p>
          </section>

          <section>
            <h2>9. Non-Solicitation</h2>
            <p>
              During the term and for 12 months after termination, neither party will directly
              solicit the other party's employees or contractors for employment.
            </p>
          </section>

          <section>
            <h2>10. Governing Law</h2>
            <p>
              This Agreement is governed by the laws of the State of Florida. Any disputes shall
              be resolved through binding arbitration in Florida.
            </p>
          </section>

          <section>
            <h2>11. Entire Agreement</h2>
            <p>
              This Agreement, together with the SOW, constitutes the entire agreement between
              the parties. Amendments must be in writing and signed by both parties.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Modern Agency Sales LLC &middot; Questions? Email{' '}
            <a href="mailto:tim@modernagencysales.com" className="underline">
              tim@modernagencysales.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add route to App.tsx**

In `/Users/timlife/Documents/claude code/copy-of-gtm-os/App.tsx`, find the other public routes (near the `/proposal/:slug` route) and add:

```tsx
const MSAPage = lazy(() => import('./components/legal/MSAPage'));
```

And in the Routes section (near the proposal route):

```tsx
<Route path="/terms/msa" element={
  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
    <MSAPage />
  </Suspense>
} />
```

**Step 3: Verify route works**

Run: `npm run dev` in copy-of-gtm-os, visit `http://localhost:5173/terms/msa`

Expected: Clean MSA page renders with all 11 sections

**Step 4: Commit**

```bash
git add components/legal/MSAPage.tsx App.tsx
git commit -m "feat(dfy): add MSA page at /terms/msa"
```

---

### Task 4: Signing Block on ProposalPage

**Files:**
- Modify: `components/proposal/ProposalPage.tsx` (copy-of-gtm-os)
- Create: `components/proposal/SigningBlock.tsx` (copy-of-gtm-os)
- Create: `services/dfy-service.ts` (copy-of-gtm-os)

**Step 1: Create the DFY service**

Create `services/dfy-service.ts`:

```tsx
const GTM_SYSTEM_URL = import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtmconductor.com';

export interface SignProposalPayload {
  signed_name: string;
  signed_ip: string;
  signed_user_agent: string;
}

export interface SignProposalResponse {
  engagement_id: string;
  checkout_url: string;
}

export async function signProposal(
  proposalId: string,
  payload: SignProposalPayload
): Promise<SignProposalResponse> {
  const res = await fetch(`${GTM_SYSTEM_URL}/api/proposals/${proposalId}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Sign request failed' }));
    throw new Error(error.error || 'Failed to sign proposal');
  }

  return res.json();
}

export interface DfyEngagement {
  id: string;
  proposal_id: string;
  client_name: string;
  client_email: string;
  client_company: string;
  portal_slug: string;
  status: string;
  monthly_rate: number;
  start_date: string;
  created_at: string;
}

export interface DfyDeliverable {
  id: string;
  engagement_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  assignee: string;
  due_date: string;
  sort_order: number;
  client_approved_at: string | null;
  client_notes: string | null;
}

export interface DfyActivityEntry {
  id: string;
  engagement_id: string;
  deliverable_id: string | null;
  action: string;
  description: string;
  actor: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
```

**Step 2: Create the SigningBlock component**

Create `components/proposal/SigningBlock.tsx`:

```tsx
import React, { useState } from 'react';
import { signProposal } from '../../services/dfy-service';

interface SigningBlockProps {
  proposalId: string;
  services: Array<{ name: string; description: string }>;
  pricing: { total: string; frequency: string; paymentTerms?: string };
  roadmap?: Array<{ phase: string; title: string; duration: string }>;
  clientAccent: string;
  clientName: string;
}

export default function SigningBlock({
  proposalId,
  services,
  pricing,
  roadmap,
  clientAccent,
  clientName,
}: SigningBlockProps) {
  const [signedName, setSignedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSign = signedName.trim().length >= 2 && agreed && !loading;

  async function handleSign() {
    if (!canSign) return;
    setLoading(true);
    setError('');

    try {
      const result = await signProposal(proposalId, {
        signed_name: signedName.trim(),
        signed_ip: '', // Server will capture this from request headers
        signed_user_agent: navigator.userAgent,
      });

      // Redirect to Stripe Checkout
      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <section className="py-16 px-6" id="sign">
      <div className="max-w-3xl mx-auto">
        {/* SOW Summary */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Statement of Work Summary
        </h2>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Scope of Work
            </h3>
            <ul className="space-y-1">
              {services.map((svc, i) => (
                <li key={i} className="text-gray-700 dark:text-gray-300 text-sm">
                  &bull; {svc.name}
                </li>
              ))}
            </ul>
          </div>

          {roadmap && roadmap.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Timeline
              </h3>
              <ul className="space-y-1">
                {roadmap.map((phase, i) => (
                  <li key={i} className="text-gray-700 dark:text-gray-300 text-sm">
                    {phase.phase}: {phase.title} ({phase.duration})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Investment
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {pricing.total}/{pricing.frequency}
            </p>
            {pricing.paymentTerms && (
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {pricing.paymentTerms}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            Full terms at{' '}
            <a
              href="/terms/msa"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              Master Service Agreement
            </a>
          </p>
        </div>

        {/* Signature Block */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Accept &amp; Sign
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="signed-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Full legal name
              </label>
              <input
                id="signed-name"
                type="text"
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                placeholder={clientName || 'Your full name'}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <a
                  href="/terms/msa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Master Service Agreement
                </a>{' '}
                and the Statement of Work summarized above.
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              onClick={handleSign}
              disabled={!canSign}
              className="w-full py-3 px-6 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: canSign ? clientAccent : undefined,
              }}
            >
              {loading ? 'Processing...' : 'Sign & Proceed to Payment'}
            </button>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              By clicking above, you agree that typing your name constitutes a legally binding electronic signature.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 3: Add SigningBlock to ProposalPage**

In `components/proposal/ProposalPage.tsx`, add the import at the top:

```tsx
import SigningBlock from './SigningBlock';
```

Replace the comment `{/* Section 10 (sign-off + CTA) removed */}` with:

```tsx
{/* Section 10: Signing Block */}
{proposal.status === 'published' && (
  <SigningBlock
    proposalId={proposal.id}
    services={proposal.services || []}
    pricing={proposal.pricing || { total: '', frequency: '' }}
    roadmap={proposal.roadmap}
    clientAccent={branding.clientBrandColor || '#2563eb'}
    clientName={proposal.clientName || ''}
  />
)}
```

Note: The signing block only shows for `published` proposals. Once signed, the status changes to `signed` and the block disappears.

**Step 4: Verify locally**

Run: `npm run dev` in copy-of-gtm-os, visit Bobby's proposal URL

Expected: SOW summary + signature form appears at the bottom of the proposal. Button is disabled until name is typed and checkbox is checked.

**Step 5: Commit**

```bash
git add services/dfy-service.ts components/proposal/SigningBlock.tsx components/proposal/ProposalPage.tsx
git commit -m "feat(dfy): add SOW summary and signing block to proposal page"
```

---

### Task 5: Sign Endpoint in gtm-system

**Files:**
- Create: `src/app/api/proposals/[id]/sign/route.ts` (gtm-system)
- Modify: `src/middleware.ts` — add CORS for the sign endpoint (already covered by `/api/proposals` prefix)

**Step 1: Verify CSRF and CORS are already configured**

From research: `/api/proposals` is already in the CSRF skip list and has CORS headers configured. The new `/api/proposals/[id]/sign` route is a child path so it's covered. No middleware changes needed.

**Step 2: Create the sign route**

Create `src/app/api/proposals/[id]/sign/route.ts` in gtm-system:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

function generatePortalSlug(company: string): string {
  const base = company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;

  try {
    const body = await request.json();
    const { signed_name, signed_user_agent } = body;

    if (!signed_name || typeof signed_name !== 'string' || signed_name.trim().length < 2) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    // Get client IP from headers (Railway/Vercel forward these)
    const signed_ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 1. Fetch the proposal
    const { data: proposal, error: proposalErr } = await supabase
      .from('proposals')
      .select('id, slug, status, client_name, client_email, client_company, pricing, services, roadmap, tenant_id')
      .eq('id', proposalId)
      .single();

    if (proposalErr || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'published') {
      return NextResponse.json(
        { error: `Proposal cannot be signed in "${proposal.status}" status` },
        { status: 400 }
      );
    }

    // 2. Parse monthly rate from pricing
    const pricingTotal = proposal.pricing?.total || '';
    const monthlyRateCents = Math.round(
      parseFloat(pricingTotal.replace(/[^0-9.]/g, '')) * 100
    ) || 0;

    if (monthlyRateCents <= 0) {
      return NextResponse.json({ error: 'Invalid pricing on proposal' }, { status: 400 });
    }

    // 3. Create dfy_engagements record
    const portalSlug = generatePortalSlug(proposal.client_company || proposal.client_name);

    const { data: engagement, error: engErr } = await supabase
      .from('dfy_engagements')
      .insert({
        proposal_id: proposalId,
        tenant_id: proposal.tenant_id,
        client_name: proposal.client_name,
        client_email: proposal.client_email,
        client_company: proposal.client_company,
        portal_slug: portalSlug,
        status: 'pending_payment',
        monthly_rate: monthlyRateCents,
        signed_name: signed_name.trim(),
        signed_at: new Date().toISOString(),
        signed_ip,
        signed_user_agent: signed_user_agent || '',
      })
      .select('id')
      .single();

    if (engErr) {
      console.error('Failed to create engagement:', engErr);
      return NextResponse.json({ error: 'Failed to create engagement' }, { status: 500 });
    }

    // 4. Update proposal status to "signed"
    await supabase
      .from('proposals')
      .update({ status: 'signed' })
      .eq('id', proposalId);

    // 5. Create Stripe Checkout Session (subscription)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: proposal.client_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            recurring: { interval: 'month' },
            product_data: {
              name: `DFY LinkedIn Growth — ${proposal.client_company || proposal.client_name}`,
              description: (proposal.services || []).map((s: { name: string }) => s.name).join(', '),
            },
            unit_amount: monthlyRateCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'dfy_engagement',
        proposal_id: proposalId,
        engagement_id: engagement.id,
        tenant_id: proposal.tenant_id || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://modernagencysales.com'}/client/${portalSlug}?welcome=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://modernagencysales.com'}/proposal/${proposal.slug}`,
    });

    return NextResponse.json({
      engagement_id: engagement.id,
      checkout_url: session.url,
    });
  } catch (err) {
    console.error('Sign endpoint error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 3: Verify the route**

Test with curl (substitute a real proposal ID):

```bash
curl -X POST https://gtmconductor.com/api/proposals/PROPOSAL_ID/sign \
  -H "Content-Type: application/json" \
  -d '{"signed_name":"Test User","signed_user_agent":"curl"}'
```

Expected: JSON with `engagement_id` and `checkout_url`

**Step 4: Commit**

```bash
git add src/app/api/proposals/\[id\]/sign/route.ts
git commit -m "feat(dfy): add proposal sign endpoint with Stripe subscription checkout"
```

---

### Task 6: Extend Stripe Webhook for DFY Subscriptions

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts` (gtm-system)

**Step 1: Add DFY engagement handling to the Stripe webhook**

In the existing webhook handler, find the `checkout.session.completed` dispatch block. After the existing `intro_offer` check, add the DFY engagement handler:

```typescript
// Inside the checkout.session.completed handler, after the intro_offer block:

if (obj.metadata?.type === 'dfy_engagement') {
  const engagementId = obj.metadata.engagement_id;
  const proposalId = obj.metadata.proposal_id;
  const subscriptionId = obj.subscription as string;
  const customerId = obj.customer as string;

  // Update engagement with Stripe IDs and status
  await supabase
    .from('dfy_engagements')
    .update({
      status: 'onboarding',
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      start_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', engagementId);

  // Trigger onboarding task
  await tasks.trigger('onboard-dfy-client', {
    engagement_id: engagementId,
    proposal_id: proposalId,
    tenant_id: tenantId,
  });

  return NextResponse.json({ success: true, action: 'dfy_onboarding_triggered' });
}
```

**Step 2: Also handle `customer.subscription.deleted` for DFY**

In the subscription deleted handler, add:

```typescript
// Check if this subscription belongs to a DFY engagement
const { data: engagement } = await supabase
  .from('dfy_engagements')
  .select('id')
  .eq('stripe_subscription_id', obj.id)
  .single();

if (engagement) {
  await supabase
    .from('dfy_engagements')
    .update({ status: 'churned' })
    .eq('id', engagement.id);

  // Log activity
  await supabase.from('dfy_activity_log').insert({
    engagement_id: engagement.id,
    action: 'status_change',
    description: 'Subscription cancelled — engagement marked as churned',
    actor: 'System',
    metadata: { old_status: 'active', new_status: 'churned' },
  });
}
```

**Step 3: Verify by reading the modified handler**

Review the full handler to ensure there are no conflicts with existing `checkout.session.completed` logic.

**Step 4: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat(dfy): handle DFY subscription in Stripe webhook"
```

---

### Task 7: Trigger.dev Task — `onboard-dfy-client`

**Files:**
- Create: `src/trigger/dfy/onboard.ts` (gtm-system)

**Step 1: Create the onboarding task**

Create `src/trigger/dfy/onboard.ts`:

```typescript
import { task, logger } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface OnboardPayload {
  engagement_id: string;
  proposal_id: string;
  tenant_id: string;
}

export const onboardDfyClient = task({
  id: 'onboard-dfy-client',
  retry: { maxAttempts: 2 },
  run: async (payload: OnboardPayload) => {
    const { engagement_id, proposal_id, tenant_id } = payload;
    const supabase = getSupabase();

    logger.info('Starting DFY client onboarding', { engagement_id, proposal_id });

    // 1. Fetch engagement + proposal
    const { data: engagement, error: engErr } = await supabase
      .from('dfy_engagements')
      .select('*')
      .eq('id', engagement_id)
      .single();

    if (engErr || !engagement) {
      logger.error('Engagement not found', { engagement_id, error: engErr });
      throw new Error(`Engagement ${engagement_id} not found`);
    }

    const { data: proposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposal_id)
      .single();

    // 2. Fetch deliverable template
    const { data: templateRow } = await supabase
      .from('bootcamp_settings')
      .select('value')
      .eq('key', 'dfy_onboarding_template')
      .single();

    const template = templateRow?.value;
    const deliverableTemplates = template?.deliverables || [];

    // 3. Create deliverables from template
    const startDate = new Date(engagement.start_date || new Date());
    const deliverables = deliverableTemplates.map((d: {
      name: string;
      description: string;
      category: string;
      assignee: string;
      relative_due_days: number;
    }, index: number) => {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + d.relative_due_days);

      return {
        engagement_id,
        name: d.name,
        description: d.description,
        category: d.category,
        status: 'pending',
        assignee: d.assignee,
        due_date: dueDate.toISOString().split('T')[0],
        sort_order: index,
      };
    });

    if (deliverables.length > 0) {
      const { error: delErr } = await supabase
        .from('dfy_deliverables')
        .insert(deliverables);

      if (delErr) {
        logger.error('Failed to create deliverables', { error: delErr });
      } else {
        logger.info('Created deliverables', { count: deliverables.length });
      }
    }

    // 4. Run remaining steps in parallel (each is non-fatal)
    const results = await Promise.allSettled([
      // 4a. Send welcome email
      sendWelcomeEmail(engagement),

      // 4b. Update Attio (if configured)
      updateAttio(engagement),

      // 4c. Log activity
      supabase.from('dfy_activity_log').insert({
        engagement_id,
        action: 'status_change',
        description: `Onboarding started for ${engagement.client_company || engagement.client_name}`,
        actor: 'System',
        metadata: { status: 'onboarding' },
      }),
    ]);

    // Log any failures
    results.forEach((result, index) => {
      const stepNames = ['welcome_email', 'attio_update', 'activity_log'];
      if (result.status === 'rejected') {
        logger.error(`Step ${stepNames[index]} failed`, { error: String(result.reason) });
      }
    });

    // 5. Update engagement status to active
    await supabase
      .from('dfy_engagements')
      .update({ status: 'active' })
      .eq('id', engagement_id);

    logger.info('DFY onboarding complete', { engagement_id });
    return { success: true, engagement_id, deliverables_created: deliverables.length };
  },
});

async function sendWelcomeEmail(engagement: {
  client_name: string;
  client_email: string;
  client_company: string;
  portal_slug: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    logger.warn('RESEND_API_KEY not set, skipping welcome email');
    return;
  }

  const resend = new Resend(resendKey);
  const portalUrl = `https://modernagencysales.com/client/${engagement.portal_slug}`;

  await resend.emails.send({
    from: 'Tim Keen <tim@modernagencysales.com>',
    to: engagement.client_email,
    subject: `Welcome aboard, ${engagement.client_name.split(' ')[0]}! Here's your client portal`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Modern Agency Sales</h2>
        <p>Hey ${engagement.client_name.split(' ')[0]},</p>
        <p>We're excited to get started. Your client portal is live — this is where you'll track progress on all deliverables, approve work, and stay in the loop.</p>
        <p><a href="${portalUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your Portal</a></p>
        <h3>What happens next:</h3>
        <ol>
          <li><strong>Content interview</strong> — We'll schedule a 45-60 min call to understand your voice, frameworks, and expertise</li>
          <li><strong>Profile rewrite</strong> — Your LinkedIn profile gets a complete overhaul</li>
          <li><strong>ICP buildout</strong> — We define your ideal client profile and build targeting lists</li>
          <li><strong>Content calendar</strong> — 20 posts written, edited, and scheduled for Month 1</li>
        </ol>
        <p>We'll be in touch within 24 hours to schedule your content interview.</p>
        <p>— Tim</p>
      </div>
    `,
  });

  logger.info('Welcome email sent', { to: engagement.client_email });
}

async function updateAttio(engagement: {
  client_name: string;
  client_email: string;
  client_company: string;
}) {
  const attioKey = process.env.ATTIO_API_KEY;
  if (!attioKey) {
    logger.warn('ATTIO_API_KEY not set, skipping Attio update');
    return;
  }

  // Update person's funnel_stage to "DFY Client"
  try {
    const searchRes = await fetch('https://api.attio.com/v2/objects/people/records/query', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attioKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { email_addresses: engagement.client_email },
      }),
    });

    const searchData = await searchRes.json();
    const person = searchData?.data?.[0];

    if (person) {
      await fetch(`https://api.attio.com/v2/objects/people/records/${person.id.record_id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${attioKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            values: {
              funnel_stage: [{ option: 'DFY Client' }],
            },
          },
        }),
      });
      logger.info('Attio person updated', { email: engagement.client_email });
    }
  } catch (err) {
    logger.error('Attio update failed', { error: String(err) });
    throw err; // Let Promise.allSettled catch it
  }
}
```

**Step 2: Verify the task builds**

Run from gtm-system directory:

```bash
npm run build
```

Expected: No TypeScript errors related to the new task file.

**Step 3: Commit**

```bash
git add src/trigger/dfy/onboard.ts
git commit -m "feat(dfy): add onboard-dfy-client Trigger.dev task"
```

---

### Task 8: Client Portal Service Layer

**Files:**
- Modify: `services/dfy-service.ts` (copy-of-gtm-os — created in Task 4, adding portal functions)

**Step 1: Add portal data fetching functions to dfy-service.ts**

Append to `services/dfy-service.ts`:

```typescript
import { supabase } from '../lib/supabaseClient';

const DFY_ENGAGEMENT_COLUMNS = `
  id, proposal_id, client_name, client_email, client_company,
  portal_slug, status, monthly_rate, start_date, created_at
`;

const DFY_DELIVERABLE_COLUMNS = `
  id, engagement_id, name, description, category, status,
  assignee, due_date, sort_order, client_approved_at, client_notes, created_at
`;

const DFY_ACTIVITY_COLUMNS = `
  id, engagement_id, deliverable_id, action, description,
  actor, metadata, created_at
`;

export async function getEngagementBySlug(slug: string): Promise<DfyEngagement | null> {
  const { data, error } = await supabase
    .from('dfy_engagements')
    .select(DFY_ENGAGEMENT_COLUMNS)
    .eq('portal_slug', slug)
    .single();

  if (error || !data) return null;
  return data as DfyEngagement;
}

export async function getDeliverables(engagementId: string): Promise<DfyDeliverable[]> {
  const { data, error } = await supabase
    .from('dfy_deliverables')
    .select(DFY_DELIVERABLE_COLUMNS)
    .eq('engagement_id', engagementId)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data as DfyDeliverable[];
}

export async function getActivityLog(engagementId: string): Promise<DfyActivityEntry[]> {
  const { data, error } = await supabase
    .from('dfy_activity_log')
    .select(DFY_ACTIVITY_COLUMNS)
    .eq('engagement_id', engagementId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data as DfyActivityEntry[];
}
```

**Step 2: Commit**

```bash
git add services/dfy-service.ts
git commit -m "feat(dfy): add client portal data fetching service"
```

---

### Task 9: Client Portal Components and Route

**Files:**
- Create: `components/client-portal/ClientPortalPage.tsx` (copy-of-gtm-os)
- Create: `components/client-portal/DeliverableCard.tsx` (copy-of-gtm-os)
- Modify: `App.tsx` — add `/client/:slug` route

**Step 1: Create DeliverableCard component**

Create `components/client-portal/DeliverableCard.tsx`:

```tsx
import React from 'react';
import { DfyDeliverable } from '../../services/dfy-service';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
  in_progress: { label: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  review: { label: 'Ready for Review', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  approved: { label: 'Approved', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  completed: { label: 'Completed', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/30' },
};

const CATEGORY_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  content: 'Content',
  funnel: 'Funnel',
  outbound: 'Outbound',
};

interface DeliverableCardProps {
  deliverable: DfyDeliverable;
}

export default function DeliverableCard({ deliverable }: DeliverableCardProps) {
  const status = STATUS_CONFIG[deliverable.status] || STATUS_CONFIG.pending;
  const categoryLabel = CATEGORY_LABELS[deliverable.category] || deliverable.category;

  const dueDate = deliverable.due_date
    ? new Date(deliverable.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
            {deliverable.name}
          </h3>
          {deliverable.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {deliverable.description}
            </p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${status.color} ${status.bg}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
          {categoryLabel}
        </span>
        {dueDate && <span>Due {dueDate}</span>}
        {deliverable.client_approved_at && (
          <span className="text-green-600 dark:text-green-400">
            Approved {new Date(deliverable.client_approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create ClientPortalPage component**

Create `components/client-portal/ClientPortalPage.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  DfyEngagement,
  DfyDeliverable,
  getEngagementBySlug,
  getDeliverables,
} from '../../services/dfy-service';
import DeliverableCard from './DeliverableCard';

const STATUS_ORDER = ['review', 'in_progress', 'pending', 'approved', 'completed'];

export default function ClientPortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';

  const [engagement, setEngagement] = useState<DfyEngagement | null>(null);
  const [deliverables, setDeliverables] = useState<DfyDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    async function load() {
      setLoading(true);
      const eng = await getEngagementBySlug(slug!);
      if (!eng) {
        setError('Portal not found');
        setLoading(false);
        return;
      }
      setEngagement(eng);

      const dels = await getDeliverables(eng.id);
      setDeliverables(dels);
      setLoading(false);
    }

    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading portal...</div>
      </div>
    );
  }

  if (error || !engagement) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Not Found</h1>
          <p className="text-gray-500">This portal link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  // Group deliverables by category
  const categories = ['onboarding', 'content', 'funnel', 'outbound'];
  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = deliverables
      .filter((d) => d.category === cat)
      .sort((a, b) => {
        const ai = STATUS_ORDER.indexOf(a.status);
        const bi = STATUS_ORDER.indexOf(b.status);
        return ai - bi;
      });
    return acc;
  }, {} as Record<string, DfyDeliverable[]>);

  const completedCount = deliverables.filter(
    (d) => d.status === 'approved' || d.status === 'completed'
  ).length;
  const progressPct = deliverables.length > 0
    ? Math.round((completedCount / deliverables.length) * 100)
    : 0;

  const CATEGORY_LABELS: Record<string, string> = {
    onboarding: 'Onboarding',
    content: 'Content',
    funnel: 'Lead Magnet & Funnel',
    outbound: 'Outbound & DMs',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Client Portal
            </p>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {engagement.client_company || engagement.client_name}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Modern Agency Sales
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome banner */}
        {isWelcome && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
              Welcome, {engagement.client_name.split(' ')[0]}! Your engagement is set up and we're getting started.
              You'll see deliverables update here as we work through your onboarding.
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completedCount}/{deliverables.length} complete
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Deliverables by category */}
        <div className="space-y-8">
          {categories.map((cat) => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;

            return (
              <section key={cat}>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  {CATEGORY_LABELS[cat] || cat}
                </h2>
                <div className="space-y-2">
                  {items.map((d) => (
                    <DeliverableCard key={d.id} deliverable={d} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {deliverables.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">
              Your deliverables are being set up. Check back shortly.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Questions? Email{' '}
            <a
              href="mailto:tim@modernagencysales.com"
              className="underline hover:text-gray-600 dark:hover:text-gray-300"
            >
              tim@modernagencysales.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 3: Add route to App.tsx**

In `App.tsx`, add the lazy import:

```tsx
const ClientPortalPage = lazy(() => import('./components/client-portal/ClientPortalPage'));
```

And add the route near the other public routes:

```tsx
<Route path="/client/:slug" element={
  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
    <ClientPortalPage />
  </Suspense>
} />
```

**Step 4: Verify locally**

Run: `npm run dev` in copy-of-gtm-os, visit `http://localhost:5173/client/test-slug`

Expected: "Not Found" page displays (no engagement exists yet). Once a real engagement is created, the portal renders with deliverables grouped by category.

**Step 5: Commit**

```bash
git add components/client-portal/ClientPortalPage.tsx components/client-portal/DeliverableCard.tsx App.tsx
git commit -m "feat(dfy): add client portal at /client/:slug with deliverable dashboard"
```

---

### Task 10: Deploy copy-of-gtm-os

**Step 1: Build check**

```bash
cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Deploy to Vercel**

```bash
cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && vercel --prod
```

Expected: Deployment succeeds, production URL is live.

**Step 3: Verify**
- Visit `/terms/msa` — MSA page renders
- Visit `/client/nonexistent` — "Not Found" renders
- Visit Bobby's proposal — signing block appears at bottom

---

### Task 11: Deploy gtm-system

**Step 1: Push to git (triggers Railway auto-deploy)**

```bash
cd "/Users/timlife/Documents/claude code/gtm-system" && git push
```

**Step 2: Deploy Trigger.dev tasks**

```bash
cd "/Users/timlife/Documents/claude code/gtm-system" && TRIGGER_SECRET_KEY=tr_prod_Fxgn6CdrH6v2NSMVhSJL npx trigger.dev@4.3.3 deploy
```

Expected: Deploy succeeds, `onboard-dfy-client` task appears in Trigger.dev dashboard.

**Step 3: Set required env vars on Trigger.dev (if not already set)**

Ensure these are set in Trigger.dev environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY` (for welcome emails)
- `ATTIO_API_KEY` (for CRM updates)

**Step 4: Verify sign endpoint**

```bash
curl -s https://gtmconductor.com/api/proposals/test/sign \
  -H "Content-Type: application/json" \
  -d '{"signed_name":"Test"}' | jq .
```

Expected: `{"error": "Proposal not found"}` (404 — confirms the route is live and reachable)

---

## Phase 1 Summary

After completing all 11 tasks, the flow is:

1. Client visits proposal page → sees SOW summary + signing block at bottom
2. Client types name, agrees to MSA, clicks "Sign & Proceed to Payment"
3. Frontend POSTs to gtm-system `/api/proposals/{id}/sign`
4. Server creates `dfy_engagements` record, creates Stripe subscription checkout, returns URL
5. Client redirects to Stripe → pays → Stripe webhook fires
6. Webhook handler updates engagement status, triggers `onboard-dfy-client` task
7. Task creates deliverables from template, sends welcome email, updates Attio
8. Client redirects to `/client/{slug}?welcome=true` → sees their portal with all deliverables

---

## Phase 2: Internal Tooling (Next Week)

> Tasks below are outlined but not fully detailed. They'll be expanded when Phase 1 is complete.

### Task 12: Linear SDK Integration
- Install `@linear/sdk` in gtm-system
- Create `src/lib/integrations/linear.ts` with `createProject`, `createIssue`, `updateIssueStatus`
- Add Linear project + issue creation to `onboard-dfy-client` task

### Task 13: Linear Webhook Handler
- Create `src/app/api/webhooks/linear/route.ts`
- Validate HMAC-SHA256 signature (`Linear-Signature` header)
- On issue state change → update `dfy_deliverables` status
- Add to CSRF skip list and webhook_events idempotency

### Task 14: Slack Connect Channel Creation
- Add `createChannel`, `inviteToChannel`, `inviteShared` methods to `SlackClient`
- Add channel creation to `onboard-dfy-client` task
- Post welcome message to new channel

### Task 15: Client Portal Approval Flow
- Add "Approve" button to `DeliverableCard` when status is `review`
- POST approval to gtm-system → update `dfy_deliverables` + Linear issue
- Post notification to Slack channel

### Task 16: Activity Timeline
- Create `ActivityTimeline.tsx` component
- Fetch and render `dfy_activity_log` entries chronologically
- Add to `ClientPortalPage` below deliverables

### Task 17: Internal Slack Notifications
- Post to `#clients` channel on: new engagement, payment received, deliverable approved
- Use existing `SlackClient.sendMessage`

---

## Phase 3: Full Automation (Ongoing)

### Task 18: MagnetLab Auto-Provisioning
### Task 19: Bidirectional Linear-Portal Sync
### Task 20: Monthly Recurring Deliverable Generation
### Task 21: Client Asset Upload (Supabase Storage)
### Task 22: SOW PDF Auto-Generation
### Task 23: Engagement Health Dashboard

---

## Environment Variables Checklist

### gtm-system (Railway + Trigger.dev)
- `STRIPE_SECRET_KEY` — for creating checkout sessions
- `STRIPE_WEBHOOK_SECRET` — already set for existing Stripe webhook
- `RESEND_API_KEY` — for welcome emails
- `ATTIO_API_KEY` — already set for CRM updates
- `LINEAR_API_KEY` — Phase 2
- `LINEAR_TEAM_ID` — Phase 2
- `LINEAR_WEBHOOK_SECRET` — Phase 2

### copy-of-gtm-os (Vercel)
- `VITE_GTM_SYSTEM_URL` — already set (`https://gtmconductor.com`)
- No new env vars needed for Phase 1

### Supabase
- No new secrets needed — service role key already configured
