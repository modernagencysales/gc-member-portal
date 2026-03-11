/**
 * ProposalPricingSection — Pricing packages, custom items, totals, and monthly rate.
 * Constraint: pure presentation; receives form values and callbacks via props.
 */

import React from 'react';

import type { FormState } from '../../../../hooks/useProposalForm';

// ─── Constants ───────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  pricing: FormState['pricing'];
  monthlyRateCents: FormState['monthlyRateCents'];
  updatePricingPackage: (idx: number, field: string, value: string | string[] | boolean) => void;
  addPricingCustomItem: () => void;
  removePricingCustomItem: (idx: number) => void;
  updatePricingCustomItem: (idx: number, field: 'label' | 'price', value: string) => void;
  updatePricingTotal: (value: string) => void;
  updatePricingPaymentTerms: (value: string) => void;
  updateMonthlyRateCents: (dollars: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProposalPricingSection: React.FC<Props> = ({
  pricing,
  monthlyRateCents,
  updatePricingPackage,
  addPricingCustomItem,
  removePricingCustomItem,
  updatePricingCustomItem,
  updatePricingTotal,
  updatePricingPaymentTerms,
  updateMonthlyRateCents,
}) => {
  return (
    <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Pricing</h3>

      {/* Packages */}
      <div className="space-y-4 mb-6">
        {pricing.packages.map((pkg, idx) => (
          <div key={idx} className="border border-zinc-100 dark:border-zinc-700/50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Package Name</label>
                <input
                  type="text"
                  value={pkg.name}
                  onChange={(e) => updatePricingPackage(idx, 'name', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Price</label>
                <input
                  type="text"
                  value={pkg.price}
                  onChange={(e) => updatePricingPackage(idx, 'price', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Features (comma-separated)</label>
                <input
                  type="text"
                  value={pkg.features.join(', ')}
                  onChange={(e) =>
                    updatePricingPackage(
                      idx,
                      'features',
                      e.target.value.split(',').map((s) => s.trim())
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={pkg.recommended}
                    onChange={(e) => updatePricingPackage(idx, 'recommended', e.target.checked)}
                  />
                  Recommended
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom items */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Custom Items</label>
          <button
            onClick={addPricingCustomItem}
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
          >
            + Add item
          </button>
        </div>
        {pricing.customItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={item.label}
              onChange={(e) => updatePricingCustomItem(idx, 'label', e.target.value)}
              className={`${INPUT_CLASS} flex-1`}
              placeholder="Item label"
            />
            <input
              type="text"
              value={item.price}
              onChange={(e) => updatePricingCustomItem(idx, 'price', e.target.value)}
              className={`${INPUT_CLASS} w-32`}
              placeholder="$0"
            />
            <button
              onClick={() => removePricingCustomItem(idx)}
              className="text-xs text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Total</label>
          <input
            type="text"
            value={pricing.total}
            onChange={(e) => updatePricingTotal(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Terms</label>
          <input
            type="text"
            value={pricing.paymentTerms}
            onChange={(e) => updatePricingPaymentTerms(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Monthly rate */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">
          Monthly Rate ($)
          <span className="text-xs text-zinc-400 ml-1">
            Used for Stripe billing — overrides regex from Total
          </span>
        </label>
        <input
          type="number"
          min="0"
          step="1"
          placeholder="e.g. 2500 for $2,500/mo"
          value={monthlyRateCents ? Math.round(monthlyRateCents / 100) : ''}
          onChange={(e) => updateMonthlyRateCents(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
    </section>
  );
};

export default ProposalPricingSection;
