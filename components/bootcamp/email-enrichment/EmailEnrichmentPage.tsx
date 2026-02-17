import React, { useState, useCallback, useMemo } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Download,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import {
  createBatchRun,
  insertBatchLeads,
  fetchBatchLeads,
  fetchBatchRunsByUser,
  type BatchRun,
  type BatchLead,
} from '../../../services/enrichment-batch-supabase';
import { useEmailEnrichment } from '../../../hooks/useEmailEnrichment';

// ============================================
// CSV Parser (RFC 4180-compliant)
// ============================================

function parseRow(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else if (ch === '"') {
        inQuotes = false;
        i++;
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

// ============================================
// Types & Constants
// ============================================

type EnrichmentField =
  | 'first_name'
  | 'last_name'
  | 'company_name'
  | 'company_domain'
  | 'linkedin_url';

const FIELD_CONFIG: Record<EnrichmentField, { label: string; required: boolean; hints: string[] }> =
  {
    first_name: {
      label: 'First Name',
      required: true,
      hints: ['first_name', 'firstname', 'first name', 'given name'],
    },
    last_name: {
      label: 'Last Name',
      required: true,
      hints: ['last_name', 'lastname', 'last name', 'surname', 'family name'],
    },
    company_name: {
      label: 'Company Name',
      required: false,
      hints: ['company', 'company_name', 'company name', 'organization'],
    },
    company_domain: {
      label: 'Company Domain',
      required: false,
      hints: ['domain', 'company_domain', 'website', 'company_website', 'url'],
    },
    linkedin_url: {
      label: 'LinkedIn URL',
      required: false,
      hints: ['linkedin', 'linkedin_url', 'linkedin url', 'profile_url', 'linkedin_profile'],
    },
  };

const ALL_FIELDS: EnrichmentField[] = [
  'first_name',
  'last_name',
  'company_name',
  'company_domain',
  'linkedin_url',
];

type Step = 'upload' | 'map' | 'processing' | 'results';

// ============================================
// Component
// ============================================

interface Props {
  userId: string;
}

const EmailEnrichmentPage: React.FC<Props> = ({ userId }) => {
  const [step, setStep] = useState<Step>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<EnrichmentField, string>>({
    first_name: '',
    last_name: '',
    company_name: '',
    company_domain: '',
    linkedin_url: '',
  });
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [_runId, setRunId] = useState<string | null>(null);
  const [results, setResults] = useState<BatchLead[]>([]);
  const [pastRuns, setPastRuns] = useState<BatchRun[]>([]);
  const [showPastRuns, setShowPastRuns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enrichment = useEmailEnrichment();

  // Auto-detect column mappings
  const autoDetectMappings = useCallback((headers: string[]) => {
    const mapping: Record<EnrichmentField, string> = {
      first_name: '',
      last_name: '',
      company_name: '',
      company_domain: '',
      linkedin_url: '',
    };

    for (const field of ALL_FIELDS) {
      const config = FIELD_CONFIG[field];
      const match = headers.find((h) =>
        config.hints.some((hint) => h.toLowerCase().trim() === hint)
      );
      if (match) mapping[field] = match;
    }

    setColumnMap(mapping);
  }, []);

  // Handle file upload
  const handleFile = useCallback(
    (file: File) => {
      setUploadError(null);

      if (!file.name.endsWith('.csv')) {
        setUploadError('Please upload a CSV file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers, rows } = parseCsv(text);

        if (headers.length === 0 || rows.length === 0) {
          setUploadError('CSV file is empty or has no data rows');
          return;
        }

        setCsvHeaders(headers);
        setCsvRows(rows);
        setFileName(file.name);
        autoDetectMappings(headers);
        setStep('map');
      };
      reader.readAsText(file);
    },
    [autoDetectMappings]
  );

  // Drag & drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Validation: need at least name + (domain or linkedin)
  const isMapValid = useMemo(() => {
    const hasFirstName = !!columnMap.first_name;
    const hasLastName = !!columnMap.last_name;
    const hasDomain = !!columnMap.company_domain;
    const hasLinkedin = !!columnMap.linkedin_url;
    return hasFirstName && hasLastName && (hasDomain || hasLinkedin);
  }, [columnMap]);

  // Start enrichment
  const handleStartEnrichment = useCallback(async () => {
    if (!isMapValid || csvRows.length === 0) return;
    setIsSubmitting(true);

    try {
      const run = await createBatchRun(userId, fileName);
      setRunId(run.id);

      const leads = csvRows.map((row) => ({
        firstName: columnMap.first_name ? row[columnMap.first_name] : undefined,
        lastName: columnMap.last_name ? row[columnMap.last_name] : undefined,
        companyName: columnMap.company_name ? row[columnMap.company_name] : undefined,
        companyDomain: columnMap.company_domain ? row[columnMap.company_domain] : undefined,
        linkedinUrl: columnMap.linkedin_url ? row[columnMap.linkedin_url] : undefined,
      }));

      await insertBatchLeads(run.id, leads);
      setStep('processing');
      await enrichment.start(run.id);

      // Fetch results when done
      const resultLeads = await fetchBatchLeads(run.id);
      setResults(resultLeads);
      setStep('results');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to start enrichment');
    } finally {
      setIsSubmitting(false);
    }
  }, [isMapValid, csvRows, columnMap, userId, fileName, enrichment]);

  // Load past runs
  const handleShowPastRuns = useCallback(async () => {
    try {
      const runs = await fetchBatchRunsByUser(userId);
      setPastRuns(runs);
      setShowPastRuns(true);
    } catch {
      // ignore
    }
  }, [userId]);

  // View past run results
  const handleViewRun = useCallback(async (run: BatchRun) => {
    setRunId(run.id);
    const leads = await fetchBatchLeads(run.id);
    setResults(leads);
    setStep('results');
    setShowPastRuns(false);
  }, []);

  // Download CSV
  const handleDownload = useCallback(() => {
    if (results.length === 0) return;

    const headers = [
      'first_name',
      'last_name',
      'company_name',
      'company_domain',
      'linkedin_url',
      'email',
      'email_provider',
      'validation_status',
      'status',
    ];

    const csvLines = [headers.join(',')];
    for (const lead of results) {
      const row = [
        lead.firstName || '',
        lead.lastName || '',
        lead.companyName || '',
        lead.companyDomain || '',
        lead.linkedinUrl || '',
        lead.foundEmail || '',
        lead.provider || '',
        lead.validationStatus || '',
        lead.status,
      ].map((v) => `"${(v || '').replace(/"/g, '""')}"`);
      csvLines.push(row.join(','));
    }

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enriched_${fileName || 'contacts'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, fileName]);

  // Reset to start
  const handleReset = useCallback(() => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMap({
      first_name: '',
      last_name: '',
      company_name: '',
      company_domain: '',
      linkedin_url: '',
    });
    setFileName('');
    setUploadError(null);
    setRunId(null);
    setResults([]);
    setShowPastRuns(false);
  }, []);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Email Enrichment</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Upload a CSV with contacts and find their verified work emails
          </p>
        </div>
        <div className="flex gap-2">
          {step !== 'upload' && step !== 'processing' && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              New Upload
            </button>
          )}
          {step === 'upload' && (
            <button
              onClick={handleShowPastRuns}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Past Runs
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {(['upload', 'map', 'processing', 'results'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <ChevronRight size={12} className="text-zinc-300" />}
            <span
              className={`px-2 py-1 rounded ${
                s === step
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                  : s < step || (step === 'results' && s !== 'results')
                    ? 'text-zinc-400'
                    : 'text-zinc-300'
              }`}
            >
              {i + 1}.{' '}
              {s === 'upload'
                ? 'Upload'
                : s === 'map'
                  ? 'Map Columns'
                  : s === 'processing'
                    ? 'Processing'
                    : 'Results'}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Past Runs Modal */}
      {showPastRuns && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Past Enrichment Runs
            </h3>
            <button
              onClick={() => setShowPastRuns(false)}
              className="text-xs text-zinc-500 hover:text-zinc-700"
            >
              Close
            </button>
          </div>
          {pastRuns.length === 0 ? (
            <p className="text-xs text-zinc-500">No past runs found</p>
          ) : (
            <div className="space-y-2">
              {pastRuns.map((run) => (
                <button
                  key={run.id}
                  onClick={() => handleViewRun(run)}
                  className="w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {run.name || 'Untitled'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        run.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : run.status === 'running'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {run.totalContacts} contacts, {run.emailsFound} emails found &middot;{' '}
                    {new Date(run.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && !showPastRuns && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-12 text-center hover:border-violet-400 dark:hover:border-violet-600 transition-colors cursor-pointer"
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer space-y-3">
            <Upload size={40} className="mx-auto text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Drop your CSV here or click to upload
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Required columns: First Name, Last Name, and Company Domain or LinkedIn URL
              </p>
            </div>
          </label>
          {uploadError && (
            <div className="mt-4 flex items-center justify-center gap-2 text-red-600 text-xs">
              <AlertCircle size={14} />
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 'map' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-violet-500" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{fileName}</p>
              <p className="text-xs text-zinc-500">{csvRows.length} contacts found</p>
            </div>
          </div>

          {csvRows.length > 500 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                Large batch ({csvRows.length} contacts). This may take a while to process. Consider
                splitting into smaller batches for faster results.
              </span>
            </div>
          )}

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
                    onChange={(e) => setColumnMap((prev) => ({ ...prev, [field]: e.target.value }))}
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

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            <button
              onClick={handleStartEnrichment}
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
      )}

      {/* Step 3: Processing */}
      {step === 'processing' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-6">
          <Loader2 size={40} className="mx-auto text-violet-500 animate-spin" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Finding emails...
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Running waterfall enrichment across multiple providers
            </p>
          </div>

          {/* Progress bar */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>
                {enrichment.stats.processedContacts} / {enrichment.stats.totalContacts} processed
              </span>
              <span>{enrichment.progress}%</span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${enrichment.progress}%` }}
              />
            </div>
          </div>

          {/* Live stats */}
          <div className="flex items-center justify-center gap-8 text-xs">
            <div>
              <span className="text-zinc-500">Emails Found</span>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {enrichment.stats.emailsFound}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Processed</span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {enrichment.stats.processedContacts}
              </p>
            </div>
          </div>

          {enrichment.error && (
            <div className="flex items-center justify-center gap-2 text-red-600 text-xs">
              <AlertCircle size={14} />
              {enrichment.error}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Results */}
      {step === 'results' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-zinc-500">Total</span>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {results.length}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Emails Found</span>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {results.filter((r) => r.foundEmail).length}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Not Found</span>
                  <p className="text-lg font-bold text-zinc-400">
                    {results.filter((r) => r.status === 'not_found').length}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Errors</span>
                  <p className="text-lg font-bold text-red-500">
                    {results.filter((r) => r.status === 'error').length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
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
      )}
    </div>
  );
};

export default EmailEnrichmentPage;
