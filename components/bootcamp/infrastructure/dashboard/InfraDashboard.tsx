import { Globe, Mail, Activity, Linkedin, Plus } from 'lucide-react';
import { InfraProvisionWithDetails } from '../../../../types/infrastructure-types';

interface Props {
  emailInfra: InfraProvisionWithDetails | null;
  outreachTools: InfraProvisionWithDetails | null;
  userId: string;
}

export default function InfraDashboard({ emailInfra, outreachTools, userId }: Props) {
  const hasBoth = !!emailInfra && !!outreachTools;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">GTM Infrastructure</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          {[
            emailInfra?.tier
              ? `${emailInfra.tier.name} Email Infra — ${emailInfra.domains.length} domains`
              : null,
            outreachTools ? 'Outreach Tools active' : null,
          ]
            .filter(Boolean)
            .join(' + ')}
        </p>
      </div>

      {/* Email Infrastructure Section */}
      {emailInfra && emailInfra.status === 'active' && (
        <>
          {/* Domains */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-violet-500" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Domains</h2>
            </div>
            <div className="space-y-3">
              {emailInfra.domains.map((domain) => (
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
              {emailInfra.domains.flatMap((domain) =>
                domain.mailboxes.map((mb) => (
                  <div
                    key={mb.email}
                    className="px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 font-mono text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    {mb.email}
                  </div>
                ))
              )}
              {emailInfra.domains.every((d) => d.mailboxes.length === 0) && (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 col-span-2">
                  Mailboxes will appear here once provisioning completes.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Outreach Tools Section */}
      {outreachTools && outreachTools.status === 'active' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-violet-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Outreach Tools</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {outreachTools.plusvibeClientEmail && (
              <div className="space-y-1">
                <div className="text-xs text-zinc-400 dark:text-zinc-500">PlusVibe Login</div>
                <div className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                  {outreachTools.plusvibeClientEmail}
                </div>
              </div>
            )}
            {outreachTools.heyreachListId && (
              <div className="space-y-1">
                <div className="text-xs text-zinc-400 dark:text-zinc-500">HeyReach List ID</div>
                <div className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                  {outreachTools.heyreachListId}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className="text-xs text-zinc-400 dark:text-zinc-500">Warmup Status</div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                {emailInfra?.status === 'active'
                  ? 'Active — check PlusVibe dashboard'
                  : 'Pending — requires Email Infrastructure'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Banner — add missing product */}
      {!hasBoth && (
        <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-200 dark:border-violet-800/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {!emailInfra ? 'Add Email Infrastructure' : 'Add Outreach Tools'}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {!emailInfra
                  ? 'Get sending domains and warmed mailboxes to power your outreach.'
                  : 'Add PlusVibe email sequencing and HeyReach LinkedIn automation.'}
              </p>
            </div>
            <button
              onClick={() => {
                // Navigate to infrastructure wizard — the wizard will detect existing provisions
                // and pre-select the missing product
                window.location.href = !emailInfra
                  ? '/bootcamp?lesson=virtual:infra-email-infra'
                  : '/bootcamp?lesson=virtual:infra-account-setup';
              }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
