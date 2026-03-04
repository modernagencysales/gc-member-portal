import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { IcpProfile, BusinessModelType } from '../../types/tam-types';
import WizardStep1BusinessModel from './wizard/WizardStep1BusinessModel';
import WizardStep2CompanyFilters from './wizard/WizardStep2CompanyFilters';
import WizardStep3ContactTargeting from './wizard/WizardStep3ContactTargeting';
import WizardStep4Review from './wizard/WizardStep4Review';

interface IcpWizardProps {
  onComplete: (icpProfile: IcpProfile) => void;
  userId: string;
  isSubmitting?: boolean;
  error?: string | null;
}

const IcpWizard: React.FC<IcpWizardProps> = ({ onComplete, isSubmitting, error }) => {
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
    contactsPerCompany: 2,
    targetListSize: 1000,
    specialCriteria: '',
    seedCompanyDomains: [],
  });

  const [industryInput, setIndustryInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [countriesInput, setCountriesInput] = useState('');
  const [seedDomainInput, setSeedDomainInput] = useState('');

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
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    const industryKeywords = industryInput
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

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
      contactsPerCompany: formData.contactsPerCompany || 2,
      targetListSize: formData.targetListSize || 1000,
      discolikeMinScore: formData.discolikeMinScore,
      specialCriteria: formData.specialCriteria,
      seedCompanyDomains:
        formData.seedCompanyDomains && formData.seedCompanyDomains.length > 0
          ? formData.seedCompanyDomains
          : undefined,
      sourcingLimits: formData.sourcingLimits,
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
        {currentStep === 1 && (
          <WizardStep1BusinessModel
            formData={formData}
            setFormData={setFormData}
            seedDomainInput={seedDomainInput}
            setSeedDomainInput={setSeedDomainInput}
            onNext={handleNext}
            isValid={!!isStep1Valid}
          />
        )}

        {currentStep === 2 && (
          <WizardStep2CompanyFilters
            formData={formData}
            setFormData={setFormData}
            industryInput={industryInput}
            setIndustryInput={setIndustryInput}
            countriesInput={countriesInput}
            setCountriesInput={setCountriesInput}
            onNext={handleNext}
            onBack={handleBack}
            isValid={!!isStep2Valid}
          />
        )}

        {currentStep === 3 && (
          <WizardStep3ContactTargeting
            formData={formData}
            setFormData={setFormData}
            customTitleInput={customTitleInput}
            setCustomTitleInput={setCustomTitleInput}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <WizardStep4Review
            formData={formData}
            setFormData={setFormData}
            industryInput={industryInput}
            countriesInput={countriesInput}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

export default IcpWizard;
