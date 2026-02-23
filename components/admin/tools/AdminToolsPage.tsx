import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMemberTools } from '../../../services/supabase';
import { queryKeys } from '../../../lib/queryClient';
import { useTheme } from '../../../context/ThemeContext';
import { ToolAccess } from '../../../types/gc-types';
import {
  useCreateToolMutation,
  useUpdateToolMutation,
  useDeleteToolMutation,
} from '../../../hooks/useAdminMutations';
import MemberSelect from '../shared/MemberSelect';
import ToolFormModal from './ToolFormModal';
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal';
import StatusBadge from '../../shared/StatusBadge';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';

const AdminToolsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolAccess | null>(null);
  const [deletingTool, setDeletingTool] = useState<ToolAccess | null>(null);

  const { data: tools, isLoading: isLoadingTools } = useQuery({
    queryKey: queryKeys.gcTools(selectedMemberId!),
    queryFn: () => fetchMemberTools(selectedMemberId!),
    enabled: !!selectedMemberId,
  });

  const createMutation = useCreateToolMutation();
  const updateMutation = useUpdateToolMutation();
  const deleteMutation = useDeleteToolMutation();

  const handleAddTool = () => {
    setEditingTool(null);
    setIsModalOpen(true);
  };

  const handleEditTool = (tool: ToolAccess) => {
    setEditingTool(tool);
    setIsModalOpen(true);
  };

  const handleSubmit = async (toolData: Partial<ToolAccess>) => {
    try {
      if (editingTool) {
        await updateMutation.mutateAsync({ toolId: editingTool.id, updates: toolData });
      } else if (selectedMemberId) {
        await createMutation.mutateAsync({ memberId: selectedMemberId, tool: toolData });
      }
      setIsModalOpen(false);
      setEditingTool(null);
    } catch (err) {
      console.error('Failed to save tool:', err);
      window.alert(`Failed to save tool: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    if (deletingTool) {
      try {
        await deleteMutation.mutateAsync(deletingTool.id);
        setDeletingTool(null);
      } catch (err) {
        console.error('Failed to delete tool:', err);
        window.alert(
          `Failed to delete tool: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Manage Tools</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Add, edit, or remove tool access for members
          </p>
        </div>
        {selectedMemberId && (
          <button
            onClick={handleAddTool}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Tool
          </button>
        )}
      </div>

      {/* Member Select */}
      <div
        className={`p-4 rounded-xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <MemberSelect value={selectedMemberId} onChange={setSelectedMemberId} />
      </div>

      {/* Tools List */}
      {selectedMemberId && (
        <div
          className={`rounded-xl border overflow-hidden ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          {isLoadingTools ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Loading tools...
              </p>
            </div>
          ) : tools && tools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Tool
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Username
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Access Type
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-200'}`}>
                  {tools.map((tool) => (
                    <tr
                      key={tool.id}
                      className={isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tool.tool}</span>
                          {tool.loginUrl && (
                            <a
                              href={tool.loginUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1 rounded ${
                                isDarkMode
                                  ? 'text-zinc-400 hover:text-zinc-200'
                                  : 'text-zinc-500 hover:text-zinc-700'
                              }`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={tool.status} />
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                      >
                        {tool.username || '-'}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                      >
                        {tool.accessType}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditTool(tool)}
                            className={`p-1.5 rounded-lg ${
                              isDarkMode
                                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                            }`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTool(tool)}
                            className={`p-1.5 rounded-lg ${
                              isDarkMode
                                ? 'text-red-400 hover:bg-red-900/30'
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                No tools configured for this member
              </p>
              <button
                onClick={handleAddTool}
                className="mt-4 text-sm font-medium text-violet-500 hover:text-violet-600"
              >
                Add first tool
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no member selected */}
      {!selectedMemberId && (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <p className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>
            Select a member to manage their tools
          </p>
        </div>
      )}

      {/* Modals */}
      <ToolFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTool(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingTool}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingTool}
        onClose={() => setDeletingTool(null)}
        onConfirm={handleDelete}
        title="Delete Tool"
        message={`Are you sure you want to delete ${deletingTool?.tool}? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminToolsPage;
