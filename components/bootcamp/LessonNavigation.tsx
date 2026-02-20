import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Lesson } from '../../types';

interface LessonNavigationProps {
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  onSelectLesson: (lesson: Lesson) => void;
}

const cleanTitle = (title: string) =>
  title
    .replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '')
    .replace(/\bTABLE\b:?\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const LessonNavigation: React.FC<LessonNavigationProps> = ({
  prevLesson,
  nextLesson,
  onSelectLesson,
}) => {
  if (!prevLesson && !nextLesson) return null;

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-3 mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800">
      {prevLesson ? (
        <button
          onClick={() => onSelectLesson(prevLesson)}
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all text-left group"
        >
          <ChevronLeft
            size={16}
            className="text-zinc-400 group-hover:text-violet-500 transition-colors shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">
              Previous
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate">
              {cleanTitle(prevLesson.title)}
            </p>
          </div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
      {nextLesson ? (
        <button
          onClick={() => onSelectLesson(nextLesson)}
          className="flex-1 flex items-center justify-end gap-3 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all text-right group"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">
              Next
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate">
              {cleanTitle(nextLesson.title)}
            </p>
          </div>
          <ChevronRight
            size={16}
            className="text-zinc-400 group-hover:text-violet-500 transition-colors shrink-0"
          />
        </button>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
};

export default LessonNavigation;
