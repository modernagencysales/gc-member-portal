const GTM_BASE = import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtmconductor.com';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY;

async function funnelFetch(path: string) {
  const res = await fetch(`${GTM_BASE}/api/funnel${path}`, {
    headers: { 'x-admin-key': ADMIN_KEY },
  });
  if (!res.ok) throw new Error(`Funnel API error: ${res.status}`);
  return res.json();
}

export const funnelApi = {
  getStages: () => funnelFetch('/stages'),
  getMetrics: (params?: { channel?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.channel) qs.set('channel', params.channel);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return funnelFetch(`/metrics?${qs}`);
  },
  getAttribution: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return funnelFetch(`/attribution?${qs}`);
  },
  getConfig: () => funnelFetch('/config'),
  getQualification: async (
    email: string
  ): Promise<{
    qualified: boolean;
    iclosed_event_url: string;
    phone: string;
    source_channel: string;
  }> => {
    const data = await funnelFetch(`/qualification/${encodeURIComponent(email)}`);
    // Default to qualified=true when no record exists — don't block prospects
    // who haven't been through the qualification process yet
    return {
      qualified: data.qualification?.qualified ?? true,
      iclosed_event_url: data.iclosed_event_url || '',
      phone: data.phone || '',
      source_channel: data.qualification?.source_channel || '',
    };
  },
  updateConfig: async (key: string, value: string) => {
    const res = await fetch(`${GTM_BASE}/api/funnel/config`, {
      method: 'PUT',
      headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error(`Config update error: ${res.status}`);
    return res.json();
  },
};
