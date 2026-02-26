/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import DeliverableCard from '../../../components/client-portal/DeliverableCard';
import type { DfyDeliverable } from '../../../services/dfy-service';

// Mock approveDeliverable from dfy-service
const mockApproveDeliverable = vi.fn();
vi.mock('../../../services/dfy-service', async () => {
  const actual = await vi.importActual('../../../services/dfy-service');
  return {
    ...actual,
    approveDeliverable: (...args: any[]) => mockApproveDeliverable(...args),
  };
});

// ── Fixtures ────────────────────────────────────────────

function makeDeliverable(overrides: Partial<DfyDeliverable> = {}): DfyDeliverable {
  return {
    id: 'del-001',
    engagement_id: 'eng-001',
    name: 'LinkedIn Profile Optimization',
    description: 'Full rewrite of headline, about, and experience sections.',
    category: 'content',
    status: 'pending',
    assignee: 'Alice',
    due_date: '2026-03-15T00:00:00Z',
    sort_order: 1,
    client_approved_at: null,
    client_notes: null,
    automation_type: null,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockApproveDeliverable.mockReset();
});

describe('DeliverableCard', () => {
  it('renders deliverable name, description, and status badge', () => {
    render(<DeliverableCard deliverable={makeDeliverable()} />);

    expect(screen.getByText('LinkedIn Profile Optimization')).toBeInTheDocument();
    expect(
      screen.getByText('Full rewrite of headline, about, and experience sections.')
    ).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows category label and due date', () => {
    render(<DeliverableCard deliverable={makeDeliverable()} />);

    expect(screen.getByText('Content')).toBeInTheDocument();
    // Due date rendering is timezone-dependent; match the "Due" prefix with any short date
    expect(screen.getByText(/Due\s+Mar\s+\d{1,2}/)).toBeInTheDocument();
  });

  it('shows "Approved" date when client_approved_at is set', () => {
    render(
      <DeliverableCard
        deliverable={makeDeliverable({
          client_approved_at: '2026-02-10T12:00:00Z',
          status: 'approved',
        })}
      />
    );

    expect(screen.getByText(/Approved Feb 10/)).toBeInTheDocument();
  });

  it('shows "Review & Approve" button when status is review and portalSlug is provided', () => {
    render(
      <DeliverableCard
        deliverable={makeDeliverable({ status: 'review' })}
        portalSlug="test-portal"
      />
    );

    expect(screen.getByText('Review & Approve')).toBeInTheDocument();
  });

  it('does NOT show approval button when status is not review', () => {
    render(
      <DeliverableCard
        deliverable={makeDeliverable({ status: 'in_progress' })}
        portalSlug="test-portal"
      />
    );

    expect(screen.queryByText('Review & Approve')).not.toBeInTheDocument();
  });

  it('does NOT show approval button when portalSlug is not provided', () => {
    render(<DeliverableCard deliverable={makeDeliverable({ status: 'review' })} />);

    expect(screen.queryByText('Review & Approve')).not.toBeInTheDocument();
  });

  it('clicking "Review & Approve" shows textarea and approve/cancel buttons', async () => {
    const user = userEvent.setup();

    render(
      <DeliverableCard
        deliverable={makeDeliverable({ status: 'review' })}
        portalSlug="test-portal"
      />
    );

    await user.click(screen.getByText('Review & Approve'));

    expect(screen.getByPlaceholderText('Optional feedback or notes...')).toBeInTheDocument();
    expect(screen.getByText('Approve Deliverable')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('clicking "Cancel" hides the approval section', async () => {
    const user = userEvent.setup();

    render(
      <DeliverableCard
        deliverable={makeDeliverable({ status: 'review' })}
        portalSlug="test-portal"
      />
    );

    // Open approval section
    await user.click(screen.getByText('Review & Approve'));
    expect(screen.getByText('Approve Deliverable')).toBeInTheDocument();

    // Cancel
    await user.click(screen.getByText('Cancel'));

    // Should hide textarea and buttons, show "Review & Approve" again
    expect(screen.queryByText('Approve Deliverable')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Optional feedback or notes...')).not.toBeInTheDocument();
    expect(screen.getByText('Review & Approve')).toBeInTheDocument();
  });

  it('calls approveDeliverable on approve click', async () => {
    const user = userEvent.setup();
    const onApproved = vi.fn();
    mockApproveDeliverable.mockResolvedValue(undefined);

    render(
      <DeliverableCard
        deliverable={makeDeliverable({ status: 'review' })}
        portalSlug="test-portal"
        onApproved={onApproved}
      />
    );

    // Open approval section
    await user.click(screen.getByText('Review & Approve'));

    // Type notes
    await user.type(screen.getByPlaceholderText('Optional feedback or notes...'), 'Looks great!');

    // Click approve
    await user.click(screen.getByText('Approve Deliverable'));

    expect(mockApproveDeliverable).toHaveBeenCalledWith('del-001', 'test-portal', 'Looks great!');
    expect(onApproved).toHaveBeenCalledOnce();
  });

  it('shows error message when approval fails', async () => {
    const user = userEvent.setup();
    mockApproveDeliverable.mockRejectedValue(new Error('Network error'));

    render(
      <DeliverableCard
        deliverable={makeDeliverable({ status: 'review' })}
        portalSlug="test-portal"
      />
    );

    // Open approval section
    await user.click(screen.getByText('Review & Approve'));

    // Click approve
    await user.click(screen.getByText('Approve Deliverable'));

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  it('shows success message after approval', async () => {
    const user = userEvent.setup();
    mockApproveDeliverable.mockResolvedValue(undefined);

    render(
      <DeliverableCard
        deliverable={makeDeliverable({ status: 'review' })}
        portalSlug="test-portal"
      />
    );

    // Open approval section and approve
    await user.click(screen.getByText('Review & Approve'));
    await user.click(screen.getByText('Approve Deliverable'));

    expect(await screen.findByText('Approved successfully')).toBeInTheDocument();
    // Approval form should be gone
    expect(screen.queryByText('Approve Deliverable')).not.toBeInTheDocument();
  });

  it('renders correct status badges for each status', () => {
    const statuses = [
      { status: 'pending', label: 'Pending' },
      { status: 'in_progress', label: 'In Progress' },
      { status: 'review', label: 'Ready for Review' },
      { status: 'approved', label: 'Approved' },
      { status: 'completed', label: 'Completed' },
    ];

    for (const { status, label } of statuses) {
      const { unmount } = render(<DeliverableCard deliverable={makeDeliverable({ status })} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('renders correct category labels', () => {
    const categories = [
      { category: 'onboarding', label: 'Onboarding' },
      { category: 'content', label: 'Content' },
      { category: 'funnel', label: 'Lead Magnet & Funnel' },
      { category: 'outbound', label: 'Outbound & DMs' },
    ];

    for (const { category, label } of categories) {
      const { unmount } = render(<DeliverableCard deliverable={makeDeliverable({ category })} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
