import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, X } from 'lucide-react';
import { Prospect, LeadMagnetCard } from '../../types/blueprint-types';

// ============================================
// Types
// ============================================

interface LeadMagnetsProps {
  prospect: Prospect;
}

interface LeadMagnetData {
  number: 1 | 2 | 3;
  card?: LeadMagnetCard;
  description?: string;
  samplePost?: string;
}

// ============================================
// Copy Button Component
// ============================================

interface CopyButtonProps {
  text: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded transition-colors"
      aria-label={copied ? 'Copied!' : 'Copy sample post'}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

// ============================================
// Lead Magnet Modal Component
// ============================================

interface LeadMagnetModalProps {
  data: LeadMagnetData;
  onClose: () => void;
}

const LeadMagnetModal: React.FC<LeadMagnetModalProps> = ({ data, onClose }) => {
  const { card, description, samplePost } = data;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="min-w-0">
            {card?.contentType && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 rounded mb-2">
                {card.contentType}
              </span>
            )}
            {card?.headline && (
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {card.headline}
              </h3>
            )}
            {card?.subheadline && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{card.subheadline}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Why This Fits */}
          {card?.match && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Why This Fits
              </h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {card.match}
              </p>
            </div>
          )}

          {/* Estimated Time */}
          {card?.estHours && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Estimated time:</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{card.estHours}</span>
            </div>
          )}

          {/* Full Description */}
          {description && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Full Description
              </h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {description}
              </p>
            </div>
          )}

          {/* Sample Post */}
          {samplePost && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Sample Promotional Post
                </h4>
                <CopyButton text={samplePost} />
              </div>
              <div className="bg-zinc-50 border border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700 rounded-lg p-4">
                <pre className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {samplePost}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Lead Magnet Card Component (Clickable)
// ============================================

interface LeadMagnetCardComponentProps {
  data: LeadMagnetData;
  onClick: () => void;
}

const LeadMagnetCardComponent: React.FC<LeadMagnetCardComponentProps> = ({ data, onClick }) => {
  const { card } = data;

  if (!card) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none overflow-hidden text-left w-full hover:border-violet-300 dark:hover:border-violet-500/50 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="p-4">
        {/* Content Type Badge */}
        {card.contentType && (
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 rounded mb-3">
            {card.contentType}
          </span>
        )}

        {/* Headline */}
        {card.headline && (
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">{card.headline}</h4>
        )}

        {/* Subheadline */}
        {card.subheadline && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{card.subheadline}</p>
        )}

        {/* Why This Fits */}
        {card.match && (
          <div className="mb-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Why this fits:
            </span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 line-clamp-2">
              {card.match}
            </p>
          </div>
        )}

        {/* Estimated Time */}
        {card.estHours && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Estimated time:</span>
            <span className="text-zinc-700 dark:text-zinc-300">{card.estHours}</span>
          </div>
        )}

        {/* Click hint */}
        <div className="mt-4 text-xs font-medium text-violet-600 dark:text-violet-400">
          Click to view details →
        </div>
      </div>
    </button>
  );
};

// ============================================
// LeadMagnets Component
// ============================================

const LeadMagnets: React.FC<LeadMagnetsProps> = ({ prospect }) => {
  const [selectedCard, setSelectedCard] = useState<LeadMagnetData | null>(null);

  // Build lead magnet data array
  const leadMagnetData: LeadMagnetData[] = [
    {
      number: 1,
      card: prospect.lmCard1,
      description: prospect.leadMag1,
      samplePost: prospect.lmPost1,
    },
    {
      number: 2,
      card: prospect.lmCard2,
      description: prospect.leadMag2,
      samplePost: prospect.lmPost2,
    },
    {
      number: 3,
      card: prospect.lmCard3,
      description: prospect.leadMag3,
      samplePost: prospect.lmPost3,
    },
  ];

  // Filter to only include cards that have data
  const validLeadMagnets = leadMagnetData.filter((lm) => lm.card);

  // Don't render if there are no lead magnets
  if (validLeadMagnets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        3 Lead Magnets That Will Fill Your Pipeline
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
        These aren&apos;t generic templates. Each lead magnet is designed for your specific buyer
        persona and expertise.
      </p>

      {/* Cards Grid - Responsive: stack on mobile, 3 columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {validLeadMagnets.map((lm) => (
          <LeadMagnetCardComponent key={lm.number} data={lm} onClick={() => setSelectedCard(lm)} />
        ))}
      </div>

      {/* Modal */}
      {selectedCard && (
        <LeadMagnetModal data={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
};

export default LeadMagnets;
