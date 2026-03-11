/**
 * ProposalServicesSection — Dynamic list of proposal services with add/remove.
 * Constraint: pure presentation; receives form values and callbacks via props.
 */

import React from 'react';

import type { FormState } from '../../../../hooks/useProposalForm';
import type { ProposalService } from '../../../../types/proposal-types';

// ─── Constants ───────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  services: FormState['services'];
  addService: () => void;
  removeService: (idx: number) => void;
  updateService: (idx: number, field: keyof ProposalService, value: string | string[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProposalServicesSection: React.FC<Props> = ({
  services,
  addService,
  removeService,
  updateService,
}) => {
  return (
    <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Services</h3>
        <button
          onClick={addService}
          className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          + Add Service
        </button>
      </div>
      <div className="space-y-4">
        {services.map((svc, idx) => (
          <div key={idx} className="border border-zinc-100 dark:border-zinc-700/50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-zinc-500">Service {idx + 1}</span>
              <button
                onClick={() => removeService(idx)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={svc.name}
                  onChange={(e) => updateService(idx, 'name', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Timeline</label>
                <input
                  type="text"
                  value={svc.timeline}
                  onChange={(e) => updateService(idx, 'timeline', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  value={svc.description}
                  onChange={(e) => updateService(idx, 'description', e.target.value)}
                  className={`${INPUT_CLASS} h-16`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">
                  Deliverables (comma-separated)
                </label>
                <input
                  type="text"
                  value={svc.deliverables.join(', ')}
                  onChange={(e) =>
                    updateService(
                      idx,
                      'deliverables',
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

export default ProposalServicesSection;
