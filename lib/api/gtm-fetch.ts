/** Shared GTM System API client.
 *  All requests to gtm-system (gtmconductor.com) go through this helper.
 *  Uses x-admin-key authentication (GC portal has no Supabase session).
 *  Never import fetch() directly in services — use this instead. */

/**
 * Authenticated fetch to GTM System API.
 * Attaches x-admin-key header and handles error responses.
 * Env vars are read lazily (inside the function) so tests can stub them.
 */
export async function gtmAdminFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const GTM_BASE = import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtmconductor.com';
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

  const res = await fetch(`${GTM_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `GTM API request failed: ${res.status}`);
  }

  return res.json();
}
