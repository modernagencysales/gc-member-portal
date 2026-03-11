/**
 * AdminProposalEdit — Orchestrator for the proposal edit page.
 * Delegates form state to useProposalForm; section UIs to section components.
 * Goals and Next Steps sections are rendered inline here.
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, Globe, Archive, ExternalLink, Copy, Check } from 'lucide-react';

import { useProposalForm } from '../../../hooks/useProposalForm';
import ProposalClientInfo from './sections/ProposalClientInfo';
import ProposalServicesSection from './sections/ProposalServicesSection';
import ProposalRoadmapSection from './sections/ProposalRoadmapSection';
import ProposalPricingSection from './sections/ProposalPricingSection';

// ─── Constants ───────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm';

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Page ────────────────────────────────────────────────────────────────────

const AdminProposalEdit: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();

  const {
    proposal,
    isLoading,
    form,
    saving,
    copied,
    saveMessage,
    handleSaveDraft,
    handlePublish,
    handleArchive,
    copyUrl,
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
  } = useProposalForm(proposalId);

  // ─── Loading / error states ────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────

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

      {/* Client Info + Snapshot + Headline/Summary + Goals */}
      <ProposalClientInfo
        form={form}
        updateField={updateField}
        updateSnapshot={updateSnapshot}
        updateGoal={updateGoal}
      />

      {/* Services */}
      <ProposalServicesSection
        services={form.services}
        addService={addService}
        removeService={removeService}
        updateService={updateService}
      />

      {/* Roadmap */}
      <ProposalRoadmapSection
        roadmap={form.roadmap}
        addPhase={addPhase}
        removePhase={removePhase}
        updatePhase={updatePhase}
      />

      {/* Pricing */}
      <ProposalPricingSection
        pricing={form.pricing}
        monthlyRateCents={form.monthlyRateCents}
        updatePricingPackage={updatePricingPackage}
        addPricingCustomItem={addPricingCustomItem}
        removePricingCustomItem={removePricingCustomItem}
        updatePricingCustomItem={updatePricingCustomItem}
        updatePricingTotal={updatePricingTotal}
        updatePricingPaymentTerms={updatePricingPaymentTerms}
        updateMonthlyRateCents={updateMonthlyRateCents}
      />

      {/* Next Steps */}
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
