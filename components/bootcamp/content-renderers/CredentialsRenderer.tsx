import React, { useState } from 'react';
import { Key, Copy, Check, ExternalLink, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { LmsCredentialsData } from '../../../types/lms-types';

interface CredentialsRendererProps {
  credentials: LmsCredentialsData;
  title?: string;
}

interface CopyButtonProps {
  text: string;
  label: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? (
        <>
          <Check size={12} className="text-green-500" />
          <span className="text-green-600 dark:text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

const CredentialsRenderer: React.FC<CredentialsRendererProps> = ({ credentials, title }) => {
  const [showPassword, setShowPassword] = useState(false);

  const hasCredentials = credentials.username || credentials.password || credentials.loginUrl;

  if (!hasCredentials) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-6 flex items-center gap-4">
        <AlertTriangle className="text-amber-500 shrink-0" size={24} />
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
            No Credentials Available
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Credential information has not been configured for this item.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-900/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
          <Key size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            {title || 'Login Credentials'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Keep these credentials secure</p>
        </div>
      </div>

      {/* Credentials */}
      <div className="p-6 space-y-4">
        {/* Login URL */}
        {credentials.loginUrl && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Login URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-4 py-3 font-mono text-sm text-zinc-700 dark:text-zinc-300 truncate">
                {credentials.loginUrl}
              </div>
              <CopyButton text={credentials.loginUrl} label="URL" />
              <a
                href={credentials.loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 transition-colors"
              >
                <ExternalLink size={12} />
                Open
              </a>
            </div>
          </div>
        )}

        {/* Username/Email */}
        {credentials.username && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Username / Email
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-4 py-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                {credentials.username}
              </div>
              <CopyButton text={credentials.username} label="username" />
            </div>
          </div>
        )}

        {/* Password */}
        {credentials.password && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Password
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-4 py-3 font-mono text-sm text-zinc-700 dark:text-zinc-300 flex items-center">
                <span className="flex-1">
                  {showPassword ? credentials.password : '••••••••••••'}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <CopyButton text={credentials.password} label="password" />
            </div>
          </div>
        )}

        {/* Notes */}
        {credentials.notes && (
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Notes
            </label>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
              {credentials.notes}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
          <AlertTriangle size={12} />
          Do not share these credentials with others
        </p>
      </div>
    </div>
  );
};

export default CredentialsRenderer;
