import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { queryKeys } from '../../../../lib/queryClient';
import {
  createBootcampStudent,
  fetchAllBootcampStudents,
} from '../../../../services/bootcamp-supabase';
import { enrollStudentInCohort, fetchAllLmsCohorts } from '../../../../services/lms-supabase';
import { LmsCohort } from '../../../../types/lms-types';

interface StudentCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedStudent {
  email: string;
  name?: string;
  company?: string;
  purchaseDate?: string;
  accessLevel?: string;
  status?: string;
  notes?: string;
}

interface ImportPreview {
  students: ParsedStudent[];
  duplicateEmails: Set<string>;
  newCount: number;
  dupCount: number;
}

type ImportStatus = 'idle' | 'previewing' | 'importing' | 'done' | 'error';

const SAMPLE_CSV = `email,name,company,purchase_date,access_level,status,notes
john@example.com,John Doe,Acme Corp,2025-12-01,Full Access,Active,Previous customer
jane@example.com,Jane Smith,Beta Inc,2026-01-15,Full Access,Onboarding,New student`;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(text: string): ParsedStudent[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const emailIdx = header.indexOf('email');
  const nameIdx = header.indexOf('name');
  const companyIdx = header.indexOf('company');
  const purchaseDateIdx = header.findIndex((h) => h === 'purchase_date' || h === 'purchasedate');
  const accessIdx = header.findIndex((h) => h === 'access_level' || h === 'accesslevel');
  const statusIdx = header.indexOf('status');
  const notesIdx = header.indexOf('notes');

  if (emailIdx === -1) {
    throw new Error('CSV must have an "email" column');
  }

  const rows: ParsedStudent[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const email = cols[emailIdx]?.trim();
    if (!email) continue;

    rows.push({
      email,
      name: nameIdx !== -1 ? cols[nameIdx]?.trim() || undefined : undefined,
      company: companyIdx !== -1 ? cols[companyIdx]?.trim() || undefined : undefined,
      purchaseDate: purchaseDateIdx !== -1 ? cols[purchaseDateIdx]?.trim() || undefined : undefined,
      accessLevel: accessIdx !== -1 ? cols[accessIdx]?.trim() || undefined : undefined,
      status: statusIdx !== -1 ? cols[statusIdx]?.trim() || undefined : undefined,
      notes: notesIdx !== -1 ? cols[notesIdx]?.trim() || undefined : undefined,
    });
  }

  return rows;
}

