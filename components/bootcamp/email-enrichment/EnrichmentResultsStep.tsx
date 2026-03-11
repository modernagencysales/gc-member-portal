/**
 * EnrichmentResultsStep.tsx
 * Step 4 of the Email Enrichment wizard: results summary and downloadable table.
 * Constraint: no data fetching — results come from props, download is a callback.
 */

import React from 'react';
import { Download, Check } from 'lucide-react';
import type { BatchLead } from '../../../services/enrichment-batch-supabase';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  results: BatchLead[];
  onDownload: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EnrichmentResultsStep: React.FC<Props> = ({ results, onDownload }) => {
  const emailsFound = results.filter((r) => r.foundEmail).length;
  const notFound = results.filter((r) => r.status === 'not_found').length;
  const errors = results.filter((r) => r.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-zinc-500">Total</span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{results.length}</p>
            </div>
            <div>
              <span className="text-zinc-500">Emails Found</span>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{emailsFound}</p>
            </div>
            <div>
              <span className="text-zinc-500">Not Found</span>
              <p className="text-lg font-bold text-zinc-400">{notFound}</p>
            </div>
            <div>
              <span className="text-zinc-500">Errors</span>
              <p className="text-lg font-bold text-red-500">{errors}</p>
            </div>
          </div>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Download size={14} />
            Download CSV
          </button>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left p-3 text-zinc-500 font-medium">Name</th>
                <th className="text-left p-3 text-zinc-500 font-medium">Company</th>
                <th className="text-left p-3 text-zinc-500 font-medium">Email</th>
                <th className="text-left p-3 text-zinc-500 font-medium">Provider</th>
                <th className="text-left p-3 text-zinc-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="p-3 text-zinc-900 dark:text-zinc-100">
                    {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '-'}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {lead.companyName || lead.companyDomain || '-'}
                  </td>
                  <td className="p-3">
                    {lead.foundEmail ? (
                      <span className="text-green-600 dark:text-green-400 font-mono">
                        {lead.foundEmail}
                      </span>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-zinc-500">{lead.provider || '-'}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        lead.status === 'found'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : lead.status === 'not_found'
                            ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            : lead.status === 'error'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {lead.status === 'found' && <Check size={10} />}
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnrichmentResultsStep;
