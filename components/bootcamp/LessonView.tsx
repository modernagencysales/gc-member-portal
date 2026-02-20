import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { Lesson, Week } from '../../types';
import {
  CheckCircle,
  Target,
  Check,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Bot,
  Copy,
  CheckCheck,
  Key,
  Sparkles,
} from 'lucide-react';
import { ChatInterface } from '../chat';
import MyBlueprint from './MyBlueprint';
import LessonDescription from './LessonDescription';
import SopLinksCard from './SopLinksCard';
import { BootcampStudent } from '../../types/bootcamp-types';

// Check if a string starts with an emoji character
const startsWithEmoji = (str: string): boolean => {
  // Match common emoji: pictographic symbols, dingbats, symbols, variation selectors
  // eslint-disable-next-line no-misleading-character-class
  return /^[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2702}-\u{27B0}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2705}\u{2714}\u{2716}\u{274C}\u{274E}\u{2795}-\u{2797}\u{26A0}\u{26A1}\u{2B06}\u{2B07}\u{2B05}\u{25AA}\u{25AB}\u{25FB}-\u{25FE}\u{2934}\u{2935}\u{2139}\u{2122}\u{2611}\u{2660}-\u{2668}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25B6}\u{23EA}\u{2602}\u{2603}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2708}\u{2709}\u{270A}-\u{270D}\u{270F}\u{2712}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2B1B}\u{2B1C}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{2049}\u{203C}\u{00A9}\u{00AE}\u{2666}\u{2665}\u{2660}\u{2663}]/u.test(
    str
  );
};

// Preprocess text content to normalize non-standard formatting into proper markdown
const preprocessTextContent = (content: string): string => {
  const lines = content.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip empty lines, pass through as blank
    if (!trimmed) {
      result.push('');
      continue;
    }

    // Convert lines starting with bullet-like characters to markdown list items
    if (/^[●•▪▸‣⁃◆◇○]\s/.test(trimmed)) {
      result.push(`- ${trimmed.replace(/^[●•▪▸‣⁃◆◇○]\s*/, '')}`);
      continue;
    }

    // Fix bold markers with trailing spaces: **text ** → **text**
    let fixed = trimmed.replace(/\*\*(.+?)\s+\*\*/g, '**$1**');

    // Convert emoji-prefixed lines with uppercase text to markdown headings
    // e.g. "⚡ ENERGY & TONE:" or "💡 STEP 1: START THE CONVO (The Icebreaker)"
    if (startsWithEmoji(trimmed) && trimmed.length < 120) {
      // Check that text after emoji + space starts with uppercase
      const afterEmoji = trimmed.replace(/^[^\w\s]+\s*/, '');
      if (afterEmoji.length > 0 && /^[A-Z]/.test(afterEmoji)) {
        // Add blank line before heading for proper markdown parsing
        if (result.length > 0 && result[result.length - 1] !== '') {
          result.push('');
        }
        result.push(`## ${trimmed}`);
        result.push(''); // blank line after heading
        continue;
      }
    }

    // Detect "Label:" patterns at start of line and bold them
    // e.g. "Golden Rule:" → "**Golden Rule:**"
    if (/^[A-Z][A-Za-z\s]+:/.test(fixed) && fixed.length < 100) {
      fixed = fixed.replace(/^([A-Z][A-Za-z\s]+:)/, '**$1**');
    }

    result.push(fixed);
  }

  return result.join('\n');
};

