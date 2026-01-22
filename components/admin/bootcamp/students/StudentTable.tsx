import React from 'react';
import { Check, X, MessageSquare, Calendar, Eye, Pencil, ClipboardList } from 'lucide-react';
import { BootcampStudent, BootcampStudentSurvey } from '../../../../types/bootcamp-types';
import { useTheme } from '../../../../context/ThemeContext';
import { getStatusColor, STATUS_COLORS } from '../../../../types/gc-types';

interface StudentWithProgress extends BootcampStudent {
  onboardingProgress: number;
  survey: BootcampStudentSurvey | null;
}

interface StudentTableProps {
  students: StudentWithProgress[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onMarkSlackDone: (student: BootcampStudent) => void;
  onMarkCalendarDone: (student: BootcampStudent) => void;
  onViewProgress: (student: BootcampStudent) => void;
  onViewSurvey: (student: StudentWithProgress) => void;
  onEdit: (student: BootcampStudent) => void;
  isSlackLoading?: string;
  isCalendarLoading?: string;
}

const StudentTable: React.FC<StudentTableProps> = ({
  students,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onMarkSlackDone,
  onMarkCalendarDone,
  onViewProgress,
  onViewSurvey,
  onEdit,
  isSlackLoading,
  isCalendarLoading,
}) => {
  const { isDarkMode } = useTheme();
  const allSelected = students.length > 0 && selectedIds.size === students.length;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={`border-b ${
                isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                Cohort
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                Onboarding
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                Survey
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                Slack
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                Calendar
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
            {students.map((student) => {
              const statusColor = getStatusColor(student.status);
              const colors = STATUS_COLORS[statusColor];

              return (
                <tr
                  key={student.id}
                  className={`${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => onToggleSelect(student.id)}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </td>

                  {/* Student Info */}
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {student.name || 'No name'}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {student.email}
                      </div>
                    </div>
                  </td>

                  {/* Cohort */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {student.cohort}
                    </span>
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
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.onboardingProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${student.onboardingProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
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
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
                        title="Mark as added to calendar"
                      >
                        {isCalendarLoading === student.id ? (
                          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
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
                            ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                        title="View Progress"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(student)}
                        className={`p-2 rounded-lg ${
                          isDarkMode
                            ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
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
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            No students found
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentTable;
