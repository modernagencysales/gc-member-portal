import React, { useState, useMemo } from 'react';
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
import { useAITools } from '../../../../hooks/useChatHistory';
import {
  useCreateAIToolMutation,
  useUpdateAIToolMutation,
  useDeleteAIToolMutation,
  useBulkUpdateAIToolsMutation,
  useReorderAIToolsMutation,
} from '../../../../hooks/useChatMutation';
import { AITool, AIToolInput, formatCategoryLabel } from '../../../../types/chat-types';
import AIToolModal from './AIToolModal';
import BulkEditModal from './BulkEditModal';
import {
  Plus,
  Search,
  RefreshCw,
  Bot,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Settings2,
  GripVertical,
} from 'lucide-react';

// Sortable table row component
interface SortableToolRowProps {
  tool: AITool;
  isDarkMode: boolean;
  isSelected: boolean;
  copiedSlug: string | null;
  onSelect: () => void;
  onCopySlug: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableToolRow: React.FC<SortableToolRowProps> = ({
  tool,
  isDarkMode,
  isSelected,
  copiedSlug,
  onSelect,
  onCopySlug,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tool.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'} ${
        isSelected ? (isDarkMode ? 'bg-violet-900/20' : 'bg-violet-50') : ''
      }`}
    >
      <td className="px-2 py-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="px-2 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDarkMode ? 'bg-violet-900/30' : 'bg-violet-100'
            }`}
          >
            <Bot className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="font-medium">{tool.name}</p>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {tool.description || 'No description'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={onCopySlug}
          className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono ${
            isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'
          }`}
          title="Click to copy embed URL"
        >
          <span>{tool.slug}</span>
          <Copy className="w-3 h-3" />
          {copiedSlug === tool.slug && <span className="text-green-500">Copied!</span>}
        </button>
      </td>
      <td className="px-4 py-3">
        {tool.category ? (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400">
            {formatCategoryLabel(tool.category!)}
          </span>
        ) : (
          <span className={`text-xs ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {tool.model.replace('claude-', '')}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {tool.maxTokens.toLocaleString()}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            tool.isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          {tool.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {tool.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onToggleActive}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            title={tool.isActive ? 'Deactivate' : 'Activate'}
          >
            {tool.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className={`p-2 rounded-lg text-red-500 ${
              isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
            }`}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const AdminAIToolsPage: React.FC = () => {
  const { isDarkMode } = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AITool | null>(null);
  const [deletingTool, setDeletingTool] = useState<AITool | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());

  // Queries
  const { data: tools, isLoading, refetch } = useAITools();

  // Mutations
  const createMutation = useCreateAIToolMutation();
  const updateMutation = useUpdateAIToolMutation();
  const deleteMutation = useDeleteAIToolMutation();
  const bulkUpdateMutation = useBulkUpdateAIToolsMutation();
  const reorderMutation = useReorderAIToolsMutation();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter tools
  const filteredTools = useMemo(() => {
    if (!tools) return [];

    return tools.filter((tool) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        tool.name.toLowerCase().includes(searchLower) ||
        tool.slug.toLowerCase().includes(searchLower) ||
        tool.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [tools, searchQuery]);

  // Existing categories (for modal datalist)
  const existingCategories = useMemo(() => {
    if (!tools) return [];
    const cats = new Set(tools.map((t) => t.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [tools]);

  // Stats
  const stats = useMemo(() => {
    if (!tools) return { total: 0, active: 0, inactive: 0 };
    return {
      total: tools.length,
      active: tools.filter((t) => t.isActive).length,
      inactive: tools.filter((t) => !t.isActive).length,
    };
  }, [tools]);

  // Handlers
  const handleAddTool = () => {
    setEditingTool(null);
    setIsModalOpen(true);
  };

  const handleEditTool = (tool: AITool) => {
    setEditingTool(tool);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: AIToolInput) => {
    try {
      if (editingTool) {
        await updateMutation.mutateAsync({ toolId: editingTool.id, updates: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingTool(null);
    } catch (err) {
      console.error('Failed to save AI tool:', err);
      window.alert(`Failed to save tool: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteTool = async () => {
    if (deletingTool) {
      try {
        await deleteMutation.mutateAsync(deletingTool.id);
        setDeletingTool(null);
      } catch (err) {
        console.error('Failed to delete AI tool:', err);
        window.alert(
          `Failed to delete tool: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }
  };

  const handleToggleActive = async (tool: AITool) => {
    try {
      await updateMutation.mutateAsync({
        toolId: tool.id,
        updates: { isActive: !tool.isActive },
      });
    } catch (err) {
      console.error('Failed to toggle tool:', err);
      window.alert(
        `Failed to update tool: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(`ai-tool:${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Selection handlers
  const handleSelectTool = (toolId: string) => {
    setSelectedToolIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedToolIds.size === filteredTools.length) {
      setSelectedToolIds(new Set());
    } else {
      setSelectedToolIds(new Set(filteredTools.map((t) => t.id)));
    }
  };

  const handleBulkUpdate = async (updates: { model?: string; maxTokens?: number }) => {
    try {
      await bulkUpdateMutation.mutateAsync({
        toolIds: Array.from(selectedToolIds),
        updates,
      });
      setSelectedToolIds(new Set());
      setIsBulkEditModalOpen(false);
    } catch (err) {
      console.error('Failed to bulk update tools:', err);
      window.alert(
        `Failed to update tools: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !filteredTools) return;

    const oldIndex = filteredTools.findIndex((t) => t.id === active.id);
    const newIndex = filteredTools.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(filteredTools, oldIndex, newIndex);
      reorderMutation.mutate(newOrder.map((t) => t.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">AI Tools</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Manage custom AI chatbot tools for lessons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {selectedToolIds.size > 0 && (
            <button
              onClick={() => setIsBulkEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700"
            >
              <Settings2 className="w-4 h-4" />
              Edit {selectedToolIds.size} Tool{selectedToolIds.size !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={handleAddTool}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add AI Tool
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tools', value: stats.total, color: 'violet' },
          { label: 'Active', value: stats.active, color: 'green' },
          { label: 'Inactive', value: stats.inactive, color: 'zinc' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search AI tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
            isDarkMode
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
          } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
        />
      </div>

      {/* Tools Table */}
      {isLoading ? (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Loading AI tools...
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div
            className={`rounded-xl border overflow-hidden ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <table className="w-full">
              <thead className={`text-xs uppercase ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
                <tr>
                  <th className="px-2 py-3 w-8"></th>
                  <th className="px-2 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredTools.length > 0 && selectedToolIds.size === filteredTools.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Tool</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">Max Tokens</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <SortableContext
                items={filteredTools.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredTools.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className={`px-4 py-8 text-center ${
                          isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                        }`}
                      >
                        {searchQuery ? 'No AI tools match your search' : 'No AI tools yet'}
                      </td>
                    </tr>
                  ) : (
                    filteredTools.map((tool) => (
                      <SortableToolRow
                        key={tool.id}
                        tool={tool}
                        isDarkMode={isDarkMode}
                        isSelected={selectedToolIds.has(tool.id)}
                        copiedSlug={copiedSlug}
                        onSelect={() => handleSelectTool(tool.id)}
                        onCopySlug={() => handleCopySlug(tool.slug)}
                        onToggleActive={() => handleToggleActive(tool)}
                        onEdit={() => handleEditTool(tool)}
                        onDelete={() => setDeletingTool(tool)}
                      />
                    ))
                  )}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      )}

      {/* AI Tool Modal */}
      <AIToolModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTool(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingTool}
        isLoading={createMutation.isPending || updateMutation.isPending}
        existingCategories={existingCategories}
      />

      {/* Delete Confirmation Modal */}
      {deletingTool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-xl ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
          >
            <h3 className="text-lg font-semibold mb-2">Delete AI Tool</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Are you sure you want to delete "{deletingTool.name}"? This will also delete all
              associated conversations and messages. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingTool(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTool}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        onSubmit={handleBulkUpdate}
        selectedCount={selectedToolIds.size}
        isLoading={bulkUpdateMutation.isPending}
      />
    </div>
  );
};

export default AdminAIToolsPage;
