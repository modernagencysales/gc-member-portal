import { useInfraProvision } from '../../../hooks/useInfrastructure';
import InfraWizard from './wizard/InfraWizard';
import ProvisioningProgress from './ProvisioningProgress';
import InfraDashboard from './dashboard/InfraDashboard';

interface Props {
  userId: string;
}

export default function InfrastructurePage({ userId }: Props) {
  const { data: provision, isLoading } = useInfraProvision(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!provision) {
    return <InfraWizard userId={userId} />;
  }

  if (provision.status === 'provisioning') {
    return <ProvisioningProgress provision={provision} />;
  }

  if (provision.status === 'active') {
    return <InfraDashboard provision={provision} />;
  }

  if (provision.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-red-500 dark:text-red-400 text-lg font-semibold mb-2">
          Provisioning Failed
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
          Something went wrong during setup. Please contact support.
        </p>
        <pre className="text-left bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 text-xs overflow-auto max-h-60">
          {JSON.stringify(provision.provisioningLog, null, 2)}
        </pre>
      </div>
    );
  }

  // pending_payment — show wizard (provision exists but unpaid)
  return <InfraWizard userId={userId} existingProvision={provision} />;
}
