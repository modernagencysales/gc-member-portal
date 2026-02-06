import React from 'react';
import { StudentEnrollment } from '../../types/bootcamp-types';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';

interface CourseDashboardProps {
  enrollments: StudentEnrollment[];
  onSelectCourse: (courseId: string) => void;
  completedLessons?: Set<string>;
}

const CourseDashboard: React.FC<CourseDashboardProps> = ({
  enrollments,
  onSelectCourse,
  completedLessons = new Set(),
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Courses</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrollments.map((enrollment) => {
          const cohort = enrollment.cohort;
          const label = cohort.sidebarLabel || cohort.name;
          const needsOnboarding =
            cohort.onboardingConfig?.enabled && !enrollment.onboardingCompletedAt;

          return (
            <button
              key={enrollment.cohortId}
              onClick={() => onSelectCourse(enrollment.cohortId)}
              className="text-left p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {cohort.icon ? (
                    <span className="text-2xl">{cohort.icon}</span>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <BookOpen size={20} className="text-violet-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>
                    {cohort.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                        {cohort.description}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-zinc-300 dark:text-zinc-600 group-hover:text-violet-500 transition-colors mt-1"
                />
              </div>

              {needsOnboarding ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <Clock size={14} className="text-amber-500" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Complete onboarding to get started
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Enrolled {enrollment.joinedAt.toLocaleDateString()}</span>
                  {enrollment.accessLevel && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
                      <span>{enrollment.accessLevel}</span>
                    </>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CourseDashboard;
