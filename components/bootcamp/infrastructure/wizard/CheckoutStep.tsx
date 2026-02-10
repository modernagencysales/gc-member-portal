import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  Loader2,
  DollarSign,
  Calendar,
  Globe,
  Mail,
  Linkedin,
} from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { supabase } from '../../../../lib/supabaseClient';
import { useOutreachPricing } from '../../../../hooks/useInfrastructure';
import type {
  InfraTier,
  DomainAvailability,
  ServiceProvider,
  ProductType,
} from '../../../../types/infrastructure-types';

interface CheckoutStepProps {
  userId: string;
  selectedProducts: ProductType[];
  tier: InfraTier | null;
  domains: DomainAvailability[];
  serviceProvider: ServiceProvider;
  pattern1: string;
  pattern2: string;
}

const CheckoutStep: React.FC<CheckoutStepProps> = ({
  userId,
  selectedProducts,
  tier,
  domains,
  serviceProvider,
  pattern1,
  pattern2,
}) => {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: outreachPricing } = useOutreachPricing();

  const hasEmailInfra = selectedProducts.includes('email_infra');
  const hasOutreach = selectedProducts.includes('outreach_tools');

  // Email infra costs
  const totalDomainCost = domains.reduce((sum, d) => sum + (d.domainPrice || 0), 0);
  const emailSetupFee = tier ? tier.setupFeeCents / 100 : 0;
  const emailMonthlyFee = tier ? tier.monthlyFeeCents / 100 : 0;

  // Outreach costs
  const outreachSetupFee = outreachPricing ? outreachPricing.setupFeeCents / 100 : 0;
  const outreachMonthlyFee = outreachPricing ? outreachPricing.monthlyFeeCents / 100 : 0;

  // Totals
  const totalOneTime =
    (hasEmailInfra ? emailSetupFee + totalDomainCost : 0) + (hasOutreach ? outreachSetupFee : 0);
  const totalMonthly =
    (hasEmailInfra ? emailMonthlyFee : 0) + (hasOutreach ? outreachMonthlyFee : 0);

  // Mailbox previews
  const mailboxPreviews = hasEmailInfra
    ? domains.flatMap((domain) => [
        `${pattern1}@${domain.domainName}`,
        `${pattern2}@${domain.domainName}`,
      ])
    : [];

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let emailProvisionId: string | undefined;
      let outreachProvisionId: string | undefined;

      // Create email infra provision record
      if (hasEmailInfra && tier) {
        const { data: emailProvision, error: emailError } = await supabase
          .from('infra_provisions')
          .insert({
            student_id: userId,
            product_type: 'email_infra',
            tier_id: tier.id,
            service_provider: serviceProvider,
            status: 'pending_payment',
            mailbox_pattern_1: pattern1,
            mailbox_pattern_2: pattern2,
          })
          .select()
          .single();

        if (emailError) {
          throw new Error(`Failed to create email provision: ${emailError.message}`);
        }
        emailProvisionId = emailProvision.id;

        // Create domain records
        const domainRecords = domains.map((domain) => ({
          provision_id: emailProvision.id,
          domain_name: domain.domainName,
          service_provider: domain.serviceProvider || serviceProvider,
          status: 'pending',
        }));

        const { error: domainsError } = await supabase.from('infra_domains').insert(domainRecords);
        if (domainsError) {
          throw new Error(`Failed to create domain records: ${domainsError.message}`);
        }
      }

      // Create outreach provision record
      if (hasOutreach) {
        const { data: outreachProvision, error: outreachError } = await supabase
          .from('infra_provisions')
          .insert({
            student_id: userId,
            product_type: 'outreach_tools',
            status: 'pending_payment',
            service_provider: serviceProvider,
            ...(emailProvisionId ? { linked_provision_id: emailProvisionId } : {}),
          })
          .select()
          .single();

        if (outreachError) {
          throw new Error(`Failed to create outreach provision: ${outreachError.message}`);
        }
        outreachProvisionId = outreachProvision.id;
      }

      // Create Stripe checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'create-infra-checkout',
        {
          body: {
            provisionId: emailProvisionId || undefined,
            outreachProvisionId: outreachProvisionId || undefined,
            studentId: userId,
            tierId: tier?.id || undefined,
            includeOutreach: hasOutreach,
          },
        }
      );

      if (checkoutError) {
        throw new Error(`Failed to create checkout session: ${checkoutError.message}`);
      }

      if (!checkoutData?.url) {
        throw new Error('No checkout URL returned');
      }

      window.location.href = checkoutData.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Complete Setup</h2>
        <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Review your selections and complete payment
        </p>
      </div>

      {/* Pricing Breakdown */}
      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-violet-900/30' : 'bg-violet-100'}`}>
            <CreditCard
              className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}
            />
          </div>
          <div>
            <h3 className="font-semibold">Order Summary</h3>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
              {[
                hasEmailInfra && tier ? `${tier.name} Email Infra` : null,
                hasOutreach ? 'Outreach Tools' : null,
              ]
                .filter(Boolean)
                .join(' + ')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* One-time section */}
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
            One-time setup
          </div>

          {hasEmailInfra && tier && (
            <>
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">Email infrastructure setup ({tier.name})</span>
                </div>
                <span className="font-mono font-semibold">${emailSetupFee.toFixed(2)}</span>
              </div>

              {totalDomainCost > 0 && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">
                      Domain registration ({domains.length} domain{domains.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <span className="font-mono font-semibold">${totalDomainCost.toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          {hasOutreach && outreachSetupFee > 0 && (
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Outreach tools setup</span>
              </div>
              <span className="font-mono font-semibold">${outreachSetupFee.toFixed(2)}</span>
            </div>
          )}

          <div className={`border-t pt-3 ${isDarkMode ? 'border-zinc-700/50' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Due today</span>
              <span className="text-xl font-bold text-violet-600">${totalOneTime.toFixed(2)}</span>
            </div>
          </div>

          {/* Monthly section */}
          <div
            className={`border-t pt-3 mt-3 ${isDarkMode ? 'border-zinc-700/50' : 'border-zinc-200'}`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Monthly subscription
            </div>

            <div className="space-y-2">
              {hasEmailInfra && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm">Email infrastructure</span>
                  </div>
                  <span className="font-mono text-sm">${emailMonthlyFee.toFixed(2)}/mo</span>
                </div>
              )}

              {hasOutreach && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-sm">Outreach tools (PlusVibe + HeyReach)</span>
                  </div>
                  <span className="font-mono text-sm">${outreachMonthlyFee.toFixed(2)}/mo</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-700/30">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span className="font-semibold text-sm">Monthly total</span>
              </div>
              <span className="font-mono font-semibold">${totalMonthly.toFixed(2)}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Domains List (email infra only) */}
      {hasEmailInfra && domains.length > 0 && (
        <div
          className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h3 className="font-semibold mb-3">Selected Domains</h3>
          <div className="space-y-2">
            {domains.map((domain) => (
              <div
                key={domain.domainName}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Check
                    className={`w-4 h-4 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}
                  />
                  <span className="font-mono text-sm">{domain.domainName}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      domain.serviceProvider === 'MICROSOFT'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    {domain.serviceProvider === 'MICROSOFT' ? 'MS 365' : 'Google'}
                  </span>
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  ${domain.domainPrice.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mailbox Preview (email infra only) */}
      {hasEmailInfra && mailboxPreviews.length > 0 && (
        <div
          className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h3 className="font-semibold mb-3">Mailboxes to Create</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mailboxPreviews.map((email) => (
              <div
                key={email}
                className={`flex items-center gap-2 p-2 rounded ${
                  isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'
                }`}
              >
                <Check className={`w-3 h-3 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <span className="font-mono text-xs text-zinc-500">{email}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outreach-only summary */}
      {hasOutreach && !hasEmailInfra && (
        <div
          className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h3 className="font-semibold mb-3">What you'll get</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className={`w-4 h-4 text-violet-500`} />
              <span className="text-sm">PlusVibe workspace for email sequencing</span>
            </div>
            <div className="flex items-center gap-2">
              <Linkedin className={`w-4 h-4 text-blue-500`} />
              <span className="text-sm">HeyReach lead list for LinkedIn outreach</span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              Mailbox warmup will be available after adding Email Infrastructure.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full py-4 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Complete Setup - ${totalOneTime.toFixed(2)}</span>
          </>
        )}
      </button>

      <p className={`text-xs text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
        Secure payment powered by Stripe. Cancel anytime.
      </p>
    </div>
  );
};

export default CheckoutStep;
