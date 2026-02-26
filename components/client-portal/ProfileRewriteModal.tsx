import React from 'react';

interface ProfileRewriteHeadlines {
  outcome_based: string;
  authority_based: string;
  hybrid: string;
}

interface ProfileRewriteData {
  headlines: ProfileRewriteHeadlines;
  about_section: string;
  featured_suggestions: string[];
  banner_concept: string;
}

interface ProfileRewriteModalProps {
  output: Record<string, unknown>;
  onClose: () => void;
}

function normalizeOutput(raw: Record<string, unknown>): ProfileRewriteData | null {
  const data = (raw as any).rewrite ?? raw;
  if (!data.headlines || !data.about_section) return null;
  return data as ProfileRewriteData;
}

const ProfileRewriteModal: React.FC<ProfileRewriteModalProps> = ({ output, onClose }) => {
  const data = normalizeOutput(output);
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            LinkedIn Profile Rewrite
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
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
        <div className="px-6 py-5 space-y-6">
          {/* Headlines */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
              Headline Options
            </h3>
            <div className="space-y-2">
              {(
                [
                  ['Outcome-Based', data.headlines.outcome_based],
                  ['Authority-Based', data.headlines.authority_based],
                  ['Hybrid', data.headlines.hybrid],
                ] as const
              ).map(([label, text]) => (
                <div key={label} className="bg-gray-50 dark:bg-zinc-800 rounded-lg px-4 py-3">
                  <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-zinc-100">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* About Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
              About Section
            </h3>
            <div className="text-sm text-gray-800 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800 rounded-lg px-4 py-3 whitespace-pre-wrap">
              {data.about_section}
            </div>
          </section>

          {/* Featured Suggestions */}
          {data.featured_suggestions.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                Featured Section Suggestions
              </h3>
              <ul className="space-y-1.5">
                {data.featured_suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-800 dark:text-zinc-200 flex items-start gap-2"
                  >
                    <span className="text-gray-400 dark:text-zinc-500 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Banner Concept */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
              Banner Concept
            </h3>
            <p className="text-sm text-gray-800 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800 rounded-lg px-4 py-3">
              {data.banner_concept}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfileRewriteModal;
