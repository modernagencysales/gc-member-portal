/**
 * markdown-utils.ts
 * Pure string-processing utilities for normalizing non-standard text into proper markdown.
 * No side effects. No DOM access. No React imports.
 */

// ─── preprocessTextContent ────────────────────────────────────────────────────

/**
 * Preprocess text content to normalize non-standard formatting into proper markdown.
 * Handles Windows line endings, orphaned bold markers, all-caps headings, emoji headings,
 * unicode bullet characters, and collapses excess blank lines.
 */
export const preprocessTextContent = (content: string): string => {
  // Normalize line endings (Windows \r\n → \n)
  let normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Pre-pass: fix bold markers split across lines (closing ** on next line)
  // e.g. "**Think: peer-to-peer\n**" → "**Think: peer-to-peer**\n"
  normalized = normalized.replace(/\*\*([^*\n]+)\n\s*\*\*/g, '**$1**\n');
  // Also fix: lone "**" on its own line (orphaned closing marker) — remove it
  normalized = normalized.replace(/^\s*\*\*\s*$/gm, '');
  // Remove empty heading markers (## with nothing after, from toolbar artifacts)
  normalized = normalized.replace(/^#{1,6}\s*$/gm, '');

  const lines = normalized.split('\n');
  const result: string[] = [];

  const addHeading = (text: string) => {
    // Add blank line and horizontal rule before heading for visual separation
    if (result.length > 0 && result[result.length - 1] !== '') {
      result.push('');
    }
    result.push('---');
    result.push('');
    result.push(`## ${text}`);
    result.push(''); // blank line after heading
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip empty lines, pass through as blank
    if (!trimmed) {
      result.push('');
      continue;
    }

    // Unwrap **...** for pattern detection (content may be fully bold-wrapped)
    const unwrapped = trimmed.replace(/^\*\*(.+)\*\*$/, '$1').trim();

    // Convert lines starting with bullet-like characters to markdown list items
    if (/^[●•▪▸‣⁃◆◇○][\s\t]/.test(unwrapped)) {
      result.push(`- ${unwrapped.replace(/^[●•▪▸‣⁃◆◇○][\s\t]*/, '')}`);
      continue;
    }

    // Fix bold markers with trailing spaces: **text ** → **text**
    let fixed = trimmed.replace(/\*\*(.+?)\s+\*\*/g, '**$1**');

    // Detect heading lines using unwrapped text for pattern matching
    // Emoji + uppercase text (code point > 127 = emoji/symbol)
    const firstCodePoint = unwrapped.codePointAt(0) || 0;
    const isNonAsciiStart = firstCodePoint > 127;

    if (isNonAsciiStart && unwrapped.length < 120) {
      const textPart = unwrapped.replace(/^[^\x20-\x7E]+\s*/, '');
      if (textPart.length > 0 && /^[A-Z]/.test(textPart)) {
        addHeading(unwrapped);
        continue;
      }
    }

    // ALL-CAPS short lines as headings (e.g. "EXAMPLE 2")
    if (/^[A-Z][A-Z\s\d]+$/.test(unwrapped) && unwrapped.length < 60 && unwrapped.length > 3) {
      addHeading(unwrapped);
      continue;
    }

    // "STEP N:" or "EXAMPLE N" patterns as headings
    if (/^(STEP|EXAMPLE)\s+\d/i.test(unwrapped) && unwrapped.length < 80) {
      addHeading(unwrapped);
      continue;
    }

    // "Label:" patterns at start of line → bold them (skip if already bold-wrapped)
    if (trimmed === unwrapped && /^[A-Z][A-Za-z\s]+:/.test(fixed) && fixed.length < 100) {
      fixed = fixed.replace(/^([A-Z][A-Za-z\s]+:)/, '**$1**');
    }

    result.push(fixed);
  }

  // Post-pass: clean up the output for proper markdown rendering
  let output = result.join('\n');
  // Collapse 3+ consecutive blank lines to 2 (one paragraph break)
  output = output.replace(/\n{3,}/g, '\n\n');
  // Remove blank lines between consecutive list items so they group into one <ul>
  output = output.replace(/(^- .+)\n\n(- )/gm, '$1\n$2');
  // Ensure blank line before headings
  output = output.replace(/([^\n])\n(## )/g, '$1\n\n$2');
  return output.trim();
};
