import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import {
  OnboardingChecklistItem,
  OnboardingCategory,
  SupportType,
  PlanRequired,
} from '../../../types/gc-types';
import { X } from 'lucide-react';

interface ChecklistItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Partial<OnboardingChecklistItem>) => void;
  initialData?: OnboardingChecklistItem | null;
  isLoading?: boolean;
}

const CATEGORY_OPTIONS: OnboardingCategory[] = [
  'Before Kickoff',
  'Week 1',
  'Week 2',
  'Week 3-4',
  'Ongoing',
];

const SUPPORT_TYPE_OPTIONS: SupportType[] = [
  'Self-Service',
  'Doc/Template Provided',
  'Review on Call',
  'Strategy Guidance',
  'Initial Setup Help',
];

const PLAN_OPTIONS: PlanRequired[] = ['All Plans', 'Full Only'];

const ChecklistItemModal: React.FC<ChecklistItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<Partial<OnboardingChecklistItem>>({
    item: '',
    category: 'Week 1',
    supportType: 'Self-Service',
    order: 0,
    description: '',
    docLink: '',
    planRequired: 'All Plans',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        item: initialData.item,
        category: initialData.category,
        supportType: initialData.supportType,
        order: initialData.order,
        description: initialData.description || '',
        docLink: initialData.docLink || '',
        planRequired: initialData.planRequired,
      });
    } else {
      setFormData({
        item: '',
        category: 'Week 1',
        supportType: 'Self-Service',
        order: 0,
        description: '',
        docLink: '',
        planRequired: 'All Plans',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDarkMode
      ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
      : 'bg-white border-zinc-300 text-zinc-900'
  } focus:outline-none focus:ring-2 focus:ring-violet-500`;

  const labelClass = `block text-sm font-medium mb-1 ${
    isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className={`relative w-full max-w-lg mx-4 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${
          isDarkMode ? 'bg-zinc-900' : 'bg-white'
        }`}
      >
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
          }`}
        >
          <h3 className="text-lg font-semibold">
            {initialData ? 'Edit Checklist Item' : 'Add Checklist Item'}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={labelClass}>Item Name *</label>
            <input
              type="text"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              className={inputClass}
              placeholder="e.g., Complete ICP worksheet"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as OnboardingCategory })
                }
                className={inputClass}
                required
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className={inputClass}
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Support Type</label>
              <select
                value={formData.supportType}
                onChange={(e) =>
                  setFormData({ ...formData, supportType: e.target.value as SupportType })
                }
                className={inputClass}
              >
                {SUPPORT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Plan Required</label>
              <select
                value={formData.planRequired}
                onChange={(e) =>
                  setFormData({ ...formData, planRequired: e.target.value as PlanRequired })
                }
                className={inputClass}
              >
                {PLAN_OPTIONS.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Optional description for this item"
            />
          </div>

          <div>
            <label className={labelClass}>Doc Link</label>
            <input
              type="url"
              value={formData.docLink}
              onChange={(e) => setFormData({ ...formData, docLink: e.target.value })}
              className={inputClass}
              placeholder="https://docs.google.com/..."
            />
          </div>

          <div
            className={`flex justify-end gap-3 pt-4 border-t ${
              isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChecklistItemModal;
