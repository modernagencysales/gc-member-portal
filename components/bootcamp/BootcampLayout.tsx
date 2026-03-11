/**
 * BootcampLayout — Main curriculum layout shell rendered after all gates pass.
 *
 * Renders: top bar, sidebar, main content area, and the full modal/overlay cluster
 * (SubscriptionModal, StudentSettingsModal, RedeemCodeModal, CommandPalette, FeedbackWidget,
 * funnel nudge overlays).
 *
 * Constraint: owns no state — all booleans and setters are passed in as props.
 * Navigation derivation (breadcrumbs, prev/next lesson) is computed here from the
 * props it already receives, keeping BootcampApp free of that logic.
 */

import React from 'react';
import { Menu, X, Users } from 'lucide-react';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import CourseDashboard from './CourseDashboard';
import CommandPalette from './CommandPalette';
import VirtualLessonRouter from './VirtualLessonRouter';
import {
  FunnelNudgeBanner,
  FunnelNudgeUrgent,
  FunnelNudgeStickyBar,
  FunnelNudgeModal,
} from './funnel-access';
import SubscriptionBanner from './SubscriptionBanner';
import SubscriptionModal from './SubscriptionModal';
import RedeemCodeModal from './RedeemCodeModal';
import { StudentSettingsModal } from './settings';
import { FeedbackWidget } from '../feedback/FeedbackWidget';
import type { User, CourseData, Lesson } from '../../types/bootcamp-types';
import type { BootcampStudent, StudentEnrollment } from '../../types/bootcamp-types';
import type { AITool } from '../../types/chat-types';
import type { FunnelAccessState } from '../../hooks/useFunnelAccess';
import type { StudentGrants } from '../../services/bootcamp-supabase';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface BootcampLayoutProps {
  // Core data
  user: User;
  bootcampStudent: BootcampStudent | null;
  courseData: CourseData;
  currentLesson: Lesson;
  enrollments: StudentEnrollment[];
  activeCourseId: string | null;
  activeEnrollment: StudentEnrollment | null;

  // Progress data
  completedItems: Set<string>;
  proofOfWork: Record<string, string>;
  taskNotes: Record<string, string>;
  submittedWeeks: Record<string, boolean>;
  grantedTools: StudentGrants['tools'] | null;
  grantedWeekIds: string[] | null;
  aiTools: AITool[] | undefined;

  // Access state
  funnelAccess: FunnelAccessState;
  accessState: string | null;
  daysRemaining: number | null;
  calcomUrl: string;

  // UI state
  isDarkMode: boolean;
  mobileMenuOpen: boolean;
  dismissedBanner: boolean;
  showDashboard: boolean;
  showSubscriptionModal: boolean;
  showSettingsModal: boolean;
  showRedeemModal: boolean;
  commandPaletteOpen: boolean;

  // UI state setters
  onToggleTheme: () => void;
  onToggleMobileMenu: () => void;
  onDismissBanner: () => void;
  onSetShowDashboard: (show: boolean) => void;
  onOpenSubscriptionModal: () => void;
  onCloseSubscriptionModal: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  onOpenRedeemModal: () => void;
  onCloseRedeemModal: () => void;
  onOpenCommandPalette: () => void;
  onCloseCommandPalette: () => void;

  // Lesson/course navigation
  onSelectLesson: (lesson: Lesson) => void;
  onSelectCourse: (courseId: string | null) => void;

  // Progress handlers
  onToggleItem: (itemId: string) => void;
  onUpdateProof: (weekId: string, value: string) => void;
  onUpdateNote: (itemId: string, value: string) => void;
  onWeekSubmit: (weekId: string) => void;

  // Student handlers
  onStudentUpdate: () => void;
  onRefetchGrants: () => void;
  onLogout: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const BootcampLayout: React.FC<BootcampLayoutProps> = ({
  user,
  bootcampStudent,
  courseData,
  currentLesson,
  enrollments,
  activeCourseId,
  activeEnrollment,
  completedItems,
  proofOfWork,
  taskNotes,
  submittedWeeks,
  grantedTools,
  grantedWeekIds,
  aiTools,
  funnelAccess,
  accessState,
  daysRemaining,
  calcomUrl,
  isDarkMode,
  mobileMenuOpen,
  dismissedBanner,
  showDashboard,
  showSubscriptionModal,
  showSettingsModal,
  showRedeemModal,
  commandPaletteOpen,
  onToggleTheme,
  onToggleMobileMenu,
  onDismissBanner,
  onSetShowDashboard,
  onOpenSubscriptionModal,
  onCloseSubscriptionModal,
  onOpenSettings,
  onCloseSettings,
  onOpenRedeemModal,
  onCloseRedeemModal,
  onCloseCommandPalette,
  onSelectLesson,
  onSelectCourse,
  onToggleItem,
  onUpdateProof,
  onUpdateNote,
  onWeekSubmit,
  onStudentUpdate,
  onRefetchGrants,
  onLogout,
}) => {
  // ─── Navigation derivation ────────────────────────────────────────────────

  const courseName =
    activeEnrollment?.cohort?.sidebarLabel || activeEnrollment?.cohort?.name || user.cohort;

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

  const isVirtualPage =
    currentLesson.id.startsWith('virtual:') || currentLesson.id === 'my-blueprint';

  const breadcrumbSegments = [
    ...(enrollments.length > 1
      ? [{ label: 'Dashboard', onClick: () => onSetShowDashboard(true) }]
      : []),
    ...(!isVirtualPage && courseName
      ? [{ label: courseName, onClick: () => onSelectCourse(activeCourseId || null) }]
      : []),
    ...(!isVirtualPage && currentWeek ? [{ label: currentWeek.title }] : []),
    { label: currentLesson.title.replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '').trim() },
  ];

  // ─── Sidebar data (filter by granted weeks for Lead Magnet users) ─────────

  const sidebarData =
    user?.status === 'Lead Magnet' && grantedWeekIds
      ? { ...courseData, weeks: courseData.weeks.filter((w) => grantedWeekIds.includes(w.id)) }
      : courseData;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex flex-col h-screen font-sans transition-colors duration-300 ${
        isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'
      }`}
    >
      {/* Top cohort bar */}
      <div className="bg-zinc-900 text-zinc-400 text-xs py-1.5 px-4 hidden md:flex items-center justify-center gap-2 font-medium z-50">
        <Users size={12} /> {user.cohort} • {user.email}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-40 flex items-center px-4 justify-between">
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
            Modern Agency Sales
          </span>
          <button onClick={onToggleMobileMenu} className="p-2 text-zinc-900 dark:text-zinc-100">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <Sidebar
          data={sidebarData}
          currentLessonId={currentLesson.id}
          onSelectLesson={(lesson) => {
            onSetShowDashboard(false);
            onSelectLesson(lesson);
          }}
          isOpen={mobileMenuOpen}
          onCloseMobile={() => onToggleMobileMenu()}
          completedItems={completedItems}
          user={user}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          aiTools={aiTools}
          onOpenSettings={bootcampStudent ? onOpenSettings : undefined}
          hasBlueprint={!!bootcampStudent?.prospectId}
          grantedTools={grantedTools}
          grantedWeekIds={grantedWeekIds}
          onRedeemCode={
            user?.status === 'Lead Magnet' || user?.status === 'Sprint + AI Tools'
              ? onOpenRedeemModal
              : undefined
          }
          funnelAccess={funnelAccess.isFunnelAccess ? funnelAccess : undefined}
          calcomUrl={calcomUrl}
          enrollments={enrollments}
          activeCourseId={activeCourseId}
          onSelectCourse={onSelectCourse}
          showDashboard={showDashboard}
        />

        {/* Main content area */}
        <main className="flex-1 h-full overflow-y-auto pt-14 md:pt-0 bg-white dark:bg-zinc-950 transition-colors duration-300">
          {showDashboard && enrollments.length > 1 ? (
            <div className="p-6 md:p-10 lg:p-12">
              <CourseDashboard
                enrollments={enrollments}
                onSelectCourse={(courseId) => {
                  onSetShowDashboard(false);
                  onSelectCourse(courseId);
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
                  onSubscribe={onOpenSubscriptionModal}
                  onDismiss={onDismissBanner}
                />
              )}

              <VirtualLessonRouter
                currentLesson={currentLesson}
                currentWeek={currentWeek}
                bootcampStudent={bootcampStudent}
                completedItems={completedItems}
                proofOfWork={proofOfWork}
                taskNotes={taskNotes}
                onToggleItem={onToggleItem}
                onUpdateProof={onUpdateProof}
                onUpdateNote={onUpdateNote}
                isWeekSubmitted={currentWeek ? submittedWeeks[currentWeek.id] : false}
                onWeekSubmit={onWeekSubmit}
                onSelectLesson={onSelectLesson}
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

      {/* Modal cluster */}
      {bootcampStudent && !funnelAccess.isFunnelAccess && (
        <SubscriptionModal
          isOpen={showSubscriptionModal || accessState === 'expired'}
          onClose={onCloseSubscriptionModal}
          studentId={bootcampStudent.id}
          studentEmail={bootcampStudent.email}
        />
      )}

      {bootcampStudent && (
        <StudentSettingsModal
          student={bootcampStudent}
          isOpen={showSettingsModal}
          onClose={onCloseSettings}
          onUpdate={onStudentUpdate}
        />
      )}

      {bootcampStudent && (
        <RedeemCodeModal
          isOpen={showRedeemModal}
          onClose={onCloseRedeemModal}
          studentId={bootcampStudent.id}
          onSuccess={onRefetchGrants}
        />
      )}

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={onCloseCommandPalette}
        courseData={courseData}
        aiTools={aiTools || []}
        onSelectLesson={(lesson) => {
          onSetShowDashboard(false);
          onSelectLesson(lesson);
        }}
        onShowDashboard={() => onSetShowDashboard(true)}
        onOpenSettings={bootcampStudent ? onOpenSettings : undefined}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
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

export default BootcampLayout;
