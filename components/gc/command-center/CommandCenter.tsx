import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Target,
  Users,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingState } from '../../shared/LoadingSpinner';
import {
  fetchCommandCenterData,
  formatCents,
  formatChannelName,
} from '../../../services/command-center';
import type { CommandCenterData } from '../../../types/command-center-types';

const TENANT_ID = '7a3474f9-dd56-4ce0-a8b2-0372452ba90e';

const CHANNEL_COLORS: Record<string, string> = {
  heyreach: '#3b82f6',
  plusvibe: '#8b5cf6',
  organic: '#22c55e',
  magnetlab: '#f59e0b',
  blueprint: '#06b6d4',
  bootcamp: '#ec4899',
  unknown: '#94a3b8',
};

const CommandCenter: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();
    const granularity = period === '7d' ? 'day' : period === '30d' ? 'week' : 'month';

    const result = await fetchCommandCenterData(TENANT_ID, from, to, granularity);
    setData(result);
    setLoading(false);
  };

  if (loading) return <LoadingState message="Loading Command Center..." />;
  if (!data) return <div className="text-center py-12 text-slate-500">Failed to load data.</div>;

  const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-6">
      {/* Header + Period Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold ${textPrimary}`}>Command Center</h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>
            Revenue, pipeline, and GTM performance at a glance
          </p>
        </div>
        <div
          className={`inline-flex rounded-lg p-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
        >
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? isDarkMode
                    ? 'bg-slate-700 text-white'
                    : 'bg-white text-slate-900 shadow-sm'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Hero KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          label="Total Revenue"
          value={formatCents(data.kpis.total_revenue_cents)}
          icon={DollarSign}
          isDarkMode={isDarkMode}
          accent="text-green-500"
        />
        <KPICard
          label="MRR"
          value={formatCents(data.kpis.mrr_cents)}
          icon={TrendingUp}
          isDarkMode={isDarkMode}
          accent="text-blue-500"
        />
        <KPICard
          label="Blended CAC"
          value={
            data.kpis.blended_cac_cents != null
              ? formatCents(data.kpis.blended_cac_cents)
              : '\u2014'
          }
          icon={Target}
          isDarkMode={isDarkMode}
          accent="text-orange-500"
        />
        <KPICard
          label="Best Channel"
          value={data.kpis.best_channel ? formatChannelName(data.kpis.best_channel) : '\u2014'}
          icon={Zap}
          isDarkMode={isDarkMode}
          accent="text-violet-500"
        />
        <KPICard
          label="Pipeline Value"
          value={formatCents(data.kpis.pipeline_value_cents)}
          icon={Users}
          isDarkMode={isDarkMode}
          accent="text-cyan-500"
        />
      </div>

      {/* Row 2: Revenue by Channel (Stacked Bar Chart) */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Revenue by Channel</h2>
        {data.revenue.by_period.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenue.by_period}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`}
                tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
              />
              <Tooltip
                formatter={(value) => [`$${(Number(value ?? 0) / 100).toFixed(2)}`, '']}
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="new_revenue_cents" name="One-time" fill="#22c55e" stackId="rev" />
              <Bar
                dataKey="recurring_revenue_cents"
                name="Recurring"
                fill="#3b82f6"
                stackId="rev"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={`text-center py-8 ${textSecondary}`}>No revenue data for this period.</p>
        )}

        {/* Channel breakdown table */}
        {data.revenue.by_channel.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <th className={`text-left py-2 font-medium ${textSecondary}`}>Channel</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Revenue</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Customers</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Avg/Customer</th>
                </tr>
              </thead>
              <tbody>
                {data.revenue.by_channel.map((ch) => (
                  <tr
                    key={ch.channel}
                    className={`border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}
                  >
                    <td className={`py-2 ${textPrimary}`}>
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: CHANNEL_COLORS[ch.channel] || '#94a3b8' }}
                      />
                      {formatChannelName(ch.channel)}
                    </td>
                    <td className={`text-right py-2 font-medium ${textPrimary}`}>
                      {formatCents(ch.revenue_cents)}
                    </td>
                    <td className={`text-right py-2 ${textSecondary}`}>{ch.customer_count}</td>
                    <td className={`text-right py-2 ${textSecondary}`}>
                      {formatCents(ch.avg_revenue_per_customer_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 3: Full Funnel */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Full Funnel</h2>
        {data.funnel.stages.length > 0 ? (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-1/2">
              <ResponsiveContainer width="100%" height={250}>
                <FunnelChart>
                  <Tooltip formatter={(value) => [value ?? 0, '']} />
                  <Funnel
                    dataKey="count"
                    data={data.funnel.stages.map((s, i) => ({
                      name: s.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                      count: s.count,
                      fill: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#22c55e', '#f59e0b'][
                        i % 6
                      ],
                    }))}
                  >
                    <LabelList
                      position="right"
                      fill={isDarkMode ? '#e2e8f0' : '#334155'}
                      fontSize={12}
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-2">
              {data.funnel.conversion_rates.map((cr) => (
                <div
                  key={`${cr.from_stage}-${cr.to_stage}`}
                  className="flex items-center justify-between"
                >
                  <span className={`text-sm ${textSecondary}`}>
                    {cr.from_stage.replace(/_/g, ' ')}{' '}
                    <ArrowRight className="w-3 h-3 inline mx-1" /> {cr.to_stage.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-sm font-medium ${cr.rate > 20 ? 'text-green-500' : cr.rate > 10 ? 'text-yellow-500' : 'text-red-500'}`}
                  >
                    {cr.rate.toFixed(1)}%
                  </span>
                </div>
              ))}
              <div
                className={`pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
              >
                <span className={`text-sm font-medium ${textPrimary}`}>
                  Overall: {data.funnel.overall_conversion_rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className={`text-center py-8 ${textSecondary}`}>No funnel data for this period.</p>
        )}
      </div>

      {/* Row 4: Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className={`text-lg font-semibold ${textPrimary}`}>Alerts</h2>
          {data.alerts.map((alert, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 flex items-start gap-3 ${
                alert.severity === 'critical'
                  ? isDarkMode
                    ? 'border-red-800 bg-red-900/20'
                    : 'border-red-200 bg-red-50'
                  : alert.severity === 'warning'
                    ? isDarkMode
                      ? 'border-yellow-800 bg-yellow-900/20'
                      : 'border-yellow-200 bg-yellow-50'
                    : isDarkMode
                      ? 'border-blue-800 bg-blue-900/20'
                      : 'border-blue-200 bg-blue-50'
              }`}
            >
              {alert.severity === 'critical' ? (
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              ) : alert.severity === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${textPrimary}`}>{alert.title}</p>
                <p className={`text-xs mt-0.5 ${textSecondary}`}>{alert.description}</p>
              </div>
              {alert.action_label && (
                <button className="text-xs font-medium text-violet-500 hover:text-violet-400 shrink-0">
                  {alert.action_label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Row 5: Channel ROI */}
      {data.unit_economics.by_channel.length > 0 && (
        <div className={`rounded-xl border p-6 ${cardBg}`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Channel ROI</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <th className={`text-left py-2 font-medium ${textSecondary}`}>Channel</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Cost</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Revenue</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>Customers</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>CAC</th>
                  <th className={`text-right py-2 font-medium ${textSecondary}`}>ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.unit_economics.by_channel.map((ch) => (
                  <tr
                    key={ch.channel}
                    className={`border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}
                  >
                    <td className={`py-2 ${textPrimary}`}>{formatChannelName(ch.channel)}</td>
                    <td className={`text-right py-2 ${textSecondary}`}>
                      {formatCents(ch.cost_cents)}
                    </td>
                    <td className={`text-right py-2 font-medium ${textPrimary}`}>
                      {formatCents(ch.revenue_cents)}
                    </td>
                    <td className={`text-right py-2 ${textSecondary}`}>{ch.new_customers}</td>
                    <td className={`text-right py-2 ${textSecondary}`}>
                      {ch.cac_cents != null ? formatCents(ch.cac_cents) : '\u2014'}
                    </td>
                    <td
                      className={`text-right py-2 font-medium ${
                        ch.roi_percentage != null && ch.roi_percentage > 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {ch.roi_percentage != null ? `${ch.roi_percentage}%` : '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  isDarkMode: boolean;
  accent: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon: Icon, isDarkMode, accent }) => (
  <div
    className={`rounded-xl border p-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${accent}`} />
      <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
    <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
  </div>
);

export default CommandCenter;
