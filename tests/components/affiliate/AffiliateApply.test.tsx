import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import AffiliateApply from '../../../components/affiliate/AffiliateApply';

vi.mock('../../../services/affiliate-supabase', () => ({
  submitAffiliateApplication: vi.fn(),
  fetchAffiliateByEmail: vi.fn(),
}));

vi.mock('../../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../../context/AuthContext');
  return {
    ...actual,
    useBootcampUser: vi.fn(() => null),
  };
});

import {
  submitAffiliateApplication,
  fetchAffiliateByEmail,
} from '../../../services/affiliate-supabase';

const mockSubmit = submitAffiliateApplication as ReturnType<typeof vi.fn>;
const mockFetchByEmail = fetchAffiliateByEmail as ReturnType<typeof vi.fn>;

describe('AffiliateApply', () => {
  beforeEach(() => {
    mockSubmit.mockReset();
    mockFetchByEmail.mockReset();
    mockFetchByEmail.mockResolvedValue(null);
  });

  it('renders the application form with all fields', () => {
    render(<AffiliateApply />);

    expect(screen.getByText('Become an Affiliate')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Acme Inc.')).toBeInTheDocument();
    expect(screen.getByText('Short Bio')).toBeInTheDocument();
    expect(screen.getByText(/how will you promote/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
  });

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<AffiliateApply />);

    const submitButton = screen.getByRole('button', { name: /submit application/i });

    // The button should be disabled when name and email are empty
    expect(submitButton).toBeDisabled();

    // Try clicking anyway -- the form should not submit
    await user.click(submitButton);

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits application successfully and shows success message', async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue({
      id: 'aff-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'active',
    });

    render(<AffiliateApply />);

    await user.type(screen.getByPlaceholderText('John Smith'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('you@company.com'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Acme Inc.'), 'Acme Inc');
    await user.type(screen.getByPlaceholderText(/a brief intro about you/i), 'Growth marketer');
    await user.type(screen.getByPlaceholderText(/linkedin posts, email list/i), 'LinkedIn posts');

    const submitButton = screen.getByRole('button', { name: /submit application/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("You're In!")).toBeInTheDocument();
    });

    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme Inc',
      bio: 'Growth marketer',
      applicationNote: 'LinkedIn posts',
      bootcampStudentId: undefined,
    });
  });

  it('shows error when duplicate email is detected', async () => {
    const user = userEvent.setup();
    mockFetchByEmail.mockResolvedValue({
      id: 'aff-existing',
      email: 'existing@example.com',
      name: 'Existing User',
      status: 'active',
    });

    render(<AffiliateApply />);

    await user.type(screen.getByPlaceholderText('John Smith'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@company.com'), 'existing@example.com');

    // Wait for the debounced email check to fire (500ms delay in component)
    await waitFor(
      () => {
        expect(screen.getByText(/you already have an affiliate account/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Submit button should be disabled when already applied
    const submitButton = screen.getByRole('button', { name: /submit application/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows error message on submission failure', async () => {
    const user = userEvent.setup();
    mockSubmit.mockRejectedValue(new Error('Database connection failed'));

    render(<AffiliateApply />);

    await user.type(screen.getByPlaceholderText('John Smith'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('you@company.com'), 'jane@example.com');

    const submitButton = screen.getByRole('button', { name: /submit application/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });
  });
});
