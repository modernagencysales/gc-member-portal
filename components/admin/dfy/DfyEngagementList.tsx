import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, RefreshCw, ExternalLink, Plus, X } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { queryKeys } from '../../../lib/queryClient';
import {
  fetchDfyEngagements,
  fetchAllDeliverables,
  fetchDfyDeliverables,
  fetchDfyEngagementById,
  manualOnboard,
} from '../../../services/dfy-admin-supabase';
import type { DfyAdminEngagement } from '../../../types/dfy-admin-types';
import DfyStatusBadge from './DfyStatusBadge';

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

const DfyEngagementList: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  const {
    data: engagements,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dfyEngagements(),
    queryFn: fetchDfyEngagements,
  });

  const { data: allDeliverables } = useQuery({
    queryKey: queryKeys.dfyAllDeliverables(),
    queryFn: fetchAllDeliverables,
  });

  const progressMap = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    (allDeliverables || []).forEach((d) => {
      if (!map[d.engagement_id]) map[d.engagement_id] = { done: 0, total: 0 };
      map[d.engagement_id].total++;
      if (d.status === 'approved' || d.status === 'completed') map[d.engagement_id].done++;
    });
    return map;
  }, [allDeliverables]);

  const filteredEngagements = useMemo(() => {
    if (!engagements) return [];
    return engagements.filter((eng) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        eng.client_name.toLowerCase().includes(q) ||
        eng.client_company.toLowerCase().includes(q) ||
        eng.client_email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || eng.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [engagements, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    if (!engagements) return { total: 0, active: 0, mrr: 0, onboarding: 0 };
    const active = engagements.filter((e) => e.status === 'active');
    return {
      total: engagements.length,
      active: active.length,
      mrr: active.reduce((sum, e) => sum + e.monthly_rate, 0),
      onboarding: engagements.filter((e) => e.status === 'onboarding').length,
    };
  }, [engagements]);

  const handleOnboardSuccess = (engagementId: string) => {
    setShowOnboardModal(false);
    queryClient.invalidateQueries({ queryKey: queryKeys.dfyEngagements() });
    navigate(`/admin/dfy/${engagementId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            DFY Engagements
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Manage Done-For-You client engagements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-violet-600 text-white hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            New Client
          </button>
          <button
            onClick={() => refetch()}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Engagements', value: String(stats.total) },
          { label: 'Active', value: String(stats.active) },
          { label: 'MRR', value: formatCurrency(stats.mrr) },
          { label: 'Onboarding', value: String(stats.onboarding) },
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
            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500'
                : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
            } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2.5 rounded-lg border ${
            isDarkMode
              ? 'bg-zinc-900 border-zinc-700 text-white'
              : 'bg-white border-zinc-300 text-zinc-900'
          }`}
        >
          <option value="all">All Statuses</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredEngagements.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase
              className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-300'}`}
            />
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              No engagements found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={isDarkMode ? 'border-b border-zinc-800' : 'border-b border-zinc-200'}
                >
                  {['Client', 'Status', 'Monthly Rate', 'Start Date', 'Progress', ''].map(
                    (header) => (
                      <th
                        key={header || 'actions'}
                        className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${
                          isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEngagements.map((eng) => (
                  <EngagementRow
                    key={eng.id}
                    engagement={eng}
                    progress={progressMap[eng.id]}
                    onHover={() => {
                      queryClient.prefetchQuery({
                        queryKey: queryKeys.dfyDeliverables(eng.id),
                        queryFn: () => fetchDfyDeliverables(eng.id),
                        staleTime: 1000 * 60 * 5,
                      });
                    }}
                    onClick={() => {
                      // Seed detail cache with list data so detail page renders instantly
                      queryClient.setQueryData(queryKeys.dfyEngagement(eng.id), eng);
                      // Background-refresh the full engagement (list data may be stale)
                      queryClient.prefetchQuery({
                        queryKey: queryKeys.dfyEngagement(eng.id),
                        queryFn: () => fetchDfyEngagementById(eng.id),
                        staleTime: 0,
                      });
                      navigate(`/admin/dfy/${eng.id}`);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Onboard Modal */}
      {showOnboardModal && (
        <ManualOnboardModal
          onClose={() => setShowOnboardModal(false)}
          onSuccess={handleOnboardSuccess}
        />
      )}
    </div>
  );
};

function ManualOnboardModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (engagementId: string) => void;
}) {
  const { isDarkMode } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_company: '',
    client_industry: '',
    linkedin_url: '',
    monthly_rate_dollars: '',
    communication_preference: 'email',
  });

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    },
    [onClose, submitting]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await manualOnboard({
        client_name: form.client_name,
        client_email: form.client_email,
        client_company: form.client_company,
        client_industry: form.client_industry || undefined,
        linkedin_url: form.linkedin_url || undefined,
        monthly_rate: form.monthly_rate_dollars
          ? Math.round(parseFloat(form.monthly_rate_dollars) * 100)
          : undefined,
        communication_preference: form.communication_preference,
      });
      onSuccess(result.engagement_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create engagement');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border ${
    isDarkMode
      ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500'
      : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`;

  const labelClass = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => !submitting && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-xl border p-6 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            New Client Onboard
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Client Name *</label>
            <input
              type="text"
              required
              value={form.client_name}
              onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
              placeholder="John Doe"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Client Email *</label>
            <input
              type="email"
              required
              value={form.client_email}
              onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
              placeholder="john@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Company *</label>
            <input
              type="text"
              required
              value={form.client_company}
              onChange={(e) => setForm((f) => ({ ...f, client_company: e.target.value }))}
              placeholder="Acme Corp"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Industry</label>
            <input
              type="text"
              value={form.client_industry}
              onChange={(e) => setForm((f) => ({ ...f, client_industry: e.target.value }))}
              placeholder="B2B SaaS"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>LinkedIn URL</label>
            <input
              type="url"
              value={form.linkedin_url}
              onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
              placeholder="https://linkedin.com/in/johndoe"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Monthly Rate ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthly_rate_dollars}
              onChange={(e) => setForm((f) => ({ ...f, monthly_rate_dollars: e.target.value }))}
              placeholder="2500"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Communication Preference</label>
            <select
              value={form.communication_preference}
              onChange={(e) => setForm((f) => ({ ...f, communication_preference: e.target.value }))}
              className={inputClass}
            >
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="both">Both</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create & Onboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EngagementRow({
  engagement,
  progress,
  onClick,
  onHover,
}: {
  engagement: DfyAdminEngagement;
  progress?: { done: number; total: number };
  onClick: () => void;
  onHover: () => void;
}) {
  const { isDarkMode } = useTheme();

  return (
    <tr
      onClick={onClick}
      onMouseEnter={onHover}
      className={`cursor-pointer transition-colors ${
        isDarkMode
          ? 'hover:bg-zinc-800/50 border-b border-zinc-800 last:border-0'
          : 'hover:bg-zinc-50 border-b border-zinc-100 last:border-0'
      }`}
    >
      <td className="px-4 py-3">
        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {engagement.client_name}
        </p>
        <p className={`text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {engagement.client_company}
        </p>
      </td>
      <td className="px-4 py-3">
        <DfyStatusBadge status={engagement.status} type="engagement" />
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {formatCurrency(engagement.monthly_rate)}/mo
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {engagement.start_date ? new Date(engagement.start_date).toLocaleDateString() : '\u2014'}
        </span>
      </td>
      <td className="px-4 py-3">
        {progress ? (
          <span className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
            {progress.done}/{progress.total}
          </span>
        ) : (
          <span className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            &mdash;
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {engagement.portal_slug && (
          <a
            href={`/client/${engagement.portal_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center p-1 rounded transition-colors ${
              isDarkMode
                ? 'text-zinc-400 hover:text-violet-400'
                : 'text-zinc-400 hover:text-violet-600'
            }`}
            title="Open client portal"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </td>
    </tr>
  );
}

export default DfyEngagementList;
