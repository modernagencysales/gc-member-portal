import { useInfraProvisions } from '../../../hooks/useInfrastructure';
import InfraWizard from './wizard/InfraWizard';
import ProvisioningProgress from './ProvisioningProgress';
import InfraDashboard from './dashboard/InfraDashboard';

export type InfraMode = 'account_setup' | 'email_infra';

interface Props {
  userId: string;
  mode?: InfraMode;
}

export default function InfrastructurePage({ userId, mode = 'account_setup' }: Props) {
  const { data: provisions, isLoading } = useInfraProvisions(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const emailInfra = provisions?.emailInfra || null;
  const outreachTools = provisions?.outreachTools || null;

  // Determine which provision is relevant based on mode
  const relevantProvision = mode === 'email_infra' ? emailInfra : outreachTools;

  // No relevant provision — show wizard scoped to this mode
  if (!relevantProvision) {
    return <InfraWizard userId={userId} mode={mode} />;
  }

  // Currently provisioning — show progress
  if (relevantProvision.status === 'provisioning') {
    return <ProvisioningProgress emailInfra={emailInfra} outreachTools={outreachTools} />;
  }

  // Active — show dashboard
  if (relevantProvision.status === 'active') {
    return <InfraDashboard emailInfra={emailInfra} outreachTools={outreachTools} userId={userId} />;
  }

  // Failed — show error with log
  if (relevantProvision.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-red-500 dark:text-red-400 text-lg font-semibold mb-2">
          Provisioning Failed
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
          Something went wrong during setup. Please contact support.
        </p>
        <pre className="text-left bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 text-xs overflow-auto max-h-60">
          {JSON.stringify(relevantProvision.provisioningLog, null, 2)}
        </pre>
      </div>
    );
  }

  // pending_payment — show wizard with existing data
  return <InfraWizard userId={userId} mode={mode} existingProvision={relevantProvision} />;
}
