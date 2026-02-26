import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils';
import ProfileRewriteCard from '../../../components/client-portal/ProfileRewriteCard';

const mockFetchAutomationOutput = vi.fn();
vi.mock('../../../services/dfy-service', async () => {
  const actual = await vi.importActual('../../../services/dfy-service');
  return {
    ...actual,
    fetchAutomationOutput: (...args: any[]) => mockFetchAutomationOutput(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchAutomationOutput.mockReset();
});

describe('ProfileRewriteCard', () => {
  it('renders headlines from object format (outcome_based, authority_based, hybrid)', async () => {
    mockFetchAutomationOutput.mockResolvedValue({
      output: {
        headlines: {
          outcome_based: 'Outcome headline text',
          authority_based: 'Authority headline text',
          hybrid: 'Hybrid headline text',
        },
        about_section: 'About section text',
        featured_suggestions: ['Suggestion 1'],
        banner_concept: 'Banner text',
      },
      completed_at: '2026-02-20T00:00:00Z',
    });

    render(<ProfileRewriteCard portalSlug="test-portal" />);

    expect(await screen.findByText('Outcome headline text')).toBeInTheDocument();
    expect(screen.getByText('Authority headline text')).toBeInTheDocument();
    expect(screen.getByText('Hybrid headline text')).toBeInTheDocument();
  });

  it('renders about section and featured suggestions', async () => {
    mockFetchAutomationOutput.mockResolvedValue({
      output: {
        headlines: {
          outcome_based: 'H1',
          authority_based: 'H2',
          hybrid: 'H3',
        },
        about_section: 'About text here',
        featured_suggestions: ['Suggestion A', 'Suggestion B'],
        banner_concept: 'Banner description',
      },
      completed_at: '2026-02-20T00:00:00Z',
    });

    render(<ProfileRewriteCard portalSlug="test-portal" />);

    expect(await screen.findByText('About text here')).toBeInTheDocument();
    expect(screen.getByText('Suggestion A')).toBeInTheDocument();
    expect(screen.getByText('Suggestion B')).toBeInTheDocument();
    expect(screen.getByText('Banner description')).toBeInTheDocument();
  });

  it('handles wrapped output format (output.rewrite)', async () => {
    mockFetchAutomationOutput.mockResolvedValue({
      output: {
        rewrite: {
          headlines: {
            outcome_based: 'Wrapped headline',
            authority_based: 'Auth',
            hybrid: 'Hyb',
          },
          about_section: 'Wrapped about',
          featured_suggestions: [],
          banner_concept: 'Wrapped banner',
        },
      },
      completed_at: '2026-02-20T00:00:00Z',
    });

    render(<ProfileRewriteCard portalSlug="test-portal" />);

    expect(await screen.findByText('Wrapped headline')).toBeInTheDocument();
  });

  it('returns null when output is empty', async () => {
    mockFetchAutomationOutput.mockResolvedValue({ output: null, completed_at: null });

    const { container } = render(<ProfileRewriteCard portalSlug="test-portal" />);

    await vi.waitFor(() => {
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('LinkedIn Profile Rewrite')).not.toBeInTheDocument();
  });
});
