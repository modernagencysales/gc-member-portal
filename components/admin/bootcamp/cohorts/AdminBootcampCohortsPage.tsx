import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllCohorts, fetchCohortStudentCounts } from '../../../../services/bootcamp-supabase';
import { queryKeys } from '../../../../lib/queryClient';
import { useTheme } from '../../../../context/ThemeContext';
import {
  useCreateCohortMutation,
  useUpdateCohortMutation,
  useDeleteCohortMutation,
} from '../../../../hooks/useBootcampAdminMutations';
import { BootcampCohort } from '../../../../types/bootcamp-types';
import CohortModal from './CohortModal';
import { Plus, Search, RefreshCw, Users, Edit2, Trash2, Archive, CheckCircle } from 'lucide-react';

const AdminBootcampCohortsPage: React.FC = () => {
  const { isDarkMode } = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<BootcampCohort | null>(null);
  const [deletingCohort, setDeletingCohort] = useState<BootcampCohort | null>(null);

  // Queries
  const {
    data: cohorts,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bootcampCohorts(),
    queryFn: fetchAllCohorts,
  });

  const { data: studentCounts } = useQuery({
    queryKey: queryKeys.bootcampCohortStudentCounts(),
    queryFn: fetchCohortStudentCounts,
  });

  // Mutations
  const createMutation = useCreateCohortMutation();
  const updateMutation = useUpdateCohortMutation();
  const deleteMutation = useDeleteCohortMutation();

  // Filter cohorts
  const filteredCohorts = useMemo(() => {
    if (!cohorts) return [];

    return cohorts.filter((cohort) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        cohort.name.toLowerCase().includes(searchLower) ||
        cohort.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [cohorts, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!cohorts) return { total: 0, active: 0, archived: 0 };
    return {
      total: cohorts.length,
      active: cohorts.filter((c) => c.status === 'Active').length,
      archived: cohorts.filter((c) => c.status === 'Archived').length,
    };
  }, [cohorts]);

  // Handlers
  const handleAddCohort = () => {
    setEditingCohort(null);
    setIsModalOpen(true);
  };

  const handleEditCohort = (cohort: BootcampCohort) => {
    setEditingCohort(cohort);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<BootcampCohort>) => {
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

  const handleToggleStatus = async (cohort: BootcampCohort) => {
    try {
      await updateMutation.mutateAsync({
        cohortId: cohort.id,
        updates: { status: cohort.status === 'Active' ? 'Archived' : 'Active' },
      });
    } catch (err) {
      console.error('Failed to toggle status:', err);
      window.alert(
        `Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Cohorts</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Manage bootcamp cohorts for student organization
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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Cohorts', value: stats.total, color: 'blue' },
          { label: 'Active', value: stats.active, color: 'green' },
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
                <th className="px-4 py-3 text-center">Students</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredCohorts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
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
                      <p className="font-medium">{cohort.name}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Created {cohort.createdAt.toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {cohort.description || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-zinc-400" />
                        <span className="font-medium">{studentCounts?.[cohort.name] || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          cohort.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {cohort.status === 'Active' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Archive className="w-3 h-3" />
                        )}
                        {cohort.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
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
                            <CheckCircle className="w-4 h-4" />
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
      <CohortModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCohort(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingCohort}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deletingCohort && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-xl ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
          >
            <h3 className="text-lg font-semibold mb-2">Delete Cohort</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Are you sure you want to delete "{deletingCohort.name}"? This will also delete all
              associated invite codes. Students in this cohort will not be affected.
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

export default AdminBootcampCohortsPage;
