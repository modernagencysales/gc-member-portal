import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSprintProductConfig,
  saveSprintProductConfig,
} from '../../../../services/bootcamp-supabase';
import { fetchAllAITools } from '../../../../services/chat-supabase';
import { fetchAllLmsCohorts } from '../../../../services/lms-supabase';
import { SprintProductConfig, BootcampAccessLevel } from '../../../../types/bootcamp-types';
import { useTheme } from '../../../../context/ThemeContext';
import { Save, ShoppingCart, Sparkles } from 'lucide-react';

const ACCESS_LEVELS: BootcampAccessLevel[] = [
  'Lead Magnet',
  'Sprint + AI Tools',
  'Curriculum Only',
  'Full Access',
];

const SprintProductConfigEditor: React.FC = () => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<SprintProductConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['sprintProductConfig'],
    queryFn: fetchSprintProductConfig,
  });

  const { data: aiTools, isLoading: toolsLoading } = useQuery({
    queryKey: ['aiTools', 'all'],
    queryFn: fetchAllAITools,
  });

  const { data: cohorts, isLoading: cohortsLoading } = useQuery({
    queryKey: ['lmsCohorts', 'all'],
    queryFn: fetchAllLmsCohorts,
  });

  const saveMutation = useMutation({
    mutationFn: saveSprintProductConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprintProductConfig'] });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      window.alert(`Failed to save sprint product config: ${error.message}`);
    },
  });

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleToggleTool = (toolSlug: string) => {
    if (!localConfig) return;
    const slugs = localConfig.products.gptSuite.toolSlugs.includes(toolSlug)
      ? localConfig.products.gptSuite.toolSlugs.filter((s) => s !== toolSlug)
      : [...localConfig.products.gptSuite.toolSlugs, toolSlug];
    setLocalConfig({
      ...localConfig,
      products: {
        ...localConfig.products,
        gptSuite: {
          ...localConfig.products.gptSuite,
          toolSlugs: slugs,
        },
      },
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (localConfig) {
      saveMutation.mutate(localConfig);
    }
  };

  if (configLoading || toolsLoading || cohortsLoading || !localConfig) {
    return (
      <div
        className={`p-6 rounded-xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
      >
        <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Loading sprint product config...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
    >
      <div
        className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
      >
        <div className="flex items-center gap-3">
          <ShoppingCart className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          <h3 className="font-semibold">Sprint Product Delivery</h3>
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
          Automatically create student accounts when customers purchase the 30-Day LinkedIn Sprint
          via Stripe.
        </p>

        {/* Enabled toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <label className="font-medium">Enabled</label>
            <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              When enabled, Stripe purchases auto-create student accounts with the configured
              products
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.enabled}
              onChange={(e) => {
                setLocalConfig({ ...localConfig, enabled: e.target.checked });
                setHasChanges(true);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
          </label>
        </div>

        {/* Sprint Product section */}
        <div>
          <p
            className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
          >
            Sprint Product
          </p>

          <div className="space-y-4">
            {/* Stripe Product ID */}
            <div>
              <label className="font-medium">Stripe Product ID</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
              >
                The Stripe product ID for the Sprint course
              </p>
              <input
                type="text"
                value={localConfig.products.sprint.stripeProductId}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    products: {
                      ...localConfig.products,
                      sprint: {
                        ...localConfig.products.sprint,
                        stripeProductId: e.target.value,
                      },
                    },
                  });
                  setHasChanges(true);
                }}
                placeholder="prod_..."
                className={`w-72 px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Cohort */}
            <div>
              <label className="font-medium">Cohort</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
              >
                LMS cohort to enroll students in
              </p>
              <select
                value={localConfig.products.sprint.cohortId}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    products: {
                      ...localConfig.products,
                      sprint: {
                        ...localConfig.products.sprint,
                        cohortId: e.target.value,
                      },
                    },
                  });
                  setHasChanges(true);
                }}
                className={`w-72 px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Select a cohort...</option>
                {(cohorts || []).map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Access Level */}
            <div>
              <label className="font-medium">Access Level</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
              >
                Access level assigned to new student accounts
              </p>
              <select
                value={localConfig.products.sprint.accessLevel}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    products: {
                      ...localConfig.products,
                      sprint: {
                        ...localConfig.products.sprint,
                        accessLevel: e.target.value as BootcampAccessLevel,
                      },
                    },
                  });
                  setHasChanges(true);
                }}
                className={`w-48 px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {ACCESS_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* DM Kit section */}
        <div>
          <p
            className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
          >
            DM Kit
          </p>

          <div>
            <label className="font-medium">Stripe Product ID</label>
            <p
              className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
            >
              The Stripe product ID for the DM Conversion Kit
            </p>
            <input
              type="text"
              value={localConfig.products.dmKit.stripeProductId}
              onChange={(e) => {
                setLocalConfig({
                  ...localConfig,
                  products: {
                    ...localConfig.products,
                    dmKit: {
                      ...localConfig.products.dmKit,
                      stripeProductId: e.target.value,
                    },
                  },
                });
                setHasChanges(true);
              }}
              placeholder="prod_..."
              className={`w-72 px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>

        {/* GPT Suite section */}
        <div>
          <p
            className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
          >
            GPT Suite
          </p>

          <div className="space-y-4">
            {/* Stripe Product ID */}
            <div>
              <label className="font-medium">Stripe Product ID</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
              >
                The Stripe product ID for the GPT Suite add-on
              </p>
              <input
                type="text"
                value={localConfig.products.gptSuite.stripeProductId}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    products: {
                      ...localConfig.products,
                      gptSuite: {
                        ...localConfig.products.gptSuite,
                        stripeProductId: e.target.value,
                      },
                    },
                  });
                  setHasChanges(true);
                }}
                placeholder="prod_..."
                className={`w-72 px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Access Duration */}
            <div>
              <label className="font-medium">Access Duration (days)</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
              >
                Number of days the GPT Suite access remains active
              </p>
              <input
                type="number"
                min={1}
                max={365}
                value={localConfig.products.gptSuite.accessDays}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    products: {
                      ...localConfig.products,
                      gptSuite: {
                        ...localConfig.products.gptSuite,
                        accessDays: parseInt(e.target.value) || 30,
                      },
                    },
                  });
                  setHasChanges(true);
                }}
                className={`w-32 px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Credits per Tool */}
            <div>
              <label className="font-medium">Credits per Tool</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
              >
                Number of credits granted for each selected AI tool
              </p>
              <input
                type="number"
                min={1}
                max={100}
                value={localConfig.products.gptSuite.creditsPerTool}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    products: {
                      ...localConfig.products,
                      gptSuite: {
                        ...localConfig.products.gptSuite,
                        creditsPerTool: parseInt(e.target.value) || 10,
                      },
                    },
                  });
                  setHasChanges(true);
                }}
                className={`w-32 px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Tool selection */}
            <div>
              <p
                className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
              >
                Tools to Grant ({localConfig.products.gptSuite.toolSlugs.length} selected)
              </p>
              <div className="flex flex-wrap gap-2">
                {(aiTools || []).map((tool) => {
                  const isIncluded = localConfig.products.gptSuite.toolSlugs.includes(tool.slug);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToggleTool(tool.slug)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isIncluded
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
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
        </div>
      </div>
    </div>
  );
};

export default SprintProductConfigEditor;
