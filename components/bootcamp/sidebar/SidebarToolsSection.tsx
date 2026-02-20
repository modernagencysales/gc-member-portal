import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Database,
  Key,
  FileText,
  Target,
  Users,
  Server,
  Mail,
  MessageSquare,
  Send,
  Compass,
  Rocket,
  PlayCircle,
  ClipboardList,
  Lock,
} from 'lucide-react';
import { Lesson } from '../../../types';
import { AITool } from '../../../types/chat-types';
import type { FunnelAccessState } from '../../../hooks/useFunnelAccess';
import { FunnelNudgeSubtle } from '../funnel-access';

interface SidebarToolsSectionProps {
  currentLessonId: string;
  onSelectLesson: (lesson: Lesson) => void;
  onCloseMobile: () => void;
  aiTools: AITool[];
  isEnrolledStudent: boolean;
  isCurriculumOnly: boolean;
  isFunnelAccess: boolean;
  isLeadMagnet: boolean;
  hasBlueprint: boolean;
  hasGrantedTools: boolean;
  grantedTools?: Array<{
    toolId: string;
    toolSlug: string;
    toolName: string;
    creditsRemaining: number;
    creditsTotal: number;
  }> | null;
  toolGroups: { tables: Lesson[]; logins: Lesson[] };
  expandedGroups: string[];
  onToggleGroup: (groupId: string) => void;
  onRedeemCode?: () => void;
  funnelAccess?: FunnelAccessState;
  calcomUrl?: string;
  userEmail?: string;
  searchQuery?: string;
}

