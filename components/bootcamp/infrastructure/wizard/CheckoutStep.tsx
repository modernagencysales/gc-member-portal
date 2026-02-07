import React, { useState } from 'react';
import { CreditCard, Check, Loader2, DollarSign, Calendar } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { supabase } from '../../../../lib/supabaseClient';
import type { InfraTier, DomainAvailability } from '../../../../types/infrastructure-types';

interface CheckoutStepProps {
  userId: string;
  tier: InfraTier;
  domains: DomainAvailability[];
  pattern1: string;
  pattern2: string;
}

const CheckoutStep: React.FC<CheckoutStepProps> = ({
  userId,
  tier,
  domains,
  pattern1,
  pattern2,
}) => {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate total domain cost
  const totalDomainCost = domains.reduce((sum, domain) => {
    return sum + (domain.domainPrice || 0);
  }, 0);

  // Convert cents to dollars for display
  const setupFee = tier.setupFeeCents / 100;
  const monthlyFee = tier.monthlyFeeCents / 100;
  const totalOneTime = setupFee;

  // Generate mailbox previews
  const mailboxPreviews = domains.flatMap((domain) => [
    `${pattern1}@${domain.domainName}`,
    `${pattern2}@${domain.domainName}`,
  ]);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create provision record
      const { data: provision, error: provisionError } = await supabase
        .from('infra_provisions')
        .insert({
          student_id: userId,
          tier_id: tier.id,
          status: 'pending_payment',
          mailbox_pattern_1: pattern1,
          mailbox_pattern_2: pattern2,
        })
        .select()
        .single();

      if (provisionError) {
        throw new Error(`Failed to create provision: ${provisionError.message}`);
      }

      // Step 2: Create domain records
      const domainRecords = domains.map((domain) => ({
        provision_id: provision.id,
        domain_name: domain.domainName,
        status: 'pending',
      }));

      const { error: domainsError } = await supabase.from('infra_domains').insert(domainRecords);

      if (domainsError) {
        throw new Error(`Failed to create domain records: ${domainsError.message}`);
      }

      // Step 3: Create Stripe checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'create-infra-checkout',
        {
          body: {
            provisionId: provision.id,
            studentId: userId,
            tierId: tier.id,
          },
        }
      );

      if (checkoutError) {
        throw new Error(`Failed to create checkout session: ${checkoutError.message}`);
      }

      if (!checkoutData?.url) {
        throw new Error('No checkout URL returned');
      }

      // Step 4: Redirect to Stripe checkout
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
          Review your infrastructure package and complete payment
        </p>
      </div>

      {/* Package Summary */}
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
            <h3 className="font-semibold">{tier.name} Package</h3>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
              {tier.domainCount} domains × {tier.mailboxesPerDomain} mailboxes ={' '}
              {mailboxPreviews.length} total mailboxes
            </p>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-700/50">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-zinc-500" />
              <span className="text-sm">One-time setup</span>
            </div>
            <span className="font-mono font-semibold">${totalOneTime.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-zinc-700/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span className="text-sm">Monthly subscription</span>
            </div>
            <span className="font-mono font-semibold">${monthlyFee.toFixed(2)}/mo</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold">Due today</span>
            <span className="text-xl font-bold text-violet-600">${totalOneTime.toFixed(2)}</span>
          </div>

          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
            Then ${monthlyFee.toFixed(2)}/month starting next billing cycle
          </p>
        </div>
      </div>

      {/* Domains List */}
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
              </div>
              <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                ${domain.domainPrice.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mailbox Preview */}
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
