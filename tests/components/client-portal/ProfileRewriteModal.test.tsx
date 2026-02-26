import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import ProfileRewriteModal from '../../../components/client-portal/ProfileRewriteModal';

const mockOutput = {
  headlines: {
    outcome_based: 'I help B2B founders generate pipeline from LinkedIn',
    authority_based: 'Former HubSpot exec turned LinkedIn strategist',
    hybrid: 'HubSpot alumni helping B2B founders win on LinkedIn',
  },
  about_section: 'Full about section text here with multiple paragraphs.',
  featured_suggestions: [
    'Case study: How we helped X achieve Y',
    'Free guide: LinkedIn content playbook',
  ],
  banner_concept: 'Dark gradient banner with bold white text and headshot.',
};

describe('ProfileRewriteModal', () => {
  it('renders all three headline variants with labels', () => {
    render(<ProfileRewriteModal output={mockOutput} onClose={vi.fn()} />);

    expect(screen.getByText('Outcome-Based')).toBeInTheDocument();
    expect(screen.getByText(mockOutput.headlines.outcome_based)).toBeInTheDocument();
    expect(screen.getByText('Authority-Based')).toBeInTheDocument();
    expect(screen.getByText(mockOutput.headlines.authority_based)).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
    expect(screen.getByText(mockOutput.headlines.hybrid)).toBeInTheDocument();
  });

  it('renders about section', () => {
    render(<ProfileRewriteModal output={mockOutput} onClose={vi.fn()} />);

    expect(screen.getByText('About Section')).toBeInTheDocument();
    expect(screen.getByText(mockOutput.about_section)).toBeInTheDocument();
  });

  it('renders featured suggestions', () => {
    render(<ProfileRewriteModal output={mockOutput} onClose={vi.fn()} />);

    expect(screen.getByText('Featured Section Suggestions')).toBeInTheDocument();
    for (const suggestion of mockOutput.featured_suggestions) {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    }
  });

  it('renders banner concept', () => {
    render(<ProfileRewriteModal output={mockOutput} onClose={vi.fn()} />);

    expect(screen.getByText('Banner Concept')).toBeInTheDocument();
    expect(screen.getByText(mockOutput.banner_concept)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<ProfileRewriteModal output={mockOutput} onClose={onClose} />);

    await user.click(screen.getByLabelText('Close modal'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<ProfileRewriteModal output={mockOutput} onClose={onClose} />);

    await user.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<ProfileRewriteModal output={mockOutput} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('handles wrapped output_data format (output.rewrite)', () => {
    const wrappedOutput = { rewrite: mockOutput };
    render(<ProfileRewriteModal output={wrappedOutput as any} onClose={vi.fn()} />);

    expect(screen.getByText(mockOutput.headlines.outcome_based)).toBeInTheDocument();
  });
});
