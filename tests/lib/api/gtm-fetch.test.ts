import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { gtmAdminFetch } from '../../../lib/api/gtm-fetch';

describe('gtmAdminFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GTM_SYSTEM_URL', 'https://test-gtm.example.com');
    vi.stubEnv('VITE_ADMIN_API_KEY', 'test-admin-key');
  });

  it('sends GET request with x-admin-key header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });
    const result = await gtmAdminFetch('/api/test');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-gtm.example.com/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-admin-key': 'test-admin-key',
        }),
      })
    );
    expect(result).toEqual({ data: 'test' });
  });

  it('sends POST request with body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    await gtmAdminFetch('/api/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-gtm.example.com/api/test',
      expect.objectContaining({
        method: 'POST',
        body: '{"key":"value"}',
      })
    );
  });

  it('throws on non-OK response with error message from body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    });
    await expect(gtmAdminFetch('/api/test')).rejects.toThrow('Forbidden');
  });

  it('throws generic message when error body is unparseable', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });
    await expect(gtmAdminFetch('/api/test')).rejects.toThrow('GTM API request failed: 500');
  });
});
