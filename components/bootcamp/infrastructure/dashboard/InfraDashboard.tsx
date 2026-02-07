import { Globe, Mail, Activity } from 'lucide-react';
import { InfraProvisionWithDetails } from '../../../../types/infrastructure-types';

interface Props {
  provision: InfraProvisionWithDetails;
}

export default function InfraDashboard({ provision }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">GTM Infrastructure</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          {provision.tier.name} Package — {provision.domains.length} domains,{' '}
          {provision.domains.length * provision.tier.mailboxesPerDomain} mailboxes
        </p>
      </div>

      {/* Domains */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Domains</h2>
        </div>
        <div className="space-y-3">
          {provision.domains.map((domain) => (
            <div
              key={domain.id}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
            >
              <div className="font-mono text-sm text-zinc-900 dark:text-white">
                {domain.domainName}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  domain.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : domain.status === 'connected'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}
              >
                {domain.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mailboxes */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Mailboxes</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {provision.domains.flatMap((domain) =>
            domain.mailboxes.map((mb) => (
              <div
                key={mb.email}
                className="px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 font-mono text-xs text-zinc-700 dark:text-zinc-300"
              >
                {mb.email}
              </div>
            ))
          )}
          {provision.domains.every((d) => d.mailboxes.length === 0) && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 col-span-2">
              Mailboxes will appear here once provisioning completes.
            </p>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Status</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {provision.plusvibeClientEmail && (
            <div className="space-y-1">
              <div className="text-xs text-zinc-400 dark:text-zinc-500">PlusVibe Login</div>
              <div className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                {provision.plusvibeClientEmail}
              </div>
            </div>
          )}
          {provision.heyreachListId && (
            <div className="space-y-1">
              <div className="text-xs text-zinc-400 dark:text-zinc-500">HeyReach List ID</div>
              <div className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                {provision.heyreachListId}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <div className="text-xs text-zinc-400 dark:text-zinc-500">Warmup Status</div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              Coming soon — check PlusVibe dashboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
