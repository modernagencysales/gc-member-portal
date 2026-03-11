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
import Sidebar from '../../components/bootcamp/Sidebar';
import Breadcrumbs from '../../components/bootcamp/Breadcrumbs';
import CourseDashboard from '../../components/bootcamp/CourseDashboard';
import CommandPalette from '../../components/bootcamp/CommandPalette';
import CourseOnboarding from '../../components/bootcamp/CourseOnboarding';
import VirtualLessonRouter from '../../components/bootcamp/VirtualLessonRouter';
import {
  OnboardingLayout,
  OnboardingWelcome,
  OnboardingSurvey,
  OnboardingAITools,
  OnboardingComplete,
} from '../../components/bootcamp/onboarding';
import {
  FunnelAccessExpiredScreen,
  FunnelNudgeBanner,
  FunnelNudgeUrgent,
  FunnelNudgeStickyBar,
  FunnelNudgeModal,
} from '../../components/bootcamp/funnel-access';
import SubscriptionBanner from '../../components/bootcamp/SubscriptionBanner';
import SubscriptionModal from '../../components/bootcamp/SubscriptionModal';
import RedeemCodeModal from '../../components/bootcamp/RedeemCodeModal';
import { StudentSettingsModal } from '../../components/bootcamp/settings';
import { FeedbackWidget } from '../../components/feedback/FeedbackWidget';
import Login from '../../components/bootcamp/Login';
import Register from '../../components/bootcamp/Register';
import { Menu, X, Terminal, Users } from 'lucide-react';
import type { ProgressSnapshot } from '../../hooks/useBootcampCurriculum';
import type { User } from '../../types';

// ─── Component ──────────────────────────────────────────────────────────────

