import React from 'react';

export type SidebarTab = 'curriculum' | 'tools';

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="px-3 pt-2">
      <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
        <button
          onClick={() => onTabChange('curriculum')}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
            activeTab === 'curriculum'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Curriculum
        </button>
        <button
          onClick={() => onTabChange('tools')}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
            activeTab === 'tools'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Tools
        </button>
      </div>
    </div>
  );
};

export default SidebarTabs;
