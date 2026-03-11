/** ContentCallPrepPanel. Renders call prep output with tabbed sections (Strategy Brief, Questions, Quick Ref). */
import { useState, useMemo } from 'react';
import { Loader2, AlertCircle, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../../../../context/ThemeContext';
import type { DfyAdminDeliverable, DfyAutomationOutput } from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface ContentCallPrepPanelProps {
  output: DfyAutomationOutput | null | undefined;
  isLoading: boolean;
  deliverable: DfyAdminDeliverable;
}

// ─── Component ─────────────────────────────────────────
export default function ContentCallPrepPanel({
  output,
  isLoading,
  deliverable,
}: ContentCallPrepPanelProps) {
  const { isDarkMode } = useTheme();
  const raw = (output?.output_data || {}) as Record<string, unknown>;
  const callPrep = (raw.call_prep as string) || '';
  const hasBlueprintData = raw.has_blueprint_data as boolean;
  const postsIncluded = (raw.posts_included as number) || 0;
  const sections = useMemo(() => {
    const partAMatch = callPrep.match(/# PART A[:\s].*?\n([\s\S]*?)(?=# PART B|$)/i);
    const partBMatch = callPrep.match(/# PART B[:\s].*?\n([\s\S]*?)(?=# QUICK REFERENCE|$)/i);
    const quickRefMatch = callPrep.match(/# QUICK REFERENCE.*?\n([\s\S]*?)$/i);

    const questions: Array<{ id: string; question: string; note: string }> = [];
    if (partBMatch) {
      const qRegex =
        /\*\*Question (\d+)[:.]\*\*\s*\n\s*\n\s*\*"([^]*?)"\*\s*\n\s*\n\s*\*\*Extracting:\*\*\s*([^]*?)(?=\n\s*---|\n\s*\*\*Question|\n\s*##|$)/g;
      let m: RegExpExecArray | null;
      while ((m = qRegex.exec(partBMatch[1])) !== null) {
        questions.push({
          id: `q${m[1]}`,
          question: m[2].trim(),
          note: m[3].trim(),
        });
      }
    }

    return {
      strategyBrief: partAMatch?.[1]?.trim() || callPrep,
      questionsRaw: partBMatch?.[1]?.trim() || '',
      questions,
      quickReference: quickRefMatch?.[1]?.trim() || '',
    };
  }, [callPrep]);

  const [activeSection, setActiveSection] = useState<'brief' | 'questions' | 'quickref'>('brief');
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-500" />
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Loading call prep...
        </p>
      </div>
    );
  }

  if (deliverable.automation_status === 'running') {
    return (
      <div
        className={`rounded-xl border p-6 text-center ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-500 mb-3" />
        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
          Content call prep is being generated...
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          This usually takes 30-60 seconds. Refresh to check.
        </p>
      </div>
    );
  }

  if (!output?.output_data) {
    return (
      <div
        className={`rounded-xl border p-6 text-center ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <AlertCircle
          className={`w-6 h-6 mx-auto mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        />
        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
          No content call prep yet
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {deliverable.automation_status === 'failed'
            ? 'The call prep generation failed. Try re-running from the Overview tab.'
            : 'The call prep will be generated automatically during onboarding.'}
        </p>
      </div>
    );
  }
  const toggleQuestion = (id: string) => {
    setCheckedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const tabClass = (tab: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeSection === tab
        ? isDarkMode
          ? 'bg-violet-600 text-white'
          : 'bg-violet-600 text-white'
        : isDarkMode
          ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
    }`;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div
        className={`rounded-xl border p-4 flex items-center justify-between ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
            Content Call Prep
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Generated {output.completed_at ? new Date(output.completed_at).toLocaleString() : ''}
            {hasBlueprintData
              ? ` · Blueprint data + ${postsIncluded} posts`
              : ' · Basic info only (no Blueprint)'}
            {sections.questions.length > 0
              ? ` · ${checkedQuestions.size}/${sections.questions.length} questions asked`
              : ''}
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(callPrep);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isDarkMode
              ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Copy to Clipboard
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        <button className={tabClass('brief')} onClick={() => setActiveSection('brief')}>
          Strategy Brief
        </button>
        <button className={tabClass('questions')} onClick={() => setActiveSection('questions')}>
          Interview Questions
          {sections.questions.length > 0 && (
            <span className="ml-1.5 text-xs opacity-75">({sections.questions.length})</span>
          )}
        </button>
        <button className={tabClass('quickref')} onClick={() => setActiveSection('quickref')}>
          Quick Reference
        </button>
      </div>

      {/* Strategy Brief tab */}
      {activeSection === 'brief' && (
        <div
          className={`rounded-xl border p-6 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          <div
            className={`prose prose-base prose-h3:mt-8 prose-h3:mb-3 prose-p:mb-4 max-w-none leading-relaxed ${isDarkMode ? 'prose-invert' : ''}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections.strategyBrief}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Interview Questions tab */}
      {activeSection === 'questions' && (
        <div className="space-y-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {sections.questions.length > 0 ? (
            sections.questions.map((q) => (
              <div
                key={q.id}
                className={`rounded-xl border p-5 transition-all ${
                  checkedQuestions.has(q.id)
                    ? isDarkMode
                      ? 'bg-zinc-900/50 border-zinc-700 opacity-60'
                      : 'bg-zinc-50 border-zinc-200 opacity-60'
                    : isDarkMode
                      ? 'bg-zinc-900 border-zinc-800'
                      : 'bg-white border-zinc-200'
                }`}
              >
                <div className="flex gap-4">
                  <button
                    onClick={() => toggleQuestion(q.id)}
                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      checkedQuestions.has(q.id)
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : isDarkMode
                          ? 'border-zinc-600 hover:border-violet-500'
                          : 'border-zinc-300 hover:border-violet-500'
                    }`}
                  >
                    {checkedQuestions.has(q.id) && (
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-base font-medium leading-loose ${
                        checkedQuestions.has(q.id)
                          ? isDarkMode
                            ? 'text-zinc-500 line-through'
                            : 'text-zinc-400 line-through'
                          : isDarkMode
                            ? 'text-zinc-200'
                            : 'text-zinc-800'
                      }`}
                    >
                      {q.question}
                    </p>
                    <p
                      className={`text-sm mt-3 leading-relaxed ${
                        isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      <span className="font-medium">Extracting: </span>
                      {q.note}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              className={`rounded-xl border p-6 ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div
                className={`prose prose-base max-w-none leading-relaxed ${isDarkMode ? 'prose-invert' : ''}`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sections.questionsRaw || callPrep}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Reference tab */}
      {activeSection === 'quickref' && (
        <div
          className={`rounded-xl border p-6 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          <div
            className={`prose prose-base prose-h3:mt-8 prose-h3:mb-3 prose-p:mb-3 prose-li:mb-2 max-w-none leading-loose ${isDarkMode ? 'prose-invert' : ''}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {(sections.quickReference || 'No quick reference card available.').replace(
                /^(SECTION \d+[^\n]*)/gm,
                '\n---\n\n### $1'
              )}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
