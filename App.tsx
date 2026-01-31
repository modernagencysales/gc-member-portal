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
import AdminBootcampInviteCodesPage from './components/admin/bootcamp/invite-codes/AdminBootcampInviteCodesPage';
import AdminBootcampOnboardingPage from './components/admin/bootcamp/onboarding/AdminBootcampOnboardingPage';
import AdminBootcampSettingsPage from './components/admin/bootcamp/settings/AdminBootcampSettingsPage';
import AdminAIToolsPage from './components/admin/bootcamp/ai-tools/AdminAIToolsPage';
import AdminSurveyResponsesPage from './components/admin/bootcamp/surveys/AdminSurveyResponsesPage';

// LMS Admin Components
import AdminLmsLayout from './components/admin/lms/AdminLmsLayout';
import AdminLmsCohortsPage from './components/admin/lms/cohorts/AdminLmsCohortsPage';
import AdminLmsCurriculumPage from './components/admin/lms/curriculum/AdminLmsCurriculumPage';

// Blueprint Admin Components
import AdminBlueprintsPage from './components/admin/blueprints/AdminBlueprintsPage';

// Blueprint Public Pages
import BlueprintPage from './components/blueprint/BlueprintPage';
import OfferPage from './components/blueprint/OfferPage';
import BlueprintLandingPage from './components/blueprint/BlueprintLandingPage';
import BlueprintThankYou from './components/blueprint/BlueprintThankYou';
import CallBookedThankYou from './components/blueprint/CallBookedThankYou';
import GenericOfferPage from './components/blueprint/GenericOfferPage';

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
        <Route path="blueprints" element={<AdminBlueprintsPage />} />
      </Route>

      {/* Bootcamp Admin Dashboard */}
      <Route path="/admin/bootcamp" element={<AdminBootcampLayout />}>
        <Route index element={<Navigate to="/admin/bootcamp/students" replace />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="surveys" element={<AdminSurveyResponsesPage />} />
        <Route path="cohorts" element={<Navigate to="/admin/lms/cohorts" replace />} />
        <Route path="invite-codes" element={<AdminBootcampInviteCodesPage />} />
        <Route path="onboarding" element={<AdminBootcampOnboardingPage />} />
        <Route path="ai-tools" element={<AdminAIToolsPage />} />
        <Route path="settings" element={<AdminBootcampSettingsPage />} />
      </Route>

      {/* LMS Admin Dashboard */}
      <Route path="/admin/lms" element={<AdminLmsLayout />}>
        <Route index element={<Navigate to="/admin/lms/cohorts" replace />} />
        <Route path="cohorts" element={<AdminLmsCohortsPage />} />
        <Route path="curriculum" element={<AdminLmsCurriculumPage />} />
        <Route path="curriculum/:cohortId" element={<AdminLmsCurriculumPage />} />
      </Route>

      {/* Bootcamp LMS - /bootcamp path */}
      <Route path="/bootcamp/*" element={<BootcampApp />} />

      {/* Blueprint Public Pages (no auth required) */}
      <Route path="/blueprint" element={<BlueprintLandingPage />} />
      <Route path="/blueprint/thank-you" element={<BlueprintThankYou />} />
      <Route path="/blueprint/call-booked" element={<CallBookedThankYou />} />
      <Route path="/blueprint/:slug" element={<BlueprintPage />} />
      <Route path="/blueprint/:slug/offer" element={<OfferPage />} />

      {/* Generic (non-personalized) offer pages for partners/affiliates */}
      <Route path="/offer/:offerType" element={<GenericOfferPage />} />

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
