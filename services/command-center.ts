/**
 * Command Center Service. Fetches GTM analytics dashboard data from the gtm-system API.
 * Constraint: Never imports React components or UI elements.
 */

import type { CommandCenterData } from '../types/command-center-types';
import { GTM_SYSTEM_URL } from '../lib/api-config';
import { logError } from '../lib/logError';

export async function fetchCommandCenterData(
  tenantId: string,
  from?: string,
  to?: string,
  granularity?: 'day' | 'week' | 'month'
): Promise<CommandCenterData | null> {
  try {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (granularity) params.set('granularity', granularity);

    const response = await fetch(`${GTM_SYSTEM_URL}/api/analytics/command-center?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      logError('commandCenter:fetchCommandCenterData', new Error(`HTTP ${response.status}`), {
        tenantId,
        status: response.status,
      });
      return null;
    }

    return await response.json();
  } catch (error) {
    logError('commandCenter:fetchCommandCenterData', error, { tenantId });
    return null;
  }
}

/** Format cents to dollar string */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

/** Format channel name for display */
export function formatChannelName(channel: string): string {
  const map: Record<string, string> = {
    heyreach: 'LinkedIn (HeyReach)',
    plusvibe: 'Cold Email (PlusVibe)',
    organic: 'Organic / Inbound',
    magnetlab: 'Lead Magnets',
    blueprint: 'Blueprint Form',
    bootcamp: 'Bootcamp',
    unknown: 'Unattributed',
  };
  return map[channel] || channel.charAt(0).toUpperCase() + channel.slice(1);
}
