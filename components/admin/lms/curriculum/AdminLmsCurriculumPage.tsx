import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { fetchLmsCurriculumByCohort, fetchAllLmsCohorts } from '../../../../services/lms-supabase';
import { queryKeys } from '../../../../lib/queryClient';
import { useTheme } from '../../../../context/ThemeContext';
import {
  useCreateLmsWeekMutation,
  useUpdateLmsWeekMutation,
  useDeleteLmsWeekMutation,
  useReorderLmsWeeksMutation,
  useCreateLmsLessonMutation,
  useUpdateLmsLessonMutation,
  useDeleteLmsLessonMutation,
  useCreateLmsContentItemMutation,
  useUpdateLmsContentItemMutation,
  useDeleteLmsContentItemMutation,
  useCreateLmsActionItemMutation,
  useUpdateLmsActionItemMutation,
  useDeleteLmsActionItemMutation,
  useReorderLmsActionItemsMutation,
} from '../../../../hooks/useLmsMutations';
import WeekEditor from './WeekEditor';
import LmsContentItemModal from './LmsContentItemModal';
import InlineAddInput from './InlineAddInput';
import { ArrowLeft, ChevronDown, AlertCircle, Upload } from 'lucide-react';
import CsvImportModal from './CsvImportModal';

const AdminLmsCurriculumPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { cohortId } = useParams<{ cohortId: string }>();
  const navigate = useNavigate();

  // State
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [contentModal, setContentModal] = useState<{
    lessonId: string;
    weekId: string;
    contentType: 'credentials' | 'ai_tool';
  } | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries
  const { data: cohorts } = useQuery({
    queryKey: queryKeys.lmsCohorts(),
    queryFn: fetchAllLmsCohorts,
  });

  const { data: curriculum, isLoading } = useQuery({
    queryKey: queryKeys.lmsCurriculum(cohortId || ''),
    queryFn: () => fetchLmsCurriculumByCohort(cohortId || '', false),
    enabled: !!cohortId,
  });

  // Mutations
  const createWeekMutation = useCreateLmsWeekMutation();
  const updateWeekMutation = useUpdateLmsWeekMutation();
  const deleteWeekMutation = useDeleteLmsWeekMutation();
  const reorderWeeksMutation = useReorderLmsWeeksMutation();
  const createLessonMutation = useCreateLmsLessonMutation();
  const updateLessonMutation = useUpdateLmsLessonMutation();
  const deleteLessonMutation = useDeleteLmsLessonMutation();
  const createContentMutation = useCreateLmsContentItemMutation();
  const updateContentMutation = useUpdateLmsContentItemMutation();
  const deleteContentMutation = useDeleteLmsContentItemMutation();
  const createActionMutation = useCreateLmsActionItemMutation();
  const updateActionMutation = useUpdateLmsActionItemMutation();
  const deleteActionMutation = useDeleteLmsActionItemMutation();
  const reorderActionMutation = useReorderLmsActionItemsMutation();

  const selectedCohort = cohorts?.find((c) => c.id === cohortId);

  // Handlers
  const handleAddWeek = (title: string) => {
    if (!cohortId) return;
    createWeekMutation.mutate({
      cohortId,
      title,
      sortOrder: curriculum?.weeks.length || 0,
      isVisible: true,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !cohortId || !curriculum) return;

    const oldIndex = curriculum.weeks.findIndex((w) => w.id === active.id);
    const newIndex = curriculum.weeks.findIndex((w) => w.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = [...curriculum.weeks];
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);
      reorderWeeksMutation.mutate({
        weekIds: newOrder.map((w) => w.id),
        cohortId,
      });
    }
  };

  // Cohort selector
  if (!cohortId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Curriculum Editor</h1>
        <p className="text-zinc-500 mb-4">Select a cohort to edit its curriculum:</p>
        <div className="grid gap-3 max-w-md">
          {cohorts?.map((cohort) => (
            <button
              key={cohort.id}
              onClick={() => navigate(`/admin/courses/curriculum/${cohort.id}`)}
              className={`p-4 rounded-lg border text-left ${
                isDarkMode
                  ? 'border-zinc-700 hover:bg-zinc-800'
                  : 'border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <div className="font-medium">{cohort.name}</div>
              {cohort.description && (
                <div className="text-sm text-zinc-500">{cohort.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-5 h-5" />
          <span>Cohort not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/courses')}
          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{selectedCohort?.name || 'Curriculum'}</h1>
            {/* Cohort Selector */}
            <div className="relative">
              <select
                value={cohortId}
                onChange={(e) => navigate(`/admin/courses/curriculum/${e.target.value}`)}
                className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg border text-sm ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              >
                {cohorts?.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
          <p className="text-sm text-zinc-500">
            {curriculum.weeks.length} weeks •{' '}
            {curriculum.weeks.reduce((acc, w) => acc + w.lessons.length, 0)} lessons
          </p>
        </div>
        <button
          onClick={() => setShowCsvImport(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
            isDarkMode
              ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
              : 'border-zinc-300 hover:bg-zinc-50 text-zinc-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
      </div>

      {/* Weeks */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={curriculum.weeks.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {curriculum.weeks.map((week, index) => (
              <WeekEditor
                key={week.id}
                week={week}
                weekNumber={index + 1}
                isExpanded={expandedWeeks.has(week.id)}
                onToggle={() => {
                  const newExpanded = new Set(expandedWeeks);
                  if (newExpanded.has(week.id)) {
                    newExpanded.delete(week.id);
                  } else {
                    newExpanded.add(week.id);
                  }
                  setExpandedWeeks(newExpanded);
                }}
                onUpdateWeek={(title) =>
                  updateWeekMutation.mutate({ weekId: week.id, cohortId, updates: { title } })
                }
                onDeleteWeek={() => {
                  if (window.confirm(`Delete "${week.title}" and all its content?`)) {
                    deleteWeekMutation.mutate({ weekId: week.id, cohortId });
                  }
                }}
                onAddLesson={(title) =>
                  createLessonMutation.mutate({
                    lesson: {
                      weekId: week.id,
                      title,
                      sortOrder: week.lessons.length,
                      isVisible: true,
                    },
                    cohortId,
                  })
                }
                onUpdateLesson={(lessonId, title) =>
                  updateLessonMutation.mutate({
                    lessonId,
                    weekId: week.id,
                    cohortId,
                    updates: { title },
                  })
                }
                onDeleteLesson={(lessonId) => {
                  if (window.confirm('Delete this lesson and all its content?')) {
                    deleteLessonMutation.mutate({ lessonId, weekId: week.id, cohortId });
                  }
                }}
                onAddContent={(lessonId, data) =>
                  createContentMutation.mutate({
                    item: {
                      lessonId,
                      title: data.title,
                      contentType: data.contentType,
                      embedUrl: data.embedUrl,
                      contentText: data.contentText,
                      sortOrder: 0,
                      isVisible: true,
                    },
                    cohortId,
                  })
                }
                onUpdateContent={(contentId, data) =>
                  updateContentMutation.mutate({
                    itemId: contentId,
                    lessonId: '', // Not used in the mutation key anyway
                    cohortId,
                    updates: data,
                  })
                }
                onDeleteContent={(contentId) =>
                  deleteContentMutation.mutate({
                    itemId: contentId,
                    lessonId: '', // Not used in the mutation key anyway
                    cohortId,
                  })
                }
                onAddAction={(text) =>
                  createActionMutation.mutate({
                    item: {
                      weekId: week.id,
                      text,
                      sortOrder: week.actionItems.length,
                      isVisible: true,
                    },
                    cohortId,
                  })
                }
                onUpdateAction={(actionId, updates) =>
                  updateActionMutation.mutate({
                    itemId: actionId,
                    weekId: week.id,
                    cohortId,
                    updates,
                  })
                }
                onDeleteAction={(actionId) =>
                  deleteActionMutation.mutate({
                    itemId: actionId,
                    weekId: week.id,
                    cohortId,
                  })
                }
                onReorderActions={(itemIds) =>
                  reorderActionMutation.mutate({
                    itemIds,
                    weekId: week.id,
                    cohortId,
                  })
                }
                onOpenContentModal={(lessonId, contentType) =>
                  setContentModal({ lessonId, weekId: week.id, contentType })
                }
              />
            ))}

            <InlineAddInput
              onAdd={handleAddWeek}
              buttonText="Add week"
              placeholder="Week title..."
              className="p-4"
            />
          </div>
        </SortableContext>
      </DndContext>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        cohortId={cohortId}
        existingWeekCount={curriculum.weeks.length}
      />

      {/* Content Modal for credentials/AI tool */}
      {contentModal && (
        <LmsContentItemModal
          isOpen={true}
          onClose={() => setContentModal(null)}
          onSubmit={async (data) => {
            const week = curriculum.weeks.find((w) => w.id === contentModal.weekId);
            const lesson = week?.lessons.find((l) => l.id === contentModal.lessonId);
            await createContentMutation.mutateAsync({
              item: {
                ...data,
                lessonId: contentModal.lessonId,
                sortOrder: lesson?.contentItems.length || 0,
              },
              cohortId,
            });
            setContentModal(null);
          }}
          initialContentType={contentModal.contentType}
          isLoading={createContentMutation.isPending}
        />
      )}
    </div>
  );
};

export default AdminLmsCurriculumPage;
