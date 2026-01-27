import React from 'react';
import { Table2, ExternalLink } from 'lucide-react';

interface ClayTableRendererProps {
  embedUrl: string;
  title?: string;
}

const ClayTableRenderer: React.FC<ClayTableRendererProps> = ({ embedUrl, title }) => {
  const isClay = embedUrl.toLowerCase().includes('clay.com');

  // Clay shared tables typically work with their standard embed URLs
  // They may use formats like: https://app.clay.com/workspaces/.../tables/.../share/...
  const isEmbeddable = isClay && (embedUrl.includes('/share/') || embedUrl.includes('/embed/'));

  // If the URL doesn't look embeddable, show a fallback link
  if (!isEmbeddable) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Table2 size={32} className="text-violet-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
            {title || 'Clay Table'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Open this Clay table in a new tab to view and interact with the data.
          </p>
        </div>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
        >
          Open in Clay <ExternalLink size={16} />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      {/* Clay tables work better with a taller aspect ratio */}
      <div className="w-full" style={{ height: '600px' }}>
        <iframe
          src={embedUrl}
          title={title || 'Clay Table'}
          className="w-full h-full border-0"
          allowFullScreen
          allow="fullscreen; clipboard-write"
        />
      </div>
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-2">
        <Table2 size={12} className="text-violet-500" />
        <span className="text-xs text-zinc-500">Clay Table</span>
      </div>
    </div>
  );
};

export default ClayTableRenderer;
