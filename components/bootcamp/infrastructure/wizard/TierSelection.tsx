import { Check, Globe, Mail } from 'lucide-react';
import { InfraTier, ServiceProvider } from '../../../../types/infrastructure-types';
import { useInfraTiers } from '../../../../hooks/useInfrastructure';

interface Props {
  selectedTier: InfraTier | null;
  onSelect: (tier: InfraTier) => void;
  serviceProvider: ServiceProvider;
  onServiceProviderChange: (provider: ServiceProvider) => void;
}

export default function TierSelection({
  selectedTier,
  onSelect,
  serviceProvider,
  onServiceProviderChange,
}: Props) {
  const { data: tiers, isLoading } = useInfraTiers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Choose Your Email Infrastructure Package
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Each package includes sending domains with warmed mailboxes, DNS configuration, and email
          deliverability setup.
        </p>
      </div>

      {/* What's included banner */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
          <Globe size={16} className="text-emerald-500 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-white">Domains</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Registered & configured
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
          <Mail size={16} className="text-violet-500 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-white">Mailboxes</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              DNS + DMARC auto-setup
            </div>
          </div>
        </div>
      </div>

      {/* Service Provider Toggle */}
      <div>
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Default Email Provider (can be mixed per domain later)
        </div>
        <div className="flex gap-2">
          {(['GOOGLE', 'MICROSOFT'] as const).map((provider) => (
            <button
              key={provider}
              onClick={() => onServiceProviderChange(provider)}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border-2 transition-all ${
                serviceProvider === provider
                  ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {provider === 'GOOGLE' ? 'Google Workspace' : 'Microsoft 365'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(tiers || []).map((tier) => {
          const isSelected = selectedTier?.id === tier.id;
          const totalMailboxes = tier.domainCount * tier.mailboxesPerDomain;

          return (
            <button
              key={tier.id}
              onClick={() => onSelect(tier)}
              className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}

              <div className="text-base font-semibold text-zinc-900 dark:text-white">
                {tier.name}
              </div>

              {/* What's included */}
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Globe size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {tier.domainCount} sending domains + {totalMailboxes} mailboxes
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Mail size={12} className="text-violet-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    SPF, DKIM, DMARC auto-configured
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                ~{totalMailboxes * 30} emails/day capacity
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-xs text-zinc-400 dark:text-zinc-500">One-time setup</div>
                <div className="text-lg font-bold text-zinc-900 dark:text-white">
                  ${(tier.setupFeeCents / 100).toFixed(0)}
                </div>
                <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  + ${(tier.monthlyFeeCents / 100).toFixed(0)}/mo
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
