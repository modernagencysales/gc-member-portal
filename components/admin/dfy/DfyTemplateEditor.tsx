import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Save,
  Eye,
  Settings,
  Layers,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { queryKeys } from '../../../lib/queryClient';
import {
  fetchDfyTemplateBySlug,
  saveDfyTemplateBySlug,
} from '../../../services/dfy-admin-supabase';
import type {
  DfyCategory,
  DfyMilestoneTemplate,
  DfyDeliverableTemplateV2,
  DfyEngagementTemplate,
  DfyAutomationType,
  DfyAutomationTrigger,
} from '../../../types/dfy-admin-types';
import {
  CATEGORY_LABELS,
  AUTOMATION_TYPE_LABELS,
  AUTOMATION_TRIGGER_LABELS,
  PRIORITY_LABELS,
} from '../../../types/dfy-admin-types';

// ============================================
// Constants
// ============================================

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DfyCategory[];
const AUTOMATION_TYPES = Object.keys(AUTOMATION_TYPE_LABELS) as DfyAutomationType[];
const AUTOMATION_TRIGGERS = Object.keys(AUTOMATION_TRIGGER_LABELS) as DfyAutomationTrigger[];
const PRIORITIES = [0, 1, 2, 3, 4] as const;

const CATEGORY_COLORS: Record<DfyCategory, { light: string; dark: string }> = {
  onboarding: {
    light: 'bg-emerald-50 text-emerald-700',
    dark: 'bg-emerald-900/30 text-emerald-400',
  },
  content: { light: 'bg-sky-50 text-sky-700', dark: 'bg-sky-900/30 text-sky-400' },
  funnel: { light: 'bg-amber-50 text-amber-700', dark: 'bg-amber-900/30 text-amber-400' },
  outbound: { light: 'bg-rose-50 text-rose-700', dark: 'bg-rose-900/30 text-rose-400' },
};

const PRIORITY_COLORS: Record<number, { light: string; dark: string }> = {
  0: { light: 'bg-zinc-100 text-zinc-500', dark: 'bg-zinc-800 text-zinc-500' },
  1: { light: 'bg-red-50 text-red-700', dark: 'bg-red-900/30 text-red-400' },
  2: { light: 'bg-orange-50 text-orange-700', dark: 'bg-orange-900/30 text-orange-400' },
  3: { light: 'bg-violet-50 text-violet-700', dark: 'bg-violet-900/30 text-violet-400' },
  4: { light: 'bg-zinc-100 text-zinc-600', dark: 'bg-zinc-800 text-zinc-400' },
};

const TEMPLATE_OPTIONS = [
  { slug: 'standard', label: 'Standard' },
  { slug: 'filmmaker', label: 'Filmmaker' },
] as const;

const DEFAULT_MILESTONE: DfyMilestoneTemplate = {
  name: '',
  description: '',
  sort_order: 0,
  target_day_offset: 7,
};

