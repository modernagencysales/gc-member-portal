import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useNotifications } from '../../../context/NotificationContext';
import { fetchTransactions, overrideClassification, importCSV } from '../../../services/financial';
import type {
  FinancialTransaction,
  TransactionsResponse,
  TransactionFilters,
} from '../../../types/financial-types';
import { GTM_CHANNELS, CHANNEL_LABELS } from '../../../types/financial-types';

interface TransactionListProps {
  tenantId: string;
  period: string;
}

type SortField =
  | 'transaction_date'
  | 'vendor_name'
  | 'amount_cents'
  | 'channel'
  | 'category'
  | 'confidence';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 25;

/** Format cents to a full currency string like $1,234.56 */
function formatDollars(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Format a date string to a short display format */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const TransactionList: React.FC<TransactionListProps> = ({ tenantId, period }) => {
  const { isDarkMode } = useTheme();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  // Filter state
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [classificationFilter, setClassificationFilter] = useState<string>('');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('transaction_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [page, setPage] = useState(1);

  // Derive date range from period prop
  const getDateRange = useCallback(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();
    return { from, to };
  }, [period]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange();

    const filters: TransactionFilters = {
      from,
      to,
      page,
      limit: PAGE_SIZE,
    };

    if (channelFilter) filters.channel = channelFilter;
    if (classificationFilter) filters.classification = classificationFilter;

    const result = await fetchTransactions(tenantId, filters);
    if (result) {
      setData(result);
    }
    setLoading(false);
  }, [tenantId, page, channelFilter, classificationFilter, getDateRange]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [channelFilter, classificationFilter, period]);

  // Handle inline channel override with optimistic update
  const handleChannelOverride = async (tx: FinancialTransaction, newChannel: string) => {
    if (!data) return;

    // Optimistic update
    const previousTransactions = [...data.transactions];
    setData({
      ...data,
      transactions: data.transactions.map((t) =>
        t.id === tx.id
          ? { ...t, channel: newChannel || null, classification: 'manual' as const }
          : t
      ),
    });

    const result = await overrideClassification(tenantId, tx.id, {
      channel: newChannel || undefined,
    });

    if (!result) {
      // Revert on error
      setData({ ...data, transactions: previousTransactions });
      addNotification({
        type: 'error',
        title: 'Classification Failed',
        message: `Could not update channel for "${tx.vendor_name}".`,
        category: 'system',
      });
    }
  };

  // Handle CSV import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const result = await importCSV(tenantId, file);
    setImporting(false);

    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (result) {
      addNotification({
        type: 'success',
        title: 'CSV Imported',
        message: `Imported ${result.imported} transactions, ${result.classified} auto-classified, ${result.skipped} skipped.`,
        category: 'system',
      });
      // Refresh list
      loadTransactions();
    } else {
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'Failed to import CSV. Please check the file format and try again.',
        category: 'system',
      });
    }
  };

  // Sort locally within the current page
  const sortedTransactions = data
    ? [...data.transactions].sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        switch (sortField) {
          case 'transaction_date':
            return (
              dir *
              (new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
            );
          case 'vendor_name':
            return dir * a.vendor_name.localeCompare(b.vendor_name);
          case 'amount_cents':
            return dir * (a.amount_cents - b.amount_cents);
          case 'channel':
            return dir * (a.channel || '').localeCompare(b.channel || '');
          case 'category':
            return dir * (a.category || '').localeCompare(b.category || '');
          case 'confidence':
            return dir * ((a.confidence ?? 0) - (b.confidence ?? 0));
          default:
            return 0;
        }
      })
    : [];

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'transaction_date' ? 'desc' : 'asc');
    }
  };

  // Styling
  const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const selectBg = isDarkMode
    ? 'bg-slate-700 border-slate-600 text-white'
    : 'bg-white border-slate-300 text-slate-900';
  const hoverRow = isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50';

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-3 h-3 ml-1 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg
        className="w-3 h-3 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg
        className="w-3 h-3 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className={`rounded-xl border p-6 ${cardBg}`}>
      {/* Header row with title and import button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-semibold ${textPrimary}`}>Recent Transactions</h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={importing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              importing
                ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500 dark:border-slate-600'
                : isDarkMode
                  ? 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className={`text-sm rounded-lg border px-3 py-1.5 ${selectBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">All Channels</option>
          {GTM_CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {CHANNEL_LABELS[ch] || ch}
            </option>
          ))}
        </select>

        <select
          value={classificationFilter}
          onChange={(e) => setClassificationFilter(e.target.value)}
          className={`text-sm rounded-lg border px-3 py-1.5 ${selectBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">All Classifications</option>
          <option value="auto">Auto</option>
          <option value="manual">Manual</option>
          <option value="pending">Needs Review</option>
        </select>

        {(channelFilter || classificationFilter) && (
          <button
            onClick={() => {
              setChannelFilter('');
              setClassificationFilter('');
            }}
            className={`text-xs ${textSecondary} hover:underline`}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          <span className={`ml-3 text-sm ${textSecondary}`}>Loading transactions...</span>
        </div>
      ) : sortedTransactions.length === 0 ? (
        <p className={`text-center py-8 ${textSecondary}`}>
          No transactions found for the selected filters.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead>
                <tr className={`border-b ${borderColor}`}>
                  {[
                    { field: 'transaction_date' as SortField, label: 'Date', align: 'left' },
                    { field: 'vendor_name' as SortField, label: 'Vendor', align: 'left' },
                    { field: 'amount_cents' as SortField, label: 'Amount', align: 'right' },
                    { field: 'channel' as SortField, label: 'Channel', align: 'left' },
                    { field: 'category' as SortField, label: 'Category', align: 'left' },
                    { field: 'confidence' as SortField, label: 'Confidence', align: 'right' },
                  ].map(({ field, label, align }) => (
                    <th
                      key={field}
                      className={`py-2 px-3 font-medium text-xs ${textSecondary} cursor-pointer select-none ${
                        align === 'right' ? 'text-right' : 'text-left'
                      }`}
                      onClick={() => handleSort(field)}
                    >
                      <span className="inline-flex items-center">
                        {label}
                        <SortIcon field={field} />
                      </span>
                    </th>
                  ))}
                  <th className={`py-2 px-3 font-medium text-xs text-left ${textSecondary}`}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((tx) => {
                  const isLowConfidence = tx.confidence !== null && tx.confidence < 0.7;
                  const isPending = tx.classification === 'pending';
                  const isPersonal = !tx.is_business;

                  return (
                    <tr
                      key={tx.id}
                      className={`border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'} ${hoverRow} transition-colors ${
                        isLowConfidence
                          ? isDarkMode
                            ? 'border-l-2 border-l-amber-500'
                            : 'border-l-2 border-l-amber-400'
                          : ''
                      } ${isPersonal ? 'opacity-50' : ''}`}
                    >
                      {/* Date */}
                      <td className={`py-2.5 px-3 text-sm whitespace-nowrap ${textSecondary}`}>
                        {formatDate(tx.transaction_date)}
                      </td>

                      {/* Vendor */}
                      <td className={`py-2.5 px-3 text-sm ${textPrimary}`}>
                        <div className="max-w-[200px] truncate" title={tx.vendor_name}>
                          {tx.vendor_name}
                        </div>
                        {tx.raw_name && tx.raw_name !== tx.vendor_name && (
                          <div
                            className={`text-xs truncate max-w-[200px] ${textSecondary}`}
                            title={tx.raw_name}
                          >
                            {tx.raw_name}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-2.5 px-3 text-sm text-right font-medium tabular-nums ${textPrimary}`}
                      >
                        {formatDollars(tx.amount_cents)}
                      </td>

                      {/* Channel (editable) */}
                      <td className="py-2.5 px-3">
                        <select
                          value={tx.channel || ''}
                          onChange={(e) => handleChannelOverride(tx, e.target.value)}
                          className={`text-xs rounded border px-2 py-1 w-full max-w-[150px] ${selectBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Uncategorized</option>
                          {GTM_CHANNELS.map((ch) => (
                            <option key={ch} value={ch}>
                              {CHANNEL_LABELS[ch] || ch}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Category */}
                      <td className={`py-2.5 px-3 text-sm ${textSecondary}`}>
                        {tx.category || '\u2014'}
                      </td>

                      {/* Confidence */}
                      <td
                        className={`py-2.5 px-3 text-sm text-right tabular-nums ${
                          isLowConfidence ? 'text-amber-500 font-medium' : textSecondary
                        }`}
                      >
                        {tx.confidence !== null ? `${(tx.confidence * 100).toFixed(0)}%` : '\u2014'}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </span>
                            Needs Review
                          </span>
                        ) : tx.classification === 'manual' ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Manual
                          </span>
                        ) : (
                          <span className={`text-xs ${textSecondary}`}>Auto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex items-center justify-between mt-4 pt-3 border-t ${borderColor}`}>
            <span className={`text-xs ${textSecondary}`}>
              Page {page} of {totalPages} ({data?.total ?? 0} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  page <= 1
                    ? 'opacity-40 cursor-not-allowed'
                    : isDarkMode
                      ? 'hover:bg-slate-700'
                      : 'hover:bg-slate-50'
                } ${isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-700'}`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  page >= totalPages
                    ? 'opacity-40 cursor-not-allowed'
                    : isDarkMode
                      ? 'hover:bg-slate-700'
                      : 'hover:bg-slate-50'
                } ${isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-700'}`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionList;
