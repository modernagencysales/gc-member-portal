import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Package, RefreshCw } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { queryKeys } from '../../../lib/queryClient';
import { fetchIntroOffers, fetchLeadName } from '../../../services/intro-offer-supabase';
import { STATUS_CONFIGS } from '../../../types/intro-offer-types';
import type { IntroOffer } from '../../../types/intro-offer-types';

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }: { status: string }) {
  const { isDarkMode } = useTheme();
  const config = STATUS_CONFIGS[status] || { label: status, color: 'slate' };

  const colorMap: Record<string, { light: string; dark: string }> = {
    slate: { light: 'bg-slate-100 text-slate-700', dark: 'bg-slate-800 text-slate-300' },
    green: { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
    blue: { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400' },
    yellow: { light: 'bg-yellow-100 text-yellow-700', dark: 'bg-yellow-900/30 text-yellow-400' },
    purple: { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400' },
    emerald: {
      light: 'bg-emerald-100 text-emerald-700',
      dark: 'bg-emerald-900/30 text-emerald-400',
    },
    red: { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' },
  };

  const colors = colorMap[config.color] || colorMap.slate;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
        isDarkMode ? colors.dark : colors.light
      }`}
    >
      {config.label}
    </span>
  );
}

const IntroOfferList: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leadNames, setLeadNames] = useState<Record<string, string>>({});

  const {
    data: offers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.introOffers(),
    queryFn: fetchIntroOffers,
  });

  // Fetch lead names for all offers
  useEffect(() => {
    if (!offers) return;
    const leadIds = offers.filter((o) => o.leadId).map((o) => o.leadId!);
    const unique = [...new Set(leadIds)];

    unique.forEach(async (leadId) => {
      if (leadNames[leadId]) return;
      const name = await fetchLeadName(leadId);
      if (name) {
        setLeadNames((prev) => ({ ...prev, [leadId]: name }));
      }
    });
  }, [offers]);

  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    return offers.filter((offer) => {
      const name = offer.leadId ? leadNames[offer.leadId] || '' : '';
      const matchesSearch =
        !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [offers, searchQuery, statusFilter, leadNames]);

  const stats = useMemo(() => {
    if (!offers) return { total: 0, active: 0, delivered: 0, handedOff: 0 };
    return {
      total: offers.length,
      active: offers.filter((o) =>
        ['payment_received', 'provisioning', 'interview_pending', 'fulfilling', 'review'].includes(
          o.status
        )
      ).length,
      delivered: offers.filter((o) => o.status === 'delivered').length,
      handedOff: offers.filter((o) => o.status === 'handed_off').length,
    };
  }, [offers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Intro Offers
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage $2,500 GTM Launch Packages
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
          { label: 'Total', value: stats.total, color: 'blue' },
          { label: 'Active', value: stats.active, color: 'yellow' },
          { label: 'Delivered', value: stats.delivered, color: 'green' },
          { label: 'Handed Off', value: stats.handedOff, color: 'emerald' },
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

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name or ID..."
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
          <option value="created">Created</option>
          <option value="payment_received">Payment Received</option>
          <option value="interview_pending">Interview Needed</option>
          <option value="fulfilling">Building</option>
          <option value="review">In Review</option>
          <option value="delivered">Delivered</option>
          <option value="handed_off">Handed Off</option>
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
        ) : filteredOffers.length === 0 ? (
          <div className="p-8 text-center">
            <Package
              className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}
            />
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              No intro offers found
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr
                className={isDarkMode ? 'border-b border-slate-800' : 'border-b border-slate-200'}
              >
                {['Client', 'Status', 'Age', 'Created'].map((header) => (
                  <th
                    key={header}
                    className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOffers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  leadName={offer.leadId ? leadNames[offer.leadId] : undefined}
                  onClick={() => navigate(`/admin/intro-offers/${offer.id}`)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

function OfferRow({
  offer,
  leadName,
  onClick,
}: {
  offer: IntroOffer;
  leadName?: string;
  onClick: () => void;
}) {
  const { isDarkMode } = useTheme();
  const days = daysSince(offer.createdAt);

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
          {leadName || 'Loading...'}
        </p>
        <p className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          {offer.id.slice(0, 8)}...
        </p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={offer.status} />
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          {days}d
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {new Date(offer.createdAt).toLocaleDateString()}
        </span>
      </td>
    </tr>
  );
}

export default IntroOfferList;
