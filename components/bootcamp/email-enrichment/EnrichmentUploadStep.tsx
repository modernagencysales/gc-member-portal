/**
 * EnrichmentUploadStep.tsx
 * Step 1 of the Email Enrichment wizard: drag-drop CSV upload zone.
 * Constraint: no data fetching, no enrichment logic — pure rendering + file selection.
 */

import React from 'react';
import { Upload, AlertCircle } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  uploadError: string | null;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EnrichmentUploadStep: React.FC<Props> = ({ uploadError, onDrop, onFileInput }) => {
  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-12 text-center hover:border-violet-400 dark:hover:border-violet-600 transition-colors cursor-pointer"
    >
      <input type="file" accept=".csv" onChange={onFileInput} className="hidden" id="csv-upload" />
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
  );
};

export default EnrichmentUploadStep;
