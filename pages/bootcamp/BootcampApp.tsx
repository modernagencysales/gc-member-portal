import React, { useState, useEffect } from 'react';
import { fetchCourseData, verifyUser } from '../../services/airtable';
import Sidebar from '../../components/bootcamp/Sidebar';
import LessonView from '../../components/bootcamp/LessonView';
import Login from '../../components/bootcamp/Login';
import { CourseData, Lesson, User } from '../../types';
import { Menu, X, Terminal, Users } from 'lucide-react';

const BootcampApp: React.FC = () => {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('gtm_os_theme') === 'dark';
  });

  const [user, setUser] = useState<User | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set<string>());
  const [proofOfWork, setProofOfWork] = useState<Record<string, string>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('lms_user_obj');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          await loadUserData(parsedUser);
        } catch (e) {
          localStorage.removeItem('lms_user_obj');
        }
      }
      setLoading(false);
    };
    init();
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

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('lms_user_obj', JSON.stringify(newUser));
    loadUserData(newUser);
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Terminal size={32} className="animate-pulse text-slate-300 dark:text-slate-700" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;
  if (!courseData || !currentLesson) return <div className="p-8">Syncing content...</div>;

  const currentWeek = courseData.weeks.find(
    (w) =>
      w.lessons.some((l) => l.id === currentLesson.id) || currentLesson.id === `${w.id}:checklist`
  );

  return (
    <div
      className={`flex flex-col h-screen font-sans transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      <div className="bg-slate-900 text-slate-400 text-[9px] py-1 px-4 flex items-center justify-center gap-2 font-bold uppercase tracking-[0.2em] z-50">
        <Users size={10} /> {user.cohort.toUpperCase()} • {user.email}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center px-4 justify-between">
          <span className="font-bold text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-200">
            GTM OS
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-900 dark:text-slate-100"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
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

        <main className="flex-1 h-full overflow-y-auto pt-14 md:pt-0 bg-white dark:bg-slate-950 transition-colors duration-300">
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
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BootcampApp;
