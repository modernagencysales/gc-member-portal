import React from 'react';
import { TamProjectStats } from '../../types/tam-types';

interface TamStatsBarProps {
  stats: TamProjectStats;
}

const TamStatsBar: React.FC<TamStatsBarProps> = ({ stats }) => {
  // Calculate percentages for email coverage
  const emailCoveragePercent =
    stats.totalContacts > 0
      ? Math.round(((stats.emailsVerified + stats.emailsCatchAll) / stats.totalContacts) * 100)
      : 0;

  // Calculate percentage for LinkedIn active
  const linkedinActivePercent =
    stats.totalContacts > 0 ? Math.round((stats.linkedinActive / stats.totalContacts) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Companies Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
          Companies
        </div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          {stats.totalCompanies.toLocaleString()}
        </div>
        <div className="text-xs text-zinc-500 space-x-1">
          <span className="text-emerald-600 dark:text-emerald-400">
            {stats.qualifiedCompanies} qualified
          </span>
          <span>•</span>
          <span className="text-red-600 dark:text-red-400">
            {stats.disqualifiedCompanies} disqualified
          </span>
          <span>•</span>
          <span className="text-zinc-500">{stats.pendingCompanies} pending</span>
        </div>
      </div>

      {/* Contacts Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
          Contacts
        </div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-white">
          {stats.totalContacts.toLocaleString()}
        </div>
      </div>

      {/* Email Coverage Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
          Email Coverage
        </div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          {emailCoveragePercent}%
        </div>
        <div className="text-xs text-zinc-500 space-x-1">
          <span className="text-emerald-600 dark:text-emerald-400">
            {stats.emailsVerified} verified
          </span>
          <span>•</span>
          <span className="text-amber-600 dark:text-amber-400">
            {stats.emailsCatchAll} catch-all
          </span>
          <span>•</span>
          <span className="text-red-600 dark:text-red-400">{stats.emailsNotFound} not found</span>
        </div>
      </div>

      {/* LinkedIn Active Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
          LinkedIn Active
        </div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          {linkedinActivePercent}%
        </div>
        <div className="text-xs text-zinc-500 space-x-1">
          <span className="text-emerald-600 dark:text-emerald-400">
            {stats.linkedinActive} active
          </span>
          <span>•</span>
          <span className="text-zinc-500">{stats.linkedinInactive} inactive</span>
        </div>
      </div>
    </div>
  );
};

export default TamStatsBar;
