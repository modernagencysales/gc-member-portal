import React from 'react';
import { ClipboardList, ChevronLeft } from 'lucide-react';
import { LmsLessonWithContent, LmsWeek } from '../../types/lms-types';
import { ContentItemRenderer } from './content-renderers';

interface LmsLessonViewProps {
  lesson: LmsLessonWithContent;
  currentWeek?: LmsWeek;
  studentId?: string;
  onBack?: () => void;
}

/**
 * LMS Lesson View component
 * Renders a lesson with its content items using the appropriate content type renderers
 */
const LmsLessonView: React.FC<LmsLessonViewProps> = ({
  lesson,
  currentWeek,
  studentId,
  onBack,
}) => {
  const cleanTitle = (title: string) => title.replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '').trim();

  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      {/* Header */}
      <header className="mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to curriculum
          </button>
        )}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                <ClipboardList size={12} /> Lesson
              </span>
              {currentWeek && (
                <span className="text-zinc-400 dark:text-zinc-500 text-xs">
                  • {currentWeek.title}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              {cleanTitle(lesson.title)}
            </h2>
            {lesson.description && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{lesson.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Content Items */}
      <div className="space-y-6 animate-slide-in">
        {lesson.contentItems && lesson.contentItems.length > 0 ? (
          lesson.contentItems.map((item) => (
            <div key={item.id}>
              {item.title && lesson.contentItems.length > 1 && (
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-3">
                  {item.title}
                </h3>
              )}
              <ContentItemRenderer item={item} studentId={studentId} />
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              No content has been added to this lesson yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LmsLessonView;
