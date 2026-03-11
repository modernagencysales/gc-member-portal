/** CallTranscriptSection. Editable call transcript with inline edit and save. */
import { useState } from 'react';
import { useTheme } from '../../../../context/ThemeContext';

import type { DfyAdminEngagement } from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface CallTranscriptSectionProps {
  engagement: DfyAdminEngagement;
  isUpdating: boolean;
  onSave: (transcript: string | null) => void;
}

// ─── Component ─────────────────────────────────────────
export default function CallTranscriptSection({
  engagement,
  isUpdating,
  onSave,
}: CallTranscriptSectionProps) {
  const { isDarkMode } = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(engagement.call_transcript || '');

  const hasTranscript = !!engagement.call_transcript?.trim();

  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Call Transcript
        </h3>
        {!editing && (
          <button
            onClick={() => {
              setDraft(engagement.call_transcript || '');
              setEditing(true);
            }}
            className={`text-xs font-medium ${
              isDarkMode
                ? 'text-violet-400 hover:text-violet-300'
                : 'text-violet-600 hover:text-violet-700'
            }`}
          >
            {hasTranscript ? 'Edit' : '+ Add Transcript'}
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            placeholder="Paste the call transcript here..."
            className={`w-full text-sm rounded-lg border px-3 py-2 resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none ${
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500'
                : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
            }`}
          />
          <div className="flex items-center justify-between mt-2">
            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {draft.length.toLocaleString()} characters
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  isDarkMode
                    ? 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSave(draft.trim() || null);
                  setEditing(false);
                }}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : hasTranscript ? (
        <pre
          className={`text-sm whitespace-pre-wrap max-h-64 overflow-y-auto ${
            isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
          }`}
        >
          {engagement.call_transcript}
        </pre>
      ) : (
        <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          No transcript added yet
        </p>
      )}
    </div>
  );
}
