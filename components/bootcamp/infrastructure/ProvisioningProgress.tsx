import { Check, Loader2, X, Circle } from 'lucide-react';
import { InfraProvisionWithDetails } from '../../../types/infrastructure-types';
import { useProvisioningLog } from '../../../hooks/useInfrastructure';

interface Props {
  provision: InfraProvisionWithDetails;
}

const PROVISIONING_STEPS = [
  { step: 1, name: 'Creating Zapmail workspace' },
  { step: 2, name: 'Purchasing domains' },
  { step: 3, name: 'Waiting for DNS setup' },
  { step: 4, name: 'Setting up DMARC' },
  { step: 5, name: 'Creating mailboxes' },
  { step: 6, name: 'Setting up PlusVibe workspace' },
  { step: 7, name: 'Exporting mailboxes to PlusVibe' },
  { step: 8, name: 'Configuring warmup' },
  { step: 9, name: 'Creating HeyReach lead list' },
  { step: 10, name: 'Setup complete' },
];

export default function ProvisioningProgress({ provision }: Props) {
  const { data: log, isLoading } = useProvisioningLog(
    provision.id,
    provision.status === 'provisioning'
  );

  const getStepStatus = (stepNum: number) => {
    if (!log) return 'pending';
    const stepLog = log.find((s) => s.step === stepNum);
    return stepLog?.status || 'pending';
  };

  const getStepError = (stepNum: number) => {
    if (!log) return undefined;
    const stepLog = log.find((s) => s.step === stepNum);
    return stepLog?.error;
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

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
        {/* Timeline */}
        <div className="space-y-4">
          {PROVISIONING_STEPS.map((item, idx) => {
            const status = getStepStatus(item.step);
            const error = getStepError(item.step);
            const isLast = idx === PROVISIONING_STEPS.length - 1;

            return (
              <div key={item.step} className="relative">
                {/* Connecting line */}
                {!isLast && (
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
                              : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {item.name}
                    </div>
                    {error && (
                      <div className="mt-1 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded px-2 py-1">
                        {error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary message */}
        {provision.status === 'active' && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <Check size={20} />
              <div className="text-sm font-medium">
                Your infrastructure is ready! Redirecting to dashboard...
              </div>
            </div>
          </div>
        )}

        {provision.status === 'failed' && (
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
