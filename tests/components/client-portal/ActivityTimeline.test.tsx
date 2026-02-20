import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils';
import ActivityTimeline from '../../../components/client-portal/ActivityTimeline';
import type { DfyActivityEntry } from '../../../services/dfy-service';

// ── Fixtures ────────────────────────────────────────────

function makeEntry(overrides: Partial<DfyActivityEntry> = {}): DfyActivityEntry {
  return {
    id: 'act-001',
    engagement_id: 'eng-001',
    deliverable_id: 'del-001',
    action: 'status_change',
    description: 'Status changed from pending to in_progress',
    actor: 'Alice',
    metadata: {},
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────

describe('ActivityTimeline', () => {
  it('renders "No activity yet" when entries is empty', () => {
    render(<ActivityTimeline entries={[]} />);

    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('renders entries with actor name and description', () => {
    const entries = [
      makeEntry({ id: 'act-001', actor: 'Alice', description: 'Moved to in_progress' }),
      makeEntry({ id: 'act-002', actor: 'Bob', description: 'Added a note about strategy' }),
    ];

    render(<ActivityTimeline entries={entries} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Moved to in_progress')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Added a note about strategy')).toBeInTheDocument();
  });

  it('shows correct action icon for status_change', () => {
    const entries = [makeEntry({ action: 'status_change' })];

    render(<ActivityTimeline entries={entries} />);

    // status_change icon is the right arrow: \u2192
    const iconSpan = screen.getByTitle('status_change');
    expect(iconSpan.textContent).toBe('\u2192');
  });

  it('shows correct action icon for client_approved', () => {
    const entries = [
      makeEntry({
        id: 'act-002',
        action: 'client_approved',
        actor: 'Client',
        description: 'Approved the deliverable',
      }),
    ];

    render(<ActivityTimeline entries={entries} />);

    // client_approved icon is the check mark: \u2713
    const iconSpan = screen.getByTitle('client_approved');
    expect(iconSpan.textContent).toBe('\u2713');
  });

  it('shows relative timestamp', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const entries = [makeEntry({ created_at: fiveMinutesAgo })];

    render(<ActivityTimeline entries={entries} />);

    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
  });

  it('shows "just now" for very recent entries', () => {
    const justNow = new Date(Date.now() - 10 * 1000).toISOString(); // 10 seconds ago
    const entries = [makeEntry({ created_at: justNow })];

    render(<ActivityTimeline entries={entries} />);

    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('shows singular "minute" for 1 minute ago', () => {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const entries = [makeEntry({ created_at: oneMinuteAgo })];

    render(<ActivityTimeline entries={entries} />);

    expect(screen.getByText('1 minute ago')).toBeInTheDocument();
  });

  it('shows hours for entries from hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const entries = [makeEntry({ created_at: threeHoursAgo })];

    render(<ActivityTimeline entries={entries} />);

    expect(screen.getByText('3 hours ago')).toBeInTheDocument();
  });

  it('shows days for entries from days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const entries = [makeEntry({ created_at: twoDaysAgo })];

    render(<ActivityTimeline entries={entries} />);

    expect(screen.getByText('2 days ago')).toBeInTheDocument();
  });

  it('shows default bullet icon for unknown actions', () => {
    const entries = [makeEntry({ action: 'unknown_action' })];

    render(<ActivityTimeline entries={entries} />);

    const iconSpan = screen.getByTitle('unknown_action');
    expect(iconSpan.textContent).toBe('\u2022');
  });
});
