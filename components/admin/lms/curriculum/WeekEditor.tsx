import React, { useState } from 'react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from '../../../../context/ThemeContext';
import { LmsWeekWithLessons, LmsContentType, LmsActionItem } from '../../../../types/lms-types';
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  GripVertical,
  Video,
  FileText,
  Link,
  Key,
  Bot,
  Table,
  Presentation,
  BookOpen,
  EyeOff,
} from 'lucide-react';
import InlineInput from './InlineInput';
import InlineAddInput from './InlineAddInput';
import SmartUrlInput from './SmartUrlInput';

interface WeekEditorProps {
  week: LmsWeekWithLessons;
  weekNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateWeek: (title: string) => void;
  onDeleteWeek: () => void;
  onAddLesson: (title: string) => void;
  onUpdateLesson: (lessonId: string, title: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onAddContent: (
    lessonId: string,
    data: { title: string; contentType: LmsContentType; embedUrl?: string; contentText?: string }
  ) => void;
  onUpdateContent: (contentId: string, data: { title?: string; embedUrl?: string }) => void;
  onDeleteContent: (contentId: string) => void;
  onAddAction: (text: string) => void;
  onUpdateAction: (actionId: string, updates: { text?: string; videoUrl?: string }) => void;
  onDeleteAction: (actionId: string) => void;
  onReorderActions: (itemIds: string[]) => void;
  onOpenContentModal: (lessonId: string, contentType: 'credentials' | 'ai_tool') => void;
}

const getContentTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video className="w-3.5 h-3.5" />;
    case 'slide_deck':
      return <Presentation className="w-3.5 h-3.5" />;
    case 'guide':
      return <BookOpen className="w-3.5 h-3.5" />;
    case 'clay_table':
      return <Table className="w-3.5 h-3.5" />;
    case 'ai_tool':
      return <Bot className="w-3.5 h-3.5" />;
    case 'text':
      return <FileText className="w-3.5 h-3.5" />;
    case 'external_link':
      return <Link className="w-3.5 h-3.5" />;
    case 'credentials':
      return <Key className="w-3.5 h-3.5" />;
    default:
      return <FileText className="w-3.5 h-3.5" />;
  }
};

// Sortable action item component
interface SortableActionItemProps {
  action: LmsActionItem;
  isDarkMode: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onUpdateAction: (updates: { text?: string; videoUrl?: string }) => void;
  onDeleteAction: () => void;
}

