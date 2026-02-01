import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import ReferralLandingPage from '../../../components/affiliate/ReferralLandingPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

vi.mock('../../../services/affiliate-supabase', () => ({
  fetchAffiliateBySlug: vi.fn(),
}));

vi.mock('../../../lib/referral-cookie', () => ({
  setReferralCookie: vi.fn(),
}));

import { useParams } from 'react-router-dom';
import { fetchAffiliateBySlug } from '../../../services/affiliate-supabase';
import { setReferralCookie } from '../../../lib/referral-cookie';

const mockUseParams = useParams as ReturnType<typeof vi.fn>;
const mockFetchBySlug = fetchAffiliateBySlug as ReturnType<typeof vi.fn>;
const mockSetCookie = setReferralCookie as ReturnType<typeof vi.fn>;

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
  bio: 'Growth marketing expert helping B2B founders scale.',
  applicationNote: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

describe('ReferralLandingPage', () => {
  beforeEach(() => {
    mockFetchBySlug.mockReset();
    mockSetCookie.mockReset();
    mockUseParams.mockReturnValue({ slug: 'jane-doe' });
  });

  it('shows loading state initially', () => {
    // Keep the fetch pending so loading state persists
    mockFetchBySlug.mockReturnValue(new Promise(() => {}));

    render(<ReferralLandingPage />);

    // The Loader2 icon renders as an SVG with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders affiliate info when found', async () => {
    mockFetchBySlug.mockResolvedValue(mockAffiliate);

    render(<ReferralLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText(/growth marketing expert/i)).toBeInTheDocument();
    expect(screen.getByText('Referred by')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn Authority Bootcamp')).toBeInTheDocument();
  });

  it('sets referral cookie when affiliate is loaded', async () => {
    mockFetchBySlug.mockResolvedValue(mockAffiliate);

    render(<ReferralLandingPage />);

    await waitFor(() => {
      expect(mockSetCookie).toHaveBeenCalledWith('JANEDOE');
    });

    expect(mockFetchBySlug).toHaveBeenCalledWith('jane-doe');
  });

  it('shows not-found state for invalid slug', async () => {
    mockUseParams.mockReturnValue({ slug: 'nonexistent' });
    mockFetchBySlug.mockResolvedValue(null);

    render(<ReferralLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    expect(screen.getByText(/this referral link is no longer active/i)).toBeInTheDocument();
    expect(mockSetCookie).not.toHaveBeenCalled();
  });
});
