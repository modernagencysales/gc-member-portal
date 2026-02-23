import React from 'react';
import {
  Check,
  X,
  MessageSquare,
  Calendar,
  Eye,
  Pencil,
  ClipboardList,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { BootcampStudent, BootcampStudentSurvey } from '../../../../types/bootcamp-types';
import { useTheme } from '../../../../context/ThemeContext';
import { getStatusColor, STATUS_COLORS } from '../../../../types/gc-types';

interface StudentWithProgress extends BootcampStudent {
  onboardingProgress: number;
  survey: BootcampStudentSurvey | null;
}

export interface StudentEnrollment {
  cohortId: string;
  cohortName: string;
  accessLevel?: string;
}

interface StudentTableProps {
  students: StudentWithProgress[];
  selectedIds: Set<string>;
  enrollments: Map<string, StudentEnrollment[]>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onMarkSlackDone: (student: BootcampStudent) => void;
  onMarkCalendarDone: (student: BootcampStudent) => void;
  onViewProgress: (student: BootcampStudent) => void;
  onViewSurvey: (student: StudentWithProgress) => void;
  onEdit: (student: BootcampStudent) => void;
  onGenerateBlueprint: (student: BootcampStudent) => void;
  isSlackLoading?: string;
  isCalendarLoading?: string;
}

const StudentTable: React.FC<StudentTableProps> = ({
  students,
  selectedIds,
  enrollments,
  onToggleSelect,
  onSelectAll,
  onMarkSlackDone,
  onMarkCalendarDone,
  onViewProgress,
  onViewSurvey,
  onEdit,
  onGenerateBlueprint,
  isSlackLoading,
  isCalendarLoading,
}) => {
  const { isDarkMode } = useTheme();
  const allSelected = students.length > 0 && selectedIds.size === students.length;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={`border-b ${
                isDarkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Courses
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Onboarding
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Survey
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Slack
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Calendar
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Blueprint
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-200'}`}>
            {students.map((student) => {
              const statusColor = getStatusColor(student.status);
              const colors = STATUS_COLORS[statusColor];

              return (
                <tr
                  key={student.id}
                  className={`${isDarkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => onToggleSelect(student.id)}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                  </td>

                  {/* Student Info */}
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {student.name || 'No name'}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {student.email}
                      </div>
                    </div>
                  </td>

                  {/* Courses */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(enrollments.get(student.id) || []).length > 0 ? (
                        enrollments.get(student.id)!.map((e) => (
                          <span
                            key={e.cohortId}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                            title={e.accessLevel || 'Full Access'}
                          >
                            {e.cohortName}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-zinc-400 italic">None</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}
                    >
                      {student.status}
                    </span>
                  </td>

                  {/* Onboarding Progress */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.onboardingProgress === 100 ? 'bg-green-500' : 'bg-violet-500'
                          }`}
                          style={{ width: `${student.onboardingProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {student.onboardingProgress}%
                      </span>
                    </div>
                  </td>

                  {/* Survey */}
                  <td className="px-4 py-3 text-center">
                    {student.survey?.completedAt ? (
                      <button
                        onClick={() => onViewSurvey(student)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                      >
                        <ClipboardList className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                        <X className="w-4 h-4" />
                      </span>
                    )}
                  </td>

                  {/* Slack */}
                  <td className="px-4 py-3 text-center">
                    {student.slackInvited ? (
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        title="Slack invite sent"
                      >
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <button
                        onClick={() => onMarkSlackDone(student)}
                        disabled={isSlackLoading === student.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50"
                        title="Mark Slack invite as sent"
                      >
                        {isSlackLoading === student.id ? (
                          <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </td>

                  {/* Calendar */}
                  <td className="px-4 py-3 text-center">
                    {student.calendarAdded ? (
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        title="Added to calendar"
                      >
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <button
                        onClick={() => onMarkCalendarDone(student)}
                        disabled={isCalendarLoading === student.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-50"
                        title="Mark as added to calendar"
                      >
                        {isCalendarLoading === student.id ? (
                          <div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </td>

                  {/* Blueprint */}
                  <td className="px-4 py-3 text-center">
                    {student.prospectId ? (
                      <a
                        href={`/blueprint/${student.prospectId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                        title="View Blueprint"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        onClick={() => onGenerateBlueprint(student)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                        title="Generate Blueprint"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewProgress(student)}
                        className={`p-2 rounded-lg ${
                          isDarkMode
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                        }`}
                        title="View Progress"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(student)}
                        className={`p-2 rounded-lg ${
                          isDarkMode
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                        }`}
                        title="Edit Student"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {students.length === 0 && (
        <div className="p-8 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            No students found
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentTable;
