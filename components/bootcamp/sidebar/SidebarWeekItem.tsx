import React from 'react';
import { ChevronDown, ClipboardList } from 'lucide-react';
import { Lesson, Week } from '../../../types';
import ProgressRing from './ProgressRing';

interface SidebarWeekItemProps {
  week: Week;
  coreLessons: Lesson[];
  currentLessonId: string;
  expanded: boolean;
  onToggle: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  onCloseMobile: () => void;
  completedItems: Set<string>;
  cleanTitle: (title: string) => string;
}

const SidebarWeekItem: React.FC<SidebarWeekItemProps> = ({
  week,
  coreLessons,
  currentLessonId,
  expanded,
  onToggle,
  onSelectLesson,
  onCloseMobile,
  completedItems,
  cleanTitle,
}) => {
  // Calculate per-week progress
  const totalItems = week.actionItems.length;
  const completedCount =
    totalItems > 0 ? week.actionItems.filter((item) => completedItems.has(item.id)).length : 0;
  const weekProgress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  return (
    <div>
      {/* Week header */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-left group"
      >
        <div className="flex items-center gap-2 min-w-0">
          {totalItems > 0 && <ProgressRing progress={weekProgress} size={18} strokeWidth={2} />}
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {week.title}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-zinc-400 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
      </button>

      {/* Lesson list */}
      {expanded && (
        <div className="space-y-0.5 pb-1">
          {coreLessons.map((lesson) => {
            const isLessonActive = lesson.id === currentLessonId;
            return (
              <button
                key={lesson.id}
                onClick={() => {
                  onSelectLesson(lesson);
                  onCloseMobile();
                }}
                className={`flex items-center gap-2.5 w-full px-4 py-2 text-xs transition-all ${
                  isLessonActive
                    ? 'bg-violet-500/10 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium border-l-2 border-violet-500'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border-l-2 border-transparent'
                }`}
              >
                <span className="text-left leading-snug truncate">{cleanTitle(lesson.title)}</span>
              </button>
            );
          })}

          {/* Tasks button */}
          {week.actionItems.length > 0 && (
            <button
              onClick={() => {
                onSelectLesson({
                  id: `${week.id}:checklist`,
                  title: 'Tasks',
                  embedUrl: 'virtual:checklist',
                });
                onCloseMobile();
              }}
              className={`flex items-center gap-2 w-full px-4 py-2 text-xs transition-all ${
                currentLessonId === `${week.id}:checklist`
                  ? 'bg-violet-500 text-white font-medium rounded-md mx-1'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border-l-2 border-transparent'
              }`}
            >
              <ClipboardList size={12} />
              <span>Tasks</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarWeekItem;
