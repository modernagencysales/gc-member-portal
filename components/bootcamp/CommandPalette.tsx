import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  PlayCircle,
  Sparkles,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  LogOut,
  Database,
  FileText,
} from 'lucide-react';
import { Lesson, CourseData } from '../../types';
import { AITool } from '../../types/chat-types';

interface CommandItem {
  id: string;
  label: string;
  group: 'Lessons' | 'Tools' | 'Pages' | 'Actions';
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: CourseData | null;
  aiTools: AITool[];
  onSelectLesson: (lesson: Lesson) => void;
  onShowDashboard: () => void;
  onOpenSettings?: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  hasMultipleCourses: boolean;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  courseData,
  aiTools,
  onSelectLesson,
  onShowDashboard,
  onOpenSettings,
  onToggleTheme,
  onLogout,
  isDarkMode,
  hasMultipleCourses,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build full list of command items
  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Lessons
    if (courseData) {
      courseData.weeks.forEach((week) => {
        week.lessons.forEach((lesson) => {
          const clean = lesson.title.replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '').trim();
          items.push({
            id: lesson.id,
            label: clean,
            group: 'Lessons',
            icon: <PlayCircle size={14} />,
            onSelect: () => {
              onSelectLesson(lesson);
              onClose();
            },
          });
        });
      });
    }

    // AI Tools
    aiTools.forEach((tool) => {
      items.push({
        id: `ai-tool:${tool.slug}`,
        label: tool.name,
        group: 'Tools',
        icon: <Sparkles size={14} />,
        onSelect: () => {
          onSelectLesson({
            id: `ai-tool:${tool.slug}`,
            title: tool.name,
            embedUrl: `ai-tool:${tool.slug}`,
          });
          onClose();
        },
      });
    });

    // Virtual tools
    const virtualTools = [
      { id: 'my-blueprint', label: 'My Blueprint', icon: <Sparkles size={14} /> },
      { id: 'virtual:my-posts', label: 'My Posts', icon: <FileText size={14} /> },
      { id: 'virtual:tam-builder', label: 'TAM Builder', icon: <Database size={14} /> },
      {
        id: 'virtual:connection-qualifier',
        label: 'Connection Qualifier',
        icon: <Database size={14} />,
      },
    ];
    virtualTools.forEach((vt) => {
      items.push({
        id: vt.id,
        label: vt.label,
        group: 'Tools',
        icon: vt.icon,
        onSelect: () => {
          onSelectLesson({ id: vt.id, title: vt.label, embedUrl: vt.id });
          onClose();
        },
      });
    });

    // Pages
    if (hasMultipleCourses) {
      items.push({
        id: 'page:dashboard',
        label: 'Dashboard',
        group: 'Pages',
        icon: <LayoutDashboard size={14} />,
        onSelect: () => {
          onShowDashboard();
          onClose();
        },
      });
    }
    if (onOpenSettings) {
      items.push({
        id: 'page:settings',
        label: 'Settings',
        group: 'Pages',
        icon: <Settings size={14} />,
        onSelect: () => {
          onOpenSettings();
          onClose();
        },
      });
    }

    // Actions
    items.push({
      id: 'action:theme',
      label: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      group: 'Actions',
      icon: isDarkMode ? <Sun size={14} /> : <Moon size={14} />,
      onSelect: () => {
        onToggleTheme();
        onClose();
      },
    });
    items.push({
      id: 'action:logout',
      label: 'Log Out',
      group: 'Actions',
      icon: <LogOut size={14} />,
      onSelect: () => {
        onLogout();
        onClose();
      },
    });

    return items;
  }, [
    courseData,
    aiTools,
    isDarkMode,
    hasMultipleCourses,
    onOpenSettings,
    onSelectLesson,
    onShowDashboard,
    onToggleTheme,
    onLogout,
    onClose,
  ]);

  // Filter by query
  const filtered = useMemo(() => {
    if (!query) return allItems.slice(0, 20); // Show first 20 when empty
    const q = query.toLowerCase();
    return allItems.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 20);
  }, [allItems, query]);

  // Group filtered items
  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      const existing = map.get(item.group) || [];
      existing.push(item);
      map.set(item.group, existing);
    });
    return map;
  }, [filtered]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset active index on filter change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[activeIndex]?.onSelect();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, filtered, activeIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-slide-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search size={16} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search lessons, tools, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <kbd className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No results found
            </div>
          ) : (
            Array.from(groups.entries()).map(([groupName, items]) => (
              <div key={groupName}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {groupName}
                </p>
                {items.map((item) => {
                  const idx = flatIndex++;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={item.onSelect}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`shrink-0 ${isActive ? 'text-violet-500' : 'text-zinc-400 dark:text-zinc-500'}`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
