import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Affiliate, AffiliateStats } from '../../types/affiliate-types';

const AffiliateSettingsPage: React.FC = () => {
  const { affiliate } = useOutletContext<{ affiliate: Affiliate; stats: AffiliateStats }>();
  const { isDarkMode } = useTheme();
  const [loadingStripe, setLoadingStripe] = React.useState(false);

  const openStripeDashboard = async () => {
    setLoadingStripe(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-connect-login-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ affiliateId: affiliate.id }),
        }
      );
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } catch (err) {
      console.error('Failed to open Stripe dashboard:', err);
    } finally {
      setLoadingStripe(false);
    }
  };

  const cardClass = `rounded-xl border p-6 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm mt-1 text-zinc-400">Your affiliate profile and payout settings.</p>
      </div>

      <div className={cardClass}>
        <h3 className="text-sm font-semibold mb-4">Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Name</label>
            <p className="text-sm">{affiliate.name}</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Email</label>
            <p className="text-sm">{affiliate.email}</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Company</label>
            <p className="text-sm">{affiliate.company || '—'}</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Commission Rate</label>
            <p className="text-sm">${affiliate.commissionAmount} per referral</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Referral Code</label>
            <p className="text-sm font-mono">{affiliate.code}</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Slug</label>
            <p className="text-sm font-mono">{affiliate.slug}</p>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="text-sm font-semibold mb-4">Stripe Connect</h3>
        {affiliate.stripeConnectOnboarded ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-sm text-green-500 font-medium">Connected</p>
            </div>
            <p className="text-xs text-zinc-500">
              Your Stripe account is set up to receive payouts.
            </p>
            <button
              onClick={openStripeDashboard}
              disabled={loadingStripe}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
            >
              {loadingStripe ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Open Stripe Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <p className="text-sm text-amber-500 font-medium">Not Connected</p>
            </div>
            <p className="text-xs text-zinc-500">
              Set up your Stripe account to receive commission payouts.
            </p>
            <a
              href="/affiliate/onboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-violet-500 hover:bg-violet-600 text-white"
            >
              Set Up Stripe Account
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateSettingsPage;
