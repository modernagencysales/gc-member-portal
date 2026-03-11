/**
 * LmsContentItemModal — Modal shell for creating and editing LMS content items.
 * Delegates form state to useContentItemForm; renders TextContentEditor and
 * CredentialsFields for their respective content types.
 */

import React from 'react';
import { X, Video, FileText, Link, Key, Bot, Table, Presentation, BookOpen } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import type {
  LmsContentItem,
  LmsContentItemFormData,
  LmsContentType,
} from '../../../../types/lms-types';
import { useContentItemForm } from '../../../../hooks/useContentItemForm';
import TextContentEditor from './TextContentEditor';
import CredentialsFields from './CredentialsFields';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LmsContentItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LmsContentItemFormData) => Promise<void>;
  initialData?: LmsContentItem | null;
  initialContentType?: LmsContentType;
  isLoading: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTENT_TYPE_OPTIONS: { value: LmsContentType; label: string; icon: React.ReactNode }[] = [
  { value: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { value: 'slide_deck', label: 'Slide Deck', icon: <Presentation className="w-4 h-4" /> },
  { value: 'guide', label: 'Interactive Guide', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'clay_table', label: 'Clay Table', icon: <Table className="w-4 h-4" /> },
  { value: 'ai_tool', label: 'AI Tool', icon: <Bot className="w-4 h-4" /> },
  { value: 'text', label: 'Text/Notes', icon: <FileText className="w-4 h-4" /> },
  { value: 'external_link', label: 'External Link', icon: <Link className="w-4 h-4" /> },
  { value: 'credentials', label: 'Credentials', icon: <Key className="w-4 h-4" /> },
  { value: 'sop_link', label: 'Reference SOP', icon: <BookOpen className="w-4 h-4" /> },
];

const URL_FIELD_CONTENT_TYPES: LmsContentType[] = [
  'video',
  'slide_deck',
  'guide',
  'clay_table',
  'external_link',
  'sop_link',
];

const URL_LABELS: Partial<Record<LmsContentType, string>> = {
  video: 'Video URL',
  slide_deck: 'Gamma URL',
  guide: 'Guidde URL',
  clay_table: 'Clay Table URL',
  sop_link: 'Playbook SOP URL',
  external_link: 'External URL',
};

const URL_PLACEHOLDERS: Partial<Record<LmsContentType, string>> = {
  video: 'https://youtube.com/watch?v=... or https://loom.com/share/...',
  slide_deck: 'https://gamma.app/...',
  guide: 'https://app.guidde.com/share/...',
  clay_table: 'https://app.clay.com/...',
  sop_link: 'https://dwy-playbook.vercel.app/...',
  external_link: 'https://...',
};

// ─── Component ───────────────────────────────────────────────────────────────

const LmsContentItemModal: React.FC<LmsContentItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialContentType,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();
  const { formData, setFormData, handleUrlChange, handleSubmit } = useContentItemForm({
    initialData,
    initialContentType,
    isOpen,
    onSubmit,
  });

  if (!isOpen) return null;

  const contentType = formData.contentType || 'video';
  const showUrlField = URL_FIELD_CONTENT_TYPES.includes(contentType);
  const showAiToolField = contentType === 'ai_tool';
  const showTextField = contentType === 'text';
  const showCredentialsFields = contentType === 'credentials';

  const inputBase = `w-full px-4 py-2.5 rounded-lg border ${
    isDarkMode
      ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500'
      : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`;

  const labelBase = `block text-sm font-medium mb-1.5 ${
    isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
  }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${
          isDarkMode ? 'bg-zinc-900' : 'bg-white'
        } shadow-xl`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
          }`}
        >
          <h3 className="text-lg font-semibold">
            {initialData ? 'Edit Content Item' : 'Add Content Item'}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Content Type Selector */}
          <div>
            <label className={labelBase}>Content Type *</label>
            <div className="grid grid-cols-4 gap-2">
              {CONTENT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, contentType: option.value })}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                    contentType === option.value
                      ? isDarkMode
                        ? 'border-violet-500 bg-violet-900/30 text-violet-400'
                        : 'border-violet-500 bg-violet-50 text-violet-700'
                      : isDarkMode
                        ? 'border-zinc-700 hover:border-zinc-600 text-zinc-400'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }`}
                >
                  {option.icon}
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={labelBase}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction Video, Getting Started Guide"
              required
              className={inputBase}
            />
          </div>

          {/* URL Field */}
          {showUrlField && (
            <div>
              <label className={labelBase}>{URL_LABELS[contentType] ?? 'External URL'} *</label>
              <input
                type="url"
                value={formData.embedUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={URL_PLACEHOLDERS[contentType] ?? 'https://...'}
                required={showUrlField}
                className={inputBase}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                URLs are automatically normalized for embedding
              </p>
            </div>
          )}

          {/* AI Tool Slug */}
          {showAiToolField && (
            <div>
              <label className={labelBase}>AI Tool Slug *</label>
              <input
                type="text"
                value={formData.aiToolSlug}
                onChange={(e) => setFormData({ ...formData, aiToolSlug: e.target.value })}
                placeholder="e.g., lead-generator, email-writer"
                required={showAiToolField}
                className={inputBase}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Enter the slug of the AI tool from your AI Tools configuration
              </p>
            </div>
          )}

          {/* Text / Markdown Editor */}
          {showTextField && (
            <TextContentEditor
              value={formData.contentText || ''}
              onChange={(val) => setFormData({ ...formData, contentText: val })}
              isDarkMode={isDarkMode}
              required={showTextField}
            />
          )}

          {/* Credentials */}
          {showCredentialsFields && (
            <CredentialsFields
              value={formData.credentialsData || {}}
              onChange={(updated) =>
                setFormData({
                  ...formData,
                  credentialsData: {
                    loginUrl: '',
                    username: '',
                    password: '',
                    notes: '',
                    ...updated,
                  },
                })
              }
              isDarkMode={isDarkMode}
            />
          )}

          {/* Description */}
          <div>
            <label className={labelBase}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description shown to students..."
              rows={2}
              className={`${inputBase} resize-none`}
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="contentVisible"
              checked={formData.isVisible}
              onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
              className="w-4 h-4 text-violet-600 border-zinc-300 rounded focus:ring-violet-500"
            />
            <label
              htmlFor="contentVisible"
              className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
            >
              Visible to students
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title?.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Content' : 'Add Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LmsContentItemModal;
