import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOnboardingChecklist, checkMemberProgressExists } from '../../../services/supabase';
import { queryKeys } from '../../../lib/queryClient';
import { useTheme } from '../../../context/ThemeContext';
import { OnboardingChecklistItem, OnboardingCategory } from '../../../types/gc-types';
import {
  useCreateChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
} from '../../../hooks/useAdminMutations';
import ChecklistItemModal from './ChecklistItemModal';
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

const CATEGORY_ORDER: OnboardingCategory[] = [
  'Before Kickoff',
  'Week 1',
  'Week 2',
  'Week 3-4',
  'Ongoing',
];

const AdminOnboardingPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OnboardingChecklistItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    item: OnboardingChecklistItem;
    memberCount: number;
  } | null>(null);

  const { data: checklist, isLoading } = useQuery({
    queryKey: queryKeys.adminChecklist(),
    queryFn: fetchOnboardingChecklist,
  });

  const createMutation = useCreateChecklistItemMutation();
  const updateMutation = useUpdateChecklistItemMutation();
  const deleteMutation = useDeleteChecklistItemMutation();

  // Group items by category
  const groupedItems = useMemo(() => {
    if (!checklist) return [];

    const categoryMap = new Map<OnboardingCategory, OnboardingChecklistItem[]>();
    checklist.forEach((item) => {
      const existing = categoryMap.get(item.category) || [];
      existing.push(item);
      categoryMap.set(item.category, existing);
    });

    return CATEGORY_ORDER.filter((cat) => categoryMap.has(cat)).map((category) => ({
      category,
      items: (categoryMap.get(category) || []).sort((a, b) => a.order - b.order),
    }));
  }, [checklist]);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: OnboardingChecklistItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (item: OnboardingChecklistItem) => {
    const memberCount = await checkMemberProgressExists(item.id);
    setDeletingItem({ item, memberCount });
  };

  const handleSubmit = async (itemData: Partial<OnboardingChecklistItem>) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ itemId: editingItem.id, updates: itemData });
      } else {
        await createMutation.mutateAsync(itemData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to save checklist item:', err);
      window.alert(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    if (deletingItem) {
      try {
        await deleteMutation.mutateAsync(deletingItem.item.id);
        setDeletingItem(null);
      } catch (err) {
        console.error('Failed to delete checklist item:', err);
        window.alert(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const handleReorder = async (item: OnboardingChecklistItem, direction: 'up' | 'down') => {
    const categoryItems = groupedItems.find((g) => g.category === item.category)?.items || [];
    const currentIndex = categoryItems.findIndex((i) => i.id === item.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= categoryItems.length) return;

    const otherItem = categoryItems[newIndex];

    // Swap order values
    await Promise.all([
      updateMutation.mutateAsync({ itemId: item.id, updates: { order: otherItem.order } }),
      updateMutation.mutateAsync({ itemId: otherItem.id, updates: { order: item.order } }),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Manage Onboarding Checklist</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Add, edit, or reorder checklist items for all members
          </p>
        </div>
        <button
          onClick={handleAddItem}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        {groupedItems.map((group) => (
          <div
            key={group.category}
            className={`px-3 py-1.5 rounded-full text-sm ${
              isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {group.category}: {group.items.length}
          </div>
        ))}
      </div>

      {/* Checklist by Category */}
      {isLoading ? (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Loading checklist...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <div
              key={group.category}
              className={`rounded-xl border overflow-hidden ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              {/* Category Header */}
              <div
                className={`px-4 py-3 border-b ${
                  isDarkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <h3 className="font-medium">{group.category}</h3>
              </div>

              {/* Items */}
              <div className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-200'}`}>
                {group.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 ${isDarkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{item.item}</span>
                          {item.docLink && (
                            <a
                              href={item.docLink}
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
                        <div
                          className={`flex items-center gap-3 mt-1 text-xs ${
                            isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
                          }`}
                        >
                          <span
                            className={`px-2 py-0.5 rounded ${
                              isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                            }`}
                          >
                            {item.supportType}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded ${
                              item.planRequired === 'Full Only'
                                ? isDarkMode
                                  ? 'bg-amber-900/30 text-amber-400'
                                  : 'bg-amber-100 text-amber-700'
                                : isDarkMode
                                  ? 'bg-zinc-800'
                                  : 'bg-zinc-100'
                            }`}
                          >
                            {item.planRequired}
                          </span>
                          <span>Order: {item.order}</span>
                        </div>
                        {item.description && (
                          <p
                            className={`mt-2 text-sm ${
                              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                            }`}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Reorder buttons */}
                        <button
                          onClick={() => handleReorder(item, 'up')}
                          disabled={index === 0}
                          className={`p-1.5 rounded-lg disabled:opacity-30 ${
                            isDarkMode
                              ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                          }`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReorder(item, 'down')}
                          disabled={index === group.items.length - 1}
                          className={`p-1.5 rounded-lg disabled:opacity-30 ${
                            isDarkMode
                              ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Edit/Delete */}
                        <button
                          onClick={() => handleEditItem(item)}
                          className={`p-1.5 rounded-lg ${
                            isDarkMode
                              ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                          }`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className={`p-1.5 rounded-lg ${
                            isDarkMode
                              ? 'text-red-400 hover:bg-red-900/30'
                              : 'text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ChecklistItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Checklist Item"
        message={`Are you sure you want to delete "${deletingItem?.item.item}"?`}
        warningMessage={
          deletingItem && deletingItem.memberCount > 0
            ? `${deletingItem.memberCount} member(s) have progress records for this item. Deleting will remove their progress.`
            : undefined
        }
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminOnboardingPage;