const SortableActionItem: React.FC<SortableActionItemProps> = ({
  action,
  isDarkMode,
  isHovered,
  onHover,
  onUpdateAction,
  onDeleteAction,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-2 ${
        isDarkMode ? 'border-zinc-700 bg-zinc-800/30' : 'border-zinc-200 bg-zinc-50'
      }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 text-zinc-400 hover:text-zinc-600"
        >
          <GripVertical className="w-3 h-3" />
        </button>
        <span className="text-zinc-400">☐</span>
        <InlineInput
          value={action.text}
          onSave={(text) => onUpdateAction({ text })}
          className="flex-1 text-sm"
        />
        {isHovered && (
          <button onClick={onDeleteAction} className="p-0.5 text-red-500 hover:text-red-600">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5 ml-6">
        <Video className="w-3 h-3 text-zinc-400" />
        <InlineInput
          value={action.videoUrl || ''}
          onSave={(videoUrl) => onUpdateAction({ videoUrl: videoUrl || undefined })}
          placeholder="Loom/video URL (optional)"
          className="flex-1 text-xs text-zinc-500"
        />
      </div>
    </div>
  );
};

const WeekEditor: React.FC<WeekEditorProps> = ({
  week,
  weekNumber,
  isExpanded,
  onToggle,
  onUpdateWeek,
  onDeleteWeek,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAddContent,
  onUpdateContent,
  onDeleteContent,
  onAddAction,
  onUpdateAction,
  onDeleteAction,
  onReorderActions,
  onOpenContentModal,
}) => {
  const { isDarkMode } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: week.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Sensors for action item drag-and-drop
  const actionSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleActionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = week.actionItems.findIndex((a) => a.id === active.id);
    const newIndex = week.actionItems.findIndex((a) => a.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(week.actionItems, oldIndex, newIndex);
      onReorderActions(newOrder.map((a) => a.id));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      {/* Week Header */}
      <div
        className={`flex items-center gap-2 p-4 ${
          isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'
        }`}
        onMouseEnter={() => setHoveredItem('week')}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-zinc-400 hover:text-zinc-600"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <button onClick={onToggle} className="p-1">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Week {weekNumber}:
        </span>

        <InlineInput value={week.title} onSave={onUpdateWeek} className="font-semibold flex-1" />

        {!week.isVisible && <EyeOff className="w-4 h-4 text-zinc-400" />}

        {hoveredItem === 'week' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteWeek();
            }}
            className="p-1 text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={`border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          {/* Lessons */}
          <div className="p-4 space-y-3">
            {week.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`rounded-lg border ${
                  isDarkMode ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'
                }`}
                onMouseEnter={() => setHoveredItem(`lesson-${lesson.id}`)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Lesson Header */}
                <div className="flex items-center gap-2 p-3">
                  <GripVertical className="w-3.5 h-3.5 text-zinc-400 cursor-grab" />
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <InlineInput
                    value={lesson.title}
                    onSave={(title) => onUpdateLesson(lesson.id, title)}
                    className="font-medium text-sm flex-1"
                  />
                  {hoveredItem === `lesson-${lesson.id}` && (
                    <button
                      onClick={() => onDeleteLesson(lesson.id)}
                      className="p-1 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Content Items */}
                <div
                  className={`px-3 pb-3 space-y-1 ${lesson.contentItems.length > 0 ? 'pt-0' : ''}`}
                >
                  {lesson.contentItems.map((content) => (
                    <div
                      key={content.id}
                      className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm ${
                        isDarkMode ? 'hover:bg-zinc-700/50' : 'hover:bg-zinc-100'
                      }`}
                      onMouseEnter={() => setHoveredItem(`content-${content.id}`)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <GripVertical className="w-3 h-3 text-zinc-400 cursor-grab" />
                      <span className="text-zinc-400">
                        {getContentTypeIcon(content.contentType)}
                      </span>
                      <InlineInput
                        value={content.title}
                        onSave={(title) => onUpdateContent(content.id, { title })}
                        className="flex-1"
                      />
                      {content.embedUrl && (
                        <InlineInput
                          value={content.embedUrl}
                          onSave={(embedUrl) => onUpdateContent(content.id, { embedUrl })}
                          className="text-xs text-zinc-400 max-w-[200px] truncate"
                        />
                      )}
                      {hoveredItem === `content-${content.id}` && (
                        <button
                          onClick={() => onDeleteContent(content.id)}
                          className="p-0.5 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <SmartUrlInput
                      onAdd={(data) => onAddContent(lesson.id, data)}
                      className="flex-1"
                    />
                    <button
                      onClick={() => onOpenContentModal(lesson.id, 'credentials')}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      + Credentials
                    </button>
                    <button
                      onClick={() => onOpenContentModal(lesson.id, 'ai_tool')}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      + AI Tool
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <InlineAddInput
              onAdd={onAddLesson}
              buttonText="Add lesson"
              placeholder="Lesson title..."
            />
          </div>

          {/* Action Items */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Action Items
            </h4>
            <DndContext
              sensors={actionSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleActionDragEnd}
            >
              <SortableContext
                items={week.actionItems.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {week.actionItems.map((action) => (
                    <SortableActionItem
                      key={action.id}
                      action={action}
                      isDarkMode={isDarkMode}
                      isHovered={hoveredItem === `action-${action.id}`}
                      onHover={(hovered) => setHoveredItem(hovered ? `action-${action.id}` : null)}
                      onUpdateAction={(updates) => onUpdateAction(action.id, updates)}
                      onDeleteAction={() => onDeleteAction(action.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="mt-2">
              <InlineAddInput
                onAdd={onAddAction}
                buttonText="Add action item"
                placeholder="Action item text..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekEditor;
