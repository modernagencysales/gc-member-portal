import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import GCSidebar from './GCSidebar';
import GCHeader from './GCHeader';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { fetchOnboardingWithProgress } from '../../services/gc-airtable';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/onboarding': 'Onboarding',
  '/tools': 'My Tools',
  '/campaigns': 'Campaigns',
  '/icp': 'ICP & Positioning',
  '/resources': 'Resources',
};

const GCLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState(0);
  const { isDarkMode } = useTheme();
  const { gcMember } = useAuth();
  const location = useLocation();

  const pageTitle = routeTitles[location.pathname] || 'Dashboard';

  // Fetch onboarding progress for sidebar
  useEffect(() => {
    const loadProgress = async () => {
      if (gcMember) {
        try {
          const { totalProgress } = await fetchOnboardingWithProgress(gcMember.id, gcMember.plan);
          setOnboardingProgress(totalProgress);
        } catch (error) {
          console.error('Failed to load onboarding progress:', error);
        }
      }
    };
    loadProgress();
  }, [gcMember]);

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Sidebar */}
      <GCSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onboardingProgress={onboardingProgress}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <GCHeader onMenuClick={() => setSidebarOpen(true)} title={pageTitle} />

        {/* Page Content */}
        <main
          className={`flex-1 overflow-y-auto transition-colors ${
            isDarkMode ? 'bg-slate-950' : 'bg-slate-50'
          }`}
        >
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet context={{ onboardingProgress, setOnboardingProgress }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default GCLayout;

// Hook to access layout context from child pages
export function useLayoutContext() {
  return React.useContext(
    React.createContext<{
      onboardingProgress: number;
      setOnboardingProgress: (progress: number) => void;
    }>({ onboardingProgress: 0, setOnboardingProgress: () => {} })
  );
}
