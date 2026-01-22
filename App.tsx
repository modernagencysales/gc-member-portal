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

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminToolsPage from './components/admin/tools/AdminToolsPage';
import AdminOnboardingPage from './components/admin/onboarding/AdminOnboardingPage';

// Bootcamp Admin Components
import AdminBootcampLayout from './components/admin/bootcamp/AdminBootcampLayout';
import AdminStudentsPage from './components/admin/bootcamp/students/AdminStudentsPage';
import AdminBootcampCohortsPage from './components/admin/bootcamp/cohorts/AdminBootcampCohortsPage';
import AdminBootcampInviteCodesPage from './components/admin/bootcamp/invite-codes/AdminBootcampInviteCodesPage';
import AdminBootcampOnboardingPage from './components/admin/bootcamp/onboarding/AdminBootcampOnboardingPage';
import AdminBootcampSettingsPage from './components/admin/bootcamp/settings/AdminBootcampSettingsPage';
import AdminAIToolsPage from './components/admin/bootcamp/ai-tools/AdminAIToolsPage';

import { useAuth } from './context/AuthContext';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, mode } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-zinc-400">Loading...</p>
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

      {/* Admin Dashboard */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/tools" replace />} />
        <Route path="tools" element={<AdminToolsPage />} />
        <Route path="onboarding" element={<AdminOnboardingPage />} />
      </Route>

      {/* Bootcamp Admin Dashboard */}
      <Route path="/admin/bootcamp" element={<AdminBootcampLayout />}>
        <Route index element={<Navigate to="/admin/bootcamp/students" replace />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="cohorts" element={<AdminBootcampCohortsPage />} />
        <Route path="invite-codes" element={<AdminBootcampInviteCodesPage />} />
        <Route path="onboarding" element={<AdminBootcampOnboardingPage />} />
        <Route path="ai-tools" element={<AdminAIToolsPage />} />
        <Route path="settings" element={<AdminBootcampSettingsPage />} />
      </Route>

      {/* Bootcamp LMS - /bootcamp path */}
      <Route path="/bootcamp/*" element={<BootcampApp />} />

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
