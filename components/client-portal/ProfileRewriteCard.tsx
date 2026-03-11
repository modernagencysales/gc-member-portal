/** ProfileRewriteCard. Displays profile rewrite output in the client portal. Never calls supabase directly. */

import React, { useEffect, useState } from 'react';
import { fetchAutomationOutput } from '../../services/dfy-service';
import { logError } from '../../lib/logError';
import {
  normalizeRewriteOutput,
  getHeadlineEntries,
  type ProfileRewriteData,
} from './profile-rewrite-utils';

// ─── Props ──────────────────────────────────────────

interface ProfileRewriteCardProps {
  portalSlug: string;
}

// ─── Component ──────────────────────────────────────

const ProfileRewriteCard: React.FC<ProfileRewriteCardProps> = ({ portalSlug }) => {
  const [output, setOutput] = useState<ProfileRewriteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAutomationOutput(portalSlug, 'profile_rewrite');
        if (data?.output) {
          setOutput(normalizeRewriteOutput(data.output));
        }
      } catch (err) {
        logError('ProfileRewriteCard:fetchAutomationOutput', err);
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

  const headlineEntries = getHeadlineEntries(output.headlines);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
        LinkedIn Profile Rewrite
      </h3>

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