interface LessonViewProps {
  lesson: Lesson;
  currentWeek?: Week;
  completedItems: Set<string>;
  proofOfWork: Record<string, string>;
  taskNotes: Record<string, string>;
  onToggleItem: (id: string) => void;
  onUpdateProof: (id: string, proof: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  isWeekSubmitted?: boolean;
  onWeekSubmit: (weekId: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  studentId?: string;
  bootcampStudent?: BootcampStudent | null;
}

const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  currentWeek,
  completedItems,
  proofOfWork,
  taskNotes,
  onToggleItem,
  onUpdateProof,
  onUpdateNote,
  onSelectLesson: _onSelectLesson,
  studentId,
  bootcampStudent,
}) => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isMyBlueprint = lesson.embedUrl === 'virtual:my-blueprint';
  const isChecklistHub =
    lesson.id.endsWith(':checklist') || lesson.embedUrl === 'virtual:checklist';
  const isAistudio = lesson.embedUrl.includes('aistudio.google.com');
  const isTextContent = lesson.embedUrl.startsWith('text:');

  // Detect credentials content
  const isCredentials = lesson.embedUrl.startsWith('credentials:');
  const credentialsData = isCredentials
    ? (() => {
        try {
          return JSON.parse(lesson.embedUrl.replace('credentials:', ''));
        } catch {
          return null;
        }
      })()
    : null;

  // Copy to clipboard handler
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 1. Detect Custom AI Tool (replaces Pickaxe)
  const isCustomAITool = lesson.embedUrl.startsWith('ai-tool:');
  const aiToolSlug = isCustomAITool ? lesson.embedUrl.replace('ai-tool:', '').trim() : null;

  console.log('[LessonView] AI Tool detection:', {
    embedUrl: lesson.embedUrl,
    isCustomAITool,
    aiToolSlug,
    studentId,
  });

  // 2. Detect Pickaxe Content (legacy)
  const isPickaxe =
    !isTextContent &&
    !isCustomAITool &&
    (lesson.embedUrl.startsWith('custom-embed:') ||
      lesson.embedUrl.startsWith('pickaxe:') ||
      lesson.embedUrl.includes('modernagencysales.com') ||
      lesson.embedUrl.includes('pickaxeproject.com') ||
      lesson.embedUrl.includes('pickaxe.co') ||
      lesson.embedUrl.includes('deployment-'));

  // 2. Extract Deployment ID exactly like the working version
  let pickaxeId: string | null = null;
  if (isPickaxe) {
    if (lesson.embedUrl.startsWith('custom-embed:')) {
      pickaxeId = lesson.embedUrl.replace('custom-embed:', '').trim();
    } else if (lesson.embedUrl.startsWith('pickaxe:')) {
      pickaxeId = lesson.embedUrl.replace('pickaxe:', '').trim();
    } else {
      const urlMatch = lesson.embedUrl.match(/(deployment-[a-zA-Z0-9-]+)/i);
      if (urlMatch) pickaxeId = urlMatch[1];
    }
  }

  // 3. Determine Script Source
  let scriptSrc = 'https://studio.modernagencysales.com/api/embed/bundle.js';
  if (lesson.embedUrl.includes('pickaxe.co') || lesson.embedUrl.includes('pickaxeproject.com')) {
    scriptSrc = 'https://studio.pickaxe.co/api/embed/bundle.js';
  }

  // 4. MutationObserver & Script Injection (The "Fix")
  useEffect(() => {
    if (!isPickaxe || !pickaxeId) return;

    // Cleanup existing scripts
    const existingScripts = document.querySelectorAll(`script[src*="bundle.js"]`);
    existingScripts.forEach((s) => s.remove());

    // Permission Fixer function
    const fixPermissions = (iframe: HTMLIFrameElement) => {
      let allow = iframe.getAttribute('allow') || '';
      const requiredAllow = [
        'microphone *',
        'camera *',
        'storage-access *',
        'clipboard-write *',
        'encrypted-media *',
        'fullscreen *',
      ];

      let allowChanged = false;
      requiredAllow.forEach((req) => {
        if (!allow.includes(req)) {
          allow += (allow ? '; ' : '') + req;
          allowChanged = true;
        }
      });
      if (allowChanged) iframe.setAttribute('allow', allow);

      if (iframe.hasAttribute('sandbox')) {
        let sandbox = iframe.getAttribute('sandbox') || '';
        const requiredSandbox = [
          'allow-same-origin',
          'allow-scripts',
          'allow-forms',
          'allow-popups',
          'allow-modals',
        ];
        let sandboxChanged = false;
        requiredSandbox.forEach((req) => {
          if (!sandbox.includes(req)) {
            sandbox += (sandbox ? ' ' : '') + req;
            sandboxChanged = true;
          }
        });
        if (sandboxChanged) iframe.setAttribute('sandbox', sandbox.trim());
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME') fixPermissions(node as HTMLIFrameElement);
          if (node instanceof HTMLElement) {
            node.querySelectorAll('iframe').forEach(fixPermissions);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.defer = true;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      observer.disconnect();
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [isPickaxe, pickaxeId, scriptSrc]);

  useEffect(() => {
    if (isChecklistHub && currentWeek?.actionItems?.length && !activeTaskId) {
      setActiveTaskId(currentWeek.actionItems[0].id);
    }
  }, [isChecklistHub, currentWeek, activeTaskId]);

  const weekTasks = currentWeek?.actionItems || [];
  const cleanTitle = (title: string) => title.replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '').trim();

  // My Blueprint full-page view
  if (isMyBlueprint && bootcampStudent) {
    return (
      <div className="max-w-5xl mx-auto w-full pb-12">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
              <Sparkles size={12} /> Blueprint
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">My Blueprint</h2>
        </header>
        <MyBlueprint student={bootcampStudent} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              <ClipboardList size={12} /> {isChecklistHub ? 'Action Step' : 'Tutorial'}
            </span>
            {currentWeek && (
              <span className="text-zinc-400 dark:text-zinc-500 text-xs">
                • {currentWeek.title}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {isChecklistHub ? `Project Workflow` : cleanTitle(lesson.title)}
          </h2>
        </div>
      </header>

      {isChecklistHub ? (
        <div className="space-y-3">
          {weekTasks.map((task, idx) => {
            const isActive = activeTaskId === task.id;
            const isDone = completedItems.has(task.id);
            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-zinc-900 rounded-lg border transition-all ${isActive ? 'border-violet-500 shadow-md' : 'border-zinc-200 dark:border-zinc-800'}`}
              >
                <button
                  onClick={() => setActiveTaskId(isActive ? null : task.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-medium ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-violet-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                  >
                    {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                  </div>
                  <h4
                    className={`flex-1 text-sm font-medium ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}
                  >
                    {cleanTitle(task.text)}
                  </h4>
                  {isActive ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isActive && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 p-5 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <textarea
                        placeholder="Observations..."
                        value={taskNotes[task.id] || ''}
                        onChange={(e) => onUpdateNote(task.id, e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none min-h-[100px] focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      />
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Proof URL..."
                          value={proofOfWork[task.id] || ''}
                          onChange={(e) => onUpdateProof(task.id, e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                        <button
                          onClick={() => onToggleItem(task.id)}
                          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${isDone ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-violet-500 hover:bg-violet-600 text-white'}`}
                        >
                          {isDone ? <CheckCircle size={16} /> : <Target size={16} />}{' '}
                          {isDone ? 'Step Verified' : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="animate-slide-in">
          <div className="mb-8">
            {isTextContent ? (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 text-zinc-700 dark:text-zinc-300 document-content">
                <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                  {preprocessTextContent(lesson.embedUrl.replace(/^text:\s*/, ''))}
                </ReactMarkdown>
              </div>
            ) : isCredentials && credentialsData ? (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Key size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Access Credentials
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Click to copy each field
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {credentialsData.loginUrl && (
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Login URL
                        </p>
                        <a
                          href={credentialsData.loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-violet-600 dark:text-violet-400 hover:underline truncate block"
                        >
                          {credentialsData.loginUrl}
                        </a>
                      </div>
                      <button
                        onClick={() => copyToClipboard(credentialsData.loginUrl, 'loginUrl')}
                        className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Copy URL"
                      >
                        {copiedField === 'loginUrl' ? (
                          <CheckCheck size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} className="text-zinc-400" />
                        )}
                      </button>
                    </div>
                  )}

                  {credentialsData.username && (
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Username / Email
                        </p>
                        <p className="text-sm text-zinc-900 dark:text-white font-mono">
                          {credentialsData.username}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(credentialsData.username, 'username')}
                        className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Copy username"
                      >
                        {copiedField === 'username' ? (
                          <CheckCheck size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} className="text-zinc-400" />
                        )}
                      </button>
                    </div>
                  )}

                  {credentialsData.password && (
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Password
                        </p>
                        <p className="text-sm text-zinc-900 dark:text-white font-mono">
                          {credentialsData.password}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(credentialsData.password, 'password')}
                        className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Copy password"
                      >
                        {copiedField === 'password' ? (
                          <CheckCheck size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} className="text-zinc-400" />
                        )}
                      </button>
                    </div>
                  )}

                  {credentialsData.notes && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                        Notes
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        {credentialsData.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : isCustomAITool && aiToolSlug ? (
              studentId ? (
                <ChatInterface toolSlug={aiToolSlug} studentId={studentId} />
              ) : (
                <div className="w-full h-[600px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                  <div className="text-center text-zinc-500 dark:text-zinc-400">
                    <p>Loading AI Tool...</p>
                  </div>
                </div>
              )
            ) : isPickaxe && pickaxeId ? (
              <div className="w-full min-h-[800px] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col">
                <div
                  key={pickaxeId}
                  id={pickaxeId}
                  className="w-full flex-grow min-h-[700px]"
                ></div>
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center gap-2">
                  <Bot size={14} className="text-violet-500" />
                  <span className="text-xs text-zinc-500">Powered by Modern Agency Sales</span>
                </div>
              </div>
            ) : isAistudio ? (
              <div className="bg-zinc-900 p-12 rounded-lg border border-zinc-800 flex flex-col items-center justify-center text-center gap-6">
                <ShieldAlert size={32} className="text-violet-400" />
                <h3 className="text-white font-semibold text-lg mb-2">Google Security</h3>
                <a
                  href={lesson.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  Open AI Studio <ExternalLink size={16} />
                </a>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 aspect-video">
                <iframe src={lesson.embedUrl} className="w-full h-full border-0" allowFullScreen />
              </div>
            )}

            {/* Show description text below content if available */}
            {!isTextContent && lesson.description && (
              <LessonDescription description={lesson.description} />
            )}

            {/* Show reference SOPs if available */}
            {lesson.sopLinks && lesson.sopLinks.length > 0 && (
              <SopLinksCard sopLinks={lesson.sopLinks} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonView;
