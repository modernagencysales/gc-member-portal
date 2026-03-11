/** Shared video embed URL helpers. Used by BlueprintPage and BlueprintThankYou. */

const YT_PARAMS = 'modestbranding=1&rel=0&showinfo=0&iv_load_policy=3';

/**
 * Convert YouTube watch URLs to embed format with clean player settings.
 * Handles: youtube.com/watch?v=ID, youtu.be/ID, and already-embed URLs.
 * Loom, Vimeo, and other URLs are returned as-is.
 */
export function toEmbedUrl(url: string): string {
  if (!url) return url;

  if (url.includes('youtube.com/embed/')) {
    return url.includes('?') ? url : `${url}?${YT_PARAMS}`;
  }

  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?${YT_PARAMS}`;

  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?${YT_PARAMS}`;

  return url;
}
