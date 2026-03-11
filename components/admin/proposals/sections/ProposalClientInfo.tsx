/**
 * ProposalClientInfo — Client info fields, client snapshot, and headline/summary.
 * Constraint: pure presentation; receives form values and callbacks via props.
 */

import React from 'react';

import type { FormState } from '../../../../hooks/useProposalForm';
import type { ProposalGoal } from '../../../../types/proposal-types';

// ─── Constants ───────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  form: FormState;
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  updateSnapshot: (key: keyof FormState['clientSnapshot'], value: string) => void;
  updateGoal: (idx: number, field: keyof ProposalGoal, value: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProposalClientInfo: React.FC<Props> = ({ form, updateField, updateSnapshot, updateGoal }) => {
  return (
    <>
      {/* Client Info */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Client Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client Name</label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              type="text"
              value={form.clientCompany}
              onChange={(e) => updateField('clientCompany', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={form.clientTitle}
              onChange={(e) => updateField('clientTitle', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              type="text"
              value={form.clientWebsite}
              onChange={(e) => updateField('clientWebsite', e.target.value)}
              className={INPUT_CLASS}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand Color</label>
            <input
              type="text"
              value={form.clientBrandColor}
              onChange={(e) => updateField('clientBrandColor', e.target.value)}
              className={INPUT_CLASS}
              placeholder="#6B21A8"
            />
          </div>
        </div>
      </section>

      {/* Headline & Summary */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Headline & Summary</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Headline</label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => updateField('headline', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Executive Summary</label>
            <textarea
              value={form.executiveSummary}
              onChange={(e) => updateField('executiveSummary', e.target.value)}
              className={`${INPUT_CLASS} h-32`}
            />
          </div>
        </div>
      </section>

      {/* Client Snapshot */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Client Snapshot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              type="text"
              value={form.clientSnapshot.company}
              onChange={(e) => updateSnapshot('company', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Industry</label>
            <input
              type="text"
              value={form.clientSnapshot.industry}
              onChange={(e) => updateSnapshot('industry', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <input
              type="text"
              value={form.clientSnapshot.size}
              onChange={(e) => updateSnapshot('size', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Revenue</label>
            <input
              type="text"
              value={form.clientSnapshot.revenue}
              onChange={(e) => updateSnapshot('revenue', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Current State</label>
          <textarea
            value={form.clientSnapshot.currentState}
            onChange={(e) => updateSnapshot('currentState', e.target.value)}
            className={`${INPUT_CLASS} h-24`}
          />
        </div>
      </section>

      {/* Goals */}
      <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Goals</h3>
        <div className="space-y-4">
          {form.goals.map((goal, idx) => (
            <div
              key={idx}
              className="border border-zinc-100 dark:border-zinc-700/50 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Type</label>
                  <select
                    value={goal.type}
                    onChange={(e) => updateGoal(idx, 'type', e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="metric">Metric</option>
                    <option value="aspirational">Aspirational</option>
                    <option value="experimental">Experimental</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Timeline</label>
                  <input
                    type="text"
                    value={goal.timeline}
                    onChange={(e) => updateGoal(idx, 'timeline', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="e.g. 90 days"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={goal.title}
                    onChange={(e) => updateGoal(idx, 'title', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <textarea
                    value={goal.description}
                    onChange={(e) => updateGoal(idx, 'description', e.target.value)}
                    className={`${INPUT_CLASS} h-16`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default ProposalClientInfo;
