import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllAffiliates,
  fetchAllReferrals,
  fetchAllPayouts,
  fetchAllAffiliateAssets,
  fetchAdminAffiliateStats,
  updateAffiliateStatus,
  updateAffiliate,
  createAffiliateAsset,
  updateAffiliateAsset,
  deleteAffiliateAsset,
} from '../services/affiliate-supabase';

export function useAffiliateAdmin() {
  const queryClient = useQueryClient();

  const affiliatesQuery = useQuery({
    queryKey: ['admin', 'affiliates'],
    queryFn: fetchAllAffiliates,
  });

  const referralsQuery = useQuery({
    queryKey: ['admin', 'referrals'],
    queryFn: fetchAllReferrals,
  });

  const payoutsQuery = useQuery({
    queryKey: ['admin', 'payouts'],
    queryFn: fetchAllPayouts,
  });

  const assetsQuery = useQuery({
    queryKey: ['admin', 'affiliate-assets'],
    queryFn: fetchAllAffiliateAssets,
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'affiliate-stats'],
    queryFn: fetchAdminAffiliateStats,
  });

  const approveAffiliate = useMutation({
    mutationFn: (id: string) => updateAffiliateStatus(id, 'approved'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] }),
  });

  const rejectAffiliate = useMutation({
    mutationFn: (id: string) => updateAffiliateStatus(id, 'rejected'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] }),
  });

  const suspendAffiliate = useMutation({
    mutationFn: (id: string) => updateAffiliateStatus(id, 'suspended'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] }),
  });

  const updateAffiliateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateAffiliate>[1] }) =>
      updateAffiliate(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] }),
  });

  const createAssetMutation = useMutation({
    mutationFn: createAffiliateAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-assets'] }),
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Parameters<typeof updateAffiliateAsset>[1];
    }) => updateAffiliateAsset(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-assets'] }),
  });

  const deleteAssetMutation = useMutation({
    mutationFn: deleteAffiliateAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-assets'] }),
  });

  return {
    affiliates: affiliatesQuery.data || [],
    referrals: referralsQuery.data || [],
    payouts: payoutsQuery.data || [],
    assets: assetsQuery.data || [],
    stats: statsQuery.data,
    loading: affiliatesQuery.isLoading,
    approveAffiliate,
    rejectAffiliate,
    suspendAffiliate,
    updateAffiliate: updateAffiliateMutation,
    createAsset: createAssetMutation,
    updateAsset: updateAssetMutation,
    deleteAsset: deleteAssetMutation,
  };
}
