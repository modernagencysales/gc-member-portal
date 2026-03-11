import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpdate = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockResolvedValue({
  data: {
    id: '1',
    slug: 'test',
    status: 'draft',
    client_name: 'Test',
    client_company: 'Co',
    headline: 'H',
    executive_summary: 'E',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  error: null,
});

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    })),
  },
}));

import { updateProposal } from '../../services/proposal-supabase';

describe('updateProposal whitelist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnThis();
    mockEq.mockReturnThis();
    mockSelect.mockReturnThis();
    mockSingle.mockResolvedValue({
      data: {
        id: '1',
        slug: 'test',
        status: 'draft',
        client_name: 'Test',
        client_company: 'Co',
        headline: 'H',
        executive_summary: 'E',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      error: null,
    });
  });

  it('passes through allowed fields', async () => {
    await updateProposal('123', {
      client_name: 'New Name',
      headline: 'New Headline',
      status: 'published',
    });
    const calledWith = mockUpdate.mock.calls[0][0];
    expect(calledWith).toHaveProperty('client_name', 'New Name');
    expect(calledWith).toHaveProperty('headline', 'New Headline');
    expect(calledWith).toHaveProperty('status', 'published');
  });

  it('strips disallowed fields', async () => {
    await updateProposal('123', {
      client_name: 'Name',
      id: 'injected-id',
      created_at: '2020-01-01',
      created_by: 'hacker',
    } as any);
    const calledWith = mockUpdate.mock.calls[0][0];
    expect(calledWith).not.toHaveProperty('id');
    expect(calledWith).not.toHaveProperty('created_at');
    expect(calledWith).not.toHaveProperty('created_by');
    expect(calledWith).toHaveProperty('client_name', 'Name');
  });

  it('always sets updated_at', async () => {
    await updateProposal('123', { headline: 'Test' });
    const calledWith = mockUpdate.mock.calls[0][0];
    expect(calledWith).toHaveProperty('updated_at');
  });
});
