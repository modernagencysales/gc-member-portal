import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import FunnelView from './FunnelView';
import AttributionView from './AttributionView';
import FunnelConfigView from './FunnelConfigView';

type Tab = 'funnel' | 'attribution' | 'config';

const tabs: { key: Tab; label: string }[] = [
  { key: 'funnel', label: 'Funnel' },
  { key: 'attribution', label: 'Attribution & Revenue' },
  { key: 'config', label: 'Config' },
];

const AdminFunnelPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('funnel');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Funnel Dashboard</h2>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Track leads through the sales funnel, view attribution, and manage configuration
        </p>
      </div>

      {/* Tabs */}
      <div
        className={`flex gap-1 p-1 rounded-lg border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
        }`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? isDarkMode
                  ? 'bg-zinc-800 text-white'
                  : 'bg-white text-zinc-900 shadow-sm'
                : isDarkMode
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'funnel' && <FunnelView />}
      {activeTab === 'attribution' && <AttributionView />}
      {activeTab === 'config' && <FunnelConfigView />}
    </div>
  );
};

export default AdminFunnelPage;
