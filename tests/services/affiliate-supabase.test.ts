/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabaseClient';
import {
  fetchAffiliateBySlug,
  fetchAffiliateByCode,
  fetchAffiliateByEmail,
  submitAffiliateApplication,
  fetchAllAffiliates,
  updateAffiliateStatus,
  fetchAffiliateAssets,
} from '../../services/affiliate-supabase';

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const sampleAffiliateRecord = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test Affiliate',
  company: 'Test Corp',
  slug: 'test-affiliate',
  code: 'ABC123',
  status: 'active',
  commission_amount: 500,
  stripe_connect_account_id: null,
  stripe_connect_onboarded: false,
  bootcamp_student_id: null,
  photo_url: null,
  bio: 'Test bio',
  application_note: null,
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

const sampleAssetRecord = {
  id: 'asset-001',
  title: 'Swipe Copy Template',
  description: 'A ready-to-use email template',
  asset_type: 'swipe_copy',
  content_text: 'Hey {name}, check this out...',
  file_url: null,
  sort_order: 1,
  is_visible: true,
  created_at: '2026-01-15T00:00:00Z',
};

/**
 * Creates a mock chain that simulates supabase query builder.
 * The chain terminates at single() or maybeSingle() for single-record queries,
 * or resolves the promise for list queries via order().
 */
