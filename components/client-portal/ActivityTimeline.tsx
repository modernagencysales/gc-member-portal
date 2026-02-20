import React from 'react';
import type { DfyActivityEntry } from '../../services/dfy-service';

// ── Time-ago helper ────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

// ── Action icons ───────────────────────────────────────
const ACTION_ICONS: Record<string, string> = {
  status_change: '\u2192', // right arrow
  client_approved: '\u2713', // check mark
  note_added: '\u{1F4AC}', // speech bubble (kept as fallback, but using simpler below)
  email_sent: '\u2709', // envelope
};

function getActionIcon(action: string): string {
  return ACTION_ICONS[action] ?? '\u2022'; // bullet as default
}

// ── Dot color by action ────────────────────────────────
function getDotColor(action: string): string {
  switch (action) {
    case 'client_approved':
      return 'bg-green-500 dark:bg-green-400';
    case 'status_change':
      return 'bg-blue-500 dark:bg-blue-400';
    case 'note_added':
      return 'bg-amber-500 dark:bg-amber-400';
    case 'email_sent':
      return 'bg-purple-500 dark:bg-purple-400';
    default:
      return 'bg-gray-400 dark:bg-zinc-500';
  }
}

// ── Component ──────────────────────────────────────────
interface ActivityTimelineProps {
  entries: DfyActivityEntry[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 dark:text-zinc-400">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200 dark:bg-zinc-700" />

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex gap-3 pl-0">
            {/* Timeline dot */}
            <div className="relative z-10 flex items-center justify-center w-6 h-6 shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${getDotColor(entry.action)}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs text-gray-400 dark:text-zinc-600" title={entry.action}>
                  {getActionIcon(entry.action)}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                  {entry.actor}
                </span>
                <span className="text-xs text-gray-400 dark:text-zinc-500">
                  {timeAgo(entry.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mt-0.5">{entry.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
