/** ActivityRow. Renders a single activity log entry with action badge, actor, and timestamp. */
import { Eye } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

import type { DfyActivityEntry } from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface ActivityRowProps {
  entry: DfyActivityEntry;
}

// ─── Component ─────────────────────────────────────────
export default function ActivityRow({ entry }: ActivityRowProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
              isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {entry.action}
          </span>
          {entry.actor && (
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              by {entry.actor}
            </span>
          )}
          {entry.client_visible && (
            <span
              title="Visible to client"
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
              }`}
            >
              <Eye className="w-3 h-3" />
              Client
            </span>
          )}
        </div>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {entry.description}
        </p>
      </div>
      <span
        className={`text-[11px] flex-shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
      >
        {new Date(entry.created_at).toLocaleString()}
      </span>
    </div>
  );
}
