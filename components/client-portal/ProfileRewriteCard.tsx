import React, { useEffect, useState } from 'react';
import { fetchAutomationOutput } from '../../services/dfy-service';

interface ProfileRewriteHeadlines {
  outcome_based: string;
  authority_based: string;
  hybrid: string;
}

interface ProfileRewriteOutput {
  headlines: ProfileRewriteHeadlines;
  about_section: string;
  featured_suggestions: string[];
  banner_concept: string;
}

interface ProfileRewriteCardProps {
  portalSlug: string;
}

function normalizeOutput(raw: unknown): ProfileRewriteOutput | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = (raw as any).rewrite ?? raw;
  if (!data.headlines || !data.about_section) return null;
  return data as ProfileRewriteOutput;
}

const ProfileRewriteCard: React.FC<ProfileRewriteCardProps> = ({ portalSlug }) => {
  const [output, setOutput] = useState<ProfileRewriteOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAutomationOutput(portalSlug, 'profile_rewrite');
        if (data?.output) {
          setOutput(normalizeOutput(data.output));
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [portalSlug]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/3" />
      </div>
    );
  }

  if (!output) return null;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
        LinkedIn Profile Rewrite
      </h3>

      {/* Headlines */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5">
          Headline Options
        </p>
        <div className="space-y-1.5">
          {(
            [
              ['Outcome-Based', output.headlines.outcome_based],
              ['Authority-Based', output.headlines.authority_based],
              ['Hybrid', output.headlines.hybrid],
            ] as const
          ).map(([label, text]) => (
            <div
              key={label}
              className="text-sm text-gray-900 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-800 rounded px-3 py-2"
            >
              <span className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                {label}
              </span>
              <p className="mt-0.5">{text}</p>
            </div>
          ))}
        </div>
      </div>

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

      {/* Featured Suggestions */}
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
  );
};

export default ProfileRewriteCard;
