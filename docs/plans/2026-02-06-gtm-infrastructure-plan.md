# GTM Infrastructure Module — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a self-service provisioning wizard + dashboard in the Bootcamp LMS that lets students purchase and automatically set up their cold email + LinkedIn outreach infrastructure across Zapmail, PlusVibe, and HeyReach.

**Architecture:** Multi-repo feature spanning copy-of-gtm-os (frontend wizard + dashboard), gtm-system (API routes + Trigger.dev provisioning task), and shared Supabase (new tables). Frontend is a React wizard embedded in the Bootcamp sidebar. Backend provisioning runs as an async Trigger.dev task that orchestrates Zapmail, PlusVibe, and HeyReach APIs. Stripe handles one-time + monthly billing.

**Tech Stack:** React 18 + TypeScript + Vite, TanStack Query, Tailwind CSS, Supabase (DB + Edge Functions), Stripe, Trigger.dev, Zapmail API, PlusVibe API + Partner API, HeyReach API

**Design Doc:** `docs/plans/2026-02-06-gtm-infrastructure-design.md` — read this first for full context.

---

## Phase 1: Database + Types + Service Layer

### Task 1: Create Database Migration

**Files:**
- Create: `supabase/migrations/20260206120000_infrastructure_tables.sql`

**Step 1: Write the migration**

```sql
-- ============================================
-- GTM Infrastructure Provisioning Tables
-- ============================================

-- Tier packages (admin-configurable)
CREATE TABLE IF NOT EXISTS infra_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain_count INT NOT NULL,
  mailboxes_per_domain INT NOT NULL DEFAULT 2,
  setup_fee_cents INT NOT NULL,
  monthly_fee_cents INT NOT NULL,
  stripe_setup_price_id TEXT,
  stripe_monthly_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provision records (one per student)
CREATE TABLE IF NOT EXISTS infra_provisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES bootcamp_students(id),
  tier_id UUID NOT NULL REFERENCES infra_tiers(id),
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'provisioning', 'active', 'failed', 'cancelled', 'upgrading')),
  stripe_checkout_session_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  mailbox_pattern_1 TEXT NOT NULL,
  mailbox_pattern_2 TEXT NOT NULL,
  zapmail_workspace_id TEXT,
  zapmail_workspace_key TEXT,
  plusvibe_workspace_id TEXT,
  plusvibe_client_id TEXT,
  plusvibe_client_email TEXT,
  plusvibe_client_password TEXT,
  heyreach_list_id BIGINT,
  provisioning_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Domains per provision
CREATE TABLE IF NOT EXISTS infra_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provision_id UUID NOT NULL REFERENCES infra_provisions(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  zapmail_domain_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'purchasing', 'dns_pending', 'connected', 'active', 'failed')),
  mailboxes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_infra_provisions_student ON infra_provisions(student_id);
CREATE INDEX IF NOT EXISTS idx_infra_provisions_status ON infra_provisions(status);
CREATE INDEX IF NOT EXISTS idx_infra_domains_provision ON infra_domains(provision_id);
CREATE INDEX IF NOT EXISTS idx_infra_tiers_active ON infra_tiers(is_active, sort_order);

-- RLS
ALTER TABLE infra_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra_provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra_domains ENABLE ROW LEVEL SECURITY;

-- Everyone can read active tiers
CREATE POLICY "Anyone can read active tiers"
ON infra_tiers FOR SELECT USING (is_active = true);

-- Students read own provisions
CREATE POLICY "Students read own provisions"
ON infra_provisions FOR SELECT
USING (student_id IN (
  SELECT id FROM bootcamp_students WHERE email = auth.jwt() ->> 'email'
));

-- Students read own domains
CREATE POLICY "Students read own domains"
ON infra_domains FOR SELECT
USING (provision_id IN (
  SELECT id FROM infra_provisions WHERE student_id IN (
    SELECT id FROM bootcamp_students WHERE email = auth.jwt() ->> 'email'
  )
));

-- Service role full access
CREATE POLICY "Service role manages infra_tiers"
ON infra_tiers FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages infra_provisions"
ON infra_provisions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages infra_domains"
ON infra_domains FOR ALL USING (auth.role() = 'service_role');

-- Seed default tiers (placeholder Stripe price IDs — update after creating in Stripe)
INSERT INTO infra_tiers (name, slug, domain_count, mailboxes_per_domain, setup_fee_cents, monthly_fee_cents, sort_order) VALUES
  ('Starter', 'starter', 3, 2, 9700, 4700, 0),
  ('Growth', 'growth', 5, 2, 14700, 7700, 1),
  ('Scale', 'scale', 10, 2, 24700, 12700, 2);
```

