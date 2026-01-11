import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import BootcampApp from './pages/bootcamp/BootcampApp';

// GC Portal Components (will be created)
import GCLogin from './components/gc/GCLogin';
import GCLayout from './components/gc/GCLayout';
import DashboardHome from './components/gc/dashboard/DashboardHome';
import OnboardingPage from './components/gc/onboarding/OnboardingPage';
import ToolsPage from './components/gc/tools/ToolsPage';
import CampaignsPage from './components/gc/campaigns/CampaignsPage';
import ICPPage from './components/gc/icp/ICPPage';
import ResourcesPage from './components/gc/resources/ResourcesPage';

import { useAuth } from './context/AuthContext';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, mode } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* GC Member Portal - Root path */}
      <Route path="/" element={isAuthenticated && mode === 'gc' ? <GCLayout /> : <GCLogin />}>
        <Route index element={<DashboardHome />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="icp" element={<ICPPage />} />
        <Route path="resources" element={<ResourcesPage />} />
      </Route>

      {/* Bootcamp LMS - /bootcamp path */}
      <Route path="/bootcamp/*" element={<BootcampApp />} />

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
