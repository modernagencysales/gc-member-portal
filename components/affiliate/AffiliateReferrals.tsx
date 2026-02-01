import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAffiliateReferrals } from '../../hooks/useAffiliate';
import { Affiliate, AffiliateStats } from '../../types/affiliate-types';

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    clicked: 'bg-zinc-500/10 text-zinc-400',
    enrolled: 'bg-blue-500/10 text-blue-500',
    paying: 'bg-amber-500/10 text-amber-500',
    paid_in_full: 'bg-green-500/10 text-green-500',
    commission_paid: 'bg-emerald-500/10 text-emerald-500',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-zinc-500/10 text-zinc-400'}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const AffiliateReferrals: React.FC = () => {
  const { affiliate } = useOutletContext<{ affiliate: Affiliate; stats: AffiliateStats }>();
  const { isDarkMode } = useTheme();
  const { referrals, loading } = useAffiliateReferrals(affiliate.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const cardClass = `rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`;
  const headerClass = 'text-xs font-medium uppercase tracking-wide text-zinc-500';
  const rowClass = `border-t ${isDarkMode ? 'border-zinc-800 hover:bg-zinc-800/30' : 'border-zinc-100 hover:bg-zinc-50'}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Referrals</h2>
        <p className="text-sm mt-1 text-zinc-400">Track everyone you've referred.</p>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}>
              <th className={`${headerClass} text-left px-4 py-3`}>Person</th>
              <th className={`${headerClass} text-left px-4 py-3`}>Status</th>
              <th className={`${headerClass} text-left px-4 py-3`}>Payment</th>
              <th className={`${headerClass} text-left px-4 py-3`}>Date</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No referrals yet. Share your link to get started!
                </td>
              </tr>
            ) : (
              referrals.map((ref) => (
                <tr key={ref.id} className={rowClass}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">
                      {ref.referredName || ref.referredEmail || 'Anonymous'}
                    </div>
                    {ref.referredName && ref.referredEmail && (
                      <div className="text-xs text-zinc-500">{ref.referredEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{statusBadge(ref.status)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {ref.totalPrice > 0 ? `$${ref.amountPaid} / $${ref.totalPrice}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AffiliateReferrals;
