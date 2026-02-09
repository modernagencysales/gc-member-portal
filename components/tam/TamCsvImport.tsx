import React, { useState, useCallback, useMemo } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { createImportProject, insertTamContacts } from '../../services/tam-supabase';
import { useTamLinkedinCheck } from '../../hooks/useTamLinkedinCheck';

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
// Types
// ============================================

type TamField = 'linkedin_url' | 'first_name' | 'last_name' | 'title' | 'email' | 'company_name';

const TAM_FIELDS: { key: TamField; label: string; required: boolean }[] = [
  { key: 'linkedin_url', label: 'LinkedIn URL', required: true },
  { key: 'first_name', label: 'First Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'title', label: 'Job Title', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'company_name', label: 'Company Name', required: false },
];

// Auto-detect patterns for column headers
const AUTO_DETECT: Record<TamField, RegExp> = {
  linkedin_url: /linkedin|profile.?url/i,
  first_name: /first.?name/i,
  last_name: /last.?name/i,
  title: /title|position|role|job/i,
  email: /email|e-mail/i,
  company_name: /company|organization|org/i,
};

type ImportStep = 'upload' | 'map' | 'confirm';

interface TamCsvImportProps {
  userId: string;
  onComplete: (projectId: string) => void;
  onBack: () => void;
}

// ============================================
// Component
// ============================================

const TamCsvImport: React.FC<TamCsvImportProps> = ({ userId, onComplete, onBack }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<TamField, string | null>>({
    linkedin_url: null,
    first_name: null,
    last_name: null,
    title: null,
    email: null,
    company_name: null,
  });
  const [projectName, setProjectName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const linkedinCheck = useTamLinkedinCheck();

  // --- Upload step ---

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setUploadError(null);

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsv(text);

      if (result.rows.length === 0) {
        setUploadError('No rows found in CSV. Check the file format.');
        return;
      }

      setCsvHeaders(result.headers);
      setCsvRows(result.rows);
      setFileName(file.name);

      // Auto-detect column mappings
      const autoMap: Record<TamField, string | null> = {
        linkedin_url: null,
        first_name: null,
        last_name: null,
        title: null,
        email: null,
        company_name: null,
      };

      for (const field of TAM_FIELDS) {
        const match = result.headers.find((h) => AUTO_DETECT[field.key].test(h));
        if (match) autoMap[field.key] = match;
      }

      setMapping(autoMap);
      setStep('map');
    };
    reader.onerror = () => setUploadError('Failed to read file.');
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  // --- Map step ---

  const linkedinMapped = !!mapping.linkedin_url;

  const previewRows = useMemo(() => csvRows.slice(0, 5), [csvRows]);

  const getMappedValue = (row: Record<string, string>, field: TamField) => {
    const header = mapping[field];
    if (!header) return '';
    return row[header] || '';
  };

  // Count rows with LinkedIn URLs
  const linkedinCount = useMemo(() => {
    if (!mapping.linkedin_url) return 0;
    return csvRows.filter((row) => {
      const val = row[mapping.linkedin_url!];
      return val && val.trim().length > 0;
    }).length;
  }, [csvRows, mapping.linkedin_url]);

  // --- Confirm step ---

  const handleImport = async () => {
    if (!userId) return;
    setImportError(null);
    setIsImporting(true);

    try {
      const name = projectName.trim() || `CSV Import - ${new Date().toLocaleDateString()}`;
      const { project, companyId } = await createImportProject(userId, name);

      // Map CSV rows to TAM contacts
      const contacts = csvRows
        .filter((row) => {
          const url = getMappedValue(row, 'linkedin_url');
          return url && url.trim().length > 0;
        })
        .map((row) => ({
          companyId,
          projectId: project.id,
          firstName: getMappedValue(row, 'first_name') || null,
          lastName: getMappedValue(row, 'last_name') || null,
          title: getMappedValue(row, 'title') || null,
          linkedinUrl: getMappedValue(row, 'linkedin_url') || null,
          email: getMappedValue(row, 'email') || null,
          source: 'csv_import' as const,
        }));

      if (contacts.length === 0) {
        setImportError('No contacts with LinkedIn URLs found.');
        setIsImporting(false);
        return;
      }

      // Insert in batches of 500
      for (let i = 0; i < contacts.length; i += 500) {
        await insertTamContacts(contacts.slice(i, i + 500));
      }

      // Start LinkedIn check
      linkedinCheck.start(project.id);

      // We'll wait for completion via the progress UI, but store project ID
      // so onComplete can be called when done
      setActiveProjectId(project.id);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setIsImporting(false);
    }
  };

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // When LinkedIn check completes, transition to dashboard
  React.useEffect(() => {
    if (linkedinCheck.isComplete && activeProjectId) {
      onComplete(activeProjectId);
    }
  }, [linkedinCheck.isComplete, activeProjectId, onComplete]);

  // ============================================
  // Render
  // ============================================

  // Running state — show progress
  if (linkedinCheck.isRunning || (linkedinCheck.isComplete && activeProjectId)) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30">
            {linkedinCheck.isComplete ? (
              <Check className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            ) : (
              <Loader2 className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {linkedinCheck.isComplete ? 'LinkedIn Check Complete' : 'Checking LinkedIn Activity'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {linkedinCheck.isComplete
                ? 'Redirecting to dashboard...'
                : 'Checking each contact for recent LinkedIn posting activity...'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3">
            <div
              className="bg-violet-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${linkedinCheck.progress}%` }}
            />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {linkedinCheck.progress}% complete
          </p>

          {linkedinCheck.error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {linkedinCheck.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(['upload', 'map', 'confirm'] as ImportStep[]).map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <ChevronRight className="w-4 h-4 text-zinc-400" />}
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                s === step
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : csvHeaders.length > 0 && i < ['upload', 'map', 'confirm'].indexOf(step)
                    ? 'text-violet-500 dark:text-violet-400'
                    : 'text-zinc-400 dark:text-zinc-600'
              }`}
            >
              {s === 'upload' ? 'Upload' : s === 'map' ? 'Map Columns' : 'Confirm'}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Import Your List
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Upload a CSV with LinkedIn profile URLs to check who is posting recently
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              isDragOver
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-600'
            }`}
            onClick={() => document.getElementById('tam-csv-input')?.click()}
          >
            <input
              id="tam-csv-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {fileName ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-violet-500" />
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{fileName}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Drag & drop your CSV here, or click to browse
                </p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {uploadError}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 'map' && (
        <div className="space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Map Columns</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Match your CSV columns to the fields below. LinkedIn URL is required.
            </p>
          </div>

          {/* Column mapping dropdowns */}
          <div className="space-y-3">
            {TAM_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-zinc-700 dark:text-zinc-300 text-right shrink-0">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field.key]: e.target.value || null,
                    }))
                  }
                  className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white px-3 py-2"
                >
                  <option value="">-- skip --</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Preview (first {previewRows.length} rows)
              </h3>
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                      {TAM_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                        <th
                          key={f.key}
                          className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400"
                        >
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="border-t border-zinc-100 dark:border-zinc-800">
                        {TAM_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                          <td
                            key={f.key}
                            className="px-3 py-2 text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate"
                          >
                            {getMappedValue(row, f.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep('upload')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!linkedinMapped}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & Run */}
      {step === 'confirm' && (
        <div className="space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Confirm Import</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Review your import and start the LinkedIn activity check
            </p>
          </div>

          {/* Project name input */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={`CSV Import - ${new Date().toLocaleDateString()}`}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white px-3 py-2"
            />
          </div>

          {/* Summary stats */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Total rows in CSV</span>
              <span className="font-medium text-zinc-900 dark:text-white">{csvRows.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Contacts with LinkedIn URLs</span>
              <span className="font-medium text-violet-600 dark:text-violet-400">
                {linkedinCount}
              </span>
            </div>
            {csvRows.length - linkedinCount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-500">
                  Rows without LinkedIn URL (skipped)
                </span>
                <span className="text-zinc-500">{csvRows.length - linkedinCount}</span>
              </div>
            )}
          </div>

          {linkedinCount > 100 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Checking {linkedinCount} profiles will use Bright Data API credits. Each profile
                lookup has an associated cost.
              </p>
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {importError}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep('map')}
              disabled={isImporting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || linkedinCount === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  Import & Check LinkedIn
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TamCsvImport;
