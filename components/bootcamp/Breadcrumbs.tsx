import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbSegment {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ segments }) => {
  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <ChevronRight size={12} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
            )}
            {isLast ? (
              <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate">
                {segment.label}
              </span>
            ) : (
              <button
                onClick={segment.onClick}
                className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate"
              >
                {segment.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
