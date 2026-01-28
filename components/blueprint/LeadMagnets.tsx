import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
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
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
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
// Lead Magnet Card Component
// ============================================

interface LeadMagnetCardComponentProps {
  data: LeadMagnetData;
  isExpanded: boolean;
  onToggle: () => void;
}

const LeadMagnetCardComponent: React.FC<LeadMagnetCardComponentProps> = ({
  data,
  isExpanded,
  onToggle,
}) => {
  const { card, description, samplePost } = data;

  // Don't render if there's no card data
  if (!card) {
    return null;
  }

  const hasExpandableContent = description || samplePost;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Card Header - Always Visible */}
      <div className="p-4">
        {/* Content Type Badge */}
        {card.contentType && (
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-violet-500/20 text-violet-400 rounded mb-3">
            {card.contentType}
          </span>
        )}

        {/* Headline */}
        {card.headline && <h4 className="font-bold text-zinc-100 mb-1">{card.headline}</h4>}

        {/* Subheadline */}
        {card.subheadline && <p className="text-sm text-zinc-400 mb-3">{card.subheadline}</p>}

        {/* Why This Fits */}
        {card.match && (
          <div className="mb-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Why this fits:
            </span>
            <p className="text-sm text-zinc-300 mt-1">{card.match}</p>
          </div>
        )}

        {/* Estimated Time */}
        {card.estHours && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Estimated time:</span>
            <span className="text-zinc-300">{card.estHours}</span>
          </div>
        )}

        {/* Expand/Collapse Button */}
        {hasExpandableContent && (
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 mt-4 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Show more</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && hasExpandableContent && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          {/* Full Description */}
          {description && (
            <div>
              <h5 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Full Description
              </h5>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {description}
              </p>
            </div>
          )}

          {/* Sample Post */}
          {samplePost && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Sample Promotional Post
                </h5>
                <CopyButton text={samplePost} />
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <pre className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {samplePost}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// LeadMagnets Component
// ============================================

const LeadMagnets: React.FC<LeadMagnetsProps> = ({ prospect }) => {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

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

  const toggleCard = (cardNumber: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardNumber)) {
        next.delete(cardNumber);
      } else {
        next.add(cardNumber);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <h2 className="text-lg font-semibold text-zinc-100">LEAD MAGNET IDEAS</h2>

      {/* Cards Grid - Responsive: stack on mobile, 3 columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {validLeadMagnets.map((lm) => (
          <LeadMagnetCardComponent
            key={lm.number}
            data={lm}
            isExpanded={expandedCards.has(lm.number)}
            onToggle={() => toggleCard(lm.number)}
          />
        ))}
      </div>
    </div>
  );
};

export default LeadMagnets;
