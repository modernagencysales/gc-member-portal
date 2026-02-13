import React from 'react';
import { Lightbulb, ListChecks, FileText, HelpCircle } from 'lucide-react';

interface LessonDescriptionProps {
  description: string;
}

interface Section {
  type: 'takeaways' | 'tasks' | 'template' | 'prompt' | 'intro';
  content: string;
}

const SECTION_CONFIG = {
  takeaways: {
    label: 'Takeaways',
    icon: Lightbulb,
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800',
    iconColor: 'text-sky-500',
    headerColor: 'text-sky-700 dark:text-sky-300',
  },
  tasks: {
    label: 'Your Tasks',
    icon: ListChecks,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500',
    headerColor: 'text-emerald-700 dark:text-emerald-300',
  },
  template: {
    label: 'Template',
    icon: FileText,
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    iconColor: 'text-violet-500',
    headerColor: 'text-violet-700 dark:text-violet-300',
  },
  prompt: {
    label: 'Prompt',
    icon: HelpCircle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
    headerColor: 'text-amber-700 dark:text-amber-300',
  },
  intro: {
    label: '',
    icon: Lightbulb,
    bg: 'bg-white dark:bg-zinc-900',
    border: 'border-zinc-200 dark:border-zinc-800',
    iconColor: 'text-zinc-400',
    headerColor: 'text-zinc-700 dark:text-zinc-300',
  },
};

function parseSections(text: string): Section[] {
  const sections: Section[] = [];
  const headerRegex = /^## (Takeaways|Your Tasks|Template|Prompt)\s*$/gm;

  const headers: { type: Section['type']; index: number; length: number }[] = [];
  let match;

  while ((match = headerRegex.exec(text)) !== null) {
    const label = match[1];
    let type: Section['type'];
    if (label === 'Takeaways') type = 'takeaways';
    else if (label === 'Your Tasks') type = 'tasks';
    else if (label === 'Template') type = 'template';
    else type = 'prompt';

    headers.push({ type, index: match.index, length: match[0].length });
  }

  if (headers.length === 0) {
    // No structured sections — return as plain intro
    const trimmed = text.trim();
    if (trimmed) sections.push({ type: 'intro', content: trimmed });
    return sections;
  }

  // Capture any text before the first header as intro
  const beforeFirst = text.slice(0, headers[0].index).trim();
  if (beforeFirst) {
    sections.push({ type: 'intro', content: beforeFirst });
  }

  // Extract each section's content
  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index + headers[i].length;
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
    const content = text.slice(start, end).trim();
    if (content) {
      sections.push({ type: headers[i].type, content });
    }
  }

  return sections;
}

const LessonDescription: React.FC<LessonDescriptionProps> = ({ description }) => {
  const sections = parseSections(description);

  if (sections.length === 0) return null;

  // If there's only a plain intro section with no structured headers, render simple
  if (sections.length === 1 && sections[0].type === 'intro') {
    return (
      <div className="mt-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
        {sections[0].content}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {sections.map((section, idx) => {
        const config = SECTION_CONFIG[section.type];
        const Icon = config.icon;

        if (section.type === 'intro') {
          return (
            <div
              key={idx}
              className={`rounded-lg border ${config.border} ${config.bg} p-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap`}
            >
              {section.content}
            </div>
          );
        }

        return (
          <div
            key={idx}
            className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden`}
          >
            <div className="flex items-center gap-2 px-5 pt-4 pb-2">
              <Icon size={16} className={config.iconColor} />
              <h3 className={`text-sm font-semibold ${config.headerColor}`}>{config.label}</h3>
            </div>
            <div className="px-5 pb-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {section.content}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LessonDescription;
