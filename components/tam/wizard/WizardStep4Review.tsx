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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Review & Launch</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Review your ideal customer profile before we start building your list
        </p>
      </div>

      <div className="space-y-4">
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
              {formData.contactsPerCompany}
            </p>
          </div>
        </div>

        {/* Sourcing Volume */}
        <SourcingLimitsPanel
          limits={formData.sourcingLimits || {}}
          onChange={(limits) => setFormData({ ...formData, sourcingLimits: limits })}
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
  perPageSize: number;
}[] = [
  {
    key: 'prospeoMaxPages',
    label: 'Prospeo pages',
    defaultValue: 40,
    hint: '25 companies/page',
    perPageSize: 25,
  },
  {
    key: 'discolikeMaxRecords',
    label: 'Discolike max records',
    defaultValue: 200,
    hint: 'companies from domain consensus',
    perPageSize: 0,
  },
  {
    key: 'blitzApiMaxPages',
    label: 'BlitzAPI pages',
    defaultValue: 20,
    hint: '100 companies/page',
    perPageSize: 100,
  },
];

function estimateCompanies(limits: Partial<SourcingLimits>): string {
  const prospeo = (limits.prospeoMaxPages || 40) * 25;
  const discolike = limits.discolikeMaxRecords || 200;
  const blitz = (limits.blitzApiMaxPages || 20) * 100;
  const total = prospeo + discolike + blitz;
  return `~${total.toLocaleString()} max (before dedup)`;
}

const SourcingLimitsPanel: React.FC<{
  limits: Partial<SourcingLimits>;
  onChange: (limits: Partial<SourcingLimits>) => void;
}> = ({ limits, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-zinc-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Sourcing Volume</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {estimateCompanies(limits)}
          </span>
        </div>
        <span className="text-xs text-violet-500 font-medium">{open ? 'Hide' : 'Customize'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Adjust how many leads each source pulls. Higher values = more companies but longer run
            time.
          </p>
          {LIMIT_FIELDS.map(({ key, label, defaultValue, hint, perPageSize }) => {
            const value = limits[key] ?? defaultValue;
            const estimated = perPageSize
              ? ` (~${(value * perPageSize).toLocaleString()} companies)`
              : '';
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
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {hint}
                  {estimated}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WizardStep4Review;
