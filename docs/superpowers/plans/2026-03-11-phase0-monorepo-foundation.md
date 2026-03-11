# Phase 0: Monorepo Foundation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `mas-platform` monorepo with pnpm workspaces and 4 shared packages (`@mas/types`, `@mas/db`, `@mas/logging`, `@mas/integrations`), matching magnetlab's exact conventions.

**Architecture:** pnpm workspaces monorepo (no Turborepo). All packages build with `tsc` (all are private workspace packages — no dual ESM+CJS needed). Root config mirrors magnetlab: ESLint flat config, Prettier, Husky pre-commit, lint-staged. All packages use Vitest for testing.

**Tech Stack:** pnpm 10.x, TypeScript 5.6+, Vitest, ESLint 9 (flat config), Prettier 3, Husky 9, lint-staged 15, `@supabase/supabase-js`, Sentry SDK (optional peer dep in logging)

---

## File Structure

```
mas-platform/
├── apps/                              (empty — apps arrive in Phase 1+)
│   └── .gitkeep
├── packages/
│   ├── types/                         @mas/types — shared type definitions
│   │   ├── src/
│   │   │   ├── prospect.ts            Prospect, ProspectPost, ProspectStatus
│   │   │   ├── dfy.ts                 DfyEngagement, DfyDeliverable, DfyActivityLog
│   │   │   ├── proposal.ts            Proposal, ProposalPricing, ProposalService
│   │   │   ├── lead.ts               Lead, LeadStatus, EnrichmentRun
│   │   │   ├── bootcamp.ts            BootcampStudent, LmsCohort, LmsLesson, etc.
│   │   │   ├── infrastructure.ts      InfraProvision, InfraDomain, InfraTier
│   │   │   └── index.ts              Barrel re-exports
│   │   ├── __tests__/
│   │   │   └── types.test.ts          Type guard + exhaustiveness tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── db/                            @mas/db — Supabase client + scope + whitelist
│   │   ├── src/
│   │   │   ├── client.ts             createBrowserClient, createServerClient, createAdminClient
│   │   │   ├── scope.ts              DataScope interface, applyScope(), getDataScope()
│   │   │   ├── whitelist.ts          filterAllowedFields() generic helper
│   │   │   └── index.ts              Barrel re-exports
│   │   ├── __tests__/
│   │   │   ├── scope.test.ts          applyScope unit tests
│   │   │   └── whitelist.test.ts      filterAllowedFields unit tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── logging/                       @mas/logging — structured logging + error helpers
│   │   ├── src/
│   │   │   ├── logger.ts             logError, logWarn, logInfo, logDebug
│   │   │   ├── status-code.ts        getStatusCode() helper
│   │   │   └── index.ts              Barrel re-exports
│   │   ├── __tests__/
│   │   │   ├── logger.test.ts         Log output format tests
│   │   │   └── status-code.test.ts    getStatusCode tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── integrations/                  @mas/integrations — third-party API clients
│       ├── src/
│       │   ├── base-client.ts         BaseApiClient (timeout, error handling, typed responses)
│       │   ├── plusvibe.ts            PlusVibe cold email client
│       │   ├── heyreach.ts           HeyReach LinkedIn automation client
│       │   ├── attio.ts              Attio CRM client
│       │   ├── resend.ts             Resend email client
│       │   ├── apify.ts              Apify scraping client
│       │   ├── brightdata.ts         Bright Data SERP client
│       │   └── index.ts              Barrel re-exports
│       ├── __tests__/
│       │   ├── base-client.test.ts    BaseApiClient tests
│       │   └── plusvibe.test.ts       PlusVibe client tests (representative)
│       ├── package.json
│       └── tsconfig.json
│
├── pnpm-workspace.yaml                packages: ['packages/*', 'apps/*']
├── eslint.config.mjs                  Root ESLint flat config
├── .prettierrc                        Matches magnetlab exactly
├── .npmrc                             engine-strict=true
├── tsconfig.base.json                 Shared compiler options
├── .husky/pre-commit                  lint-staged + typecheck + build
├── .gitignore
├── package.json                       Root workspace config
├── CLAUDE.md                          Master decision guide
└── vitest.workspace.ts                Vitest workspace for all packages
```

---

## Chunk 1: Repository Scaffold + Root Config

### Task 1: Initialize git repo and pnpm workspace

**Files:**
- Create: `mas-platform/package.json`
- Create: `mas-platform/pnpm-workspace.yaml`
- Create: `mas-platform/.npmrc`
- Create: `mas-platform/.gitignore`
- Create: `mas-platform/apps/.gitkeep`

- [ ] **Step 1: Create the repo directory and initialize git**

```bash
mkdir -p ~/Documents/"claude code"/mas-platform
cd ~/Documents/"claude code"/mas-platform
git init
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "mas-platform",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@10.30.0",
  "scripts": {
    "build": "pnpm -r run build",
    "typecheck": "pnpm -r run typecheck",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.3",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.1.8",
    "husky": "^9.1.7",
    "lint-staged": "^15.4.3",
    "prettier": "^3.8.1",
    "typescript": "^5.6.2",
    "vitest": "^3.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "prettier --write",
      "eslint --max-warnings 0 --no-warn-ignored"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

- [ ] **Step 4: Create .npmrc**

```
engine-strict=true
```

- [ ] **Step 5: Create .gitignore**

```gitignore
node_modules/
dist/
.next/
out/
build/
.env
.env.local
.env.*.local
*.tsbuildinfo
.turbo/
coverage/
.vercel
.railway
```

- [ ] **Step 6: Create apps/.gitkeep**

```bash
mkdir -p apps
touch apps/.gitkeep
```

- [ ] **Step 7: Run pnpm install to generate lockfile**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm install`
Expected: lockfile created, no errors

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml .npmrc .gitignore apps/.gitkeep pnpm-lock.yaml
git commit -m "chore: initialize mas-platform monorepo with pnpm workspaces"
```

---

### Task 2: Add root TypeScript, ESLint, Prettier, and Husky config

**Files:**
- Create: `mas-platform/tsconfig.base.json`
- Create: `mas-platform/eslint.config.mjs`
- Create: `mas-platform/.prettierrc`
- Create: `mas-platform/.husky/pre-commit`
- Create: `mas-platform/vitest.workspace.ts`

- [ ] **Step 1: Create tsconfig.base.json**

This is the shared compiler options that all packages extend. Matches magnetlab's settings but uses `noEmit: false` since packages need to emit declarations.

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

- [ ] **Step 2: Install TypeScript ESLint parser and plugin**

Must be installed BEFORE creating eslint.config.mjs since it references these packages.

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin`

- [ ] **Step 3: Create eslint.config.mjs**

Matches magnetlab's flat config pattern. Root config applies to all packages. Uses FlatCompat for TypeScript plugin integration (same approach as magnetlab).

```javascript
import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ),
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];

export default eslintConfig;
```

> **Note:** Each app (gtm-os, gtm-system) will have its own `eslint.config.mjs` that extends this and adds framework-specific rules (e.g., `next/core-web-vitals`, server/client boundary enforcement). Packages only need the root config.

- [ ] **Step 4: Create .prettierrc**

Matches magnetlab exactly:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Step 5: Install Husky and create pre-commit hook**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm exec husky init`

Then write `.husky/pre-commit`:

```bash
npx lint-staged && pnpm typecheck && pnpm build
```

- [ ] **Step 6: Create vitest.workspace.ts**

```typescript
/** Vitest workspace config. Runs tests across all packages. */
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace(['packages/*/vitest.config.ts']);
```

- [ ] **Step 7: Verify lint and format work**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm format:check && pnpm lint`
Expected: No errors (nothing to lint yet, but config loads correctly)

- [ ] **Step 8: Commit**

```bash
git add tsconfig.base.json eslint.config.mjs .prettierrc .husky/pre-commit vitest.workspace.ts package.json pnpm-lock.yaml
git commit -m "chore: add root tsconfig, eslint, prettier, husky, and vitest config"
```

---

