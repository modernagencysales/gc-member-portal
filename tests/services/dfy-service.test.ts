/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabaseClient';

// Mock supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Import after mock so the module picks up the mock
import {
  approveDeliverable,
  getEngagementBySlug,
  getDeliverables,
  getActivityLog,
} from '../../services/dfy-service';

// ── Helpers ─────────────────────────────────────────────

/**
 * Creates a mock supabase query chain.
 * For single-record queries, terminates at single().
 * For list queries, the chain is thenable after order()/limit().
 */
function mockSupabaseChain(data: any, error: any = null) {
  const chain: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };

  const makeThenable = (obj: any) => {
    obj.then = (onFulfilled: any, onRejected?: any) =>
      Promise.resolve({
        data: Array.isArray(data) ? data : data ? [data] : data,
        error,
      }).then(onFulfilled, onRejected);
    return obj;
  };

  // limit() returns a thenable chain for list queries
  chain.limit.mockImplementation(() => {
    const result = { ...chain };
    return makeThenable(result);
  });

  // order() returns a thenable chain for list queries
  chain.order.mockImplementation(() => {
    const result = { ...chain };
    result.limit = vi.fn().mockImplementation(() => {
      const limited = { ...chain };
      return makeThenable(limited);
    });
    return makeThenable(result);
  });

  return chain;
}

// ── Fixtures ────────────────────────────────────────────

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

// ── Tests ───────────────────────────────────────────────

describe('dfy-service', () => {
  // ── approveDeliverable ──────────────────────────────
  describe('approveDeliverable', () => {
    it('sends correct POST request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await approveDeliverable('del-001', 'my-portal', 'Looks good!');

      expect(mockFetch).toHaveBeenCalledOnce();

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/dfy/deliverables/del-001/approve');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body.portal_slug).toBe('my-portal');
      expect(body.notes).toBe('Looks good!');
    });

    it('sends request without notes when notes is undefined', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await approveDeliverable('del-001', 'my-portal');

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.portal_slug).toBe('my-portal');
      expect(body.notes).toBeUndefined();
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Deliverable not found' }),
      });

      await expect(approveDeliverable('del-999', 'my-portal')).rejects.toThrow(
        'Deliverable not found'
      );
    });

    it('throws fallback message when JSON parsing fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.reject(new Error('parse error')),
      });

      // When res.json() rejects, the .catch() provides { error: 'Approval failed' }
      await expect(approveDeliverable('del-999', 'my-portal')).rejects.toThrow('Approval failed');
    });
  });

  // ── getEngagementBySlug ─────────────────────────────
  describe('getEngagementBySlug', () => {
    it('returns engagement data on success', async () => {
      const engagementData = {
        id: 'eng-001',
        proposal_id: 'prop-001',
        client_name: 'Test Client',
        client_email: 'test@example.com',
        client_company: 'Acme',
        portal_slug: 'acme-portal',
        status: 'active',
        monthly_rate: 5000,
        start_date: '2026-02-01',
        created_at: '2026-01-15T00:00:00Z',
      };

      const chain = mockSupabaseChain(engagementData);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getEngagementBySlug('acme-portal');

      expect(supabase.from).toHaveBeenCalledWith('dfy_engagements');
      expect(chain.eq).toHaveBeenCalledWith('portal_slug', 'acme-portal');
      expect(chain.single).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('eng-001');
      expect(result!.client_name).toBe('Test Client');
      expect(result!.portal_slug).toBe('acme-portal');
    });

    it('returns null on error', async () => {
      const chain = mockSupabaseChain(null, { message: 'Not found' });
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getEngagementBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null when data is null without error', async () => {
      const chain = mockSupabaseChain(null);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getEngagementBySlug('missing');

      expect(result).toBeNull();
    });
  });

  // ── getDeliverables ─────────────────────────────────
  describe('getDeliverables', () => {
    it('returns array of deliverables on success', async () => {
      const deliverables = [
        {
          id: 'del-001',
          engagement_id: 'eng-001',
          name: 'Profile Optimization',
          description: 'Optimize LinkedIn profile',
          category: 'content',
          status: 'pending',
          assignee: 'Alice',
          due_date: '2026-03-01',
          sort_order: 1,
          client_approved_at: null,
          client_notes: null,
          automation_type: 'profile_rewrite',
          created_at: '2026-02-01T00:00:00Z',
        },
        {
          id: 'del-002',
          engagement_id: 'eng-001',
          name: 'Lead Magnet Setup',
          description: 'Create lead magnet funnel',
          category: 'funnel',
          status: 'in_progress',
          assignee: 'Bob',
          due_date: '2026-03-15',
          sort_order: 2,
          client_approved_at: null,
          client_notes: null,
          automation_type: null,
          created_at: '2026-02-01T00:00:00Z',
        },
      ];

      const chain = mockSupabaseChain(deliverables);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getDeliverables('eng-001');

      expect(supabase.from).toHaveBeenCalledWith('dfy_deliverables');
      expect(chain.eq).toHaveBeenCalledWith('engagement_id', 'eng-001');
      expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Profile Optimization');
      expect(result[1].name).toBe('Lead Magnet Setup');
    });

    it('returns empty array on error', async () => {
      const chain = mockSupabaseChain(null, { message: 'DB error' });
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getDeliverables('eng-001');

      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      const chain = mockSupabaseChain(null);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getDeliverables('eng-001');

      expect(result).toEqual([]);
    });

    it('includes automation_type in returned deliverables', async () => {
      const deliverables = [
        {
          id: 'del-001',
          engagement_id: 'eng-001',
          name: 'Profile Rewrite',
          description: 'AI profile rewrite',
          category: 'onboarding',
          status: 'review',
          assignee: 'Alice',
          due_date: '2026-03-01',
          sort_order: 1,
          client_approved_at: null,
          client_notes: null,
          automation_type: 'profile_rewrite',
          created_at: '2026-02-01T00:00:00Z',
        },
      ];

      const chain = mockSupabaseChain(deliverables);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getDeliverables('eng-001');

      expect(result[0].automation_type).toBe('profile_rewrite');
    });
  });

  // ── getActivityLog ──────────────────────────────────
  describe('getActivityLog', () => {
    it('returns array of activity entries on success', async () => {
      const entries = [
        {
          id: 'act-001',
          engagement_id: 'eng-001',
          deliverable_id: 'del-001',
          action: 'status_change',
          description: 'Status changed to in_progress',
          actor: 'Alice',
          metadata: {},
          created_at: '2026-02-10T12:00:00Z',
        },
      ];

      const chain = mockSupabaseChain(entries);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getActivityLog('eng-001');

      expect(supabase.from).toHaveBeenCalledWith('dfy_activity_log');
      expect(chain.eq).toHaveBeenCalledWith('engagement_id', 'eng-001');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('status_change');
      expect(result[0].actor).toBe('Alice');
    });

    it('returns empty array on error', async () => {
      const chain = mockSupabaseChain(null, { message: 'DB error' });
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getActivityLog('eng-001');

      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      const chain = mockSupabaseChain(null);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await getActivityLog('eng-001');

      expect(result).toEqual([]);
    });
  });
});
