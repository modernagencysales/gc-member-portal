import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { AITool, AIToolInput, formatCategoryLabel } from '../../../../types/chat-types';

interface AIToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AIToolInput) => Promise<void>;
  initialData?: AITool | null;
  isLoading?: boolean;
  existingCategories?: string[];
}

const AVAILABLE_MODELS = [
  { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5 (Most Capable)' },
  { value: 'claude-sonnet-4-5-20250514', label: 'Claude Sonnet 4.5' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)' },
];

const AIToolModal: React.FC<AIToolModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  existingCategories = [],
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<AIToolInput>({
    slug: '',
    name: '',
    description: '',
    category: null,
    systemPrompt: '',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1024,
    welcomeMessage: '',
    suggestedPrompts: [],
    isActive: true,
  });
  const [newPrompt, setNewPrompt] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        slug: initialData.slug || '',
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category ?? null,
        systemPrompt: initialData.systemPrompt || '',
        model: initialData.model || 'claude-sonnet-4-20250514',
        maxTokens: initialData.maxTokens || 1024,
        welcomeMessage: initialData.welcomeMessage || '',
        suggestedPrompts: initialData.suggestedPrompts || [],
        isActive: initialData.isActive ?? true,
      });
    } else {
      setFormData({
        slug: '',
        name: '',
        description: '',
        category: null,
        systemPrompt: '',
        model: 'claude-sonnet-4-20250514',
        maxTokens: 1024,
        welcomeMessage: '',
        suggestedPrompts: [],
        isActive: true,
      });
    }
    setNewPrompt('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleAddPrompt = () => {
    if (newPrompt.trim()) {
      setFormData({
        ...formData,
        suggestedPrompts: [...(formData.suggestedPrompts || []), newPrompt.trim()],
      });
      setNewPrompt('');
    }
  };

  const handleRemovePrompt = (index: number) => {
    setFormData({
      ...formData,
      suggestedPrompts: (formData.suggestedPrompts || []).filter((_, i) => i !== index),
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    const updates: Partial<AIToolInput> = { name };
    // Auto-generate slug if creating new tool
    if (!initialData && !formData.slug) {
      updates.slug = generateSlug(name);
    }
    setFormData({ ...formData, ...updates });
  };

  if (!isOpen) return null;

  const inputClass = `w-full px-4 py-2.5 rounded-lg border ${
    isDarkMode
      ? 'bg-slate-800 border-slate-700 text-white'
      : 'bg-white border-slate-300 text-slate-900'
  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-slate-700'
  }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${
          isDarkMode ? 'bg-slate-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <h3 className="text-lg font-semibold">
            {initialData ? 'Edit AI Tool' : 'Create AI Tool'}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
                placeholder="AI Message Writer"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className={inputClass}
                placeholder="message-writer"
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
                required
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Used in lesson URLs: ai-tool:{formData.slug || 'your-slug'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputClass}
                placeholder="Helps you craft compelling messages..."
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <input
                type="text"
                list="category-options"
                value={formData.category || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value.trim() || null,
                  })
                }
                className={inputClass}
                placeholder="e.g. lead-magnet, strategy"
              />
              <datalist id="category-options">
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatCategoryLabel(cat)}
                  </option>
                ))}
              </datalist>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Sidebar group — pick existing or type a new one
              </p>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className={labelClass}>System Prompt *</label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              className={inputClass}
              placeholder="You are an expert AI assistant that helps users..."
              rows={6}
              required
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Instructions that define the AI's personality and behavior
            </p>
          </div>

          {/* Welcome Message */}
          <div>
            <label className={labelClass}>Welcome Message</label>
            <textarea
              value={formData.welcomeMessage}
              onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              className={inputClass}
              placeholder="Hi! I'm here to help you craft compelling messages. What would you like to write today?"
              rows={3}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              First message shown to users when they open the chat
            </p>
          </div>

          {/* Model & Tokens */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Model</label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className={inputClass}
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Max Tokens</label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setFormData({
                    ...formData,
                    maxTokens: Number.isFinite(n)
                      ? Math.max(256, Math.min(64000, Math.floor(n)))
                      : 1024,
                  });
                }}
                className={inputClass}
                min={256}
                max={64000}
              />
            </div>
          </div>

          {/* Suggested Prompts */}
          <div>
            <label className={labelClass}>Suggested Prompts</label>
            <div className="space-y-2">
              {(formData.suggestedPrompts || []).map((prompt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                    }`}
                  >
                    {prompt}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePrompt(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPrompt();
                    }
                  }}
                  className={inputClass}
                  placeholder="Add a suggested prompt..."
                />
                <button
                  type="button"
                  onClick={handleAddPrompt}
                  disabled={!newPrompt.trim()}
                  className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Quick prompts shown to users to start a conversation
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Active (tool is available to students)
            </span>
          </div>

          {/* Actions */}
          <div
            className={`flex justify-end gap-2 pt-4 border-t ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                !formData.name.trim() ||
                !formData.slug.trim() ||
                !formData.systemPrompt.trim()
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialData ? 'Save Changes' : 'Create AI Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIToolModal;
