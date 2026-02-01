import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '../test-utils';
import {
  useAffiliate,
  useAffiliateReferrals,
  useAffiliatePayoutsList,
  useAffiliateAssetsList,
} from '../../hooks/useAffiliate';
import {
  fetchAffiliateByEmail,
  fetchAffiliateStats,
  fetchAffiliateReferrals,
  fetchAffiliatePayouts,
  fetchAffiliateAssets,
} from '../../services/affiliate-supabase';

vi.mock('../../services/affiliate-supabase', () => ({
  fetchAffiliateByEmail: vi.fn(),
  fetchAffiliateStats: vi.fn(),
  fetchAffiliateReferrals: vi.fn(),
  fetchAffiliatePayouts: vi.fn(),
  fetchAffiliateAssets: vi.fn(),
}));

const mockAffiliate = {
  id: 'aff-001',
  email: 'affiliate@example.com',
  name: 'Test Affiliate',
  company: 'Test Corp',
  slug: 'test-affiliate',
  code: 'ABC123',
  status: 'active' as const,
  commissionAmount: 500,
  stripeConnectAccountId: null,
  stripeConnectOnboarded: false,
  bootcampStudentId: null,
  photoUrl: null,
  bio: 'Test bio',
  applicationNote: null,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
};

const mockStats = {
  totalReferrals: 10,
  activeReferrals: 5,
  totalEarned: 2500,
  pendingPayouts: 500,
};

const mockReferrals = [
  {
    id: 'ref-001',
    affiliateId: 'aff-001',
    referredEmail: 'lead@example.com',
    referredName: 'Lead Person',
    bootcampStudentId: null,
    totalPrice: 2000,
    amountPaid: 0,
    status: 'clicked' as const,
    attributedAt: new Date('2026-01-20'),
    enrolledAt: null,
    paidInFullAt: null,
    commissionPaidAt: null,
    createdAt: new Date('2026-01-20'),
  },
];

const mockPayouts = [
  {
    id: 'pay-001',
    affiliateId: 'aff-001',
    referralId: 'ref-001',
    amount: 500,
    stripeTransferId: null,
    status: 'pending' as const,
    createdAt: new Date('2026-01-25'),
    paidAt: null,
  },
];

const mockAssets = [
  {
    id: 'asset-001',
    title: 'Email Template',
    description: 'A swipe copy template',
    assetType: 'swipe_copy' as const,
    contentText: 'Hello {name}',
    fileUrl: null,
    sortOrder: 1,
    isVisible: true,
    createdAt: new Date('2026-01-10'),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  // localStorage is mocked globally in setup.ts
  (localStorage.getItem as ReturnType<typeof vi.fn>).mockReset();
  (localStorage.setItem as ReturnType<typeof vi.fn>).mockReset();
  (localStorage.removeItem as ReturnType<typeof vi.fn>).mockReset();
});

