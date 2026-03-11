import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { completeEnrollmentOnboarding } from '../../services/lms-supabase';
import {
  saveBootcampStudentSurvey,
  fetchAllBootcampSettings,
  completeStudentOnboarding,
} from '../../services/bootcamp-supabase';
import { useBootcampAuth } from '../../hooks/useBootcampAuth';
import { useBootcampCurriculum } from '../../hooks/useBootcampCurriculum';
import { useBootcampProgress } from '../../hooks/useBootcampProgress';
import Sidebar from '../../components/bootcamp/Sidebar';
import LessonView from '../../components/bootcamp/LessonView';
import Breadcrumbs from '../../components/bootcamp/Breadcrumbs';
import LessonNavigation from '../../components/bootcamp/LessonNavigation';
import MyPosts from '../../components/bootcamp/MyPosts';
import Login from '../../components/bootcamp/Login';
import Register from '../../components/bootcamp/Register';
import CourseDashboard from '../../components/bootcamp/CourseDashboard';
import CommandPalette from '../../components/bootcamp/CommandPalette';
import CourseOnboarding from '../../components/bootcamp/CourseOnboarding';
import {
  OnboardingLayout,
  OnboardingWelcome,
  OnboardingSurvey,
  OnboardingAITools,
  OnboardingComplete,
} from '../../components/bootcamp/onboarding';
import { useSubscription } from '../../hooks/useSubscription';
import { useFunnelAccess } from '../../hooks/useFunnelAccess';
import { useActiveAITools } from '../../hooks/useChatHistory';
import { useStudentGrants } from '../../hooks/useStudentGrants';
import { useEnrollments } from '../../hooks/useEnrollments';
import SubscriptionBanner from '../../components/bootcamp/SubscriptionBanner';
import SubscriptionModal from '../../components/bootcamp/SubscriptionModal';
import {
  FunnelAccessExpiredScreen,
  FunnelNudgeBanner,
  FunnelNudgeUrgent,
  FunnelNudgeStickyBar,
  FunnelNudgeModal,
} from '../../components/bootcamp/funnel-access';
import RedeemCodeModal from '../../components/bootcamp/RedeemCodeModal';
import { StudentSettingsModal } from '../../components/bootcamp/settings';
import { FeedbackWidget } from '../../components/feedback/FeedbackWidget';
import { logError } from '../../lib/logError';
import type { User } from '../../types';
import type { ProgressSnapshot } from '../../hooks/useBootcampCurriculum';
import { BootcampSurveyFormData, OnboardingStep } from '../../types/bootcamp-types';
import { queryKeys } from '../../lib/queryClient';
import { Menu, X, Terminal, Users, AlertCircle } from 'lucide-react';
import ErrorBoundary from '../../components/shared/ErrorBoundary';

const TamBuilder = lazy(() => import('../../components/tam/TamBuilder'));
const ConnectionQualifier = lazy(
  () => import('../../components/bootcamp/connection-qualifier/ConnectionQualifier')
);
const InfrastructurePage = lazy(
  () => import('../../components/bootcamp/infrastructure/InfrastructurePage')
);
const ColdEmailRecipesPage = lazy(
  () => import('../../components/bootcamp/cold-email-recipes/ColdEmailRecipesPage')
);
const EmailEnrichmentPage = lazy(
  () => import('../../components/bootcamp/email-enrichment/EmailEnrichmentPage')
);
const IntroOffer = lazy(() => import('../../components/bootcamp/IntroOffer'));

