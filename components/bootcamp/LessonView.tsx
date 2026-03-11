/**
 * LessonView.tsx
 * Top-level lesson display component. Derives content-type flags from lesson.embedUrl,
 * then dispatches to ChecklistHub (checklist lessons) or LessonContentRenderer (all others).
 * Also handles the special "My Blueprint" virtual lesson.
 */

import React, { useState } from 'react';
import { ClipboardList, Sparkles } from 'lucide-react';
import type { Lesson, Week } from '../../types/bootcamp-types';
import type { BootcampStudent } from '../../types/bootcamp-types';
import MyBlueprint from './MyBlueprint';
import LessonNavigation from './LessonNavigation';
import LessonContentRenderer from './LessonContentRenderer';
import { ChecklistHub } from './ChecklistHub';
import { usePickaxeEmbed } from '../../hooks/usePickaxeEmbed';
import { logError } from '../../lib/logError';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Domains that can be safely embedded in iframes without X-Frame-Options issues. */
const EMBEDDABLE_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'loom.com',
  'vimeo.com',
  'grain.com',
  'grain.co',
  'gamma.app',
  'guidde.com',
  'clay.com',
  'airtable.com',
  'figma.com/embed',
  'miro.com',
  'canva.com/design',
  'docs.google.com/spreadsheets',
  'drive.google.com/file',
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

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
  prevLesson?: Lesson | null;
  nextLesson?: Lesson | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip admin-facing prefixes (TOOL:, TASK:, TABLE:) from lesson titles. */
const cleanTitle = (title: string): string =>
  title.replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '').trim();

/** Parse the JSON payload from a credentials: embedUrl. Returns null on failure. */
const parseCredentials = (embedUrl: string): Record<string, string> | null => {
  try {
    return JSON.parse(embedUrl.replace('credentials:', ''));
  } catch (err) {
    logError('LessonView:parseCredentials', err);
    return null;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

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
  prevLesson = null,
  nextLesson = null,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ── Content type detection ────────────────────────────────────────────────

  const isMyBlueprint = lesson.embedUrl === 'virtual:my-blueprint';
  const isChecklistHub =
    lesson.id.endsWith(':checklist') || lesson.embedUrl === 'virtual:checklist';
  const isAistudio = lesson.embedUrl.includes('aistudio.google.com');
  const isTextContent = lesson.embedUrl.startsWith('text:');
  const isCustomAITool = lesson.embedUrl.startsWith('ai-tool:');
  const isCredentials = lesson.embedUrl.startsWith('credentials:');
  const isPdf =
    lesson.embedUrl.toLowerCase().endsWith('.pdf') ||
    lesson.embedUrl.toLowerCase().includes('.pdf?');

  // HTML vs plain markdown for text: lessons
  const textRawContent = isTextContent ? lesson.embedUrl.replace(/^text:\s*/, '') : '';
  const isHtmlContent =
    textRawContent.startsWith('<!--docx-->') ||
    textRawContent.trimStart().startsWith('<p>') ||
    textRawContent.trimStart().startsWith('<h1');
  const htmlContent = isHtmlContent ? textRawContent.replace('<!--docx-->', '') : '';

  const credentialsData = isCredentials ? parseCredentials(lesson.embedUrl) : null;

  const aiToolSlug = isCustomAITool ? lesson.embedUrl.replace('ai-tool:', '').trim() : null;

  // Pickaxe / custom-embed detection (legacy)
  const isPickaxe =
    !isTextContent &&
    !isCustomAITool &&
    (lesson.embedUrl.startsWith('custom-embed:') ||
      lesson.embedUrl.startsWith('pickaxe:') ||
      lesson.embedUrl.includes('modernagencysales.com') ||
      lesson.embedUrl.includes('pickaxeproject.com') ||
      lesson.embedUrl.includes('pickaxe.co') ||
      lesson.embedUrl.includes('deployment-'));

  const pickaxeId: string | null = (() => {
    if (!isPickaxe) return null;
    if (lesson.embedUrl.startsWith('custom-embed:'))
      return lesson.embedUrl.replace('custom-embed:', '').trim();
    if (lesson.embedUrl.startsWith('pickaxe:'))
      return lesson.embedUrl.replace('pickaxe:', '').trim();
    const match = lesson.embedUrl.match(/(deployment-[a-zA-Z0-9-]+)/i);
    return match ? match[1] : null;
  })();

  const scriptSrc =
    lesson.embedUrl.includes('pickaxe.co') || lesson.embedUrl.includes('pickaxeproject.com')
      ? 'https://studio.pickaxe.co/api/embed/bundle.js'
      : 'https://studio.modernagencysales.com/api/embed/bundle.js';

  // External link: any http URL NOT in the embeddable domains allowlist
  const isExternalLink = (() => {
    if (isTextContent || isAistudio || isPdf) return false;
    if (
      lesson.embedUrl.startsWith('text:') ||
      lesson.embedUrl.startsWith('ai-tool:') ||
      lesson.embedUrl.startsWith('credentials:') ||
      lesson.embedUrl.startsWith('custom-embed:') ||
      lesson.embedUrl.startsWith('pickaxe:') ||
      lesson.embedUrl.startsWith('virtual:')
    )
      return false;
    if (!lesson.embedUrl.startsWith('http')) return false;
    return !EMBEDDABLE_DOMAINS.some((domain) => lesson.embedUrl.includes(domain));
  })();

  // ── Side effects ──────────────────────────────────────────────────────────

  usePickaxeEmbed({ isPickaxe, pickaxeId, scriptSrc });

  // ── Clipboard handler ─────────────────────────────────────────────────────

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      logError('LessonView:handleCopy', err);
    }
  };

  // ── Special case: My Blueprint full-page ─────────────────────────────────

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

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      {/* Header */}
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
            {isChecklistHub ? 'Project Workflow' : cleanTitle(lesson.title)}
          </h2>
        </div>
      </header>

      {/* Body */}
      {isChecklistHub ? (
        <ChecklistHub
          currentWeek={currentWeek}
          completedItems={completedItems}
          proofOfWork={proofOfWork}
          taskNotes={taskNotes}
          onToggleItem={onToggleItem}
          onUpdateProof={onUpdateProof}
          onUpdateNote={onUpdateNote}
        />
      ) : (
        <>
          <LessonContentRenderer
            lesson={lesson}
            studentId={studentId}
            isTextContent={isTextContent}
            isHtmlContent={isHtmlContent}
            htmlContent={htmlContent}
            textRawContent={textRawContent}
            isCredentials={isCredentials}
            credentialsData={credentialsData}
            isCustomAITool={isCustomAITool}
            aiToolSlug={aiToolSlug}
            isPickaxe={isPickaxe}
            pickaxeId={pickaxeId}
            isAistudio={isAistudio}
            isPdf={isPdf}
            isExternalLink={isExternalLink}
            copiedField={copiedField}
            onCopy={handleCopy}
          />
          <LessonNavigation
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onSelectLesson={_onSelectLesson}
          />
        </>
      )}
    </div>
  );
};

export default LessonView;
