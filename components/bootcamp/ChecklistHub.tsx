/**
 * ChecklistHub.tsx
 * Task accordion for the "Project Workflow" checklist view.
 * Renders a list of week action items — each expandable to show notes, proof URL,
 * and a mark-complete toggle. Initialises the first task as active on mount.
 * No data fetching. All state is lifted to parent (LessonView).
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, Target, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Week } from '../../types/bootcamp-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChecklistHubProps {
  currentWeek?: Week;
  completedItems: Set<string>;
  proofOfWork: Record<string, string>;
  taskNotes: Record<string, string>;
  onToggleItem: (id: string) => void;
  onUpdateProof: (id: string, proof: string) => void;
  onUpdateNote: (id: string, note: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip admin-facing prefixes (TOOL:, TASK:, TABLE:) from task titles. */
const cleanTitle = (title: string): string =>
  title.replace(/^(TOOL:|TASK:|TABLE:?)\s*/gi, '').trim();

// ─── Component ────────────────────────────────────────────────────────────────

export const ChecklistHub: React.FC<ChecklistHubProps> = ({
  currentWeek,
  completedItems,
  proofOfWork,
  taskNotes,
  onToggleItem,
  onUpdateProof,
  onUpdateNote,
}) => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const weekTasks = currentWeek?.actionItems || [];

  // Open the first task by default when the week loads
  useEffect(() => {
    if (weekTasks.length && !activeTaskId) {
      setActiveTaskId(weekTasks[0].id);
    }
  }, [weekTasks, activeTaskId]);

  return (
    <div className="space-y-3">
      {weekTasks.map((task, idx) => {
        const isActive = activeTaskId === task.id;
        const isDone = completedItems.has(task.id);

        return (
          <div
            key={task.id}
            className={`bg-white dark:bg-zinc-900 rounded-lg border transition-all ${
              isActive ? 'border-violet-500 shadow-md' : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {/* ── Accordion header ─────────────────────────────────────── */}
            <button
              onClick={() => setActiveTaskId(isActive ? null : task.id)}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-medium ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
              </div>
              <h4
                className={`flex-1 text-sm font-medium ${
                  isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {cleanTitle(task.text)}
              </h4>
              {isActive ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* ── Accordion body ───────────────────────────────────────── */}
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
                      className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                        isDone
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-violet-500 hover:bg-violet-600 text-white'
                      }`}
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
  );
};

export default ChecklistHub;
