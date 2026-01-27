import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';

interface GuideRendererProps {
  embedUrl: string;
  title?: string;
}

const GuideRenderer: React.FC<GuideRendererProps> = ({ embedUrl, title }) => {
  const isGuidde = embedUrl.toLowerCase().includes('guidde.com');

  // Guidde embeds work with their standard URLs
  // They may need /embed format or work directly
  const normalizedUrl = embedUrl.includes('/embed')
    ? embedUrl
    : embedUrl.replace('/share/', '/embed/');

  // If the URL doesn't look embeddable, show a fallback link
  if (!isGuidde) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <BookOpen size={32} className="text-violet-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
            {title || 'Interactive Guide'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Open this guide in a new tab to view.
          </p>
        </div>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
        >
          View Guide <ExternalLink size={16} />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="aspect-video w-full">
        <iframe
          src={normalizedUrl}
          title={title || 'Interactive Guide'}
          className="w-full h-full border-0"
          allowFullScreen
          allow="fullscreen"
        />
      </div>
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-2">
        <BookOpen size={12} className="text-violet-500" />
        <span className="text-xs text-zinc-500">Guidde</span>
      </div>
    </div>
  );
};

export default GuideRenderer;
