import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DeliverableCard from '../../../components/portal/intro-offer/DeliverableCard';

// Mock ThemeContext
vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isDarkMode: false,
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
}));

describe('DeliverableCard', () => {
  describe('HeyReach invitation URL', () => {
    it('shows "Join Workspace" link with invitation URL when metadata.invitationUrl is present and status is delivered', () => {
      render(
        <DeliverableCard
          title="HeyReach Account"
          status="delivered"
          type="heyreach_account"
          metadata={{ invitationUrl: 'https://app.heyreach.io/invite/abc123' }}
          deliveredAt="2026-02-25T00:00:00Z"
        />
      );

      const link = screen.getByRole('link', { name: /Join Workspace/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://app.heyreach.io/invite/abc123');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('falls back to https://app.heyreach.io with "View" label when no invitation URL', () => {
      render(
        <DeliverableCard
          title="HeyReach Account"
          status="delivered"
          type="heyreach_account"
          metadata={{}}
          deliveredAt="2026-02-25T00:00:00Z"
        />
      );

      const link = screen.getByRole('link', { name: /View/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://app.heyreach.io');
    });

    it('shows no link when status is not delivered', () => {
      render(
        <DeliverableCard
          title="HeyReach Account"
          status="in_progress"
          type="heyreach_account"
          metadata={{ invitationUrl: 'https://app.heyreach.io/invite/abc123' }}
          deliveredAt={null}
        />
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('funnel type', () => {
    it('shows "View" link with funnel_url when delivered', () => {
      render(
        <DeliverableCard
          title="Opt-in Funnel"
          status="delivered"
          type="funnel"
          metadata={{ funnel_url: 'https://example.com/funnel' }}
          deliveredAt="2026-02-25T00:00:00Z"
        />
      );

      const link = screen.getByRole('link', { name: /View/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com/funnel');
    });
  });
});
