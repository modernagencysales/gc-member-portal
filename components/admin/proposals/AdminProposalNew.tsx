import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react';
import { listProspects } from '../../../services/blueprint-supabase';
import {
  generateProposal,
  fetchAttioTranscript,
  fetchProposalPackages,
} from '../../../services/proposal-gtm';
import { getProposalById } from '../../../services/proposal-supabase';
import { queryKeys } from '../../../lib/queryClient';
import type { ProposalPackageConfig } from '../../../types/proposal-types';
import type { Prospect } from '../../../types/blueprint-types';

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm';

const AdminProposalNew: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [prospectSearch, setProspectSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientTitle, setClientTitle] = useState('');
  const [clientWebsite, setClientWebsite] = useState('');
  const [prospectId, setProspectId] = useState<string | undefined>();

  // Step 2 state
  const [transcriptText, setTranscriptText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [fetchingTranscript, setFetchingTranscript] = useState(false);

  // Step 3 state
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<{ label: string; price: string }[]>([]);
  const [paymentTerms, setPaymentTerms] = useState(
    'Full payment upfront before work begins. Monthly retainer billed automatically to card on file at the start of each month.'
  );

  // Step 4 state
  const [generating, setGenerating] = useState(false);
  const [generatedProposalId, setGeneratedProposalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(prospectSearch), 300);
    return () => clearTimeout(timer);
  }, [prospectSearch]);

  const {
    data: searchResults,
    isLoading: searchLoading,
    isError: searchError,
  } = useQuery({
    queryKey: ['proposals', 'prospectSearch', debouncedSearch],
    queryFn: () => listProspects({ search: debouncedSearch, limit: 10 }),
    enabled: debouncedSearch.length >= 2,
  });

  const { data: packages } = useQuery({
    queryKey: queryKeys.proposalPackages(),
    queryFn: fetchProposalPackages,
  });

  const handleSelectProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setClientName(prospect.fullName || '');
    setClientCompany(prospect.company || '');
    setClientTitle(prospect.jobTitle || prospect.currentHeadline || '');
    setProspectId(prospect.id);
    setProspectSearch('');
  };

  const handleFetchTranscript = async () => {
    if (!selectedProspect) return;
    setFetchingTranscript(true);
    try {
      const result = await fetchAttioTranscript(
        selectedProspect.email,
        selectedProspect.linkedinUrl
      );
      if (result.notes && result.notes.length > 0) {
        const text = result.notes.map((n) => `[${n.title}]\n${n.content}`).join('\n\n---\n\n');
        setTranscriptText(text);
      }
    } catch (err) {
      console.error('Failed to fetch transcript:', err);
    } finally {
      setFetchingTranscript(false);
    }
  };

  const togglePackage = (pkgId: string) => {
    setSelectedPackages((prev) =>
      prev.includes(pkgId) ? prev.filter((id) => id !== pkgId) : [...prev, pkgId]
    );
  };

  const addCustomItem = () => {
    setCustomItems((prev) => [...prev, { label: '', price: '' }]);
  };

  const removeCustomItem = (idx: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCustomItem = (idx: number, field: 'label' | 'price', value: string) => {
    setCustomItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateProposal({
        prospect_id: prospectId,
        transcript_text: transcriptText,
        selected_packages: selectedPackages,
        additional_notes: additionalNotes,
        client_name: clientName,
        client_company: clientCompany,
        client_title: clientTitle || undefined,
        client_website: clientWebsite || undefined,
      });
      setGeneratedProposalId(result.proposal_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setGenerating(false);
    }
  };

  // Poll for completion once we have a proposal ID
  useEffect(() => {
    if (!generatedProposalId) return;

    pollRef.current = setInterval(async () => {
      try {
        const proposal = await getProposalById(generatedProposalId);
        if (proposal && proposal.headline !== 'Generating...') {
          if (pollRef.current) clearInterval(pollRef.current);
          navigate(`/admin/proposals/${generatedProposalId}`);
        }
      } catch {
        // keep polling
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [generatedProposalId, navigate]);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return Boolean(clientName && clientCompany);
      case 2:
        return Boolean(transcriptText);
      case 3:
        return selectedPackages.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">New Proposal</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Create a proposal in 4 steps</p>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s === step
                ? 'bg-violet-500 text-white'
                : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
            }`}
          >
            {s < step ? <Check className="w-4 h-4" /> : s}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        {/* Step 1: Select Prospect */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Prospect</h3>

            {!manualMode ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search prospects by name, company, or email..."
                    value={prospectSearch}
                    onChange={(e) => setProspectSearch(e.target.value)}
                    className={`${INPUT_CLASS} pl-9`}
                  />
                </div>

                {debouncedSearch.length >= 2 && searchLoading && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </p>
                )}

                {searchError && (
                  <p className="text-sm text-red-500">
                    Search failed. Try entering details manually.
                  </p>
                )}

                {debouncedSearch.length >= 2 &&
                  !searchLoading &&
                  searchResults &&
                  searchResults.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No prospects found for &ldquo;{debouncedSearch}&rdquo;
                    </p>
                  )}

                {prospectSearch.length === 1 && (
                  <p className="text-sm text-zinc-400">Type at least 2 characters to search</p>
                )}

                {searchResults && searchResults.length > 0 && prospectSearch.length >= 2 && (
                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProspect(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700/50 last:border-b-0"
                      >
                        <div className="font-medium text-sm">{p.fullName || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {p.company} {p.jobTitle ? `- ${p.jobTitle}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedProspect && (
                  <>
                    <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
                        Selected: {selectedProspect.fullName}
                      </p>
                      <p className="text-xs text-violet-600 dark:text-violet-500">
                        {selectedProspect.company}{' '}
                        {selectedProspect.jobTitle ? `- ${selectedProspect.jobTitle}` : ''}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Website</label>
                      <input
                        type="url"
                        value={clientWebsite}
                        onChange={(e) => setClientWebsite(e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="https://acmecorp.com"
                      />
                      <p className="text-xs text-zinc-400 mt-1">
                        Used to extract logo and brand colors
                      </p>
                    </div>
                  </>
                )}

                <button
                  onClick={() => setManualMode(true)}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Or enter manually
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Client Name *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company *</label>
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={clientTitle}
                    onChange={(e) => setClientTitle(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="CEO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="url"
                    value={clientWebsite}
                    onChange={(e) => setClientWebsite(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="https://acmecorp.com"
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    Used to extract logo and brand colors
                  </p>
                </div>
                <button
                  onClick={() => setManualMode(false)}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Search prospects instead
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Transcript */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Transcript</h3>

            <button
              onClick={handleFetchTranscript}
              disabled={
                !selectedProspect ||
                (!selectedProspect.email && !selectedProspect.linkedinUrl) ||
                fetchingTranscript
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetchingTranscript ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Pull from Attio
            </button>

            <div>
              <label className="block text-sm font-medium mb-1">Transcript / Call Notes *</label>
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                className={`${INPUT_CLASS} h-48`}
                placeholder="Paste call transcript or meeting notes here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Additional Notes</label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className={`${INPUT_CLASS} h-24`}
                placeholder="Any extra context for the proposal..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Configure Services */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configure Services</h3>

            {packages && packages.length > 0 ? (
              <div className="space-y-3">
                {packages.map((pkg: ProposalPackageConfig) => (
                  <label
                    key={pkg.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                      selectedPackages.includes(pkg.id)
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(pkg.id)}
                      onChange={() => togglePackage(pkg.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{pkg.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {pkg.description}
                      </div>
                      <div className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-1">
                        {pkg.basePrice}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No packages configured. Add them in bootcamp_settings.
              </p>
            )}

            {/* Custom items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Custom Items</label>
                <button
                  onClick={addCustomItem}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  + Add custom item
                </button>
              </div>
              {customItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateCustomItem(idx, 'label', e.target.value)}
                    className={`${INPUT_CLASS} flex-1`}
                    placeholder="Item label"
                  />
                  <input
                    type="text"
                    value={item.price}
                    onChange={(e) => updateCustomItem(idx, 'price', e.target.value)}
                    className={`${INPUT_CLASS} w-32`}
                    placeholder="$0"
                  />
                  <button
                    onClick={() => removeCustomItem(idx)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        )}

        {/* Step 4: Generate */}
        {step === 4 && (
          <div className="space-y-4 text-center py-8">
            <h3 className="text-lg font-semibold">Generate Proposal</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ready to generate a proposal for{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{clientName}</span> at{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{clientCompany}</span>
            </p>

            {generating ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Generating proposal...</p>
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-3 rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-medium disabled:opacity-50"
              >
                Generate Proposal
              </button>
            )}

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => (step === 1 ? navigate('/admin/proposals') : setStep(step - 1))}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          disabled={generating}
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 4 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminProposalNew;
