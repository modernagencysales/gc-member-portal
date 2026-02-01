import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy, Check, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Affiliate, AffiliateStats } from '../../types/affiliate-types';

const AffiliateOverview: React.FC = () => {
  const { affiliate, stats } = useOutletContext<{ affiliate: Affiliate; stats: AffiliateStats }>();
  const { isDarkMode } = useTheme();
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);

  const referralUrl = `${window.location.origin}/refer/${affiliate.slug}`;

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    await navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const statCards = [
    {
      label: 'Total Referrals',
      value: stats?.totalReferrals || 0,
      icon: Users,
      color: 'text-violet-500',
    },
    {
      label: 'Active Referrals',
      value: stats?.activeReferrals || 0,
      icon: TrendingUp,
      color: 'text-blue-500',
    },
    {
      label: 'Total Earned',
      value: `$${stats?.totalEarned || 0}`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      label: 'Pending Payouts',
      value: `$${stats?.pendingPayouts || 0}`,
      icon: Clock,
      color: 'text-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm mt-1 text-zinc-400">Your affiliate performance at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Referral Link & Code */}
      <div
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
      >
        <h3 className="text-lg font-semibold mb-4">Your Referral Link & Code</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Referral Link
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralUrl}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-mono ${
                  isDarkMode
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              />
              <button
                onClick={() => copyToClipboard(referralUrl, 'link')}
                className="px-4 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Referral Code
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={affiliate.code}
                className={`w-40 px-4 py-2.5 rounded-lg border text-sm font-mono tracking-widest text-center ${
                  isDarkMode
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              />
              <button
                onClick={() => copyToClipboard(affiliate.code, 'code')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mt-4">
          Share your link or code. You earn ${affiliate.commissionAmount} for each referral who pays
          in full.
        </p>
      </div>
    </div>
  );
};

export default AffiliateOverview;
