import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingState } from '../../shared/LoadingSpinner';
import { fetchPnLMetrics, fetchExpenseMetrics, triggerSync } from '../../../services/financial';
import type { PnLMetrics, ExpenseMetrics, ChannelPnL } from '../../../types/financial-types';
import { CHANNEL_LABELS } from '../../../types/financial-types';
import TransactionList from './TransactionList';

// Colors for each GTM channel in charts
const CHANNEL_COLORS: Record<string, string> = {
  paid_social: '#3b82f6',
  paid_search: '#f59e0b',
  cold_email: '#8b5cf6',
  organic_linkedin: '#22c55e',
  ai_infrastructure: '#06b6d4',
  tooling: '#ec4899',
  content: '#f97316',
  contractors: '#14b8a6',
  email_infrastructure: '#6366f1',
  other: '#94a3b8',
  uncategorized: '#cbd5e1',
};

interface FinancialsTabProps {
  tenantId: string;
  period: '7d' | '30d' | '90d';
}

/** Format cents to a full currency string like $1,234.56 */
function formatDollars(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Human-readable time ago string */
function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

const FinancialsTab: React.FC<FinancialsTabProps> = ({ tenantId, period }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pnl, setPnl] = useState<PnLMetrics | null>(null);
  const [expenses, setExpenses] = useState<ExpenseMetrics | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();

    const [pnlResult, expenseResult] = await Promise.all([
      fetchPnLMetrics(tenantId, from, to),
      fetchExpenseMetrics(tenantId, from, to),
    ]);

    if (!pnlResult && !expenseResult) {
      setError('Failed to load financial data. Please try again.');
    }

    setPnl(pnlResult);
    setExpenses(expenseResult);
    setLoading(false);
  }, [tenantId, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    const result = await triggerSync(tenantId);
    setSyncing(false);
    if (result) {
      // Refresh data after sync
      await loadData();
    }
  };

  const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  if (loading) return <LoadingState message="Loading financials..." />;
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Derive unique channels from expense period data for chart bars
  const expenseChannels: string[] = [];
  if (expenses?.by_period) {
    const channelSet = new Set<string>();
    for (const p of expenses.by_period) {
      if (p.by_channel) {
        for (const ch of Object.keys(p.by_channel)) {
          channelSet.add(ch);
        }
      }
    }
    expenseChannels.push(...Array.from(channelSet).sort());
  }

  // Sort channel P&L rows by spend descending
  const sortedChannels: ChannelPnL[] = pnl?.by_channel
    ? [...pnl.by_channel].sort((a, b) => b.expense_cents - a.expense_cents)
    : [];

  return (
    <div className="space-y-6">
      {/* Sync Status Badge */}
      <div className="flex items-center justify-end gap-3">
        {pnl?.sync_status && (
          <span className={`text-xs ${textSecondary}`}>
            {pnl.sync_status.last_sync_status === 'error' ? (
              <span className="text-red-500">
                Sync error
                {pnl.sync_status.last_sync_error ? `: ${pnl.sync_status.last_sync_error}` : ''}
              </span>
            ) : pnl.sync_status.last_synced_at ? (
              <>Last synced: {timeAgo(pnl.sync_status.last_synced_at)}</>
            ) : (
              'Never synced'
            )}
          </span>
        )}
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            syncing
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Revenue"
          value={formatDollars(pnl?.revenue_cents ?? 0)}
          accent="text-green-500"
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          label="Expenses"
          value={formatDollars(pnl?.expense_cents ?? 0)}
          accent="text-orange-500"
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          label="Net Profit"
          value={formatDollars(pnl?.net_profit_cents ?? 0)}
          accent={(pnl?.net_profit_cents ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          label="Profit Margin"
          value={`${(pnl?.profit_margin_pct ?? 0).toFixed(1)}%`}
          accent={
            (pnl?.profit_margin_pct ?? 0) > 20
              ? 'text-green-500'
              : (pnl?.profit_margin_pct ?? 0) >= 0
                ? 'text-yellow-500'
                : 'text-red-500'
          }
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Expense Breakdown Chart */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Expense Breakdown</h2>
        {expenses && expenses.by_period.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenses.by_period}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  `$${(v / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                }
                tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatDollars(Number(value ?? 0)),
                  CHANNEL_LABELS[String(name)] || String(name),
                ]}
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '8px',
                }}
              />
              <Legend formatter={(value: string) => CHANNEL_LABELS[value] || value} />
              {expenseChannels.map((channel) => (
                <Bar
                  key={channel}
                  dataKey={`by_channel.${channel}`}
                  name={channel}
                  fill={CHANNEL_COLORS[channel] || '#94a3b8'}
                  stackId="expenses"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={`text-center py-8 ${textSecondary}`}>No expense data for this period.</p>
        )}
      </div>

      {/* Channel Unit Economics Table */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Channel Unit Economics</h2>
        {sortedChannels.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <th className={`text-left py-2 font-medium ${textSecondary}`}>Channel</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Spend</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Leads</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>CPL</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Revenue</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>ROI</th>
                </tr>
              </thead>
              <tbody>
                {sortedChannels.map((ch) => (
                  <tr
                    key={ch.channel}
                    className={`border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}
                  >
                    <td className={`py-2 ${textPrimary}`}>
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: CHANNEL_COLORS[ch.channel] || '#94a3b8' }}
                      />
                      {CHANNEL_LABELS[ch.channel] || ch.channel}
                    </td>
                    <td className={`text-right py-2 ${textSecondary}`}>
                      {formatDollars(ch.expense_cents)}
                    </td>
                    <td className={`text-right py-2 ${textSecondary}`}>
                      {ch.lead_count.toLocaleString()}
                    </td>
                    <td className={`text-right py-2 ${textSecondary}`}>
                      {ch.cpl_cents != null ? formatDollars(ch.cpl_cents) : '\u2014'}
                    </td>
                    <td className={`text-right py-2 font-medium ${textPrimary}`}>
                      {formatDollars(ch.revenue_cents)}
                    </td>
                    <td
                      className={`text-right py-2 font-medium ${
                        ch.roi_pct != null && ch.roi_pct > 0
                          ? 'text-green-500'
                          : ch.roi_pct != null && ch.roi_pct < 0
                            ? 'text-red-500'
                            : textSecondary
                      }`}
                    >
                      {ch.roi_pct != null ? `${ch.roi_pct.toFixed(1)}%` : '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-center py-8 ${textSecondary}`}>No channel data for this period.</p>
        )}
      </div>

      {/* Transaction List with Inline Classification Override */}
      <TransactionList tenantId={tenantId} period={period} />
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  accent: string;
  isDarkMode: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, accent, isDarkMode }) => (
  <div
    className={`rounded-xl border p-4 ${
      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}
  >
    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
      {label}
    </span>
    <p className={`text-xl font-bold mt-1 ${accent}`}>{value}</p>
  </div>
);

export default FinancialsTab;
