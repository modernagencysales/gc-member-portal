import React, { useState, useMemo } from 'react';
import { CourseData, Lesson, User } from '../../types';
import {
  ChevronDown,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Zap,
  ClipboardList,
  Wrench,
  Box,
  Terminal,
  Sparkles,
  Database,
  Key,
  Sun,
  Moon,
  Lock,
  Globe,
} from 'lucide-react';

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
}) => {
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>(data.weeks.map((w) => w.id));
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['gpts', 'tables', 'logins']);

  const [showResourcesSection, setShowResourcesSection] = useState(true);
  const [showCurriculumSection, setShowCurriculumSection] = useState(true);

  const hasFullAccess = user?.status === 'Full Access';
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
      gpts: [] as Lesson[],
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
          url.startsWith('text:');
        const isTool =
          titleUpper.startsWith('TOOL:') ||
          titleUpper.includes('AGENT') ||
          titleUpper.includes('PORTAL');

        if (isTable) {
          groups.tables.push(l);
        } else if (isAccess) {
          groups.logins.push(l);
        } else if (isTool) {
          groups.gpts.push(l);
        }
      });
    });
    return groups;
  }, [data]);

  const isToolbeltItem = (lessonId: string) => {
    return [...toolGroups.gpts, ...toolGroups.tables, ...toolGroups.logins].some(
      (item) => item.id === lessonId
    );
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
            <h1 className="font-semibold text-sm">GTM OS</h1>
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

        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-hide">
          {hasFullAccess ? (
            <div className="space-y-3">
              <button
                onClick={() => setShowResourcesSection(!showResourcesSection)}
                className="w-full flex items-center justify-between px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Box size={12} /> Resources
                </div>
                {showResourcesSection ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>

              {showResourcesSection && (
                <div className="space-y-1 animate-slide-in">
                  {[
                    {
                      id: 'gpts',
                      label: 'AI Tools',
                      icon: <Sparkles size={12} className="text-violet-500" />,
                      items: toolGroups.gpts,
                    },
                    {
                      id: 'tables',
                      label: 'Clay Tables',
                      icon: <Database size={12} className="text-blue-500" />,
                      items: toolGroups.tables,
                    },
                    {
                      id: 'logins',
                      label: 'Access & Links',
                      icon: <Key size={12} className="text-amber-500" />,
                      items: toolGroups.logins,
                    },
                  ].map(
                    (group) =>
                      group.items.length > 0 && (
                        <div key={group.id} className="space-y-0.5">
                          <button
                            onClick={() => toggleGroup(group.id)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 text-xs font-medium">
                              {group.icon}
                              <span>{group.label}</span>
                            </div>
                            {isGroupExpanded(group.id) ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                          </button>
                          {isGroupExpanded(group.id) && (
                            <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
                              {group.items.map(renderToolItem)}
                            </div>
                          )}
                        </div>
                      )
                  )}
                </div>
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

          <div className="space-y-3">
            <button
              onClick={() => setShowCurriculumSection(!showCurriculumSection)}
              className="w-full flex items-center justify-between px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Wrench size={12} /> Curriculum
              </div>
              {showCurriculumSection ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {showCurriculumSection && (
              <div className="animate-slide-in">
                {data.weeks.map((week) => {
                  const coreLessons = week.lessons.filter(
                    (l) => !isToolbeltItem(l.id) && !l.title.toUpperCase().startsWith('TASK:')
                  );

                  if (coreLessons.length === 0 && week.actionItems.length === 0) return null;

                  return (
                    <div key={week.id} className="mb-2">
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
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