const StudentCsvImportModal: React.FC<StudentCsvImportModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<ImportStatus>('idle');
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
  const [updateExisting, setUpdateExisting] = useState(false);
  const [targetCohortId, setTargetCohortId] = useState<string>('');
  const [importResults, setImportResults] = useState<{
    created: number;
    enrollFailed: { email: string; reason: string }[];
    failed: { email: string; reason: string }[];
  } | null>(null);

  // Fetch cohorts for enrollment selector
  const { data: cohorts } = useQuery({
    queryKey: queryKeys.lmsCohorts(),
    queryFn: fetchAllLmsCohorts,
    enabled: isOpen,
  });

  const reset = useCallback(() => {
    setStatus('idle');
    setCsvText('');
    setPreview(null);
    setError(null);
    setProgress({ current: 0, total: 0, label: '' });
    setUpdateExisting(false);
    setTargetCohortId('');
    setImportResults(null);
  }, []);

  const handleClose = useCallback(() => {
    if (status === 'importing') return;
    reset();
    onClose();
  }, [status, reset, onClose]);

  const buildPreview = useCallback(async (students: ParsedStudent[]): Promise<ImportPreview> => {
    // Fetch existing students for dedup
    const existing = await fetchAllBootcampStudents();
    const existingEmails = new Set(existing.map((s) => s.email.toLowerCase()));

    const duplicateEmails = new Set<string>();
    for (const s of students) {
      if (existingEmails.has(s.email.toLowerCase())) {
        duplicateEmails.add(s.email.toLowerCase());
      }
    }

    return {
      students,
      duplicateEmails,
      newCount: students.filter((s) => !duplicateEmails.has(s.email.toLowerCase())).length,
      dupCount: students.filter((s) => duplicateEmails.has(s.email.toLowerCase())).length,
    };
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setCsvText(text);
        try {
          const rows = parseCsv(text);
          if (rows.length === 0) {
            setError('No valid rows found. Check that your CSV has an "email" column.');
            setStatus('idle');
            return;
          }
          const p = await buildPreview(rows);
          setPreview(p);
          setError(null);
          setStatus('previewing');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to parse CSV');
          setStatus('idle');
        }
      };
      reader.readAsText(file);
    },
    [buildPreview]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handlePaste = useCallback(async () => {
    try {
      const rows = parseCsv(csvText);
      if (rows.length === 0) {
        setError('No valid rows found. Check that your CSV has an "email" column.');
        return;
      }
      const p = await buildPreview(rows);
      setPreview(p);
      setError(null);
      setStatus('previewing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
  }, [csvText, buildPreview]);

  const handleImport = useCallback(async () => {
    if (!preview) return;

    setStatus('importing');
    setError(null);

    const studentsToImport = updateExisting
      ? preview.students
      : preview.students.filter((s) => !preview.duplicateEmails.has(s.email.toLowerCase()));

    const total = studentsToImport.length;
    let current = 0;
    let created = 0;
    const failed: { email: string; reason: string }[] = [];
    const enrollFailed: { email: string; reason: string }[] = [];

    try {
      for (const student of studentsToImport) {
        current++;
        setProgress({
          current,
          total,
          label: `Importing ${student.email}`,
        });

        // Step 1: Create student
        let result;
        try {
          result = await createBootcampStudent({
            email: student.email,
            name: student.name,
            company: student.company,
            purchaseDate: student.purchaseDate ? new Date(student.purchaseDate) : undefined,
            accessLevel:
              (student.accessLevel as
                | 'Full Access'
                | 'Curriculum Only'
                | 'Lead Magnet'
                | 'Sprint + AI Tools') || 'Full Access',
            status:
              (student.status as 'Onboarding' | 'Active' | 'Completed' | 'Paused' | 'Churned') ||
              'Onboarding',
            notes: student.notes,
          });
        } catch (err) {
          failed.push({
            email: student.email,
            reason: err instanceof Error ? err.message : 'Creation failed',
          });
          continue;
        }

        created++;

        // Step 2: Enroll in cohort (separate try/catch — student already created)
        if (targetCohortId && result.id) {
          try {
            await enrollStudentInCohort(result.id, targetCohortId, {
              enrollmentSource: 'csv_import',
            });
          } catch (err) {
            enrollFailed.push({
              email: student.email,
              reason: err instanceof Error ? err.message : 'Enrollment failed',
            });
          }
        }
      }

      const results = { created, failed, enrollFailed };
      setImportResults(results);
      setProgress({
        current: total,
        total,
        label: `Created ${created}, failed ${failed.length}${enrollFailed.length ? `, ${enrollFailed.length} enrollment errors` : ''}`,
      });
      setStatus('done');

      // Refresh student list
      queryClient.invalidateQueries({ queryKey: queryKeys.bootcampAdminStudents() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStatus('error');
    }
  }, [preview, updateExisting, targetCohortId, queryClient]);

  const handleDownloadSample = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-import-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`w-full max-w-3xl mx-4 rounded-xl shadow-xl max-h-[85vh] flex flex-col ${
          isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-zinc-700' : 'border-zinc-200'}`}
        >
          <div>
            <h2 className="text-lg font-semibold">Import Students</h2>
            <p className="text-sm text-zinc-500">Bulk import students from a CSV file</p>
          </div>
          <button
            onClick={handleClose}
            disabled={status === 'importing'}
            className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Upload area */}
          {(status === 'idle' || error) && (
            <>
              {/* Format instructions */}
              <div
                className={`text-sm rounded-lg p-3 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}
              >
                <p className="font-medium mb-1">CSV format</p>
                <p className="text-zinc-500">
                  Required: <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">email</code>
                  . Optional:{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">name</code>,{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">company</code>,{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">purchase_date</code>,{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">access_level</code>,{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">status</code>,{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">notes</code>.
                </p>
                <button
                  onClick={handleDownloadSample}
                  className="mt-2 inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-400 text-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download sample CSV
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'border-zinc-700 hover:border-blue-500 hover:bg-zinc-800/50'
                    : 'border-zinc-300 hover:border-blue-500 hover:bg-blue-50/50'
                }`}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                <p className="font-medium">Drop a CSV file here or click to browse</p>
                <p className="text-sm text-zinc-500 mt-1">Supports .csv files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              {/* Or paste */}
              <div className="text-center text-sm text-zinc-500">or paste CSV text below</div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={5}
                placeholder="email,name,company,purchase_date,access_level,status,notes&#10;john@example.com,John Doe,Acme Corp,2025-12-01,Full Access,Active,Previous customer"
                className={`w-full rounded-lg border p-3 text-sm font-mono ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600'
                    : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {csvText.trim() && (
                <button
                  onClick={handlePaste}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Parse CSV
                </button>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-red-500 text-sm p-3 rounded-lg bg-red-500/10">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview */}
          {status === 'previewing' && preview && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-4 text-sm p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}
              >
                <span>
                  <strong>{preview.newCount}</strong> new students
                </span>
                {preview.dupCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <strong>{preview.dupCount}</strong> duplicates
                  </span>
                )}
              </div>

              {/* Duplicate handling */}
              {preview.dupCount > 0 && (
                <label
                  className={`flex items-center gap-2 text-sm p-3 rounded-lg cursor-pointer ${
                    isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span>
                    Include duplicates (attempt to create — existing emails will be skipped)
                  </span>
                </label>
              )}

              {/* Target cohort */}
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
                <label className="block text-sm font-medium mb-1">
                  Auto-enroll in cohort (optional)
                </label>
                <select
                  value={targetCohortId}
                  onChange={(e) => setTargetCohortId(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    isDarkMode
                      ? 'bg-zinc-700 border-zinc-600 text-white'
                      : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                >
                  <option value="">No auto-enrollment</option>
                  {cohorts
                    ?.filter((c: LmsCohort) => c.status === 'Active')
                    .map((c: LmsCohort) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Student list preview */}
              <div className="max-h-[30vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead
                    className={`text-xs uppercase sticky top-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}
                  >
                    <tr>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Company</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {preview.students.map((s, i) => {
                      const isDup = preview.duplicateEmails.has(s.email.toLowerCase());
                      return (
                        <tr key={i} className={isDup ? 'opacity-50' : ''}>
                          <td className="px-3 py-1.5">
                            {s.email}
                            {isDup && (
                              <span className="ml-1.5 text-xs text-amber-500">(duplicate)</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">{s.name || '-'}</td>
                          <td className="px-3 py-1.5">{s.company || '-'}</td>
                          <td className="px-3 py-1.5 text-center">{s.status || 'Onboarding'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Importing progress */}
          {status === 'importing' && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="font-medium">Importing...</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-sm text-zinc-500">
                {progress.current} / {progress.total} — {progress.label}
              </p>
            </div>
          )}

          {/* Done */}
          {status === 'done' && importResults && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="text-lg font-medium">Import complete!</p>
                <p className="text-sm text-zinc-500">{progress.label}</p>
              </div>

              {/* Failed creations */}
              {importResults.failed.length > 0 && (
                <div
                  className={`rounded-lg p-3 text-sm ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}
                >
                  <p className="font-medium text-red-500 mb-1">
                    Failed to create ({importResults.failed.length}):
                  </p>
                  <ul className="space-y-0.5 text-red-400">
                    {importResults.failed.map((f, i) => (
                      <li key={i}>
                        {f.email} — {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enrollment failures */}
              {importResults.enrollFailed.length > 0 && (
                <div
                  className={`rounded-lg p-3 text-sm ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'}`}
                >
                  <p className="font-medium text-amber-500 mb-1">
                    Created but enrollment failed ({importResults.enrollFailed.length}):
                  </p>
                  <ul className="space-y-0.5 text-amber-400">
                    {importResults.enrollFailed.map((f, i) => (
                      <li key={i}>
                        {f.email} — {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${isDarkMode ? 'border-zinc-700' : 'border-zinc-200'}`}
        >
          {status === 'previewing' && (
            <>
              <button
                onClick={reset}
                className={`px-4 py-2 rounded-lg text-sm ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Import {updateExisting ? preview?.students.length : preview?.newCount} students
              </button>
            </>
          )}
          {status === 'done' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Done
            </button>
          )}
          {status === 'error' && (
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Try again
            </button>
          )}
          {status === 'idle' && (
            <button
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCsvImportModal;