## Chunk 2: @mas/types Package

### Task 3: Create @mas/types package scaffold

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/vitest.config.ts`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: Create packages/types/package.json**

```json
{
  "name": "@mas/types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create packages/types/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create packages/types/vitest.config.ts**

```typescript
/** Vitest config for @mas/types. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create packages/types/src/index.ts (empty barrel)**

```typescript
/** @mas/types — Shared type definitions for the MAS platform.
 *  Constraint: Pure types only. No runtime code, no dependencies. */

// Domain type modules are added in subsequent steps.
```

- [ ] **Step 5: Run pnpm install from root to link workspace**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm install`
Expected: Workspace links `@mas/types`

- [ ] **Step 6: Verify build works**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/types build`
Expected: `dist/index.js` and `dist/index.d.ts` created

- [ ] **Step 7: Commit**

```bash
git add packages/types/
git commit -m "chore: scaffold @mas/types package"
```

---

### Task 4: Add prospect and post types

**Files:**
- Create: `packages/types/src/prospect.ts`
- Modify: `packages/types/src/index.ts`

These are the canonical types for the `prospects` and `posts` tables. Currently defined differently in copy-of-gtm-os (camelCase) and leadmagnet-backend (snake_case). The canonical types use **snake_case** matching the database. Each consuming app maps to its own view models if needed.

- [ ] **Step 1: Write the test**

Create `packages/types/__tests__/types.test.ts`:

```typescript
/** Type guard and exhaustiveness tests for @mas/types. */
import { describe, it, expect } from 'vitest';
import type { Prospect, ProspectPost, ProspectStatus } from '../src/index';

describe('@mas/types — prospect', () => {
  it('ProspectStatus covers all valid values', () => {
    const ALL_STATUSES: ProspectStatus[] = [
      'pending_scrape',
      'scraping_profile',
      'scraping_posts',
      'pending_enrichment',
      'enriching',
      'enrichment_complete',
      'generating_posts',
      'complete',
      'error',
      'unqualified',
    ];
    expect(ALL_STATUSES).toHaveLength(10);
    // TypeScript compiler ensures this array is exhaustive via the type
  });

  it('Prospect interface includes required fields', () => {
    const prospect: Prospect = {
      id: 'uuid-1',
      tenant_id: 'tenant-1',
      full_name: 'Jane Doe',
      linkedin_url: 'https://linkedin.com/in/jane',
      status: 'complete',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(prospect.id).toBe('uuid-1');
    expect(prospect.status).toBe('complete');
  });

  it('ProspectPost interface includes required fields', () => {
    const post: ProspectPost = {
      id: 'post-1',
      prospect_id: 'uuid-1',
      post_content: 'Hello world',
      number: 1,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(post.prospect_id).toBe('uuid-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/types test`
Expected: FAIL — cannot resolve `../src/index` (no exports yet)

- [ ] **Step 3: Create packages/types/src/prospect.ts**

```typescript
/** Prospect and Post types. Canonical source of truth for the prospects/posts tables.
 *  Field names match the database (snake_case). Consuming apps map to their own view models.
 *  Constraint: Pure types — no runtime code. */

// ─── Status Enums ────────────────────────────────────────────────────────────

export type ProspectStatus =
  | 'pending_scrape'
  | 'scraping_profile'
  | 'scraping_posts'
  | 'pending_enrichment'
  | 'enriching'
  | 'enrichment_complete'
  | 'generating_posts'
  | 'complete'
  | 'error'
  | 'unqualified';

export type PostStatus = 'draft' | 'ready' | 'needs_fix' | 'finalized';

// ─── Prospect ────────────────────────────────────────────────────────────────

export interface Prospect {
  id: string;
  tenant_id: string;
  full_name: string;
  linkedin_url: string;
  status: ProspectStatus;
  created_at: string;
  updated_at: string;

  // Profile data (populated during scraping)
  current_headline?: string | null;
  current_about?: string | null;
  profile_photo?: string | null;
  location?: string | null;
  follower_count?: number | null;
  connection_count?: number | null;
  posts_clean_text?: string | null;

  // Enrichment data (populated during enrichment)
  authority_score?: number | null;
  content_themes?: string[] | null;
  whats_working_1?: string | null;
  whats_working_2?: string | null;
  whats_working_3?: string | null;
  content_gap_1?: string | null;
  content_gap_2?: string | null;
  improvement_suggestions?: string[] | null;

  // Scoring
  score_profile_optimization?: number | null;
  score_content_quality?: number | null;
  score_engagement?: number | null;
  score_authority?: number | null;
  score_overall?: number | null;

  // Lead magnet cards (JSONB)
  lm_card_1?: Record<string, unknown> | null;
  lm_card_2?: Record<string, unknown> | null;
  lm_card_3?: Record<string, unknown> | null;

  // Headlines
  recommended_headline?: string | null;
  headline_options?: string[] | null;

  // Analysis
  analysis_status?: string | null;
  recommended_offer?: 'bootcamp' | 'gc' | 'none' | null;
  qualified?: boolean | null;
  error_log?: string | null;

  // Generation metadata
  prompt_versions_used?: Record<string, number> | null;
  email?: string | null;
  slug?: string | null;
}

// ─── Prospect Post ───────────────────────────────────────────────────────────

export interface ProspectPost {
  id: string;
  prospect_id: string;
  post_content: string;
  number: number;
  created_at: string;

  first_sentence?: string | null;
  post_ready?: boolean | null;
  to_fix?: string | null;
  action_items?: string | null;
  finalized_content?: string | null;
  status?: PostStatus | null;
  updated_at?: string | null;
}
```

- [ ] **Step 4: Update index.ts to re-export**

```typescript
/** @mas/types — Shared type definitions for the MAS platform.
 *  Constraint: Pure types only. No runtime code, no dependencies. */

export * from './prospect';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/types test`
Expected: PASS — all 3 tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/types/
git commit -m "feat(types): add Prospect and ProspectPost types"
```

---

### Task 5: Add remaining domain types (proposal, dfy, lead, bootcamp, infrastructure)

**Files:**
- Create: `packages/types/src/proposal.ts`
- Create: `packages/types/src/dfy.ts`
- Create: `packages/types/src/lead.ts`
- Create: `packages/types/src/bootcamp.ts`
- Create: `packages/types/src/infrastructure.ts`
- Modify: `packages/types/src/index.ts`
- Modify: `packages/types/__tests__/types.test.ts`

> **CRITICAL: Types must match the actual database schema, not be guessed from TypeScript sources.**
> The types below are STARTING POINTS based on existing TypeScript interfaces. Before creating each file, the implementer MUST:
> 1. Query the actual DB schema: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'X' ORDER BY ordinal_position`
> 2. Read the corresponding TypeScript source files listed below for context
> 3. Reconcile: use DB column names (snake_case), DB nullability, and DB types as the source of truth
> 4. Status enum values MUST match the database (check for title-case vs lowercase)
>
> **Source files to cross-reference:**
> - **proposal**: `copy-of-gtm-os/types/proposal-types.ts`
> - **dfy**: `copy-of-gtm-os/types/dfy-types.ts` + `copy-of-gtm-os/types/dfy-admin-types.ts`
> - **lead**: `gtm-system` lead types (check `src/lib/types/` and DB schema)
> - **bootcamp**: `copy-of-gtm-os/types/bootcamp-types.ts` + `copy-of-gtm-os/types/lms-types.ts`
> - **infrastructure**: `copy-of-gtm-os/types/infrastructure-types.ts`
>
> For each file: match DB schema exactly, keep union types (not enums), add JSDoc header + section dividers. Include ALL columns from the DB — do not simplify or omit fields that seem unused.

- [ ] **Step 1: Query actual DB schemas for all target tables**

Run against the shared Supabase instance to get ground truth:

```bash
# Extract Supabase token
TOKEN=$(security find-generic-password -s "Supabase CLI" -w | sed 's/go-keyring-base64://' | base64 -D)

# Query schemas for all target tables
for TABLE in proposals dfy_engagements dfy_deliverables dfy_activity_log leads enrichment_lead_status bootcamp_students lms_cohorts lms_weeks lms_lessons lms_content_items lms_lesson_progress lms_action_item_progress infra_tiers infra_provisions infra_domains; do
  echo "=== $TABLE ==="
  curl -s -X POST "https://api.supabase.com/v1/projects/qvawbxpijxlwdkolmjrs/database/query" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '$TABLE' ORDER BY ordinal_position\"}"
  echo ""
done
```

Save the output — all subsequent type files are derived from this output.

- [ ] **Step 2: Create packages/types/src/proposal.ts**

Read `copy-of-gtm-os/types/proposal-types.ts` for the full type list. Cross-reference against DB schema output from Step 1. Convert all camelCase fields to snake_case. The file should follow this pattern:

```typescript
/** Proposal types. Canonical source for the proposals table.
 *  Field names match the database (snake_case).
 *  Constraint: Pure types — no runtime code. */

// ─── Status ──────────────────────────────────────────────────────────────────

export type ProposalStatus = 'draft' | 'published' | 'archived';

// ─── Nested Types ────────────────────────────────────────────────────────────

export interface ProposalAboutUs {
  blurb: string;
  stats: { label: string; value: string }[];
  social_proof: { quote: string; author: string; company?: string }[];
}

export interface ProposalClientSnapshot {
  company: string;
  industry: string;
  size: string;
  revenue: string;
  current_state: string;
}

export interface ProposalGoal {
  title: string;
  description: string;
  metric?: string;
}

export interface ProposalServiceItem {
  name: string;
  description: string;
  deliverables: string[];
}

export interface ProposalRoadmapPhase {
  name: string;
  duration: string;
  items: string[];
}

export interface ProposalPricing {
  packages: ProposalPackage[];
  custom_items: { name: string; price: string }[];
  total: string;
  payment_terms: string;
}

export interface ProposalPackage {
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

export interface ProposalNextStep {
  title: string;
  description: string;
  cta?: string;
}

// ─── Proposal ────────────────────────────────────────────────────────────────

export interface Proposal {
  id: string;
  slug: string;
  prospect_id: string | null;
  status: ProposalStatus;
  client_name: string;
  client_title: string | null;
  client_company: string;
  client_logo_url: string | null;
  client_brand_color: string | null;
  client_website: string | null;
  headline: string;
  executive_summary: string;
  about_us: ProposalAboutUs;
  client_snapshot: ProposalClientSnapshot;
  goals: ProposalGoal[];
  services: ProposalServiceItem[];
  roadmap: ProposalRoadmapPhase[];
  pricing: ProposalPricing;
  next_steps: ProposalNextStep[];
  transcript_text: string | null;
  transcript_source: string | null;
  additional_notes: string | null;
  created_by: string | null;
  view_count: number;
  last_viewed_at: string | null;
  monthly_rate_cents: number | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 3: Create packages/types/src/dfy.ts**

Read `copy-of-gtm-os/types/dfy-types.ts` AND `copy-of-gtm-os/types/dfy-admin-types.ts` for the full type list. Cross-reference against DB schema from Step 1. Include ALL fields from the database, not a subset. Include `DfyDeliverableTemplate`, `DfyMilestoneTemplate`, `DfyAutomationRun` if they exist as DB tables. Convert camelCase → snake_case.

```typescript
/** DFY engagement types. Canonical source for dfy_engagements, dfy_deliverables, dfy_activity_log.
 *  Field names match the database (snake_case).
 *  Constraint: Pure types — no runtime code. */

// ─── Status Enums ────────────────────────────────────────────────────────────

export type DfyEngagementStatus =
  | 'pending'
  | 'onboarding'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type DfyIntakeStatus = 'pending' | 'submitted' | 'processed';

export type DfyDeliverableStatus = 'pending' | 'in_progress' | 'review' | 'approved' | 'delivered';

export type DfyAutomationStatus = 'idle' | 'running' | 'completed' | 'failed';

// ─── DFY Engagement ──────────────────────────────────────────────────────────

export interface DfyEngagement {
  id: string;
  tenant_id: string;
  client_name: string;
  client_email: string;
  client_company: string;
  linkedin_url: string | null;
  portal_slug: string;
  engagement_type: string;
  status: DfyEngagementStatus;
  intake_status: DfyIntakeStatus;
  processed_intake: Record<string, unknown> | null;
  pricing_tier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── DFY Deliverable ─────────────────────────────────────────────────────────

export interface DfyDeliverable {
  id: string;
  engagement_id: string;
  milestone: string;
  name: string;
  description: string | null;
  status: DfyDeliverableStatus;
  depends_on: string | null;
  automation_type: string | null;
  automation_status: DfyAutomationStatus;
  output_url: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── DFY Activity Log ────────────────────────────────────────────────────────

export interface DfyActivityLog {
  id: string;
  engagement_id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
```

- [ ] **Step 4: Create packages/types/src/lead.ts**

Read `gtm-system` lead types and cross-reference against DB schema from Step 1. The `leads` table schema:

```typescript
/** Lead types. Canonical source for the leads table.
 *  Field names match the database (snake_case).
 *  Constraint: Pure types — no runtime code. */

// ─── Status ──────────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'enriching'
  | 'enriched'
  | 'qualifying'
  | 'qualified'
  | 'unqualified'
  | 'meeting_booked'
  | 'meeting_attended'
  | 'proposal_sent'
  | 'closed_won'
  | 'closed_lost'
  | 'do_not_contact';

export type LeadSource = 'organic' | 'plusvibe' | 'heyreach';

// ─── Lead ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  tenant_id: string;
  slug: string;
  email: string;
  full_name: string | null;
  opt_in_data: Record<string, unknown> | null;
  scraped_data: Record<string, unknown> | null;
  analysis_results: Record<string, unknown> | null;
  scores: Record<string, unknown> | null;
  report_data: Record<string, unknown> | null;
  status: LeadStatus;
  processing_step: string | null;
  error_log: string | null;
  byok: boolean;
  created_at: string;
  updated_at: string;
  twenty_person_id: string | null;
  twenty_company_id: string | null;
  twenty_opportunity_id: string | null;
}

// ─── Enrichment ──────────────────────────────────────────────────────────────

export interface EnrichmentLeadStatus {
  id: string;
  lead_id: string;
  recipe_slug: string;
  step_index: number;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
}
```

- [ ] **Step 5: Create packages/types/src/bootcamp.ts**

Read `copy-of-gtm-os/types/bootcamp-types.ts` + `types/lms-types.ts` for the full type list. Cross-reference against DB schema from Step 1. **IMPORTANT:** Include ALL fields from the database — the example below is a starting point. Status values MUST match the database exactly (check for title-case like `'Active'` vs lowercase `'active'`). Include ALL bootcamp types: `BootcampStudent`, `BootcampChecklistItem`, `BootcampStudentProgress`, `BootcampStudentSurvey`, `BootcampInviteCode`, `BootcampSettings`, `CallGrantConfig` if they map to DB tables.

```typescript
/** Bootcamp and LMS types. Canonical source for bootcamp_students, lms_* tables.
 *  Field names match the database (snake_case).
 *  Constraint: Pure types — no runtime code. */

// ─── Student ─────────────────────────────────────────────────────────────────

export interface BootcampStudent {
  id: string;
  email: string;
  full_name: string;
  cohort_id: string | null;
  status: 'active' | 'inactive' | 'graduated' | 'dropped';
  onboarding_complete: boolean;
  invite_code: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

// ─── LMS ─────────────────────────────────────────────────────────────────────

export interface LmsCohort {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'draft';
  created_at: string;
}

export interface LmsWeek {
  id: string;
  cohort_id: string;
  week_number: number;
  title: string;
  description: string | null;
  unlock_date: string | null;
  created_at: string;
}

export interface LmsLesson {
  id: string;
  week_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface LmsContentItem {
  id: string;
  lesson_id: string;
  type: 'video' | 'text' | 'resource' | 'action_item';
  title: string;
  content: string | null;
  url: string | null;
  sort_order: number;
  created_at: string;
}

export interface LmsLessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface LmsActionItemProgress {
  id: string;
  student_id: string;
  action_item_id: string;
  completed: boolean;
  proof_url: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}
```

- [ ] **Step 6: Create packages/types/src/infrastructure.ts**

Cross-reference against DB schema from Step 1. Include ALL fields from `infra_tiers`, `infra_provisions`, `infra_domains`. Status values MUST match the database exactly (e.g., `'pending_payment'` not `'pending'`, `'purchasing'` not `'purchased'`).

```typescript
/** Infrastructure provisioning types. Canonical source for infra_* tables.
 *  Field names match the database (snake_case).
 *  Constraint: Pure types — no runtime code. */

// ─── Tiers ───────────────────────────────────────────────────────────────────

export type InfraTierSlug = 'starter' | 'growth' | 'scale';

export interface InfraTier {
  id: string;
  slug: InfraTierSlug;
  name: string;
  stripe_product_id: string;
  setup_fee_cents: number;
  monthly_fee_cents: number;
  domain_count: number;
  mailbox_count: number;
  created_at: string;
}

// ─── Provision ───────────────────────────────────────────────────────────────

export type InfraProvisionStatus =
  | 'pending'
  | 'provisioning'
  | 'active'
  | 'failed'
  | 'cancelled';

export interface InfraProvision {
  id: string;
  tenant_id: string;
  tier_id: string;
  status: InfraProvisionStatus;
  service_provider: 'GOOGLE' | 'MICROSOFT';
  brand_name: string;
  stripe_subscription_id: string | null;
  trigger_run_id: string | null;
  error_log: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Domain ──────────────────────────────────────────────────────────────────

export interface InfraDomain {
  id: string;
  provision_id: string;
  domain_name: string;
  zapmail_domain_id: string | null;
  status: 'pending' | 'purchased' | 'connected' | 'dmarc_set' | 'mailboxes_created' | 'failed';
  mailboxes: { username: string; first_name: string; last_name: string }[];
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 7: Update index.ts barrel**

```typescript
/** @mas/types — Shared type definitions for the MAS platform.
 *  Constraint: Pure types only. No runtime code, no dependencies. */

export * from './prospect';
export * from './proposal';
export * from './dfy';
export * from './lead';
export * from './bootcamp';
export * from './infrastructure';
```

- [ ] **Step 8: Add tests for new types**

Append to `packages/types/__tests__/types.test.ts`:

```typescript
import type {
  ProposalStatus,
  Proposal,
  DfyEngagementStatus,
  DfyEngagement,
  LeadStatus,
  Lead,
  BootcampStudent,
  LmsCohort,
  InfraTierSlug,
  InfraProvision,
} from '../src/index';

describe('@mas/types — proposal', () => {
  it('ProposalStatus covers all valid values', () => {
    const statuses: ProposalStatus[] = ['draft', 'published', 'archived'];
    expect(statuses).toHaveLength(3);
  });
});

describe('@mas/types — dfy', () => {
  it('DfyEngagementStatus covers all valid values', () => {
    const statuses: DfyEngagementStatus[] = [
      'pending', 'onboarding', 'active', 'paused', 'completed', 'cancelled',
    ];
    expect(statuses).toHaveLength(6);
  });
});

describe('@mas/types — lead', () => {
  it('LeadStatus covers all valid values', () => {
    const statuses: LeadStatus[] = [
      'new', 'enriching', 'enriched', 'qualifying', 'qualified', 'unqualified',
      'meeting_booked', 'meeting_attended', 'proposal_sent', 'closed_won',
      'closed_lost', 'do_not_contact',
    ];
    expect(statuses).toHaveLength(12);
  });
});

describe('@mas/types — bootcamp', () => {
  it('BootcampStudent interface includes required fields', () => {
    const student: BootcampStudent = {
      id: 'stu-1',
      email: 'student@test.com',
      full_name: 'Test Student',
      cohort_id: null,
      status: 'active',
      onboarding_complete: false,
      invite_code: null,
      stripe_customer_id: null,
      subscription_status: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(student.status).toBe('active');
  });
});

describe('@mas/types — infrastructure', () => {
  it('InfraTierSlug covers all valid values', () => {
    const tiers: InfraTierSlug[] = ['starter', 'growth', 'scale'];
    expect(tiers).toHaveLength(3);
  });
});
```

- [ ] **Step 9: Run tests**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/types test`
Expected: All tests pass

- [ ] **Step 10: Run build**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/types build`
Expected: `dist/` contains all `.js` + `.d.ts` files

- [ ] **Step 11: Commit**

```bash
git add packages/types/src/proposal.ts packages/types/src/dfy.ts packages/types/src/lead.ts packages/types/src/bootcamp.ts packages/types/src/infrastructure.ts packages/types/src/index.ts packages/types/__tests__/types.test.ts
git commit -m "feat(types): add proposal, dfy, lead, bootcamp, and infrastructure types"
```

---

## Chunk 3: @mas/db Package

### Task 6: Create @mas/db package with scope and whitelist utilities

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/vitest.config.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/scope.ts`
- Create: `packages/db/src/whitelist.ts`
- Create: `packages/db/__tests__/scope.test.ts`
- Create: `packages/db/__tests__/whitelist.test.ts`

- [ ] **Step 1: Create packages/db/package.json**

```json
{
  "name": "@mas/db",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.0"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create packages/db/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create packages/db/vitest.config.ts**

```typescript
/** Vitest config for @mas/db. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write scope tests**

Create `packages/db/__tests__/scope.test.ts`:

```typescript
/** Tests for DataScope and applyScope. */
import { describe, it, expect, vi } from 'vitest';
import { applyScope } from '../src/scope';
import type { DataScope } from '../src/scope';

// Mock Supabase query builder
function createMockQuery() {
  const calls: { method: string; args: unknown[] }[] = [];
  const query = {
    eq: vi.fn((...args: unknown[]) => {
      calls.push({ method: 'eq', args });
      return query;
    }),
    _calls: calls,
  };
  return query;
}

describe('applyScope', () => {
  it('applies user_id filter for user scope', () => {
    const query = createMockQuery();
    const scope: DataScope = { type: 'user', userId: 'user-123' };

    applyScope(query as never, scope);

    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('applies tenant_id filter for tenant scope', () => {
    const query = createMockQuery();
    const scope: DataScope = { type: 'tenant', userId: 'user-123', tenantId: 'tenant-456' };

    applyScope(query as never, scope);

    expect(query.eq).toHaveBeenCalledWith('tenant_id', 'tenant-456');
  });

  it('applies no filter for admin scope', () => {
    const query = createMockQuery();
    const scope: DataScope = { type: 'admin', userId: 'admin-1' };

    applyScope(query as never, scope);

    expect(query.eq).not.toHaveBeenCalled();
  });

  it('throws if tenant scope missing tenantId', () => {
    const query = createMockQuery();
    const scope: DataScope = { type: 'tenant', userId: 'user-123' };

    expect(() => applyScope(query as never, scope)).toThrow('tenantId required');
  });
});
```

- [ ] **Step 5: Write whitelist tests**

Create `packages/db/__tests__/whitelist.test.ts`:

```typescript
/** Tests for filterAllowedFields. */
import { describe, it, expect } from 'vitest';
import { filterAllowedFields } from '../src/whitelist';

describe('filterAllowedFields', () => {
  const ALLOWED = ['name', 'email', 'status'] as const;

  it('passes through allowed fields', () => {
    const input = { name: 'Jane', email: 'j@test.com', status: 'active' };
    expect(filterAllowedFields(input, ALLOWED)).toEqual(input);
  });

  it('strips disallowed fields', () => {
    const input = { name: 'Jane', id: 'uuid-1', created_at: '2026-01-01', status: 'active' };
    expect(filterAllowedFields(input, ALLOWED)).toEqual({ name: 'Jane', status: 'active' });
  });

  it('returns empty object when no fields match', () => {
    const input = { id: 'uuid-1', hacker: 'drop table' };
    expect(filterAllowedFields(input, ALLOWED)).toEqual({});
  });

  it('handles empty input', () => {
    expect(filterAllowedFields({}, ALLOWED)).toEqual({});
  });

  it('preserves null and undefined values for allowed fields', () => {
    const input = { name: null, email: undefined, status: 'active' };
    expect(filterAllowedFields(input, ALLOWED)).toEqual(input);
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/db test`
Expected: FAIL — modules not found

- [ ] **Step 7: Create packages/db/src/scope.ts**

```typescript
/** DataScope — scoping pattern for multi-tenant data access.
 *  Every service and repository method takes DataScope as first parameter.
 *  Constraint: No Supabase client import — works with any query builder that has .eq(). */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DataScope {
  type: 'user' | 'tenant' | 'admin';
  userId: string;
  tenantId?: string;
  ownerId?: string;
}

// ─── Apply Scope ─────────────────────────────────────────────────────────────

/**
 * Apply scope filter to a Supabase query builder.
 * - user: filters by user_id
 * - tenant: filters by tenant_id (requires tenantId)
 * - admin: no filter (full access)
 */
export function applyScope<Q extends { eq: (col: string, val: string) => Q }>(
  query: Q,
  scope: DataScope
): Q {
  switch (scope.type) {
    case 'user':
      return query.eq('user_id', scope.userId);
    case 'tenant':
      if (!scope.tenantId) throw new Error('tenantId required for tenant scope');
      return query.eq('tenant_id', scope.tenantId);
    case 'admin':
      return query;
    default:
      throw new Error(`Unknown scope type: ${(scope as DataScope).type}`);
  }
}
```

- [ ] **Step 8: Create packages/db/src/whitelist.ts**

```typescript
/** Field whitelist helper for safe database updates.
 *  Prevents arbitrary field injection by only passing named fields through.
 *  Constraint: Pure utility — no DB or framework imports. */

/**
 * Filter an input object to only include fields in the allowed list.
 * Used by all update operations to prevent arbitrary field writes.
 */
export function filterAllowedFields<T extends readonly string[]>(
  input: Record<string, unknown>,
  allowedFields: T
): Partial<Record<T[number], unknown>> {
  const allowed = new Set<string>(allowedFields);
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (allowed.has(key)) {
      filtered[key] = input[key];
    }
  }
  return filtered as Record<T[number], unknown>;
}
```

- [ ] **Step 9: Create packages/db/src/client.ts**

```typescript
/** Supabase client factories.
 *  Three clients for different contexts:
 *  - createBrowserClient: for client-side React (anon key, no cookies)
 *  - createServerClient: for Next.js route handlers (requires cookies — NEVER call from services/repos)
 *  - createAdminClient: for server-side services/repos (service role key, full access)
 *  Constraint: Apps pass env vars. This module never reads process.env directly. */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ─── Browser Client ──────────────────────────────────────────────────────────

/**
 * Create a Supabase client for browser-side usage.
 * Uses anon key with RLS policies.
 */
export function createBrowserClient(supabaseUrl: string, anonKey: string): SupabaseClient {
  return createClient(supabaseUrl, anonKey);
}

// ─── Server Client ───────────────────────────────────────────────────────────

/**
 * Create a Supabase client for server-side route handlers with cookie-based auth.
 * Uses @supabase/ssr for proper Next.js cookie integration.
 * IMPORTANT: Only call this in route handlers or middleware. NEVER in services or repos.
 *
 * NOTE: This is a thin wrapper. Each Next.js app should configure this in their
 * own lib/supabase.ts using the @supabase/ssr createServerClient. This factory
 * provides a consistent interface that services can accept as a parameter type.
 * The actual cookie-aware implementation lives in the consuming app.
 */
export type ServerClientFactory = (
  supabaseUrl: string,
  anonKey: string,
  cookieStore: {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
    remove: (name: string, options?: Record<string, unknown>) => void;
  }
) => SupabaseClient;

// ─── Admin Client ────────────────────────────────────────────────────────────

/**
 * Create a Supabase client with service role key for full DB access.
 * Used by services and repos that need unrestricted access.
 * Bypasses RLS — use with DataScope for authorization.
 */
export function createAdminClient(supabaseUrl: string, serviceRoleKey: string): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

- [ ] **Step 10: Create packages/db/src/index.ts**

```typescript
/** @mas/db — Supabase client factories and data access utilities.
 *  Constraint: Never imports Next.js, cookies, or framework-specific modules. */

export { createBrowserClient, createAdminClient, type ServerClientFactory } from './client';
export { applyScope, type DataScope } from './scope';
export { filterAllowedFields } from './whitelist';
```

- [ ] **Step 11: Install Supabase dependency and run pnpm install**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm install`
Expected: Installs `@supabase/supabase-js` for `@mas/db`

- [ ] **Step 12: Run tests**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/db test`
Expected: All 9 tests pass (5 whitelist + 4 scope)

- [ ] **Step 13: Run build**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/db build`
Expected: `dist/` contains all `.js` + `.d.ts` files

- [ ] **Step 14: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add @mas/db package with scope, whitelist, and client factories"
```

---

## Chunk 4: @mas/logging Package

### Task 7: Create @mas/logging package

**Files:**
- Create: `packages/logging/package.json`
- Create: `packages/logging/tsconfig.json`
- Create: `packages/logging/vitest.config.ts`
- Create: `packages/logging/src/logger.ts`
- Create: `packages/logging/src/status-code.ts`
- Create: `packages/logging/src/index.ts`
- Create: `packages/logging/__tests__/logger.test.ts`
- Create: `packages/logging/__tests__/status-code.test.ts`

Unifies gtm-system's structured JSON logger and copy-of-gtm-os's Sentry-integrated logger. Sentry is an optional peer dependency — apps that use it pass their Sentry instance. The logger works without Sentry (structured console output).

- [ ] **Step 1: Create packages/logging/package.json**

```json
{
  "name": "@mas/logging",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "@sentry/node": ">=7.0.0"
  },
  "peerDependenciesMeta": {
    "@sentry/node": {
      "optional": true
    }
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json and vitest.config.ts**

`packages/logging/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/logging/vitest.config.ts`:
```typescript
/** Vitest config for @mas/logging. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Write logger tests**

Create `packages/logging/__tests__/logger.test.ts`:

```typescript
/** Tests for the structured logger. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logError, logWarn, logInfo, logDebug, configureSentry } from '../src/logger';

describe('logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logError outputs structured JSON with context and error', () => {
    const error = new Error('test failure');
    logError('module.function', error, { id: '123' });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.level).toBe('error');
    expect(output.context).toBe('module.function');
    expect(output.message).toBe('test failure');
    expect(output.id).toBe('123');
    expect(output.stack).toBeDefined();
    expect(output.timestamp).toBeDefined();
  });

  it('logError handles non-Error objects', () => {
    logError('module.function', 'string error');

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.message).toBe('string error');
  });

  it('logWarn outputs structured JSON', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    logWarn('module.function', 'something happened', { step: 'init' });

    expect(warnSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(output.level).toBe('warn');
    expect(output.context).toBe('module.function');
    expect(output.message).toBe('something happened');
    expect(output.step).toBe('init');
  });

  it('logInfo outputs structured JSON', () => {
    const infoSpy = vi.spyOn(console, 'info');
    logInfo('module.function', 'started');

    expect(infoSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(output.level).toBe('info');
  });

  it('logDebug outputs structured JSON', () => {
    const debugSpy = vi.spyOn(console, 'debug');
    logDebug('module.function', 'trace data');

    expect(debugSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(debugSpy.mock.calls[0][0] as string);
    expect(output.level).toBe('debug');
  });

  it('configureSentry captures errors when configured', () => {
    const mockSentry = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
    };
    configureSentry(mockSentry);

    const error = new Error('sentry test');
    logError('test.sentry', error);

    expect(mockSentry.captureException).toHaveBeenCalledWith(error, {
      tags: { context: 'test.sentry' },
    });

    // Clean up
    configureSentry(null);
  });

  it('configureSentry forwards metadata to Sentry', () => {
    const mockSentry = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
    };
    configureSentry(mockSentry);

    const error = new Error('meta test');
    logError('test.meta', error, { step: 'init', id: '42' });

    expect(mockSentry.captureException).toHaveBeenCalledWith(error, {
      tags: { context: 'test.meta' },
      step: 'init',
      id: '42',
    });

    configureSentry(null);
  });

  it('logWarn does NOT capture to Sentry (only errors go to Sentry)', () => {
    const mockSentry = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
    };
    configureSentry(mockSentry);

    logWarn('test.warn', 'warning message');

    expect(mockSentry.captureException).not.toHaveBeenCalled();
    expect(mockSentry.captureMessage).not.toHaveBeenCalled();

    configureSentry(null);
  });
});
```

- [ ] **Step 4: Write status-code tests**

Create `packages/logging/__tests__/status-code.test.ts`:

```typescript
/** Tests for getStatusCode helper. */
import { describe, it, expect } from 'vitest';
import { getStatusCode } from '../src/status-code';

describe('getStatusCode', () => {
  it('returns statusCode from error with statusCode property', () => {
    const error = Object.assign(new Error('Not found'), { statusCode: 404 });
    expect(getStatusCode(error)).toBe(404);
  });

  it('returns 500 for plain Error', () => {
    expect(getStatusCode(new Error('fail'))).toBe(500);
  });

  it('returns 500 for non-Error objects', () => {
    expect(getStatusCode('string error')).toBe(500);
    expect(getStatusCode(null)).toBe(500);
    expect(getStatusCode(undefined)).toBe(500);
  });

  it('returns 500 for error with non-number statusCode', () => {
    const error = Object.assign(new Error('bad'), { statusCode: 'not a number' });
    expect(getStatusCode(error)).toBe(500);
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/logging test`
Expected: FAIL — modules not found

- [ ] **Step 6: Create packages/logging/src/logger.ts**

```typescript
/** Structured JSON logger for the MAS platform.
 *  Outputs JSON in production, human-readable in dev.
 *  Optional Sentry integration — call configureSentry() at app startup.
 *  Constraint: No framework imports. Works in Node, browser, and test environments. */

// ─── Sentry Integration ──────────────────────────────────────────────────────

interface SentryLike {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: string) => void;
}

let sentryInstance: SentryLike | null = null;

/** Configure Sentry for error capture. Call once at app startup. Pass null to disable. */
export function configureSentry(sentry: SentryLike | null): void {
  sentryInstance = sentry;
}

// ─── Log Entry ───────────────────────────────────────────────────────────────

interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  context: string;
  message: string;
  timestamp: string;
  stack?: string;
  [key: string]: unknown;
}

function buildEntry(
  level: LogEntry['level'],
  context: string,
  messageOrError: unknown,
  metadata?: Record<string, unknown>
): LogEntry {
  const timestamp = new Date().toISOString();

  if (messageOrError instanceof Error) {
    return {
      level,
      context,
      message: messageOrError.message,
      stack: messageOrError.stack,
      timestamp,
      ...metadata,
    };
  }

  return {
    level,
    context,
    message: String(messageOrError),
    timestamp,
    ...metadata,
  };
}

function emit(entry: LogEntry): void {
  const output = JSON.stringify(entry);

  switch (entry.level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'info':
      console.info(output);
      break;
    case 'debug':
      console.debug(output);
      break;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Log an error with structured context. Captures to Sentry if configured. */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const entry = buildEntry('error', context, error, metadata);
  emit(entry);

  if (sentryInstance) {
    sentryInstance.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { context },
      ...metadata,
    });
  }
}

/** Log a warning with structured context. */
export function logWarn(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  emit(buildEntry('warn', context, message, metadata));
}

/** Log an info message with structured context. */
export function logInfo(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  emit(buildEntry('info', context, message, metadata));
}

/** Log a debug message with structured context. Useful for development. */
export function logDebug(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  emit(buildEntry('debug', context, message, metadata));
}
```

- [ ] **Step 7: Create packages/logging/src/status-code.ts**

```typescript
/** Status code extraction helper for route error handling.
 *  Services throw errors with statusCode attached. Routes use this to extract it.
 *  Constraint: No framework imports. Pure utility function. */

/**
 * Extract HTTP status code from an error thrown by a service.
 * Services attach status codes via: Object.assign(new Error(msg), { statusCode: N })
 * Returns 500 if no valid statusCode found.
 */
export function getStatusCode(err: unknown): number {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    const code = (err as { statusCode: unknown }).statusCode;
    if (typeof code === 'number') return code;
  }
  return 500;
}
```

- [ ] **Step 8: Create packages/logging/src/index.ts**

```typescript
/** @mas/logging — Structured logging and error handling utilities.
 *  Constraint: No framework imports. Works in Node, browser, and test environments. */

export { logError, logWarn, logInfo, logDebug, configureSentry } from './logger';
export { getStatusCode } from './status-code';
```

- [ ] **Step 9: Run pnpm install**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm install`

- [ ] **Step 10: Run tests**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/logging test`
Expected: All 12 tests pass (8 logger + 4 status-code)

- [ ] **Step 11: Run build**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/logging build`
Expected: `dist/` contains all `.js` + `.d.ts` files

- [ ] **Step 12: Commit**

```bash
git add packages/logging/
git commit -m "feat(logging): add @mas/logging package with structured logger and status-code helper"
```

---

## Chunk 5: @mas/integrations Package

### Task 8: Create @mas/integrations package with BaseApiClient

**Files:**
- Create: `packages/integrations/package.json`
- Create: `packages/integrations/tsconfig.json`
- Create: `packages/integrations/vitest.config.ts`
- Create: `packages/integrations/src/base-client.ts`
- Create: `packages/integrations/src/index.ts`
- Create: `packages/integrations/__tests__/base-client.test.ts`

- [ ] **Step 1: Create packages/integrations/package.json**

```json
{
  "name": "@mas/integrations",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@mas/logging": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json and vitest.config.ts**

`packages/integrations/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/integrations/vitest.config.ts`:
```typescript
/** Vitest config for @mas/integrations. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Write BaseApiClient tests**

Create `packages/integrations/__tests__/base-client.test.ts`:

```typescript
/** Tests for BaseApiClient. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseApiClient, ApiClientError } from '../src/base-client';

// Concrete test implementation
class TestClient extends BaseApiClient {
  constructor(apiKey: string) {
    super({
      name: 'TestAPI',
      baseUrl: 'https://api.test.com',
      headers: { 'x-api-key': apiKey },
      timeoutMs: 5000,
    });
  }

  async getItem(id: string) {
    return this.request<{ id: string; name: string }>(`/items/${id}`);
  }

  async createItem(name: string) {
    return this.request<{ id: string }>('/items', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }
}

describe('BaseApiClient', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends GET request with correct headers', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'Test' }),
    });

    const client = new TestClient('key-123');
    const result = await client.getItem('1');

    expect(result).toEqual({ id: '1', name: 'Test' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.test.com/items/1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'key-123',
          'Content-Type': 'application/json',
        }),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('sends POST request with body', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '2' }),
    });

    const client = new TestClient('key-123');
    const result = await client.createItem('Widget');

    expect(result).toEqual({ id: '2' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.test.com/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Widget' }),
      })
    );
  });

  it('throws ApiClientError on non-ok response', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    });

    const client = new TestClient('key-123');
    await expect(client.getItem('999')).rejects.toThrow(ApiClientError);
  });

  it('includes status code and response body in ApiClientError', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ error: 'Validation failed', details: ['bad field'] }),
    });

    const client = new TestClient('key-123');
    try {
      await client.getItem('1');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiErr = err as ApiClientError;
      expect(apiErr.statusCode).toBe(422);
      expect(apiErr.clientName).toBe('TestAPI');
      expect(apiErr.responseBody).toEqual({ error: 'Validation failed', details: ['bad field'] });
    }
  });

  it('throws ApiClientError on network error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    const client = new TestClient('key-123');
    await expect(client.getItem('1')).rejects.toThrow(ApiClientError);
  });

  it('handles non-JSON error responses gracefully', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    const client = new TestClient('key-123');
    await expect(client.getItem('1')).rejects.toThrow(ApiClientError);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/integrations test`
Expected: FAIL — modules not found

- [ ] **Step 5: Create packages/integrations/src/base-client.ts**

```typescript
/** BaseApiClient — shared base class for all third-party API clients.
 *  Provides: timeout, error handling, typed responses, structured logging.
 *  Constraint: No framework imports. Uses global fetch(). */

import { logError } from '@mas/logging';

// ─── Error Class ─────────────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public readonly clientName: string,
    public readonly statusCode: number,
    message: string,
    public readonly responseBody?: unknown
  ) {
    super(`[${clientName}] ${message}`);
    this.name = 'ApiClientError';
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface ApiClientConfig {
  name: string;
  baseUrl: string;
  headers: Record<string, string>;
  timeoutMs?: number;
}

// ─── Base Client ─────────────────────────────────────────────────────────────

export abstract class BaseApiClient {
  protected readonly config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    this.config = {
      ...config,
      timeoutMs: config.timeoutMs ?? 30_000,
    };
  }

  protected async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...init?.headers,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiClientError(
          this.config.name,
          res.status,
          body.error || body.message || `Request failed: ${res.status}`,
          body
        );
      }

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof ApiClientError) throw err;

      const message = err instanceof Error ? err.message : String(err);
      logError(`${this.config.name}:request`, err instanceof Error ? err : new Error(message), {
        url,
        method: init?.method ?? 'GET',
      });
      throw new ApiClientError(this.config.name, 0, message);
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

- [ ] **Step 6: Create packages/integrations/src/index.ts**

```typescript
/** @mas/integrations — Third-party API clients for the MAS platform.
 *  All integration clients extend BaseApiClient for consistent error handling.
 *  Constraint: No framework imports. Uses global fetch(). */

export { BaseApiClient, ApiClientError, type ApiClientConfig } from './base-client';

// Integration clients are added in subsequent tasks as they are extracted
// from gtm-system and leadmagnet-backend during Phase 1-2.
```

- [ ] **Step 7: Run pnpm install**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm install`

- [ ] **Step 8: Run tests**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/integrations test`
Expected: All 6 tests pass

- [ ] **Step 9: Run build**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/integrations build`
Expected: `dist/` contains all `.js` + `.d.ts` files

- [ ] **Step 10: Commit**

```bash
git add packages/integrations/
git commit -m "feat(integrations): add @mas/integrations package with BaseApiClient"
```

---

### Task 9: Add PlusVibe integration client (representative example)

**Files:**
- Create: `packages/integrations/src/plusvibe.ts`
- Modify: `packages/integrations/src/index.ts`
- Create: `packages/integrations/__tests__/plusvibe.test.ts`

This is the first concrete integration client. It demonstrates the pattern all others follow. The remaining clients (HeyReach, Attio, Resend, Apify, BrightData) are extracted during Phase 1-2 when those codepaths are migrated.

> **Source:** Read `gtm-system/src/lib/integrations/plusvibe-client.ts` for the existing implementation. Extract the core methods into the BaseApiClient pattern.

- [ ] **Step 1: Write PlusVibe client tests**

Create `packages/integrations/__tests__/plusvibe.test.ts`:

```typescript
/** Tests for PlusVibe integration client. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlusVibeClient } from '../src/plusvibe';

describe('PlusVibeClient', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('constructs with API key and workspace ID', () => {
    const client = new PlusVibeClient('key-123', 'ws-456');
    expect(client).toBeDefined();
  });

  it('lists campaigns', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ _id: 'camp-1', camp_name: 'Test Campaign' }],
        }),
    });

    const client = new PlusVibeClient('key-123', 'ws-456');
    const campaigns = await client.listCampaigns();

    expect(campaigns).toEqual({
      data: [{ _id: 'camp-1', camp_name: 'Test Campaign' }],
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.plusvibe.ai/api/v1/campaign/list?workspace_id=ws-456',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'key-123',
        }),
      })
    );
  });

  it('adds leads to campaign', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const client = new PlusVibeClient('key-123', 'ws-456');
    const result = await client.addLeadsToCampaign('camp-1', [
      { email: 'test@example.com', first_name: 'Test' },
    ]);

    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.plusvibe.ai/api/v1/lead/add/campaign',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          campaign_id: 'camp-1',
          leads: [{ email: 'test@example.com', first_name: 'Test' }],
        }),
      })
    );
  });

  it('gets campaign summary analytics', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { sent: 100, opened: 50, replied: 10 },
        }),
    });

    const client = new PlusVibeClient('key-123', 'ws-456');
    const stats = await client.getCampaignSummary('camp-1');

    expect(stats.data.sent).toBe(100);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/integrations test`
Expected: FAIL — PlusVibeClient not found

- [ ] **Step 3: Create packages/integrations/src/plusvibe.ts**

```typescript
/** PlusVibe cold email integration client.
 *  Wraps the PlusVibe API (https://developer.plusvibe.ai).
 *  Base URL: https://api.plusvibe.ai/api/v1 — Auth: x-api-key header.
 *  Constraint: No framework imports. Uses BaseApiClient. */

import { BaseApiClient } from './base-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlusVibeLead {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  linkedin_person_url?: string;
  [key: string]: unknown;
}

export interface PlusVibeCampaign {
  _id: string;
  camp_name: string;
  [key: string]: unknown;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export class PlusVibeClient extends BaseApiClient {
  private readonly workspaceId: string;

  constructor(apiKey: string, workspaceId: string) {
    super({
      name: 'PlusVibe',
      baseUrl: 'https://api.plusvibe.ai/api/v1',
      headers: { 'x-api-key': apiKey },
      timeoutMs: 30_000,
    });
    this.workspaceId = workspaceId;
  }

  // ─── Campaigns ───────────────────────────────────────────────────────────

  async listCampaigns(): Promise<{ data: PlusVibeCampaign[] }> {
    return this.request(`/campaign/list?workspace_id=${this.workspaceId}`);
  }

  async getCampaignSummary(campaignId: string): Promise<{ data: Record<string, unknown> }> {
    return this.request(`/analytics/campaign/summary?campaign_id=${campaignId}`);
  }

  // ─── Leads ───────────────────────────────────────────────────────────────

  async addLeadsToCampaign(
    campaignId: string,
    leads: PlusVibeLead[]
  ): Promise<{ success: boolean }> {
    return this.request('/lead/add/campaign', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: campaignId, leads }),
    });
  }

  // ─── Unibox ──────────────────────────────────────────────────────────────

  async getEmails(params: { campaign_id?: string; offset?: number; limit?: number } = {}): Promise<{
    data: Record<string, unknown>[];
  }> {
    const query = new URLSearchParams();
    if (params.campaign_id) query.set('campaign_id', params.campaign_id);
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    return this.request(`/unibox/emails?${query.toString()}`);
  }

  async replyToEmail(
    emailId: string,
    body: string,
    accountId: string
  ): Promise<{ success: boolean }> {
    return this.request('/unibox/emails/reply', {
      method: 'POST',
      body: JSON.stringify({ email_id: emailId, body, account_id: accountId }),
    });
  }
}
```

- [ ] **Step 4: Update index.ts**

```typescript
/** @mas/integrations — Third-party API clients for the MAS platform.
 *  All integration clients extend BaseApiClient for consistent error handling.
 *  Constraint: No framework imports. Uses global fetch(). */

export { BaseApiClient, ApiClientError, type ApiClientConfig } from './base-client';
export { PlusVibeClient, type PlusVibeLead, type PlusVibeCampaign } from './plusvibe';

// Remaining clients (HeyReach, Attio, Resend, Apify, BrightData) are extracted
// during Phase 1-2 when those codepaths are migrated.
```

- [ ] **Step 5: Run tests**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/integrations test`
Expected: All 10 tests pass (6 base-client + 4 plusvibe)

- [ ] **Step 6: Run build**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm --filter @mas/integrations build`
Expected: `dist/` contains all files

- [ ] **Step 7: Commit**

```bash
git add packages/integrations/
git commit -m "feat(integrations): add PlusVibe client as representative integration"
```

---

## Chunk 6: Final Verification + CLAUDE.md

### Task 10: Full workspace build, test, and lint verification

**Files:**
- None modified — verification only

- [ ] **Step 1: Run full workspace install**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm install`
Expected: All workspace packages linked

- [ ] **Step 2: Run full workspace build**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm build`
Expected: All 4 packages build successfully (`@mas/types`, `@mas/db`, `@mas/logging`, `@mas/integrations`)

- [ ] **Step 3: Run full workspace tests**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm test`
Expected: All tests pass across all packages

- [ ] **Step 4: Run lint**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm lint`
Expected: No errors, no warnings

- [ ] **Step 5: Run format check**

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm format:check`
Expected: All files formatted correctly

- [ ] **Step 6: Verify cross-package imports resolve at build time**

The `@mas/integrations` package already imports `@mas/logging` — if `pnpm build` (Step 2) succeeded, cross-package imports work. Verify with typecheck:

Run: `cd ~/Documents/"claude code"/mas-platform && pnpm typecheck`
Expected: No type errors across all packages

- [ ] **Step 7: Verify pre-commit hook works**

Make a trivial change and commit to trigger the hook:

```bash
cd ~/Documents/"claude code"/mas-platform
echo "" >> CLAUDE.md
git add CLAUDE.md
git commit -m "chore: verify pre-commit hook fires"
```

Expected: lint-staged runs (prettier + eslint), then typecheck, then build. Commit succeeds.
If the hook fails, debug: check `.husky/pre-commit` permissions (`chmod +x`), verify `npx lint-staged` works standalone.

---

### Task 11: Write CLAUDE.md for the monorepo

**Files:**
- Create: `mas-platform/CLAUDE.md`

- [ ] **Step 1: Write CLAUDE.md**

```markdown
# CLAUDE.md — mas-platform

> Monorepo for the Modern Agency Sales platform. All apps and shared packages live here.

## Structure

```
mas-platform/
├── apps/                   Deployable applications (arrive in Phase 1+)
├── packages/
│   ├── types/              @mas/types — shared type definitions (pure types, no runtime)
│   ├── db/                 @mas/db — Supabase client factories + DataScope + whitelist
│   ├── logging/            @mas/logging — structured JSON logger + getStatusCode
│   └── integrations/       @mas/integrations — BaseApiClient + third-party API clients
├── pnpm-workspace.yaml     Workspace config
├── tsconfig.base.json      Shared TypeScript compiler options
├── eslint.config.mjs       Root ESLint flat config (apps add their own)
└── .prettierrc             Code formatting (matches magnetlab)
```

## Commands

```bash
pnpm install                # Install all dependencies
pnpm build                  # Build all packages and apps
pnpm typecheck              # Type-check all packages and apps
pnpm test                   # Run all tests (Vitest workspace)
pnpm lint                   # Lint all packages and apps
pnpm format                 # Format all files
pnpm format:check           # Check formatting
```

## Conventions

Full reference: `~/.claude/projects/-Users-timlife/memory/coding-quality-standards.md`

### Layered Architecture (for apps)

```
Route Handler (auth → scope → validate → service → JSON)     max 30 lines
    ↓
Service (business logic, validation, orchestration)            .service.ts
    ↓
Repository (Supabase queries only, named column constants)     .repo.ts
    ↓
Supabase (PostgreSQL)
```

### File Naming

- Repositories: `{domain}.repo.ts` (kebab-case)
- Services: `{domain}.service.ts` (kebab-case)
- Frontend API modules: `{domain}.ts` in `src/frontend/api/`
- Methods: Repos use `find*`, Services use `get*/list*`

### DataScope

Every service/repo method takes `DataScope` as first param:
```typescript
import { type DataScope } from '@mas/db';
// { type: 'user' | 'tenant' | 'admin', userId, tenantId?, ownerId? }
```

### Error Handling

```typescript
// Service: attach statusCode
throw Object.assign(new Error('Not found'), { statusCode: 404 });

// Route: extract with getStatusCode()
import { getStatusCode } from '@mas/logging';
const status = getStatusCode(error);
```

### Required for Every File

- JSDoc header: `/** Name. Purpose. Constraint. */`
- Section dividers in files > 50 lines: `// ─── Name ────────────────`
- Import order: external → `@mas/*` → `@/` → type imports
- Union types, never enums: `type Status = 'a' | 'b'`
- Explicit column selects (never `select('*')`)
- Update whitelists: `ALLOWED_UPDATE_FIELDS` for all write operations

### Testing

- Vitest for packages, Jest for apps
- 50% coverage threshold
- Every route: auth (401), validation (400), happy path (200), error (500)
- Every Zod schema gets a test
- Mock services, not fetch

## Package APIs

### @mas/types
Pure type exports. No runtime code. All types use snake_case matching database columns.

### @mas/db
- `createBrowserClient(url, anonKey)` — client-side Supabase
- `ServerClientFactory` — type signature for server client (apps implement with `@supabase/ssr`)
- `createAdminClient(url, serviceRoleKey)` — server-side services/repos
- `applyScope(query, scope)` — applies user/tenant/admin filter
- `filterAllowedFields(input, allowedFields)` — whitelist for updates

### @mas/logging
- `logError(context, error, metadata?)` — structured error + Sentry
- `logWarn(context, message, metadata?)` — structured warning
- `logInfo(context, message, metadata?)` — structured info
- `logDebug(context, message, metadata?)` — structured debug
- `getStatusCode(error)` — extract HTTP status from service errors
- `configureSentry(sentry)` — enable Sentry capture (call at app startup)

### @mas/integrations
- `BaseApiClient` — abstract base class with timeout, error handling, typed responses
- `ApiClientError` — typed error class for API failures
- `PlusVibeClient` — PlusVibe cold email API
- Additional clients added as integrations are migrated

## Cross-App Data Ownership

| Pattern | Rule |
|---------|------|
| Own table, read/write | Direct repo |
| Shared table, read-only | Direct repo (OK for public/perf) |
| Other app's table, write | Call owning app's API |
| Cross-app notification | Fire-and-forget webhook (5s timeout) |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add monorepo CLAUDE.md with conventions and package APIs"
```

---

### Task 12: Push to remote and verify

**Files:**
- None modified — remote setup only

- [ ] **Step 1: Create GitHub repo**

Run: `cd ~/Documents/"claude code"/mas-platform && gh repo create modernagencysales/mas-platform --private --source=. --push`
Expected: Remote created and code pushed

> **Note:** If `gh` is not installed or configured, create the repo manually on GitHub and:
> ```bash
> git remote add origin git@github.com:modernagencysales/mas-platform.git
> git push -u origin main
> ```

- [ ] **Step 2: Verify all commits pushed**

Run: `cd ~/Documents/"claude code"/mas-platform && git log --oneline`
Expected: ~11 commits: init repo → root config → scaffold types → prospect types → remaining types → db package → logging package → integrations base → PlusVibe → CLAUDE.md → pre-commit verify

---

## Exit Criteria

All of these must be true before moving to Phase 1:

- [ ] All 4 packages (`@mas/types`, `@mas/db`, `@mas/logging`, `@mas/integrations`) build with `tsc`
- [ ] All package tests pass (`pnpm test` from root)
- [ ] Cross-package imports resolve (`@mas/integrations` imports `@mas/logging`)
- [ ] ESLint passes with zero warnings
- [ ] Prettier passes format check
- [ ] Pre-commit hook runs lint-staged + typecheck + build
- [ ] CLAUDE.md documents all conventions and package APIs
- [ ] Code pushed to `modernagencysales/mas-platform`
