import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Search, Eye, ExternalLink, Archive } from 'lucide-react';
import { listProposals, deleteProposal } from '../../../services/proposal-supabase';
import { queryKeys } from '../../../lib/queryClient';
import type { Proposal } from '../../../types/proposal-types';

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    archived: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.draft}`}
    >
      {status}
    </span>
  );
}

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

const AdminProposalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const {
    data: proposals,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.proposalsList(),
    queryFn: listProposals,
  });

  const filteredProposals = useMemo(() => {
    if (!proposals) return [];
    return proposals.filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.clientName.toLowerCase().includes(searchLower) ||
        p.clientCompany.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [proposals, search, statusFilter]);

  const handleArchive = async (e: React.MouseEvent, proposal: Proposal) => {
    e.stopPropagation();
    if (!window.confirm(`Archive proposal for ${proposal.clientName}?`)) return;
    await deleteProposal(proposal.id);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Proposals</h2>
          <p className="text-sm mt-1 text-zinc-500 dark:text-zinc-400">Manage client proposals</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/admin/proposals/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Proposal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by client name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm mt-2 text-zinc-500 dark:text-zinc-400">Loading proposals...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No proposals yet</p>
          <button
            onClick={() => navigate('/admin/proposals/new')}
            className="mt-3 text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            Create your first proposal
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Client</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Created</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Views</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProposals.map((proposal) => (
                <tr
                  key={proposal.id}
                  onClick={() => navigate(`/admin/proposals/${proposal.id}`)}
                  className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{proposal.clientName}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {proposal.clientCompany}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={proposal.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {relativeDate(proposal.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {proposal.viewCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {proposal.status === 'published' && (
                        <a
                          href={`/proposal/${proposal.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          title="View published proposal"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/proposals/${proposal.id}`);
                        }}
                        className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        title="Edit proposal"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {proposal.status !== 'archived' && (
                        <button
                          onClick={(e) => handleArchive(e, proposal)}
                          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-red-500"
                          title="Archive proposal"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProposalsPage;
