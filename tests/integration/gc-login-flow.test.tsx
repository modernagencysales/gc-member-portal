import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';

// Mock the gc-airtable service
vi.mock('../../services/gc-airtable', () => ({
  verifyGCMember: vi.fn(),
}));

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    gcMember: null,
    isAuthenticated: false,
    mode: null,
    loginGC: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import GCLogin from '../../components/gc/GCLogin';

import { verifyGCMember } from '../../services/gc-airtable';

const mockVerifyGCMember = vi.mocked(verifyGCMember);

describe('GC Login Flow', () => {
  beforeEach(() => {
    mockVerifyGCMember.mockReset();
  });

  it('renders login form', () => {
    render(<GCLogin />);

    expect(screen.getByPlaceholderText(/you@company.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('shows error for invalid email', async () => {
    mockVerifyGCMember.mockResolvedValueOnce(null);

    render(<GCLogin />);

    const emailInput = screen.getByPlaceholderText(/you@company.com/i);
    const submitButton = screen.getByRole('button', { name: /continue/i });

    await userEvent.type(emailInput, 'invalid@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  it.skip('calls verifyGCMember with normalized email', async () => {
    mockVerifyGCMember.mockResolvedValueOnce(null);

    render(<GCLogin />);

    const emailInput = screen.getByPlaceholderText(/you@company.com/i);
    const submitButton = screen.getByRole('button', { name: /continue/i });

    await userEvent.type(emailInput, '  TEST@EXAMPLE.COM  ');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockVerifyGCMember).toHaveBeenCalledWith('test@example.com');
    });
  });

  it.skip('shows loading state during verification', async () => {
    mockVerifyGCMember.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    render(<GCLogin />);

    const emailInput = screen.getByPlaceholderText(/you@company.com/i);
    const submitButton = screen.getByRole('button', { name: /continue/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});