describe('useAffiliate', () => {
  it('returns loading=true initially when localStorage has saved data', async () => {
    // When localStorage has data, the hook needs to fetch before setting loading=false
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify({ email: 'affiliate@example.com' })
    );
    // Delay the resolution so we can observe loading=true
    vi.mocked(fetchAffiliateByEmail).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAffiliate), 100))
    );
    vi.mocked(fetchAffiliateStats).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useAffiliate());

    // While fetching, loading should be true
    expect(result.current.loading).toBe(true);
    expect(result.current.affiliate).toBeNull();
    expect(result.current.stats).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('loads affiliate from localStorage on mount', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify({ email: 'affiliate@example.com' })
    );
    vi.mocked(fetchAffiliateByEmail).mockResolvedValue(mockAffiliate);
    vi.mocked(fetchAffiliateStats).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useAffiliate());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(localStorage.getItem).toHaveBeenCalledWith('affiliate_user');
    expect(fetchAffiliateByEmail).toHaveBeenCalledWith('affiliate@example.com');
    expect(fetchAffiliateStats).toHaveBeenCalledWith('aff-001');
    expect(result.current.affiliate).toEqual(mockAffiliate);
    expect(result.current.stats).toEqual(mockStats);
  });

  it('clears localStorage when saved affiliate is not active', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify({ email: 'inactive@example.com' })
    );
    vi.mocked(fetchAffiliateByEmail).mockResolvedValue({
      ...mockAffiliate,
      status: 'pending',
    });

    const { result } = renderHook(() => useAffiliate());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('affiliate_user');
    expect(result.current.affiliate).toBeNull();
  });

  it('sets loading=false when no saved affiliate in localStorage', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() => useAffiliate());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.affiliate).toBeNull();
    expect(result.current.stats).toBeNull();
  });

  it('login sets affiliate and saves to localStorage', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    vi.mocked(fetchAffiliateByEmail).mockResolvedValue(mockAffiliate);
    vi.mocked(fetchAffiliateStats).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useAffiliate());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult: boolean = false;
    await act(async () => {
      loginResult = await result.current.login('affiliate@example.com');
    });

    expect(loginResult).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'affiliate_user',
      JSON.stringify({ email: 'affiliate@example.com' })
    );
    expect(result.current.affiliate).toEqual(mockAffiliate);
    expect(result.current.stats).toEqual(mockStats);
  });

  it('login returns false for non-active affiliate', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    vi.mocked(fetchAffiliateByEmail).mockResolvedValue({
      ...mockAffiliate,
      status: 'pending',
    });

    const { result } = renderHook(() => useAffiliate());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult: boolean = true;
    await act(async () => {
      loginResult = await result.current.login('pending@example.com');
    });

    expect(loginResult).toBe(false);
  });

  it('login returns false when affiliate not found', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    vi.mocked(fetchAffiliateByEmail).mockResolvedValue(null);

    const { result } = renderHook(() => useAffiliate());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult: boolean = true;
    await act(async () => {
      loginResult = await result.current.login('nobody@example.com');
    });

    expect(loginResult).toBe(false);
  });

  it('logout clears affiliate and localStorage', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify({ email: 'affiliate@example.com' })
    );
    vi.mocked(fetchAffiliateByEmail).mockResolvedValue(mockAffiliate);
    vi.mocked(fetchAffiliateStats).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useAffiliate());

    await waitFor(() => {
      expect(result.current.affiliate).toEqual(mockAffiliate);
    });

    act(() => {
      result.current.logout();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('affiliate_user');
    expect(result.current.affiliate).toBeNull();
    expect(result.current.stats).toBeNull();
  });
});

describe('useAffiliateReferrals', () => {
  it('fetches referrals for given affiliateId', async () => {
    vi.mocked(fetchAffiliateReferrals).mockResolvedValue(mockReferrals);

    const { result } = renderHook(() => useAffiliateReferrals('aff-001'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchAffiliateReferrals).toHaveBeenCalledWith('aff-001');
    expect(result.current.referrals).toEqual(mockReferrals);
  });

  it('does not fetch when affiliateId is undefined', () => {
    const { result } = renderHook(() => useAffiliateReferrals(undefined));

    expect(fetchAffiliateReferrals).not.toHaveBeenCalled();
    expect(result.current.referrals).toEqual([]);
  });

  it('returns empty array initially', () => {
    vi.mocked(fetchAffiliateReferrals).mockResolvedValue(mockReferrals);

    const { result } = renderHook(() => useAffiliateReferrals('aff-001'));

    expect(result.current.referrals).toEqual([]);
  });
});

describe('useAffiliatePayoutsList', () => {
  it('fetches payouts for given affiliateId', async () => {
    vi.mocked(fetchAffiliatePayouts).mockResolvedValue(mockPayouts);

    const { result } = renderHook(() => useAffiliatePayoutsList('aff-001'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchAffiliatePayouts).toHaveBeenCalledWith('aff-001');
    expect(result.current.payouts).toEqual(mockPayouts);
  });

  it('does not fetch when affiliateId is undefined', () => {
    const { result } = renderHook(() => useAffiliatePayoutsList(undefined));

    expect(fetchAffiliatePayouts).not.toHaveBeenCalled();
    expect(result.current.payouts).toEqual([]);
  });
});

describe('useAffiliateAssetsList', () => {
  it('fetches assets on mount', async () => {
    vi.mocked(fetchAffiliateAssets).mockResolvedValue(mockAssets);

    const { result } = renderHook(() => useAffiliateAssetsList());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchAffiliateAssets).toHaveBeenCalled();
    expect(result.current.assets).toEqual(mockAssets);
  });

  it('returns empty array initially', () => {
    vi.mocked(fetchAffiliateAssets).mockResolvedValue(mockAssets);

    const { result } = renderHook(() => useAffiliateAssetsList());

    expect(result.current.assets).toEqual([]);
  });
});
