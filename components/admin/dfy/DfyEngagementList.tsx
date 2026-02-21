import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, RefreshCw, ExternalLink } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { queryKeys } from '../../../lib/queryClient';
import { fetchDfyEngagements, fetchAllDeliverables } from '../../../services/dfy-admin-supabase';
import type { DfyAdminEngagement } from '../../../types/dfy-admin-types';
import DfyStatusBadge from './DfyStatusBadge';

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

const DfyEngagementList: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            DFY Engagements
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage Done-For-You client engagements
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDarkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
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
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {stat.label}
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2.5 rounded-lg border ${
            isDarkMode
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-white border-slate-300 text-slate-900'
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
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredEngagements.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase
              className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}
            />
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              No engagements found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={isDarkMode ? 'border-b border-slate-800' : 'border-b border-slate-200'}
                >
                  {['Client', 'Status', 'Monthly Rate', 'Start Date', 'Progress', ''].map(
                    (header) => (
                      <th
                        key={header || 'actions'}
                        className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
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
                    onClick={() => navigate(`/admin/dfy/${eng.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

function EngagementRow({
  engagement,
  progress,
  onClick,
}: {
  engagement: DfyAdminEngagement;
  progress?: { done: number; total: number };
  onClick: () => void;
}) {
  const { isDarkMode } = useTheme();

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors ${
        isDarkMode
          ? 'hover:bg-slate-800/50 border-b border-slate-800 last:border-0'
          : 'hover:bg-slate-50 border-b border-slate-100 last:border-0'
      }`}
    >
      <td className="px-4 py-3">
        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {engagement.client_name}
        </p>
        <p className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          {engagement.client_company}
        </p>
      </td>
      <td className="px-4 py-3">
        <DfyStatusBadge status={engagement.status} type="engagement" />
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          {formatCurrency(engagement.monthly_rate)}/mo
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {engagement.start_date ? new Date(engagement.start_date).toLocaleDateString() : '\u2014'}
        </span>
      </td>
      <td className="px-4 py-3">
        {progress ? (
          <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {progress.done}/{progress.total}
          </span>
        ) : (
          <span className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            &mdash;
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {engagement.portal_slug && (
          <a
            href={`/portal/dfy/${engagement.portal_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center p-1 rounded transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-blue-400'
                : 'text-slate-400 hover:text-blue-600'
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
