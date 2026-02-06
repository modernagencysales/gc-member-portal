import React, { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { queryKeys } from '../../../../lib/queryClient';
import {
  createLmsWeek,
  createLmsLesson,
  createLmsContentItem,
} from '../../../../services/lms-supabase';
import { detectContentType, normalizeEmbedUrl, LmsContentType } from '../../../../types/lms-types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId: string;
  existingWeekCount: number;
}

interface ParsedRow {
  week: string;
  lesson: string;
  type: string;
  title: string;
  url: string;
  description: string;
}

interface ImportPreview {
  weeks: {
    title: string;
    lessons: {
      title: string;
      items: {
        title: string;
        type: LmsContentType;
        url: string;
        description: string;
      }[];
    }[];
  }[];
  totalWeeks: number;
  totalLessons: number;
  totalItems: number;
}

type ImportStatus = 'idle' | 'previewing' | 'importing' | 'done' | 'error';

const SAMPLE_CSV = `week,lesson,type,title,url,description
Week 1: Foundations,Getting Started,video,Welcome Video,https://www.youtube.com/watch?v=example,Introduction to the course
Week 1: Foundations,Getting Started,text,Course Overview,,This is the course overview text
Week 1: Foundations,Tool Setup,video,Setting Up Your Tools,https://www.loom.com/share/example,How to set up tools
Week 2: Outreach,Cold Email,video,Email Frameworks,https://www.youtube.com/watch?v=example2,Learn email frameworks
Week 2: Outreach,Cold Email,slide_deck,Email Templates,https://gamma.app/docs/example,Template slide deck
Week 2: Outreach,LinkedIn,video,LinkedIn Outreach,https://www.loom.com/share/example2,LinkedIn strategies`;

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  // Parse header
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const weekIdx = header.indexOf('week');
  const lessonIdx = header.indexOf('lesson');
  const typeIdx = header.indexOf('type');
  const titleIdx = header.indexOf('title');
  const urlIdx = header.indexOf('url');
  const descIdx = header.indexOf('description');

  if (weekIdx === -1 || lessonIdx === -1 || titleIdx === -1) {
    throw new Error('CSV must have "week", "lesson", and "title" columns');
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 3) continue;

    rows.push({
      week: cols[weekIdx]?.trim() || '',
      lesson: cols[lessonIdx]?.trim() || '',
      type: typeIdx !== -1 ? cols[typeIdx]?.trim() || '' : '',
      title: cols[titleIdx]?.trim() || '',
      url: urlIdx !== -1 ? cols[urlIdx]?.trim() || '' : '',
      description: descIdx !== -1 ? cols[descIdx]?.trim() || '' : '',
    });
  }

  return rows.filter((r) => r.week && r.lesson && r.title);
}

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

function buildPreview(rows: ParsedRow[]): ImportPreview {
  const weekMap = new Map<string, Map<string, ParsedRow[]>>();

  for (const row of rows) {
    if (!weekMap.has(row.week)) weekMap.set(row.week, new Map());
    const lessonMap = weekMap.get(row.week)!;
    if (!lessonMap.has(row.lesson)) lessonMap.set(row.lesson, []);
    lessonMap.get(row.lesson)!.push(row);
  }

  let totalLessons = 0;
  let totalItems = 0;

  const weeks = Array.from(weekMap.entries()).map(([weekTitle, lessonMap]) => {
    const lessons = Array.from(lessonMap.entries()).map(([lessonTitle, items]) => {
      totalLessons++;
      const mappedItems = items.map((item) => {
        totalItems++;
        const contentType: LmsContentType = item.type
          ? (item.type as LmsContentType)
          : item.url
            ? detectContentType(item.url)
            : 'text';
        return {
          title: item.title,
          type: contentType,
          url: item.url,
          description: item.description,
        };
      });
      return { title: lessonTitle, items: mappedItems };
    });
    return { title: weekTitle, lessons };
  });

  return { weeks, totalWeeks: weeks.length, totalLessons, totalItems };
}

const TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  slide_deck: 'Slides',
  guide: 'Guide',
  clay_table: 'Clay',
  ai_tool: 'AI Tool',
  text: 'Text',
  external_link: 'Link',
  credentials: 'Creds',
};

