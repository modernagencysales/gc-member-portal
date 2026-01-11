import React, { useEffect, useState } from 'react';
import { Lesson, Week, ActionItem } from '../../types';
import {
  CheckCircle,
  Target,
  Check,
  ClipboardList,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Bot,
} from 'lucide-react';

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
  onSelectLesson,
}) => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const isChecklistHub =
    lesson.id.endsWith(':checklist') || lesson.embedUrl === 'virtual:checklist';
  const isAistudio = lesson.embedUrl.includes('aistudio.google.com');
  const isTextContent = lesson.embedUrl.startsWith('text:');

  // 1. Detect Pickaxe Content
  const isPickaxe =
    !isTextContent &&
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

  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <ClipboardList size={12} /> {isChecklistHub ? 'Action Step' : 'Tutorial'}
            </span>
            {currentWeek && (
              <span className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                • {currentWeek.title}
              </span>
            )}
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isChecklistHub ? `Project Workflow` : cleanTitle(lesson.title)}
          </h2>
        </div>
      </header>

      {isChecklistHub ? (
        <div className="space-y-4">
          {weekTasks.map((task, idx) => {
            const isActive = activeTaskId === task.id;
            const isDone = completedItems.has(task.id);
            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all ${isActive ? 'border-brand-500 shadow-xl' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <button
                  onClick={() => setActiveTaskId(isActive ? null : task.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold ${isDone ? 'bg-green-500 border-green-500 text-white' : isActive ? 'bg-brand-500 border-brand-500 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                  >
                    {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                  </div>
                  <h4
                    className={`flex-1 text-sm font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    {cleanTitle(task.text)}
                  </h4>
                  {isActive ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isActive && (
                  <div className="border-t border-slate-100 dark:border-slate-800 p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <textarea
                        placeholder="Observations..."
                        value={taskNotes[task.id] || ''}
                        onChange={(e) => onUpdateNote(task.id, e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none min-h-[100px]"
                      />
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Proof URL..."
                          value={proofOfWork[task.id] || ''}
                          onChange={(e) => onUpdateProof(task.id, e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none"
                        />
                        <button
                          onClick={() => onToggleItem(task.id)}
                          className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 ${isDone ? 'bg-green-500 text-white' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'}`}
                        >
                          {isDone ? <CheckCircle size={14} /> : <Target size={14} />}{' '}
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
          <div className="mb-10">
            {isTextContent ? (
              <div
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 md:p-16 shadow-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: lesson.embedUrl.replace(/^text:\s*/, '') }}
              />
            ) : isPickaxe && pickaxeId ? (
              <div className="w-full min-h-[800px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col">
                <div
                  key={pickaxeId}
                  id={pickaxeId}
                  className="w-full flex-grow min-h-[700px]"
                ></div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center gap-2">
                  <Bot size={14} className="text-brand-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Powered by Modern Agency Sales
                  </span>
                </div>
              </div>
            ) : isAistudio ? (
              <div className="bg-slate-900 p-16 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center gap-6">
                <ShieldAlert size={32} className="text-brand-400" />
                <h3 className="text-white font-bold text-xl mb-2">Google Security</h3>
                <a
                  href={lesson.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-500 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-3"
                >
                  Open AI Studio <ExternalLink size={16} />
                </a>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 aspect-video">
                <iframe src={lesson.embedUrl} className="w-full h-full border-0" allowFullScreen />
              </div>
            )}
          </div>

          {!isPickaxe && !isAistudio && (
            <div className="bg-slate-900 p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800 shadow-2xl">
              <div className="flex items-center gap-6">
                <Target size={36} className="text-brand-400" />
                <div>
                  <h4 className="font-bold text-white text-xl">Ready to implement?</h4>
                  <p className="text-sm text-slate-400">
                    Log your progress in the project workflow.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  onSelectLesson({
                    id: `${currentWeek?.id}:checklist`,
                    title: 'Tasks',
                    embedUrl: 'virtual:checklist',
                  })
                }
                className="bg-brand-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest"
              >
                Go to Checklist <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonView;
