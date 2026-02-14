// GTM Channels (matches backend)
export const GTM_CHANNELS = [
  'paid_social',
  'paid_search',
  'cold_email',
  'organic_linkedin',
  'ai_infrastructure',
  'tooling',
  'content',
  'contractors',
  'email_infrastructure',
  'other',
] as const;
export type GtmChannel = (typeof GTM_CHANNELS)[number];

// Channel display names for UI
export const CHANNEL_LABELS: Record<string, string> = {
  paid_social: 'Paid Social',
  paid_search: 'Paid Search',
  cold_email: 'Cold Email',
  organic_linkedin: 'Organic LinkedIn',
  ai_infrastructure: 'AI Infrastructure',
  tooling: 'Tooling',
  content: 'Content',
  contractors: 'Contractors',
  email_infrastructure: 'Email Infrastructure',
  other: 'Other',
  uncategorized: 'Uncategorized',
};

// Expense metrics from GET /api/analytics/expenses
export interface ExpenseMetrics {
  total_expense_cents: number;
  by_channel: Array<{ channel: string; total_cents: number; transaction_count: number }>;
  by_category: Array<{ category: string; total_cents: number }>;
  by_period: Array<{ date: string; total_cents: number; by_channel: Record<string, number> }>;
}

// P&L from GET /api/analytics/pnl
export interface PnLMetrics {
  revenue_cents: number;
  expense_cents: number;
  net_profit_cents: number;
  profit_margin_pct: number;
  by_channel: ChannelPnL[];
  sync_status: SyncStatus | null;
}

export interface ChannelPnL {
  channel: string;
  revenue_cents: number;
  expense_cents: number;
  net_cents: number;
  roi_pct: number | null;
  lead_count: number;
  cpl_cents: number | null;
}

// Sync status
export interface SyncStatus {
  last_synced_at: string | null;
  last_sync_status: 'success' | 'error' | null;
  last_sync_error: string | null;
  sync_interval_min: number;
}

// Transaction from GET /api/financial/transactions
export interface FinancialTransaction {
  id: string;
  vendor_name: string;
  raw_name: string | null;
  amount_cents: number;
  currency: string;
  transaction_date: string;
  category: string | null;
  subcategory: string | null;
  channel: string | null;
  classification: 'auto' | 'manual' | 'pending';
  confidence: number | null;
  account_name: string | null;
  is_business: boolean;
}

export interface TransactionsResponse {
  transactions: FinancialTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  channel?: string;
  category?: string;
  classification?: string;
  page?: number;
  limit?: number;
}

// Classification override
export interface ClassificationOverride {
  channel?: string;
  category?: string;
  subcategory?: string;
  is_business?: boolean;
}

// Integration catalog from GET /api/integrations/catalog
export interface IntegrationCatalogItem {
  id: string;
  name: string;
  type: 'source' | 'crm' | 'financial' | 'enrichment' | 'automation';
  auth_type: 'api_key' | 'oauth' | 'webhook_only';
  logo_url: string | null;
  description: string;
  config_schema: { fields?: string[]; config_keys?: string[] };
  is_available: boolean;
  sort_order: number;
  is_connected: boolean;
  last_verified_at: string | null;
}
