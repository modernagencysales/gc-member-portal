import { useQuery } from '@tanstack/react-query';
import {
  fetchActiveTiers,
  fetchProvisionByStudentId,
  fetchProvisioningLog,
} from '../services/infrastructure-supabase';

export function useInfraTiers() {
  return useQuery({
    queryKey: ['infra-tiers'],
    queryFn: fetchActiveTiers,
  });
}

export function useInfraProvision(studentId: string | undefined) {
  return useQuery({
    queryKey: ['infra-provision', studentId],
    queryFn: () => fetchProvisionByStudentId(studentId!),
    enabled: !!studentId,
  });
}

export function useProvisioningLog(provisionId: string | undefined, isProvisioning: boolean) {
  return useQuery({
    queryKey: ['infra-provisioning-log', provisionId],
    queryFn: () => fetchProvisioningLog(provisionId!),
    enabled: !!provisionId && isProvisioning,
    refetchInterval: isProvisioning ? 3000 : false, // Poll every 3s during provisioning
  });
}
