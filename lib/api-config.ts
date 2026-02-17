/**
 * Centralized API configuration
 *
 * Single source of truth for external service URLs and shared header builders.
 * Avoids duplicating env-var lookups + fallback URLs across services/components.
 */

/** GTM System (gtm-system repo) base URL */
export const GTM_SYSTEM_URL: string =
  import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtm-system-production.up.railway.app';

/** Blueprint backend (leadmagnet-backend repo) base URL */
export const BLUEPRINT_BACKEND_URL: string =
  import.meta.env.VITE_BLUEPRINT_BACKEND_URL || 'http://localhost:3000';

/** Infrastructure API key for gtm-system authenticated endpoints */
const INFRA_API_KEY: string = import.meta.env.VITE_INFRA_API_KEY || '';

/**
 * Build standard headers for gtm-system API calls.
 * Includes x-infra-key when VITE_INFRA_API_KEY is set.
 */
export function buildGtmHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (INFRA_API_KEY) {
    headers['x-infra-key'] = INFRA_API_KEY;
  }
  return headers;
}