const SidebarToolsSection: React.FC<SidebarToolsSectionProps> = ({
  currentLessonId,
  onSelectLesson,
  onCloseMobile,
  aiTools,
  isEnrolledStudent,
  isCurriculumOnly,
  isFunnelAccess,
  isLeadMagnet,
  hasBlueprint,
  hasGrantedTools,
  grantedTools,
  toolGroups,
  expandedGroups,
  onToggleGroup,
  onRedeemCode,
  funnelAccess,
  calcomUrl,
  userEmail,
  searchQuery = '',
}) => {
  const isGroupExpanded = (groupId: string) => expandedGroups.includes(groupId);
  const q = searchQuery.toLowerCase();

  const cleanTitle = (title: string) =>
    title
      .replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '')
      .replace(/\bTABLE\b:?\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const getLessonIcon = (lesson: Lesson) => {
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
    if (q && !cleanTitle(tool.title).toLowerCase().includes(q)) return null;
    return (
      <button
        key={tool.id}
        onClick={() => {
          onSelectLesson(tool);
          onCloseMobile();
        }}
        className={`flex items-center w-full py-1.5 px-3 rounded-lg text-xs transition-all ${
          isActive
            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <span
          className={`mr-2.5 shrink-0 ${isActive ? 'text-violet-500' : 'text-zinc-400 dark:text-zinc-600'}`}
        >
          {getLessonIcon(tool)}
        </span>
        <span className="truncate">{cleanTitle(tool.title)}</span>
      </button>
    );
  };

  const renderAIToolItem = (tool: AITool) => {
    const toolLessonId = `ai-tool:${tool.slug}`;
    const isActive = currentLessonId === toolLessonId;
    if (q && !tool.name.toLowerCase().includes(q)) return null;
    return (
      <button
        key={tool.id}
        onClick={() => {
          onSelectLesson({ id: toolLessonId, title: tool.name, embedUrl: `ai-tool:${tool.slug}` });
          onCloseMobile();
        }}
        className={`flex items-center w-full py-1.5 px-3 rounded-lg text-xs transition-all ${
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

  const renderVirtualToolButton = (id: string, title: string, icon: React.ReactNode) => {
    const isActive = currentLessonId === id;
    if (q && !title.toLowerCase().includes(q)) return null;
    return (
      <button
        key={id}
        onClick={() => {
          onSelectLesson({ id, title, embedUrl: id });
          onCloseMobile();
        }}
        className={`flex items-center w-full py-1.5 px-3 rounded-lg text-xs transition-all ${
          isActive
            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <span
          className={`mr-2.5 shrink-0 ${isActive ? 'text-violet-500' : 'text-zinc-400 dark:text-zinc-600'}`}
        >
          {icon}
        </span>
        <span className="truncate">{title}</span>
      </button>
    );
  };

  const renderGroup = (
    groupId: string,
    label: string,
    icon: React.ReactNode,
    children: React.ReactNode
  ) => {
    if (q && !label.toLowerCase().includes(q)) {
      // If the group label doesn't match, only show if children match
      // We still render and let children filter themselves
    }
    return (
      <div key={groupId} className="space-y-0.5">
        <button
          onClick={() => onToggleGroup(groupId)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {icon}
            <span>{label}</span>
          </div>
          {isGroupExpanded(groupId) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {isGroupExpanded(groupId) && (
          <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Intro Offer button
  const introOffer = (
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
  );

  // Tools divider
  const divider = (
    <div className="flex items-center gap-2 px-2">
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        Tools
      </span>
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );

  if (!isEnrolledStudent && !hasGrantedTools) {
    return (
      <>
        {!q && introOffer}
        {!q && divider}
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
      </>
    );
  }

  if (!isEnrolledStudent && hasGrantedTools) {
    return (
      <>
        {!q && introOffer}
        {!q && divider}
        <div className="space-y-1">
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
          {renderGroup(
            'lead-magnet',
            'AI Tools',
            <Sparkles size={12} className="text-violet-500" />,
            aiTools
              .filter((t) => grantedTools!.some((g) => g.toolSlug === t.slug))
              .map(renderAIToolItem)
          )}
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
      </>
    );
  }

  // Full enrolled student tools
  return (
    <>
      {!q && introOffer}
      {!q && divider}
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
            <FileText size={12} className="text-violet-500" />
            <span>My Posts</span>
            {hasBlueprint && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                60
              </span>
            )}
          </div>
        </button>

        {/* Funnel nudge */}
        {funnelAccess?.nudgeTier === 'subtle' && (
          <FunnelNudgeSubtle
            userEmail={userEmail}
            calcomUrl={calcomUrl}
            daysRemaining={funnelAccess.daysRemaining}
          />
        )}

        {/* Redeem Code */}
        {(isFunnelAccess || isLeadMagnet) && onRedeemCode && (
          <button
            onClick={onRedeemCode}
            className="flex items-center gap-2 w-full p-2 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
          >
            <Key size={12} />
            Redeem Code
          </button>
        )}

        {/* AI Tools Suite Header */}
        {!isCurriculumOnly && aiTools.length > 0 && (
          <div className="mt-3 mb-1 px-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              LinkedIn AI Automation Suite
            </span>
          </div>
        )}

        {/* Foundations */}
        {!isCurriculumOnly &&
          aiTools.filter((t) => ['offer-generator', 'niche-finder'].includes(t.slug)).length > 0 &&
          renderGroup(
            'foundations',
            'Foundations',
            <Compass size={12} className="text-violet-500" />,
            aiTools
              .filter((t) => ['offer-generator', 'niche-finder'].includes(t.slug))
              .map(renderAIToolItem)
          )}

        {/* Lead Magnet GPT */}
        {!isCurriculumOnly &&
          aiTools.length > 0 &&
          renderGroup(
            'lead-magnet',
            'The Lead Magnet GPT',
            <Sparkles size={12} className="text-violet-500" />,
            aiTools
              .filter((t) =>
                [
                  'lead-magnet-ideator',
                  'lead-magnet-creator',
                  'lead-magnet-post-creator',
                  'lead-magnet-email',
                  'ty-page-vsl',
                ].includes(t.slug)
              )
              .map(renderAIToolItem)
          )}

        {/* LinkedIn Post GPT */}
        {!isCurriculumOnly &&
          aiTools.length > 0 &&
          renderGroup(
            'profile-posts',
            'The LinkedIn Post GPT',
            <FileText size={12} className="text-violet-500" />,
            aiTools
              .filter((t) =>
                [
                  'profile-optimizer',
                  'transcript-post-idea-grabber',
                  'post-generator',
                  'post-finalizer',
                ].includes(t.slug)
              )
              .map(renderAIToolItem)
          )}

        {/* DM Script GPT */}
        {!isCurriculumOnly &&
          renderGroup(
            'linkedin',
            'The DM Script GPT',
            <MessageSquare size={12} className="text-violet-500" />,
            <>
              {aiTools.filter((t) => ['dm-chat-helper'].includes(t.slug)).map(renderAIToolItem)}
              {renderVirtualToolButton(
                'virtual:connection-qualifier',
                'Connection Qualifier',
                <Users size={14} />
              )}
            </>
          )}

        {/* GTM Infrastructure */}
        {!isCurriculumOnly &&
          renderGroup(
            'infrastructure',
            'GTM Infrastructure',
            <Server size={12} className="text-violet-500" />,
            <>
              {renderVirtualToolButton(
                'virtual:infra-account-setup',
                'Account Setup',
                <Users size={14} />
              )}
              {renderVirtualToolButton(
                'virtual:infra-email-infra',
                'Email Infra',
                <Mail size={14} />
              )}
            </>
          )}

        {/* Outbound */}
        {!isCurriculumOnly &&
          renderGroup(
            'outbound',
            'Outbound',
            <Send size={12} className="text-violet-500" />,
            <>
              {aiTools
                .filter((t) => ['cold-email-mastermind'].includes(t.slug))
                .map(renderAIToolItem)}
              {renderVirtualToolButton('virtual:tam-builder', 'TAM Builder', <Target size={14} />)}
              {renderVirtualToolButton(
                'virtual:cold-email-recipes',
                'Recipe Builder',
                <Mail size={14} />
              )}
              {renderVirtualToolButton(
                'virtual:email-enrichment',
                'Email Enrichment',
                <Mail size={14} />
              )}
            </>
          )}

        {/* Clay Tables */}
        {!isCurriculumOnly &&
          toolGroups.tables.length > 0 &&
          renderGroup(
            'tables',
            'Clay Tables',
            <Database size={12} className="text-violet-500" />,
            toolGroups.tables.map(renderToolItem)
          )}

        {/* Access & Links */}
        {!isCurriculumOnly &&
          toolGroups.logins.length > 0 &&
          renderGroup(
            'logins',
            'Access & Links',
            <Key size={12} className="text-zinc-400" />,
            toolGroups.logins.map(renderToolItem)
          )}
      </div>
    </>
  );
};

export default SidebarToolsSection;