const DEFAULT_DELIVERABLE: DfyDeliverableTemplateV2 = {
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

const DEFAULT_TEMPLATE: DfyEngagementTemplate = {
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
  deliverables: [],
};

// ============================================
// Helper: detect new format
// ============================================

function isNewFormatTemplate(data: unknown): data is DfyEngagementTemplate {
  return (
    typeof data === 'object' &&
    data !== null &&
    'milestones' in data &&
    Array.isArray((data as Record<string, unknown>).milestones)
  );
}

// ============================================
// Main Component
// ============================================

const DfyTemplateEditor: React.FC = () => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();

  // Template selector
  const [selectedSlug, setSelectedSlug] = useState<string>('standard');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Template data
  const [templateName, setTemplateName] = useState('');
  const [milestones, setMilestones] = useState<DfyMilestoneTemplate[]>([]);
  const [deliverables, setDeliverables] = useState<DfyDeliverableTemplateV2[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Collapsible milestones
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<number>>(new Set());

  // Expanded deliverable (single-accordion)
  const [expandedDeliverable, setExpandedDeliverable] = useState<number | null>(null);

  // Fetch template by slug
  const { data: templateData, isLoading } = useQuery({
    queryKey: queryKeys.dfyTemplateBySlug(selectedSlug),
    queryFn: () => fetchDfyTemplateBySlug(selectedSlug),
  });

  // Sync fetched template into local state
  useEffect(() => {
    if (templateData === undefined) return; // still loading
    if (templateData === null) {
      // No template stored yet
      setTemplateName('');
      setMilestones([]);
      setDeliverables([]);
      setHasChanges(false);
      return;
    }

    if (isNewFormatTemplate(templateData)) {
      setTemplateName(templateData.name);
      setMilestones(templateData.milestones);
      setDeliverables(templateData.deliverables);
    } else if (typeof templateData === 'object' && templateData !== null) {
      // Legacy format: { deliverables: [...old format] }
      const legacy = templateData as Record<string, unknown>;
      const legacyDels = (legacy.deliverables || legacy) as Array<Record<string, unknown>>;
      if (Array.isArray(legacyDels)) {
        setTemplateName(selectedSlug === 'standard' ? 'Standard DFY Engagement' : selectedSlug);
        setMilestones([]);
        setDeliverables(
          legacyDels.map((d) => ({
            name: String(d.name || ''),
            description: String(d.description || ''),
            category: (d.category as DfyCategory) || 'onboarding',
            assignee: String(d.assignee || 'Team'),
            relative_due_days: Number(d.relative_due_days || 7),
            milestone: '',
            priority: 3 as const,
            depends_on: [],
            automation_config: { automatable: false, trigger: 'manual' as const },
            playbook_url: '',
          }))
        );
      }
    }
    setHasChanges(false);
  }, [templateData, selectedSlug]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      const template: DfyEngagementTemplate = {
        name: templateName,
        milestones,
        deliverables: deliverables.map((item) => ({
          ...item,
          automation_config: {
            automatable: item.automation_config.automatable,
            automation_type: item.automation_config.automatable
              ? item.automation_config.automation_type
              : undefined,
            trigger: item.automation_config.automatable ? item.automation_config.trigger : 'manual',
          },
        })),
      };
      return saveDfyTemplateBySlug(selectedSlug, template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyTemplateBySlug(selectedSlug) });
      setHasChanges(false);
    },
  });

  // Create from default
  const handleCreateFromDefault = () => {
    setTemplateName(DEFAULT_TEMPLATE.name);
    setMilestones([...DEFAULT_TEMPLATE.milestones]);
    setDeliverables([...DEFAULT_TEMPLATE.deliverables]);
    setHasChanges(true);
  };

  // ---- Milestone helpers ----
  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { ...DEFAULT_MILESTONE, sort_order: prev.length, name: `Milestone ${prev.length + 1}` },
    ]);
    setHasChanges(true);
  };

  const removeMilestone = (index: number) => {
    const removed = milestones[index];
    setMilestones((prev) =>
      prev.filter((_, i) => i !== index).map((m, i) => ({ ...m, sort_order: i }))
    );
    // Clear milestone reference from deliverables
    setDeliverables((prev) =>
      prev.map((d) => (d.milestone === removed.name ? { ...d, milestone: '' } : d))
    );
    setHasChanges(true);
  };

  const updateMilestone = (
    index: number,
    field: keyof DfyMilestoneTemplate,
    value: string | number
  ) => {
    const oldName = milestones[index].name;
    setMilestones((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    // If name changed, update deliverable milestone references
    if (field === 'name' && typeof value === 'string' && value !== oldName) {
      setDeliverables((prev) =>
        prev.map((d) => (d.milestone === oldName ? { ...d, milestone: value } : d))
      );
    }
    setHasChanges(true);
  };

  const moveMilestone = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= milestones.length) return;
    setMilestones((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((m, i) => ({ ...m, sort_order: i }));
    });
    setHasChanges(true);
  };

  const toggleMilestone = (index: number) => {
    setCollapsedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // ---- Deliverable helpers ----
  const addDeliverable = (milestone?: string) => {
    setDeliverables((prev) => [...prev, { ...DEFAULT_DELIVERABLE, milestone: milestone || '' }]);
    setExpandedDeliverable(deliverables.length);
    setHasChanges(true);
  };

  const removeDeliverable = (index: number) => {
    const removed = deliverables[index];
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
    // Remove from other deliverables' depends_on
    setDeliverables((prev) =>
      prev.map((d) => ({
        ...d,
        depends_on: d.depends_on?.filter((dep) => dep !== removed.name),
      }))
    );
    setExpandedDeliverable((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
    setHasChanges(true);
  };

  const updateDeliverable = (index: number, field: string, value: unknown) => {
    const oldName = deliverables[index].name;
    setDeliverables((prev) => {
      const next = [...prev];
      if (field.startsWith('automation_config.')) {
        const subField = field.replace('automation_config.', '');
        next[index] = {
          ...next[index],
          automation_config: {
            ...next[index].automation_config,
            [subField]: value,
          },
        };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
    // If name changed, update depends_on references
    if (field === 'name' && typeof value === 'string' && value !== oldName) {
      setDeliverables((prev) =>
        prev.map((d) => ({
          ...d,
          depends_on: d.depends_on?.map((dep) => (dep === oldName ? value : dep)),
        }))
      );
    }
    setHasChanges(true);
  };

  const moveDeliverable = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= deliverables.length) return;
    setDeliverables((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setHasChanges(true);
  };

  const toggleDeliverable = (index: number) => {
    setExpandedDeliverable((prev) => (prev === index ? null : index));
  };

  // ---- Dependency preview ----
  const previewText = useMemo(() => {
    if (milestones.length === 0 && deliverables.length === 0) return '';

    const lines: string[] = [];
    const milestoneNames = milestones.map((m) => m.name);

    // Group deliverables by milestone
    const grouped = new Map<string, DfyDeliverableTemplateV2[]>();
    for (const ms of milestoneNames) {
      grouped.set(ms, []);
    }
    grouped.set('(No Milestone)', []);

    for (const d of deliverables) {
      const key =
        d.milestone && milestoneNames.includes(d.milestone) ? d.milestone : '(No Milestone)';
      grouped.get(key)!.push(d);
    }

    for (const [msName, dels] of grouped) {
      if (dels.length === 0 && msName === '(No Milestone)') continue;

      const ms = milestones.find((m) => m.name === msName);
      const weekLabel = ms ? `Week ${Math.ceil(ms.target_day_offset / 7)}` : '';
      lines.push(`${msName}${weekLabel ? ` (${weekLabel})` : ''}`);

      dels.forEach((d, i) => {
        const isLast = i === dels.length - 1;
        const prefix = isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ';
        let label = d.name || '(untitled)';

        if (d.automation_config.automatable && d.automation_config.automation_type) {
          label += ` [AUTO: ${d.automation_config.automation_type}]`;
        }

        if (d.depends_on && d.depends_on.length > 0) {
          label += ` \u2190 depends on: ${d.depends_on.join(', ')}`;
        }

        lines.push(`${prefix}${label}`);
      });

      lines.push('');
    }

    return lines.join('\n');
  }, [milestones, deliverables]);

  // ---- Group deliverables by milestone ----
  const groupedDeliverables = useMemo(() => {
    const milestoneNames = milestones.map((m) => m.name);
    const groups = new Map<
      string,
      { deliverable: DfyDeliverableTemplateV2; globalIndex: number }[]
    >();

    // Initialize groups in milestone order
    for (const name of milestoneNames) {
      groups.set(name, []);
    }
    groups.set('Ungrouped', []);

    for (let i = 0; i < deliverables.length; i++) {
      const d = deliverables[i];
      const key = d.milestone && milestoneNames.includes(d.milestone) ? d.milestone : 'Ungrouped';
      groups.get(key)!.push({ deliverable: d, globalIndex: i });
    }

    return groups;
  }, [milestones, deliverables]);

  // ---- Rendering helpers (matches magnetlab design system) ----
  const inputClass = `w-full h-9 px-3 py-1 rounded-md border bg-transparent text-sm shadow-sm transition-colors ${
    isDarkMode
      ? 'border-zinc-700 text-zinc-100 placeholder:text-zinc-500'
      : 'border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
  } focus:outline-none focus:ring-1 focus:ring-violet-500`;

  const selectClass = `w-full h-9 px-3 py-1 rounded-md border bg-transparent text-sm shadow-sm transition-colors ${
    isDarkMode ? 'border-zinc-700 text-zinc-100' : 'border-zinc-300 text-zinc-900'
  } focus:outline-none focus:ring-1 focus:ring-violet-500`;

  const labelClass = `block text-sm font-medium mb-1 ${
    isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
  }`;

  const cardClass = `rounded-xl border shadow ${
    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
  }`;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Engagement Template
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Configure milestone-based templates with automation for DFY engagements
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Template selector */}
          <select
            value={selectedSlug}
            onChange={(e) => {
              setSelectedSlug(e.target.value);
              setHasChanges(false);
            }}
            className={`px-3 py-1 h-9 rounded-md border bg-transparent text-sm font-medium shadow-sm ${
              isDarkMode ? 'border-zinc-700 text-zinc-100' : 'border-zinc-300 text-zinc-900'
            }`}
          >
            {TEMPLATE_OPTIONS.map((opt) => (
              <option key={opt.slug} value={opt.slug}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            className="inline-flex items-center gap-2 h-9 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white shadow hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Success / error feedback */}
      {saveMutation.isSuccess && !hasChanges && (
        <div
          className={`p-3 rounded-xl border text-sm ${
            isDarkMode
              ? 'bg-green-900/20 border-green-800 text-green-300'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          Template saved successfully.
        </div>
      )}
      {saveMutation.isError && (
        <div
          className={`p-3 rounded-xl border text-sm ${
            isDarkMode
              ? 'bg-red-900/20 border-red-800 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          Failed to save:{' '}
          {saveMutation.error instanceof Error ? saveMutation.error.message : 'Unknown error'}
        </div>
      )}

      {/* No template — offer to create */}
      {templateData === null && !hasChanges && (
        <div className={cardClass}>
          <div className="p-8 text-center">
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              No template found for "{TEMPLATE_OPTIONS.find((o) => o.slug === selectedSlug)?.label}
              ".
            </p>
            <button
              onClick={handleCreateFromDefault}
              className="inline-flex items-center gap-2 h-9 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white shadow hover:bg-violet-500 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create from Default Template
            </button>
          </div>
        </div>
      )}

      {/* Template content */}
      {(templateData !== null || hasChanges) && (
        <>
          {/* Template name */}
          <div className={cardClass}>
            <div className="p-4">
              <label className={labelClass}>Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="e.g. Standard DFY Engagement"
                className={inputClass}
              />
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('edit')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'edit'
                  ? 'bg-violet-600 text-white'
                  : isDarkMode
                    ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-violet-600 text-white'
                  : isDarkMode
                    ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>

          {activeTab === 'preview' ? (
            /* ---- Preview Tab ---- */
            <div className={cardClass}>
              <div
                className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
              >
                <h3
                  className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
                >
                  Dependency Graph
                </h3>
              </div>
              <div className="p-4">
                {previewText ? (
                  <pre
                    className={`text-sm font-mono whitespace-pre-wrap leading-relaxed ${
                      isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    {previewText}
                  </pre>
                ) : (
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Add milestones and deliverables to see the dependency graph.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* ---- Edit Tab ---- */
            <>
              {/* Milestones Section */}
              <div className={cardClass}>
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between ${
                    isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-500" />
                    <h3
                      className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
                    >
                      Milestones
                    </h3>
                    <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      ({milestones.length})
                    </span>
                  </div>
                  <button
                    onClick={addMilestone}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      isDarkMode
                        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    Add Milestone
                  </button>
                </div>

                {milestones.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      No milestones. Click "Add Milestone" to start.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {milestones.map((ms, msIndex) => (
                      <div key={msIndex} className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Reorder */}
                          <div className="flex flex-col gap-0.5 pt-1">
                            <button
                              onClick={() => moveMilestone(msIndex, 'up')}
                              disabled={msIndex === 0}
                              className={`p-1 rounded transition-colors disabled:opacity-20 ${
                                isDarkMode
                                  ? 'text-zinc-400 hover:bg-zinc-800'
                                  : 'text-zinc-400 hover:bg-zinc-100'
                              }`}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveMilestone(msIndex, 'down')}
                              disabled={msIndex === milestones.length - 1}
                              className={`p-1 rounded transition-colors disabled:opacity-20 ${
                                isDarkMode
                                  ? 'text-zinc-400 hover:bg-zinc-800'
                                  : 'text-zinc-400 hover:bg-zinc-100'
                              }`}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Collapse toggle */}
                          <button
                            onClick={() => toggleMilestone(msIndex)}
                            className={`p-1 rounded transition-colors mt-1 ${
                              isDarkMode
                                ? 'text-zinc-400 hover:bg-zinc-800'
                                : 'text-zinc-400 hover:bg-zinc-100'
                            }`}
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform ${
                                !collapsedMilestones.has(msIndex) ? 'rotate-90' : ''
                              }`}
                            />
                          </button>

                          {/* Fields */}
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <label className={labelClass}>Name</label>
                                <input
                                  type="text"
                                  value={ms.name}
                                  onChange={(e) => updateMilestone(msIndex, 'name', e.target.value)}
                                  placeholder="Milestone name"
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Description</label>
                                <input
                                  type="text"
                                  value={ms.description}
                                  onChange={(e) =>
                                    updateMilestone(msIndex, 'description', e.target.value)
                                  }
                                  placeholder="Brief description"
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Target Day</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={ms.target_day_offset}
                                  onChange={(e) =>
                                    updateMilestone(
                                      msIndex,
                                      'target_day_offset',
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                  className={inputClass}
                                />
                              </div>
                              <div className="flex items-end">
                                <span
                                  className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                                >
                                  Week {Math.ceil(ms.target_day_offset / 7)} &middot;{' '}
                                  {deliverables.filter((d) => d.milestone === ms.name).length}{' '}
                                  deliverables
                                </span>
                              </div>
                            </div>

                            {/* Deliverables under this milestone (when expanded) */}
                            {!collapsedMilestones.has(msIndex) && (
                              <div className="mt-3 ml-2 space-y-1">
                                {deliverables
                                  .map((d, i) => ({ d, i }))
                                  .filter(({ d }) => d.milestone === ms.name)
                                  .map(({ d, i }) => (
                                    <div
                                      key={i}
                                      className={`text-xs px-2 py-1 rounded ${
                                        isDarkMode
                                          ? 'text-zinc-400 bg-zinc-800/50'
                                          : 'text-zinc-500 bg-zinc-50'
                                      }`}
                                    >
                                      {d.name || '(untitled)'}
                                      {d.automation_config.automatable &&
                                        d.automation_config.automation_type && (
                                          <span className="ml-1 text-violet-400">[AUTO]</span>
                                        )}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeMilestone(msIndex)}
                            className={`p-2 rounded-md transition-colors mt-1 ${
                              isDarkMode
                                ? 'text-zinc-500 hover:bg-red-900/20 hover:text-red-400'
                                : 'text-zinc-400 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title="Remove milestone"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deliverables Section — grouped by milestone */}
              <div className={cardClass}>
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between ${
                    isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
                    >
                      Deliverables
                    </h3>
                    <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      ({deliverables.length})
                    </span>
                  </div>
                  <button
                    onClick={() => addDeliverable()}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      isDarkMode
                        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    Add Deliverable
                  </button>
                </div>

                {deliverables.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      No deliverables. Click "Add Deliverable" to start.
                    </p>
                  </div>
                ) : (
                  <div>
                    {Array.from(groupedDeliverables.entries()).map(([groupName, items]) => {
                      if (items.length === 0 && groupName === 'Ungrouped') return null;
                      const isUngrouped = groupName === 'Ungrouped';

                      return (
                        <div key={groupName}>
                          {/* Group header */}
                          <div
                            className={`px-4 py-2 flex items-center justify-between ${
                              isDarkMode
                                ? 'bg-zinc-800/50 border-b border-zinc-800'
                                : 'bg-zinc-50 border-b border-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
                              >
                                {groupName}
                              </span>
                              <span
                                className={`text-xs ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}
                              >
                                ({items.length})
                              </span>
                            </div>
                            {!isUngrouped && (
                              <button
                                onClick={() => addDeliverable(groupName)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                  isDarkMode
                                    ? 'text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                                    : 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700'
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </button>
                            )}
                          </div>

                          {/* Deliverable rows */}
                          <div
                            className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}
                          >
                            {items.map(({ deliverable: row, globalIndex: index }) => {
                              const isExpanded = expandedDeliverable === index;
                              const catColors =
                                CATEGORY_COLORS[row.category] || CATEGORY_COLORS.onboarding;
                              const priColors = PRIORITY_COLORS[row.priority] || PRIORITY_COLORS[3];

                              return (
                                <div key={index}>
                                  {/* Compact collapsed row */}
                                  <div
                                    className={`px-4 py-2 flex items-center gap-2 cursor-pointer transition-colors ${
                                      isExpanded
                                        ? isDarkMode
                                          ? 'bg-zinc-800/30'
                                          : 'bg-violet-50/50'
                                        : isDarkMode
                                          ? 'hover:bg-zinc-800/20'
                                          : 'hover:bg-zinc-50'
                                    }`}
                                    onClick={() => toggleDeliverable(index)}
                                  >
                                    {/* Reorder arrows */}
                                    <div
                                      className="flex flex-col gap-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => moveDeliverable(index, 'up')}
                                        disabled={index === 0}
                                        className={`p-0.5 rounded transition-colors disabled:opacity-20 ${
                                          isDarkMode
                                            ? 'text-zinc-500 hover:bg-zinc-700'
                                            : 'text-zinc-400 hover:bg-zinc-200'
                                        }`}
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => moveDeliverable(index, 'down')}
                                        disabled={index === deliverables.length - 1}
                                        className={`p-0.5 rounded transition-colors disabled:opacity-20 ${
                                          isDarkMode
                                            ? 'text-zinc-500 hover:bg-zinc-700'
                                            : 'text-zinc-400 hover:bg-zinc-200'
                                        }`}
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Expand chevron */}
                                    <ChevronRight
                                      className={`w-4 h-4 shrink-0 transition-transform ${
                                        isExpanded ? 'rotate-90' : ''
                                      } ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                                    />

                                    {/* Name */}
                                    <span
                                      className={`text-sm font-medium truncate min-w-0 flex-1 ${
                                        isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                                      }`}
                                    >
                                      {row.name || '(untitled)'}
                                    </span>

                                    {/* Category badge */}
                                    <span
                                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
                                        isDarkMode ? catColors.dark : catColors.light
                                      }`}
                                    >
                                      {CATEGORY_LABELS[row.category]}
                                    </span>

                                    {/* Assignee */}
                                    <span
                                      className={`text-xs shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                                    >
                                      {row.assignee}
                                    </span>

                                    {/* Due days */}
                                    <span
                                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
                                        isDarkMode
                                          ? 'bg-zinc-800 text-zinc-400'
                                          : 'bg-zinc-100 text-zinc-600'
                                      }`}
                                    >
                                      Day {row.relative_due_days}
                                    </span>

                                    {/* Priority badge */}
                                    {row.priority > 0 && (
                                      <span
                                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
                                          isDarkMode ? priColors.dark : priColors.light
                                        }`}
                                      >
                                        P{row.priority} {PRIORITY_LABELS[row.priority]}
                                      </span>
                                    )}

                                    {/* Automation icon */}
                                    {row.automation_config.automatable && (
                                      <span
                                        className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${
                                          isDarkMode
                                            ? 'bg-violet-900/30 text-violet-400'
                                            : 'bg-violet-50 text-violet-600'
                                        }`}
                                        title={`AUTO: ${row.automation_config.automation_type || 'not set'}`}
                                      >
                                        AUTO
                                      </span>
                                    )}

                                    {/* Dependency icon */}
                                    {(row.depends_on?.length ?? 0) > 0 && (
                                      <span
                                        className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${
                                          isDarkMode
                                            ? 'bg-purple-900/30 text-purple-400'
                                            : 'bg-purple-50 text-purple-600'
                                        }`}
                                        title={`Depends on: ${row.depends_on!.join(', ')}`}
                                      >
                                        {row.depends_on!.length} dep
                                        {row.depends_on!.length !== 1 ? 's' : ''}
                                      </span>
                                    )}

                                    {/* Remove button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeDeliverable(index);
                                      }}
                                      className={`p-1 rounded transition-colors shrink-0 ${
                                        isDarkMode
                                          ? 'text-zinc-600 hover:bg-red-900/20 hover:text-red-400'
                                          : 'text-zinc-300 hover:bg-red-50 hover:text-red-600'
                                      }`}
                                      title="Remove deliverable"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Expanded edit form */}
                                  {isExpanded && (
                                    <div
                                      className={`px-4 py-4 space-y-4 ${
                                        isDarkMode
                                          ? 'bg-zinc-800/20 border-b border-zinc-800'
                                          : 'bg-zinc-50/50 border-b border-zinc-200'
                                      }`}
                                    >
                                      {/* Row 1: core fields */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                        <div>
                                          <label className={labelClass}>Name</label>
                                          <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) =>
                                              updateDeliverable(index, 'name', e.target.value)
                                            }
                                            placeholder="Deliverable name"
                                            className={inputClass}
                                          />
                                        </div>
                                        <div>
                                          <label className={labelClass}>Description</label>
                                          <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) =>
                                              updateDeliverable(
                                                index,
                                                'description',
                                                e.target.value
                                              )
                                            }
                                            placeholder="Brief description"
                                            className={inputClass}
                                          />
                                        </div>
                                        <div>
                                          <label className={labelClass}>Category</label>
                                          <select
                                            value={row.category}
                                            onChange={(e) =>
                                              updateDeliverable(index, 'category', e.target.value)
                                            }
                                            className={selectClass}
                                          >
                                            {CATEGORIES.map((cat) => (
                                              <option key={cat} value={cat}>
                                                {CATEGORY_LABELS[cat]}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className={labelClass}>Assignee</label>
                                          <input
                                            type="text"
                                            value={row.assignee}
                                            onChange={(e) =>
                                              updateDeliverable(index, 'assignee', e.target.value)
                                            }
                                            placeholder="e.g. Team"
                                            className={inputClass}
                                          />
                                        </div>
                                        <div>
                                          <label className={labelClass}>Due (days)</label>
                                          <input
                                            type="number"
                                            min={0}
                                            value={row.relative_due_days}
                                            onChange={(e) =>
                                              updateDeliverable(
                                                index,
                                                'relative_due_days',
                                                parseInt(e.target.value, 10) || 0
                                              )
                                            }
                                            className={inputClass}
                                          />
                                        </div>
                                      </div>

                                      {/* Row 2: milestone + priority */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div>
                                          <label className={labelClass}>Milestone</label>
                                          <select
                                            value={row.milestone}
                                            onChange={(e) =>
                                              updateDeliverable(index, 'milestone', e.target.value)
                                            }
                                            className={selectClass}
                                          >
                                            <option value="">(None)</option>
                                            {milestones.map((ms) => (
                                              <option key={ms.name} value={ms.name}>
                                                {ms.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className={labelClass}>Priority</label>
                                          <select
                                            value={row.priority}
                                            onChange={(e) =>
                                              updateDeliverable(
                                                index,
                                                'priority',
                                                parseInt(e.target.value, 10)
                                              )
                                            }
                                            className={selectClass}
                                          >
                                            {PRIORITIES.map((p) => (
                                              <option key={p} value={p}>
                                                {PRIORITY_LABELS[p]}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>

                                      {/* Detail fields: Dependencies, Playbook, Automation */}
                                      <div
                                        className={`p-3 rounded-md space-y-3 ${
                                          isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-100/80'
                                        }`}
                                      >
                                        {/* Dependencies */}
                                        <div>
                                          <label className={labelClass}>Dependencies</label>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {deliverables
                                              .filter((_, i) => i !== index)
                                              .map((other) => {
                                                if (!other.name) return null;
                                                const isSelected =
                                                  row.depends_on?.includes(other.name) ?? false;
                                                return (
                                                  <label
                                                    key={other.name}
                                                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                                                      isSelected
                                                        ? isDarkMode
                                                          ? 'bg-purple-900/30 text-purple-300'
                                                          : 'bg-purple-100 text-purple-700'
                                                        : isDarkMode
                                                          ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                                                          : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                                                    }`}
                                                  >
                                                    <input
                                                      type="checkbox"
                                                      checked={isSelected}
                                                      onChange={(e) => {
                                                        const current = row.depends_on || [];
                                                        const updated = e.target.checked
                                                          ? [...current, other.name]
                                                          : current.filter((d) => d !== other.name);
                                                        updateDeliverable(
                                                          index,
                                                          'depends_on',
                                                          updated
                                                        );
                                                      }}
                                                      className="w-3 h-3 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                                                    />
                                                    {other.name}
                                                  </label>
                                                );
                                              })}
                                            {deliverables.filter(
                                              (_, i) => i !== index && deliverables[i].name
                                            ).length === 0 && (
                                              <span
                                                className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                                              >
                                                No other named deliverables to depend on
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Playbook URL */}
                                        <div>
                                          <label className={labelClass}>Playbook URL</label>
                                          <input
                                            type="url"
                                            value={row.playbook_url || ''}
                                            onChange={(e) =>
                                              updateDeliverable(
                                                index,
                                                'playbook_url',
                                                e.target.value
                                              )
                                            }
                                            placeholder="https://dwy-playbook.vercel.app/..."
                                            className={inputClass}
                                          />
                                        </div>

                                        {/* Automation Config */}
                                        <div>
                                          <label className={labelClass}>Automation</label>
                                          <div className="space-y-2 mt-1">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={row.automation_config.automatable}
                                                onChange={(e) =>
                                                  updateDeliverable(
                                                    index,
                                                    'automation_config.automatable',
                                                    e.target.checked
                                                  )
                                                }
                                                className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                                              />
                                              <span
                                                className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
                                              >
                                                Automatable
                                              </span>
                                            </label>

                                            {row.automation_config.automatable && (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                                                <div>
                                                  <label className={labelClass}>
                                                    Automation Type
                                                  </label>
                                                  <select
                                                    value={
                                                      row.automation_config.automation_type || ''
                                                    }
                                                    onChange={(e) =>
                                                      updateDeliverable(
                                                        index,
                                                        'automation_config.automation_type',
                                                        e.target.value || undefined
                                                      )
                                                    }
                                                    className={selectClass}
                                                  >
                                                    <option value="">Select type...</option>
                                                    {AUTOMATION_TYPES.map((t) => (
                                                      <option key={t} value={t}>
                                                        {AUTOMATION_TYPE_LABELS[t]}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div>
                                                  <label className={labelClass}>Trigger</label>
                                                  <select
                                                    value={row.automation_config.trigger}
                                                    onChange={(e) =>
                                                      updateDeliverable(
                                                        index,
                                                        'automation_config.trigger',
                                                        e.target.value
                                                      )
                                                    }
                                                    className={selectClass}
                                                  >
                                                    {AUTOMATION_TRIGGERS.map((t) => (
                                                      <option key={t} value={t}>
                                                        {AUTOMATION_TRIGGER_LABELS[t]}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Bottom save button for long forms */}
      {deliverables.length > 3 && (
        <div className="flex justify-end">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            className="inline-flex items-center gap-2 h-9 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white shadow hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DfyTemplateEditor;
