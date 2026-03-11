/**
 * BootcampApp — Root orchestrator for the Bootcamp LMS.
 *
 * Responsibilities: hook calls, auth/loading gates, onboarding gate, funnel-expiry gate,
 * curriculum-load gate. Delegates all rendering to BootcampOnboardingFlow and BootcampLayout.
 *
 * Constraint: never contains JSX beyond gate screens and sub-component delegation.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { completeEnrollmentOnboarding } from '../../services/lms-supabase';
import { useBootcampAuth } from '../../hooks/useBootcampAuth';
import { useBootcampCurriculum } from '../../hooks/useBootcampCurriculum';
import { useBootcampProgress } from '../../hooks/useBootcampProgress';
import { useBootcampOnboarding } from '../../hooks/useBootcampOnboarding';
import { useSubscription } from '../../hooks/useSubscription';
import { useFunnelAccess } from '../../hooks/useFunnelAccess';
import { useActiveAITools } from '../../hooks/useChatHistory';
import { useStudentGrants } from '../../hooks/useStudentGrants';
import { useEnrollments } from '../../hooks/useEnrollments';
import BootcampOnboardingFlow from '../../components/bootcamp/BootcampOnboardingFlow';
import BootcampLayout from '../../components/bootcamp/BootcampLayout';
import Login from '../../components/bootcamp/Login';
import Register from '../../components/bootcamp/Register';
import { FunnelAccessExpiredScreen } from '../../components/bootcamp/funnel-access';
import { Terminal } from 'lucide-react';
import type { ProgressSnapshot } from '../../hooks/useBootcampCurriculum';
import type { User } from '../../types';

// ─── Component ──────────────────────────────────────────────────────────────

const BootcampApp: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Duplicates the read inside useBootcampAuth — component needs it before the hook runs.
  const inviteCodeFromUrl = searchParams.get('code');

  // ─── UI state ─────────────────────────────────────────────────────────────

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('gtm_os_theme') === 'dark'
  );
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Stable refs so hooks can call functions defined later without temporal dead zone errors.
  const onProgressLoadedRef = useRef<((snapshot: ProgressSnapshot) => void) | undefined>(undefined);
  const loadUserDataRef = useRef<((u: User) => void) | undefined>(undefined);
  const refetchGrantsRef = useRef<(() => void) | undefined>(undefined);

  // ─── Hooks ────────────────────────────────────────────────────────────────

  const {
    courseData,
    currentLesson,
    setCurrentLesson,
    loading,
    setLoading,
    loadError,
    loadUserData,
    getStorageKey,
  } = useBootcampCurriculum({
    onProgressLoaded: (snapshot) => onProgressLoadedRef.current?.(snapshot),
  });

  const {
    user,
    setUser,
    bootcampStudent,
    setBootcampStudent,
    showRegister,
    setShowRegister,
    handleLogin,
    handleRegister,
    handleLogout,
    handleStudentUpdate,
  } = useBootcampAuth({ loadUserDataRef, refetchGrantsRef, setLoading });

  const {
    completedItems,
    proofOfWork,
    taskNotes,
    submittedWeeks,
    setProgressFromLoad,
    toggleActionItem,
    updateProofOfWork,
    updateTaskNote,
    handleWeekSubmit,
  } = useBootcampProgress({ userEmail: user?.email ?? null, getStorageKey });

  onProgressLoadedRef.current = setProgressFromLoad;

  const onboardingHook = useBootcampOnboarding({
    bootcampStudent,
    setUser,
    setBootcampStudent,
    user,
  });
  const { accessState, daysRemaining } = useSubscription(bootcampStudent, null);
  const funnelAccess = useFunnelAccess(bootcampStudent);
  const { data: aiTools } = useActiveAITools();
  const { grantedTools, grantedWeekIds, refetchGrants } = useStudentGrants(
    bootcampStudent?.id,
    user?.status || 'Full Access'
  );
  const {
    enrollments,
    activeCourseId,
    setActiveCourseId,
    activeEnrollment,
    needsOnboarding: checkEnrollmentOnboarding,
    refetch: refetchEnrollments,
  } = useEnrollments(bootcampStudent?.id || null);

  loadUserDataRef.current = loadUserData;
  refetchGrantsRef.current = refetchGrants;

  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !activeEnrollment || showDashboard) return;
    loadUserData(user, activeEnrollment.cohort.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEnrollment?.cohortId, showDashboard]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('gtm_os_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSelectCourse = (courseId: string | null) => {
    if (courseId === null) {
      setShowDashboard(true);
    } else {
      setShowDashboard(false);
      setActiveCourseId(courseId);
    }
  };

  const handleCourseOnboardingComplete = async () => {
    if (!bootcampStudent || !activeCourseId) return;
    await completeEnrollmentOnboarding(bootcampStudent.id, activeCourseId);
    refetchEnrollments();
  };

  // ─── Gate: loading / auth ─────────────────────────────────────────────────

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Terminal size={32} className="animate-pulse text-zinc-300 dark:text-zinc-700" />
          <p className="text-xs font-medium text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const urlHasCode = new URLSearchParams(window.location.search).get('code');
    const urlHasRegister = window.location.pathname.includes('/register');
    if (showRegister || urlHasCode || urlHasRegister) {
      return (
        <Register
          initialCode={urlHasCode || inviteCodeFromUrl || undefined}
          onRegister={handleRegister}
          onBackToLogin={() => {
            setShowRegister(false);
            setSearchParams({});
          }}
        />
      );
    }
    return <Login onLogin={handleLogin} onRegisterClick={() => setShowRegister(true)} />;
  }

  // ─── Gate: onboarding ────────────────────────────────────────────────────

  if (
    onboardingHook.needsOnboarding ||
    (activeEnrollment &&
      checkEnrollmentOnboarding(activeEnrollment.cohortId) &&
      activeEnrollment.cohort.onboardingConfig &&
      !showDashboard)
  ) {
    return (
      <BootcampOnboardingFlow
        needsOnboarding={onboardingHook.needsOnboarding}
        activeEnrollment={activeEnrollment}
        checkEnrollmentOnboarding={checkEnrollmentOnboarding}
        showDashboard={showDashboard}
        onboardingStep={onboardingHook.onboardingStep}
        completedOnboardingSteps={onboardingHook.completedOnboardingSteps}
        surveyData={onboardingHook.surveyData}
        settings={onboardingHook.settings}
        isSurveyPending={onboardingHook.isSurveyPending}
        calculateOnboardingProgress={onboardingHook.calculateOnboardingProgress}
        goToStep={onboardingHook.goToStep}
        handleWelcomeContinue={onboardingHook.handleWelcomeContinue}
        handleSurveySave={onboardingHook.handleSurveySave}
        handleSurveyComplete={onboardingHook.handleSurveyComplete}
        handleAIToolsContinue={onboardingHook.handleAIToolsContinue}
        handleEnterCurriculum={onboardingHook.handleEnterCurriculum}
        bootcampStudent={bootcampStudent}
        onCourseOnboardingComplete={handleCourseOnboardingComplete}
      />
    );
  }

  // ─── Gate: funnel expired ─────────────────────────────────────────────────

  const calcomUrl = import.meta.env.VITE_CALCOM_BOOKING_URL || '';
  if (funnelAccess.isExpired) {
    return (
      <FunnelAccessExpiredScreen
        userEmail={bootcampStudent?.email}
        calcomUrl={calcomUrl}
        studentName={bootcampStudent?.name}
      />
    );
  }

  // ─── Gate: curriculum load ────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-red-600 dark:text-red-400">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (!courseData || !currentLesson) return <div className="p-8">Syncing content...</div>;

  // ─── Main curriculum view ─────────────────────────────────────────────────

  return (
    <BootcampLayout
      user={user}
      bootcampStudent={bootcampStudent}
      courseData={courseData}
      currentLesson={currentLesson}
      enrollments={enrollments}
      activeCourseId={activeCourseId}
      activeEnrollment={activeEnrollment}
      completedItems={completedItems}
      proofOfWork={proofOfWork}
      taskNotes={taskNotes}
      submittedWeeks={submittedWeeks}
      grantedTools={grantedTools}
      grantedWeekIds={grantedWeekIds}
      aiTools={aiTools}
      funnelAccess={funnelAccess}
      accessState={accessState}
      daysRemaining={daysRemaining}
      calcomUrl={calcomUrl}
      isDarkMode={isDarkMode}
      mobileMenuOpen={mobileMenuOpen}
      dismissedBanner={dismissedBanner}
      showDashboard={showDashboard}
      showSubscriptionModal={showSubscriptionModal}
      showSettingsModal={showSettingsModal}
      showRedeemModal={showRedeemModal}
      commandPaletteOpen={commandPaletteOpen}
      onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      onDismissBanner={() => setDismissedBanner(true)}
      onSetShowDashboard={setShowDashboard}
      onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
      onCloseSubscriptionModal={() => setShowSubscriptionModal(false)}
      onOpenSettings={() => setShowSettingsModal(true)}
      onCloseSettings={() => setShowSettingsModal(false)}
      onOpenRedeemModal={() => setShowRedeemModal(true)}
      onCloseRedeemModal={() => setShowRedeemModal(false)}
      onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      onCloseCommandPalette={() => setCommandPaletteOpen(false)}
      onSelectLesson={setCurrentLesson}
      onSelectCourse={handleSelectCourse}
      onToggleItem={toggleActionItem}
      onUpdateProof={updateProofOfWork}
      onUpdateNote={updateTaskNote}
      onWeekSubmit={handleWeekSubmit}
      onStudentUpdate={handleStudentUpdate}
      onRefetchGrants={refetchGrants}
      onLogout={handleLogout}
    />
  );
};

export default BootcampApp;
