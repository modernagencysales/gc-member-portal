import { useState, useEffect } from 'react';
import {
  Affiliate,
  AffiliateStats,
  Referral,
  AffiliatePayout,
  AffiliateAsset,
} from '../types/affiliate-types';
import {
  fetchAffiliateByEmail,
  fetchAffiliateStats,
  fetchAffiliateReferrals,
  fetchAffiliatePayouts,
  fetchAffiliateAssets,
} from '../services/affiliate-supabase';

const AFFILIATE_KEY = 'affiliate_user';

export function useAffiliate() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem(AFFILIATE_KEY);
      if (!saved) {
        setLoading(false);
        return;
      }
      try {
        const { email } = JSON.parse(saved);
        const aff = await fetchAffiliateByEmail(email);
        if (aff && aff.status === 'active') {
          setAffiliate(aff);
          const s = await fetchAffiliateStats(aff.id);
          setStats(s);
        } else {
          localStorage.removeItem(AFFILIATE_KEY);
        }
      } catch {
        localStorage.removeItem(AFFILIATE_KEY);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const login = async (email: string): Promise<boolean> => {
    const aff = await fetchAffiliateByEmail(email);
    if (aff && aff.status === 'active') {
      localStorage.setItem(AFFILIATE_KEY, JSON.stringify({ email: aff.email }));
      setAffiliate(aff);
      const s = await fetchAffiliateStats(aff.id);
      setStats(s);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AFFILIATE_KEY);
    setAffiliate(null);
    setStats(null);
  };

  const refreshStats = async () => {
    if (!affiliate) return;
    const s = await fetchAffiliateStats(affiliate.id);
    setStats(s);
  };

  return { affiliate, stats, loading, login, logout, refreshStats };
}

export function useAffiliateReferrals(affiliateId: string | undefined) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!affiliateId) return;
    fetchAffiliateReferrals(affiliateId)
      .then(setReferrals)
      .finally(() => setLoading(false));
  }, [affiliateId]);

  return { referrals, loading };
}

export function useAffiliatePayoutsList(affiliateId: string | undefined) {
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!affiliateId) return;
    fetchAffiliatePayouts(affiliateId)
      .then(setPayouts)
      .finally(() => setLoading(false));
  }, [affiliateId]);

  return { payouts, loading };
}

export function useAffiliateAssetsList() {
  const [assets, setAssets] = useState<AffiliateAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAffiliateAssets()
      .then(setAssets)
      .finally(() => setLoading(false));
  }, []);

  return { assets, loading };
}
