import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';

interface TextRendererProps {
  content: string;
  title?: string;
}

/**
 * Simple markdown-like text renderer
 * Supports: headings, bold, italic, links, lists, code blocks, and paragraphs
 */
function renderMarkdown(text: string): string {
  let html = text;

  // Escape HTML entities first (security)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm font-mono text-zinc-800 dark:text-zinc-200">${code.trim()}</code></pre>`;
  });

  // Inline code (`...`)
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-violet-600 dark:text-violet-400">$1</code>'
  );

  // Headings (### H3, ## H2, # H1)
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-lg font-semibold text-zinc-900 dark:text-white mt-6 mb-3">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-xl font-semibold text-zinc-900 dark:text-white mt-6 mb-3">$1</h2>'
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-2xl font-bold text-zinc-900 dark:text-white mt-6 mb-4">$1</h1>'
  );

  // Bold (**text** or __text__)
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-zinc-900 dark:text-white">$1</strong>'
  );
  html = html.replace(
    /__(.+?)__/g,
    '<strong class="font-semibold text-zinc-900 dark:text-white">$1</strong>'
  );

  // Italic (*text* or _text_)
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>');

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 underline">$1</a>'
  );

  // Unordered lists (- item or * item)
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc list-inside">$1</li>');

  // Ordered lists (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal list-inside">$1</li>');

  // Wrap consecutive list items in ul/ol
  html = html.replace(
    /(<li class="ml-4 list-disc[^>]*>[\s\S]*?<\/li>\n?)+/g,
    '<ul class="my-4 space-y-1">$&</ul>'
  );
  html = html.replace(
    /(<li class="ml-4 list-decimal[^>]*>[\s\S]*?<\/li>\n?)+/g,
    '<ol class="my-4 space-y-1">$&</ol>'
  );

  // Horizontal rule (--- or ***)
  html = html.replace(
    /^(---|\*\*\*)$/gm,
    '<hr class="my-6 border-t border-zinc-200 dark:border-zinc-700" />'
  );

  // Blockquotes (> text)
  html = html.replace(
    /^&gt; (.+)$/gm,
    '<blockquote class="border-l-4 border-violet-500 pl-4 my-4 italic text-zinc-600 dark:text-zinc-400">$1</blockquote>'
  );

  // Paragraphs - wrap lines that aren't already wrapped in tags
  const lines = html.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    // Skip if already a block element or empty
    if (
      trimmed === '' ||
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('</ul') ||
      trimmed.startsWith('</ol')
    ) {
      return line;
    }
    return `<p class="my-3">${trimmed}</p>`;
  });

  html = processedLines.join('\n');

  // Clean up empty paragraphs
  html = html.replace(/<p class="my-3"><\/p>/g, '');

  return html;
}

const TextRenderer: React.FC<TextRendererProps> = ({ content, title }) => {
  const renderedContent = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      {title && (
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <FileText size={16} className="text-violet-500" />
          <h3 className="font-medium text-zinc-900 dark:text-white">{title}</h3>
        </div>
      )}
      <div
        className="p-6 md:p-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </div>
  );
};

export default TextRenderer;
