/**
 * DeliverableEditForm. Expanded edit form for a single deliverable in the template editor.
 * Constraint: Receives all data and callbacks via props — no direct DB access or hook calls.
 */

import React from 'react';

import { CATEGORIES, AUTOMATION_TYPES, AUTOMATION_TRIGGERS, PRIORITIES } from './constants';
import {
  CATEGORY_LABELS,
  AUTOMATION_TYPE_LABELS,
  AUTOMATION_TRIGGER_LABELS,
  PRIORITY_LABELS,
} from '../../../../types/dfy-admin-types';

import type {
  DfyDeliverableTemplateV2,
  DfyMilestoneTemplate,
} from '../../../../types/dfy-admin-types';

// ─── Types ──────────────────────────────────────────────────────

export interface EditFormStyleClasses {
  inputClass: string;
  selectClass: string;
  labelClass: string;
}

export interface DeliverableEditFormProps {
  row: DfyDeliverableTemplateV2;
  index: number;
  milestones: DfyMilestoneTemplate[];
  deliverables: DfyDeliverableTemplateV2[];
  isDarkMode: boolean;
  styles: EditFormStyleClasses;
  onUpdate: (index: number, field: string, value: unknown) => void;
}

// ─── Component ──────────────────────────────────────────────────

const DeliverableEditForm: React.FC<DeliverableEditFormProps> = ({
  row,
  index,
  milestones,
  deliverables,
  isDarkMode,
  styles,
  onUpdate,
}) => {
  const { inputClass, selectClass, labelClass } = styles;

  return (
    <div
      className={`px-4 py-4 space-y-4 ${
        isDarkMode
          ? 'bg-zinc-800/20 border-b border-zinc-800'
          : 'bg-zinc-50/50 border-b border-zinc-200'
      }`}
    >
      {/* Row 1: core fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={row.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            placeholder="Deliverable name"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={row.description}
            onChange={(e) => onUpdate(index, 'description', e.target.value)}
            placeholder="Brief description"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={row.category}
            onChange={(e) => onUpdate(index, 'category', e.target.value)}
            className={selectClass}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Assignee</label>
          <input
            type="text"
            value={row.assignee}
            onChange={(e) => onUpdate(index, 'assignee', e.target.value)}
            placeholder="e.g. Team"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Due (days)</label>
          <input
            type="number"
            min={0}
            value={row.relative_due_days}
            onChange={(e) =>
              onUpdate(index, 'relative_due_days', parseInt(e.target.value, 10) || 0)
            }
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 2: milestone + priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className={labelClass}>Milestone</label>
          <select
            value={row.milestone}
            onChange={(e) => onUpdate(index, 'milestone', e.target.value)}
            className={selectClass}
          >
            <option value="">(None)</option>
            {milestones.map((ms) => (
              <option key={ms.name} value={ms.name}>
                {ms.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select
            value={row.priority}
            onChange={(e) => onUpdate(index, 'priority', parseInt(e.target.value, 10))}
            className={selectClass}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Detail fields: Dependencies, Playbook, Automation */}
      <div
        className={`p-3 rounded-md space-y-3 ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-100/80'}`}
      >
        {/* Dependencies */}
        <div>
          <label className={labelClass}>Dependencies</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {deliverables
              .filter((_, i) => i !== index)
              .map((other) => {
                if (!other.name) return null;
                const isSelected = row.depends_on?.includes(other.name) ?? false;
                return (
                  <label
                    key={other.name}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-purple-900/30 text-purple-300'
                          : 'bg-purple-100 text-purple-700'
                        : isDarkMode
                          ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                          : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const current = row.depends_on || [];
                        const updated = e.target.checked
                          ? [...current, other.name]
                          : current.filter((d) => d !== other.name);
                        onUpdate(index, 'depends_on', updated);
                      }}
                      className="w-3 h-3 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                    />
                    {other.name}
                  </label>
                );
              })}
            {deliverables.filter((_, i) => i !== index && deliverables[i].name).length === 0 && (
              <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                No other named deliverables to depend on
              </span>
            )}
          </div>
        </div>

        {/* Playbook URL */}
        <div>
          <label className={labelClass}>Playbook URL</label>
          <input
            type="url"
            value={row.playbook_url || ''}
            onChange={(e) => onUpdate(index, 'playbook_url', e.target.value)}
            placeholder="https://dwy-playbook.vercel.app/..."
            className={inputClass}
          />
        </div>

        {/* Automation Config */}
        <div>
          <label className={labelClass}>Automation</label>
          <div className="space-y-2 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={row.automation_config.automatable}
                onChange={(e) => onUpdate(index, 'automation_config.automatable', e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
              />
              <span className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Automatable
              </span>
            </label>

            {row.automation_config.automatable && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                <div>
                  <label className={labelClass}>Automation Type</label>
                  <select
                    value={row.automation_config.automation_type || ''}
                    onChange={(e) =>
                      onUpdate(
                        index,
                        'automation_config.automation_type',
                        e.target.value || undefined
                      )
                    }
                    className={selectClass}
                  >
                    <option value="">Select type...</option>
                    {AUTOMATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {AUTOMATION_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Trigger</label>
                  <select
                    value={row.automation_config.trigger}
                    onChange={(e) => onUpdate(index, 'automation_config.trigger', e.target.value)}
                    className={selectClass}
                  >
                    {AUTOMATION_TRIGGERS.map((t) => (
                      <option key={t} value={t}>
                        {AUTOMATION_TRIGGER_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverableEditForm;
