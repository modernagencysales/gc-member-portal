import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Download, AlertCircle, CheckCircle2, Loader2, Video, VideoOff } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { queryKeys } from '../../../../lib/queryClient';
import {
  fetchAllLmsCohorts,
  fetchLmsCurriculumByCohort,
  importCurriculumFromCohort,
} from '../../../../services/lms-supabase';
import { LmsCohort, LmsContentType } from '../../../../types/lms-types';

interface ImportCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCohortId: string;
  targetCohortName: string;
  existingWeekCount: number;
}

type ImportStatus = 'select' | 'preview' | 'importing' | 'done' | 'error';

const TYPE_LABELS: Record<LmsContentType, string> = {
  video: 'Video',
  slide_deck: 'Slides',
  guide: 'Guide',
  clay_table: 'Clay',
  ai_tool: 'AI Tool',
  text: 'Text',
  external_link: 'Link',
  credentials: 'Creds',
  sop_link: 'SOP',
};

const ImportCurriculumModal: React.FC<ImportCurriculumModalProps> = ({
  isOpen,
  onClose,
  targetCohortId,
  targetCohortName,
  existingWeekCount,
}) => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<ImportStatus>('select');
  const [sourceCohortId, setSourceCohortId] = useState('');
  const [excludeRecordings, setExcludeRecordings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
  const [result, setResult] = useState<{
    weeks: number;
    lessons: number;
    content: number;
    actions: number;
  } | null>(null);

  // Fetch all cohorts for the picker
  const { data: cohorts } = useQuery({
    queryKey: queryKeys.lmsCohorts(),
    queryFn: fetchAllLmsCohorts,
    enabled: isOpen,
  });

  // Fetch source curriculum for preview
  const { data: sourceCurriculum, isLoading: isLoadingPreview } = useQuery({
    queryKey: queryKeys.lmsCurriculum(sourceCohortId),
    queryFn: () => fetchLmsCurriculumByCohort(sourceCohortId, false),
    enabled: !!sourceCohortId && status === 'preview',
  });

  const availableCohorts = cohorts?.filter((c: LmsCohort) => c.id !== targetCohortId) || [];

  const reset = useCallback(() => {
    setStatus('select');
    setSourceCohortId('');
    setExcludeRecordings(true);
    setError(null);
    setProgress({ current: 0, total: 0, label: '' });
    setResult(null);
  }, []);

  const handleClose = useCallback(() => {
    if (status === 'importing') return;
    reset();
    onClose();
  }, [status, reset, onClose]);

  const handleSelectSource = useCallback(() => {
    if (!sourceCohortId) return;
    setStatus('preview');
  }, [sourceCohortId]);

  const handleImport = useCallback(async () => {
    if (!sourceCohortId) return;
    setStatus('importing');
    setError(null);

    try {
      const importResult = await importCurriculumFromCohort({
        sourceCohortId,
        targetCohortId,
        excludeRecordings,
        onProgress: (current, total, label) => {
          setProgress({ current, total, label });
        },
      });

      setResult({
        weeks: importResult.weeksCreated,
        lessons: importResult.lessonsCreated,
        content: importResult.contentItemsCreated,
        actions: importResult.actionItemsCreated,
      });
      setStatus('done');
      queryClient.invalidateQueries({ queryKey: queryKeys.lmsCurriculum(targetCohortId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStatus('error');
    }
  }, [sourceCohortId, targetCohortId, excludeRecordings, queryClient]);

  // Preview stats
  const previewStats = sourceCurriculum
    ? (() => {
        let weeks = 0;
        let lessons = 0;
        let content = 0;
        let actions = 0;
        let skippedLessons = 0;
        let skippedContent = 0;

        for (const week of sourceCurriculum.weeks) {
          weeks++;
          for (const lesson of week.lessons) {
            const isRecordingOnly =
              lesson.title.toLowerCase().includes('recording') &&
              lesson.contentItems.length > 0 &&
              lesson.contentItems.every((ci) => ci.contentType === 'video');

            if (excludeRecordings && isRecordingOnly) {
              skippedLessons++;
              skippedContent += lesson.contentItems.length;
              continue;
            }
            lessons++;
            for (const ci of lesson.contentItems) {
              if (excludeRecordings && ci.contentType === 'video') {
                skippedContent++;
                continue;
              }
              content++;
            }
          }
          actions += week.actionItems.length;
        }

        return { weeks, lessons, content, actions, skippedLessons, skippedContent };
      })()
    : null;

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
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
          }`}
        >
          <div>
            <h2 className="text-lg font-semibold">Import Curriculum</h2>
            <p className="text-sm text-zinc-500">
              Copy content from another cohort into {targetCohortName}
            </p>
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
          {/* Step 1: Select source */}
          {status === 'select' && (
            <>
              <div>
                <label
                  className={`block text-sm font-medium mb-1.5 ${
                    isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                  }`}
                >
                  Import from
                </label>
                <select
                  value={sourceCohortId}
                  onChange={(e) => setSourceCohortId(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 text-white'
                      : 'bg-white border-zinc-300 text-zinc-900'
                  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                >
                  <option value="">Select a cohort...</option>
                  {availableCohorts.map((c: LmsCohort) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Exclude recordings toggle */}
              <label
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={excludeRecordings}
                  onChange={(e) => setExcludeRecordings(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                />
                <div className="flex items-center gap-2">
                  {excludeRecordings ? (
                    <VideoOff className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <Video className="w-4 h-4 text-violet-500" />
                  )}
                  <div>
                    <span className="text-sm font-medium">Exclude weekly recordings</span>
                    <p className="text-xs text-zinc-500">
                      Skip video recordings so you can add your own cohort-specific ones
                    </p>
                  </div>
                </div>
              </label>

              {existingWeekCount > 0 && (
                <div className="flex items-start gap-2 text-amber-500 text-sm p-3 rounded-lg bg-amber-500/10">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    This cohort already has {existingWeekCount} week
                    {existingWeekCount !== 1 ? 's' : ''}. Imported content will be added after
                    existing weeks.
                  </span>
                </div>
              )}
            </>
          )}

          {/* Step 2: Preview */}
          {status === 'preview' && (
            <>
              {isLoadingPreview ? (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  <span className="text-zinc-500">Loading curriculum...</span>
                </div>
              ) : sourceCurriculum && previewStats ? (
                <div className="space-y-3">
                  {/* Stats bar */}
                  <div
                    className={`flex items-center gap-4 text-sm p-3 rounded-lg ${
                      isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                    }`}
                  >
                    <span>
                      <strong>{previewStats.weeks}</strong> weeks
                    </span>
                    <span>
                      <strong>{previewStats.lessons}</strong> lessons
                    </span>
                    <span>
                      <strong>{previewStats.content}</strong> content items
                    </span>
                    <span>
                      <strong>{previewStats.actions}</strong> action items
                    </span>
                  </div>

                  {excludeRecordings &&
                    (previewStats.skippedLessons > 0 || previewStats.skippedContent > 0) && (
                      <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-violet-500/10 text-violet-400">
                        <VideoOff className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>
                          Excluding {previewStats.skippedContent} recording
                          {previewStats.skippedContent !== 1 ? 's' : ''}
                          {previewStats.skippedLessons > 0 &&
                            ` and ${previewStats.skippedLessons} recording-only lesson${previewStats.skippedLessons !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}

                  {/* Content preview */}
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                    {sourceCurriculum.weeks.map((week) => (
                      <div
                        key={week.id}
                        className={`rounded-lg border ${
                          isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
                        }`}
                      >
                        <div
                          className={`px-3 py-2 font-medium text-sm ${
                            isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                          } rounded-t-lg`}
                        >
                          {week.title}
                          {week.actionItems.length > 0 && (
                            <span className="text-zinc-500 font-normal ml-2">
                              ({week.actionItems.length} action items)
                            </span>
                          )}
                        </div>
                        <div className="px-3 py-2 space-y-2">
                          {week.lessons.map((lesson) => {
                            const isRecordingOnly =
                              lesson.title.toLowerCase().includes('recording') &&
                              lesson.contentItems.length > 0 &&
                              lesson.contentItems.every((ci) => ci.contentType === 'video');
                            const isSkipped = excludeRecordings && isRecordingOnly;

                            return (
                              <div key={lesson.id} className={isSkipped ? 'opacity-40' : ''}>
                                <div className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                                  {lesson.title}
                                  {isSkipped && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
                                      skipped
                                    </span>
                                  )}
                                </div>
                                <div className="ml-4 space-y-0.5">
                                  {lesson.contentItems.map((ci) => {
                                    const isVideoSkipped =
                                      excludeRecordings && ci.contentType === 'video';
                                    return (
                                      <div
                                        key={ci.id}
                                        className={`flex items-center gap-2 text-sm ${isVideoSkipped ? 'opacity-40 line-through' : ''}`}
                                      >
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                            isDarkMode
                                              ? 'bg-zinc-700 text-zinc-300'
                                              : 'bg-zinc-200 text-zinc-600'
                                          }`}
                                        >
                                          {TYPE_LABELS[ci.contentType] || ci.contentType}
                                        </span>
                                        <span className="truncate">{ci.title}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-500 text-sm py-4">
                  <AlertCircle className="w-4 h-4" />
                  <span>No curriculum found in the selected cohort.</span>
                </div>
              )}
            </>
          )}

          {/* Importing progress */}
          {status === 'importing' && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                <span className="font-medium">Importing curriculum...</span>
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
          {status === 'done' && result && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium">Import complete!</p>
              <p className="text-sm text-zinc-500">
                Created {result.weeks} weeks, {result.lessons} lessons, {result.content} content
                items, and {result.actions} action items.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-red-500 text-sm p-3 rounded-lg bg-red-500/10">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
            isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
          }`}
        >
          {status === 'select' && (
            <>
              <button
                onClick={handleClose}
                className={`px-4 py-2 rounded-lg text-sm ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSelectSource}
                disabled={!sourceCohortId}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Preview Import
              </button>
            </>
          )}
          {status === 'preview' && (
            <>
              <button
                onClick={() => setStatus('select')}
                className={`px-4 py-2 rounded-lg text-sm ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={!sourceCurriculum || !previewStats || previewStats.content === 0}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Import {previewStats?.content || 0} items
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
            <>
              <button
                onClick={reset}
                className={`px-4 py-2 rounded-lg text-sm ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
              >
                Try again
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportCurriculumModal;
