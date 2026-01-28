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

  const bgClass = isWorking ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderClass = isWorking ? 'border-green-500/20' : 'border-red-500/20';
  const titleClass = isWorking ? 'text-green-400' : 'text-red-400';
  const Icon = isWorking ? CheckCircle : AlertTriangle;

  return (
    <div className={`${bgClass} border ${borderClass} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-5 h-5 ${titleClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${titleClass} mb-1`}>{item.title}</h4>
          <p className="text-zinc-300 text-sm leading-relaxed">{item.description}</p>
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      {/* Section Title */}
      <h2 className="text-2xl font-bold text-zinc-100 mb-2">Here&apos;s What We Found</h2>
      {introParagraph && <p className="text-zinc-400 leading-relaxed mb-6">{introParagraph}</p>}
      {!introParagraph && <div className="mb-6" />}

      {/* What's Working Section */}
      {hasWhatsWorking && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
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
        <div className="mb-8">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
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
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-6 text-center">
          <h3 className="text-sm font-medium text-violet-400 uppercase tracking-wider mb-3">
            What This Means For Your Pipeline
          </h3>
          <p className="text-zinc-100 text-lg leading-relaxed">{prospect.bottomLine}</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisSection;
