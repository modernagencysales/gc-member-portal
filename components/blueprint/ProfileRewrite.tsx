import React, { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { Prospect } from '../../types/blueprint-types';

// ============================================
// Types
// ============================================

interface ProfileRewriteProps {
  prospect: Prospect;
}

type HeadlineTab = 'outcome' | 'authority' | 'hybrid';

interface TabConfig {
  key: HeadlineTab;
  label: string;
  getValue: (prospect: Prospect) => string | undefined;
}

// ============================================
// Constants
// ============================================

const HEADLINE_TABS: TabConfig[] = [
  {
    key: 'outcome',
    label: 'Outcome',
    getValue: (prospect) => prospect.headlineOutcomeBased,
  },
  {
    key: 'authority',
    label: 'Authority',
    getValue: (prospect) => prospect.headlineAuthorityBased,
  },
  {
    key: 'hybrid',
    label: 'Hybrid',
    getValue: (prospect) => prospect.headlineHybrid,
  },
];

// ============================================
// Copy Button Component
// ============================================

interface CopyButtonProps {
  text: string | undefined;
  label?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (!text) return null;

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
      aria-label={copied ? 'Copied!' : label}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

// ============================================
// Tooltip Component
// ============================================

interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-zinc-500 hover:text-zinc-300 transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="More information"
      >
        <Info className="w-4 h-4" />
      </button>
      {isVisible && (
        <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-w-xs whitespace-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-zinc-800" />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Comparison Column Component
// ============================================

interface ComparisonColumnProps {
  label: string;
  content: string | undefined;
  variant: 'before' | 'after';
  showCopy?: boolean;
  maxHeight?: boolean;
}

const ComparisonColumn: React.FC<ComparisonColumnProps> = ({
  label,
  content,
  variant,
  showCopy = false,
  maxHeight = false,
}) => {
  const isBefore = variant === 'before';

  const containerClasses = isBefore
    ? 'bg-zinc-800/50 border-zinc-700'
    : 'bg-zinc-900 border-violet-500/50';

  const textClasses = isBefore ? 'text-zinc-400' : 'text-zinc-100';

  const labelClasses = isBefore ? 'text-zinc-500' : 'text-violet-400';

  const contentClasses = maxHeight
    ? 'max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800'
    : '';

  const hasContent = content && content.trim() !== '';

  return (
    <div className={`flex-1 border rounded-lg p-4 ${containerClasses}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium uppercase tracking-wider ${labelClasses}`}>
          {label}
        </span>
        {showCopy && hasContent && <CopyButton text={content} />}
      </div>
      <div className={contentClasses}>
        {hasContent ? (
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${textClasses}`}>{content}</p>
        ) : (
          <p className="text-sm text-zinc-600 italic">Not available</p>
        )}
      </div>
    </div>
  );
};

// ============================================
// Tab Button Component
// ============================================

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
    }`}
  >
    {children}
  </button>
);

// ============================================
// ProfileRewrite Component
// ============================================

const ProfileRewrite: React.FC<ProfileRewriteProps> = ({ prospect }) => {
  const [activeTab, setActiveTab] = useState<HeadlineTab>('outcome');

  // Get the active headline value based on selected tab
  const activeTabConfig = HEADLINE_TABS.find((tab) => tab.key === activeTab);
  const activeHeadline = activeTabConfig?.getValue(prospect);

  // Check if there's any headline content to display
  const hasHeadlineContent =
    prospect.currentHeadline ||
    prospect.headlineOutcomeBased ||
    prospect.headlineAuthorityBased ||
    prospect.headlineHybrid;

  // Check if there's any bio content to display
  const hasBioContent = prospect.currentBio || prospect.recommendedBio;

  // Check if there's any content at all
  const hasContent = hasHeadlineContent || hasBioContent;

  // Don't render anything if there's no content
  if (!hasContent) {
    return null;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      {/* Section Title */}
      <h2 className="text-2xl font-bold text-zinc-100 mb-2">Your New Magnetic Profile</h2>
      <p className="text-zinc-400 leading-relaxed mb-6">
        Every element below is ready to copy and paste directly into your LinkedIn profile. No
        guesswork — just swap in the new copy.
      </p>

      {/* Headline Section */}
      {hasHeadlineContent && (
        <div className="mb-8">
          {/* Headline Title with Tooltip */}
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Headline</h3>
            {prospect.headlineRecommendationReason && (
              <Tooltip text={prospect.headlineRecommendationReason} />
            )}
          </div>

          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {HEADLINE_TABS.map((tab) => (
              <TabButton
                key={tab.key}
                isActive={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>

          {/* Before/After Comparison */}
          <div className="flex flex-col md:flex-row gap-4">
            <ComparisonColumn label="Current" content={prospect.currentHeadline} variant="before" />
            <ComparisonColumn
              label="Recommended"
              content={activeHeadline}
              variant="after"
              showCopy
            />
          </div>
        </div>
      )}

      {/* Bio Section */}
      {hasBioContent && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Bio</h3>

          {/* Before/After Comparison */}
          <div className="flex flex-col md:flex-row gap-4">
            <ComparisonColumn
              label="Current"
              content={prospect.currentBio}
              variant="before"
              maxHeight
            />
            <ComparisonColumn
              label="Recommended"
              content={prospect.recommendedBio}
              variant="after"
              showCopy
              maxHeight
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileRewrite;