const BootcampApp: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for invite code in URL at render time for <Register /> initialCode prop.
  // NOTE: This duplicates the read inside useBootcampAuth — the hook uses the
  // code for auto-redeem logic, but the component also needs it before the hook runs.
  const inviteCodeFromUrl = searchParams.get('code');

  // ─── UI-only state (stays in BootcampApp) ──────────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('gtm_os_theme') === 'dark';
  });
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Stable callback refs so hooks can call functions defined later in the component
  // without temporal dead zone errors. Updated on every render (see bottom of hook block).
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
  } = useBootcampAuth({
    loadUserDataRef,
    refetchGrantsRef,
    setLoading,
  });

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

  // Wire callback refs — updated on every render so hooks always see latest values.
  onProgressLoadedRef.current = setProgressFromLoad;

  const {
    onboardingStep,
    completedOnboardingSteps,
    surveyData,
    needsOnboarding,
    settings,
    isSurveyPending,
    goToStep,
    handleWelcomeContinue,
    handleSurveySave,
    handleSurveyComplete,
    handleAIToolsContinue,
    handleEnterCurriculum,
    calculateOnboardingProgress,
  } = useBootcampOnboarding({ bootcampStudent, setUser, setBootcampStudent, user });

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

  // Wire remaining callback refs.
  loadUserDataRef.current = loadUserData;
  refetchGrantsRef.current = refetchGrants;

  // ─── Effects ─────────────────────────────────────────────────────────────

  // Reload curriculum when active enrollment changes.
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

  // Cmd+K to open command palette.
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

  const handleShowRegister = () => setShowRegister(true);

  const handleBackToLogin = () => {
    setShowRegister(false);
    setSearchParams({});
  };

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

  // ─── Render: loading / auth gates ────────────────────────────────────────

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
          onBackToLogin={handleBackToLogin}
        />
      );
    }
    return <Login onLogin={handleLogin} onRegisterClick={handleShowRegister} />;
  }

  // ─── Render: onboarding flows ─────────────────────────────────────────────

  if (needsOnboarding) {
    return (
      <OnboardingLayout
        currentStep={onboardingStep}
        completedSteps={completedOnboardingSteps}
        totalProgress={calculateOnboardingProgress()}
        studentName={bootcampStudent?.name}
        onStepClick={goToStep}
      >
        {onboardingStep === 'welcome' && (
          <OnboardingWelcome
            studentName={bootcampStudent?.name}
            welcomeMessage={
              typeof settings?.welcomeMessage === 'string' ? settings.welcomeMessage : undefined
            }
            videoUrl={
              typeof settings?.introVideoUrl === 'string' ? settings.introVideoUrl : undefined
            }
            onContinue={handleWelcomeContinue}
          />
        )}
        {onboardingStep === 'survey' && (
          <OnboardingSurvey
            initialData={surveyData}
            onSave={handleSurveySave}
            onComplete={handleSurveyComplete}
            isLoading={isSurveyPending}
            studentEmail={bootcampStudent?.email}
          />
        )}
        {onboardingStep === 'ai-tools' && (
          <OnboardingAITools
            title={typeof settings?.aiToolsTitle === 'string' ? settings.aiToolsTitle : undefined}
            subtitle={
              typeof settings?.aiToolsSubtitle === 'string' ? settings.aiToolsSubtitle : undefined
            }
            infoTitle={
              typeof settings?.aiToolsInfoTitle === 'string' ? settings.aiToolsInfoTitle : undefined
            }
            infoText={
              typeof settings?.aiToolsInfoText === 'string' ? settings.aiToolsInfoText : undefined
            }
            onContinue={handleAIToolsContinue}
            onBack={() => goToStep('survey')}
          />
        )}
        {onboardingStep === 'complete' && (
          <OnboardingComplete
            studentName={bootcampStudent?.name}
            onEnterCurriculum={handleEnterCurriculum}
          />
        )}
      </OnboardingLayout>
    );
  }

  if (
    activeEnrollment &&
    checkEnrollmentOnboarding(activeEnrollment.cohortId) &&
    activeEnrollment.cohort.onboardingConfig &&
    !showDashboard
  ) {
    return (
      <CourseOnboarding
        cohortName={activeEnrollment.cohort.sidebarLabel || activeEnrollment.cohort.name}
        config={activeEnrollment.cohort.onboardingConfig}
        studentName={bootcampStudent?.name}
        studentEmail={bootcampStudent?.email}
        onComplete={handleCourseOnboardingComplete}
        onSaveSurvey={(data, complete) => {
          if (bootcampStudent) {
            // surveyMutation is owned by useBootcampOnboarding; re-use handleSurveySave
            // for save (step 0) and handleSurveyComplete for final (complete=true)
            if (complete) handleSurveyComplete(data);
            else handleSurveySave(data, 0);
          }
        }}
        isSurveyLoading={isSurveyPending}
      />
    );
  }

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

  // ─── Render: curriculum error / loading ────────────────────────────────────

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

  // ─── Render: main curriculum view ─────────────────────────────────────────

  const currentWeek = courseData.weeks.find(
    (w) =>
      w.lessons.some((l) => l.id === currentLesson.id) || currentLesson.id === `${w.id}:checklist`
  );

  const allLessons = courseData.weeks.flatMap((w) => w.lessons);
  const currentLessonIdx = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentLessonIdx > 0 ? allLessons[currentLessonIdx - 1] : null;
  const nextLesson =
    currentLessonIdx >= 0 && currentLessonIdx < allLessons.length - 1
      ? allLessons[currentLessonIdx + 1]
      : null;

  const courseName =
    activeEnrollment?.cohort?.sidebarLabel || activeEnrollment?.cohort?.name || user.cohort;
  const isVirtualPage =
    currentLesson.id.startsWith('virtual:') || currentLesson.id === 'my-blueprint';
  const breadcrumbSegments = [
    ...(enrollments.length > 1
      ? [{ label: 'Dashboard', onClick: () => setShowDashboard(true) }]
      : []),
    ...(!isVirtualPage && courseName
      ? [{ label: courseName, onClick: () => handleSelectCourse(activeCourseId || null) }]
      : []),
    ...(!isVirtualPage && currentWeek ? [{ label: currentWeek.title }] : []),
    { label: currentLesson.title.replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '').trim() },
  ];

  return (
    <div
      className={`flex flex-col h-screen font-sans transition-colors duration-300 ${
        isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'
      }`}
    >
      <div className="bg-zinc-900 text-zinc-400 text-xs py-1.5 px-4 hidden md:flex items-center justify-center gap-2 font-medium z-50">
        <Users size={12} /> {user.cohort} • {user.email}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-40 flex items-center px-4 justify-between">
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
            Modern Agency Sales
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-900 dark:text-zinc-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <Sidebar
          data={
            user?.status === 'Lead Magnet' && grantedWeekIds
              ? {
                  ...courseData,
                  weeks: courseData.weeks.filter((w) => grantedWeekIds.includes(w.id)),
                }
              : courseData
          }
          currentLessonId={currentLesson.id}
          onSelectLesson={(lesson) => {
            setShowDashboard(false);
            setCurrentLesson(lesson);
          }}
          isOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          completedItems={completedItems}
          user={user}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          aiTools={aiTools}
          onOpenSettings={bootcampStudent ? () => setShowSettingsModal(true) : undefined}
          hasBlueprint={!!bootcampStudent?.prospectId}
          grantedTools={grantedTools}
          grantedWeekIds={grantedWeekIds}
          onRedeemCode={
            user?.status === 'Lead Magnet' || user?.status === 'Sprint + AI Tools'
              ? () => setShowRedeemModal(true)
              : undefined
          }
          funnelAccess={funnelAccess.isFunnelAccess ? funnelAccess : undefined}
          calcomUrl={calcomUrl}
          enrollments={enrollments}
          activeCourseId={activeCourseId}
          onSelectCourse={handleSelectCourse}
          showDashboard={showDashboard}
        />

        <main className="flex-1 h-full overflow-y-auto pt-14 md:pt-0 bg-white dark:bg-zinc-950 transition-colors duration-300">
          {showDashboard && enrollments.length > 1 ? (
            <div className="p-6 md:p-10 lg:p-12">
              <CourseDashboard
                enrollments={enrollments}
                onSelectCourse={(courseId) => {
                  setShowDashboard(false);
                  setActiveCourseId(courseId);
                }}
                userName={bootcampStudent?.name || user?.name}
              />
            </div>
          ) : (
            <div className="p-6 md:p-10 lg:p-12">
              <Breadcrumbs segments={breadcrumbSegments} />

              {/* Sprint + AI Tools nudge banners */}
              {funnelAccess.nudgeTier === 'urgent' && (
                <FunnelNudgeUrgent
                  userEmail={bootcampStudent?.email}
                  calcomUrl={calcomUrl}
                  daysRemaining={funnelAccess.daysRemaining}
                />
              )}
              {funnelAccess.nudgeTier === 'persistent' && (
                <FunnelNudgeBanner
                  userEmail={bootcampStudent?.email}
                  calcomUrl={calcomUrl}
                  daysRemaining={funnelAccess.daysRemaining}
                />
              )}

              {/* Non-funnel subscription banner */}
              {!funnelAccess.isFunnelAccess && accessState === 'expiring' && !dismissedBanner && (
                <SubscriptionBanner
                  daysRemaining={daysRemaining || 0}
                  onSubscribe={() => setShowSubscriptionModal(true)}
                  onDismiss={() => setDismissedBanner(true)}
                />
              )}

              <VirtualLessonRouter
                currentLesson={currentLesson}
                currentWeek={currentWeek}
                bootcampStudent={bootcampStudent}
                completedItems={completedItems}
                proofOfWork={proofOfWork}
                taskNotes={taskNotes}
                onToggleItem={toggleActionItem}
                onUpdateProof={updateProofOfWork}
                onUpdateNote={updateTaskNote}
                isWeekSubmitted={currentWeek ? submittedWeeks[currentWeek.id] : false}
                onWeekSubmit={handleWeekSubmit}
                onSelectLesson={setCurrentLesson}
                prevLesson={prevLesson}
                nextLesson={nextLesson}
              />
            </div>
          )}
        </main>
      </div>

      {/* Sprint + AI Tools sticky bar */}
      {(funnelAccess.nudgeTier === 'persistent' || funnelAccess.nudgeTier === 'urgent') && (
        <FunnelNudgeStickyBar
          userEmail={bootcampStudent?.email}
          calcomUrl={calcomUrl}
          daysRemaining={funnelAccess.daysRemaining}
          isUrgent={funnelAccess.nudgeTier === 'urgent'}
        />
      )}

      {/* Sprint + AI Tools urgent modal */}
      {funnelAccess.nudgeTier === 'urgent' && (
        <FunnelNudgeModal
          userEmail={bootcampStudent?.email}
          calcomUrl={calcomUrl}
          daysRemaining={funnelAccess.daysRemaining}
        />
      )}

      {bootcampStudent && !funnelAccess.isFunnelAccess && (
        <SubscriptionModal
          isOpen={showSubscriptionModal || accessState === 'expired'}
          onClose={() => setShowSubscriptionModal(false)}
          studentId={bootcampStudent.id}
          studentEmail={bootcampStudent.email}
        />
      )}

      {bootcampStudent && (
        <StudentSettingsModal
          student={bootcampStudent}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onUpdate={handleStudentUpdate}
        />
      )}

      {bootcampStudent && (
        <RedeemCodeModal
          isOpen={showRedeemModal}
          onClose={() => setShowRedeemModal(false)}
          studentId={bootcampStudent.id}
          onSuccess={() => refetchGrants()}
        />
      )}

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        courseData={courseData}
        aiTools={aiTools || []}
        onSelectLesson={(lesson) => {
          setShowDashboard(false);
          setCurrentLesson(lesson);
        }}
        onShowDashboard={() => setShowDashboard(true)}
        onOpenSettings={bootcampStudent ? () => setShowSettingsModal(true) : undefined}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        hasMultipleCourses={enrollments.length > 1}
      />

      <FeedbackWidget
        userEmail={bootcampStudent?.email ?? user?.email ?? null}
        userId={bootcampStudent?.id ?? null}
      />
    </div>
  );
};

export default BootcampApp;