**Step 2: Apply migration**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx supabase db push`
Or apply via Supabase Management API if remote.

**Step 3: Commit**

```bash
git add supabase/migrations/20260206120000_infrastructure_tables.sql
git commit -m "feat: add infrastructure provisioning tables (infra_tiers, infra_provisions, infra_domains)"
```

---

### Task 2: Create TypeScript Types

**Files:**
- Create: `types/infrastructure-types.ts`

**Step 1: Write the types file**

```typescript
// ============================================
// GTM Infrastructure Types
// ============================================

export interface InfraTier {
  id: string;
  name: string;
  slug: string;
  domainCount: number;
  mailboxesPerDomain: number;
  setupFeeCents: number;
  monthlyFeeCents: number;
  stripeSetupPriceId: string | null;
  stripeMonthlyPriceId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type ProvisionStatus =
  | 'pending_payment'
  | 'provisioning'
  | 'active'
  | 'failed'
  | 'cancelled'
  | 'upgrading';

export interface InfraProvision {
  id: string;
  studentId: string;
  tierId: string;
  status: ProvisionStatus;
  stripeCheckoutSessionId: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  mailboxPattern1: string;
  mailboxPattern2: string;
  zapmailWorkspaceId: string | null;
  zapmailWorkspaceKey: string | null;
  plusvibeWorkspaceId: string | null;
  plusvibeClientId: string | null;
  plusvibeClientEmail: string | null;
  heyreachListId: number | null;
  provisioningLog: ProvisioningStep[];
  createdAt: string;
  updatedAt: string;
}

export type DomainStatus =
  | 'pending'
  | 'purchasing'
  | 'dns_pending'
  | 'connected'
  | 'active'
  | 'failed';

export interface DomainMailbox {
  username: string;
  email: string;
  zapmailMailboxId?: string;
  plusvibeAccountId?: string;
}

export interface InfraDomain {
  id: string;
  provisionId: string;
  domainName: string;
  zapmailDomainId: string | null;
  status: DomainStatus;
  mailboxes: DomainMailbox[];
  createdAt: string;
  updatedAt: string;
}

export interface ProvisioningStep {
  step: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  details?: Record<string, unknown>;
}

// Wizard state
export interface WizardState {
  step: number;
  selectedTier: InfraTier | null;
  selectedDomains: DomainAvailability[];
  mailboxPattern1: string;
  mailboxPattern2: string;
}

export interface DomainAvailability {
  domainName: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  domainPrice: string;
  renewPrice: string;
}

// Provision with related data (for dashboard)
export interface InfraProvisionWithDetails extends InfraProvision {
  tier: InfraTier;
  domains: InfraDomain[];
}
```

**Step 2: Commit**

```bash
git add types/infrastructure-types.ts
git commit -m "feat: add infrastructure TypeScript types"
```

---

### Task 3: Create Service Layer

**Files:**
- Create: `services/infrastructure-supabase.ts`

**Step 1: Write the service file**

Follow existing pattern from `services/chat-supabase.ts` — mapping functions + query/mutation exports.

```typescript
import { supabase } from '../lib/supabaseClient';
import {
  InfraTier,
  InfraProvision,
  InfraDomain,
  InfraProvisionWithDetails,
  ProvisioningStep,
} from '../types/infrastructure-types';

// ============================================
// Mappers
// ============================================

function mapTier(data: Record<string, unknown>): InfraTier {
  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    domainCount: data.domain_count as number,
    mailboxesPerDomain: data.mailboxes_per_domain as number,
    setupFeeCents: data.setup_fee_cents as number,
    monthlyFeeCents: data.monthly_fee_cents as number,
    stripeSetupPriceId: data.stripe_setup_price_id as string | null,
    stripeMonthlyPriceId: data.stripe_monthly_price_id as string | null,
    isActive: data.is_active as boolean,
    sortOrder: data.sort_order as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapProvision(data: Record<string, unknown>): InfraProvision {
  return {
    id: data.id as string,
    studentId: data.student_id as string,
    tierId: data.tier_id as string,
    status: data.status as InfraProvision['status'],
    stripeCheckoutSessionId: data.stripe_checkout_session_id as string | null,
    stripeSubscriptionId: data.stripe_subscription_id as string | null,
    stripeCustomerId: data.stripe_customer_id as string | null,
    mailboxPattern1: data.mailbox_pattern_1 as string,
    mailboxPattern2: data.mailbox_pattern_2 as string,
    zapmailWorkspaceId: data.zapmail_workspace_id as string | null,
    zapmailWorkspaceKey: data.zapmail_workspace_key as string | null,
    plusvibeWorkspaceId: data.plusvibe_workspace_id as string | null,
    plusvibeClientId: data.plusvibe_client_id as string | null,
    plusvibeClientEmail: data.plusvibe_client_email as string | null,
    heyreachListId: data.heyreach_list_id as number | null,
    provisioningLog: (data.provisioning_log as ProvisioningStep[]) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapDomain(data: Record<string, unknown>): InfraDomain {
  return {
    id: data.id as string,
    provisionId: data.provision_id as string,
    domainName: data.domain_name as string,
    zapmailDomainId: data.zapmail_domain_id as string | null,
    status: data.status as InfraDomain['status'],
    mailboxes: (data.mailboxes as InfraDomain['mailboxes']) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// ============================================
// Queries
// ============================================

export async function fetchActiveTiers(): Promise<InfraTier[]> {
  const { data, error } = await supabase
    .from('infra_tiers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTier);
}

export async function fetchProvisionByStudentId(
  studentId: string
): Promise<InfraProvisionWithDetails | null> {
  const { data, error } = await supabase
    .from('infra_provisions')
    .select('*, infra_tiers(*), infra_domains(*)')
    .eq('student_id', studentId)
    .single();

  if (error || !data) return null;

  const provision = mapProvision(data);
  const tier = mapTier(data.infra_tiers as Record<string, unknown>);
  const domains = ((data.infra_domains as Record<string, unknown>[]) || []).map(mapDomain);

  return { ...provision, tier, domains };
}

export async function fetchProvisioningLog(
  provisionId: string
): Promise<ProvisioningStep[]> {
  const { data, error } = await supabase
    .from('infra_provisions')
    .select('provisioning_log')
    .eq('id', provisionId)
    .single();

  if (error || !data) return [];
  return (data.provisioning_log as ProvisioningStep[]) || [];
}

// ============================================
// Mutations
// ============================================

export async function createProvision(input: {
  studentId: string;
  tierId: string;
  mailboxPattern1: string;
  mailboxPattern2: string;
}): Promise<InfraProvision> {
  const { data, error } = await supabase
    .from('infra_provisions')
    .insert({
      student_id: input.studentId,
      tier_id: input.tierId,
      mailbox_pattern_1: input.mailboxPattern1,
      mailbox_pattern_2: input.mailboxPattern2,
      status: 'pending_payment',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProvision(data);
}
```

**Step 2: Commit**

```bash
git add services/infrastructure-supabase.ts
git commit -m "feat: add infrastructure service layer"
```

---

### Task 4: Create React Query Hooks

**Files:**
- Create: `hooks/useInfrastructure.ts`

**Step 1: Write the hooks file**

```typescript
import { useQuery } from '@tanstack/react-query';
import {
  fetchActiveTiers,
  fetchProvisionByStudentId,
  fetchProvisioningLog,
} from '../services/infrastructure-supabase';

export function useInfraTiers() {
  return useQuery({
    queryKey: ['infra-tiers'],
    queryFn: fetchActiveTiers,
  });
}

export function useInfraProvision(studentId: string | undefined) {
  return useQuery({
    queryKey: ['infra-provision', studentId],
    queryFn: () => fetchProvisionByStudentId(studentId!),
    enabled: !!studentId,
  });
}

export function useProvisioningLog(provisionId: string | undefined, isProvisioning: boolean) {
  return useQuery({
    queryKey: ['infra-provisioning-log', provisionId],
    queryFn: () => fetchProvisioningLog(provisionId!),
    enabled: !!provisionId && isProvisioning,
    refetchInterval: isProvisioning ? 3000 : false, // Poll every 3s during provisioning
  });
}
```

**Step 2: Commit**

```bash
git add hooks/useInfrastructure.ts
git commit -m "feat: add infrastructure React Query hooks"
```

---

## Phase 2: Frontend Wizard

### Task 5: Create InfrastructurePage (Router Component)

**Files:**
- Create: `components/bootcamp/infrastructure/InfrastructurePage.tsx`

**Step 1: Write the router component**

This component decides what to show: wizard (no provision), provisioning progress (in progress), or dashboard (active).

```typescript
import { useInfraProvision } from '../../../hooks/useInfrastructure';
import InfraWizard from './wizard/InfraWizard';
import ProvisioningProgress from './ProvisioningProgress';
import InfraDashboard from './dashboard/InfraDashboard';

interface Props {
  userId: string;
}

export default function InfrastructurePage({ userId }: Props) {
  const { data: provision, isLoading } = useInfraProvision(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!provision) {
    return <InfraWizard userId={userId} />;
  }

  if (provision.status === 'provisioning') {
    return <ProvisioningProgress provision={provision} />;
  }

  if (provision.status === 'active') {
    return <InfraDashboard provision={provision} />;
  }

  if (provision.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-red-500 dark:text-red-400 text-lg font-semibold mb-2">
          Provisioning Failed
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
          Something went wrong during setup. Please contact support.
        </p>
        <pre className="text-left bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 text-xs overflow-auto max-h-60">
          {JSON.stringify(provision.provisioningLog, null, 2)}
        </pre>
      </div>
    );
  }

  // pending_payment — show wizard (provision exists but unpaid)
  return <InfraWizard userId={userId} existingProvision={provision} />;
}
```

**Step 2: Commit**

```bash
git add components/bootcamp/infrastructure/InfrastructurePage.tsx
git commit -m "feat: add InfrastructurePage router component"
```

---

### Task 6: Create TierSelection (Step 1)

**Files:**
- Create: `components/bootcamp/infrastructure/wizard/TierSelection.tsx`

**Step 1: Write the component**

Displays tier cards with pricing. Follow existing Tailwind patterns (violet brand, zinc backgrounds, dark mode).

```typescript
import { Check } from 'lucide-react';
import { InfraTier } from '../../../../types/infrastructure-types';
import { useInfraTiers } from '../../../../hooks/useInfrastructure';

interface Props {
  selectedTier: InfraTier | null;
  onSelect: (tier: InfraTier) => void;
}

export default function TierSelection({ selectedTier, onSelect }: Props) {
  const { data: tiers, isLoading } = useInfraTiers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Choose Your Package</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Select the infrastructure tier that matches your outreach volume.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(tiers || []).map((tier) => {
          const isSelected = selectedTier?.id === tier.id;
          const totalMailboxes = tier.domainCount * tier.mailboxesPerDomain;

          return (
            <button
              key={tier.id}
              onClick={() => onSelect(tier)}
              className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}

              <div className="text-base font-semibold text-zinc-900 dark:text-white">{tier.name}</div>
              <div className="mt-3 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                <div>{tier.domainCount} domains</div>
                <div>{totalMailboxes} mailboxes</div>
                <div>~{totalMailboxes * 30} emails/day capacity</div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-xs text-zinc-400 dark:text-zinc-500">One-time setup</div>
                <div className="text-lg font-bold text-zinc-900 dark:text-white">
                  ${(tier.setupFeeCents / 100).toFixed(0)}
                </div>
                <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  + ${(tier.monthlyFeeCents / 100).toFixed(0)}/mo
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/bootcamp/infrastructure/wizard/TierSelection.tsx
git commit -m "feat: add TierSelection wizard step"
```

---

### Task 7: Create DomainPicker (Step 2)

**Files:**
- Create: `components/bootcamp/infrastructure/wizard/DomainPicker.tsx`

**Step 1: Write the component**

Brand name input → generates suggestions → checks availability via gtm-system API → student selects domains.

This component calls the gtm-system API routes (to be built in Phase 3) for domain suggestions and availability checks. For now, build the UI with the API call structure in place.

```typescript
import { useState } from 'react';
import { Search, Globe, Check, Loader2, X } from 'lucide-react';
import { DomainAvailability, InfraTier } from '../../../../types/infrastructure-types';

interface Props {
  tier: InfraTier;
  selectedDomains: DomainAvailability[];
  onDomainsChange: (domains: DomainAvailability[]) => void;
  gtmSystemUrl: string;
}

function suggestDomains(brandName: string): string[] {
  const clean = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean) return [];
  const prefixes = ['get', 'try', 'use', 'go', 'hey', 'meet', 'with', 'join'];
  const suffixes = ['hq', 'app', 'mail', 'team', 'co', 'now', 'pro'];
  const tlds = ['com', 'io', 'net'];
  const suggestions: string[] = [];
  tlds.forEach((tld) => suggestions.push(`${clean}.${tld}`));
  prefixes.forEach((p) => suggestions.push(`${p}${clean}.com`));
  suffixes.forEach((s) => suggestions.push(`${clean}${s}.com`));
  suffixes.slice(0, 4).forEach((s) => suggestions.push(`${clean}-${s}.com`));
  prefixes.slice(0, 3).forEach((p) =>
    tlds.slice(1).forEach((tld) => suggestions.push(`${p}${clean}.${tld}`))
  );
  return [...new Set(suggestions)];
}

export default function DomainPicker({ tier, selectedDomains, onDomainsChange, gtmSystemUrl }: Props) {
  const [brandName, setBrandName] = useState('');
  const [availableDomains, setAvailableDomains] = useState<DomainAvailability[]>([]);
  const [checking, setChecking] = useState(false);
  const [manualSearch, setManualSearch] = useState('');

  const maxDomains = tier.domainCount;

  const checkAvailability = async () => {
    const suggestions = suggestDomains(brandName);
    if (!suggestions.length) return;
    setChecking(true);
    try {
      const res = await fetch(`${gtmSystemUrl}/api/infrastructure/domains/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: suggestions }),
      });
      const data = await res.json();
      setAvailableDomains(data.domains || []);
    } catch (err) {
      console.error('Domain check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  const toggleDomain = (domain: DomainAvailability) => {
    if (domain.status !== 'AVAILABLE') return;
    const exists = selectedDomains.find((d) => d.domainName === domain.domainName);
    if (exists) {
      onDomainsChange(selectedDomains.filter((d) => d.domainName !== domain.domainName));
    } else if (selectedDomains.length < maxDomains) {
      onDomainsChange([...selectedDomains, domain]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Pick Your Domains</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Enter your brand name and we'll suggest available domains. Select {maxDomains}.
        </p>
      </div>

      {/* Brand name input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAvailability()}
            placeholder="Enter your brand name (e.g., Acme)"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-zinc-900 dark:text-white placeholder-zinc-400"
          />
        </div>
        <button
          onClick={checkAvailability}
          disabled={!brandName.trim() || checking}
          className="px-4 py-2.5 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg disabled:opacity-50 transition-colors"
        >
          {checking ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Selected count */}
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {selectedDomains.length} / {maxDomains} domains selected
      </div>

      {/* Selected domains pills */}
      {selectedDomains.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDomains.map((d) => (
            <span
              key={d.domainName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full"
            >
              <Globe size={10} />
              {d.domainName}
              <button onClick={() => toggleDomain(d)} className="hover:text-violet-800 dark:hover:text-violet-200">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available domains grid */}
      {availableDomains.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {availableDomains.map((domain) => {
            const isSelected = selectedDomains.some((d) => d.domainName === domain.domainName);
            const isAvailable = domain.status === 'AVAILABLE';
            const isFull = selectedDomains.length >= maxDomains && !isSelected;

            return (
              <button
                key={domain.domainName}
                onClick={() => toggleDomain(domain)}
                disabled={!isAvailable || isFull}
                className={`flex items-center justify-between p-3 rounded-lg border text-left text-sm transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
                    : isAvailable
                      ? 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      : 'border-zinc-100 dark:border-zinc-900 opacity-40'
                } ${isFull && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                  <span className={isSelected ? 'text-violet-600 dark:text-violet-400 font-medium' : 'text-zinc-700 dark:text-zinc-300'}>
                    {domain.domainName}
                  </span>
                </div>
                {isAvailable && (
                  <span className="text-xs text-zinc-400">{domain.domainPrice}</span>
                )}
                {!isAvailable && (
                  <span className="text-xs text-red-400">Taken</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/bootcamp/infrastructure/wizard/DomainPicker.tsx
git commit -m "feat: add DomainPicker wizard step"
```

---

### Task 8: Create MailboxConfig (Step 3)

**Files:**
- Create: `components/bootcamp/infrastructure/wizard/MailboxConfig.tsx`

**Step 1: Write the component** — name pattern inputs with cascading preview grid.

**Step 2: Commit**

---

### Task 9: Create CheckoutStep (Step 4)

**Files:**
- Create: `components/bootcamp/infrastructure/wizard/CheckoutStep.tsx`

**Step 1: Write the component** — pricing summary + Stripe checkout trigger via Supabase Edge Function.

**Step 2: Commit**

---

### Task 10: Create InfraWizard (Container)

**Files:**
- Create: `components/bootcamp/infrastructure/wizard/InfraWizard.tsx`

**Step 1: Write the wizard container** — manages WizardState, step navigation, progress bar. Renders TierSelection → DomainPicker → MailboxConfig → CheckoutStep.

**Step 2: Commit**

---

### Task 11: Create ProvisioningProgress

**Files:**
- Create: `components/bootcamp/infrastructure/ProvisioningProgress.tsx`

**Step 1: Write the component** — polls provisioning_log every 3s, shows steps with checkmarks/spinners. Uses `useProvisioningLog` hook.

**Step 2: Commit**

---

### Task 12: Integrate into Sidebar + BootcampApp

**Files:**
- Modify: `components/bootcamp/Sidebar.tsx` (~line 509, after AI Tools section)
- Modify: `pages/bootcamp/BootcampApp.tsx` (~line 55 for lazy import, ~line 702 for route)

**Step 1: Add sidebar section**

In Sidebar.tsx, add `Server` to lucide-react imports (line 5-29), then add the GTM Infrastructure collapsible section after the AI Tools section. Use the exact snippet from the exploration (emerald-500 icon color, `virtual:infrastructure-manager` lesson ID).

**Step 2: Add lazy import + route in BootcampApp.tsx**

Add lazy import near line 58:
```typescript
const InfrastructurePage = lazy(
  () => import('../../components/bootcamp/infrastructure/InfrastructurePage')
);
```

Add conditional rendering near line 702:
```typescript
} : currentLesson.id === 'virtual:infrastructure-manager' ? (
  <Suspense fallback={/* spinner */}>
    <InfrastructurePage userId={bootcampStudent?.id || ''} />
  </Suspense>
)
```

**Step 3: Commit**

```bash
git add components/bootcamp/Sidebar.tsx pages/bootcamp/BootcampApp.tsx
git commit -m "feat: integrate GTM Infrastructure into sidebar and routing"
```

---

## Phase 3: Backend (gtm-system)

### Task 13: Create API Routes in gtm-system

**Files (in gtm-system repo):**
- Create: `src/app/api/infrastructure/tiers/route.ts`
- Create: `src/app/api/infrastructure/domains/suggest/route.ts`
- Create: `src/app/api/infrastructure/domains/check/route.ts`
- Create: `src/app/api/infrastructure/provision/route.ts`
- Create: `src/app/api/infrastructure/status/[id]/route.ts`

**Step 1: Tiers route** — GET, reads from Supabase `infra_tiers` table.

**Step 2: Domain suggest route** — POST, takes brandName, returns suggestDomains() array.

**Step 3: Domain check route** — POST, takes domains array, batch-checks via Zapmail `POST /v2/domains/available`, returns availability + pricing.

**Step 4: Provision route** — POST, called after Stripe webhook fires. Triggers the Trigger.dev task.

**Step 5: Status route** — GET, returns provision + log for polling.

**Step 6: Commit**

---

### Task 14: Create Trigger.dev Provisioning Task

**Files (in gtm-system repo):**
- Create: `src/trigger/provision-gtm-infrastructure.ts`

**Step 1: Write the task**

This is the core automation. Implements Steps 1-10 from the design doc:

1. Create Zapmail workspace
2. Purchase domains (wallet)
3. Poll domain connection status
4. Set up DMARC records
5. Create mailboxes
6. Create PlusVibe workspace + client (capture password)
7. Register PIPL creds in Zapmail + export mailboxes
8. Configure warmup
9. Create HeyReach lead list
10. Finalize

Each step updates `provisioning_log` in Supabase so the frontend can show progress.

Key implementation notes:
- Use `wait.for()` from Trigger.dev for polling loops (domain connection, mailbox ACTIVE status)
- Each step wrapped in try/catch with error logging
- Idempotent: check if resource exists before creating
- Rate limit awareness: add `wait.for({ seconds: 1 })` between Zapmail API calls

**Step 2: Commit + Deploy**

```bash
TRIGGER_SECRET_KEY=tr_prod_Fxgn6CdrH6v2NSMVhSJL npx trigger.dev@4.3.3 deploy
```

---

## Phase 4: Stripe Integration

### Task 15: Create Stripe Edge Function

**Files (in copy-of-gtm-os repo):**
- Create: `supabase/functions/create-infra-checkout/index.ts`

**Step 1: Write the edge function**

Follow pattern from existing `create-checkout/index.ts` — CORS headers, Stripe session creation. Two line items: one-time setup + monthly subscription.

**Step 2: Extend stripe-webhook**

Modify `supabase/functions/stripe-webhook/index.ts` — add new `case` in the switch for infra checkout sessions (identified by metadata.provision_id). On `checkout.session.completed` with provision_id in metadata:
- Update `infra_provisions` status to 'provisioning'
- Store stripe IDs
- Call gtm-system `/api/infrastructure/provision` to trigger the Trigger.dev task

**Step 3: Commit**

---

## Phase 5: Dashboard

### Task 16: Create InfraDashboard

**Files:**
- Create: `components/bootcamp/infrastructure/dashboard/InfraDashboard.tsx`
- Create: `components/bootcamp/infrastructure/dashboard/DomainStatusCard.tsx`
- Create: `components/bootcamp/infrastructure/dashboard/WarmupProgress.tsx`
- Create: `components/bootcamp/infrastructure/dashboard/HeyReachStatus.tsx`

**Step 1: InfraDashboard** — overview layout with cards for domains, warmup progress, HeyReach status, PlusVibe login link.

**Step 2: DomainStatusCard** — shows domain name, connection status, mailbox list per domain.

**Step 3: WarmupProgress** — calls gtm-system dashboard API route which proxies to PlusVibe Partner API `partner-list-email-accounts`. Shows per-account warmup health score (color-coded), reply rates, daily send counts.

**Step 4: HeyReachStatus** — shows lead list name, lead count, link to HeyReach.

**Step 5: Commit**

---

### Task 17: Create Dashboard API Route (gtm-system)

**Files (in gtm-system repo):**
- Create: `src/app/api/infrastructure/dashboard/[studentId]/route.ts`

**Step 1: Write the route**

Aggregates data from:
- Supabase: provision + domains
- PlusVibe Partner API: `GET /webhook/partner-list-email-accounts` (rich warmup/health data)
- Zapmail: `GET /v2/domains/assignable` (domain status)
- HeyReach: `get_leads_from_list` (lead count)

Returns combined dashboard payload.

**Step 2: Commit**

---

## Phase 6: Polish

### Task 18: Upgrade Tier Flow

**Files:**
- Create: `components/bootcamp/infrastructure/UpgradeTierModal.tsx`

Stripe subscription modification + additional provisioning for new domains.

### Task 19: Admin Tier Management

Add CRUD UI for `infra_tiers` at `/admin/bootcamp/infrastructure`.

### Task 20: Error Recovery

Add admin ability to retry failed provisioning from last successful step.

---

## Execution Order Summary

| # | Task | Repo | Depends On |
|---|------|------|------------|
| 1 | Database migration | copy-of-gtm-os | — |
| 2 | TypeScript types | copy-of-gtm-os | — |
| 3 | Service layer | copy-of-gtm-os | 1, 2 |
| 4 | React Query hooks | copy-of-gtm-os | 3 |
| 5 | InfrastructurePage | copy-of-gtm-os | 4 |
| 6 | TierSelection | copy-of-gtm-os | 4 |
| 7 | DomainPicker | copy-of-gtm-os | 4 |
| 8 | MailboxConfig | copy-of-gtm-os | — |
| 9 | CheckoutStep | copy-of-gtm-os | — |
| 10 | InfraWizard | copy-of-gtm-os | 5-9 |
| 11 | ProvisioningProgress | copy-of-gtm-os | 4 |
| 12 | Sidebar + routing | copy-of-gtm-os | 5 |
| 13 | API routes | gtm-system | 1 |
| 14 | Trigger.dev task | gtm-system | 13 |
| 15 | Stripe edge functions | copy-of-gtm-os | 1, 14 |
| 16 | Dashboard components | copy-of-gtm-os | 4 |
| 17 | Dashboard API route | gtm-system | 14 |
| 18-20 | Polish | both | 1-17 |

**Parallelizable:** Tasks 2-4 can run alongside Task 1. Tasks 6-9 are independent of each other. Tasks 13-14 (gtm-system) can be built in parallel with Tasks 5-12 (copy-of-gtm-os frontend).
