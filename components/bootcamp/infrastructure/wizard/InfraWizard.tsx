import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  InfraTier,
  WizardState,
  DomainAvailability,
  InfraProvision,
} from '../../../../types/infrastructure-types';
import TierSelection from './TierSelection';
import DomainPicker from './DomainPicker';
import MailboxConfig from './MailboxConfig';
import CheckoutStep from './CheckoutStep';

interface Props {
  userId: string;
  existingProvision?: InfraProvision;
}

export default function InfraWizard({ userId, existingProvision }: Props) {
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 1,
    selectedTier: null,
    selectedDomains: [],
    mailboxPattern1: existingProvision?.mailboxPattern1 || '',
    mailboxPattern2: existingProvision?.mailboxPattern2 || '',
  });

  const gtmSystemUrl = import.meta.env.VITE_GTM_SYSTEM_URL;

  const updateState = (updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (wizardState.step < 4) {
      updateState({ step: wizardState.step + 1 });
    }
  };

  const prevStep = () => {
    if (wizardState.step > 1) {
      updateState({ step: wizardState.step - 1 });
    }
  };

  // Validation logic for Next button
  const isStepValid = () => {
    switch (wizardState.step) {
      case 1:
        return wizardState.selectedTier !== null;
      case 2:
        return (
          wizardState.selectedTier &&
          wizardState.selectedDomains.length === wizardState.selectedTier.domainCount
        );
      case 3:
        return (
          wizardState.mailboxPattern1.trim() !== '' &&
          wizardState.mailboxPattern2.trim() !== '' &&
          validatePattern(wizardState.mailboxPattern1) &&
          validatePattern(wizardState.mailboxPattern2)
        );
      case 4:
        return true; // Checkout step handles its own validation
      default:
        return false;
    }
  };

  // Validate mailbox pattern (no leading/trailing special chars)
  const validatePattern = (pattern: string): boolean => {
    if (!pattern) return false;
    const firstChar = pattern[0];
    const lastChar = pattern[pattern.length - 1];
    const invalidChars = ['.', '_', '-'];
    return !invalidChars.includes(firstChar) && !invalidChars.includes(lastChar);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((stepNum) => {
            const isCompleted = stepNum < wizardState.step;
            const isCurrent = stepNum === wizardState.step;

            return (
              <div key={stepNum} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isCompleted || isCurrent
                        ? 'bg-violet-500 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {stepNum}
                  </div>
                  <div
                    className={`mt-2 text-xs font-medium ${
                      isCompleted || isCurrent
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {stepNum === 1 && 'Package'}
                    {stepNum === 2 && 'Domains'}
                    {stepNum === 3 && 'Mailboxes'}
                    {stepNum === 4 && 'Checkout'}
                  </div>
                </div>
                {stepNum < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all ${
                      stepNum < wizardState.step ? 'bg-violet-500' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
        {wizardState.step === 1 && (
          <TierSelection
            selectedTier={wizardState.selectedTier}
            onSelect={(tier: InfraTier) => updateState({ selectedTier: tier })}
          />
        )}

        {wizardState.step === 2 && wizardState.selectedTier && (
          <DomainPicker
            tier={wizardState.selectedTier}
            selectedDomains={wizardState.selectedDomains}
            onDomainsChange={(domains: DomainAvailability[]) =>
              updateState({ selectedDomains: domains })
            }
            gtmSystemUrl={gtmSystemUrl}
          />
        )}

        {wizardState.step === 3 && wizardState.selectedTier && (
          <MailboxConfig
            domains={wizardState.selectedDomains}
            pattern1={wizardState.mailboxPattern1}
            pattern2={wizardState.mailboxPattern2}
            onPattern1Change={(val: string) => updateState({ mailboxPattern1: val })}
            onPattern2Change={(val: string) => updateState({ mailboxPattern2: val })}
          />
        )}

        {wizardState.step === 4 && wizardState.selectedTier && (
          <CheckoutStep
            userId={userId}
            tier={wizardState.selectedTier}
            domains={wizardState.selectedDomains}
            pattern1={wizardState.mailboxPattern1}
            pattern2={wizardState.mailboxPattern2}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={wizardState.step === 1}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {wizardState.step < 4 && (
          <button
            onClick={nextStep}
            disabled={!isStepValid()}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
