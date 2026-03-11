/**
 * DeliverablesSection. Grouped deliverable list with row/edit-form accordion for the template editor.
 * Constraint: Receives all data and callbacks via props — no direct DB access or hook calls.
 */

import React from 'react';
import { Plus } from 'lucide-react';

import DeliverableRow from './DeliverableRow';
import DeliverableEditForm from './DeliverableEditForm';

import type {
  DfyDeliverableTemplateV2,
  DfyMilestoneTemplate,
} from '../../../../types/dfy-admin-types';
import type { GroupedDeliverableEntry } from '../../../../hooks/useDfyTemplateEditor';
import type { EditFormStyleClasses } from './DeliverableEditForm';

// ─── Types ──────────────────────────────────────────────────────

export interface DeliverablesSectionProps {
  deliverables: DfyDeliverableTemplateV2[];
  milestones: DfyMilestoneTemplate[];
  groupedDeliverables: Map<string, GroupedDeliverableEntry[]>;
  expandedDeliverable: number | null;
  isDarkMode: boolean;
  styles: EditFormStyleClasses;
  onAdd: (milestone?: string) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: unknown) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onToggle: (index: number) => void;
}

// ─── Component ──────────────────────────────────────────────────

const DeliverablesSection: React.FC<DeliverablesSectionProps> = ({
  deliverables,
  milestones,
  groupedDeliverables,
  expandedDeliverable,
  isDarkMode,
  styles,
  onAdd,
  onRemove,
  onUpdate,
  onMove,
  onToggle,
}) => {
  // ─── Header ─────────────────────────────────────────────────

  const header = (
    <div
      className={`px-4 py-3 border-b flex items-center justify-between ${
        isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
          Deliverables
        </h3>
        <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          ({deliverables.length})
        </span>
      </div>
      <button
        onClick={() => onAdd()}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          isDarkMode
            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
      >
        <Plus className="w-3 h-3" />
        Add Deliverable
      </button>
    </div>
  );

  // ─── Empty state ──────────────────────────────────────────────

  if (deliverables.length === 0) {
    return (
      <>
        {header}
        <div className="p-6 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            No deliverables. Click "Add Deliverable" to start.
          </p>
        </div>
      </>
    );
  }

  // ─── Grouped rows ─────────────────────────────────────────────

  return (
    <>
      {header}
      <div>
        {Array.from(groupedDeliverables.entries()).map(([groupName, items]) => {
          if (items.length === 0 && groupName === 'Ungrouped') return null;
          const isUngrouped = groupName === 'Ungrouped';

          return (
            <div key={groupName}>
              {/* Group header */}
              <div
                className={`px-4 py-2 flex items-center justify-between ${
                  isDarkMode
                    ? 'bg-zinc-800/50 border-b border-zinc-800'
                    : 'bg-zinc-50 border-b border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    {groupName}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    ({items.length})
                  </span>
                </div>
                {!isUngrouped && (
                  <button
                    onClick={() => onAdd(groupName)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      isDarkMode
                        ? 'text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                        : 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>

              {/* Deliverable rows */}
              <div className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                {items.map(({ deliverable: row, globalIndex: index }) => (
                  <div key={index}>
                    <DeliverableRow
                      row={row}
                      index={index}
                      isExpanded={expandedDeliverable === index}
                      isFirst={index === 0}
                      isLast={index === deliverables.length - 1}
                      isDarkMode={isDarkMode}
                      onToggle={onToggle}
                      onMove={onMove}
                      onRemove={onRemove}
                    />
                    {expandedDeliverable === index && (
                      <DeliverableEditForm
                        row={row}
                        index={index}
                        milestones={milestones}
                        deliverables={deliverables}
                        isDarkMode={isDarkMode}
                        styles={styles}
                        onUpdate={onUpdate}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default DeliverablesSection;
