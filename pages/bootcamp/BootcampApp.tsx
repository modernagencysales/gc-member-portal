import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchCourseData } from '../../services/airtable';
import {
  verifyBootcampStudent,
  saveBootcampStudentSurvey,
  fetchAllBootcampSettings,
  completeStudentOnboarding,
} from '../../services/bootcamp-supabase';
import Sidebar from '../../components/bootcamp/Sidebar';
import LessonView from '../../components/bootcamp/LessonView';
import Login from '../../components/bootcamp/Login';
import Register from '../../components/bootcamp/Register';
import {
  OnboardingLayout,
  OnboardingWelcome,
  OnboardingSurvey,
  OnboardingAITools,
  OnboardingComplete,
} from '../../components/bootcamp/onboarding';
import { CourseData, Lesson, User } from '../../types';
import {
  BootcampStudent,
  BootcampSurveyFormData,
  OnboardingStep,
} from '../../types/bootcamp-types';
import { queryKeys } from '../../lib/queryClient';
import { Menu, X, Terminal, Users } from 'lucide-react';

const BootcampApp: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for invite code in URL
  const inviteCodeFromUrl = searchParams.get('code');
  const _isRegisterPath = window.location.pathname.includes('/register');

  // Registration mode state - check URL directly on init
  const [showRegister, setShowRegister] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get('code') || window.location.pathname.includes('/register');
  });

  // Legacy state for curriculum
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('gtm_os_theme') === 'dark';
  });

  // User state (can be legacy Airtable user or Supabase student)
  const [user, setUser] = useState<User | null>(null);
  const [bootcampStudent, setBootcampStudent] = useState<BootcampStudent | null>(null);

  // Onboarding flow state
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [completedOnboardingSteps, setCompletedOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [surveyData, setSurveyData] = useState<BootcampSurveyFormData>({});

  // Legacy progress state
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set<string>());
  const [proofOfWork, setProofOfWork] = useState<Record<string, string>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('lms_user_obj');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Try to find in Supabase first
          const student = await verifyBootcampStudent(parsedUser.email);
          if (student) {
            setBootcampStudent(student);
          }

          await loadUserData(parsedUser);
        } catch {
          localStorage.removeItem('lms_user_obj');
        }
      }
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStorageKey = (email: string) => {
    const domain = email.split('@')[1] || 'global';
    return `lms_progress_v2_${domain}`;
  };

  const loadUserData = async (activeUser: User) => {
    setLoading(true);

    const storageKey = getStorageKey(activeUser.email);
    const storedProgress = localStorage.getItem(storageKey);

    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress);
        if (parsed.items) setCompletedItems(new Set<string>(parsed.items));
        if (parsed.proof) setProofOfWork(parsed.proof);
        if (parsed.notes) setTaskNotes(parsed.notes);
        if (parsed.submitted) setSubmittedWeeks(parsed.submitted);
      } catch (e) {
        console.error('Progress error', e);
      }
    } else {
      setCompletedItems(new Set());
      setProofOfWork({});
      setTaskNotes({});
      setSubmittedWeeks({});
    }

    const data = await fetchCourseData(activeUser.cohort, activeUser.email);
    setCourseData(data);

    if (data.weeks.length > 0 && data.weeks[0].lessons.length > 0) {
      setCurrentLesson(data.weeks[0].lessons[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('gtm_os_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const saveProgress = (
    items: Set<string>,
    proof: Record<string, string>,
    notes: Record<string, string>,
    submitted: Record<string, boolean>
  ) => {
    if (!user) return;
    const payload = { items: Array.from(items), proof, notes, submitted };
    localStorage.setItem(getStorageKey(user.email), JSON.stringify(payload));
  };

  const toggleActionItem = (id: string) => {
    const newSet = new Set<string>(completedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCompletedItems(newSet);
    saveProgress(newSet, proofOfWork, taskNotes, submittedWeeks);
  };

  const updateProofOfWork = (id: string, proof: string) => {
    const newProof = { ...proofOfWork, [id]: proof };
    setProofOfWork(newProof);
    saveProgress(completedItems, newProof, taskNotes, submittedWeeks);
  };

  const updateTaskNote = (id: string, note: string) => {
    const newNotes = { ...taskNotes, [id]: note };
    setTaskNotes(newNotes);
    saveProgress(completedItems, proofOfWork, newNotes, submittedWeeks);
  };

  const handleWeekSubmit = (weekId: string) => {
    const newSubmitted = { ...submittedWeeks, [weekId]: true };
    setSubmittedWeeks(newSubmitted);
    saveProgress(completedItems, proofOfWork, taskNotes, newSubmitted);
  };

  const handleLogin = async (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('lms_user_obj', JSON.stringify(newUser));

    // Check if user exists in Supabase
    const student = await verifyBootcampStudent(newUser.email);
    if (student) {
      setBootcampStudent(student);
    }

    loadUserData(newUser);
  };

  const handleRegister = async (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('lms_user_obj', JSON.stringify(newUser));

    // Get the newly created student from Supabase
    const student = await verifyBootcampStudent(newUser.email);
    if (student) {
      setBootcampStudent(student);
    }

    // Clear the invite code from URL
    setSearchParams({});

    loadUserData(newUser);
  };

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

  // Curriculum loading
  if (!courseData || !currentLesson) return <div className="p-8">Syncing content...</div>;

  const currentWeek = courseData.weeks.find(
    (w) =>
      w.lessons.some((l) => l.id === currentLesson.id) || currentLesson.id === `${w.id}:checklist`
  );

  // Main curriculum view
  return (
    <div
      className={`flex flex-col h-screen font-sans transition-colors duration-300 ${
        isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'
      }`}
    >
      <div className="bg-zinc-900 text-zinc-400 text-xs py-1.5 px-4 flex items-center justify-center gap-2 font-medium z-50">
        <Users size={12} /> {user.cohort} • {user.email}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-40 flex items-center px-4 justify-between">
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">GTM OS</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-900 dark:text-zinc-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <Sidebar
          data={courseData}
          currentLessonId={currentLesson.id}
          onSelectLesson={setCurrentLesson}
          isOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          completedItems={completedItems}
          user={user}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />

        <main className="flex-1 h-full overflow-y-auto pt-14 md:pt-0 bg-white dark:bg-zinc-950 transition-colors duration-300">
          <div className="p-6 md:p-10 lg:p-14">
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
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BootcampApp;
