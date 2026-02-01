import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chain builder — each method returns itself for chaining, with terminal methods resolving
function createMockChain(resolvedValue: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit', 'single'];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  // Terminal: single resolves the value
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  // select with count support
  chain.select = vi.fn(() => chain);
  // Make the chain thenable for non-single queries
  (chain as any).then = (resolve: (v: unknown) => void) => resolve(resolvedValue);
  return chain;
}

const mockFrom = vi.fn();

vi.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  createTamProject,
  fetchTamProject,
  fetchTamProjectsByUser,
  updateTamProject,
  fetchTamCompanies,
  insertTamCompanies,
  fetchTamContacts,
  fetchTamJobs,
  createTamJob,
  updateTamJob,
  fetchTamProjectStats,
} from '../../../services/tam-supabase';

describe('tam-supabase service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTamProject', () => {
    it('inserts a project and returns mapped result', async () => {
      const dbRow = {
        id: 'proj-1',
        user_id: 'user-1',
        name: 'Test Project',
        status: 'draft',
        icp_profile: { businessModel: 'b2b_saas', seedCompanyDomains: ['stripe.com'] },
        sourcing_strategy: null,
        created_at: '2026-01-31T00:00:00Z',
        updated_at: '2026-01-31T00:00:00Z',
      };

      const chain = createMockChain({ data: dbRow, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await createTamProject({
        userId: 'user-1',
        name: 'Test Project',
        icpProfile: {
          businessModel: 'b2b_saas',
          whatYouSell: 'CRM',
          employeeSizeRanges: ['11-50'],
          geography: 'us_only',
          usEmployeeFilter: false,
          industryKeywords: [],
          targetTitles: [],
          seniorityPreference: [],
          contactsPerCompany: 1,
          seedCompanyDomains: ['stripe.com'],
        },
      });

      expect(mockFrom).toHaveBeenCalledWith('tam_projects');
      expect(result.id).toBe('proj-1');
      expect(result.userId).toBe('user-1');
      expect(result.status).toBe('draft');
    });

    it('throws on error', async () => {
      const chain = createMockChain({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(chain);

      await expect(
        createTamProject({
          userId: 'user-1',
          name: 'Test',
          icpProfile: {
            businessModel: 'b2b_saas',
            whatYouSell: 'x',
            employeeSizeRanges: [],
            geography: 'global',
            usEmployeeFilter: false,
            industryKeywords: [],
            targetTitles: [],
            seniorityPreference: [],
            contactsPerCompany: 1,
          },
        })
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('fetchTamProject', () => {
    it('returns null when not found', async () => {
      const chain = createMockChain({ data: null, error: { message: 'Not found' } });
      mockFrom.mockReturnValue(chain);

      const result = await fetchTamProject('nonexistent');
      expect(result).toBeNull();
    });

    it('returns mapped project when found', async () => {
      const dbRow = {
        id: 'proj-1',
        user_id: 'user-1',
        name: 'Found Project',
        status: 'sourcing',
        icp_profile: null,
        sourcing_strategy: null,
        created_at: '2026-01-31',
        updated_at: '2026-01-31',
      };
      const chain = createMockChain({ data: dbRow, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchTamProject('proj-1');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Found Project');
      expect(result!.status).toBe('sourcing');
    });
  });

  describe('fetchTamProjectsByUser', () => {
    it('calls from tam_projects with user_id filter', async () => {
      const chain = createMockChain({ data: [], error: null });
      // Override then for array result
      (chain as any).then = (resolve: (v: unknown) => void) => resolve({ data: [], error: null });
      chain.order = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchTamProjectsByUser('user-1');
      expect(mockFrom).toHaveBeenCalledWith('tam_projects');
      expect(result).toEqual([]);
    });
  });

  describe('createTamJob', () => {
    it('creates a job with discolike source config', async () => {
      const dbRow = {
        id: 'job-1',
        project_id: 'proj-1',
        job_type: 'source_companies',
        status: 'pending',
        config: { source: 'discolike' },
        progress: 0,
        result_summary: null,
        created_at: '2026-01-31',
        completed_at: null,
      };
      const chain = createMockChain({ data: dbRow, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await createTamJob({
        projectId: 'proj-1',
        jobType: 'source_companies',
        config: { source: 'discolike' },
      });

      expect(result.jobType).toBe('source_companies');
      expect(result.config).toEqual({ source: 'discolike' });
      expect(result.status).toBe('pending');
    });
  });

  describe('updateTamJob', () => {
    it('updates job status and progress', async () => {
      const dbRow = {
        id: 'job-1',
        project_id: 'proj-1',
        job_type: 'source_companies',
        status: 'completed',
        config: { source: 'discolike' },
        progress: 100,
        result_summary: { companiesFound: 250, source: 'discolike' },
        created_at: '2026-01-31',
        completed_at: '2026-01-31T01:00:00Z',
      };
      const chain = createMockChain({ data: dbRow, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await updateTamJob('job-1', {
        status: 'completed',
        progress: 100,
        resultSummary: { companiesFound: 250, source: 'discolike' },
      });

      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
    });
  });
});
