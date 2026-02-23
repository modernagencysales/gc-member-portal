import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import {
  BootcampChecklistItem,
  BootcampOnboardingCategory,
  BOOTCAMP_ONBOARDING_CATEGORIES,
} from '../../../../types/bootcamp-types';

interface OnboardingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<BootcampChecklistItem>) => Promise<void>;
  initialData?: BootcampChecklistItem | null;
  isLoading?: boolean;
}

const OnboardingItemModal: React.FC<OnboardingItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<Partial<BootcampChecklistItem>>({
    item: '',
    category: 'Welcome',
    description: '',
    videoUrl: '',
    docLink: '',
    sortOrder: 0,
    isRequired: true,
    isVisible: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        item: initialData.item,
        category: initialData.category,
        description: initialData.description || '',
        videoUrl: initialData.videoUrl || '',
        docLink: initialData.docLink || '',
        sortOrder: initialData.sortOrder,
        isRequired: initialData.isRequired,
        isVisible: initialData.isVisible,
      });
    } else {
      setFormData({
        item: '',
        category: 'Welcome',
        description: '',
        videoUrl: '',
        docLink: '',
        sortOrder: 0,
        isRequired: true,
        isVisible: true,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-xl ${
          isDarkMode ? 'bg-zinc-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
          }`}
        >
          <h2 className="text-lg font-semibold">
            {initialData ? 'Edit Checklist Item' : 'Add Checklist Item'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Item Name *</label>
            <input
              type="text"
              required
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              placeholder="e.g., Watch the welcome video"
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-zinc-300 text-zinc-900'
              } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category *</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as BootcampOnboardingCategory,
                  })
                }
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              >
                {BOOTCAMP_ONBOARDING_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Optional description of this task"
              className={`w-full px-4 py-2.5 rounded-lg border resize-none ${
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-zinc-300 text-zinc-900'
              } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Video URL</label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://youtube.com/..."
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-zinc-300 text-zinc-900'
              } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Doc/Guide Link</label>
            <input
              type="url"
              value={formData.docLink}
              onChange={(e) => setFormData({ ...formData, docLink: e.target.value })}
              placeholder="https://..."
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-zinc-300 text-zinc-900'
              } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="rounded border-zinc-300 dark:border-zinc-600 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm">Required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="rounded border-zinc-300 dark:border-zinc-600 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm">Visible to students</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium ${
                isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingItemModal;
