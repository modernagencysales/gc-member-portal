import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Eye, Globe, Archive, ExternalLink, Copy, Check } from 'lucide-react';
import { getProposalById, updateProposal } from '../../../services/proposal-supabase';
import { queryKeys } from '../../../lib/queryClient';
import type {
  Proposal,
  ProposalGoal,
  ProposalService,
  ProposalRoadmapPhase,
  ProposalNextStep,
} from '../../../types/proposal-types';

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm';

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
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
    status: 'status',
  };
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snakeKey = map[k] || k;
    result[snakeKey] = v;
  }
  return result;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    archived: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.draft}`}
    >
      {status}
    </span>
  );
}

interface FormState {
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
}

function proposalToForm(p: Proposal): FormState {
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
  };
}

const AdminProposalEdit: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
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

  const handleSaveDraft = async () => {
    if (!form) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveMutation.mutateAsync(form as unknown as Record<string, unknown>);
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch {
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
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this proposal?')) return;
    await saveMutation.mutateAsync({ status: 'archived' });
    navigate('/admin/proposals');
  };

  const copyUrl = async () => {
    if (!proposal) return;
    const url = `${window.location.origin}/proposal/${proposal.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Form update helpers
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

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm mt-2 text-zinc-500">Loading proposal...</p>
      </div>
    );
  }

  if (!proposal || !form) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Proposal not found</p>
        <button
          onClick={() => navigate('/admin/proposals')}
          className="mt-2 text-sm text-violet-600 hover:underline"
        >
          Back to proposals
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {form.clientName} - {form.clientCompany}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={proposal.status} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMessage || 'Save Draft'}
          </button>
          {proposal.slug && (
            <a
              href={`/proposal/${proposal.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <Eye className="w-4 h-4" />
              Preview
            </a>
          )}
          {proposal.status !== 'published' && (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <Globe className="w-4 h-4" />
              Publish
            </button>
          )}
          <button
            onClick={handleArchive}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            <Archive className="w-4 h-4" />
            Archive
          </button>
        </div>
      </div>

      {/* Published URL */}
      {proposal.status === 'published' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Published</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={`${window.location.origin}/proposal/${proposal.slug}`}
              className="flex-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5"
            />
            <button
              onClick={copyUrl}
              className="p-2 rounded hover:bg-green-100 dark:hover:bg-green-800"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={`/proposal/${proposal.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded hover:bg-green-100 dark:hover:bg-green-800"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Section: Client Info */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Client Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client Name</label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              type="text"
              value={form.clientCompany}
              onChange={(e) => updateField('clientCompany', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={form.clientTitle}
              onChange={(e) => updateField('clientTitle', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              type="text"
              value={form.clientWebsite}
              onChange={(e) => updateField('clientWebsite', e.target.value)}
              className={INPUT_CLASS}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand Color</label>
            <input
              type="text"
              value={form.clientBrandColor}
              onChange={(e) => updateField('clientBrandColor', e.target.value)}
              className={INPUT_CLASS}
              placeholder="#6B21A8"
            />
          </div>
        </div>
      </section>

      {/* Section: Headline & Summary */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Headline & Summary</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Headline</label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => updateField('headline', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Executive Summary</label>
            <textarea
              value={form.executiveSummary}
              onChange={(e) => updateField('executiveSummary', e.target.value)}
              className={`${INPUT_CLASS} h-32`}
            />
          </div>
        </div>
      </section>

      {/* Section: Client Snapshot */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Client Snapshot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              type="text"
              value={form.clientSnapshot.company}
              onChange={(e) => updateSnapshot('company', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Industry</label>
            <input
              type="text"
              value={form.clientSnapshot.industry}
              onChange={(e) => updateSnapshot('industry', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <input
              type="text"
              value={form.clientSnapshot.size}
              onChange={(e) => updateSnapshot('size', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Revenue</label>
            <input
              type="text"
              value={form.clientSnapshot.revenue}
              onChange={(e) => updateSnapshot('revenue', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Current State</label>
          <textarea
            value={form.clientSnapshot.currentState}
            onChange={(e) => updateSnapshot('currentState', e.target.value)}
            className={`${INPUT_CLASS} h-24`}
          />
        </div>
      </section>

      {/* Section: Goals */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Goals</h3>
        <div className="space-y-4">
          {form.goals.map((goal, idx) => (
            <div
              key={idx}
              className="border border-zinc-100 dark:border-zinc-700/50 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Type</label>
                  <select
                    value={goal.type}
                    onChange={(e) => updateGoal(idx, 'type', e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="metric">Metric</option>
                    <option value="aspirational">Aspirational</option>
                    <option value="experimental">Experimental</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Timeline</label>
                  <input
                    type="text"
                    value={goal.timeline}
                    onChange={(e) => updateGoal(idx, 'timeline', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="e.g. 90 days"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={goal.title}
                    onChange={(e) => updateGoal(idx, 'title', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <textarea
                    value={goal.description}
                    onChange={(e) => updateGoal(idx, 'description', e.target.value)}
                    className={`${INPUT_CLASS} h-16`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Services */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Services</h3>
          <button
            onClick={addService}
            className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            + Add Service
          </button>
        </div>
        <div className="space-y-4">
          {form.services.map((svc, idx) => (
            <div
              key={idx}
              className="border border-zinc-100 dark:border-zinc-700/50 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium text-zinc-500">Service {idx + 1}</span>
                <button
                  onClick={() => removeService(idx)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={svc.name}
                    onChange={(e) => updateService(idx, 'name', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Timeline</label>
                  <input
                    type="text"
                    value={svc.timeline}
                    onChange={(e) => updateService(idx, 'timeline', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <textarea
                    value={svc.description}
                    onChange={(e) => updateService(idx, 'description', e.target.value)}
                    className={`${INPUT_CLASS} h-16`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Deliverables (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={svc.deliverables.join(', ')}
                    onChange={(e) =>
                      updateService(
                        idx,
                        'deliverables',
                        e.target.value.split(',').map((s) => s.trim())
                      )
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Roadmap */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Roadmap</h3>
          <button
            onClick={addPhase}
            className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            + Add Phase
          </button>
        </div>
        <div className="space-y-4">
          {form.roadmap.map((phase, idx) => (
            <div
              key={idx}
              className="border border-zinc-100 dark:border-zinc-700/50 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium text-zinc-500">Phase {phase.phase}</span>
                <button
                  onClick={() => removePhase(idx)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Phase #</label>
                  <input
                    type="number"
                    value={phase.phase}
                    onChange={(e) => updatePhase(idx, 'phase', parseInt(e.target.value) || 0)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Duration</label>
                  <input
                    type="text"
                    value={phase.duration}
                    onChange={(e) => updatePhase(idx, 'duration', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={phase.title}
                    onChange={(e) => updatePhase(idx, 'title', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <textarea
                    value={phase.description}
                    onChange={(e) => updatePhase(idx, 'description', e.target.value)}
                    className={`${INPUT_CLASS} h-16`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Milestones (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={phase.milestones.join(', ')}
                    onChange={(e) =>
                      updatePhase(
                        idx,
                        'milestones',
                        e.target.value.split(',').map((s) => s.trim())
                      )
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Pricing */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing</h3>

        {/* Packages */}
        <div className="space-y-4 mb-6">
          {form.pricing.packages.map((pkg, idx) => (
            <div
              key={idx}
              className="border border-zinc-100 dark:border-zinc-700/50 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Package Name</label>
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(e) => updatePricingPackage(idx, 'name', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Price</label>
                  <input
                    type="text"
                    value={pkg.price}
                    onChange={(e) => updatePricingPackage(idx, 'price', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Features (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={pkg.features.join(', ')}
                    onChange={(e) =>
                      updatePricingPackage(
                        idx,
                        'features',
                        e.target.value.split(',').map((s) => s.trim())
                      )
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={pkg.recommended}
                      onChange={(e) => updatePricingPackage(idx, 'recommended', e.target.checked)}
                    />
                    Recommended
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom items */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Custom Items</label>
            <button
              onClick={addPricingCustomItem}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
            >
              + Add item
            </button>
          </div>
          {form.pricing.customItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={item.label}
                onChange={(e) => updatePricingCustomItem(idx, 'label', e.target.value)}
                className={`${INPUT_CLASS} flex-1`}
                placeholder="Item label"
              />
              <input
                type="text"
                value={item.price}
                onChange={(e) => updatePricingCustomItem(idx, 'price', e.target.value)}
                className={`${INPUT_CLASS} w-32`}
                placeholder="$0"
              />
              <button
                onClick={() => removePricingCustomItem(idx)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Total</label>
            <input
              type="text"
              value={form.pricing.total}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, pricing: { ...prev.pricing, total: e.target.value } } : prev
                )
              }
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Terms</label>
            <input
              type="text"
              value={form.pricing.paymentTerms}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? { ...prev, pricing: { ...prev.pricing, paymentTerms: e.target.value } }
                    : prev
                )
              }
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </section>

      {/* Section: Next Steps */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Next Steps</h3>
          <button
            onClick={addNextStep}
            className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            + Add Step
          </button>
        </div>
        <div className="space-y-4">
          {form.nextSteps.map((ns, idx) => (
            <div
              key={idx}
              className="border border-zinc-100 dark:border-zinc-700/50 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium text-zinc-500">Step {ns.step}</span>
                <button
                  onClick={() => removeNextStep(idx)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Step #</label>
                  <input
                    type="number"
                    value={ns.step}
                    onChange={(e) => updateNextStep(idx, 'step', parseInt(e.target.value) || 0)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={ns.title}
                    onChange={(e) => updateNextStep(idx, 'title', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <textarea
                    value={ns.description}
                    onChange={(e) => updateNextStep(idx, 'description', e.target.value)}
                    className={`${INPUT_CLASS} h-16`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom save bar */}
      <div className="flex justify-end gap-2 pb-8">
        <button
          onClick={() => navigate('/admin/proposals')}
          className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
        >
          Back to List
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default AdminProposalEdit;
