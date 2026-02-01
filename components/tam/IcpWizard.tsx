import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { IcpProfile, BusinessModelType } from '../../types/tam-types';

interface IcpWizardProps {
  onComplete: (icpProfile: IcpProfile) => void;
  userId: string;
}

const BUSINESS_MODEL_LABELS: Record<BusinessModelType, string> = {
  b2b_saas: 'B2B SaaS / Software',
  ecommerce_dtc: 'E-commerce / DTC',
  amazon_sellers: 'Amazon Sellers',
  local_service: 'Local / Service Businesses',
  agencies: 'Agencies',
  other: 'Other',
};

const EMPLOYEE_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

const PRESET_TITLES = [
  'Founder',
  'CEO',
  'CTO',
  'VP Marketing',
  'VP Sales',
  'Head of Marketing',
  'Head of Sales',
  'Director of Marketing',
  'Director of Sales',
];

const SENIORITY_LEVELS = ['C-Suite', 'VP', 'Director', 'Manager'];

const IcpWizard: React.FC<IcpWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<IcpProfile>>({
    businessModel: 'b2b_saas',
    whatYouSell: '',
    employeeSizeRanges: [],
    geography: 'us_only',
    usEmployeeFilter: false,
    industryKeywords: [],
    targetTitles: [],
    seniorityPreference: [],
    contactsPerCompany: 1,
    specialCriteria: '',
  });

  const [industryInput, setIndustryInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [countriesInput, setCountriesInput] = useState('');

  // Step 1 validation
  const isStep1Valid =
    formData.businessModel &&
    formData.whatYouSell &&
    formData.whatYouSell.trim().length > 0 &&
    (formData.businessModel !== 'other' ||
      (formData.businessModelOther && formData.businessModelOther.trim().length > 0));

  // Step 2 validation
  const isStep2Valid =
    formData.employeeSizeRanges &&
    formData.employeeSizeRanges.length > 0 &&
    formData.geography &&
    (formData.geography !== 'specific_countries' ||
      (formData.specificCountries && formData.specificCountries.length > 0));

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleEmployeeSize = (size: string) => {
    const current = formData.employeeSizeRanges || [];
    if (current.includes(size)) {
      setFormData({
        ...formData,
        employeeSizeRanges: current.filter((s) => s !== size),
      });
    } else {
      setFormData({
        ...formData,
        employeeSizeRanges: [...current, size],
      });
    }
  };

  const toggleTitle = (title: string) => {
    const current = formData.targetTitles || [];
    if (current.includes(title)) {
      setFormData({
        ...formData,
        targetTitles: current.filter((t) => t !== title),
      });
    } else {
      setFormData({
        ...formData,
        targetTitles: [...current, title],
      });
    }
  };

  const addCustomTitle = () => {
    if (customTitleInput.trim()) {
      const current = formData.targetTitles || [];
      if (!current.includes(customTitleInput.trim())) {
        setFormData({
          ...formData,
          targetTitles: [...current, customTitleInput.trim()],
        });
      }
      setCustomTitleInput('');
    }
  };

  const removeTitle = (title: string) => {
    const current = formData.targetTitles || [];
    setFormData({
      ...formData,
      targetTitles: current.filter((t) => t !== title),
    });
  };

  const toggleSeniority = (level: string) => {
    const current = formData.seniorityPreference || [];
    if (current.includes(level)) {
      setFormData({
        ...formData,
        seniorityPreference: current.filter((s) => s !== level),
      });
    } else {
      setFormData({
        ...formData,
        seniorityPreference: [...current, level],
      });
    }
  };

  const handleSubmit = () => {
    // Parse industry keywords from comma-separated string
    const industryKeywords = industryInput
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // Parse countries if specific countries selected
    const specificCountries =
      formData.geography === 'specific_countries'
        ? countriesInput
            .split(',')
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        : undefined;

    const icpProfile: IcpProfile = {
      businessModel: formData.businessModel as BusinessModelType,
      businessModelOther: formData.businessModelOther,
      whatYouSell: formData.whatYouSell || '',
      employeeSizeRanges: formData.employeeSizeRanges || [],
      geography: formData.geography as 'us_only' | 'specific_countries' | 'global',
      specificCountries,
      usEmployeeFilter: formData.usEmployeeFilter || false,
      industryKeywords,
      targetTitles: formData.targetTitles || [],
      seniorityPreference: formData.seniorityPreference || [],
      contactsPerCompany: formData.contactsPerCompany || 1,
      specialCriteria: formData.specialCriteria,
    };

    onComplete(icpProfile);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                step === currentStep
                  ? 'bg-violet-500 text-white'
                  : step < currentStep
                    ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
              }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            {step < 4 && (
              <div
                className={`h-0.5 w-12 transition-colors ${
                  step < currentStep ? 'bg-violet-500' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
        {/* Step 1: Business Model */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Business Model
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Tell us about your business so we can find the right customers
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  What type of business do you run?
                </label>
                <div className="space-y-2">
                  {(Object.keys(BUSINESS_MODEL_LABELS) as BusinessModelType[]).map((model) => (
                    <label
                      key={model}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.businessModel === model
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="businessModel"
                        value={model}
                        checked={formData.businessModel === model}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            businessModel: e.target.value as BusinessModelType,
                          })
                        }
                        className="w-5 h-5 text-violet-500"
                      />
                      <span className="text-zinc-900 dark:text-white font-medium">
                        {BUSINESS_MODEL_LABELS[model]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.businessModel === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Please specify your business model
                  </label>
                  <input
                    type="text"
                    value={formData.businessModelOther || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, businessModelOther: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g., Marketplace platform"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  What do YOU sell them?
                </label>
                <input
                  type="text"
                  value={formData.whatYouSell || ''}
                  onChange={(e) => setFormData({ ...formData, whatYouSell: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g., Marketing automation software"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleNext}
                disabled={!isStep1Valid}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Company Filters */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Company Filters
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Define the characteristics of your ideal customer companies
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Employee Size (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYEE_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleEmployeeSize(size)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        formData.employeeSizeRanges?.includes(size)
                          ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-2 border-violet-500'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Geography
                </label>
                <div className="space-y-2">
                  {['us_only', 'specific_countries', 'global'].map((geo) => (
                    <label
                      key={geo}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.geography === geo
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="geography"
                        value={geo}
                        checked={formData.geography === geo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            geography: e.target.value as
                              | 'us_only'
                              | 'specific_countries'
                              | 'global',
                          })
                        }
                        className="w-5 h-5 text-violet-500"
                      />
                      <span className="text-zinc-900 dark:text-white font-medium">
                        {geo === 'us_only'
                          ? 'US Only'
                          : geo === 'specific_countries'
                            ? 'Specific Countries'
                            : 'Global'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.geography === 'specific_countries' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Country names (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={countriesInput}
                    onChange={(e) => setCountriesInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g., United States, Canada, United Kingdom"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.usEmployeeFilter || false}
                    onChange={(e) =>
                      setFormData({ ...formData, usEmployeeFilter: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Filter for US-based employees (75%+ in US)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Industry keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={industryInput}
                  onChange={(e) => setIndustryInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g., SaaS, Technology, Marketing"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!isStep2Valid}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Targeting */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Contact Targeting
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Specify the types of contacts you want to reach
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Target Titles (select or add custom)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_TITLES.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => toggleTitle(title)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        formData.targetTitles?.includes(title)
                          ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-2 border-violet-500'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      {title}
                    </button>
                  ))}
                </div>

                {/* Custom titles display */}
                {formData.targetTitles && formData.targetTitles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                      Selected titles:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.targetTitles
                        .filter((t) => !PRESET_TITLES.includes(t))
                        .map((title) => (
                          <div
                            key={title}
                            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-500"
                          >
                            <span>{title}</span>
                            <button
                              onClick={() => removeTitle(title)}
                              className="hover:text-violet-900 dark:hover:text-violet-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTitleInput}
                    onChange={(e) => setCustomTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTitle();
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Add custom title and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addCustomTitle}
                    className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Seniority Preference
                </label>
                <div className="space-y-2">
                  {SENIORITY_LEVELS.map((level) => (
                    <label key={level} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.seniorityPreference?.includes(level) || false}
                        onChange={() => toggleSeniority(level)}
                        className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Contacts per company
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={formData.contactsPerCompany || 1}
                  onChange={(e) =>
                    setFormData({ ...formData, contactsPerCompany: parseInt(e.target.value) || 1 })
                  }
                  className="w-32 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Launch */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Review & Launch
              </h2>
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
                </div>
              </div>

              {/* Company Filters Summary */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  Company Filters
                </h3>
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
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  Contact Targeting
                </h3>
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

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
              >
                Start Building
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IcpWizard;
