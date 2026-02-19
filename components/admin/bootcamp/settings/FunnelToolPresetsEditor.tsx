import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchFunnelToolPresets,
  saveFunnelToolPresets,
} from '../../../../services/bootcamp-supabase';
import { fetchAllAITools } from '../../../../services/chat-supabase';
import { FunnelToolPresets, FunnelToolPreset } from '../../../../types/bootcamp-types';
import { useTheme } from '../../../../context/ThemeContext';
import { Save, Plus, Trash2, Package, Sparkles } from 'lucide-react';

const FunnelToolPresetsEditor: React.FC = () => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const [localPresets, setLocalPresets] = useState<FunnelToolPresets>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const { data: presets, isLoading: presetsLoading } = useQuery({
    queryKey: ['funnelToolPresets'],
    queryFn: fetchFunnelToolPresets,
  });

  const { data: aiTools, isLoading: toolsLoading } = useQuery({
    queryKey: ['aiTools', 'all'],
    queryFn: fetchAllAITools,
  });

  const saveMutation = useMutation({
    mutationFn: saveFunnelToolPresets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnelToolPresets'] });
      setHasChanges(false);
    },
  });

  useEffect(() => {
    if (presets) {
      setLocalPresets(presets);
    }
  }, [presets]);

  const handleToggleTool = (presetKey: string, toolSlug: string) => {
    setLocalPresets((prev) => {
      const preset = prev[presetKey];
      if (!preset) return prev;

      const slugs = preset.toolSlugs.includes(toolSlug)
        ? preset.toolSlugs.filter((s) => s !== toolSlug)
        : [...preset.toolSlugs, toolSlug];

      return { ...prev, [presetKey]: { ...preset, toolSlugs: slugs } };
    });
    setHasChanges(true);
  };

  const handleUpdatePresetField = (
    presetKey: string,
    field: keyof FunnelToolPreset,
    value: string
  ) => {
    setLocalPresets((prev) => ({
      ...prev,
      [presetKey]: { ...prev[presetKey], [field]: value },
    }));
    setHasChanges(true);
  };

  const handleAddPreset = () => {
    const key = newPresetName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    if (!key || localPresets[key]) return;

    setLocalPresets((prev) => ({
      ...prev,
      [key]: { name: newPresetName, toolSlugs: [], description: '' },
    }));
    setNewPresetName('');
    setHasChanges(true);
  };

  const handleDeletePreset = (presetKey: string) => {
    if (presetKey === 'default') return; // Don't allow deleting default
    setLocalPresets((prev) => {
      const next = { ...prev };
      delete next[presetKey];
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(localPresets);
  };

  if (presetsLoading || toolsLoading) {
    return (
      <div
        className={`p-6 rounded-xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
      >
        <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Loading presets...
        </p>
      </div>
    );
  }

  const presetEntries = Object.entries(localPresets);

  return (
    <div
      className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
    >
      <div
        className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
      >
        <div className="flex items-center gap-3">
          <Package className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
          <h3 className="font-semibold">Sprint + AI Tools Tool Presets</h3>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Configure which AI tools are available for Sprint + AI Tools users. Each preset can be
          assigned when creating a ThriveCart checkout link via the <code>tool_preset</code>{' '}
          metadata key.
        </p>

        {presetEntries.map(([key, preset]) => (
          <div
            key={key}
            className={`rounded-lg border p-4 space-y-3 ${isDarkMode ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                value={preset.name}
                onChange={(e) => handleUpdatePresetField(key, 'name', e.target.value)}
                className={`flex-1 px-3 py-1.5 rounded-lg border text-sm font-medium ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              <span
                className={`text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}
              >
                {key}
              </span>
              {key !== 'default' && (
                <button
                  onClick={() => handleDeletePreset(key)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              value={preset.description || ''}
              onChange={(e) => handleUpdatePresetField(key, 'description', e.target.value)}
              placeholder="Description (optional)"
              className={`w-full px-3 py-1.5 rounded-lg border text-sm ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />

            <div>
              <p
                className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
              >
                Included Tools ({preset.toolSlugs.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {(aiTools || []).map((tool) => {
                  const isIncluded = preset.toolSlugs.includes(tool.slug);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToggleTool(key, tool.slug)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isIncluded
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                          : isDarkMode
                            ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Sparkles size={10} />
                      {tool.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Add new preset */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="New preset name..."
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPreset()}
          />
          <button
            onClick={handleAddPreset}
            disabled={!newPresetName.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Preset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FunnelToolPresetsEditor;
