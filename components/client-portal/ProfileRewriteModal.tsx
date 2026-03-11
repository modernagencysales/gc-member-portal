/** ProfileRewriteModal. Full-screen modal displaying complete profile rewrite output. */

import React, { useEffect, useCallback } from 'react';
import { getHeadlineEntries, type ProfileRewriteData } from './profile-rewrite-utils';

// ─── Props ──────────────────────────────────────────

interface ProfileRewriteModalProps {
  output: ProfileRewriteData;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────

const ProfileRewriteModal: React.FC<ProfileRewriteModalProps> = ({ output, onClose }) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const headlineEntries = getHeadlineEntries(output.headlines);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="LinkedIn Profile Rewrite"
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-xl shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
            LinkedIn Profile Rewrite
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Headline Options */}
          {headlineEntries.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5">
                Headline Options
              </p>
              <ul className="space-y-1.5">
                {headlineEntries.map(({ key, label, value }) => (
                  <li
                    key={key}
                    className="text-sm text-gray-900 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-800 rounded px-3 py-2"
                  >
                    <span className="text-xs font-medium text-gray-400 dark:text-zinc-500 mr-1.5">
                      {label}:
                    </span>
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* About Section */}
          {output.about_section && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5">
                About Section
              </p>
              <div className="text-sm text-gray-800 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800 rounded px-3 py-2 whitespace-pre-wrap">
                {output.about_section}
              </div>
            </div>
          )}

          {/* Featured Section Suggestions */}
          {output.featured_suggestions && output.featured_suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5">
                Featured Section Suggestions
              </p>
              <ul className="space-y-1">
                {output.featured_suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-800 dark:text-zinc-200 flex items-start gap-2"
                  >
                    <span className="text-gray-400 dark:text-zinc-500 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Banner Concept */}
          {output.banner_concept && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5">
                Banner Concept
              </p>
              <p className="text-sm text-gray-800 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800 rounded px-3 py-2">
                {output.banner_concept}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileRewriteModal;
