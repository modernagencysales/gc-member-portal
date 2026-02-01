import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAffiliatePayoutsList } from '../../hooks/useAffiliate';
import { Affiliate, AffiliateStats } from '../../types/affiliate-types';

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-500',
    processing: 'bg-blue-500/10 text-blue-500',
    paid: 'bg-green-500/10 text-green-500',
    failed: 'bg-red-500/10 text-red-500',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-zinc-500/10 text-zinc-400'}`}
    >
      {status}
    </span>
  );
};

const AffiliatePayoutsPage: React.FC = () => {
  const { affiliate } = useOutletContext<{ affiliate: Affiliate; stats: AffiliateStats }>();
  const { isDarkMode } = useTheme();
  const { payouts, loading } = useAffiliatePayoutsList(affiliate.id);

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
        <h2 className="text-xl font-semibold">Payouts</h2>
        <p className="text-sm mt-1 text-zinc-400">Your commission payment history.</p>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}>
              <th className={`${headerClass} text-left px-4 py-3`}>Amount</th>
              <th className={`${headerClass} text-left px-4 py-3`}>Status</th>
              <th className={`${headerClass} text-left px-4 py-3`}>Created</th>
              <th className={`${headerClass} text-left px-4 py-3`}>Paid</th>
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No payouts yet. Commissions are paid when referrals complete payment.
                </td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id} className={rowClass}>
                  <td className="px-4 py-3 text-sm font-medium">${payout.amount}</td>
                  <td className="px-4 py-3">{statusBadge(payout.status)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {new Date(payout.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : '—'}
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

export default AffiliatePayoutsPage;
