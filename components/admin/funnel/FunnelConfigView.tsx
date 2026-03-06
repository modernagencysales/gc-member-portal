import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Check, AlertTriangle, Save } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { funnelApi } from '../../../lib/api/funnel';

interface ConfigItem {
  key: string;
  value: string;
  type: 'number' | 'text' | 'url' | 'textarea';
  label: string;
  description: string;
  category: string;
}

const FunnelConfigView: React.FC = () => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();

  const {
    data: configData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['funnel', 'config'],
    queryFn: () => funnelApi.getConfig(),
  });

  const configs: ConfigItem[] = configData?.data ?? [];

  // Group configs by category
  const grouped = configs.reduce(
    (acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, ConfigItem[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Manage funnel configuration values. Changes take effect immediately.
        </p>
        <button
          onClick={() => refetch()}
          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div
          className={`p-12 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Loading configuration...
          </p>
        </div>
      ) : configs.length === 0 ? (
        <div
          className={`p-12 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            No configuration items found.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h3
              className={`text-sm font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              {category}
            </h3>
            <div
              className={`rounded-xl border divide-y ${
                isDarkMode
                  ? 'bg-zinc-900 border-zinc-800 divide-zinc-800'
                  : 'bg-white border-zinc-200 divide-zinc-100'
              }`}
            >
              {items.map((item) => (
                <ConfigRow key={item.key} item={item} queryClient={queryClient} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

interface ConfigRowProps {
  item: ConfigItem;
  queryClient: ReturnType<typeof useQueryClient>;
}

const ConfigRow: React.FC<ConfigRowProps> = ({ item, queryClient }) => {
  const { isDarkMode } = useTheme();
  const [localValue, setLocalValue] = useState(item.value);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const hasChanged = localValue !== item.value;
  const isRevenueMin = item.key === 'qualification_revenue_min';

  const mutation = useMutation({
    mutationFn: () => funnelApi.updateConfig(item.key, localValue),
    onSuccess: () => {
      setFeedback('success');
      queryClient.invalidateQueries({ queryKey: ['funnel', 'config'] });
      setTimeout(() => setFeedback(null), 2000);
    },
    onError: () => {
      setFeedback('error');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handleSave = useCallback(() => {
    mutation.mutate();
  }, [mutation]);

  const inputClasses = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDarkMode
      ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500'
      : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`;

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <label className="text-sm font-medium">{item.label}</label>
          {item.description && (
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {item.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {feedback === 'success' && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {feedback === 'error' && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="w-3.5 h-3.5" /> Failed
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanged || mutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              hasChanged
                ? isDarkMode
                  ? 'bg-violet-600 text-white hover:bg-violet-500'
                  : 'bg-violet-600 text-white hover:bg-violet-700'
                : isDarkMode
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-md">
        {item.type === 'textarea' ? (
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            rows={3}
            className={inputClasses}
          />
        ) : (
          <input
            type={item.type === 'number' ? 'number' : item.type === 'url' ? 'url' : 'text'}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className={inputClasses}
          />
        )}
      </div>

      {/* Special warning for qualification_revenue_min */}
      {isRevenueMin && hasChanged && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
            isDarkMode
              ? 'bg-amber-900/30 text-amber-300 border border-amber-800'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Remember to also update the iClosed disqualification rule
        </div>
      )}
    </div>
  );
};

export default FunnelConfigView;
