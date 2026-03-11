/**
 * useDfyTemplateEditor. All state, helpers, query/mutation, and memos for the DFY template editor.
 * Constraint: No UI rendering, no theme imports, no component-specific style classes.
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../lib/queryClient';
import { fetchDfyTemplateBySlug, saveDfyTemplateBySlug } from '../services/dfy-admin-supabase';
import {
  DEFAULT_MILESTONE,
  DEFAULT_DELIVERABLE,
  DEFAULT_TEMPLATE,
  isNewFormatTemplate,
} from '../components/admin/dfy/template/constants';

import type {
  DfyCategory,
  DfyMilestoneTemplate,
  DfyDeliverableTemplateV2,
  DfyEngagementTemplate,
} from '../types/dfy-admin-types';

// ─── Types ──────────────────────────────────────────────────────

export interface GroupedDeliverableEntry {
  deliverable: DfyDeliverableTemplateV2;
  globalIndex: number;
}

// ─── Hook ───────────────────────────────────────────────────────

export function useDfyTemplateEditor() {
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

  // ─── Query ──────────────────────────────────────────────────

  const { data: templateData, isLoading } = useQuery({
    queryKey: queryKeys.dfyTemplateBySlug(selectedSlug),
    queryFn: () => fetchDfyTemplateBySlug(selectedSlug),
  });

  // ─── Sync fetched template into local state ─────────────────

  useEffect(() => {
    if (templateData === undefined) return;
    if (templateData === null) {
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

  // ─── Save mutation ──────────────────────────────────────────

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.dfyTemplateBySlug(selectedSlug),
      });
      setHasChanges(false);
    },
  });

  // ─── Create from default ────────────────────────────────────

  const handleCreateFromDefault = () => {
    setTemplateName(DEFAULT_TEMPLATE.name);
    setMilestones([...DEFAULT_TEMPLATE.milestones]);
    setDeliverables([...DEFAULT_TEMPLATE.deliverables]);
    setHasChanges(true);
  };

  // ─── Milestone helpers ──────────────────────────────────────

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

  // ─── Deliverable helpers ────────────────────────────────────

  const addDeliverable = (milestone?: string) => {
    setDeliverables((prev) => [...prev, { ...DEFAULT_DELIVERABLE, milestone: milestone || '' }]);
    setExpandedDeliverable(deliverables.length);
    setHasChanges(true);
  };

  const removeDeliverable = (index: number) => {
    const removed = deliverables[index];
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
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

  // ─── Memos ──────────────────────────────────────────────────

  const previewText = useMemo(() => {
    if (milestones.length === 0 && deliverables.length === 0) return '';

    const lines: string[] = [];
    const milestoneNames = milestones.map((m) => m.name);

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

  const groupedDeliverables = useMemo(() => {
    const milestoneNames = milestones.map((m) => m.name);
    const groups = new Map<string, GroupedDeliverableEntry[]>();

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

  // ─── Slug change handler ────────────────────────────────────

  const handleSlugChange = (slug: string) => {
    setSelectedSlug(slug);
    setHasChanges(false);
  };

  return {
    // State
    selectedSlug,
    activeTab,
    setActiveTab,
    templateName,
    setTemplateName,
    milestones,
    deliverables,
    hasChanges,
    setHasChanges,
    collapsedMilestones,
    expandedDeliverable,
    templateData,
    isLoading,

    // Mutation
    saveMutation,

    // Actions
    handleSlugChange,
    handleCreateFromDefault,

    // Milestone helpers
    addMilestone,
    removeMilestone,
    updateMilestone,
    moveMilestone,
    toggleMilestone,

    // Deliverable helpers
    addDeliverable,
    removeDeliverable,
    updateDeliverable,
    moveDeliverable,
    toggleDeliverable,

    // Memos
    previewText,
    groupedDeliverables,
  };
}
