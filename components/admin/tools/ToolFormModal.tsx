import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { ToolAccess, ToolName, ToolAccessType, ToolStatus } from '../../../types/gc-types';
import { X, Eye, EyeOff } from 'lucide-react';

interface ToolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tool: Partial<ToolAccess>) => void;
  initialData?: ToolAccess | null;
  isLoading?: boolean;
}

const TOOL_OPTIONS: ToolName[] = [
  'Clay',
  'Smartlead',
  'HeyReach',
  'Apify',
  'Anthropic API',
  'Gemini API',
  'Zapmail',
  'Mailforge',
  'Linked Helper',
];

const ACCESS_TYPE_OPTIONS: ToolAccessType[] = ['Shared Account', 'Client Account', 'Own Account'];

const STATUS_OPTIONS: ToolStatus[] = ['Not Set Up', 'Pending', 'Active', 'Issues'];

const ToolFormModal: React.FC<ToolFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<ToolAccess>>({
    tool: 'Clay',
    loginUrl: '',
    username: '',
    password: '',
    accessType: 'Shared Account',
    status: 'Not Set Up',
    setupDoc: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        tool: initialData.tool,
        loginUrl: initialData.loginUrl || '',
        username: initialData.username || '',
        password: initialData.password || '',
        accessType: initialData.accessType,
        status: initialData.status,
        setupDoc: initialData.setupDoc || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        tool: 'Clay',
        loginUrl: '',
        username: '',
        password: '',
        accessType: 'Shared Account',
        status: 'Not Set Up',
        setupDoc: '',
        notes: '',
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
          <h3 className="text-lg font-semibold">{initialData ? 'Edit Tool' : 'Add Tool'}</h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={labelClass}>Tool *</label>
            <select
              value={formData.tool}
              onChange={(e) => setFormData({ ...formData, tool: e.target.value as ToolName })}
              className={inputClass}
              required
            >
              {TOOL_OPTIONS.map((tool) => (
                <option key={tool} value={tool}>
                  {tool}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Login URL</label>
            <input
              type="url"
              value={formData.loginUrl}
              onChange={(e) => setFormData({ ...formData, loginUrl: e.target.value })}
              className={inputClass}
              placeholder="https://app.example.com/login"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${
                    isDarkMode
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Access Type</label>
              <select
                value={formData.accessType}
                onChange={(e) =>
                  setFormData({ ...formData, accessType: e.target.value as ToolAccessType })
                }
                className={inputClass}
              >
                {ACCESS_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ToolStatus })}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Setup Doc URL</label>
            <input
              type="url"
              value={formData.setupDoc}
              onChange={(e) => setFormData({ ...formData, setupDoc: e.target.value })}
              className={inputClass}
              placeholder="https://docs.google.com/..."
            />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={`${inputClass} resize-none`}
              rows={3}
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
              {isLoading ? 'Saving...' : initialData ? 'Update Tool' : 'Add Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ToolFormModal;
