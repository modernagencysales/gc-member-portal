import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: { model?: string; maxTokens?: number }) => Promise<void>;
  selectedCount: number;
  isLoading?: boolean;
}

const AVAILABLE_MODELS = [
  { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5 (Most Capable)' },
  { value: 'claude-sonnet-4-5-20250514', label: 'Claude Sonnet 4.5' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)' },
];

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedCount,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();
  const [updateModel, setUpdateModel] = useState(false);
  const [updateTokens, setUpdateTokens] = useState(false);
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [maxTokens, setMaxTokens] = useState(1024);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updates: { model?: string; maxTokens?: number } = {};
    if (updateModel) updates.model = model;
    if (updateTokens) updates.maxTokens = maxTokens;

    if (Object.keys(updates).length === 0) {
      return;
    }

    await onSubmit(updates);
  };

  const handleClose = () => {
    setUpdateModel(false);
    setUpdateTokens(false);
    setModel('claude-sonnet-4-20250514');
    setMaxTokens(1024);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = `w-full px-4 py-2.5 rounded-lg border ${
    isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`;

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
  }`;

  const canSubmit = updateModel || updateTokens;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-xl ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
          }`}
        >
          <div>
            <h3 className="text-lg font-semibold">Bulk Edit AI Tools</h3>
            <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Update {selectedCount} selected tool{selectedCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Select which fields to update. Only checked fields will be changed.
          </p>

          {/* Model Selection */}
          <div
            className={`p-4 rounded-lg border ${
              isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
            } ${updateModel ? (isDarkMode ? 'bg-zinc-800/50' : 'bg-violet-50/50') : ''}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="updateModel"
                checked={updateModel}
                onChange={(e) => setUpdateModel(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
              />
              <label
                htmlFor="updateModel"
                className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}
              >
                Update Model
              </label>
            </div>
            <div className={updateModel ? '' : 'opacity-50 pointer-events-none'}>
              <label className={labelClass}>Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={inputClass}
                disabled={!updateModel}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Tokens Selection */}
          <div
            className={`p-4 rounded-lg border ${
              isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
            } ${updateTokens ? (isDarkMode ? 'bg-zinc-800/50' : 'bg-violet-50/50') : ''}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="updateTokens"
                checked={updateTokens}
                onChange={(e) => setUpdateTokens(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
              />
              <label
                htmlFor="updateTokens"
                className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}
              >
                Update Max Tokens
              </label>
            </div>
            <div className={updateTokens ? '' : 'opacity-50 pointer-events-none'}>
              <label className={labelClass}>Max Tokens</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setMaxTokens(
                    Number.isFinite(n) ? Math.max(256, Math.min(64000, Math.floor(n))) : 1024
                  );
                }}
                className={inputClass}
                min={256}
                max={64000}
                disabled={!updateTokens}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Range: 256 - 64,000
              </p>
            </div>
          </div>

          {/* Actions */}
          <div
            className={`flex justify-end gap-2 pt-4 border-t ${
              isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
            }`}
          >
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update {selectedCount} Tool{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditModal;
