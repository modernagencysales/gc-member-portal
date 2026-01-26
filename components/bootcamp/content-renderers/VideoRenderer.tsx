import React, { useMemo } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { normalizeEmbedUrl } from '../../../types/lms-types';

interface VideoRendererProps {
  embedUrl: string;
  title?: string;
}

type VideoProvider = 'youtube' | 'loom' | 'grain' | 'vimeo' | 'unknown';

function detectVideoProvider(url: string): VideoProvider {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('loom.com')) return 'loom';
  if (lowerUrl.includes('grain.com') || lowerUrl.includes('grain.co')) return 'grain';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  return 'unknown';
}

function normalizeVimeoUrl(url: string): string {
  // Extract video ID from Vimeo URL
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return url;
}

function normalizeGrainUrl(url: string): string {
  // Grain URLs should be used as-is for embedding
  // They typically come in the format: https://grain.com/share/recording/... or similar
  if (url.includes('/embed/')) {
    return url;
  }
  // Convert share URL to embed URL if possible
  return url.replace('/share/', '/embed/');
}

const VideoRenderer: React.FC<VideoRendererProps> = ({ embedUrl, title }) => {
  const { provider, normalizedUrl } = useMemo(() => {
    const provider = detectVideoProvider(embedUrl);
    let normalizedUrl = embedUrl;

    switch (provider) {
      case 'youtube':
      case 'loom':
        normalizedUrl = normalizeEmbedUrl(embedUrl);
        break;
      case 'vimeo':
        normalizedUrl = normalizeVimeoUrl(embedUrl);
        break;
      case 'grain':
        normalizedUrl = normalizeGrainUrl(embedUrl);
        break;
      default:
        // Try generic normalization
        normalizedUrl = normalizeEmbedUrl(embedUrl);
    }

    return { provider, normalizedUrl };
  }, [embedUrl]);

  const providerLabel = useMemo(() => {
    switch (provider) {
      case 'youtube':
        return 'YouTube';
      case 'loom':
        return 'Loom';
      case 'grain':
        return 'Grain';
      case 'vimeo':
        return 'Vimeo';
      default:
        return 'Video';
    }
  }, [provider]);

  // For unknown providers or if embed fails, show a fallback link
  if (provider === 'unknown') {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Play size={32} className="text-violet-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
            {title || 'Video Content'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            This video cannot be embedded directly.
          </p>
        </div>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
        >
          Watch Video <ExternalLink size={16} />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="aspect-video w-full">
        <iframe
          src={normalizedUrl}
          title={title || `${providerLabel} video`}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      </div>
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-2">
        <Play size={12} className="text-violet-500" />
        <span className="text-xs text-zinc-500">{providerLabel}</span>
      </div>
    </div>
  );
};

export default VideoRenderer;
