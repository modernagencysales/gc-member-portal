/** DfyActivityPanel. Activity log with "Post Update" form for client-visible updates. */
import { useState } from 'react';
import { Send } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import ActivityRow from './shared/ActivityRow';

import type { DfyActivityEntry } from '../../../types/dfy-admin-types';
import type { UseMutationResult } from '@tanstack/react-query';

// ─── Types ─────────────────────────────────────────────
export interface DfyActivityPanelProps {
  activity: DfyActivityEntry[] | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postUpdateMutation: UseMutationResult<any, Error, string>;
}

// ─── Component ─────────────────────────────────────────
export default function DfyActivityPanel({ activity, postUpdateMutation }: DfyActivityPanelProps) {
  const { isDarkMode } = useTheme();
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const handlePostUpdate = () => {
    if (!updateMessage.trim()) return;
    postUpdateMutation.mutate(updateMessage.trim(), {
      onSuccess: () => {
        setUpdateMessage('');
        setShowUpdateForm(false);
      },
    });
  };

  return (
    <div
      className={`rounded-xl border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
      >
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Activity Log
        </h3>
        <button
          onClick={() => setShowUpdateForm(!showUpdateForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Send className="w-3 h-3" />
          Post Update
        </button>
      </div>
      {showUpdateForm && (
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <textarea
            value={updateMessage}
            onChange={(e) => setUpdateMessage(e.target.value)}
            placeholder="Write an update visible to the client..."
            rows={2}
            className={`w-full text-sm px-3 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500'
                : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
            } focus:ring-1 focus:ring-blue-500 focus:border-transparent`}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handlePostUpdate}
              disabled={!updateMessage.trim() || postUpdateMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {postUpdateMutation.isPending ? 'Posting...' : 'Send to Client'}
            </button>
            <button
              onClick={() => {
                setShowUpdateForm(false);
                setUpdateMessage('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              Cancel
            </button>
            <span
              className={`text-[11px] ml-auto ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
            >
              This will appear in the client portal
            </span>
          </div>
        </div>
      )}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {(activity || []).length === 0 ? (
          <p
            className={`px-4 py-6 text-sm text-center ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            No activity yet
          </p>
        ) : (
          (activity || []).map((entry) => <ActivityRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
