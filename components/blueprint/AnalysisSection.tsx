import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Prospect } from '../../types/blueprint-types';

// ============================================
// Types
// ============================================

interface AnalysisSectionProps {
  prospect: Prospect;
  introParagraph?: string;
}

interface ParsedItem {
  title: string;
  description: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse a string in format "Title: Description text" into separate parts
 * Returns null if the input is null/undefined/empty
 */
function parseAnalysisItem(item: string | undefined): ParsedItem | null {
  if (!item || item.trim() === '') {
    return null;
  }

  const colonIndex = item.indexOf(':');
  if (colonIndex === -1) {
    // No colon found, use entire string as description with generic title
    return {
      title: 'Point',
      description: item.trim(),
    };
  }

  const title = item.slice(0, colonIndex).trim();
  const description = item.slice(colonIndex + 1).trim();

  return {
    title: title || 'Point',
    description: description || item.trim(),
  };
}

// ============================================
// Analysis Card Component
// ============================================

interface AnalysisCardProps {
  item: ParsedItem;
  variant: 'working' | 'leak';
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ item, variant }) => {
  const isWorking = variant === 'working';

  const bgClass = isWorking ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10';
  const borderClass = isWorking
    ? 'border-green-200 dark:border-green-500/20'
    : 'border-red-200 dark:border-red-500/20';
  const titleClass = isWorking
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
  const Icon = isWorking ? CheckCircle : AlertTriangle;

  return (
    <div className={`${bgClass} border ${borderClass} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-5 h-5 ${titleClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${titleClass} mb-1`}>{item.title}</h4>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// AnalysisSection Component
// ============================================

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ prospect, introParagraph }) => {
  // Parse what's working items
  const whatsWorkingItems: ParsedItem[] = [
    parseAnalysisItem(prospect.whatsWorking1),
    parseAnalysisItem(prospect.whatsWorking2),
    parseAnalysisItem(prospect.whatsWorking3),
  ].filter((item): item is ParsedItem => item !== null);

  // Parse revenue leaks items
  const revenueLeaksItems: ParsedItem[] = [
    parseAnalysisItem(prospect.revenueLeaks1),
    parseAnalysisItem(prospect.revenueLeaks2),
    parseAnalysisItem(prospect.revenueLeaks3),
  ].filter((item): item is ParsedItem => item !== null);

  // Check if there's any content to display
  const hasWhatsWorking = whatsWorkingItems.length > 0;
  const hasRevenueLeaks = revenueLeaksItems.length > 0;
  const hasBottomLine = prospect.bottomLine && prospect.bottomLine.trim() !== '';

  // Don't render anything if there's no analysis content
  if (!hasWhatsWorking && !hasRevenueLeaks && !hasBottomLine) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Here&apos;s What We Found
        </h2>
        {introParagraph && (
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{introParagraph}</p>
        )}
      </div>

      {/* What's Working Section */}
      {hasWhatsWorking && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6">
          <h3 className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-4">
            You&apos;re Already Doing These Things Right
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {whatsWorkingItems.map((item, index) => (
              <AnalysisCard key={`working-${index}`} item={item} variant="working" />
            ))}
          </div>
        </div>
      )}

      {/* Revenue Leaks Section */}
      {hasRevenueLeaks && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6">
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400 uppercase tracking-wider mb-4">
            But These Gaps Are Costing You Deals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {revenueLeaksItems.map((item, index) => (
              <AnalysisCard key={`leak-${index}`} item={item} variant="leak" />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Line Callout */}
      {hasBottomLine && (
        <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-8 text-center">
          <h3 className="text-sm font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4">
            What This Means For Your Pipeline
          </h3>
          <p className="text-zinc-900 dark:text-zinc-100 text-lg leading-relaxed max-w-2xl mx-auto">
            {prospect.bottomLine}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisSection;
