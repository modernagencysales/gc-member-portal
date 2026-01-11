import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';

// Mock the gc-airtable service
vi.mock('../../services/gc-airtable', () => ({
  fetchOnboardingWithProgress: vi.fn(),
  updateMemberProgress: vi.fn(),
}));

import { fetchOnboardingWithProgress, updateMemberProgress } from '../../services/gc-airtable';

const mockFetchOnboarding = vi.mocked(fetchOnboardingWithProgress);
const mockUpdateProgress = vi.mocked(updateMemberProgress);

// Import after mocking
import OnboardingPage from '../../components/gc/onboarding/OnboardingPage';

// Mock the AuthContext to provide a test member
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    gcMember: {
      id: 'rec123',
      email: 'test@example.com',
      name: 'Test User',
      plan: 'Full ($1000/mo)',
      status: 'Active',
    },
    isAuthenticated: true,
    mode: 'gc',
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Onboarding Checkbox Toggle', () => {
  const mockCategories = [
    {
      name: 'Week 1' as const,
      items: [
        {
          id: 'check1',
          item: 'Complete ICP worksheet',
          category: 'Week 1' as const,
          supportType: 'Self-Service' as const,
          order: 1,
          planRequired: 'All Plans' as const,
          progressId: undefined,
          progressStatus: 'Not Started' as const,
        },
        {
          id: 'check2',
          item: 'Set up Clay account',
          category: 'Week 1' as const,
          supportType: 'Initial Setup Help' as const,
          order: 2,
          planRequired: 'Full Only' as const,
          progressId: 'prog2',
          progressStatus: 'Complete' as const,
        },
      ],
      completedCount: 1,
      totalCount: 2,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchOnboarding.mockResolvedValue({
      categories: mockCategories,
      totalProgress: 50,
    });
  });

  it.skip('renders onboarding items', async () => {
    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete ICP worksheet')).toBeInTheDocument();
      expect(screen.getByText('Set up Clay account')).toBeInTheDocument();
    });
  });

  it.skip('shows progress percentage', async () => {
    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });

  it.skip('calls updateMemberProgress when checkbox toggled', async () => {
    mockUpdateProgress.mockResolvedValueOnce({
      id: 'newprog1',
      status: 'Complete',
      memberId: 'rec123',
      checklistItemId: 'check1',
    });

    render(<OnboardingPage />);

    // Wait for loading to finish and checkboxes to appear
    const checkboxes = await screen.findAllByRole('checkbox', {}, { timeout: 3000 });
    const incompleteCheckbox = checkboxes.find(
      (cb) => !(cb as HTMLInputElement).checked
    );

    if (incompleteCheckbox) {
      await userEvent.click(incompleteCheckbox);

      await waitFor(() => {
        expect(mockUpdateProgress).toHaveBeenCalledWith(
          undefined,
          'rec123',
          'check1',
          'Complete',
          undefined
        );
      });
    }
  });

  it.skip('displays different support types correctly', async () => {
    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Self-Service/i)).toBeInTheDocument();
      expect(screen.getByText(/Initial Setup Help/i)).toBeInTheDocument();
    });
  });
});
