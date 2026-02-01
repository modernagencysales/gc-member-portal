import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../test-utils';
import AffiliateOverview from '../../../components/affiliate/AffiliateOverview';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn(),
  };
});

import { useOutletContext } from 'react-router-dom';

const mockUseOutletContext = useOutletContext as ReturnType<typeof vi.fn>;

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
  bio: 'Growth expert',
  applicationNote: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockStats = {
  totalReferrals: 12,
  activeReferrals: 5,
  totalEarned: 2500,
  pendingPayouts: 1000,
};

const mockWriteText = vi.fn().mockResolvedValue(undefined);

describe('AffiliateOverview', () => {
  beforeEach(() => {
    mockUseOutletContext.mockReturnValue({
      affiliate: mockAffiliate,
      stats: mockStats,
    });

    mockWriteText.mockClear();

    // Mock clipboard API using defineProperty to handle the getter-only property
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
        readText: vi.fn(),
        read: vi.fn(),
        write: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders stat cards with correct values', () => {
    render(<AffiliateOverview />);

    expect(screen.getByText('Total Referrals')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    expect(screen.getByText('Active Referrals')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Total Earned')).toBeInTheDocument();
    expect(screen.getByText('$2500')).toBeInTheDocument();

    expect(screen.getByText('Pending Payouts')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
  });

  it('renders referral link with copy button', () => {
    render(<AffiliateOverview />);

    expect(screen.getByText('Referral Link')).toBeInTheDocument();

    // The referral URL input should contain the slug
    const linkInput = screen.getByDisplayValue(/\/refer\/jane-doe/);
    expect(linkInput).toBeInTheDocument();
    expect(linkInput).toHaveAttribute('readOnly');
  });

  it('renders referral code with copy button', () => {
    render(<AffiliateOverview />);

    expect(screen.getByText('Referral Code')).toBeInTheDocument();

    const codeInput = screen.getByDisplayValue('JANEDOE');
    expect(codeInput).toBeInTheDocument();
    expect(codeInput).toHaveAttribute('readOnly');
  });

  it('copy button copies referral link to clipboard', async () => {
    render(<AffiliateOverview />);

    // There are two Copy buttons -- one for link, one for code
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBe(2);

    // Click the first copy button (referral link) using fireEvent to bypass userEvent clipboard interception
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledTimes(1);
    });

    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('/refer/jane-doe'));

    // Should show "Copied" text after clicking
    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('copy button copies referral code to clipboard', async () => {
    render(<AffiliateOverview />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });

    // Click the second copy button (referral code) using fireEvent
    fireEvent.click(copyButtons[1]);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledTimes(1);
    });

    expect(mockWriteText).toHaveBeenCalledWith('JANEDOE');

    await waitFor(() => {
      const copiedTexts = screen.getAllByText('Copied');
      expect(copiedTexts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
