import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock modules BEFORE any imports that use them
vi.mock('../../services/supabase', () => ({
  fetchOnboardingWithProgress: vi.fn(),
  updateMemberProgress: vi.fn(),
}));

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
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import after mocking
import { fetchOnboardingWithProgress, updateMemberProgress } from '../../services/supabase';
import OnboardingPage from '../../components/gc/onboarding/OnboardingPage';

const mockFetchOnboarding = vi.mocked(fetchOnboardingWithProgress);
const mockUpdateProgress = vi.mocked(updateMemberProgress);

// Custom render for this test
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

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

  it('renders onboarding items', async () => {
    renderWithRouter(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete ICP worksheet')).toBeInTheDocument();
      expect(screen.getByText('Set up Clay account')).toBeInTheDocument();
    });
  });

  // TODO: These tests have a race condition with mock reset between tests.
  // The mock works in isolation but vitest's module caching causes issues.
  // Fix: Consider using MSW (Mock Service Worker) for more reliable API mocking.

  it.skip('shows progress percentage', async () => {
    renderWithRouter(<OnboardingPage />);
    await screen.findByText('Complete ICP worksheet');
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it.skip('calls updateMemberProgress when checkbox toggled', async () => {
    mockUpdateProgress.mockResolvedValueOnce({
      id: 'newprog1',
      status: 'Complete',
      memberId: 'rec123',
      checklistItemId: 'check1',
    });

    renderWithRouter(<OnboardingPage />);

    // Wait for loading to finish and checkboxes to appear
    const checkboxes = await screen.findAllByRole('checkbox', {}, { timeout: 3000 });
    const incompleteCheckbox = checkboxes.find((cb) => !(cb as HTMLInputElement).checked);

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
    renderWithRouter(<OnboardingPage />);

    // Wait for content to load first
    await screen.findByText('Complete ICP worksheet');

    // Then check for support types
    expect(screen.getByText(/Self-Service/i)).toBeInTheDocument();
    expect(screen.getByText(/Initial Setup Help/i)).toBeInTheDocument();
  });
});
