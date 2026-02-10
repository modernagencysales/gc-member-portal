import { useQuery } from '@tanstack/react-query';
import {
  fetchActiveTiers,
  fetchProvisionsByStudentId,
  fetchProvisioningLog,
  fetchOutreachPricing,
} from '../services/infrastructure-supabase';

export function useInfraTiers() {
  return useQuery({
    queryKey: ['infra-tiers'],
    queryFn: fetchActiveTiers,
  });
}

export function useOutreachPricing() {
  return useQuery({
    queryKey: ['infra-outreach-pricing'],
    queryFn: fetchOutreachPricing,
  });
}

export function useInfraProvisions(studentId: string | undefined) {
  return useQuery({
    queryKey: ['infra-provisions', studentId],
    queryFn: () => fetchProvisionsByStudentId(studentId!),
    enabled: !!studentId,
  });
}

// Backwards-compatible alias
export function useInfraProvision(studentId: string | undefined) {
  const query = useInfraProvisions(studentId);
  return {
    ...query,
    data: query.data?.emailInfra || query.data?.outreachTools || null,
  };
}

export function useProvisioningLog(provisionId: string | undefined, isProvisioning: boolean) {
  return useQuery({
    queryKey: ['infra-provisioning-log', provisionId],
    queryFn: () => fetchProvisioningLog(provisionId!),
    enabled: !!provisionId && isProvisioning,
    refetchInterval: isProvisioning ? 3000 : false, // Poll every 3s during provisioning
  });
}
