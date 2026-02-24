import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test-utils';

// Mock the services
vi.mock('../../../../services/blueprint-supabase', () => ({
  getProspectBySlug: vi.fn(),
  getBlueprintSettings: vi.fn(),
}));

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-prospect-abc1' }),
  };
});

import OfferPage from '../../../../components/blueprint/OfferPage';
import { getProspectBySlug, getBlueprintSettings } from '../../../../services/blueprint-supabase';

const mockProspect = {
  id: '1',
  firstName: 'Sarah',
  fullName: 'Sarah Chen',
  slug: 'test-prospect-abc1',
  offerNote: 'Hey Sarah, this is perfect for your agency.',
  createdAt: new Date(),
};

const mockSettings = {
  id: '1',
  stickyCTAEnabled: true,
  foundationsPaymentUrl: '',
  engineeringPaymentUrl: '',
  calBookingLink: '',
  showBootcampOffer: true,
  showGcOffer: true,
  showDfyOffer: true,
  bootcampOfferTitle: '',
  bootcampOfferDescription: '',
  bootcampOfferCta: '',
  gcOfferTitle: '',
  gcOfferDescription: '',
  gcOfferCta: '',
  dfyOfferTitle: '',
  dfyOfferDescription: '',
  dfyOfferCta: '',
  dfyOfferUrl: 'https://buy.stripe.com/test123',
  defaultOfferUnlocked: false,
  spotsRemainingDfy: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('OfferPage (DFY)', () => {
  beforeEach(() => {
    vi.mocked(getProspectBySlug).mockResolvedValue(mockProspect as any);
    vi.mocked(getBlueprintSettings).mockResolvedValue(mockSettings as any);
  });

  it('renders personalized header with prospect name', async () => {
    render(<OfferPage />);

    await waitFor(() => {
      expect(screen.getByText('Sarah')).toBeInTheDocument();
    });
    expect(screen.getByText(/Prepared for/)).toBeInTheDocument();
  });

  it('renders seller note when offerNote exists', async () => {
    render(<OfferPage />);

    await waitFor(() => {
      expect(screen.getByText('A Note For You')).toBeInTheDocument();
    });
    expect(screen.getByText('Hey Sarah, this is perfect for your agency.')).toBeInTheDocument();
  });

  it('renders DFY offer headline', async () => {
    render(<OfferPage />);

    await waitFor(() => {
      expect(screen.getByText(/Your ICP Sees You/)).toBeInTheDocument();
    });
  });

  it('renders urgency banner with spots remaining', async () => {
    render(<OfferPage />);

    await waitFor(() => {
      expect(screen.getByText(/3 spots remaining/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Your system will be live in 10 days/)).toBeInTheDocument();
  });

  it('renders CTA links to Stripe when payment URL exists', async () => {
    render(<OfferPage />);

    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: /Build My System/i });
      expect(links.length).toBeGreaterThan(0);
      expect(links[0]).toHaveAttribute('href', 'https://buy.stripe.com/test123');
    });
  });

  it('renders Coming Soon when no payment URL', async () => {
    vi.mocked(getBlueprintSettings).mockResolvedValue({
      ...mockSettings,
      dfyOfferUrl: '',
    } as any);

    render(<OfferPage />);

    await waitFor(() => {
      const buttons = screen.getAllByText('Coming Soon');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('renders 404 when prospect not found', async () => {
    vi.mocked(getProspectBySlug).mockResolvedValue(null);

    render(<OfferPage />);

    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument();
    });
  });

  it('hides seller note when offerNote is empty', async () => {
    vi.mocked(getProspectBySlug).mockResolvedValue({
      ...mockProspect,
      offerNote: undefined,
    } as any);

    render(<OfferPage />);

    await waitFor(() => {
      expect(screen.getByText('Sarah')).toBeInTheDocument();
    });
    expect(screen.queryByText('A Note For You')).not.toBeInTheDocument();
  });
});
