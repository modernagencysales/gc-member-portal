/**
 * MilestonesEditor. Accordion-based milestones section for the DFY template editor.
 * Constraint: Receives all data and callbacks via props — no direct DB access or hook calls.
 */

import React from 'react';
import { Plus, X, ChevronUp, ChevronDown, ChevronRight, Layers } from 'lucide-react';

import type {
  DfyMilestoneTemplate,
  DfyDeliverableTemplateV2,
} from '../../../../types/dfy-admin-types';

// ─── Types ──────────────────────────────────────────────────────

export interface StyleClasses {
  inputClass: string;
  labelClass: string;
}

export interface MilestonesEditorProps {
  milestones: DfyMilestoneTemplate[];
  deliverables: DfyDeliverableTemplateV2[];
  collapsedMilestones: Set<number>;
  isDarkMode: boolean;
  styles: StyleClasses;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof DfyMilestoneTemplate, value: string | number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onToggle: (index: number) => void;
}

// ─── Component ──────────────────────────────────────────────────

const MilestonesEditor: React.FC<MilestonesEditorProps> = ({
  milestones,
  deliverables,
  collapsedMilestones,
  isDarkMode,
  styles,
  onAdd,
  onRemove,
  onUpdate,
  onMove,
  onToggle,
}) => {
  const { inputClass, labelClass } = styles;

  return (
    <>
      {/* Header */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-500" />
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Milestones
          </h3>
          <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            ({milestones.length})
          </span>
        </div>
        <button
          onClick={onAdd}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            isDarkMode
              ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <Plus className="w-3 h-3" />
          Add Milestone
        </button>
      </div>

      {/* Body */}
      {milestones.length === 0 ? (
        <div className="p-6 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            No milestones. Click "Add Milestone" to start.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {milestones.map((ms, msIndex) => (
            <div key={msIndex} className="p-4">
              <div className="flex items-start gap-3">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    onClick={() => onMove(msIndex, 'up')}
                    disabled={msIndex === 0}
                    className={`p-1 rounded transition-colors disabled:opacity-20 ${
                      isDarkMode
                        ? 'text-zinc-400 hover:bg-zinc-800'
                        : 'text-zinc-400 hover:bg-zinc-100'
                    }`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onMove(msIndex, 'down')}
                    disabled={msIndex === milestones.length - 1}
                    className={`p-1 rounded transition-colors disabled:opacity-20 ${
                      isDarkMode
                        ? 'text-zinc-400 hover:bg-zinc-800'
                        : 'text-zinc-400 hover:bg-zinc-100'
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Collapse toggle */}
                <button
                  onClick={() => onToggle(msIndex)}
                  className={`p-1 rounded transition-colors mt-1 ${
                    isDarkMode
                      ? 'text-zinc-400 hover:bg-zinc-800'
                      : 'text-zinc-400 hover:bg-zinc-100'
                  }`}
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      !collapsedMilestones.has(msIndex) ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Fields */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input
                        type="text"
                        value={ms.name}
                        onChange={(e) => onUpdate(msIndex, 'name', e.target.value)}
                        placeholder="Milestone name"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <input
                        type="text"
                        value={ms.description}
                        onChange={(e) => onUpdate(msIndex, 'description', e.target.value)}
                        placeholder="Brief description"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Target Day</label>
                      <input
                        type="number"
                        min={0}
                        value={ms.target_day_offset}
                        onChange={(e) =>
                          onUpdate(msIndex, 'target_day_offset', parseInt(e.target.value, 10) || 0)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-end">
                      <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Week {Math.ceil(ms.target_day_offset / 7)} &middot;{' '}
                        {deliverables.filter((d) => d.milestone === ms.name).length} deliverables
                      </span>
                    </div>
                  </div>

                  {/* Deliverables under this milestone (when expanded) */}
                  {!collapsedMilestones.has(msIndex) && (
                    <div className="mt-3 ml-2 space-y-1">
                      {deliverables
                        .map((d, i) => ({ d, i }))
                        .filter(({ d }) => d.milestone === ms.name)
                        .map(({ d, i }) => (
                          <div
                            key={i}
                            className={`text-xs px-2 py-1 rounded ${
                              isDarkMode
                                ? 'text-zinc-400 bg-zinc-800/50'
                                : 'text-zinc-500 bg-zinc-50'
                            }`}
                          >
                            {d.name || '(untitled)'}
                            {d.automation_config.automatable &&
                              d.automation_config.automation_type && (
                                <span className="ml-1 text-violet-400">[AUTO]</span>
                              )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() => onRemove(msIndex)}
                  className={`p-2 rounded-md transition-colors mt-1 ${
                    isDarkMode
                      ? 'text-zinc-500 hover:bg-red-900/20 hover:text-red-400'
                      : 'text-zinc-400 hover:bg-red-50 hover:text-red-600'
                  }`}
                  title="Remove milestone"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MilestonesEditor;
