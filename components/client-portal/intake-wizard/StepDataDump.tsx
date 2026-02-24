import React, { useCallback, useRef, useState } from 'react';
import { SUGGESTED_DOCUMENTS } from '../../../types/dfy-intake-types';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_TYPES = '.pdf,.docx,.txt,.mp3,.mp4,.wav,.pptx';

interface StepDataDumpProps {
  files: File[];
  rawTextDump: string;
  onFilesChange: (files: File[]) => void;
  onTextChange: (text: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const StepDataDump: React.FC<StepDataDumpProps> = ({
  files,
  rawTextDump,
  onFilesChange,
  onTextChange,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: ArrayLike<File>) => {
      const newFiles = Array.from(incoming);
      const errors: string[] = [];
      const valid: File[] = [];

      for (const f of newFiles) {
        if (files.length + valid.length >= MAX_FILES) {
          errors.push(`Maximum ${MAX_FILES} files allowed. Some files were skipped.`);
          break;
        }
        if (f.size > MAX_FILE_SIZE) {
          errors.push(`"${f.name}" exceeds 25MB and was skipped.`);
          continue;
        }
        valid.push(f);
      }

      setFileErrors(errors);
      if (valid.length > 0) {
        onFilesChange([...files, ...valid]);
      }
    },
    [files, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
      setFileErrors([]);
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
        Give us everything you've got
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
        Don't worry about organizing it -- just dump it. We'll sort through it all with AI and pull
        out what matters.
      </p>

      {/* File upload zone */}
      <div className="mb-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
          }`}
        >
          <svg
            className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-500 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Drag & drop files here, or{' '}
            <span className="text-violet-500 dark:text-violet-400 font-medium">browse</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1.5">
            PDF, Word, Text, Audio, Video, PowerPoint -- up to 25MB each, 10 files max
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* File errors */}
        {fileErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            {fileErrors.map((err, i) => (
              <p key={i} className="text-xs text-amber-600 dark:text-amber-400">
                {err}
              </p>
            ))}
          </div>
        )}

        {/* Uploaded files list */}
        {files.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between text-sm text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/50 rounded-md px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate">
                    {f.name}{' '}
                    <span className="text-xs text-gray-400 dark:text-zinc-500">
                      ({formatFileSize(f.size)})
                    </span>
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="flex-shrink-0 ml-2 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
                  aria-label={`Remove ${f.name}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Suggested documents */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2.5">
          Some ideas of what to include:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_DOCUMENTS.map((doc) => (
            <span
              key={doc}
              className="inline-block px-2.5 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            >
              {doc}
            </span>
          ))}
        </div>
      </div>

      {/* Large paste textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2">
          Or just paste it here
        </label>
        <textarea
          value={rawTextDump}
          onChange={(e) => onTextChange(e.target.value)}
          rows={8}
          placeholder="Or just paste anything here -- raw notes, bullet points, links to Google Docs, Loom videos, whatever you've got. More is better."
          className="w-full text-sm bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
        />
      </div>
    </div>
  );
};

export default StepDataDump;
