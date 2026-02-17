import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

interface SopLink {
  id: string;
  title: string;
  url: string;
}

interface SopLinksCardProps {
  sopLinks: SopLink[];
}

const SopLinksCard: React.FC<SopLinksCardProps> = ({ sopLinks }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/40">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <BookOpen size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex-1">
          Reference SOPs ({sopLinks.length})
        </span>
        {isExpanded ? (
          <ChevronDown size={16} className="text-zinc-400" />
        ) : (
          <ChevronRight size={16} className="text-zinc-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 space-y-1">
          {sopLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors group"
            >
              <span className="flex-1">{link.title}</span>
              <ExternalLink
                size={14}
                className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default SopLinksCard;
