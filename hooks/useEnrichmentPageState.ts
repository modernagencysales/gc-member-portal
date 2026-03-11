/**
 * useEnrichmentPageState.ts
 * Page-level state and callbacks for the Email Enrichment wizard.
 * Manages the 4-step flow: upload → map → processing → results.
 * Constraint: no rendering, no DOM access. Named distinctly from useEmailEnrichment.ts.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  createBatchRun,
  insertBatchLeads,
  fetchBatchLeads,
  fetchBatchRunsByUser,
  type BatchRun,
  type BatchLead,
} from '../services/enrichment-batch-supabase';
import { parseCsv } from '../lib/csv-parser';
import { useEmailEnrichment } from './useEmailEnrichment';
import { logError } from '../lib/logError';
import {
  ALL_FIELDS,
  FIELD_CONFIG,
  EMPTY_COLUMN_MAP,
  type EnrichmentField,
  type EnrichmentStep,
} from '../components/bootcamp/email-enrichment/enrichment-types';

// Re-export for consumers that only import from this hook
export type { EnrichmentField, EnrichmentStep };

// ─── Return Type ──────────────────────────────────────────────────────────────

export interface EnrichmentPageState {
  step: EnrichmentStep;
  csvHeaders: string[];
  csvRows: Record<string, string>[];
  columnMap: Record<EnrichmentField, string>;
  fileName: string;
  uploadError: string | null;
  results: BatchLead[];
  pastRuns: BatchRun[];
  showPastRuns: boolean;
  isSubmitting: boolean;
  isMapValid: boolean;
  enrichment: ReturnType<typeof useEmailEnrichment>;
  setColumnMap: React.Dispatch<React.SetStateAction<Record<EnrichmentField, string>>>;
  setShowPastRuns: React.Dispatch<React.SetStateAction<boolean>>;
  handleFile: (file: File) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStartEnrichment: () => Promise<void>;
  handleShowPastRuns: () => Promise<void>;
  handleViewRun: (run: BatchRun) => Promise<void>;
  handleDownload: () => void;
  handleReset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEnrichmentPageState(userId: string): EnrichmentPageState {
  const [step, setStep] = useState<EnrichmentStep>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<EnrichmentField, string>>(EMPTY_COLUMN_MAP);
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [_runId, setRunId] = useState<string | null>(null);
  const [results, setResults] = useState<BatchLead[]>([]);
  const [pastRuns, setPastRuns] = useState<BatchRun[]>([]);
  const [showPastRuns, setShowPastRuns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enrichment = useEmailEnrichment();

  // ─── Validation ─────────────────────────────────────────────────────────────

  const isMapValid = useMemo(() => {
    return (
      !!columnMap.first_name &&
      !!columnMap.last_name &&
      (!!columnMap.company_domain || !!columnMap.linkedin_url)
    );
  }, [columnMap]);

  // ─── Upload callbacks ────────────────────────────────────────────────────────

  const autoDetectMappings = useCallback((headers: string[]) => {
    const mapping: Record<EnrichmentField, string> = { ...EMPTY_COLUMN_MAP };
    for (const field of ALL_FIELDS) {
      const config = FIELD_CONFIG[field];
      const match = headers.find((h) =>
        config.hints.some((hint) => h.toLowerCase().trim() === hint)
      );
      if (match) mapping[field] = match;
    }
    setColumnMap(mapping);
  }, []);

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

  // ─── Enrichment callbacks ────────────────────────────────────────────────────

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

      const resultLeads = await fetchBatchLeads(run.id);
      setResults(resultLeads);
      setStep('results');
    } catch (err) {
      logError('useEnrichmentPageState.handleStartEnrichment', err, { userId, fileName });
      setUploadError(err instanceof Error ? err.message : 'Failed to start enrichment');
    } finally {
      setIsSubmitting(false);
    }
  }, [isMapValid, csvRows, columnMap, userId, fileName, enrichment]);

  const handleShowPastRuns = useCallback(async () => {
    try {
      const runs = await fetchBatchRunsByUser(userId);
      setPastRuns(runs);
      setShowPastRuns(true);
    } catch (err) {
      logError('useEnrichmentPageState.handleShowPastRuns', err, { userId });
    }
  }, [userId]);

  const handleViewRun = useCallback(async (run: BatchRun) => {
    setRunId(run.id);
    const leads = await fetchBatchLeads(run.id);
    setResults(leads);
    setStep('results');
    setShowPastRuns(false);
  }, []);

  // ─── Download & Reset ────────────────────────────────────────────────────────

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

  const handleReset = useCallback(() => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMap(EMPTY_COLUMN_MAP);
    setFileName('');
    setUploadError(null);
    setRunId(null);
    setResults([]);
    setShowPastRuns(false);
  }, []);

  // ─── Return ──────────────────────────────────────────────────────────────────

  return {
    step,
    csvHeaders,
    csvRows,
    columnMap,
    fileName,
    uploadError,
    results,
    pastRuns,
    showPastRuns,
    isSubmitting,
    isMapValid,
    enrichment,
    setColumnMap,
    setShowPastRuns,
    handleFile,
    handleDrop,
    handleFileInput,
    handleStartEnrichment,
    handleShowPastRuns,
    handleViewRun,
    handleDownload,
    handleReset,
  };
}
