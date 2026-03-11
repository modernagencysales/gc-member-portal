import { gtmAdminFetch } from './gtm-fetch';

// ─── Response shapes (GTM API wraps results in { data: [...] }) ───────────────

interface FunnelStage {
  id: string;
  slug: string;
  name: string;
  display_order: number;
  color: string;
}

interface StageMetric {
  stage_slug: string;
  stage_name: string;
  lead_count: number;
  conversion_rate: number;
}

interface ChannelAttribution {
  channel: string;
  leads: number;
  qualified: number;
  calls: number;
  customers: number;
  revenue_cents: number;
}

interface ConfigItem {
  key: string;
  value: string;
  type: 'number' | 'text' | 'url' | 'textarea';
  label: string;
  description: string;
  category: string;
}

interface QualificationResult {
  qualification?: { qualified?: boolean; source_channel?: string };
  iclosed_event_url?: string;
  phone?: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const funnelApi = {
  getStages: () => gtmAdminFetch<{ data: FunnelStage[] }>('/api/funnel/stages'),
  getMetrics: (params?: { channel?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.channel) qs.set('channel', params.channel);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return gtmAdminFetch<{ data: StageMetric[] }>(`/api/funnel/metrics?${qs}`);
  },
  getAttribution: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return gtmAdminFetch<{ data: ChannelAttribution[] }>(`/api/funnel/attribution?${qs}`);
  },
  getConfig: () => gtmAdminFetch<{ data: ConfigItem[] }>('/api/funnel/config'),
  getQualification: async (
    email: string
  ): Promise<{
    qualified: boolean;
    iclosed_event_url: string;
    phone: string;
    source_channel: string;
  }> => {
    const data = await gtmAdminFetch<QualificationResult>(
      `/api/funnel/qualification/${encodeURIComponent(email)}`
    );
    // Default to qualified=true when no record exists — don't block prospects
    // who haven't been through the qualification process yet
    return {
      qualified: data.qualification?.qualified ?? true,
      iclosed_event_url: data.iclosed_event_url || '',
      phone: data.phone || '',
      source_channel: data.qualification?.source_channel || '',
    };
  },
  updateConfig: (key: string, value: string) =>
    gtmAdminFetch('/api/funnel/config', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),
};
