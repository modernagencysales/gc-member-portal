import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import {
  LmsContentItem,
  LmsContentItemFormData,
  LmsContentType,
  detectContentType,
  normalizeEmbedUrl,
} from '../../../../types/lms-types';
import {
  X,
  AlertCircle,
  Video,
  FileText,
  Link,
  Key,
  Bot,
  Table,
  Presentation,
  BookOpen,
} from 'lucide-react';

interface LmsContentItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LmsContentItemFormData) => Promise<void>;
  initialData?: LmsContentItem | null;
  initialContentType?: LmsContentType;
  isLoading: boolean;
}

const CONTENT_TYPE_OPTIONS: { value: LmsContentType; label: string; icon: React.ReactNode }[] = [
  { value: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { value: 'slide_deck', label: 'Slide Deck', icon: <Presentation className="w-4 h-4" /> },
  { value: 'guide', label: 'Interactive Guide', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'clay_table', label: 'Clay Table', icon: <Table className="w-4 h-4" /> },
  { value: 'ai_tool', label: 'AI Tool', icon: <Bot className="w-4 h-4" /> },
  { value: 'text', label: 'Text/Notes', icon: <FileText className="w-4 h-4" /> },
  { value: 'external_link', label: 'External Link', icon: <Link className="w-4 h-4" /> },
  { value: 'credentials', label: 'Credentials', icon: <Key className="w-4 h-4" /> },
];

const LmsContentItemModal: React.FC<LmsContentItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialContentType,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<Partial<LmsContentItemFormData>>({
    title: '',
    contentType: 'video',
    embedUrl: '',
    aiToolSlug: '',
    contentText: '',
    credentialsData: { loginUrl: '', username: '', password: '', notes: '' },
    description: '',
    isVisible: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        contentType: initialData.contentType,
        embedUrl: initialData.embedUrl || '',
        aiToolSlug: initialData.aiToolSlug || '',
        contentText: initialData.contentText || '',
        credentialsData: initialData.credentialsData || {
          loginUrl: '',
          username: '',
          password: '',
          notes: '',
        },
        description: initialData.description || '',
        isVisible: initialData.isVisible,
      });
    } else {
      setFormData({
        title: '',
        contentType: initialContentType || 'video',
        embedUrl: '',
        aiToolSlug: '',
        contentText: '',
        credentialsData: { loginUrl: '', username: '', password: '', notes: '' },
        description: '',
        isVisible: true,
      });
    }
  }, [initialData, initialContentType, isOpen]);

  const handleUrlChange = (url: string) => {
    const detectedType = detectContentType(url);
    const normalizedUrl = normalizeEmbedUrl(url);

    setFormData((prev) => ({
      ...prev,
      embedUrl: normalizedUrl || url,
      contentType: detectedType,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData as LmsContentItemFormData);
  };

  if (!isOpen) return null;

  const showUrlField = ['video', 'slide_deck', 'guide', 'clay_table', 'external_link'].includes(
    formData.contentType || ''
  );
  const showAiToolField = formData.contentType === 'ai_tool';
  const showTextField = formData.contentType === 'text';
  const showCredentialsFields = formData.contentType === 'credentials';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${
          isDarkMode ? 'bg-slate-900' : 'bg-white'
        } shadow-xl`}
      >
        <div
          className={`sticky top-0 flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <h3 className="text-lg font-semibold">
            {initialData ? 'Edit Content Item' : 'Add Content Item'}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Content Type */}
          <div>
            <label
              className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Content Type *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CONTENT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, contentType: option.value })}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                    formData.contentType === option.value
                      ? isDarkMode
                        ? 'border-violet-500 bg-violet-900/30 text-violet-400'
                        : 'border-violet-500 bg-violet-50 text-violet-700'
                      : isDarkMode
                        ? 'border-slate-700 hover:border-slate-600 text-slate-400'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
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
            <label
              className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction Video, Getting Started Guide"
              required
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
            />
          </div>

          {/* URL Field */}
          {showUrlField && (
            <div>
              <label
                className={`block text-sm font-medium mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {formData.contentType === 'video'
                  ? 'Video URL'
                  : formData.contentType === 'slide_deck'
                    ? 'Gamma URL'
                    : formData.contentType === 'guide'
                      ? 'Guidde URL'
                      : formData.contentType === 'clay_table'
                        ? 'Clay Table URL'
                        : 'External URL'}{' '}
                *
              </label>
              <input
                type="url"
                value={formData.embedUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={
                  formData.contentType === 'video'
                    ? 'https://youtube.com/watch?v=... or https://loom.com/share/...'
                    : formData.contentType === 'slide_deck'
                      ? 'https://gamma.app/...'
                      : formData.contentType === 'guide'
                        ? 'https://app.guidde.com/share/...'
                        : formData.contentType === 'clay_table'
                          ? 'https://app.clay.com/...'
                          : 'https://...'
                }
                required={showUrlField}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                URLs are automatically normalized for embedding
              </p>
            </div>
          )}

          {/* AI Tool Field */}
          {showAiToolField && (
            <div>
              <label
                className={`block text-sm font-medium mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                AI Tool Slug *
              </label>
              <input
                type="text"
                value={formData.aiToolSlug}
                onChange={(e) => setFormData({ ...formData, aiToolSlug: e.target.value })}
                placeholder="e.g., lead-generator, email-writer"
                required={showAiToolField}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Enter the slug of the AI tool from your AI Tools configuration
              </p>
            </div>
          )}

          {/* Text Content Field */}
          {showTextField && (
            <div>
              <label
                className={`block text-sm font-medium mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Text Content *
              </label>
              <textarea
                value={formData.contentText}
                onChange={(e) => setFormData({ ...formData, contentText: e.target.value })}
                placeholder="Enter text content, notes, or instructions..."
                rows={6}
                required={showTextField}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none font-mono text-sm`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Supports basic HTML formatting
              </p>
            </div>
          )}

          {/* Credentials Fields */}
          {showCredentialsFields && (
            <div
              className={`p-4 rounded-lg space-y-3 ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span
                  className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  Credential Details
                </span>
              </div>

              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Login URL
                </label>
                <input
                  type="url"
                  value={formData.credentialsData?.loginUrl || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credentialsData: { ...formData.credentialsData, loginUrl: e.target.value },
                    })
                  }
                  placeholder="https://app.example.com/login"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Username / Email
                  </label>
                  <input
                    type="text"
                    value={formData.credentialsData?.username || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credentialsData: { ...formData.credentialsData, username: e.target.value },
                      })
                    }
                    placeholder="user@example.com"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Password
                  </label>
                  <input
                    type="text"
                    value={formData.credentialsData?.password || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credentialsData: { ...formData.credentialsData, password: e.target.value },
                      })
                    }
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Notes
                </label>
                <textarea
                  value={formData.credentialsData?.notes || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credentialsData: { ...formData.credentialsData, notes: e.target.value },
                    })
                  }
                  placeholder="Any additional instructions..."
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  } focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none`}
                />
              </div>

              <div
                className={`flex items-start gap-2 p-2 rounded text-xs ${
                  isDarkMode ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Credentials will be displayed with copy buttons for easy access.</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label
              className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description shown to students..."
              rows={2}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              } focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none`}
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="contentVisible"
              checked={formData.isVisible}
              onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
              className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
            />
            <label
              htmlFor="contentVisible"
              className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
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
                isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
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
