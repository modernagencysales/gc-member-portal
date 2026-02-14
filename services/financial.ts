import type {
  ExpenseMetrics,
  PnLMetrics,
  TransactionsResponse,
  TransactionFilters,
  FinancialTransaction,
  ClassificationOverride,
  SyncStatus,
  IntegrationCatalogItem,
} from '../types/financial-types';

const GTM_SYSTEM_URL =
  import.meta.env.VITE_GTM_SYSTEM_URL || 'https://gtm-system-production.up.railway.app';

export async function fetchExpenseMetrics(
  tenantId: string,
  from?: string,
  to?: string
): Promise<ExpenseMetrics | null> {
  try {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await fetch(`${GTM_SYSTEM_URL}/api/analytics/expenses?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('Expense metrics fetch failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch expense metrics:', error);
    return null;
  }
}

export async function fetchPnLMetrics(
  tenantId: string,
  from?: string,
  to?: string
): Promise<PnLMetrics | null> {
  try {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await fetch(`${GTM_SYSTEM_URL}/api/analytics/pnl?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('P&L metrics fetch failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch P&L metrics:', error);
    return null;
  }
}

export async function fetchTransactions(
  tenantId: string,
  filters?: TransactionFilters
): Promise<TransactionsResponse | null> {
  try {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.channel) params.set('channel', filters.channel);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.classification) params.set('classification', filters.classification);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const response = await fetch(`${GTM_SYSTEM_URL}/api/financial/transactions?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('Transactions fetch failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return null;
  }
}

export async function overrideClassification(
  tenantId: string,
  transactionId: string,
  override: ClassificationOverride
): Promise<FinancialTransaction | null> {
  try {
    const response = await fetch(
      `${GTM_SYSTEM_URL}/api/financial/transactions/${transactionId}/classify`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, ...override }),
      }
    );

    if (!response.ok) {
      console.error('Classification override failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to override classification:', error);
    return null;
  }
}

export async function triggerSync(tenantId: string): Promise<{ triggered: boolean } | null> {
  try {
    const response = await fetch(`${GTM_SYSTEM_URL}/api/financial/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    if (!response.ok) {
      console.error('Sync trigger failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to trigger sync:', error);
    return null;
  }
}

export async function importCSV(
  tenantId: string,
  file: File
): Promise<{ imported: number; classified: number; skipped: number } | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', tenantId);

    // Don't set Content-Type header — browser sets it with boundary
    const response = await fetch(`${GTM_SYSTEM_URL}/api/financial/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('CSV import failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to import CSV:', error);
    return null;
  }
}

export async function fetchIntegrationCatalog(
  tenantId: string
): Promise<IntegrationCatalogItem[] | null> {
  try {
    const params = new URLSearchParams({ tenant_id: tenantId });

    const response = await fetch(`${GTM_SYSTEM_URL}/api/integrations/catalog?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('Integration catalog fetch failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch integration catalog:', error);
    return null;
  }
}

export async function fetchSyncStatus(tenantId: string): Promise<SyncStatus | null> {
  try {
    const params = new URLSearchParams({ tenant_id: tenantId });

    const response = await fetch(`${GTM_SYSTEM_URL}/api/financial/sync/status?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('Sync status fetch failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch sync status:', error);
    return null;
  }
}
