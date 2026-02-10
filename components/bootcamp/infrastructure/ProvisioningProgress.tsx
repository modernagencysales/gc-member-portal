import { useMemo } from 'react';
import { Check, Loader2, X, Circle, SkipForward } from 'lucide-react';
import { InfraProvisionWithDetails } from '../../../types/infrastructure-types';
import { useProvisioningLog } from '../../../hooks/useInfrastructure';

interface Props {
  emailInfra: InfraProvisionWithDetails | null;
  outreachTools: InfraProvisionWithDetails | null;
}

interface StepConfig {
  step: number;
  name: string;
  product: 'email_infra' | 'outreach_tools';
}

const EMAIL_INFRA_STEPS: StepConfig[] = [
  { step: 1, name: 'Creating Zapmail workspace', product: 'email_infra' },
  { step: 2, name: 'Purchasing domains', product: 'email_infra' },
  { step: 3, name: 'Waiting for DNS setup', product: 'email_infra' },
  { step: 4, name: 'Setting up DMARC', product: 'email_infra' },
  { step: 5, name: 'Creating mailboxes', product: 'email_infra' },
  { step: 6, name: 'Email infrastructure complete', product: 'email_infra' },
];

const OUTREACH_STEPS: StepConfig[] = [
  { step: 1, name: 'Setting up PlusVibe workspace', product: 'outreach_tools' },
  { step: 2, name: 'Exporting mailboxes to PlusVibe', product: 'outreach_tools' },
  { step: 3, name: 'Configuring warmup', product: 'outreach_tools' },
  { step: 4, name: 'Creating HeyReach lead list', product: 'outreach_tools' },
  { step: 5, name: 'Outreach tools complete', product: 'outreach_tools' },
];

export default function ProvisioningProgress({ emailInfra, outreachTools }: Props) {
  const emailIsProvisioning = emailInfra?.status === 'provisioning';
  const outreachIsProvisioning = outreachTools?.status === 'provisioning';

  const { data: emailLog } = useProvisioningLog(emailInfra?.id, emailIsProvisioning);
  const { data: outreachLog } = useProvisioningLog(outreachTools?.id, outreachIsProvisioning);

  const allSteps = useMemo(() => {
    const steps: (StepConfig & { displayIndex: number })[] = [];
    let idx = 0;

    if (emailInfra) {
      for (const s of EMAIL_INFRA_STEPS) {
        steps.push({ ...s, displayIndex: idx++ });
      }
    }
    if (outreachTools) {
      for (const s of OUTREACH_STEPS) {
        steps.push({ ...s, displayIndex: idx++ });
      }
    }

    return steps;
  }, [emailInfra, outreachTools]);

  const getStepStatus = (product: string, stepNum: number) => {
    const log = product === 'email_infra' ? emailLog : outreachLog;
    if (!log) return 'pending';
    const stepLog = log.find((s) => s.step === stepNum);
    return stepLog?.status || 'pending';
  };

  const getStepError = (product: string, stepNum: number) => {
    const log = product === 'email_infra' ? emailLog : outreachLog;
    if (!log) return undefined;
    const stepLog = log.find((s) => s.step === stepNum);
    return stepLog?.error;
  };

  const anyFailed = emailInfra?.status === 'failed' || outreachTools?.status === 'failed';
  const allActive =
    (!emailInfra || emailInfra.status === 'active') &&
    (!outreachTools || outreachTools.status === 'active');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Setting Up Your Infrastructure
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          This will take a few minutes. You can leave this page and come back later.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        {/* Section headers when both products */}
        <div className="space-y-4">
          {allSteps.map((item, idx) => {
            const status = getStepStatus(item.product, item.step);
            const error = getStepError(item.product, item.step);
            const isLast = idx === allSteps.length - 1;

            // Show section divider between products
            const prevItem = idx > 0 ? allSteps[idx - 1] : null;
            const showDivider = prevItem && prevItem.product !== item.product;

            return (
              <div key={`${item.product}-${item.step}`}>
                {showDivider && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 my-4" />
                )}

                <div className="relative">
                  {/* Connecting line */}
                  {!isLast && allSteps[idx + 1]?.product === item.product && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-full transition-colors ${
                        status === 'completed'
                          ? 'bg-green-500'
                          : status === 'in_progress'
                            ? 'bg-violet-500'
                            : status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-zinc-200 dark:bg-zinc-800'
                      }`}
                    />
                  )}

                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div className="relative z-10 flex-shrink-0">
                      {status === 'completed' && (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                      )}
                      {status === 'in_progress' && (
                        <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                          <Loader2 size={16} className="text-white animate-spin" />
                        </div>
                      )}
                      {status === 'failed' && (
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <X size={16} className="text-white" />
                        </div>
                      )}
                      {status === 'skipped' && (
                        <div className="w-8 h-8 bg-zinc-400 dark:bg-zinc-600 rounded-full flex items-center justify-center">
                          <SkipForward size={14} className="text-white" />
                        </div>
                      )}
                      {status === 'pending' && (
                        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 rounded-full flex items-center justify-center">
                          <Circle size={12} className="text-zinc-300 dark:text-zinc-700" />
                        </div>
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pt-1">
                      <div
                        className={`text-sm font-medium ${
                          status === 'completed'
                            ? 'text-green-600 dark:text-green-400'
                            : status === 'in_progress'
                              ? 'text-violet-600 dark:text-violet-400'
                              : status === 'failed'
                                ? 'text-red-600 dark:text-red-400'
                                : status === 'skipped'
                                  ? 'text-zinc-400 dark:text-zinc-500 line-through'
                                  : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      >
                        {item.name}
                        {status === 'skipped' && (
                          <span className="ml-2 text-xs no-underline">(skipped)</span>
                        )}
                      </div>
                      {error && (
                        <div className="mt-1 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded px-2 py-1">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary message */}
        {allActive && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <Check size={20} />
              <div className="text-sm font-medium">
                Your infrastructure is ready! Redirecting to dashboard...
              </div>
            </div>
          </div>
        )}

        {anyFailed && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <X size={20} />
              <div className="text-sm font-medium">
                Setup failed. Please contact support for assistance.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
