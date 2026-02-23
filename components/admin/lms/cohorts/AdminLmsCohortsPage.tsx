import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchAllLmsCohorts, fetchLmsWeeksByCohort } from '../../../../services/lms-supabase';
import { queryKeys } from '../../../../lib/queryClient';
import { useTheme } from '../../../../context/ThemeContext';
import {
  useCreateLmsCohortMutation,
  useUpdateLmsCohortMutation,
  useDeleteLmsCohortMutation,
  useDuplicateLmsCohortMutation,
} from '../../../../hooks/useLmsMutations';
import { LmsCohort, LmsCohortFormData } from '../../../../types/lms-types';
import LmsCohortModal from './LmsCohortModal';
import LmsDuplicateCohortModal from './LmsDuplicateCohortModal';
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Archive,
  CheckCircle,
  Copy,
  BookOpen,
  Calendar,
  FileEdit,
  Upload,
} from 'lucide-react';
import CsvImportModal from '../curriculum/CsvImportModal';

const AdminLmsCohortsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Draft' | 'Archived'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<LmsCohort | null>(null);
  const [deletingCohort, setDeletingCohort] = useState<LmsCohort | null>(null);
  const [duplicatingCohort, setDuplicatingCohort] = useState<LmsCohort | null>(null);
  const [importingCohort, setImportingCohort] = useState<LmsCohort | null>(null);
  const [importingWeekCount, setImportingWeekCount] = useState(0);

  // Queries
  const {
    data: cohorts,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.lmsCohorts(),
    queryFn: fetchAllLmsCohorts,
  });

  // Mutations
  const createMutation = useCreateLmsCohortMutation();
  const updateMutation = useUpdateLmsCohortMutation();
  const deleteMutation = useDeleteLmsCohortMutation();
  const duplicateMutation = useDuplicateLmsCohortMutation();

  // Filter cohorts
  const filteredCohorts = useMemo(() => {
    if (!cohorts) return [];

    return cohorts.filter((cohort) => {
      if (statusFilter !== 'All' && cohort.status !== statusFilter) return false;
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        cohort.name.toLowerCase().includes(searchLower) ||
        cohort.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [cohorts, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!cohorts) return { total: 0, active: 0, draft: 0, archived: 0 };
    return {
      total: cohorts.length,
      active: cohorts.filter((c) => c.status === 'Active').length,
      draft: cohorts.filter((c) => c.status === 'Draft').length,
      archived: cohorts.filter((c) => c.status === 'Archived').length,
    };
  }, [cohorts]);

  // Handlers
  const handleAddCohort = () => {
    setEditingCohort(null);
    setIsModalOpen(true);
  };

  const handleEditCohort = (cohort: LmsCohort) => {
    setEditingCohort(cohort);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: LmsCohortFormData) => {
    try {
      if (editingCohort) {
        await updateMutation.mutateAsync({ cohortId: editingCohort.id, updates: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingCohort(null);
    } catch (err) {
      console.error('Failed to save cohort:', err);
      window.alert(
        `Failed to save cohort: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleDeleteCohort = async () => {
    if (deletingCohort) {
      try {
        await deleteMutation.mutateAsync(deletingCohort.id);
        setDeletingCohort(null);
      } catch (err) {
        console.error('Failed to delete cohort:', err);
        window.alert(
          `Failed to delete cohort: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }
  };

  const handleToggleStatus = async (cohort: LmsCohort) => {
    try {
      const nextStatus = cohort.status === 'Active' ? 'Archived' : 'Active';
      await updateMutation.mutateAsync({
        cohortId: cohort.id,
        updates: { status: nextStatus },
      });
    } catch (err) {
      console.error('Failed to toggle status:', err);
      window.alert(
        `Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleDuplicate = async (newName: string, newDescription?: string) => {
    if (duplicatingCohort) {
      try {
        await duplicateMutation.mutateAsync({
          sourceCohortId: duplicatingCohort.id,
          newName,
          newDescription,
        });
        setDuplicatingCohort(null);
      } catch (err) {
        console.error('Failed to duplicate cohort:', err);
        window.alert(
          `Failed to duplicate cohort: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }
  };

  const handleManageCurriculum = (cohort: LmsCohort) => {
    navigate(`/admin/courses/curriculum/${cohort.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Courses</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Manage courses and cohorts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleAddCohort}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Cohort
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Cohorts', value: stats.total, color: 'violet' },
          { label: 'Active', value: stats.active, color: 'green' },
          { label: 'Draft', value: stats.draft, color: 'amber' },
          { label: 'Archived', value: stats.archived, color: 'slate' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1">
        {(['All', 'Active', 'Draft', 'Archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-violet-600 text-white'
                : isDarkMode
                  ? 'text-zinc-400 hover:bg-zinc-800'
                  : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search cohorts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
            isDarkMode
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
          } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
        />
      </div>

      {/* Cohorts Table */}
      {isLoading ? (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Loading cohorts...
          </p>
        </div>
      ) : (
        <div
          className={`rounded-xl border overflow-hidden ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <table className="w-full">
            <thead className={`text-xs uppercase ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left">Cohort</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Dates</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredCohorts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className={`px-4 py-8 text-center ${
                      isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    {searchQuery ? 'No cohorts match your search' : 'No cohorts yet'}
                  </td>
                </tr>
              ) : (
                filteredCohorts.map((cohort) => (
                  <tr
                    key={cohort.id}
                    className={`${isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {cohort.icon && <span className="text-lg">{cohort.icon}</span>}
                        <div>
                          <p className="font-medium">{cohort.name}</p>
                          {cohort.sidebarLabel && cohort.sidebarLabel !== cohort.name && (
                            <p
                              className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                            >
                              Sidebar: {cohort.sidebarLabel}
                            </p>
                          )}
                          <p
                            className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                          >
                            Created {cohort.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} line-clamp-2`}
                      >
                        {cohort.description || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {cohort.productType || 'course'}
                      </span>
                      {cohort.thrivecartProductId && (
                        <p
                          className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                        >
                          {cohort.thrivecartProductId}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cohort.startDate || cohort.endDate ? (
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                            {cohort.startDate?.toLocaleDateString() || '?'} -{' '}
                            {cohort.endDate?.toLocaleDateString() || '?'}
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                        >
                          No dates set
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          cohort.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : cohort.status === 'Draft'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {cohort.status === 'Active' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : cohort.status === 'Draft' ? (
                          <FileEdit className="w-3 h-3" />
                        ) : (
                          <Archive className="w-3 h-3" />
                        )}
                        {cohort.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={async () => {
                            const weeks = await fetchLmsWeeksByCohort(cohort.id);
                            setImportingWeekCount(weeks.length);
                            setImportingCohort(cohort);
                          }}
                          className={`p-2 rounded-lg ${
                            isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
                          }`}
                          title="Import CSV"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleManageCurriculum(cohort)}
                          className={`p-2 rounded-lg text-violet-500 ${
                            isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
                          }`}
                          title="Manage Curriculum"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDuplicatingCohort(cohort)}
                          className={`p-2 rounded-lg ${
                            isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
                          }`}
                          title="Duplicate Cohort"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(cohort)}
                          className={`p-2 rounded-lg ${
                            isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
                          }`}
                          title={cohort.status === 'Active' ? 'Archive' : 'Activate'}
                        >
                          {cohort.status === 'Active' ? (
                            <Archive className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditCohort(cohort)}
                          className={`p-2 rounded-lg ${
                            isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCohort(cohort)}
                          className={`p-2 rounded-lg text-red-500 ${
                            isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cohort Modal */}
      <LmsCohortModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCohort(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingCohort}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Duplicate Cohort Modal */}
      <LmsDuplicateCohortModal
        isOpen={!!duplicatingCohort}
        onClose={() => setDuplicatingCohort(null)}
        onSubmit={handleDuplicate}
        sourceCohort={duplicatingCohort}
        isLoading={duplicateMutation.isPending}
      />

      {/* CSV Import Modal */}
      {importingCohort && (
        <CsvImportModal
          isOpen={!!importingCohort}
          onClose={() => setImportingCohort(null)}
          cohortId={importingCohort.id}
          existingWeekCount={importingWeekCount}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCohort && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-xl ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
          >
            <h3 className="text-lg font-semibold mb-2">Delete Cohort</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Are you sure you want to delete "{deletingCohort.name}"? This will permanently delete
              all weeks, lessons, content items, and action items associated with this cohort. This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingCohort(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCohort}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLmsCohortsPage;
