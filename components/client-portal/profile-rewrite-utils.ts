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

export function normalizeRewriteOutput(raw: unknown): ProfileRewriteData | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = (raw as any).rewrite ?? raw;
  if (!data.headlines || !data.about_section) return null;
  return data as ProfileRewriteData;
}
