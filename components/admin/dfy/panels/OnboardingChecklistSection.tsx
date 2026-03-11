/** OnboardingChecklistSection. Renders the onboarding checklist with toggle + inline notes editing. */
import { useState } from 'react';
import { useTheme } from '../../../../context/ThemeContext';

import type { DfyAdminEngagement, OnboardingChecklist } from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface OnboardingChecklistSectionProps {
  engagement: DfyAdminEngagement;
  isUpdating: boolean;
  onUpdate: (checklist: Record<string, unknown>) => void;
  onInitialize: () => void;
}

// ─── Component ─────────────────────────────────────────
export default function OnboardingChecklistSection({
  engagement,
  isUpdating,
  onUpdate,
  onInitialize,
}: OnboardingChecklistSectionProps) {
  const { isDarkMode } = useTheme();
  const checklist = engagement.onboarding_checklist as OnboardingChecklist | null;
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const completedCount = checklist
    ? Object.values(checklist).filter((item) => item.completed).length
    : 0;
  const totalCount = checklist ? Object.keys(checklist).length : 0;

  // ─── Handlers ──────────────────────────────────────────
  const toggleItem = (key: string) => {
    if (!checklist) return;
    const updated = {
      ...checklist,
      [key]: { ...checklist[key], completed: !checklist[key].completed },
    };
    onUpdate(updated as unknown as Record<string, unknown>);
  };

  const commitNotes = (key: string, notes: string) => {
    if (!checklist) return;
    const serverNotes = checklist[key]?.notes || '';
    if (notes === serverNotes) return;
    const updated = { ...checklist, [key]: { ...checklist[key], notes } };
    onUpdate(updated as unknown as Record<string, unknown>);
  };

  const handleNotesBlur = (key: string, value: string) => {
    commitNotes(key, value);
    setLocalNotes((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div
      className={`rounded-xl border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        <div>
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Onboarding Checklist
          </h3>
          {checklist && (
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {completedCount} of {totalCount} complete
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {engagement.linkedin_connected_at ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              LinkedIn Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              LinkedIn Not Connected
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        {!checklist ? (
          <div className="text-center py-4">
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              No checklist initialized for this engagement.
            </p>
            <button
              onClick={onInitialize}
              disabled={isUpdating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Initializing...' : 'Initialize Checklist'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(checklist).map(([key, item]) => (
              <div
                key={key}
                className={`flex items-start gap-3 p-2 rounded-lg ${
                  isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(key)}
                  disabled={isUpdating}
                  className="mt-1 w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      item.completed
                        ? isDarkMode
                          ? 'text-zinc-500 line-through'
                          : 'text-zinc-400 line-through'
                        : isDarkMode
                          ? 'text-zinc-200'
                          : 'text-zinc-900'
                    }`}
                  >
                    {item.label}
                  </p>
                  <input
                    type="text"
                    placeholder="Notes..."
                    value={localNotes[key] ?? item.notes ?? ''}
                    onChange={(e) => setLocalNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                    onBlur={(e) => handleNotesBlur(key, e.target.value)}
                    className={`mt-1 w-full text-xs px-2 py-1 rounded border ${
                      isDarkMode
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-600'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 placeholder:text-zinc-400'
                    } focus:ring-1 focus:ring-violet-500 focus:border-transparent`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
