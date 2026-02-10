import { useInfraProvisions } from '../../../hooks/useInfrastructure';
import InfraWizard from './wizard/InfraWizard';
import ProvisioningProgress from './ProvisioningProgress';
import InfraDashboard from './dashboard/InfraDashboard';

interface Props {
  userId: string;
}

export default function InfrastructurePage({ userId }: Props) {
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

  // No provisions at all — show wizard
  if (!emailInfra && !outreachTools) {
    return <InfraWizard userId={userId} />;
  }

  // Any provision is currently provisioning — show progress
  const isProvisioning =
    emailInfra?.status === 'provisioning' || outreachTools?.status === 'provisioning';
  if (isProvisioning) {
    return <ProvisioningProgress emailInfra={emailInfra} outreachTools={outreachTools} />;
  }

  // All purchased provisions are active — show dashboard
  const allActive =
    (!emailInfra || emailInfra.status === 'active') &&
    (!outreachTools || outreachTools.status === 'active');
  if (allActive && (emailInfra || outreachTools)) {
    return <InfraDashboard emailInfra={emailInfra} outreachTools={outreachTools} userId={userId} />;
  }

  // Any provision failed — show error with log
  const failedProvision =
    (emailInfra?.status === 'failed' ? emailInfra : null) ||
    (outreachTools?.status === 'failed' ? outreachTools : null);
  if (failedProvision) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-red-500 dark:text-red-400 text-lg font-semibold mb-2">
          Provisioning Failed
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
          Something went wrong during setup. Please contact support.
        </p>
        <pre className="text-left bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 text-xs overflow-auto max-h-60">
          {JSON.stringify(failedProvision.provisioningLog, null, 2)}
        </pre>
      </div>
    );
  }

  // pending_payment — show wizard with existing data
  return (
    <InfraWizard userId={userId} existingProvision={emailInfra || outreachTools || undefined} />
  );
}
