/**
 * ProposalRoadmapSection — Dynamic roadmap phases with add/remove.
 * Constraint: pure presentation; receives form values and callbacks via props.
 */

import React from 'react';

import type { FormState } from '../../../../hooks/useProposalForm';
import type { ProposalRoadmapPhase } from '../../../../types/proposal-types';

// ─── Constants ───────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  roadmap: FormState['roadmap'];
  addPhase: () => void;
  removePhase: (idx: number) => void;
  updatePhase: (
    idx: number,
    field: keyof ProposalRoadmapPhase,
    value: string | number | string[]
  ) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProposalRoadmapSection: React.FC<Props> = ({
  roadmap,
  addPhase,
  removePhase,
  updatePhase,
}) => {
  return (
    <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Roadmap</h3>
        <button
          onClick={addPhase}
          className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          + Add Phase
        </button>
      </div>
      <div className="space-y-4">
        {roadmap.map((phase, idx) => (
          <div key={idx} className="border border-zinc-100 dark:border-zinc-700/50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-zinc-500">Phase {phase.phase}</span>
              <button
                onClick={() => removePhase(idx)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Phase #</label>
                <input
                  type="number"
                  value={phase.phase}
                  onChange={(e) => updatePhase(idx, 'phase', parseInt(e.target.value) || 0)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Duration</label>
                <input
                  type="text"
                  value={phase.duration}
                  onChange={(e) => updatePhase(idx, 'duration', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={phase.title}
                  onChange={(e) => updatePhase(idx, 'title', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  value={phase.description}
                  onChange={(e) => updatePhase(idx, 'description', e.target.value)}
                  className={`${INPUT_CLASS} h-16`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">
                  Milestones (comma-separated)
                </label>
                <input
                  type="text"
                  value={phase.milestones.join(', ')}
                  onChange={(e) =>
                    updatePhase(
                      idx,
                      'milestones',
                      e.target.value.split(',').map((s) => s.trim())
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProposalRoadmapSection;
