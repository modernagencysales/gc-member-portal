/**
 * CredentialsFields — Credential entry sub-form (login URL, username, password, notes).
 * Renders inside LmsContentItemModal when contentType === 'credentials'.
 * Calls onChange with partial credentialsData updates; parent owns the full state.
 */

import React from 'react';
import { AlertCircle, Key } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CredentialsData {
  loginUrl: string;
  username: string;
  password: string;
  notes: string;
}

interface CredentialsFieldsProps {
  value: Partial<CredentialsData>;
  onChange: (updated: Partial<CredentialsData>) => void;
  isDarkMode: boolean;
}

// ─── Shared class helpers ─────────────────────────────────────────────────────

const inputClass = (isDarkMode: boolean, extra = '') =>
  `w-full px-3 py-2 rounded-lg border text-sm ${
    isDarkMode
      ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500'
      : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
  } focus:ring-2 focus:ring-violet-500 focus:border-transparent ${extra}`;

const labelClass = (isDarkMode: boolean) =>
  `block text-xs font-medium mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`;

// ─── Component ───────────────────────────────────────────────────────────────

const CredentialsFields: React.FC<CredentialsFieldsProps> = ({ value, onChange, isDarkMode }) => {
  const patch = (partial: Partial<CredentialsData>) => onChange({ ...value, ...partial });

  return (
    <div className={`p-4 rounded-lg space-y-3 ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Key className="w-4 h-4 text-amber-500" />
        <span className={`text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
          Credential Details
        </span>
      </div>

      {/* Login URL */}
      <div>
        <label className={labelClass(isDarkMode)}>Login URL</label>
        <input
          type="url"
          value={value.loginUrl || ''}
          onChange={(e) => patch({ loginUrl: e.target.value })}
          placeholder="https://app.example.com/login"
          className={inputClass(isDarkMode)}
        />
      </div>

      {/* Username + Password */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass(isDarkMode)}>Username / Email</label>
          <input
            type="text"
            value={value.username || ''}
            onChange={(e) => patch({ username: e.target.value })}
            placeholder="user@example.com"
            className={inputClass(isDarkMode)}
          />
        </div>
        <div>
          <label className={labelClass(isDarkMode)}>Password</label>
          <input
            type="text"
            value={value.password || ''}
            onChange={(e) => patch({ password: e.target.value })}
            placeholder="••••••••"
            className={inputClass(isDarkMode, 'font-mono')}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass(isDarkMode)}>Notes</label>
        <textarea
          value={value.notes || ''}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Any additional instructions..."
          rows={2}
          className={`${inputClass(isDarkMode)} resize-none`}
        />
      </div>

      {/* Warning */}
      <div
        className={`flex items-start gap-2 p-2 rounded text-xs ${
          isDarkMode ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-700'
        }`}
      >
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Credentials will be displayed with copy buttons for easy access.</span>
      </div>
    </div>
  );
};

export default CredentialsFields;
