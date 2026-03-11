/**
 * useProposalForm — Form state, helpers, query, and mutation for AdminProposalEdit.
 * Constraint: never imports React Router or renders JSX.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getProposalById, updateProposal } from '../services/proposal-supabase';
import { queryKeys } from '../lib/queryClient';
import { logError } from '../lib/logError';
import type {
  Proposal,
  ProposalGoal,
  ProposalService,
  ProposalRoadmapPhase,
  ProposalNextStep,
} from '../types/proposal-types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FormState {
  clientName: string;
  clientCompany: string;
  clientTitle: string;
  clientWebsite: string;
  clientBrandColor: string;
  headline: string;
  executiveSummary: string;
  clientSnapshot: {
    company: string;
    industry: string;
    size: string;
    revenue: string;
    currentState: string;
  };
  goals: ProposalGoal[];
  services: ProposalService[];
  roadmap: ProposalRoadmapPhase[];
  pricing: {
    packages: { name: string; price: string; features: string[]; recommended: boolean }[];
    customItems: { label: string; price: string }[];
    total: string;
    paymentTerms: string;
  };
  nextSteps: ProposalNextStep[];
  monthlyRateCents: number | null;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

const SNAKE_CASE_MAP: Record<string, string> = {
  clientName: 'client_name',
  clientCompany: 'client_company',
  clientTitle: 'client_title',
  clientWebsite: 'client_website',
  clientBrandColor: 'client_brand_color',
  clientLogoUrl: 'client_logo_url',
  headline: 'headline',
  executiveSummary: 'executive_summary',
  clientSnapshot: 'client_snapshot',
  goals: 'goals',
  services: 'services',
  roadmap: 'roadmap',
  pricing: 'pricing',
  nextSteps: 'next_steps',
  aboutUs: 'about_us',
  monthlyRateCents: 'monthly_rate_cents',
  status: 'status',
};

export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[SNAKE_CASE_MAP[k] || k] = v;
  }
  return result;
}

export function proposalToForm(p: Proposal): FormState {
  return {
    clientName: p.clientName,
    clientCompany: p.clientCompany,
    clientTitle: p.clientTitle || '',
    clientWebsite: p.clientWebsite || '',
    clientBrandColor: p.clientBrandColor || '',
    headline: p.headline,
    executiveSummary: p.executiveSummary,
    clientSnapshot: {
      company: p.clientSnapshot.company,
      industry: p.clientSnapshot.industry,
      size: p.clientSnapshot.size,
      revenue: p.clientSnapshot.revenue,
      currentState: p.clientSnapshot.currentState,
    },
    goals:
      p.goals.length > 0
        ? p.goals
        : [
            { type: 'metric', title: '', description: '', timeline: '' },
            { type: 'aspirational', title: '', description: '', timeline: '' },
            { type: 'experimental', title: '', description: '', timeline: '' },
          ],
    services: p.services,
    roadmap: p.roadmap,
    pricing: {
      packages: p.pricing.packages,
      customItems: p.pricing.customItems,
      total: p.pricing.total,
      paymentTerms: p.pricing.paymentTerms,
    },
    nextSteps: p.nextSteps,
    monthlyRateCents:
      ((p as unknown as Record<string, unknown>).monthlyRateCents as number | null) ?? null,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProposalForm(proposalId: string | undefined) {
  const navigate = useNavigate();
  const queryClientInstance = useQueryClient();

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const {
    data: proposal,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.proposalById(proposalId || ''),
    queryFn: () => getProposalById(proposalId!),
    enabled: Boolean(proposalId),
  });

  useEffect(() => {
    if (proposal && !form) {
      setForm(proposalToForm(proposal));
    }
  }, [proposal, form]);

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      return updateProposal(proposalId!, toSnakeCase(updates));
    },
    onSuccess: () => {
      refetch();
      queryClientInstance.invalidateQueries({ queryKey: queryKeys.proposalsList() });
    },
  });

  // ─── Actions ────────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!form) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveMutation.mutateAsync(form as unknown as Record<string, unknown>);
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      logError('useProposalForm.handleSaveDraft', err, { proposalId });
      setSaveMessage('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await saveMutation.mutateAsync({
        ...form,
        status: 'published',
      } as unknown as Record<string, unknown>);
      refetch();
    } catch (err) {
      logError('useProposalForm.handlePublish', err, { proposalId });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this proposal?')) return;
    try {
      await saveMutation.mutateAsync({ status: 'archived' });
      navigate('/admin/proposals');
    } catch (err) {
      logError('useProposalForm.handleArchive', err, { proposalId });
    }
  };

  const copyUrl = async () => {
    if (!proposal) return;
    const url = `${window.location.origin}/proposal/${proposal.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Form helpers ───────────────────────────────────────────────────────

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateSnapshot = (key: keyof FormState['clientSnapshot'], value: string) => {
    setForm((prev) =>
      prev ? { ...prev, clientSnapshot: { ...prev.clientSnapshot, [key]: value } } : prev
    );
  };

  const updateGoal = (idx: number, field: keyof ProposalGoal, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const goals = [...prev.goals];
      goals[idx] = { ...goals[idx], [field]: value };
      return { ...prev, goals };
    });
  };

  const addService = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            services: [
              ...prev.services,
              { name: '', description: '', deliverables: [], timeline: '' },
            ],
          }
        : prev
    );
  };

  const removeService = (idx: number) => {
    setForm((prev) =>
      prev ? { ...prev, services: prev.services.filter((_, i) => i !== idx) } : prev
    );
  };

  const updateService = (idx: number, field: keyof ProposalService, value: string | string[]) => {
    setForm((prev) => {
      if (!prev) return prev;
      const services = [...prev.services];
      services[idx] = { ...services[idx], [field]: value };
      return { ...prev, services };
    });
  };

  const addPhase = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            roadmap: [
              ...prev.roadmap,
              {
                phase: prev.roadmap.length + 1,
                title: '',
                description: '',
                duration: '',
                milestones: [],
              },
            ],
          }
        : prev
    );
  };

  const removePhase = (idx: number) => {
    setForm((prev) =>
      prev ? { ...prev, roadmap: prev.roadmap.filter((_, i) => i !== idx) } : prev
    );
  };

  const updatePhase = (
    idx: number,
    field: keyof ProposalRoadmapPhase,
    value: string | number | string[]
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      const roadmap = [...prev.roadmap];
      roadmap[idx] = { ...roadmap[idx], [field]: value };
      return { ...prev, roadmap };
    });
  };

  const addNextStep = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            nextSteps: [
              ...prev.nextSteps,
              { step: prev.nextSteps.length + 1, title: '', description: '' },
            ],
          }
        : prev
    );
  };

  const removeNextStep = (idx: number) => {
    setForm((prev) =>
      prev ? { ...prev, nextSteps: prev.nextSteps.filter((_, i) => i !== idx) } : prev
    );
  };

  const updateNextStep = (idx: number, field: keyof ProposalNextStep, value: string | number) => {
    setForm((prev) => {
      if (!prev) return prev;
      const nextSteps = [...prev.nextSteps];
      nextSteps[idx] = { ...nextSteps[idx], [field]: value };
      return { ...prev, nextSteps };
    });
  };

  const updatePricingPackage = (idx: number, field: string, value: string | string[] | boolean) => {
    setForm((prev) => {
      if (!prev) return prev;
      const packages = [...prev.pricing.packages];
      packages[idx] = { ...packages[idx], [field]: value };
      return { ...prev, pricing: { ...prev.pricing, packages } };
    });
  };

  const addPricingCustomItem = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            pricing: {
              ...prev.pricing,
              customItems: [...prev.pricing.customItems, { label: '', price: '' }],
            },
          }
        : prev
    );
  };

  const removePricingCustomItem = (idx: number) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            pricing: {
              ...prev.pricing,
              customItems: prev.pricing.customItems.filter((_, i) => i !== idx),
            },
          }
        : prev
    );
  };

  const updatePricingCustomItem = (idx: number, field: 'label' | 'price', value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const customItems = [...prev.pricing.customItems];
      customItems[idx] = { ...customItems[idx], [field]: value };
      return { ...prev, pricing: { ...prev.pricing, customItems } };
    });
  };

  const updatePricingTotal = (value: string) => {
    setForm((prev) => (prev ? { ...prev, pricing: { ...prev.pricing, total: value } } : prev));
  };

  const updatePricingPaymentTerms = (value: string) => {
    setForm((prev) =>
      prev ? { ...prev, pricing: { ...prev.pricing, paymentTerms: value } } : prev
    );
  };

  const updateMonthlyRateCents = (dollars: string) => {
    const parsed = parseInt(dollars, 10);
    setForm((prev) =>
      prev ? { ...prev, monthlyRateCents: isNaN(parsed) ? null : parsed * 100 } : prev
    );
  };

  return {
    // Query state
    proposal,
    isLoading,
    // Form state
    form,
    saving,
    copied,
    saveMessage,
    // Actions
    handleSaveDraft,
    handlePublish,
    handleArchive,
    copyUrl,
    // Field helpers
    updateField,
    updateSnapshot,
    updateGoal,
    addService,
    removeService,
    updateService,
    addPhase,
    removePhase,
    updatePhase,
    addNextStep,
    removeNextStep,
    updateNextStep,
    updatePricingPackage,
    addPricingCustomItem,
    removePricingCustomItem,
    updatePricingCustomItem,
    updatePricingTotal,
    updatePricingPaymentTerms,
    updateMonthlyRateCents,
  };
}
