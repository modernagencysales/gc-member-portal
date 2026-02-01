import React, { useState } from 'react';
import {
  UserCheck,
  GitPullRequest,
  DollarSign,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAffiliateAdmin } from '../../../hooks/useAffiliateAdmin';

type Tab = 'applications' | 'affiliates' | 'referrals' | 'payouts' | 'assets';

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-500',
    approved: 'bg-blue-500/10 text-blue-500',
    active: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500',
    suspended: 'bg-zinc-500/10 text-zinc-500',
    clicked: 'bg-zinc-500/10 text-zinc-400',
    enrolled: 'bg-blue-500/10 text-blue-500',
    paying: 'bg-amber-500/10 text-amber-500',
    paid_in_full: 'bg-green-500/10 text-green-500',
    commission_paid: 'bg-emerald-500/10 text-emerald-500',
    processing: 'bg-amber-500/10 text-amber-500',
    paid: 'bg-green-500/10 text-green-500',
    failed: 'bg-red-500/10 text-red-500',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-zinc-500/10 text-zinc-400'}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const AdminAffiliatesPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const {
    affiliates,
    referrals,
    payouts,
    assets,
    stats,
    loading,
    approveAffiliate,
    rejectAffiliate,
    suspendAffiliate,
  } = useAffiliateAdmin();
  const [activeTab, setActiveTab] = useState<Tab>('applications');

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    {
      id: 'applications',
      label: 'Applications',
      icon: Clock,
      count: affiliates.filter((a) => a.status === 'pending').length,
    },
    {
      id: 'affiliates',
      label: 'Affiliates',
      icon: UserCheck,
      count: affiliates.filter((a) => a.status === 'active' || a.status === 'approved').length,
    },
    { id: 'referrals', label: 'Referrals', icon: GitPullRequest, count: referrals.length },
    { id: 'payouts', label: 'Payouts', icon: DollarSign, count: payouts.length },
    { id: 'assets', label: 'Assets', icon: FileText, count: assets.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const pendingApps = affiliates.filter((a) => a.status === 'pending');
  const activeAffiliates = affiliates.filter((a) => a.status !== 'pending');

  const cardClass = `rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`;
  const headerClass = 'text-xs font-medium uppercase tracking-wide text-zinc-500';
  const rowClass = `border-t ${isDarkMode ? 'border-zinc-800 hover:bg-zinc-800/30' : 'border-zinc-100 hover:bg-zinc-50'}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Affiliate Program</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage affiliates, referrals, and payouts.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Affiliates', value: stats.totalAffiliates },
            { label: 'Active', value: stats.activeAffiliates },
            { label: 'Pending Apps', value: stats.pendingApplications },
            { label: 'Total Referrals', value: stats.totalReferrals },
            { label: 'Commissions Paid', value: `$${stats.totalCommissionsPaid}` },
            { label: 'Pending Payouts', value: `$${stats.pendingPayouts}` },
          ].map((s) => (
            <div
              key={s.label}
              className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
            >
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className="text-lg font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-lg ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? isDarkMode
                  ? 'bg-zinc-800 text-white'
                  : 'bg-white text-zinc-900 shadow-sm'
                : isDarkMode
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-amber-500/20 text-amber-500'
                    : isDarkMode
                      ? 'bg-zinc-800 text-zinc-500'
                      : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className={`${cardClass} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}>
                <th className={`${headerClass} text-left px-4 py-3`}>Applicant</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Company</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Promotion Plan</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Applied</th>
                <th className={`${headerClass} text-right px-4 py-3`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No pending applications
                  </td>
                </tr>
              ) : (
                pendingApps.map((app) => (
                  <tr key={app.id} className={rowClass}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{app.name}</div>
                      <div className="text-xs text-zinc-500">{app.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{app.company || '—'}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400 max-w-xs truncate">
                      {app.applicationNote || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => approveAffiliate.mutate(app.id)}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => rejectAffiliate.mutate(app.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <div className={`${cardClass} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}>
                <th className={`${headerClass} text-left px-4 py-3`}>Affiliate</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Code</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Status</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Stripe</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Commission</th>
                <th className={`${headerClass} text-right px-4 py-3`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeAffiliates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No affiliates yet
                  </td>
                </tr>
              ) : (
                activeAffiliates.map((aff) => (
                  <tr key={aff.id} className={rowClass}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{aff.name}</div>
                      <div className="text-xs text-zinc-500">{aff.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-400">{aff.code}</td>
                    <td className="px-4 py-3">{statusBadge(aff.status)}</td>
                    <td className="px-4 py-3">
                      {aff.stripeConnectOnboarded ? (
                        <span className="text-xs text-green-500">Connected</span>
                      ) : (
                        <span className="text-xs text-zinc-500">Not set up</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">${aff.commissionAmount}</td>
                    <td className="px-4 py-3 text-right">
                      {aff.status === 'active' && (
                        <button
                          onClick={() => suspendAffiliate.mutate(aff.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors"
                          title="Suspend"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className={`${cardClass} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}>
                <th className={`${headerClass} text-left px-4 py-3`}>Referred</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Affiliate</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Status</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Payment</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Date</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No referrals yet
                  </td>
                </tr>
              ) : (
                referrals.map((ref) => {
                  const aff = affiliates.find((a) => a.id === ref.affiliateId);
                  return (
                    <tr key={ref.id} className={rowClass}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">
                          {ref.referredName || ref.referredEmail || '—'}
                        </div>
                        {ref.referredName && (
                          <div className="text-xs text-zinc-500">{ref.referredEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">{aff?.name || '—'}</td>
                      <td className="px-4 py-3">{statusBadge(ref.status)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        ${ref.amountPaid} / ${ref.totalPrice}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className={`${cardClass} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}>
                <th className={`${headerClass} text-left px-4 py-3`}>Affiliate</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Amount</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Status</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No payouts yet
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => {
                  const aff = affiliates.find((a) => a.id === payout.affiliateId);
                  return (
                    <tr key={payout.id} className={rowClass}>
                      <td className="px-4 py-3 text-sm font-medium">{aff?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium">${payout.amount}</td>
                      <td className="px-4 py-3">{statusBadge(payout.status)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className={`${cardClass} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}>
                <th className={`${headerClass} text-left px-4 py-3`}>Title</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Type</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Visible</th>
                <th className={`${headerClass} text-left px-4 py-3`}>Order</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No assets yet
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className={rowClass}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{asset.title}</div>
                      {asset.description && (
                        <div className="text-xs text-zinc-500">{asset.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {asset.assetType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      {asset.isVisible ? (
                        <span className="text-xs text-green-500">Visible</span>
                      ) : (
                        <span className="text-xs text-zinc-500">Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{asset.sortOrder}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAffiliatesPage;
