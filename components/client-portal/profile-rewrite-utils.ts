/** Profile rewrite data normalizer. Handles both direct and { rewrite: {...} } wrapper formats from automation output. */

// ─── Types ──────────────────────────────────────────

export interface ProfileRewriteHeadlines {
  outcome_based: string;
  authority_based: string;
  hybrid: string;
}

export interface ProfileRewriteData {
  headlines: ProfileRewriteHeadlines;
  about_section: string;
  featured_suggestions: string[];
  banner_concept: string;
}

// ─── Normalizer ─────────────────────────────────────

/**
 * Normalizes raw automation output into a typed ProfileRewriteData.
 * Handles both direct format and the { rewrite: {...} } wrapper format.
 * Returns null if the data is missing required fields.
 */
export function normalizeRewriteOutput(raw: unknown): ProfileRewriteData | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = (raw as Record<string, unknown>).rewrite ?? raw;

  if (
    typeof data !== 'object' ||
    data === null ||
    !('headlines' in data) ||
    !('about_section' in data)
  ) {
    return null;
  }

  return data as ProfileRewriteData;
}

// ─── Headline Labels ────────────────────────────────

export const HEADLINE_LABELS: Record<keyof ProfileRewriteHeadlines, string> = {
  outcome_based: 'Outcome-Based',
  authority_based: 'Authority-Based',
  hybrid: 'Hybrid',
};

const HEADLINE_ORDER: (keyof ProfileRewriteHeadlines)[] = [
  'outcome_based',
  'authority_based',
  'hybrid',
];

/**
 * Returns headline entries in display order, filtering out empty values.
 */
export function getHeadlineEntries(
  headlines: ProfileRewriteHeadlines
): { key: keyof ProfileRewriteHeadlines; label: string; value: string }[] {
  return HEADLINE_ORDER.filter((key) => headlines[key]).map((key) => ({
    key,
    label: HEADLINE_LABELS[key],
    value: headlines[key],
  }));
}