const BootcampApp: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for invite code in URL.
  // NOTE: This duplicates the read inside useBootcampAuth — the hook uses the
  // code for auto-redeem logic, but the component also needs it here at render
  // time to pass as `initialCode` to <Register /> before the hook has run.
  const inviteCodeFromUrl = searchParams.get('code');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('gtm_os_theme') === 'dark';
  });

  // Stable callback refs so hooks can call functions defined later in the component
  // without temporal dead zone errors. Updated on every render (see bottom of hook block).
  const onProgressLoadedRef = useRef<((snapshot: ProgressSnapshot) => void) | undefined>(undefined);
  const loadUserDataRef = useRef<((u: User) => void) | undefined>(undefined);
  const refetchGrantsRef = useRef<(() => void) | undefined>(undefined);

  // Curriculum state — managed by hook
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

  // Auth state — managed by hook
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

  // Progress state — managed by hook. Depends on getStorageKey (curriculum) and
  // user?.email (auth). Both are available by this point in the render order.
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

  // Wire callback refs. Updated on every render so hooks always see the latest values.
  onProgressLoadedRef.current = setProgressFromLoad;

  // Onboarding flow state
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [completedOnboardingSteps, setCompletedOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [surveyData, setSurveyData] = useState<BootcampSurveyFormData>({});

  // Subscription UI state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Subscription access state - pass null for cohort until we fetch it (gives unlimited access)
  const { accessState, daysRemaining } = useSubscription(bootcampStudent, null);

  // Sprint + AI Tools nudge state
  const funnelAccess = useFunnelAccess(bootcampStudent);

  // Fetch AI tools for Resources section (global, all cohorts)
  const { data: aiTools } = useActiveAITools();

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Redeem code modal state
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Student grants for Lead Magnet users
  const { grantedTools, grantedWeekIds, refetchGrants } = useStudentGrants(
    bootcampStudent?.id,
    user?.status || 'Full Access'
  );

  // Multi-course enrollment state
  const {
    enrollments,
    isLoading: enrollmentsLoading,
    activeCourseId,
    setActiveCourseId,
    activeEnrollment,
    needsOnboarding: checkEnrollmentOnboarding,
    refetch: refetchEnrollments,
  } = useEnrollments(bootcampStudent?.id || null);

  // Dashboard view state (null activeCourseId = show dashboard)
  const [showDashboard, setShowDashboard] = useState(false);

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: queryKeys.bootcampSettings(),
    queryFn: fetchAllBootcampSettings,
    enabled: !!bootcampStudent && !bootcampStudent.onboardingCompletedAt,
  });

  // Survey mutation
  const surveyMutation = useMutation({
    mutationFn: ({ data, complete }: { data: BootcampSurveyFormData; complete: boolean }) =>
      saveBootcampStudentSurvey(bootcampStudent!.id, data, complete),
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: () => completeStudentOnboarding(bootcampStudent!.id),
    onSuccess: (updatedStudent) => {
      setBootcampStudent(updatedStudent);
      queryClient.invalidateQueries({ queryKey: ['bootcamp', 'student'] });
    },
  });

  // Check if student needs onboarding
  const needsOnboarding =
    bootcampStudent &&
    bootcampStudent.status === 'Onboarding' &&
    !bootcampStudent.onboardingCompletedAt;

  // Wire up callback refs so useBootcampAuth can call loadUserData and refetchGrants
  // after they are defined. These refs are updated on every render.
  loadUserDataRef.current = loadUserData;
  refetchGrantsRef.current = refetchGrants;

  // Reload curriculum when active enrollment changes
  useEffect(() => {
    if (!user || !activeEnrollment || showDashboard) return;
    // Load curriculum for the selected enrollment's cohort
    loadUserData(user, activeEnrollment.cohort.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEnrollment?.cohortId, showDashboard]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('gtm_os_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Cmd+K to open command palette
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

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
    setSearchParams({});
  };

  // Onboarding flow handlers
  const goToStep = useCallback((step: OnboardingStep) => {
    setOnboardingStep(step);
  }, []);

  const completeStep = useCallback((step: OnboardingStep) => {
    setCompletedOnboardingSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, []);

  const handleWelcomeContinue = () => {
    completeStep('welcome');
    goToStep('survey');
  };

  const handleSurveySave = (data: BootcampSurveyFormData, _step: number) => {
    setSurveyData(data);
    if (bootcampStudent) {
      surveyMutation.mutate({ data, complete: false });
    }
  };

  const handleSurveyComplete = (data: BootcampSurveyFormData) => {
    setSurveyData(data);
    if (bootcampStudent) {
      surveyMutation.mutate({ data, complete: true });
    }
    completeStep('survey');

    // Check if AI tools should be shown
    const showAITools = settings?.aiToolsVisible !== false;
    goToStep(showAITools ? 'ai-tools' : 'complete');
  };

  const handleAIToolsContinue = () => {
    completeStep('ai-tools');
    goToStep('complete');
  };

  const handleEnterCurriculum = async () => {
    try {
      // Mark onboarding as complete
      const updatedStudent = await completeOnboardingMutation.mutateAsync();

      // Update user state with correct access level for curriculum view
      if (user && updatedStudent) {
        const updatedUser: User = {
          ...user,
          status: updatedStudent.accessLevel || 'Full Access',
        };
        setUser(updatedUser);
        localStorage.setItem('lms_user_obj', JSON.stringify(updatedUser));
      }

      completeStep('complete');
    } catch (error) {
      logError('BootcampApp:enterCurriculum', error);
    }
  };

  // Calculate onboarding progress percentage
  const calculateOnboardingProgress = () => {
    const steps: OnboardingStep[] = ['welcome', 'survey', 'ai-tools', 'complete'];
    const completed = completedOnboardingSteps.length;
    const currentIndex = steps.indexOf(onboardingStep);
    const progress = Math.round(
      ((currentIndex + (completed > currentIndex ? 1 : 0)) / steps.length) * 100
    );
    return Math.min(progress, 100);
  };

  // Handle course selection from sidebar
  const handleSelectCourse = (courseId: string | null) => {
    if (courseId === null) {
      setShowDashboard(true);
    } else {
      setShowDashboard(false);
      setActiveCourseId(courseId);
    }
  };

  // Handle per-enrollment onboarding completion
  const handleCourseOnboardingComplete = async () => {
    if (!bootcampStudent || !activeCourseId) return;
    await completeEnrollmentOnboarding(bootcampStudent.id, activeCourseId);
    refetchEnrollments();
  };

  // Loading state
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

  // Login or Register screen
  if (!user) {
    // Check URL directly at render time for invite code
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

  // Onboarding flow for new students
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
            isLoading={surveyMutation.isPending}
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

  // Per-enrollment onboarding for active course
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
            surveyMutation.mutate({ data, complete });
          }
        }}
        isSurveyLoading={surveyMutation.isPending}
      />
    );
  }

  // Sprint + AI Tools lockout - full-page takeover when expired
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

  // Curriculum loading
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

  const currentWeek = courseData.weeks.find(
    (w) =>
      w.lessons.some((l) => l.id === currentLesson.id) || currentLesson.id === `${w.id}:checklist`
  );

  // Compute flattened lesson list for prev/next navigation
  const allLessons = courseData.weeks.flatMap((w) => w.lessons);
  const currentLessonIdx = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentLessonIdx > 0 ? allLessons[currentLessonIdx - 1] : null;
  const nextLesson =
    currentLessonIdx >= 0 && currentLessonIdx < allLessons.length - 1
      ? allLessons[currentLessonIdx + 1]
      : null;

  // Breadcrumb segments
  const courseName =
    activeEnrollment?.cohort?.sidebarLabel || activeEnrollment?.cohort?.name || user.cohort;
  const isVirtualPage =
    currentLesson.id.startsWith('virtual:') || currentLesson.id === 'my-blueprint';
  const breadcrumbSegments = [
    ...(enrollments.length > 1
      ? [
          {
            label: 'Dashboard',
            onClick: () => {
              setShowDashboard(true);
            },
          },
        ]
      : []),
    ...(!isVirtualPage && courseName
      ? [
          {
            label: courseName,
            onClick: () => {
              handleSelectCourse(activeCourseId || null);
            },
          },
        ]
      : []),
    ...(!isVirtualPage && currentWeek ? [{ label: currentWeek.title }] : []),
    { label: currentLesson.title.replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '').trim() },
  ];

  // Main curriculum view
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
              {currentLesson.id === 'virtual:tam-builder' ? (
                <ErrorBoundary
                  fallback={
                    <div className="flex flex-col items-center justify-center h-96 gap-4 p-8">
                      <AlertCircle className="w-12 h-12 text-red-500" />
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        TAM Builder encountered an error
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
                        Try reloading the page. If the issue persists, your project data is safe —
                        contact support.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                      >
                        Reload Page
                      </button>
                    </div>
                  }
                >
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-96">
                        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
                      </div>
                    }
                  >
                    <TamBuilder userId={bootcampStudent?.id || ''} />
                  </Suspense>
                </ErrorBoundary>
              ) : currentLesson.id === 'virtual:connection-qualifier' ? (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-96">
                      <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  }
                >
                  <ConnectionQualifier userId={bootcampStudent?.id || ''} />
                </Suspense>
              ) : currentLesson.id === 'virtual:infra-account-setup' ||
                currentLesson.id === 'virtual:infra-email-infra' ||
                currentLesson.id === 'virtual:infrastructure-manager' ? (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-96">
                      <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  }
                >
                  <InfrastructurePage
                    userId={bootcampStudent?.id || ''}
                    mode={
                      currentLesson.id === 'virtual:infra-email-infra'
                        ? 'email_infra'
                        : 'account_setup'
                    }
                  />
                </Suspense>
              ) : currentLesson.id === 'virtual:cold-email-recipes' ? (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-96">
                      <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  }
                >
                  <ColdEmailRecipesPage userId={bootcampStudent?.id || ''} />
                </Suspense>
              ) : currentLesson.id === 'virtual:email-enrichment' ? (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-96">
                      <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  }
                >
                  <EmailEnrichmentPage userId={bootcampStudent?.id || ''} />
                </Suspense>
              ) : currentLesson.id === 'virtual:intro-offer' ? (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-96">
                      <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  }
                >
                  <IntroOffer />
                </Suspense>
              ) : currentLesson.id === 'virtual:my-posts' ? (
                <MyPosts prospectId={bootcampStudent?.prospectId} studentId={bootcampStudent?.id} />
              ) : (
                <LessonView
                  lesson={currentLesson}
                  currentWeek={currentWeek}
                  completedItems={completedItems}
                  proofOfWork={proofOfWork}
                  taskNotes={taskNotes}
                  onToggleItem={toggleActionItem}
                  onUpdateProof={updateProofOfWork}
                  onUpdateNote={updateTaskNote}
                  isWeekSubmitted={currentWeek ? submittedWeeks[currentWeek.id] : false}
                  onWeekSubmit={handleWeekSubmit}
                  onSelectLesson={setCurrentLesson}
                  studentId={bootcampStudent?.id}
                  bootcampStudent={bootcampStudent}
                  prevLesson={prevLesson}
                  nextLesson={nextLesson}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Sprint + AI Tools sticky bar (persistent + urgent tiers) */}
      {(funnelAccess.nudgeTier === 'persistent' || funnelAccess.nudgeTier === 'urgent') && (
        <FunnelNudgeStickyBar
          userEmail={bootcampStudent?.email}
          calcomUrl={calcomUrl}
          daysRemaining={funnelAccess.daysRemaining}
          isUrgent={funnelAccess.nudgeTier === 'urgent'}
        />
      )}

      {/* Sprint + AI Tools urgent modal (once per session) */}
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

      {/* Student Settings Modal */}
      {bootcampStudent && (
        <StudentSettingsModal
          student={bootcampStudent}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onUpdate={handleStudentUpdate}
        />
      )}

      {/* Redeem Code Modal */}
      {bootcampStudent && (
        <RedeemCodeModal
          isOpen={showRedeemModal}
          onClose={() => setShowRedeemModal(false)}
          studentId={bootcampStudent.id}
          onSuccess={() => refetchGrants()}
        />
      )}

      {/* Command Palette */}
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

      {/* Bug Reporting Widget */}
      <FeedbackWidget
        userEmail={bootcampStudent?.email ?? user?.email ?? null}
        userId={bootcampStudent?.id ?? null}
      />
    </div>
  );
};

export default BootcampApp;
