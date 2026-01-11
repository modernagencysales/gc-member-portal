import React, { useState, useMemo } from 'react';
import { CourseData, Lesson, Week, User } from '../../types';
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

  const getLessonIcon = (lesson: Lesson, isActive: boolean) => {
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
            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-bold'
            : 'text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <span
          className={`mr-2.5 shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-600'}`}
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
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed md:relative z-40 w-64 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 mb-5">
            <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center text-white dark:text-slate-900 shrink-0">
              <Terminal size={16} />
            </div>
            <h1 className="font-bold text-[11px] uppercase tracking-widest leading-none">GTM OS</h1>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Globe size={10} /> {userDomain}
              </span>
              <Zap size={10} className="text-brand-500" />
            </div>
            <div className="flex items-end gap-2 mb-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                {Math.round(overallProgress)}%
              </span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 pb-0.5 uppercase tracking-wide">
                Shared Done
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
              <div
                className="bg-slate-900 dark:bg-slate-100 h-full transition-all duration-700"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-8 scrollbar-hide">
          {hasFullAccess ? (
            <div className="space-y-4">
              <button
                onClick={() => setShowResourcesSection(!showResourcesSection)}
                className="w-full flex items-center justify-between px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Box size={10} /> Resources
                </div>
                {showResourcesSection ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              </button>

              {showResourcesSection && (
                <div className="space-y-1 animate-slide-in">
                  {[
                    {
                      id: 'gpts',
                      label: 'AI Tools',
                      icon: <Sparkles size={12} className="text-purple-500" />,
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
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 text-[10px] font-bold">
                              {group.icon}
                              <span>{group.label}</span>
                            </div>
                            {isGroupExpanded(group.id) ? (
                              <ChevronDown size={10} />
                            ) : (
                              <ChevronRight size={10} />
                            )}
                          </button>
                          {isGroupExpanded(group.id) && (
                            <div className="ml-4 border-l border-slate-200 dark:border-slate-800 pl-1.5">
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
            <div className="px-2 py-3 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1.5">
                <Lock size={10} className="text-slate-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  Members Only
                </span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                AI Tools and specialized tables are reserved for ongoing members.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => setShowCurriculumSection(!showCurriculumSection)}
              className="w-full flex items-center justify-between px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Wrench size={10} /> Curriculum
              </div>
              {showCurriculumSection ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
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
                        className="flex items-center justify-between w-full p-2 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {week.actionItems.length > 0 &&
                            completedItems.size >= week.actionItems.length && (
                              <CheckCircle2 size={10} className="text-green-500" />
                            )}
                          <span className="truncate">{week.title}</span>
                        </div>
                        {isWeekExpanded(week.id) ? (
                          <ChevronDown size={10} />
                        ) : (
                          <ChevronRight size={10} />
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
                              className={`flex items-start w-full p-2 rounded-lg text-[10px] transition-all ${lesson.id === currentLessonId ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
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
                            className={`flex items-center gap-2.5 w-full p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all mt-1 ${
                              currentLessonId === `${week.id}:checklist`
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
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

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 truncate">
            <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 font-bold text-[10px]">
              {displayUserLabel.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-[10px] text-slate-900 dark:text-white truncate font-bold uppercase tracking-widest">
                {displayUserLabel}
              </p>
              <p className="text-[8px] text-slate-400 dark:text-slate-500 truncate font-medium">
                {user?.status}
              </p>
            </div>
          </div>
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
