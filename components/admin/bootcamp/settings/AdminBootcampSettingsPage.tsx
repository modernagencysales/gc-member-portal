import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllBootcampSettings } from '../../../../services/bootcamp-supabase';
import { queryKeys } from '../../../../lib/queryClient';
import { useTheme } from '../../../../context/ThemeContext';
import { useUpdateBootcampSettingMutation } from '../../../../hooks/useBootcampAdminMutations';
import { BootcampSettings } from '../../../../types/bootcamp-types';
import { Settings, Video, Sparkles, Info, Save, Bot } from 'lucide-react';
import FunnelToolPresetsEditor from './FunnelToolPresetsEditor';
import CallGrantConfigEditor from './CallGrantConfigEditor';
import SprintProductConfigEditor from './SprintProductConfigEditor';
import EnrollmentConfigEditor from './EnrollmentConfigEditor';

const AdminBootcampSettingsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [localSettings, setLocalSettings] = useState<Partial<BootcampSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.bootcampSettings(),
    queryFn: fetchAllBootcampSettings,
  });

  const updateMutation = useUpdateBootcampSettingMutation();

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChange = <K extends keyof BootcampSettings>(key: K, value: BootcampSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      for (const [key, value] of Object.entries(localSettings)) {
        if (settings?.[key as keyof BootcampSettings] !== value) {
          console.log(`Saving setting: ${key} = ${value}`);
          await updateMutation.mutateAsync({
            key: key as keyof BootcampSettings,
            value: value as BootcampSettings[keyof BootcampSettings],
          });
        }
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      window.alert('Failed to save settings. Check console for details.');
    }
  };

  if (isLoading) {
    return (
      <div
        className={`p-8 rounded-xl border text-center ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Loading settings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Bootcamp Settings</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Configure onboarding flow and automation settings
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {/* Onboarding Settings */}
        <div
          className={`rounded-xl border overflow-hidden ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div
            className={`px-6 py-4 border-b flex items-center gap-3 ${
              isDarkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <Settings className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
            <h3 className="font-semibold">Onboarding Flow</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* AI Tools Visibility */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                  }`}
                >
                  <Sparkles
                    className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
                  />
                </div>
                <div>
                  <label className="font-medium">Show AI Tools Section</label>
                  <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Display the AI tools showcase during onboarding
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.aiToolsVisible !== false}
                  onChange={(e) => handleChange('aiToolsVisible', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:tranzinc-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-violet-600"></div>
              </label>
            </div>

            {/* Intro Video URL */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
                  }`}
                >
                  <Video className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <div>
                  <label className="font-medium">Intro Video URL</label>
                  <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    YouTube or Loom video shown during onboarding
                  </p>
                </div>
              </div>
              <input
                type="url"
                value={
                  typeof localSettings.introVideoUrl === 'string' ? localSettings.introVideoUrl : ''
                }
                onChange={(e) => handleChange('introVideoUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>

            {/* Welcome Message */}
            <div>
              <label className="font-medium">Welcome Message</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
              >
                Custom message displayed on the welcome screen
              </p>
              <textarea
                value={
                  typeof localSettings.welcomeMessage === 'string'
                    ? localSettings.welcomeMessage
                    : ''
                }
                onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                placeholder="Welcome to the LinkedIn Bootcamp! We're excited to have you here."
                rows={3}
                className={`w-full px-4 py-2.5 rounded-lg border resize-none ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>
          </div>
        </div>

        {/* AI Tools Page Customization */}
        <div
          className={`rounded-xl border overflow-hidden ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div
            className={`px-6 py-4 border-b flex items-center gap-3 ${
              isDarkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <Bot className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h3 className="font-semibold">AI Tools Page</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* AI Tools Title */}
            <div>
              <label className="font-medium">Page Title</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
              >
                Main heading displayed on the AI Tools page
              </p>
              <input
                type="text"
                value={
                  typeof localSettings.aiToolsTitle === 'string' ? localSettings.aiToolsTitle : ''
                }
                onChange={(e) => handleChange('aiToolsTitle', e.target.value)}
                placeholder="Your AI-Powered Toolkit"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>

            {/* AI Tools Subtitle */}
            <div>
              <label className="font-medium">Page Subtitle</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
              >
                Description text shown below the title
              </p>
              <textarea
                value={
                  typeof localSettings.aiToolsSubtitle === 'string'
                    ? localSettings.aiToolsSubtitle
                    : ''
                }
                onChange={(e) => handleChange('aiToolsSubtitle', e.target.value)}
                placeholder="As part of your bootcamp access, you have full access to these AI tools to accelerate your LinkedIn outreach."
                rows={2}
                className={`w-full px-4 py-2.5 rounded-lg border resize-none ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>

            {/* AI Tools Info Title */}
            <div>
              <label className="font-medium">Info Box Title</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
              >
                Title for the info box at the bottom
              </p>
              <input
                type="text"
                value={
                  typeof localSettings.aiToolsInfoTitle === 'string'
                    ? localSettings.aiToolsInfoTitle
                    : ''
                }
                onChange={(e) => handleChange('aiToolsInfoTitle', e.target.value)}
                placeholder="Full Access Included"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>

            {/* AI Tools Info Text */}
            <div>
              <label className="font-medium">Info Box Text</label>
              <p
                className={`text-sm mt-0.5 mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
              >
                Description text shown in the info box
              </p>
              <textarea
                value={
                  typeof localSettings.aiToolsInfoText === 'string'
                    ? localSettings.aiToolsInfoText
                    : ''
                }
                onChange={(e) => handleChange('aiToolsInfoText', e.target.value)}
                placeholder="All AI tools are included with your bootcamp access. You'll learn how to use each one effectively throughout the curriculum."
                rows={2}
                className={`w-full px-4 py-2.5 rounded-lg border resize-none ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>
          </div>
        </div>

        {/* Enrollment Config */}
        <EnrollmentConfigEditor />

        {/* Call Attendance Grants */}
        <CallGrantConfigEditor />

        {/* Sprint Product Delivery */}
        <SprintProductConfigEditor />

        {/* Sprint + AI Tools Tool Presets */}
        <FunnelToolPresetsEditor />

        {/* Manual Tracking Info */}
        <div
          className={`rounded-xl border overflow-hidden ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div
            className={`px-6 py-4 border-b flex items-center gap-3 ${
              isDarkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <Info className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
            <h3 className="font-semibold">Slack & Calendar Tracking</h3>
          </div>
          <div className="p-6">
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-violet-900/20 border-violet-800' : 'bg-violet-50 border-violet-200'
              }`}
            >
              <p className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                In the current version, Slack invites and Calendar additions are tracked manually.
                Use the buttons in the Student Roster to mark when you've manually:
              </p>
              <ul
                className={`mt-3 space-y-2 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
              >
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Invited a student to your Slack workspace
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  Added a student to your Google Calendar events
                </li>
              </ul>
              <p className={`mt-4 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                Automated integrations coming in v2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBootcampSettingsPage;
