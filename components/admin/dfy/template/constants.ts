/**
 * DfyTemplate constants. Shared constants, defaults, and helpers for the DFY template editor.
 * Constraint: No React imports, no side effects, pure data only.
 */

import type {
  DfyCategory,
  DfyMilestoneTemplate,
  DfyDeliverableTemplateV2,
  DfyEngagementTemplate,
  DfyAutomationType,
  DfyAutomationTrigger,
} from '../../../../types/dfy-admin-types';
import {
  CATEGORY_LABELS,
  AUTOMATION_TYPE_LABELS,
  AUTOMATION_TRIGGER_LABELS,
} from '../../../../types/dfy-admin-types';

// ─── Derived arrays ─────────────────────────────────────────────

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as DfyCategory[];
export const AUTOMATION_TYPES = Object.keys(AUTOMATION_TYPE_LABELS) as DfyAutomationType[];
export const AUTOMATION_TRIGGERS = Object.keys(AUTOMATION_TRIGGER_LABELS) as DfyAutomationTrigger[];
export const PRIORITIES = [0, 1, 2, 3, 4] as const;

// ─── Color maps ─────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<DfyCategory, { light: string; dark: string }> = {
  onboarding: {
    light: 'bg-emerald-50 text-emerald-700',
    dark: 'bg-emerald-900/30 text-emerald-400',
  },
  content: { light: 'bg-sky-50 text-sky-700', dark: 'bg-sky-900/30 text-sky-400' },
  funnel: { light: 'bg-amber-50 text-amber-700', dark: 'bg-amber-900/30 text-amber-400' },
  outbound: { light: 'bg-rose-50 text-rose-700', dark: 'bg-rose-900/30 text-rose-400' },
};

export const PRIORITY_COLORS: Record<number, { light: string; dark: string }> = {
  0: { light: 'bg-zinc-100 text-zinc-500', dark: 'bg-zinc-800 text-zinc-500' },
  1: { light: 'bg-red-50 text-red-700', dark: 'bg-red-900/30 text-red-400' },
  2: { light: 'bg-orange-50 text-orange-700', dark: 'bg-orange-900/30 text-orange-400' },
  3: { light: 'bg-violet-50 text-violet-700', dark: 'bg-violet-900/30 text-violet-400' },
  4: { light: 'bg-zinc-100 text-zinc-600', dark: 'bg-zinc-800 text-zinc-400' },
};

// ─── Template options ───────────────────────────────────────────

export const TEMPLATE_OPTIONS = [
  { slug: 'standard', label: 'Standard' },
  { slug: 'filmmaker', label: 'Filmmaker' },
] as const;

// ─── Defaults ───────────────────────────────────────────────────

export const DEFAULT_MILESTONE: DfyMilestoneTemplate = {
  name: '',
  description: '',
  sort_order: 0,
  target_day_offset: 7,
};

export const DEFAULT_DELIVERABLE: DfyDeliverableTemplateV2 = {
  name: '',
  description: '',
  category: 'onboarding',
  assignee: 'Team',
  relative_due_days: 7,
  milestone: '',
  priority: 3,
  depends_on: [],
  automation_config: {
    automatable: false,
    trigger: 'manual',
  },
  playbook_url: '',
};

export const DEFAULT_TEMPLATE: DfyEngagementTemplate = {
  name: 'Standard DFY Engagement',
  milestones: [
    {
      name: 'Onboarding',
      description: 'Initial setup and profile optimization',
      sort_order: 0,
      target_day_offset: 7,
    },
    {
      name: 'Content Engine',
      description: 'Content calendar and lead magnet creation',
      sort_order: 1,
      target_day_offset: 14,
    },
    {
      name: 'Funnel Build',
      description: 'Conversion funnel and email infrastructure',
      sort_order: 2,
      target_day_offset: 21,
    },
    {
      name: 'Outbound Launch',
      description: 'Campaign launch and scheduling',
      sort_order: 3,
      target_day_offset: 28,
    },
    {
      name: 'Optimize',
      description: 'Ongoing content refresh and performance reviews',
      sort_order: 4,
      target_day_offset: 35,
    },
  ],
  deliverables: [
    {
      name: 'LinkedIn Profile Rewrite',
      description: 'Optimize client LinkedIn profile — headline, about, experience, featured',
      category: 'content',
      assignee: 'Team',
      relative_due_days: 10,
      milestone: 'Content Engine',
      priority: 2,
      depends_on: [],
      automation_config: {
        automatable: true,
        automation_type: 'profile_rewrite',
        trigger: 'manual',
      },
    },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────

export function isNewFormatTemplate(data: unknown): data is DfyEngagementTemplate {
  return (
    typeof data === 'object' &&
    data !== null &&
    'milestones' in data &&
    Array.isArray((data as Record<string, unknown>).milestones)
  );
}