function mockSupabaseChain(data: any, error: any = null) {
  const chain: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };

  // For queries that end at order() and are awaited directly (list queries),
  // make the chain thenable so it resolves as a promise.
  const makeThenable = (obj: any) => {
    obj.then = (onFulfilled: any, onRejected?: any) =>
      Promise.resolve({
        data: Array.isArray(data) ? data : [data],
        error,
      }).then(onFulfilled, onRejected);
    return obj;
  };

  // order() returns a thenable chain for list queries
  chain.order.mockImplementation(() => {
    const result = { ...chain };
    return makeThenable(result);
  });

  // eq() after order() should also be thenable for chained list queries
  chain.eq.mockImplementation(() => {
    const result = { ...chain };
    return makeThenable(result);
  });

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('affiliate-supabase service', () => {
  describe('fetchAffiliateBySlug', () => {
    it('returns mapped affiliate on success', async () => {
      const chain = mockSupabaseChain(sampleAffiliateRecord);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateBySlug('test-affiliate');

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('slug', 'test-affiliate');
      expect(chain.eq).toHaveBeenCalledWith('status', 'active');
      expect(chain.single).toHaveBeenCalled();

      expect(result).not.toBeNull();
      expect(result!.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result!.email).toBe('test@example.com');
      expect(result!.name).toBe('Test Affiliate');
      expect(result!.slug).toBe('test-affiliate');
      expect(result!.code).toBe('ABC123');
      expect(result!.status).toBe('active');
      expect(result!.commissionAmount).toBe(500);
      expect(result!.bio).toBe('Test bio');
      expect(result!.createdAt).toBeInstanceOf(Date);
    });

    it('returns null on error', async () => {
      const chain = mockSupabaseChain(null, { message: 'Not found' });
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null when data is null', async () => {
      const chain = mockSupabaseChain(null);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateBySlug('missing');

      expect(result).toBeNull();
    });
  });

  describe('fetchAffiliateByCode', () => {
    it('returns mapped affiliate on success', async () => {
      const chain = mockSupabaseChain(sampleAffiliateRecord);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateByCode('ABC123');

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(chain.eq).toHaveBeenCalledWith('code', 'ABC123');
      expect(chain.eq).toHaveBeenCalledWith('status', 'active');
      expect(chain.single).toHaveBeenCalled();

      expect(result).not.toBeNull();
      expect(result!.code).toBe('ABC123');
      expect(result!.name).toBe('Test Affiliate');
    });

    it('returns null on error', async () => {
      const chain = mockSupabaseChain(null, { message: 'Not found' });
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateByCode('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('fetchAffiliateByEmail', () => {
    it('returns mapped affiliate on success', async () => {
      const chain = mockSupabaseChain(sampleAffiliateRecord);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateByEmail('test@example.com');

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(chain.ilike).toHaveBeenCalledWith('email', 'test@example.com');
      expect(chain.single).toHaveBeenCalled();

      expect(result).not.toBeNull();
      expect(result!.email).toBe('test@example.com');
    });

    it('returns null on error', async () => {
      const chain = mockSupabaseChain(null, { message: 'Not found' });
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateByEmail('unknown@example.com');

      expect(result).toBeNull();
    });

    it('returns null when data is null without error', async () => {
      const chain = mockSupabaseChain(null);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('submitAffiliateApplication', () => {
    it('inserts and returns mapped affiliate', async () => {
      const returnedRecord = {
        ...sampleAffiliateRecord,
        status: 'pending',
        commission_amount: 0,
        slug: 'john-doe',
        code: 'JOHNDOE',
      };
      const chain = mockSupabaseChain(returnedRecord);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await submitAffiliateApplication({
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Doe Inc',
        bio: 'A test applicant',
        applicationNote: 'Please accept me',
      });

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Doe Inc',
          bio: 'A test applicant',
          application_note: 'Please accept me',
          status: 'pending',
          commission_amount: 0,
        })
      );
      expect(chain.select).toHaveBeenCalled();
      expect(chain.single).toHaveBeenCalled();

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
    });

    it('generates slug from name (lowercase, hyphenated)', async () => {
      const chain = mockSupabaseChain(sampleAffiliateRecord);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      await submitAffiliateApplication({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'john-doe',
        })
      );
    });

    it('generates code from name (uppercase, alphanumeric, max 8 chars)', async () => {
      const chain = mockSupabaseChain(sampleAffiliateRecord);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      await submitAffiliateApplication({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'JOHNDOE',
        })
      );
    });

    it('throws on supabase error', async () => {
      const chain = mockSupabaseChain(null, { message: 'Duplicate email' });
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      await expect(
        submitAffiliateApplication({
          name: 'John Doe',
          email: 'john@example.com',
        })
      ).rejects.toThrow('Duplicate email');
    });
  });

  describe('fetchAllAffiliates', () => {
    it('returns array of mapped affiliates', async () => {
      const chain = mockSupabaseChain([
        sampleAffiliateRecord,
        { ...sampleAffiliateRecord, id: 'second-id', name: 'Second Affiliate' },
      ]);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAllAffiliates();

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result[1].name).toBe('Second Affiliate');
    });

    it('throws on supabase error', async () => {
      mockSupabaseChain(null, { message: 'DB error' });
      // For list queries, the error comes through the thenable
      const errorChain: Record<string, any> = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => ({
          then: (onFulfilled: any, onRejected?: any) =>
            Promise.resolve({ data: null, error: { message: 'DB error' } }).then(
              onFulfilled,
              onRejected
            ),
        })),
      };
      vi.mocked(supabase.from).mockReturnValue(errorChain as any);

      await expect(fetchAllAffiliates()).rejects.toThrow('DB error');
    });
  });

  describe('updateAffiliateStatus', () => {
    it('updates status and returns mapped affiliate', async () => {
      const updatedRecord = { ...sampleAffiliateRecord, status: 'suspended' };
      const chain = mockSupabaseChain(updatedRecord);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await updateAffiliateStatus(
        '123e4567-e89b-12d3-a456-426614174000',
        'suspended'
      );

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(chain.update).toHaveBeenCalledWith({ status: 'suspended' });
      expect(chain.eq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
      expect(chain.select).toHaveBeenCalled();
      expect(chain.single).toHaveBeenCalled();

      expect(result.status).toBe('suspended');
    });

    it('throws on supabase error', async () => {
      const chain = mockSupabaseChain(null, { message: 'Update failed' });
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      await expect(updateAffiliateStatus('bad-id', 'active')).rejects.toThrow('Update failed');
    });
  });

  describe('fetchAffiliateAssets', () => {
    it('returns array of mapped assets', async () => {
      const chain = mockSupabaseChain([sampleAssetRecord]);
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateAssets();

      expect(supabase.from).toHaveBeenCalledWith('affiliate_assets');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('is_visible', true);
      expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('asset-001');
      expect(result[0].title).toBe('Swipe Copy Template');
      expect(result[0].description).toBe('A ready-to-use email template');
      expect(result[0].assetType).toBe('swipe_copy');
      expect(result[0].contentText).toBe('Hey {name}, check this out...');
      expect(result[0].sortOrder).toBe(1);
      expect(result[0].isVisible).toBe(true);
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('returns empty array when no assets exist', async () => {
      const chain = mockSupabaseChain([]);
      // For empty list, order returns thenable with empty array
      chain.order.mockImplementation(() => ({
        then: (onFulfilled: any, onRejected?: any) =>
          Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected),
      }));
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const result = await fetchAffiliateAssets();

      expect(result).toHaveLength(0);
    });

    it('throws on supabase error', async () => {
      const errorChain: Record<string, any> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => ({
          then: (onFulfilled: any, onRejected?: any) =>
            Promise.resolve({ data: null, error: { message: 'Fetch failed' } }).then(
              onFulfilled,
              onRejected
            ),
        })),
      };
      vi.mocked(supabase.from).mockReturnValue(errorChain as any);

      await expect(fetchAffiliateAssets()).rejects.toThrow('Fetch failed');
    });
  });
});
