/** ResourceFilesSection. File upload/download/delete for engagement resource files. */
import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2, Upload, FileText, Download, Trash2 } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { queryKeys } from '../../../../lib/queryClient';
import {
  fetchEngagementFiles,
  createEngagementFileRecord,
  deleteEngagementFile,
  uploadAdminFileToStorage,
} from '../../../../services/dfy-admin-supabase';

import type { DfyIntakeFile } from '../../../../types/dfy-admin-types';

// ─── Constants ─────────────────────────────────────────
export const ALLOWED_FILE_EXTENSIONS = new Set([
  '.pdf',
  '.txt',
  '.docx',
  '.pptx',
  '.mp3',
  '.wav',
  '.mp4',
  '.csv',
  '.xlsx',
  '.xls',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
]);

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '\u2014';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Types ─────────────────────────────────────────────
export interface ResourceFilesSectionProps {
  engagementId: string;
}

// ─── Component ─────────────────────────────────────────
export default function ResourceFilesSection({ engagementId }: ResourceFilesSectionProps) {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: queryKeys.dfyIntakeFiles(engagementId),
    queryFn: () => fetchEngagementFiles(engagementId),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deleteEngagementFile(engagementId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyIntakeFiles(engagementId) });
    },
  });

  // ─── Handlers ──────────────────────────────────────────
  const handleUpload = async (fileList: globalThis.FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    setUploading(true);

    try {
      const errors: string[] = [];
      for (const file of Array.from(fileList)) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
          errors.push(`Unsupported file type: ${ext}`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`File too large (max 50MB): ${file.name}`);
          continue;
        }

        const { storage_path } = await uploadAdminFileToStorage(engagementId, file);
        await createEngagementFileRecord(engagementId, {
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          storage_path,
          file_size: file.size,
        });
      }
      if (errors.length > 0) {
        setUploadError(errors.join('; '));
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dfyIntakeFiles(engagementId) });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Resource Files
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-1.5 text-xs font-medium ${
            isDarkMode
              ? 'text-violet-400 hover:text-violet-300'
              : 'text-violet-600 hover:text-violet-700'
          } disabled:opacity-50`}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Upload Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={Array.from(ALLOWED_FILE_EXTENSIONS).join(',')}
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {uploadError && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{uploadError}</p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed transition-colors mb-4 ${
          dragOver
            ? 'border-violet-500 bg-violet-500/10'
            : isDarkMode
              ? 'border-zinc-700 hover:border-zinc-600'
              : 'border-zinc-300 hover:border-zinc-400'
        } ${files.length === 0 ? 'p-8' : 'p-3'}`}
      >
        {files.length === 0 && !isLoading ? (
          <div className="text-center">
            <Upload
              className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
            />
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Drop files here or click Upload
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
              PDF, DOCX, TXT, PPTX, audio, video, images
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file: DfyIntakeFile) => (
              <div
                key={file.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText
                    className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}
                    >
                      {file.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {formatFileSize(file.file_size)}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          file.uploaded_by === 'admin'
                            ? 'bg-violet-500/10 text-violet-400'
                            : isDarkMode
                              ? 'bg-zinc-700 text-zinc-400'
                              : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {file.uploaded_by === 'admin' ? 'Admin' : 'Client'}
                      </span>
                      {file.processed && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                          Processed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {file.signed_url && (
                    <a
                      href={file.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDarkMode
                          ? 'hover:bg-zinc-700 text-zinc-400'
                          : 'hover:bg-zinc-200 text-zinc-500'
                      }`}
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {file.uploaded_by === 'admin' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${file.file_name}"?`)) {
                          deleteMutation.mutate(file.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDarkMode
                          ? 'hover:bg-red-500/10 text-zinc-500 hover:text-red-400'
                          : 'hover:bg-red-50 text-zinc-400 hover:text-red-500'
                      } disabled:opacity-50`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
