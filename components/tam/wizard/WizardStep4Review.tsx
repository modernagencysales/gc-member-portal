import React, { useState } from 'react';
import { ChevronLeft, Check, Loader2, Settings2 } from 'lucide-react';
import { IcpProfile, BusinessModelType, SourcingLimits } from '../../../types/tam-types';

const BUSINESS_MODEL_LABELS: Record<BusinessModelType, string> = {
  b2b_saas: 'B2B SaaS / Software',
  ecommerce_dtc: 'E-commerce / DTC',
  amazon_sellers: 'Amazon Sellers',
  local_service: 'Local / Service Businesses',
  agencies: 'Agencies',
  other: 'Other',
};

const TARGET_LIST_PRESETS = [
  { value: 1000, label: '1,000 companies', desc: 'Quick run' },
  { value: 5000, label: '5,000 companies', desc: 'Recommended for outbound' },
  { value: 10000, label: '10,000 companies', desc: 'Maximum coverage (30-60 min)' },
];

interface WizardStep4Props {
  formData: Partial<IcpProfile>;
  setFormData: (data: Partial<IcpProfile>) => void;
  industryInput: string;
  countriesInput: string;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

const WizardStep4Review: React.FC<WizardStep4Props> = ({
  formData,
  setFormData,
  industryInput,
  countriesInput,
  onSubmit,
  onBack,
  isSubmitting,
  error,
}) => {
  const [customTarget, setCustomTarget] = useState(false);
  const targetListSize = formData.targetListSize || 1000;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Review & Launch</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Review your ideal customer profile before we start building your list
        </p>
      </div>

      <div className="space-y-4">
        {/* Target List Size — prominent, above everything else */}
        <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Target List Size</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {TARGET_LIST_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setCustomTarget(false);
                  setFormData({ ...formData, targetListSize: preset.value });
                }}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  !customTarget && targetListSize === preset.value
                    ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/40'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700'
                }`}
              >
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {preset.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{preset.desc}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCustomTarget(true)}
              className={`text-xs px-2 py-1 rounded ${
                customTarget
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                  : 'text-zinc-500 hover:text-violet-500'
              }`}
            >
              Custom
            </button>
            {customTarget && (
              <input
                type="number"
                min={100}
                max={50000}
                value={targetListSize}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v > 0) {
                    setFormData({ ...formData, targetListSize: v });
                  }
                }}
                className="w-32 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. 3000"
              />
            )}
          </div>
        </div>

        {/* Business Model Summary */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Business Model</h3>
          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              <span className="font-medium">Type:</span>{' '}
              {formData.businessModel ? BUSINESS_MODEL_LABELS[formData.businessModel] : ''}
              {formData.businessModelOther && ` (${formData.businessModelOther})`}
            </p>
            <p>
              <span className="font-medium">Product/Service:</span> {formData.whatYouSell}
            </p>
            {formData.seedCompanyDomains && formData.seedCompanyDomains.length > 0 && (
              <p>
                <span className="font-medium">Seed Companies:</span>{' '}
                {formData.seedCompanyDomains.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Company Filters Summary */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Company Filters</h3>
          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              <span className="font-medium">Employee Size:</span>{' '}
              {formData.employeeSizeRanges?.join(', ') || 'Not specified'}
            </p>
            <p>
              <span className="font-medium">Geography:</span>{' '}
              {formData.geography === 'us_only'
                ? 'US Only'
                : formData.geography === 'specific_countries'
                  ? `Specific Countries (${countriesInput})`
                  : 'Global'}
            </p>
            {formData.usEmployeeFilter && (
              <p>
                <span className="font-medium">US Employee Filter:</span> 75%+ US-based
              </p>
            )}
            {industryInput && (
              <p>
                <span className="font-medium">Industries:</span> {industryInput}
              </p>
            )}
          </div>
        </div>

        {/* Contact Targeting Summary */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Contact Targeting</h3>
          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              <span className="font-medium">Target Titles:</span>{' '}
              {formData.targetTitles && formData.targetTitles.length > 0
                ? formData.targetTitles.join(', ')
                : 'Not specified'}
            </p>
            <p>
              <span className="font-medium">Seniority:</span>{' '}
              {formData.seniorityPreference && formData.seniorityPreference.length > 0
                ? formData.seniorityPreference.join(', ')
                : 'Not specified'}
            </p>
            <p>
              <span className="font-medium">Contacts per company:</span>{' '}
              {formData.contactsPerCompany || 2}
            </p>
          </div>
        </div>

        {/* Sourcing Volume */}
        <SourcingLimitsPanel
          limits={formData.sourcingLimits || {}}
          onChange={(limits) => setFormData({ ...formData, sourcingLimits: limits })}
          targetListSize={targetListSize}
          discolikeMinScore={formData.discolikeMinScore}
          onMinScoreChange={(score) => setFormData({ ...formData, discolikeMinScore: score })}
        />

        {/* Special Criteria */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Anything else the AI should know about your ideal customer?
          </label>
          <textarea
            value={formData.specialCriteria || ''}
            onChange={(e) => setFormData({ ...formData, specialCriteria: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            placeholder="Any additional criteria, requirements, or notes..."
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Start Building
              <Check className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ---- Sourcing Limits Panel (collapsible) ----

const LIMIT_FIELDS: {
  key: keyof SourcingLimits;
  label: string;
  defaultValue: number;
  hint: string;
}[] = [
  {
    key: 'prospeoMaxPages',
    label: 'Prospeo pages',
    defaultValue: 40,
    hint: '25 companies/page',
  },
  {
    key: 'discolikeMaxRecords',
    label: 'Discolike per round',
    defaultValue: 500,
    hint: 'companies per snowball round',
  },
  {
    key: 'discolikeMaxRounds',
    label: 'Snowball rounds',
    defaultValue: 10,
    hint: 'discovery iterations',
  },
  {
    key: 'blitzApiMaxPages',
    label: 'BlitzAPI pages',
    defaultValue: 20,
    hint: 'for contact finding (not company sourcing)',
  },
];

const SourcingLimitsPanel: React.FC<{
  limits: Partial<SourcingLimits>;
  onChange: (limits: Partial<SourcingLimits>) => void;
  targetListSize: number;
  discolikeMinScore?: number;
  onMinScoreChange: (score: number) => void;
}> = ({ limits, onChange, targetListSize, discolikeMinScore, onMinScoreChange }) => {
  const [open, setOpen] = useState(false);
  const minScore = discolikeMinScore ?? 50;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-zinc-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Sourcing Settings</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            ~{targetListSize.toLocaleString()} target
          </span>
        </div>
        <span className="text-xs text-violet-500 font-medium">{open ? 'Hide' : 'Customize'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Fine-tune sourcing behavior. Snowball discovery uses your seed companies to find similar
            businesses across multiple rounds.
          </p>

          {/* Min similarity score slider */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-700 dark:text-zinc-300 w-48 shrink-0">
              Min similarity score
            </label>
            <input
              type="range"
              min={20}
              max={80}
              value={minScore}
              onChange={(e) => onMinScoreChange(parseInt(e.target.value, 10))}
              className="flex-1 accent-violet-500"
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400 w-8 text-right">
              {minScore}
            </span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 ml-48 pl-3 -mt-1">
            Lower = more results but less similar to seeds
          </p>

          {LIMIT_FIELDS.map(({ key, label, defaultValue, hint }) => {
            const value = limits[key] ?? defaultValue;
            return (
              <div key={key} className="flex items-center gap-3">
                <label className="text-sm text-zinc-700 dark:text-zinc-300 w-48 shrink-0">
                  {label}
                </label>
                <input
                  type="number"
                  min={1}
                  value={value}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v > 0) {
                      onChange({ ...limits, [key]: v });
                    }
                  }}
                  className="w-24 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{hint}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WizardStep4Review;
