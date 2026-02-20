import React from 'react';
import { Terminal, Globe, Zap } from 'lucide-react';

interface SidebarHeaderProps {
  userDomain: string;
  overallProgress: number;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ userDomain, overallProgress }) => {
  return (
    <div className="px-4 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 mb-4">
        <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-white shrink-0">
          <Terminal size={16} />
        </div>
        <h1 className="font-semibold text-sm">Modern Agency Sales</h1>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Globe size={10} /> {userDomain}
          </span>
          <Zap size={10} className="text-violet-500" />
        </div>
        <div className="flex items-end gap-2 mb-1.5">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
            {Math.round(overallProgress)}%
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 pb-0.5">complete</span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1 rounded-full overflow-hidden">
          <div
            className="bg-violet-500 h-full transition-all duration-700"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
