import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { funnelApi } from '../../../lib/api/funnel';

interface FunnelStage {
  id: string;
  slug: string;
  name: string;
  display_order: number;
  color: string;
}

interface StageMetric {
  stage_slug: string;
  stage_name: string;
  lead_count: number;
  conversion_rate: number;
}

const channels = ['all', 'heyreach', 'plusvibe', 'paid_ads', 'organic', 'magnetlab'] as const;
type Channel = (typeof channels)[number];

const channelLabels: Record<Channel, string> = {
  all: 'All Channels',
  heyreach: 'HeyReach',
  plusvibe: 'PlusVibe',
  paid_ads: 'Paid Ads',
  organic: 'Organic',
  magnetlab: 'MagnetLab',
};

type DateRange = '7d' | '30d' | '90d' | 'all';

function getDateFrom(range: DateRange): string | undefined {
  if (range === 'all') return undefined;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getOpacity(count: number, max: number): number {
  if (max === 0) return 0.2;
  return Math.max(0.2, Math.min(1, count / max));
}

const FunnelView: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [channel, setChannel] = useState<Channel>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const { data: stagesData, isLoading: stagesLoading } = useQuery({
    queryKey: ['funnel', 'stages'],
    queryFn: () => funnelApi.getStages(),
  });

  const {
    data: metricsData,
    isLoading: metricsLoading,
    refetch,
  } = useQuery({
    queryKey: ['funnel', 'metrics', channel, dateRange],
    queryFn: () =>
      funnelApi.getMetrics({
        channel: channel === 'all' ? undefined : channel,
        from: getDateFrom(dateRange),
      }),
  });

  const stages: FunnelStage[] = stagesData?.data ?? [];
  const metrics: StageMetric[] = metricsData?.data ?? [];

  // Merge stages with metrics for display
  const stageDisplay = useMemo(() => {
    return stages
      .sort((a, b) => a.display_order - b.display_order)
      .map((stage) => {
        const metric = metrics.find((m) => m.stage_slug === stage.slug);
        return {
          ...stage,
          lead_count: metric?.lead_count ?? 0,
          conversion_rate: metric?.conversion_rate ?? 0,
        };
      });
  }, [stages, metrics]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...stageDisplay.map((s) => s.lead_count));
  }, [stageDisplay]);

  const isLoading = stagesLoading || metricsLoading;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Channel filter */}
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDarkMode
                ? 'bg-zinc-900 border-zinc-700 text-white'
                : 'bg-white border-zinc-300 text-zinc-900'
            } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
          >
            {channels.map((ch) => (
              <option key={ch} value={ch}>
                {channelLabels[ch]}
              </option>
            ))}
          </select>

          {/* Date range buttons */}
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
        </div>

        <button
          onClick={() => refetch()}
          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Funnel Visualization */}
      {isLoading ? (
        <div
          className={`p-12 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Loading funnel data...
          </p>
        </div>
      ) : stageDisplay.length === 0 ? (
        <div
          className={`p-12 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            No funnel stages configured. Add stages in the Config tab.
          </p>
        </div>
      ) : (
        <div
          className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
            {stageDisplay.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                {/* Stage box */}
                <div
                  className={`flex-1 min-w-[140px] rounded-xl p-4 border transition-all ${
                    isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
                  }`}
                  style={{
                    backgroundColor: isDarkMode
                      ? `rgba(139, 92, 246, ${getOpacity(stage.lead_count, maxCount) * 0.3})`
                      : `rgba(139, 92, 246, ${getOpacity(stage.lead_count, maxCount) * 0.15})`,
                  }}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                      isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    {stage.name}
                  </p>
                  <p className="text-2xl font-bold">{stage.lead_count.toLocaleString()}</p>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {stage.conversion_rate.toFixed(1)}% conversion
                  </p>
                </div>

                {/* Arrow between stages */}
                {idx < stageDisplay.length - 1 && (
                  <div className="flex items-center justify-center px-1">
                    <ArrowRight
                      className={`w-5 h-5 flex-shrink-0 ${
                        isDarkMode ? 'text-zinc-600' : 'text-zinc-300'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Summary stats below funnel */}
      {!isLoading && stageDisplay.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stageDisplay.slice(0, 4).map((stage) => (
            <div
              key={stage.id}
              className={`p-4 rounded-xl border ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {stage.name}
              </p>
              <p className="text-2xl font-bold mt-1">{stage.lead_count.toLocaleString()}</p>
              <p
                className={`text-xs mt-1 ${
                  stage.conversion_rate > 50
                    ? 'text-green-500'
                    : stage.conversion_rate > 20
                      ? 'text-amber-500'
                      : 'text-zinc-400'
                }`}
              >
                {stage.conversion_rate.toFixed(1)}% rate
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FunnelView;
