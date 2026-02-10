import { Globe, Mail, Linkedin, AlertCircle } from 'lucide-react';
import type { ProductType, OutreachPricing } from '../../../../types/infrastructure-types';
import { useOutreachPricing, useInfraTiers } from '../../../../hooks/useInfrastructure';

interface Props {
  selectedProducts: ProductType[];
  onSelectionChange: (products: ProductType[]) => void;
}

export default function ProductSelection({ selectedProducts, onSelectionChange }: Props) {
  const { data: tiers, isLoading: tiersLoading } = useInfraTiers();
  const { data: outreachPricing, isLoading: outreachLoading } = useOutreachPricing();

  const isLoading = tiersLoading || outreachLoading;

  const toggleProduct = (product: ProductType) => {
    if (selectedProducts.includes(product)) {
      const updated = selectedProducts.filter((p) => p !== product);
      onSelectionChange(updated);
    } else {
      onSelectionChange([...selectedProducts, product]);
    }
  };

  const hasEmailInfra = selectedProducts.includes('email_infra');
  const hasOutreach = selectedProducts.includes('outreach_tools');

  // Compute price ranges for email infra from tiers
  const emailSetupRange = tiers?.length
    ? `$${Math.min(...tiers.map((t) => t.setupFeeCents / 100))}-$${Math.max(...tiers.map((t) => t.setupFeeCents / 100))}`
    : '...';
  const emailMonthlyRange = tiers?.length
    ? `$${Math.min(...tiers.map((t) => t.monthlyFeeCents / 100))}-$${Math.max(...tiers.map((t) => t.monthlyFeeCents / 100))}`
    : '...';

  const outreachSetup = outreachPricing
    ? `$${(outreachPricing.setupFeeCents / 100).toFixed(0)}`
    : '...';
  const outreachMonthly = outreachPricing
    ? `$${(outreachPricing.monthlyFeeCents / 100).toFixed(0)}`
    : '...';

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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">What do you need?</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Select one or both products. You can always add the other later.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Email Infrastructure Card */}
        <button
          onClick={() => toggleProduct('email_infra')}
          className={`relative text-left p-5 rounded-xl border-2 transition-all ${
            hasEmailInfra
              ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          {hasEmailInfra && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Globe size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-base font-semibold text-zinc-900 dark:text-white">
              Email Infrastructure
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <Globe size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Sending domains registered & configured
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Mail size={12} className="text-violet-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Google Workspace / Microsoft 365 mailboxes
              </span>
            </div>
            <div className="flex items-start gap-2">
              <svg
                className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                DNS, SPF, DKIM, DMARC auto-configured
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-400 dark:text-zinc-500">Tiered pricing</div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
              {emailSetupRange} setup + {emailMonthlyRange}/mo
            </div>
          </div>
        </button>

        {/* Outreach Tools Card */}
        <button
          onClick={() => toggleProduct('outreach_tools')}
          className={`relative text-left p-5 rounded-xl border-2 transition-all ${
            hasOutreach
              ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          {hasOutreach && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Linkedin size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-base font-semibold text-zinc-900 dark:text-white">
              Outreach Tools
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <Mail size={12} className="text-violet-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                PlusVibe email sequencing & warm-up
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Linkedin size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                HeyReach LinkedIn outreach & DM automation
              </span>
            </div>
            <div className="flex items-start gap-2">
              <svg
                className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Multi-channel campaign management
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-400 dark:text-zinc-500">Flat pricing</div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
              {outreachPricing && outreachPricing.setupFeeCents > 0
                ? `${outreachSetup} setup + ${outreachMonthly}/mo`
                : `${outreachMonthly}/mo`}
            </div>
          </div>
        </button>
      </div>

      {/* Warning when outreach selected without email infra */}
      {hasOutreach && !hasEmailInfra && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Mailbox warmup requires Email Infrastructure. PlusVibe workspace and HeyReach list will
            be created, but mailbox export and warmup will be skipped. You can add Email
            Infrastructure later.
          </p>
        </div>
      )}

      {selectedProducts.length === 0 && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
          Select at least one product to continue.
        </p>
      )}
    </div>
  );
}
