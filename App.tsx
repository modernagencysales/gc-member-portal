import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Lazy-loaded: Blueprint public pages
const BlueprintLandingPage = lazy(() => import('./components/blueprint/BlueprintLandingPage'));
const BlueprintPage = lazy(() => import('./components/blueprint/BlueprintPage'));
const OfferPage = lazy(() => import('./components/blueprint/OfferPage'));
const BlueprintThankYou = lazy(() => import('./components/blueprint/BlueprintThankYou'));
const CallBookedThankYou = lazy(() => import('./components/blueprint/CallBookedThankYou'));
const GenericOfferPage = lazy(() => import('./components/blueprint/GenericOfferPage'));
const CaseStudiesPage = lazy(() => import('./components/blueprint/CaseStudiesPage'));
const ProgramsPage = lazy(() => import('./components/blueprint/ProgramsPage'));

// Lazy-loaded: GC Portal
const GCLogin = lazy(() => import('./components/gc/GCLogin'));
const GCLayout = lazy(() => import('./components/gc/GCLayout'));
const DashboardHome = lazy(() => import('./components/gc/dashboard/DashboardHome'));
const OnboardingPage = lazy(() => import('./components/gc/onboarding/OnboardingPage'));
const ToolsPage = lazy(() => import('./components/gc/tools/ToolsPage'));
const CampaignsPage = lazy(() => import('./components/gc/campaigns/CampaignsPage'));
const ICPPage = lazy(() => import('./components/gc/icp/ICPPage'));
const ResourcesPage = lazy(() => import('./components/gc/resources/ResourcesPage'));

// Lazy-loaded: Admin
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminToolsPage = lazy(() => import('./components/admin/tools/AdminToolsPage'));
const AdminOnboardingPage = lazy(() => import('./components/admin/onboarding/AdminOnboardingPage'));

// Lazy-loaded: Bootcamp Admin
const AdminBootcampLayout = lazy(() => import('./components/admin/bootcamp/AdminBootcampLayout'));
const AdminStudentsPage = lazy(
  () => import('./components/admin/bootcamp/students/AdminStudentsPage')
);
const AdminBootcampInviteCodesPage = lazy(
  () => import('./components/admin/bootcamp/invite-codes/AdminBootcampInviteCodesPage')
);
const AdminBootcampOnboardingPage = lazy(
  () => import('./components/admin/bootcamp/onboarding/AdminBootcampOnboardingPage')
);
const AdminBootcampSettingsPage = lazy(
  () => import('./components/admin/bootcamp/settings/AdminBootcampSettingsPage')
);
const AdminAIToolsPage = lazy(
  () => import('./components/admin/bootcamp/ai-tools/AdminAIToolsPage')
);
const AdminSurveyResponsesPage = lazy(
  () => import('./components/admin/bootcamp/surveys/AdminSurveyResponsesPage')
);

// Lazy-loaded: LMS Admin
const AdminLmsLayout = lazy(() => import('./components/admin/lms/AdminLmsLayout'));
const AdminLmsCohortsPage = lazy(
  () => import('./components/admin/lms/cohorts/AdminLmsCohortsPage')
);
const AdminLmsCurriculumPage = lazy(
  () => import('./components/admin/lms/curriculum/AdminLmsCurriculumPage')
);

// Lazy-loaded: Blueprint Admin
const AdminBlueprintsPage = lazy(() => import('./components/admin/blueprints/AdminBlueprintsPage'));

// Lazy-loaded: Bootcamp
const BootcampApp = lazy(() => import('./pages/bootcamp/BootcampApp'));
const BootcampJoin = lazy(() => import('./components/bootcamp/BootcampJoin'));

// Lazy-loaded: Affiliate
const ReferralLandingPage = lazy(() => import('./components/affiliate/ReferralLandingPage'));
const AffiliateApply = lazy(() => import('./components/affiliate/AffiliateApply'));
const AffiliateDashboard = lazy(() => import('./components/affiliate/AffiliateDashboard'));
const AffiliateOverview = lazy(() => import('./components/affiliate/AffiliateOverview'));
const AffiliateReferrals = lazy(() => import('./components/affiliate/AffiliateReferrals'));
const AffiliatePayoutsPage = lazy(() => import('./components/affiliate/AffiliatePayoutsPage'));
const AffiliateAssetsPage = lazy(() => import('./components/affiliate/AffiliateAssetsPage'));
const AffiliateSettingsPage = lazy(() => import('./components/affiliate/AffiliateSettingsPage'));
const AffiliateOnboard = lazy(() => import('./components/affiliate/AffiliateOnboard'));
const AdminAffiliatesPage = lazy(() => import('./components/admin/affiliates/AdminAffiliatesPage'));

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-xs font-medium text-zinc-400">Loading...</p>
          </div>
        </div>
      }
    >
      <Routes>
        {/* Public root — opt-in form */}
        <Route path="/" element={<BlueprintLandingPage />} />

        {/* Login page */}
        <Route
          path="/login"
          element={
            isAuthenticated && mode === 'gc' ? <Navigate to="/portal" replace /> : <GCLogin />
          }
        />

        {/* GC Member Portal */}
        <Route
          path="/portal"
          element={
            isAuthenticated && mode === 'gc' ? <GCLayout /> : <Navigate to="/login" replace />
          }
        >
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
          <Route path="affiliates" element={<AdminAffiliatesPage />} />
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

        {/* Affiliate — Public */}
        <Route path="/refer/:slug" element={<ReferralLandingPage />} />
        <Route path="/affiliate/apply" element={<AffiliateApply />} />
        <Route path="/affiliate/onboard" element={<AffiliateOnboard />} />

        {/* Affiliate — Dashboard */}
        <Route path="/affiliate/dashboard" element={<AffiliateDashboard />}>
          <Route index element={<AffiliateOverview />} />
          <Route path="referrals" element={<AffiliateReferrals />} />
          <Route path="payouts" element={<AffiliatePayoutsPage />} />
          <Route path="assets" element={<AffiliateAssetsPage />} />
          <Route path="settings" element={<AffiliateSettingsPage />} />
        </Route>

        {/* Bootcamp Join - smart redirect to current cohort registration */}
        <Route path="/bootcamp/join" element={<BootcampJoin />} />

        {/* Bootcamp LMS - /bootcamp path */}
        <Route path="/bootcamp/*" element={<BootcampApp />} />

        {/* Blueprint Public Pages (no auth required) */}
        <Route path="/blueprint" element={<BlueprintLandingPage />} />
        <Route path="/blueprint/thank-you" element={<BlueprintThankYou />} />
        <Route path="/blueprint/call-booked" element={<CallBookedThankYou />} />
        <Route path="/blueprint/:slug" element={<BlueprintPage />} />
        <Route path="/blueprint/:slug/offer" element={<OfferPage />} />

        {/* Programs / What We Do */}
        <Route path="/programs" element={<ProgramsPage />} />

        {/* Case Studies */}
        <Route path="/case-studies" element={<CaseStudiesPage />} />

        {/* Generic (non-personalized) offer pages for partners/affiliates */}
        <Route path="/offer/:offerType" element={<GenericOfferPage />} />

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
