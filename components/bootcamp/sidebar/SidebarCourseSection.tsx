import React from 'react';
import { ChevronDown, BookOpen, CheckCircle2 } from 'lucide-react';
import { CourseData, Lesson } from '../../../types';
import { StudentEnrollment } from '../../../types/bootcamp-types';
import SidebarWeekItem from './SidebarWeekItem';

interface SidebarCourseSectionProps {
  enrollment: StudentEnrollment;
  isActive: boolean;
  courseData: CourseData;
  currentLessonId: string;
  onSelectCourse: (courseId: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  onCloseMobile: () => void;
  completedItems: Set<string>;
  isToolbeltItem: (lessonId: string) => boolean;
  collapsedWeeks: Set<string>;
  onToggleWeek: (weekId: string) => void;
  cleanTitle: (title: string) => string;
  searchQuery?: string;
}

const SidebarCourseSection: React.FC<SidebarCourseSectionProps> = ({
  enrollment,
  isActive,
  courseData,
  currentLessonId,
  onSelectCourse,
  onSelectLesson,
  onCloseMobile,
  completedItems,
  isToolbeltItem,
  collapsedWeeks,
  onToggleWeek,
  cleanTitle,
  searchQuery = '',
}) => {
  const label = enrollment.cohort.sidebarLabel || enrollment.cohort.name;
  const icon = enrollment.cohort.icon;
  const courseWeeks = isActive ? courseData.weeks : [];

  // Filter weeks/lessons by search
  const filteredWeeks = courseWeeks
    .map((week) => {
      const coreLessons = week.lessons.filter(
        (l) => !isToolbeltItem(l.id) && !l.title.toUpperCase().startsWith('TASK:')
      );

      if (!searchQuery) return { week, coreLessons };

      const q = searchQuery.toLowerCase();
      const matchingLessons = coreLessons.filter((l) =>
        cleanTitle(l.title).toLowerCase().includes(q)
      );
      const weekMatches = week.title.toLowerCase().includes(q);

      return {
        week,
        coreLessons: weekMatches ? coreLessons : matchingLessons,
      };
    })
    .filter(({ coreLessons, week }) => {
      if (!searchQuery) return coreLessons.length > 0 || week.actionItems.length > 0;
      return coreLessons.length > 0;
    });

  return (
    <div>
      {/* Course header button */}
      <button
        onClick={() => onSelectCourse(enrollment.cohortId)}
        className={`flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs font-semibold transition-all ${
          isActive
            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
            : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        {icon ? (
          <span className="text-sm leading-none">{icon}</span>
        ) : (
          <BookOpen size={14} className={isActive ? 'text-violet-500' : 'text-zinc-400'} />
        )}
        <span className="truncate">{label}</span>
        {enrollment.onboardingCompletedAt && (
          <CheckCircle2 size={10} className="ml-auto text-green-500 shrink-0" />
        )}
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform ${isActive ? '' : '-rotate-90'} ${enrollment.onboardingCompletedAt ? '' : 'ml-auto'}`}
        />
      </button>

      {/* Inline curriculum */}
      {isActive && filteredWeeks.length > 0 && (
        <div className="mt-1.5 space-y-2 animate-slide-in">
          {filteredWeeks.map(({ week, coreLessons }) => {
            // Auto-expand weeks that match search
            const isSearchExpanded = searchQuery.length > 0;
            const expanded = isSearchExpanded || !collapsedWeeks.has(week.id);

            return (
              <SidebarWeekItem
                key={week.id}
                week={week}
                coreLessons={coreLessons}
                currentLessonId={currentLessonId}
                expanded={expanded}
                onToggle={() => onToggleWeek(week.id)}
                onSelectLesson={onSelectLesson}
                onCloseMobile={onCloseMobile}
                completedItems={completedItems}
                cleanTitle={cleanTitle}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarCourseSection;
