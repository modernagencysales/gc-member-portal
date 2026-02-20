import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SidebarSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const SidebarSearch: React.FC<SidebarSearchProps> = ({ query, onQueryChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="px-3 pt-3">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full pl-8 pr-8 py-1.5 text-base md:text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors"
        />
        {query ? (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X size={12} />
          </button>
        ) : (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded">
            {navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}K
          </kbd>
        )}
      </div>
    </div>
  );
};

export default SidebarSearch;
