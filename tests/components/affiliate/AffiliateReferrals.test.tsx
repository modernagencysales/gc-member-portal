import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils';
import AffiliateReferrals from '../../../components/affiliate/AffiliateReferrals';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn(),
  };
});

vi.mock('../../../hooks/useAffiliate', () => ({
  useAffiliateReferrals: vi.fn(),
}));

import { useOutletContext } from 'react-router-dom';
import { useAffiliateReferrals } from '../../../hooks/useAffiliate';

const mockUseOutletContext = useOutletContext as ReturnType<typeof vi.fn>;
const mockUseAffiliateReferrals = useAffiliateReferrals as ReturnType<typeof vi.fn>;

const mockAffiliate = {
  id: 'aff-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  company: 'Acme Inc',
  slug: 'jane-doe',
  code: 'JANEDOE',
  status: 'active' as const,
  commissionAmount: 500,
  stripeConnectAccountId: null,
  stripeConnectOnboarded: false,
  bootcampStudentId: null,
  photoUrl: null,
  bio: null,
  applicationNote: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockStats = {
  totalReferrals: 3,
  activeReferrals: 2,
  totalEarned: 1000,
  pendingPayouts: 500,
};

const mockReferrals = [
  {
    id: 'ref-1',
    affiliateId: 'aff-1',
    referredEmail: 'alice@example.com',
    referredName: 'Alice Smith',
    bootcampStudentId: 'stu-1',
    totalPrice: 2000,
    amountPaid: 2000,
    status: 'paid_in_full',
    attributedAt: new Date('2025-01-15'),
    enrolledAt: new Date('2025-01-16'),
    paidInFullAt: new Date('2025-02-01'),
    commissionPaidAt: null,
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'ref-2',
    affiliateId: 'aff-1',
    referredEmail: 'bob@example.com',
    referredName: 'Bob Jones',
    bootcampStudentId: 'stu-2',
    totalPrice: 2000,
    amountPaid: 500,
    status: 'paying',
    attributedAt: new Date('2025-02-01'),
    enrolledAt: new Date('2025-02-02'),
    paidInFullAt: null,
    commissionPaidAt: null,
    createdAt: new Date('2025-02-01'),
  },
  {
    id: 'ref-3',
    affiliateId: 'aff-1',
    referredEmail: null,
    referredName: null,
    bootcampStudentId: null,
    totalPrice: 0,
    amountPaid: 0,
    status: 'clicked',
    attributedAt: new Date('2025-03-01'),
    enrolledAt: null,
    paidInFullAt: null,
    commissionPaidAt: null,
    createdAt: new Date('2025-03-01'),
  },
];

describe('AffiliateReferrals', () => {
  beforeEach(() => {
    mockUseOutletContext.mockReturnValue({
      affiliate: mockAffiliate,
      stats: mockStats,
    });
  });

  it('shows loading state', () => {
    mockUseAffiliateReferrals.mockReturnValue({
      referrals: [],
      loading: true,
    });

    render(<AffiliateReferrals />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders referral table with data', () => {
    mockUseAffiliateReferrals.mockReturnValue({
      referrals: mockReferrals,
      loading: false,
    });

    render(<AffiliateReferrals />);

    expect(screen.getByText('My Referrals')).toBeInTheDocument();

    // Table headers
    expect(screen.getByText('Person')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();

    // Referral data
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('$2000 / $2000')).toBeInTheDocument();

    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('$500 / $2000')).toBeInTheDocument();

    // Anonymous referral (no name or email)
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('shows empty state when no referrals', () => {
    mockUseAffiliateReferrals.mockReturnValue({
      referrals: [],
      loading: false,
    });

    render(<AffiliateReferrals />);

    expect(screen.getByText(/no referrals yet/i)).toBeInTheDocument();
    expect(screen.getByText(/share your link to get started/i)).toBeInTheDocument();
  });

  it('shows correct status badges', () => {
    mockUseAffiliateReferrals.mockReturnValue({
      referrals: mockReferrals,
      loading: false,
    });

    render(<AffiliateReferrals />);

    // Status badges render the status with underscores replaced by spaces
    expect(screen.getByText('paid in full')).toBeInTheDocument();
    expect(screen.getByText('paying')).toBeInTheDocument();
    expect(screen.getByText('clicked')).toBeInTheDocument();
  });
});
