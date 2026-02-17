import type { CommandCenterData } from '../types/command-center-types';
import { GTM_SYSTEM_URL } from '../lib/api-config';

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
      console.error('Command center fetch failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch command center data:', error);
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
