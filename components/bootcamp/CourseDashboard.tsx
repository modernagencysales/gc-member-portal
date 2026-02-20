import React from 'react';
import { StudentEnrollment } from '../../types/bootcamp-types';
import { BookOpen, ArrowRight, Clock, GraduationCap } from 'lucide-react';

// Gradient presets for course cards
const CARD_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
];

interface CourseDashboardProps {
  enrollments: StudentEnrollment[];
  onSelectCourse: (courseId: string) => void;
  completedLessons?: Set<string>;
  userName?: string;
}

const CourseDashboard: React.FC<CourseDashboardProps> = ({
  enrollments,
  onSelectCourse,
  userName,
}) => {
  const courseEnrollments = enrollments.filter((e) => e.role !== 'resources');
  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome header */}
      <div className="mb-10">
        <h1 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
          <GraduationCap size={14} />
          {courseEnrollments.length} course{courseEnrollments.length !== 1 ? 's' : ''} enrolled
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courseEnrollments.map((enrollment, idx) => {
          const cohort = enrollment.cohort;
          const label = cohort.sidebarLabel || cohort.name;
          const needsOnboarding =
            cohort.onboardingConfig?.enabled && !enrollment.onboardingCompletedAt;
          const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];

          return (
            <button
              key={enrollment.cohortId}
              onClick={() => onSelectCourse(enrollment.cohortId)}
              className="text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:-translate-y-0.5 transition-all group overflow-hidden"
            >
              {/* Gradient header */}
              <div
                className={`bg-gradient-to-br ${gradient} px-6 py-5 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  {cohort.icon ? (
                    <span className="text-3xl drop-shadow-sm">{cohort.icon}</span>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <BookOpen size={20} className="text-white" />
                    </div>
                  )}
                  <h3 className="font-semibold text-white text-lg">{label}</h3>
                </div>
                <ArrowRight
                  size={18}
                  className="text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                />
              </div>

              {/* Card body */}
              <div className="px-6 py-4">
                {cohort.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">
                    {cohort.description}
                  </p>
                )}

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
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CourseDashboard;
