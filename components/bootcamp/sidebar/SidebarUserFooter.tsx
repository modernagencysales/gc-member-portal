import React from 'react';
import { Sun, Moon, LogOut, Settings } from 'lucide-react';

interface SidebarUserFooterProps {
  displayLabel: string;
  userStatus?: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings?: () => void;
  onLogout: () => void;
}

const SidebarUserFooter: React.FC<SidebarUserFooterProps> = ({
  displayLabel,
  userStatus,
  isDarkMode,
  onToggleTheme,
  onOpenSettings,
  onLogout,
}) => {
  return (
    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 truncate">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-medium text-xs shrink-0">
          {displayLabel.substring(0, 2).toUpperCase()}
        </div>
        <button
          onClick={onOpenSettings}
          className="truncate text-left hover:opacity-80 transition-opacity"
        >
          <p className="text-sm text-zinc-900 dark:text-white truncate font-medium">
            {displayLabel}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{userStatus}</p>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
          title="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};

export default SidebarUserFooter;
