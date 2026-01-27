import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../../context/ThemeContext';
import { fetchStudentsWithProgress } from '../../../../services/bootcamp-supabase';
import { BootcampStudent, BootcampStudentSurvey } from '../../../../types/bootcamp-types';
import StudentSurveyModal from '../students/StudentSurveyModal';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Building2,
  Target,
  Users,
  Download,
} from 'lucide-react';

type SortField = 'name' | 'company' | 'industry' | 'completedAt';
type SortDirection = 'asc' | 'desc';

const AdminSurveyResponsesPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('completedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedSurvey, setSelectedSurvey] = useState<{
    survey: BootcampStudentSurvey;
    studentName: string;
  } | null>(null);

  const { data: studentsWithProgress, isLoading } = useQuery({
    queryKey: ['students-with-progress'],
    queryFn: fetchStudentsWithProgress,
  });

  // Filter to only students with completed surveys
  const studentsWithSurveys = (studentsWithProgress || []).filter(
    (s): s is BootcampStudent & { onboardingProgress: number; survey: BootcampStudentSurvey } =>
      s.survey?.completedAt !== undefined
  );

  // Search filter
  const filteredStudents = studentsWithSurveys.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.survey.companyName?.toLowerCase().includes(searchLower) ||
      student.survey.industry?.toLowerCase().includes(searchLower)
    );
  });

  // Sort
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aVal: string | Date | undefined;
    let bVal: string | Date | undefined;

    switch (sortField) {
      case 'name':
        aVal = a.name || a.email;
        bVal = b.name || b.email;
        break;
      case 'company':
        aVal = a.survey.companyName;
        bVal = b.survey.companyName;
        break;
      case 'industry':
        aVal = a.survey.industry;
        bVal = b.survey.industry;
        break;
      case 'completedAt':
        aVal = a.survey.completedAt;
        bVal = b.survey.completedAt;
        break;
    }

    if (!aVal && !bVal) return 0;
    if (!aVal) return 1;
    if (!bVal) return -1;

    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDirection === 'asc'
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }

    const comparison = String(aVal).localeCompare(String(bVal));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Company',
      'Website',
      'Industry',
      'Company Size',
      'Role',
      'Primary Goal',
      'LinkedIn Experience',
      'Target Audience',
      'Monthly Outreach',
      'Biggest Challenges',
      'Lead Gen Methods',
      'Tools Using',
      'Completed At',
    ];

    const rows = sortedStudents.map((s) => [
      s.name || '',
      s.email,
      s.survey.companyName || '',
      s.survey.website || '',
      s.survey.industry || '',
      s.survey.companySize || '',
      s.survey.roleTitle || '',
      s.survey.primaryGoal || '',
      s.survey.linkedinExperience || '',
      s.survey.targetAudience || '',
      s.survey.monthlyOutreachVolume || '',
      (s.survey.biggestChallenges || []).join('; '),
      (s.survey.currentLeadGenMethods || []).join('; '),
      (s.survey.toolsCurrentlyUsing || []).join('; '),
      s.survey.completedAt ? new Date(s.survey.completedAt).toLocaleDateString() : '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // eslint-disable-next-line no-undef
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `survey-responses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Survey Responses</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {studentsWithSurveys.length} completed surveys
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
            isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
          }`}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, company, or industry..."
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Users className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Total Responses
              </p>
              <p className="text-2xl font-bold">{studentsWithSurveys.length}</p>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
              <Building2
                className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
              />
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Unique Companies
              </p>
              <p className="text-2xl font-bold">
                {new Set(studentsWithSurveys.map((s) => s.survey.companyName).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
              <Target className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Industries
              </p>
              <p className="text-2xl font-bold">
                {new Set(studentsWithSurveys.map((s) => s.survey.industry).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-lg border overflow-hidden ${
          isDarkMode ? 'border-slate-700' : 'border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}>
                <th
                  onClick={() => handleSort('name')}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    Name
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('company')}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    Company
                    <SortIcon field="company" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('industry')}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    Industry
                    <SortIcon field="industry" />
                  </div>
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Experience
                </th>
                <th
                  onClick={() => handleSort('completedAt')}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    Completed
                    <SortIcon field="completedAt" />
                  </div>
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={isDarkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}
            >
              {sortedStudents.map((student) => (
                <tr
                  key={student.id}
                  className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{student.name || 'No name'}</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {student.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{student.survey.companyName || '-'}</p>
                      {student.survey.companySize && (
                        <p
                          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                        >
                          {student.survey.companySize} employees
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {student.survey.industry || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        student.survey.linkedinExperience === 'Advanced'
                          ? isDarkMode
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-green-100 text-green-700'
                          : student.survey.linkedinExperience === 'Intermediate'
                            ? isDarkMode
                              ? 'bg-blue-900/30 text-blue-400'
                              : 'bg-blue-100 text-blue-700'
                            : isDarkMode
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {student.survey.linkedinExperience || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {student.survey.completedAt
                        ? new Date(student.survey.completedAt).toLocaleDateString()
                        : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        setSelectedSurvey({
                          survey: student.survey,
                          studentName: student.name || student.email,
                        })
                      }
                      className={`p-2 rounded-lg ${
                        isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                      }`}
                      title="View full survey"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedStudents.length === 0 && (
          <div className="p-8 text-center">
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
              {searchTerm ? 'No surveys match your search' : 'No completed surveys yet'}
            </p>
          </div>
        )}
      </div>

      {/* Survey Modal */}
      <StudentSurveyModal
        isOpen={selectedSurvey !== null}
        onClose={() => setSelectedSurvey(null)}
        survey={selectedSurvey?.survey || null}
        studentName={selectedSurvey?.studentName}
      />
    </div>
  );
};

export default AdminSurveyResponsesPage;
