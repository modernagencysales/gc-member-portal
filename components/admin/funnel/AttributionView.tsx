import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { funnelApi } from '../../../lib/api/funnel';

interface ChannelAttribution {
  channel: string;
  leads: number;
  qualified: number;
  calls: number;
  customers: number;
  revenue_cents: number;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

function getDateFrom(range: DateRange): string | undefined {
  if (range === 'all') return undefined;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function channelLabel(channel: string): string {
  const labels: Record<string, string> = {
    heyreach: 'HeyReach',
    plusvibe: 'PlusVibe',
    paid_ads: 'Paid Ads',
    organic: 'Organic',
    magnetlab: 'MagnetLab',
  };
  return labels[channel] ?? channel;
}

const AttributionView: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const {
    data: attrData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['funnel', 'attribution', dateRange],
    queryFn: () =>
      funnelApi.getAttribution({
        from: getDateFrom(dateRange),
      }),
  });

  const rows: ChannelAttribution[] = attrData?.data ?? [];

  const summary = useMemo(() => {
    const totalLeads = rows.reduce((sum, r) => sum + r.leads, 0);
    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue_cents, 0);
    const best = rows.reduce(
      (top, r) => (r.revenue_cents > (top?.revenue_cents ?? 0) ? r : top),
      null as ChannelAttribution | null
    );
    return { totalLeads, totalRevenue, bestChannel: best?.channel ?? 'N/A' };
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Date range + refresh */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1">
          {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range
                  ? isDarkMode
                    ? 'bg-violet-900/40 text-violet-300 border border-violet-700'
                    : 'bg-violet-100 text-violet-700 border border-violet-300'
                  : isDarkMode
                    ? 'text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                    : 'text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {range === 'all' ? 'All Time' : `Last ${range}`}
            </button>
          ))}
        </div>
        <button
          onClick={() => refetch()}
          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Total Leads
            </p>
          </div>
          <p className="text-2xl font-bold">{summary.totalLeads.toLocaleString()}</p>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Total Revenue
            </p>
          </div>
          <p className="text-2xl font-bold">{formatDollars(summary.totalRevenue)}</p>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Best Channel
            </p>
          </div>
          <p className="text-2xl font-bold">{channelLabel(summary.bestChannel)}</p>
        </div>
      </div>

      {/* Channel Performance Table */}
      {isLoading ? (
        <div
          className={`p-12 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Loading attribution data...
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div
          className={`p-12 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            No attribution data available for this period.
          </p>
        </div>
      ) : (
        <div
          className={`rounded-xl border overflow-hidden ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <table className="w-full">
            <thead>
              <tr
                className={`text-left text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? 'bg-zinc-800/50 text-zinc-400' : 'bg-zinc-50 text-zinc-500'
                }`}
              >
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3 text-right">Qualified</th>
                <th className="px-4 py-3 text-right">Calls</th>
                <th className="px-4 py-3 text-right">Customers</th>
                <th className="px-4 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {rows.map((row) => (
                <tr
                  key={row.channel}
                  className={`transition-colors ${
                    isDarkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium">{channelLabel(row.channel)}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">
                    {row.leads.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">
                    {row.qualified.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">
                    {row.calls.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">
                    {row.customers.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">
                    {formatDollars(row.revenue_cents)}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr
                className={`font-semibold ${
                  isDarkMode
                    ? 'bg-zinc-800/50 border-t border-zinc-700'
                    : 'bg-zinc-50 border-t border-zinc-200'
                }`}
              >
                <td className="px-4 py-3 text-sm">Total</td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">
                  {rows.reduce((s, r) => s + r.leads, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">
                  {rows.reduce((s, r) => s + r.qualified, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">
                  {rows.reduce((s, r) => s + r.calls, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">
                  {rows.reduce((s, r) => s + r.customers, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">
                  {formatDollars(rows.reduce((s, r) => s + r.revenue_cents, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttributionView;
