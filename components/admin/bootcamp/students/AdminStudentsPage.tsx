import React, { useState, useMemo, useCallback, memo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStudentsWithProgress } from '../../../../services/bootcamp-supabase';
import {
  fetchAllStudentEnrollments,
  enrollStudentInCohort,
  unenrollStudentFromCohort,
} from '../../../../services/lms-supabase';
import { queryKeys } from '../../../../lib/queryClient';
import { useTheme } from '../../../../context/ThemeContext';
import {
  useCreateBootcampStudentMutation,
  useUpdateBootcampStudentMutation,
  useMarkSlackInvitedMutation,
  useMarkCalendarAddedMutation,
} from '../../../../hooks/useBootcampAdminMutations';
import { BootcampStudent, BootcampStudentSurvey } from '../../../../types/bootcamp-types';
import StudentTable from './StudentTable';
import StudentModal from './StudentModal';
import StudentSurveyModal from './StudentSurveyModal';
import GenerateBlueprintModal from './GenerateBlueprintModal';
import { Plus, Search, Filter, RefreshCw, Upload } from 'lucide-react';
import StudentCsvImportModal from './StudentCsvImportModal';

interface StudentWithProgress extends BootcampStudent {
  onboardingProgress: number;
  survey: BootcampStudentSurvey | null;
}

