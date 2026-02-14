export interface CommandCenterData {
  period: {
    from: string;
    to: string;
    granularity: 'day' | 'week' | 'month';
  };
  kpis: {
    total_revenue_cents: number;
    mrr_cents: number;
    blended_cac_cents: number | null;
    best_channel: string | null;
    pipeline_value_cents: number;
  };
  revenue: RevenueMetrics;
  funnel: FunnelMetrics;
  channels: ChannelAttribution;
  unit_economics: UnitEconomics;
  alerts: CommandCenterAlert[];
}

export interface RevenueMetrics {
  total_revenue_cents: number;
  mrr_cents: number;
  arr_cents: number;
  new_revenue_cents: number;
  recurring_revenue_cents: number;
  refund_cents: number;
  by_channel: ChannelRevenue[];
  by_product: ProductRevenue[];
  by_period: PeriodRevenue[];
}

export interface ChannelRevenue {
  channel: string;
  revenue_cents: number;
  customer_count: number;
  avg_revenue_per_customer_cents: number;
}

export interface ProductRevenue {
  product_name: string;
  product_category: string;
  revenue_cents: number;
  transaction_count: number;
}

export interface PeriodRevenue {
  date: string;
  revenue_cents: number;
  new_revenue_cents: number;
  recurring_revenue_cents: number;
}

export interface FunnelMetrics {
  stages: { name: string; count: number; percentage_of_total: number }[];
  conversion_rates: {
    from_stage: string;
    to_stage: string;
    rate: number;
    count_from: number;
    count_to: number;
  }[];
  overall_conversion_rate: number;
}

export interface ChannelAttribution {
  channels: ChannelMetrics[];
  best_for_leads: string | null;
  best_for_meetings: string | null;
  best_for_conversion: string | null;
}

export interface ChannelMetrics {
  channel: string;
  leads: number;
  qualified: number;
  meetings_booked: number;
  closed: number;
  conversion_rate: number;
  lead_to_meeting_rate: number;
}

export interface UnitEconomics {
  blended_cac_cents: number | null;
  ltv_estimate_cents: number | null;
  payback_period_months: number | null;
  by_channel: {
    channel: string;
    cost_cents: number;
    revenue_cents: number;
    new_customers: number;
    cac_cents: number | null;
    roi_percentage: number | null;
  }[];
}

export interface CommandCenterAlert {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action_label?: string;
  action_url?: string;
}
