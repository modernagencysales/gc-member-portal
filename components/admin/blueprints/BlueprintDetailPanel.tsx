import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Check, Loader2, Link2 } from 'lucide-react';
import {
  Prospect,
  RecommendedOffer,
  RECOMMENDED_OFFER_LABELS,
  PROSPECT_STATUS_LABELS,
  getProspectDisplayName,
} from '../../../types/blueprint-types';
import {
  updateProspectOffer,
  generateSlug,
  updateProspectSlug,
} from '../../../services/blueprint-supabase';

interface BlueprintDetailPanelProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated?: Prospect) => void;
}

const BlueprintDetailPanel: React.FC<BlueprintDetailPanelProps> = ({
  prospect,
  isOpen,
  onClose,
  onUpdate,
}) => {
  // Form state
  const [offerUnlocked, setOfferUnlocked] = useState(false);
  const [recommendedOffer, setRecommendedOffer] = useState<RecommendedOffer>('none');
  const [personalNote, setPersonalNote] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync form state with prospect data
  useEffect(() => {
    if (prospect) {
      setOfferUnlocked(prospect.offerUnlocked ?? false);
      setRecommendedOffer(prospect.recommendedOffer ?? 'none');
      setPersonalNote(prospect.offerNote ?? '');
      setHasChanges(false);
    }
  }, [prospect]);

  // Track changes
  useEffect(() => {
    if (!prospect) return;
    const changed =
      offerUnlocked !== (prospect.offerUnlocked ?? false) ||
      recommendedOffer !== (prospect.recommendedOffer ?? 'none') ||
      personalNote !== (prospect.offerNote ?? '');
    setHasChanges(changed);
  }, [offerUnlocked, recommendedOffer, personalNote, prospect]);

  if (!isOpen || !prospect) return null;

  const blueprintUrl = prospect.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/blueprint/${prospect.slug}`
    : null;

  const handleCopyUrl = async () => {
    if (!blueprintUrl) return;
    try {
      await navigator.clipboard.writeText(blueprintUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleGenerateSlug = async () => {
    if (!prospect.fullName && !prospect.firstName) {
      console.error('Cannot generate slug without a name');
      return;
    }

    setIsGeneratingSlug(true);
    try {
      const name =
        prospect.fullName || `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim();
      const slug = generateSlug(name);
      await updateProspectSlug(prospect.id, slug);
      onUpdate();
    } catch (error) {
      console.error('Failed to generate slug:', error);
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateProspectOffer(prospect.id, {
        unlocked: offerUnlocked,
        recommended: recommendedOffer,
        note: personalNote,
      });
      setHasChanges(false);
      onUpdate(updated);
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '--';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 w-96 bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col shadow-2xl"
        style={{ animation: 'slideInRight 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="truncate pr-4">
            <h2 className="text-lg font-semibold text-white truncate">
              {getProspectDisplayName(prospect)}
            </h2>
            <p className="text-sm text-zinc-400 truncate">{prospect.email || 'No email'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Blueprint URL Section */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Blueprint URL
            </label>
            {prospect.slug ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 truncate">
                  /blueprint/{prospect.slug}
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateSlug}
                disabled={isGeneratingSlug}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
              >
                {isGeneratingSlug ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Generate URL
              </button>
            )}
          </div>

          {/* Offer Unlock Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Offer Access
            </label>
            <div className="flex items-center justify-between p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
              <span className="text-sm text-zinc-300">Unlock Offer Section</span>
              <button
                onClick={() => setOfferUnlocked(!offerUnlocked)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  offerUnlocked ? 'bg-green-500' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-0 w-4 h-4 bg-white rounded-full transition-transform ${
                    offerUnlocked ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Recommended Offer Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Recommended Offer
            </label>
            <select
              value={recommendedOffer}
              onChange={(e) => setRecommendedOffer(e.target.value as RecommendedOffer)}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {(Object.entries(RECOMMENDED_OFFER_LABELS) as [RecommendedOffer, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Personal Note */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Personal Note
            </label>
            <textarea
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="Add a personal note for this prospect..."
              rows={3}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-500 resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Quick Stats */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Quick Stats
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Authority Score</p>
                <p className="text-lg font-semibold text-white">
                  {prospect.authorityScore ?? '--'}
                </p>
              </div>
              <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Fit Score</p>
                <p className="text-lg font-semibold text-white">{prospect.fitScore ?? '--'}</p>
              </div>
              <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Created</p>
                <p className="text-sm font-medium text-white">{formatDate(prospect.createdAt)}</p>
              </div>
              <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Status</p>
                <p className="text-sm font-medium text-white">
                  {prospect.status ? PROSPECT_STATUS_LABELS[prospect.status] : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Actions
            </label>
            <div className="flex flex-col gap-2">
              {prospect.slug && (
                <a
                  href={`/blueprint/${prospect.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Blueprint
                </a>
              )}
              {prospect.slug && prospect.offerUnlocked && (
                <a
                  href={`/blueprint/${prospect.slug}/offer`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Offer Page
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full px-4 py-2.5 rounded-lg font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Slide-in animation keyframes */}
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}
      </style>
    </>
  );
};

export default BlueprintDetailPanel;