const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  cohortId,
  existingWeekCount,
}) => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<ImportStatus>('idle');
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });

  const reset = useCallback(() => {
    setStatus('idle');
    setCsvText('');
    setPreview(null);
    setError(null);
    setProgress({ current: 0, total: 0, label: '' });
  }, []);

  const handleClose = useCallback(() => {
    if (status === 'importing') return;
    reset();
    onClose();
  }, [status, reset, onClose]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      try {
        const rows = parseCsv(text);
        if (rows.length === 0) {
          setError('No valid rows found. Check that your CSV has week, lesson, and title columns.');
          setStatus('idle');
          return;
        }
        setPreview(buildPreview(rows));
        setError(null);
        setStatus('previewing');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV');
        setStatus('idle');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handlePaste = useCallback(() => {
    try {
      const rows = parseCsv(csvText);
      if (rows.length === 0) {
        setError('No valid rows found. Check that your CSV has week, lesson, and title columns.');
        return;
      }
      setPreview(buildPreview(rows));
      setError(null);
      setStatus('previewing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
  }, [csvText]);

  const handleImport = useCallback(async () => {
    if (!preview) return;

    setStatus('importing');
    setError(null);

    const total = preview.totalWeeks + preview.totalLessons + preview.totalItems;
    let current = 0;

    try {
      for (let wi = 0; wi < preview.weeks.length; wi++) {
        const week = preview.weeks[wi];
        setProgress({ current, total, label: `Creating week: ${week.title}` });

        const createdWeek = await createLmsWeek({
          cohortId,
          title: week.title,
          sortOrder: existingWeekCount + wi,
          isVisible: true,
        });
        current++;

        for (let li = 0; li < week.lessons.length; li++) {
          const lesson = week.lessons[li];
          setProgress({ current, total, label: `Creating lesson: ${lesson.title}` });

          const createdLesson = await createLmsLesson({
            weekId: createdWeek.id,
            title: lesson.title,
            sortOrder: li,
            isVisible: true,
          });
          current++;

          for (let ci = 0; ci < lesson.items.length; ci++) {
            const item = lesson.items[ci];
            setProgress({ current, total, label: `Adding: ${item.title}` });

            const embedUrl = item.url ? normalizeEmbedUrl(item.url) : undefined;
            const contentText =
              item.type === 'text' && !item.url ? item.description || item.title : undefined;

            await createLmsContentItem({
              lessonId: createdLesson.id,
              title: item.title,
              contentType: item.type,
              embedUrl: embedUrl || undefined,
              contentText,
              description: item.type !== 'text' ? item.description || undefined : undefined,
              sortOrder: ci,
              isVisible: true,
            });
            current++;
          }
        }
      }

      setProgress({ current: total, total, label: 'Done!' });
      setStatus('done');

      // Refresh curriculum
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(cohortId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStatus('error');
    }
  }, [preview, cohortId, existingWeekCount, queryClient]);

  const handleDownloadSample = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course-import-sample.csv';
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
            <h2 className="text-lg font-semibold">Import CSV</h2>
            <p className="text-sm text-zinc-500">Bulk import weeks, lessons, and content</p>
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
                  Required columns:{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">week</code>,{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">lesson</code>,{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">title</code>.
                  Optional: <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">type</code>{' '}
                  (auto-detected from URL if omitted),{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">url</code>,{' '}
                  <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">description</code>.
                </p>
                <button
                  onClick={handleDownloadSample}
                  className="mt-2 inline-flex items-center gap-1.5 text-violet-500 hover:text-violet-400 text-sm"
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
                    ? 'border-zinc-700 hover:border-violet-500 hover:bg-zinc-800/50'
                    : 'border-zinc-300 hover:border-violet-500 hover:bg-violet-50/50'
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
                placeholder="week,lesson,type,title,url,description&#10;Week 1,Getting Started,video,Welcome,https://youtube.com/...,"
                className={`w-full rounded-lg border p-3 text-sm font-mono ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600'
                    : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
              {csvText.trim() && (
                <button
                  onClick={handlePaste}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
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
            <div className="space-y-3">
              <div
                className={`flex items-center gap-4 text-sm p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}
              >
                <span>
                  <strong>{preview.totalWeeks}</strong> weeks
                </span>
                <span>
                  <strong>{preview.totalLessons}</strong> lessons
                </span>
                <span>
                  <strong>{preview.totalItems}</strong> content items
                </span>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {preview.weeks.map((week, wi) => (
                  <div
                    key={wi}
                    className={`rounded-lg border ${isDarkMode ? 'border-zinc-700' : 'border-zinc-200'}`}
                  >
                    <div
                      className={`px-3 py-2 font-medium text-sm ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'} rounded-t-lg`}
                    >
                      {week.title}
                    </div>
                    <div className="px-3 py-2 space-y-2">
                      {week.lessons.map((lesson, li) => (
                        <div key={li}>
                          <div className="text-sm font-medium text-zinc-500">{lesson.title}</div>
                          <div className="ml-4 space-y-0.5">
                            {lesson.items.map((item, ci) => (
                              <div key={ci} className="flex items-center gap-2 text-sm">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    isDarkMode
                                      ? 'bg-zinc-700 text-zinc-300'
                                      : 'bg-zinc-200 text-zinc-600'
                                  }`}
                                >
                                  {TYPE_LABELS[item.type] || item.type}
                                </span>
                                <span className="truncate">{item.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Importing progress */}
          {status === 'importing' && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                <span className="font-medium">Importing...</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-violet-500 h-2 rounded-full transition-all"
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
          {status === 'done' && preview && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium">Import complete!</p>
              <p className="text-sm text-zinc-500">
                Created {preview.totalWeeks} weeks, {preview.totalLessons} lessons, and{' '}
                {preview.totalItems} content items.
              </p>
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
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Import {preview?.totalItems} items
              </button>
            </>
          )}
          {status === 'done' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
            >
              Done
            </button>
          )}
          {status === 'error' && (
            <button
              onClick={reset}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
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

export default CsvImportModal;