const AdminStudentsPage: React.FC = () => {
  const { isDarkMode } = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<BootcampStudent | null>(null);
  const [surveyStudent, setSurveyStudent] = useState<StudentWithProgress | null>(null);
  const [slackLoadingId, setSlackLoadingId] = useState<string | undefined>();
  const [calendarLoadingId, setCalendarLoadingId] = useState<string | undefined>();
  const [blueprintStudent, setBlueprintStudent] = useState<BootcampStudent | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);

  const queryClient = useQueryClient();

  // Queries
  const {
    data: students,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bootcampAdminStudents(),
    queryFn: fetchStudentsWithProgress,
  });

  const { data: enrollments = new Map() } = useQuery({
    queryKey: ['studentEnrollments'],
    queryFn: fetchAllStudentEnrollments,
  });

  // Mutations
  const createMutation = useCreateBootcampStudentMutation();
  const updateMutation = useUpdateBootcampStudentMutation();
  const slackMutation = useMarkSlackInvitedMutation();
  const calendarMutation = useMarkCalendarAddedMutation();

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!students) return [];

    return students.filter((student) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        student.email.toLowerCase().includes(searchLower) ||
        student.name?.toLowerCase().includes(searchLower) ||
        student.company?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!students) return { total: 0, onboarding: 0, active: 0, completed: 0 };
    return {
      total: students.length,
      onboarding: students.filter((s) => s.status === 'Onboarding').length,
      active: students.filter((s) => s.status === 'Active').length,
      completed: students.filter((s) => s.status === 'Completed').length,
    };
  }, [students]);

  // Handlers
  const handleAddStudent = useCallback(() => {
    setEditingStudent(null);
    setIsModalOpen(true);
  }, []);

  const handleEditStudent = useCallback((student: BootcampStudent) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (data: Partial<BootcampStudent>, selectedCohortIds: string[]) => {
      let studentId: string;

      try {
        if (editingStudent) {
          await updateMutation.mutateAsync({ studentId: editingStudent.id, updates: data });
          studentId = editingStudent.id;
        } else {
          const created = await createMutation.mutateAsync(data);
          studentId = (created as { id: string }).id;
        }
      } catch (err) {
        console.error('Failed to save student:', err);
        window.alert(
          `Failed to save student: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        return;
      }

      // Sync enrollments
      try {
        const currentEnrollments = enrollments.get(studentId) || [];
        const currentCohortIds = currentEnrollments.map((e: { cohortId: string }) => e.cohortId);
        const currentSet = new Set(currentCohortIds);
        const desiredSet = new Set(selectedCohortIds);

        // Enroll in newly selected cohorts
        for (const cohortId of selectedCohortIds) {
          if (!currentSet.has(cohortId)) {
            await enrollStudentInCohort(studentId, cohortId);
          }
        }

        // Unenroll from deselected cohorts
        for (const cohortId of currentCohortIds) {
          if (!desiredSet.has(cohortId)) {
            await unenrollStudentFromCohort(studentId, cohortId);
          }
        }
      } catch (err) {
        console.error('Failed to sync enrollments:', err);
        window.alert(
          `Student saved but enrollment failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }

      queryClient.invalidateQueries({ queryKey: ['studentEnrollments'] });
      setIsModalOpen(false);
      setEditingStudent(null);
    },
    [editingStudent, updateMutation, createMutation, enrollments, queryClient]
  );

  const handleMarkSlackDone = useCallback(
    async (student: BootcampStudent) => {
      setSlackLoadingId(student.id);
      try {
        await slackMutation.mutateAsync(student.id);
      } catch (error) {
        console.error('Mark Slack done failed:', error);
      } finally {
        setSlackLoadingId(undefined);
      }
    },
    [slackMutation]
  );

  const handleMarkCalendarDone = useCallback(
    async (student: BootcampStudent) => {
      setCalendarLoadingId(student.id);
      try {
        await calendarMutation.mutateAsync(student.id);
      } catch (error) {
        console.error('Mark calendar done failed:', error);
      } finally {
        setCalendarLoadingId(undefined);
      }
    },
    [calendarMutation]
  );

  const handleViewProgress = useCallback((student: BootcampStudent) => {
    // Could open a progress modal or navigate to a detail page
    console.log('View progress for:', student.id);
  }, []);

  const handleViewSurvey = useCallback((student: StudentWithProgress) => {
    setSurveyStudent(student);
  }, []);

  const handleGenerateBlueprint = useCallback((student: BootcampStudent) => {
    setBlueprintStudent(student);
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredStudents.length) {
        return new Set();
      } else {
        return new Set(filteredStudents.map((s) => s.id));
      }
    });
  }, [filteredStudents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Student Roster</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage bootcamp students and track onboarding progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCsvImport(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
              isDarkMode
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'border-slate-300 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={handleAddStudent}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.total, color: 'blue' },
          { label: 'Onboarding', value: stats.onboarding, color: 'yellow' },
          { label: 'Active', value: stats.active, color: 'green' },
          { label: 'Completed', value: stats.completed, color: 'slate' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Paused">Paused</option>
            <option value="Churned">Churned</option>
          </select>
        </div>
      </div>

      {/* Selection Info */}
      {selectedIds.size > 0 && (
        <div
          className={`flex items-center gap-4 p-4 rounded-xl border ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200'
          }`}
        >
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Loading students...
          </p>
        </div>
      ) : (
        <StudentTable
          students={filteredStudents}
          selectedIds={selectedIds}
          enrollments={enrollments}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onMarkSlackDone={handleMarkSlackDone}
          onMarkCalendarDone={handleMarkCalendarDone}
          onViewProgress={handleViewProgress}
          onViewSurvey={handleViewSurvey}
          onEdit={handleEditStudent}
          onGenerateBlueprint={handleGenerateBlueprint}
          isSlackLoading={slackLoadingId}
          isCalendarLoading={calendarLoadingId}
        />
      )}

      {/* Modals */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingStudent}
        isLoading={createMutation.isPending || updateMutation.isPending}
        initialEnrolledCohortIds={
          editingStudent
            ? (enrollments.get(editingStudent.id) || []).map(
                (e: { cohortId: string }) => e.cohortId
              )
            : []
        }
      />

      <StudentSurveyModal
        isOpen={!!surveyStudent}
        onClose={() => setSurveyStudent(null)}
        survey={surveyStudent?.survey || null}
        studentName={surveyStudent?.name}
      />

      <GenerateBlueprintModal
        isOpen={!!blueprintStudent}
        onClose={() => setBlueprintStudent(null)}
        studentName={blueprintStudent?.name}
        studentEmail={blueprintStudent?.email || ''}
      />

      <StudentCsvImportModal isOpen={showCsvImport} onClose={() => setShowCsvImport(false)} />
    </div>
  );
};

export default memo(AdminStudentsPage);
