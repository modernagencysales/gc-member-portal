import React, { useState, useMemo, useEffect } from 'react';
import { CourseData, Lesson, User } from '../../types';
import { AITool } from '../../types/chat-types';
import { StudentEnrollment } from '../../types/bootcamp-types';
import {
  ChevronDown,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Zap,
  ClipboardList,
  Terminal,
  Sparkles,
  Database,
  Key,
  Sun,
  Moon,
  Lock,
  Globe,
  LogOut,
  Settings,
  FileText,
  Target,
  Users,
  LayoutDashboard,
  BookOpen,
  Server,
  Mail,
  MessageSquare,
  Send,
  Rocket,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { FunnelAccessState } from '../../hooks/useFunnelAccess';
import { FunnelNudgeSubtle } from './funnel-access';

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
  // Multi-course props
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

  const handleLogout = () => {
    logout();
    window.location.reload();
  };
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>(data.weeks.map((w) => w.id));

  // Auto-expand all weeks when course data changes (e.g. switching cohorts)
  const weekIdKey = data.weeks.map((w) => w.id).join(',');
  useEffect(() => {
    setExpandedWeeks(data.weeks.map((w) => w.id));
  }, [weekIdKey]);

  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'lead-magnet',
    'profile-posts',
    'outbound',
    'linkedin',
    'tables',
    'logins',
    'infrastructure',
  ]);

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
  const hasGrantedTools = isLeadMagnet && grantedTools && grantedTools.length > 0;
  const userDomain = user?.email.split('@')[1] || '';

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks((prev) =>
      prev.includes(weekId) ? prev.filter((id) => id !== weekId) : [...prev, weekId]
    );
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const isWeekExpanded = (weekId: string) => expandedWeeks.includes(weekId);
  const isGroupExpanded = (groupId: string) => expandedGroups.includes(groupId);

  const toolGroups = useMemo(() => {
    const groups = {
      tables: [] as Lesson[],
      logins: [] as Lesson[],
    };

    data.weeks.forEach((w) => {
      w.lessons.forEach((l) => {
        const titleUpper = l.title.toUpperCase();
        const url = (l.embedUrl || '').toLowerCase();

        const isTable = l.title.includes('TABLE') || url.includes('clay.com');
        const isAccess =
          titleUpper.includes('SLACK') ||
          titleUpper.includes('ACCESS') ||
          titleUpper.includes('LOGIN') ||
          url.startsWith('credentials:');

        if (isTable) {
          groups.tables.push(l);
        } else if (isAccess) {
          groups.logins.push(l);
        }
      });
    });
    return groups;
  }, [data]);

  const isToolbeltItem = (lessonId: string) => {
    return [...toolGroups.tables, ...toolGroups.logins].some((item) => item.id === lessonId);
  };

  const totalActionItems = data.weeks.reduce((sum, w) => sum + w.actionItems.length, 0);
  const overallProgress = totalActionItems > 0 ? (completedItems.size / totalActionItems) * 100 : 0;

  const cleanTitle = (title: string) =>
    title
      .replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '')
      .replace(/\bTABLE\b:?\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const getLessonIcon = (lesson: Lesson, _isActive: boolean) => {
    const size = 14;
    if (lesson.id.endsWith(':checklist')) return <ClipboardList size={size} />;
    const url = lesson.embedUrl || '';
    if (url.includes('clay.com') || lesson.title.includes('TABLE')) return <Database size={size} />;
    if (url.startsWith('text:')) return <Key size={size} />;
    if (url.includes('pickaxeproject.com') || url.startsWith('pickaxe:'))
      return <Sparkles size={size} />;
    return <PlayCircle size={size} />;
  };

  const renderToolItem = (tool: Lesson) => {
    const isActive = tool.id === currentLessonId;
    return (
      <button
        key={tool.id}
        onClick={() => {
          onSelectLesson(tool);
          onCloseMobile();
        }}
        className={`flex items-center w-full py-1.5 px-3 rounded-lg text-[11px] transition-all ${
          isActive
            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <span
          className={`mr-2.5 shrink-0 ${isActive ? 'text-violet-500' : 'text-zinc-400 dark:text-zinc-600'}`}
        >
          {getLessonIcon(tool, isActive)}
        </span>
        <span className="truncate">{cleanTitle(tool.title)}</span>
      </button>
    );
  };

  // Render AI tool from database (uses ai-tool: URL scheme)
  const renderAIToolItem = (tool: AITool) => {
    const toolLessonId = `ai-tool:${tool.slug}`;
    const isActive = currentLessonId === toolLessonId;
    return (
      <button
        key={tool.id}
        onClick={() => {
          onSelectLesson({
            id: toolLessonId,
            title: tool.name,
            embedUrl: `ai-tool:${tool.slug}`,
          });
          onCloseMobile();
        }}
        className={`flex items-center w-full py-1.5 px-3 rounded-lg text-[11px] transition-all ${
          isActive
            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <span
          className={`mr-2.5 shrink-0 ${isActive ? 'text-violet-500' : 'text-zinc-400 dark:text-zinc-600'}`}
        >
          <Sparkles size={14} />
        </span>
        <span className="truncate">{tool.name}</span>
      </button>
    );
  };

  const displayUserLabel = user?.name || user?.email.split('@')[0] || 'User';

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
        <div className="p-5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 mb-4">
            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-white shrink-0">
              <Terminal size={16} />
            </div>
            <h1 className="font-semibold text-sm">Modern Agency Sales</h1>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Globe size={10} /> {userDomain}
              </span>
              <Zap size={10} className="text-violet-500" />
            </div>
            <div className="flex items-end gap-2 mb-1.5">
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                {Math.round(overallProgress)}%
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 pb-0.5">complete</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1 rounded-full overflow-hidden">
              <div
                className="bg-violet-500 h-full transition-all duration-700"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
          {/* Course navigation with inline curriculum */}
          <div className="space-y-1">
            {/* Dashboard - only if 2+ real courses */}
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

            {/* Course sections */}
            {courseEnrollments.map((enrollment) => {
              const isActive = activeCourseId === enrollment.cohortId && !showDashboard;
              const label = enrollment.cohort.sidebarLabel || enrollment.cohort.name;
              const icon = enrollment.cohort.icon;

              return (
                <div key={enrollment.cohortId}>
                  <button
                    onClick={() => onSelectCourse?.(enrollment.cohortId)}
                    className={`flex items-center gap-2.5 w-full p-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {icon ? (
                      <span className="text-sm leading-none">{icon}</span>
                    ) : (
                      <BookOpen
                        size={14}
                        className={isActive ? 'text-violet-500' : 'text-zinc-400'}
                      />
                    )}
                    <span className="truncate">{label}</span>
                    {enrollment.onboardingCompletedAt && (
                      <CheckCircle2 size={10} className="ml-auto text-green-500 shrink-0" />
                    )}
                    <ChevronDown
                      size={12}
                      className={`shrink-0 transition-transform ${isActive ? '' : '-rotate-90'} ${enrollment.onboardingCompletedAt ? '' : 'ml-auto'}`}
                    />
                  </button>

                  {/* Inline curriculum for active course */}
                  {isActive && (
                    <div className="ml-3 mt-1 space-y-1 animate-slide-in">
                      {data.weeks.map((week) => {
                        const coreLessons = week.lessons.filter(
                          (l) => !isToolbeltItem(l.id) && !l.title.toUpperCase().startsWith('TASK:')
                        );

                        if (coreLessons.length === 0 && week.actionItems.length === 0) return null;

                        return (
                          <div key={week.id} className="mb-1">
                            <button
                              onClick={() => toggleWeek(week.id)}
                              className="flex items-center justify-between w-full p-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {week.actionItems.length > 0 &&
                                  completedItems.size >= week.actionItems.length && (
                                    <CheckCircle2 size={12} className="text-green-500" />
                                  )}
                                <span className="truncate">{week.title}</span>
                              </div>
                              {isWeekExpanded(week.id) ? (
                                <ChevronDown size={12} />
                              ) : (
                                <ChevronRight size={12} />
                              )}
                            </button>
                            {isWeekExpanded(week.id) && (
                              <div className="mt-1 space-y-0.5 ml-2">
                                {coreLessons.map((lesson) => (
                                  <button
                                    key={lesson.id}
                                    onClick={() => {
                                      onSelectLesson(lesson);
                                      onCloseMobile();
                                    }}
                                    className={`flex items-start w-full p-2 rounded-lg text-[11px] transition-all ${lesson.id === currentLessonId ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                  >
                                    <span className="mt-0.5 mr-2 shrink-0 opacity-70">
                                      {getLessonIcon(lesson, lesson.id === currentLessonId)}
                                    </span>
                                    <span className="text-left leading-snug">
                                      {cleanTitle(lesson.title)}
                                    </span>
                                  </button>
                                ))}

                                <button
                                  onClick={() => {
                                    onSelectLesson({
                                      id: `${week.id}:checklist`,
                                      title: 'Tasks',
                                      embedUrl: 'virtual:checklist',
                                    });
                                    onCloseMobile();
                                  }}
                                  className={`flex items-center gap-2.5 w-full p-2 rounded-lg text-[11px] font-medium transition-all mt-1 ${
                                    currentLessonId === `${week.id}:checklist`
                                      ? 'bg-violet-500 text-white'
                                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                  }`}
                                >
                                  <ClipboardList size={12} />
                                  <span>Tasks</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Intro Offer */}
          <div className="px-1">
            <button
              onClick={() => {
                onSelectLesson({
                  id: 'virtual:intro-offer',
                  title: 'Intro Offer',
                  embedUrl: 'virtual:intro-offer',
                });
                onCloseMobile();
              }}
              className={`flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs font-semibold transition-all ${
                currentLessonId === 'virtual:intro-offer'
                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20'
                  : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20'
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-violet-500 flex items-center justify-center shrink-0">
                <Rocket size={14} className="text-white" />
              </div>
              <span>Intro Offer</span>
            </button>
          </div>

          {/* Tools divider */}
          <div className="flex items-center gap-2 px-2">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Tools
            </span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Tools section (flattened) */}
          {isEnrolledStudent ? (
            <div className="space-y-1">
              {/* My Blueprint */}
              <button
                onClick={() => {
                  onSelectLesson({
                    id: 'my-blueprint',
                    title: 'My Blueprint',
                    embedUrl: 'virtual:my-blueprint',
                  });
                  onCloseMobile();
                }}
                className={`flex items-center w-full p-2 rounded-lg text-xs font-medium transition-all ${
                  currentLessonId === 'my-blueprint'
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={12} className="text-violet-500" />
                  <span>My Blueprint</span>
                </div>
              </button>

              {/* My Posts */}
              <button
                onClick={() => {
                  onSelectLesson({
                    id: 'virtual:my-posts',
                    title: 'My Posts',
                    embedUrl: 'virtual:my-posts',
                  });
                  onCloseMobile();
                }}
                className={`flex items-center w-full p-2 rounded-lg text-xs font-medium transition-all ${
                  currentLessonId === 'virtual:my-posts'
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText
                    size={12}
                    className={
                      currentLessonId === 'virtual:my-posts'
                        ? 'text-violet-500'
                        : 'text-emerald-500'
                    }
                  />
                  <span>My Posts</span>
                  {hasBlueprint && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      60
                    </span>
                  )}
                </div>
              </button>

              {/* Sprint + AI Tools subtle nudge */}
              {funnelAccess?.nudgeTier === 'subtle' && (
                <FunnelNudgeSubtle
                  userEmail={user?.email}
                  calcomUrl={calcomUrl}
                  daysRemaining={funnelAccess.daysRemaining}
                />
              )}

              {/* Redeem Code for Sprint + AI Tools / Lead Magnet users */}
              {(isFunnelAccess || isLeadMagnet) && onRedeemCode && (
                <button
                  onClick={onRedeemCode}
                  className="flex items-center gap-2 w-full p-2 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                >
                  <Key size={12} />
                  Redeem Code
                </button>
              )}

              {/* AI Tools sections - hidden for Curriculum Only users */}
              {!isCurriculumOnly && aiTools.length > 0 && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => toggleGroup('lead-magnet')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-xs font-medium">
                      <Sparkles size={12} className="text-violet-500" />
                      <span>Lead Magnet</span>
                    </div>
                    {isGroupExpanded('lead-magnet') ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                  </button>
                  {isGroupExpanded('lead-magnet') && (
                    <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
                      {aiTools
                        .filter((t) =>
                          [
                            'lead-magnet-ideator',
                            'lead-magnet-creator',
                            'lead-magnet-post-creator',
                            'lead-magnet-email',
                            'ty-page-vsl',
                          ].includes(t.slug)
                        )
                        .map(renderAIToolItem)}
                    </div>
                  )}
                </div>
              )}

              {/* Profile + Posts */}
              {!isCurriculumOnly && aiTools.length > 0 && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => toggleGroup('profile-posts')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-xs font-medium">
                      <FileText size={12} className="text-blue-500" />
                      <span>Profile + Posts</span>
                    </div>
                    {isGroupExpanded('profile-posts') ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                  </button>
                  {isGroupExpanded('profile-posts') && (
                    <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
                      {aiTools
                        .filter((t) =>
                          [
                            'profile-optimizer',
                            'transcript-post-idea-grabber',
                            'post-generator',
                            'post-finalizer',
                          ].includes(t.slug)
                        )
                        .map(renderAIToolItem)}
                    </div>
                  )}
                </div>
              )}

              {/* LinkedIn */}
              {!isCurriculumOnly && <div className="space-y-0.5">
                <button
                  onClick={() => toggleGroup('linkedin')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5 text-xs font-medium">
                    <MessageSquare size={12} className="text-blue-500" />
                    <span>LinkedIn</span>
                  </div>
                  {isGroupExpanded('linkedin') ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
                {isGroupExpanded('linkedin') && (
                  <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
                    {aiTools
                      .filter((t) => ['dm-chat-helper'].includes(t.slug))
                      .map(renderAIToolItem)}
                    <button
                      onClick={() => {
                        onSelectLesson({
                          id: 'virtual:connection-qualifier',
                          title: 'Connection Qualifier',
                          embedUrl: 'virtual:connection-qualifier',
                        });
                        onCloseMobile();
                      }}
                      className={`flex items-center w-full py-1.5 px-3 rounded-lg text-[11px] transition-all ${
                        currentLessonId === 'virtual:connection-qualifier'
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <span
                        className={`mr-2.5 shrink-0 ${
                          currentLessonId === 'virtual:connection-qualifier'
                            ? 'text-violet-500'
                            : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      >
                        <Users size={14} />
                      </span>
                      <span className="truncate">Connection Qualifier</span>
                    </button>
                  </div>
                )}
              </div>}

              {/* GTM Infrastructure */}
              {!isCurriculumOnly && <div className="space-y-0.5">
                <button
                  onClick={() => toggleGroup('infrastructure')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5 text-xs font-medium">
                    <Server size={12} className="text-emerald-500" />
                    <span>GTM Infrastructure</span>
                  </div>
                  {isGroupExpanded('infrastructure') ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
                {isGroupExpanded('infrastructure') && (
                  <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
                    <button
                      onClick={() => {
                        onSelectLesson({
                          id: 'virtual:infra-account-setup',
                          title: 'Account Setup',
                          embedUrl: 'virtual:infra-account-setup',
                        });
                        onCloseMobile();
                      }}
                      className={`flex items-center w-full py-1.5 px-3 rounded-lg text-[11px] transition-all ${
                        currentLessonId === 'virtual:infra-account-setup'
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <span
                        className={`mr-2.5 shrink-0 ${
                          currentLessonId === 'virtual:infra-account-setup'
                            ? 'text-violet-500'
                            : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      >
                        <Users size={14} />
                      </span>
                      <span className="truncate">Account Setup</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectLesson({
                          id: 'virtual:infra-email-infra',
                          title: 'Email Infra',
                          embedUrl: 'virtual:infra-email-infra',
                        });
                        onCloseMobile();
                      }}
                      className={`flex items-center w-full py-1.5 px-3 rounded-lg text-[11px] transition-all ${
                        currentLessonId === 'virtual:infra-email-infra'
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <span
                        className={`mr-2.5 shrink-0 ${
                          currentLessonId === 'virtual:infra-email-infra'
                            ? 'text-violet-500'
                            : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      >
                        <Mail size={14} />
                      </span>
                      <span className="truncate">Email Infra</span>
                    </button>
                  </div>
                )}
              </div>}

              {/* Outbound */}
              {!isCurriculumOnly && <div className="space-y-0.5">
                <button
                  onClick={() => toggleGroup('outbound')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5 text-xs font-medium">
                    <Send size={12} className="text-orange-500" />
                    <span>Outbound</span>
                  </div>
                  {isGroupExpanded('outbound') ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
                {isGroupExpanded('outbound') && (
                  <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
                    {aiTools
                      .filter((t) => ['cold-email-mastermind'].includes(t.slug))
                      .map(renderAIToolItem)}
                    <button
                      onClick={() => {
                        onSelectLesson({
                          id: 'virtual:tam-builder',
                          title: 'TAM Builder',
                          embedUrl: 'virtual:tam-builder',
                        });
                        onCloseMobile();
                      }}
                      className={`flex items-center w-full py-1.5 px-3 rounded-lg text-[11px] transition-all ${
                        currentLessonId === 'virtual:tam-builder'
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <span
                        className={`mr-2.5 shrink-0 ${
                          currentLessonId === 'virtual:tam-builder'
                            ? 'text-violet-500'
                            : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      >
                        <Target size={14} />
                      </span>
                      <span className="truncate">TAM Builder</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectLesson({
                          id: 'virtual:cold-email-recipes',
                          title: 'Recipe Builder',
                          embedUrl: 'virtual:cold-email-recipes',
                        });
                        onCloseMobile();
                      }}
                      className={`flex items-center w-full py-1.5 px-3 rounded-lg text-[11px] transition-all ${
                        currentLessonId === 'virtual:cold-email-recipes'
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <span
                        className={`mr-2.5 shrink-0 ${
                          currentLessonId === 'virtual:cold-email-recipes'
                            ? 'text-violet-500'
                            : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      >
                        <Mail size={14} />
                      </span>
                      <span className="truncate">Recipe Builder</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectLesson({
                          id: 'virtual:email-enrichment',
                          title: 'Email Enrichment',
                          embedUrl: 'virtual:email-enrichment',
                        });
                        onCloseMobile();
                      }}
                      className={`flex items-center w-full py-1.5 px-3 rounded-lg text-[11px] transition-all ${
                        currentLessonId === 'virtual:email-enrichment'
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <span
                        className={`mr-2.5 shrink-0 ${
                          currentLessonId === 'virtual:email-enrichment'
                            ? 'text-violet-500'
                            : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      >
                        <Mail size={14} />
                      </span>
                      <span className="truncate">Email Enrichment</span>
                    </button>
                  </div>
                )}
              </div>}

              {/* Clay Tables */}
              {!isCurriculumOnly && toolGroups.tables.length > 0 && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => toggleGroup('tables')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-xs font-medium">
                      <Database size={12} className="text-blue-500" />
                      <span>Clay Tables</span>
                    </div>
                    {isGroupExpanded('tables') ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                  </button>
                  {isGroupExpanded('tables') && (
                    <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
                      {toolGroups.tables.map(renderToolItem)}
                    </div>
                  )}
                </div>
              )}

              {/* Access & Links */}
              {!isCurriculumOnly && toolGroups.logins.length > 0 && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => toggleGroup('logins')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-xs font-medium">
                      <Key size={12} className="text-amber-500" />
                      <span>Access & Links</span>
                    </div>
                    {isGroupExpanded('logins') ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                  </button>
                  {isGroupExpanded('logins') && (
                    <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
                      {toolGroups.logins.map(renderToolItem)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : hasGrantedTools ? (
            <div className="space-y-1">
              {/* My Blueprint (Lead Magnet users) */}
              {hasBlueprint && (
                <button
                  onClick={() => {
                    onSelectLesson({
                      id: 'my-blueprint',
                      title: 'My Blueprint',
                      embedUrl: 'virtual:my-blueprint',
                    });
                    onCloseMobile();
                  }}
                  className={`flex items-center w-full p-2 rounded-lg text-xs font-medium transition-all ${
                    currentLessonId === 'my-blueprint'
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={12} className="text-violet-500" />
                    <span>My Blueprint</span>
                  </div>
                </button>
              )}

              {/* Granted AI Tools */}
              <div className="space-y-0.5">
                <button
                  onClick={() => toggleGroup('lead-magnet')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5 text-xs font-medium">
                    <Sparkles size={12} className="text-violet-500" />
                    <span>AI Tools</span>
                  </div>
                  {isGroupExpanded('lead-magnet') ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
                {isGroupExpanded('lead-magnet') && (
                  <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
                    {aiTools
                      .filter((t) => grantedTools!.some((g) => g.toolSlug === t.slug))
                      .map(renderAIToolItem)}
                  </div>
                )}
              </div>

              {/* Redeem Code for Lead Magnet users */}
              {onRedeemCode && (
                <button
                  onClick={onRedeemCode}
                  className="flex items-center gap-2 w-full p-2 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                >
                  <Key size={12} />
                  Redeem Code
                </button>
              )}
            </div>
          ) : (
            <div className="px-3 py-3 bg-zinc-100 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
              <div className="flex items-center gap-2 mb-1.5">
                <Lock size={12} className="text-zinc-400" />
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Members Only
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                AI Tools and specialized tables are reserved for ongoing members.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white font-medium text-xs">
              {displayUserLabel.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-sm text-zinc-900 dark:text-white truncate font-medium">
                {displayUserLabel}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors"
                title="Settings"
              >
                <Settings size={16} />
              </button>
            )}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
