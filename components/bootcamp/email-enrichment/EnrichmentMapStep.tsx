/**
 * EnrichmentMapStep.tsx
 * Step 2 of the Email Enrichment wizard: map CSV columns to enrichment fields.
 * Shows file info, large-batch warning, column selectors, data preview, and submit/back actions.
 * Constraint: no data fetching — all state and callbacks come from props.
 */

import React from 'react';
import { FileText, ChevronLeft, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { ALL_FIELDS, FIELD_CONFIG, type EnrichmentField } from './enrichment-types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  fileName: string;
  csvRows: Record<string, string>[];
  csvHeaders: string[];
  columnMap: Record<EnrichmentField, string>;
  isMapValid: boolean;
  isSubmitting: boolean;
  onColumnMapChange: React.Dispatch<React.SetStateAction<Record<EnrichmentField, string>>>;
  onBack: () => void;
  onStartEnrichment: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EnrichmentMapStep: React.FC<Props> = ({
  fileName,
  csvRows,
  csvHeaders,
  columnMap,
  isMapValid,
  isSubmitting,
  onColumnMapChange,
  onBack,
  onStartEnrichment,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      {/* File info */}
      <div className="flex items-center gap-3">
        <FileText size={18} className="text-violet-500" />
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{fileName}</p>
          <p className="text-xs text-zinc-500">{csvRows.length} contacts found</p>
        </div>
      </div>

      {/* Large batch warning */}
      {csvRows.length > 500 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Large batch ({csvRows.length} contacts). This may take a while to process. Consider
            splitting into smaller batches for faster results.
          </span>
        </div>
      )}

      {/* Column mapping */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Map your CSV columns
        </h3>
        {ALL_FIELDS.map((field) => {
          const config = FIELD_CONFIG[field];
          return (
            <div key={field} className="flex items-center gap-4">
              <div className="w-40 text-right">
                <span className="text-xs text-zinc-700 dark:text-zinc-300">
                  {config.label}
                  {config.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
              </div>
              <select
                value={columnMap[field]}
                onChange={(e) =>
                  onColumnMapChange((prev) => ({ ...prev, [field]: e.target.value }))
                }
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="">-- Skip --</option>
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Validation hint */}
      {!isMapValid && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Map at least First Name, Last Name, and either Company Domain or LinkedIn URL
        </p>
      )}

      {/* Preview */}
      {csvRows.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-zinc-500 mb-2">Preview (first 3 rows)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  {ALL_FIELDS.filter((f) => columnMap[f]).map((f) => (
                    <th key={f} className="text-left p-2 text-zinc-500 font-medium">
                      {FIELD_CONFIG[f].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                    {ALL_FIELDS.filter((f) => columnMap[f]).map((f) => (
                      <td key={f} className="p-2 text-zinc-700 dark:text-zinc-300">
                        {row[columnMap[f]] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft size={14} />
          Back
        </button>
        <button
          onClick={onStartEnrichment}
          disabled={!isMapValid || isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Mail size={14} />
              Find Emails ({csvRows.length} contacts)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EnrichmentMapStep;
