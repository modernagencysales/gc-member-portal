import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllInviteCodes, fetchActiveCohorts } from '../../../../services/bootcamp-supabase';
import { queryKeys } from '../../../../lib/queryClient';
import { useTheme } from '../../../../context/ThemeContext';
import {
  useCreateInviteCodeMutation,
  useUpdateInviteCodeMutation,
  useDeleteInviteCodeMutation,
} from '../../../../hooks/useBootcampAdminMutations';
import { BootcampInviteCode } from '../../../../types/bootcamp-types';
import GenerateCodeModal from './GenerateCodeModal';
import {
  Plus,
  Search,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Link as LinkIcon,
  Clock,
  Users,
  Filter,
} from 'lucide-react';

const AdminBootcampInviteCodesPage: React.FC = () => {
  const { isDarkMode } = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<BootcampInviteCode | null>(null);

  // Queries
  const {
    data: inviteCodes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bootcampInviteCodes(),
    queryFn: fetchAllInviteCodes,
  });

  const { data: cohorts } = useQuery({
    queryKey: queryKeys.bootcampActiveCohorts(),
    queryFn: fetchActiveCohorts,
  });

  // Mutations
  const createMutation = useCreateInviteCodeMutation();
  const updateMutation = useUpdateInviteCodeMutation();
  const deleteMutation = useDeleteInviteCodeMutation();

  // Filter invite codes
  const filteredCodes = useMemo(() => {
    if (!inviteCodes) return [];

    return inviteCodes.filter((code) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        code.code.toLowerCase().includes(searchLower) ||
        code.cohortName?.toLowerCase().includes(searchLower);

      const matchesCohort = cohortFilter === 'all' || code.cohortId === cohortFilter;

      return matchesSearch && matchesCohort;
    });
  }, [inviteCodes, searchQuery, cohortFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!inviteCodes) return { total: 0, active: 0, disabled: 0, totalUses: 0 };
    return {
      total: inviteCodes.length,
      active: inviteCodes.filter((c) => c.status === 'Active').length,
      disabled: inviteCodes.filter((c) => c.status === 'Disabled').length,
      totalUses: inviteCodes.reduce((sum, c) => sum + c.useCount, 0),
    };
  }, [inviteCodes]);

  // Handlers
  const handleGenerateCodes = () => {
    setIsModalOpen(true);
  };

  const handleCreateCodes = async (
    cohortId: string,
    count: number,
    options?: { maxUses?: number; expiresAt?: Date }
  ) => {
    for (let i = 0; i < count; i++) {
      await createMutation.mutateAsync({ cohortId, options });
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = async (code: BootcampInviteCode) => {
    await updateMutation.mutateAsync({
      codeId: code.id,
      updates: { status: code.status === 'Active' ? 'Disabled' : 'Active' },
    });
  };

  const handleDeleteCode = async () => {
    if (deletingCode) {
      await deleteMutation.mutateAsync(deletingCode.id);
      setDeletingCode(null);
    }
  };

  const handleCopyLink = (code: BootcampInviteCode) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/bootcamp/register?code=${code.code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(code.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCode = (code: BootcampInviteCode) => {
    navigator.clipboard.writeText(code.code);
    setCopiedId(code.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (code: BootcampInviteCode) => {
    return code.expiresAt && new Date() > code.expiresAt;
  };

  const isMaxedOut = (code: BootcampInviteCode) => {
    return code.maxUses !== null && code.maxUses !== undefined && code.useCount >= code.maxUses;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Invite Codes</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Generate and manage registration invite codes
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
            onClick={handleGenerateCodes}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Generate Codes
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Codes', value: stats.total, color: 'blue' },
          { label: 'Active', value: stats.active, color: 'green' },
          { label: 'Disabled', value: stats.disabled, color: 'slate' },
          { label: 'Total Uses', value: stats.totalUses, color: 'violet' },
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
            placeholder="Search by code or cohort..."
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
            value={cohortFilter}
            onChange={(e) => setCohortFilter(e.target.value)}
            className={`px-4 py-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Cohorts</option>
            {cohorts?.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invite Codes Table */}
      {isLoading ? (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Loading invite codes...
          </p>
        </div>
      ) : (
        <div
          className={`rounded-xl border overflow-hidden ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <table className="w-full">
            <thead className={`text-xs uppercase ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Cohort</th>
                <th className="px-4 py-3 text-center">Uses</th>
                <th className="px-4 py-3 text-center">Expires</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className={`px-4 py-8 text-center ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {searchQuery || cohortFilter !== 'all'
                      ? 'No codes match your filters'
                      : 'No invite codes yet'}
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr
                    key={code.id}
                    className={`${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code
                          className={`px-2 py-1 rounded text-sm font-mono ${
                            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                          }`}
                        >
                          {code.code}
                        </code>
                        <button
                          onClick={() => handleCopyCode(code)}
                          className={`p-1 rounded ${
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                          }`}
                          title="Copy code"
                        >
                          {copiedId === code.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">{code.cohortName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-sm font-medium ${isMaxedOut(code) ? 'text-red-500' : ''}`}
                      >
                        {code.useCount}
                        {code.maxUses !== null && code.maxUses !== undefined
                          ? ` / ${code.maxUses}`
                          : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {code.expiresAt ? (
                        <span
                          className={`flex items-center justify-center gap-1 text-sm ${
                            isExpired(code) ? 'text-red-500' : ''
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          {code.expiresAt.toLocaleDateString()}
                        </span>
                      ) : (
                        <span
                          className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                        >
                          Never
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          code.status === 'Active' && !isExpired(code) && !isMaxedOut(code)
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {isExpired(code) ? 'Expired' : isMaxedOut(code) ? 'Maxed Out' : code.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopyLink(code)}
                          className={`p-2 rounded-lg ${
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                          }`}
                          title="Copy registration link"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(code)}
                          className={`p-2 rounded-lg ${
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                          }`}
                          title={code.status === 'Active' ? 'Disable' : 'Enable'}
                        >
                          {code.status === 'Active' ? (
                            <ToggleRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeletingCode(code)}
                          className={`p-2 rounded-lg text-red-500 ${
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
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

      {/* Generate Codes Modal */}
      <GenerateCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleCreateCodes}
        cohorts={cohorts || []}
        isLoading={createMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deletingCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
          >
            <h3 className="text-lg font-semibold mb-2">Delete Invite Code</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Are you sure you want to delete the invite code "{deletingCode.code}"?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingCode(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCode}
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

export default AdminBootcampInviteCodesPage;
