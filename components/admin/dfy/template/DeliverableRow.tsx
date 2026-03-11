/**
 * DeliverableRow. Collapsed summary row for a single deliverable in the template editor.
 * Constraint: Receives all data and callbacks via props — no direct DB access or hook calls.
 */

import React from 'react';
import { X, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';

import { CATEGORY_COLORS, PRIORITY_COLORS } from './constants';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../../../../types/dfy-admin-types';

import type { DfyDeliverableTemplateV2 } from '../../../../types/dfy-admin-types';

// ─── Types ──────────────────────────────────────────────────────

export interface DeliverableRowProps {
  row: DfyDeliverableTemplateV2;
  index: number;
  isExpanded: boolean;
  isFirst: boolean;
  isLast: boolean;
  isDarkMode: boolean;
  onToggle: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onRemove: (index: number) => void;
}

// ─── Component ──────────────────────────────────────────────────

const DeliverableRow: React.FC<DeliverableRowProps> = ({
  row,
  index,
  isExpanded,
  isFirst,
  isLast,
  isDarkMode,
  onToggle,
  onMove,
  onRemove,
}) => {
  const catColors = CATEGORY_COLORS[row.category] || CATEGORY_COLORS.onboarding;
  const priColors = PRIORITY_COLORS[row.priority] || PRIORITY_COLORS[3];

  return (
    <div
      className={`px-4 py-2 flex items-center gap-2 cursor-pointer transition-colors ${
        isExpanded
          ? isDarkMode
            ? 'bg-zinc-800/30'
            : 'bg-violet-50/50'
          : isDarkMode
            ? 'hover:bg-zinc-800/20'
            : 'hover:bg-zinc-50'
      }`}
      onClick={() => onToggle(index)}
    >
      {/* Reorder arrows */}
      <div className="flex flex-col gap-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onMove(index, 'up')}
          disabled={isFirst}
          className={`p-0.5 rounded transition-colors disabled:opacity-20 ${
            isDarkMode ? 'text-zinc-500 hover:bg-zinc-700' : 'text-zinc-400 hover:bg-zinc-200'
          }`}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => onMove(index, 'down')}
          disabled={isLast}
          className={`p-0.5 rounded transition-colors disabled:opacity-20 ${
            isDarkMode ? 'text-zinc-500 hover:bg-zinc-700' : 'text-zinc-400 hover:bg-zinc-200'
          }`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Expand chevron */}
      <ChevronRight
        className={`w-4 h-4 shrink-0 transition-transform ${
          isExpanded ? 'rotate-90' : ''
        } ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
      />

      {/* Name */}
      <span
        className={`text-sm font-medium truncate min-w-0 flex-1 ${
          isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
        }`}
      >
        {row.name || '(untitled)'}
      </span>

      {/* Category badge */}
      <span
        className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
          isDarkMode ? catColors.dark : catColors.light
        }`}
      >
        {CATEGORY_LABELS[row.category]}
      </span>

      {/* Assignee */}
      <span className={`text-xs shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {row.assignee}
      </span>

      {/* Due days */}
      <span
        className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
          isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
        }`}
      >
        Day {row.relative_due_days}
      </span>

      {/* Priority badge */}
      {row.priority > 0 && (
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
            isDarkMode ? priColors.dark : priColors.light
          }`}
        >
          P{row.priority} {PRIORITY_LABELS[row.priority]}
        </span>
      )}

      {/* Automation icon */}
      {row.automation_config.automatable && (
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${
            isDarkMode ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-600'
          }`}
          title={`AUTO: ${row.automation_config.automation_type || 'not set'}`}
        >
          AUTO
        </span>
      )}

      {/* Dependency icon */}
      {(row.depends_on?.length ?? 0) > 0 && (
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${
            isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'
          }`}
          title={`Depends on: ${row.depends_on!.join(', ')}`}
        >
          {row.depends_on!.length} dep{row.depends_on!.length !== 1 ? 's' : ''}
        </span>
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className={`p-1 rounded transition-colors shrink-0 ${
          isDarkMode
            ? 'text-zinc-600 hover:bg-red-900/20 hover:text-red-400'
            : 'text-zinc-300 hover:bg-red-50 hover:text-red-600'
        }`}
        title="Remove deliverable"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default DeliverableRow;
