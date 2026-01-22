import React, { useState, useMemo } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import { useAITools } from '../../../../hooks/useChatHistory';
import {
  useCreateAIToolMutation,
  useUpdateAIToolMutation,
  useDeleteAIToolMutation,
  useBulkUpdateAIToolsMutation,
} from '../../../../hooks/useChatMutation';
import { AITool, AIToolInput } from '../../../../types/chat-types';
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
} from 'lucide-react';

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
    if (editingTool) {
      await updateMutation.mutateAsync({ toolId: editingTool.id, updates: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsModalOpen(false);
    setEditingTool(null);
  };

  const handleDeleteTool = async () => {
    if (deletingTool) {
      await deleteMutation.mutateAsync(deletingTool.id);
      setDeletingTool(null);
    }
  };

  const handleToggleActive = async (tool: AITool) => {
    await updateMutation.mutateAsync({
      toolId: tool.id,
      updates: { isActive: !tool.isActive },
    });
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
    await bulkUpdateMutation.mutateAsync({
      toolIds: Array.from(selectedToolIds),
      updates,
    });
    setSelectedToolIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">AI Tools</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage custom AI chatbot tools for lessons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add AI Tool
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tools', value: stats.total, color: 'blue' },
          { label: 'Active', value: stats.active, color: 'green' },
          { label: 'Inactive', value: stats.inactive, color: 'slate' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search AI tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
            isDarkMode
              ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        />
      </div>

      {/* Tools Table */}
      {isLoading ? (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Loading AI tools...
          </p>
        </div>
      ) : (
        <div
          className={`rounded-xl border overflow-hidden ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <table className="w-full">
            <thead className={`text-xs uppercase ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredTools.length > 0 && selectedToolIds.size === filteredTools.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left">Tool</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Max Tokens</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTools.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={`px-4 py-8 text-center ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {searchQuery ? 'No AI tools match your search' : 'No AI tools yet'}
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool) => (
                  <tr
                    key={tool.id}
                    className={`${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} ${
                      selectedToolIds.has(tool.id)
                        ? isDarkMode
                          ? 'bg-blue-900/20'
                          : 'bg-blue-50'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedToolIds.has(tool.id)}
                        onChange={() => handleSelectTool(tool.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
                          <p
                            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                          >
                            {tool.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleCopySlug(tool.slug)}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                        title="Click to copy embed URL"
                      >
                        <span>{tool.slug}</span>
                        <Copy className="w-3 h-3" />
                        {copiedSlug === tool.slug && (
                          <span className="text-green-500">Copied!</span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                      >
                        {tool.model.replace('claude-', '')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                      >
                        {tool.maxTokens.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          tool.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {tool.isActive ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {tool.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleActive(tool)}
                          className={`p-2 rounded-lg ${
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                          }`}
                          title={tool.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {tool.isActive ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditTool(tool)}
                          className={`p-2 rounded-lg ${
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTool(tool)}
                          className={`p-2 rounded-lg text-red-500 ${
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
      />

      {/* Delete Confirmation Modal */}
      {deletingTool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
          >
            <h3 className="text-lg font-semibold mb-2">Delete AI Tool</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Are you sure you want to delete "{deletingTool.name}"? This will also delete all
              associated conversations and messages. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingTool(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
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
