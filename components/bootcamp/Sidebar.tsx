import React, { useState, useMemo, useEffect } from 'react';
import { CourseData, Lesson, User } from '../../types';
import { AITool } from '../../types/chat-types';
import { StudentEnrollment } from '../../types/bootcamp-types';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { FunnelAccessState } from '../../hooks/useFunnelAccess';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarSearch from './sidebar/SidebarSearch';
import SidebarTabs, { SidebarTab } from './sidebar/SidebarTabs';
import SidebarCourseSection from './sidebar/SidebarCourseSection';
import SidebarToolsSection from './sidebar/SidebarToolsSection';
import SidebarUserFooter from './sidebar/SidebarUserFooter';

interface SidebarProps {
  data: CourseData;
  currentLessonId: string;
  onSelectLesson: (lesson: Lesson) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  completedItems: Set<string>;
  user?: User | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  aiTools?: AITool[];
  onOpenSettings?: () => void;
  hasBlueprint?: boolean;
  grantedTools?: Array<{
    toolId: string;
    toolSlug: string;
    toolName: string;
    creditsRemaining: number;
    creditsTotal: number;
  }> | null;
  grantedWeekIds?: string[] | null;
  onRedeemCode?: () => void;
  funnelAccess?: FunnelAccessState;
  calcomUrl?: string;
  enrollments?: StudentEnrollment[];
  activeCourseId?: string | null;
  onSelectCourse?: (courseId: string | null) => void;
  showDashboard?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  data,
  currentLessonId,
  onSelectLesson,
  isOpen,
  onCloseMobile,
  completedItems,
  user,
  isDarkMode,
  onToggleTheme,
  aiTools = [],
  onOpenSettings,
  hasBlueprint = false,
  grantedTools,
  onRedeemCode,
  funnelAccess,
  calcomUrl,
  enrollments = [],
  activeCourseId,
  onSelectCourse,
  showDashboard = false,
}) => {
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SidebarTab>('curriculum');

  // Default: all weeks collapsed except the one containing current lesson
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(() => {
    const allWeekIds = new Set(data.weeks.map((w) => w.id));
    const currentWeek = data.weeks.find(
      (w) =>
        w.lessons.some((l) => l.id === currentLessonId) || currentLessonId === `${w.id}:checklist`
    );
    if (currentWeek) allWeekIds.delete(currentWeek.id);
    return allWeekIds;
  });

  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'foundations',
    'lead-magnet',
    'profile-posts',
    'outbound',
    'linkedin',
    'tables',
    'logins',
    'infrastructure',
  ]);

  // Auto-switch tab based on selection
  const isToolLesson =
    currentLessonId.startsWith('ai-tool:') ||
    currentLessonId.startsWith('virtual:') ||
    currentLessonId === 'my-blueprint';

  useEffect(() => {
    if (isToolLesson) {
      setActiveTab('tools');
    } else if (currentLessonId && !isToolLesson) {
      setActiveTab('curriculum');
    }
  }, [currentLessonId, isToolLesson]);

  const courseEnrollments = useMemo(
    () => enrollments.filter((e) => e.role !== 'resources'),
    [enrollments]
  );

  const isFunnelAccess = user?.status === 'Sprint + AI Tools';
  const isLeadMagnet = user?.status === 'Lead Magnet';
  const isCurriculumOnly = user?.status === 'Curriculum Only';
  const isEnrolledStudent =
    courseEnrollments.length > 0 ||
    user?.status === 'Full Access' ||
    user?.status === 'Sprint + AI Tools' ||
    user?.status === 'Curriculum Only';
  const hasGrantedTools = isLeadMagnet && !!grantedTools && grantedTools.length > 0;
  const userDomain = user?.email.split('@')[1] || '';

  const toggleWeek = (weekId: string) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const toolGroups = useMemo(() => {
    const groups = { tables: [] as Lesson[], logins: [] as Lesson[] };
    data.weeks.forEach((w) => {
      w.lessons.forEach((l) => {
        const titleUpper = l.title.toUpperCase();
        const url = (l.embedUrl || '').toLowerCase();
        if (l.title.includes('TABLE') || url.includes('clay.com')) groups.tables.push(l);
        else if (
          titleUpper.includes('SLACK') ||
          titleUpper.includes('ACCESS') ||
          titleUpper.includes('LOGIN') ||
          url.startsWith('credentials:')
        )
          groups.logins.push(l);
      });
    });
    return groups;
  }, [data]);

  const isToolbeltItem = (lessonId: string) =>
    [...toolGroups.tables, ...toolGroups.logins].some((item) => item.id === lessonId);

  const totalActionItems = data.weeks.reduce((sum, w) => sum + w.actionItems.length, 0);
  const overallProgress = totalActionItems > 0 ? (completedItems.size / totalActionItems) * 100 : 0;

  const cleanTitle = (title: string) =>
    title
      .replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '')
      .replace(/\bTABLE\b:?\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const displayUserLabel = user?.name || user?.email.split('@')[0] || 'User';

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-30 md:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed md:relative z-40 w-64 h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <SidebarHeader userDomain={userDomain} overallProgress={overallProgress} />
        <SidebarSearch query={searchQuery} onQueryChange={setSearchQuery} />
        <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
          {activeTab === 'curriculum' ? (
            <>
              {/* Course navigation */}
              <div className="space-y-1">
                {courseEnrollments.length > 1 && onSelectCourse && (
                  <>
                    <button
                      onClick={() => onSelectCourse(null)}
                      className={`flex items-center gap-2.5 w-full p-2 rounded-lg text-xs font-medium transition-all ${
                        showDashboard
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                          : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <LayoutDashboard
                        size={14}
                        className={showDashboard ? 'text-violet-500' : 'text-zinc-400'}
                      />
                      Dashboard
                    </button>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                  </>
                )}

                {courseEnrollments.map((enrollment) => (
                  <SidebarCourseSection
                    key={enrollment.cohortId}
                    enrollment={enrollment}
                    isActive={activeCourseId === enrollment.cohortId && !showDashboard}
                    courseData={data}
                    currentLessonId={currentLessonId}
                    onSelectCourse={(id) => onSelectCourse?.(id)}
                    onSelectLesson={(lesson) => {
                      setActiveTab('curriculum');
                      onSelectLesson(lesson);
                    }}
                    onCloseMobile={onCloseMobile}
                    completedItems={completedItems}
                    isToolbeltItem={isToolbeltItem}
                    collapsedWeeks={collapsedWeeks}
                    onToggleWeek={toggleWeek}
                    cleanTitle={cleanTitle}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            </>
          ) : (
            <SidebarToolsSection
              currentLessonId={currentLessonId}
              onSelectLesson={(lesson) => {
                setActiveTab('tools');
                onSelectLesson(lesson);
              }}
              onCloseMobile={onCloseMobile}
              aiTools={aiTools}
              isEnrolledStudent={isEnrolledStudent}
              isCurriculumOnly={isCurriculumOnly}
              isFunnelAccess={isFunnelAccess}
              isLeadMagnet={isLeadMagnet}
              hasBlueprint={hasBlueprint}
              hasGrantedTools={hasGrantedTools}
              grantedTools={grantedTools}
              toolGroups={toolGroups}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
              onRedeemCode={onRedeemCode}
              funnelAccess={funnelAccess}
              calcomUrl={calcomUrl}
              userEmail={user?.email}
              searchQuery={searchQuery}
            />
          )}
        </div>

        <SidebarUserFooter
          displayLabel={displayUserLabel}
          userStatus={user?.status}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          onOpenSettings={onOpenSettings}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
};

export default Sidebar;
