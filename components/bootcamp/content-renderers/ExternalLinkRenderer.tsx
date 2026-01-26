import React, { useMemo } from 'react';
import { ExternalLink, Globe, FileText, Video, Image, LucideIcon } from 'lucide-react';

interface ExternalLinkRendererProps {
  url: string;
  title?: string;
  description?: string;
}

type LinkType = 'document' | 'video' | 'image' | 'generic';

function detectLinkType(url: string): LinkType {
  const lowerUrl = url.toLowerCase();

  // Document types
  if (
    lowerUrl.includes('.pdf') ||
    lowerUrl.includes('.doc') ||
    lowerUrl.includes('.docx') ||
    lowerUrl.includes('.xls') ||
    lowerUrl.includes('.xlsx') ||
    lowerUrl.includes('.ppt') ||
    lowerUrl.includes('.pptx') ||
    lowerUrl.includes('docs.google.com') ||
    lowerUrl.includes('notion.so') ||
    lowerUrl.includes('drive.google.com')
  ) {
    return 'document';
  }

  // Video types
  if (
    lowerUrl.includes('.mp4') ||
    lowerUrl.includes('.mov') ||
    lowerUrl.includes('.webm') ||
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('vimeo.com') ||
    lowerUrl.includes('loom.com')
  ) {
    return 'video';
  }

  // Image types
  if (
    lowerUrl.includes('.png') ||
    lowerUrl.includes('.jpg') ||
    lowerUrl.includes('.jpeg') ||
    lowerUrl.includes('.gif') ||
    lowerUrl.includes('.webp') ||
    lowerUrl.includes('.svg')
  ) {
    return 'image';
  }

  return 'generic';
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'External Link';
  }
}

const ExternalLinkRenderer: React.FC<ExternalLinkRendererProps> = ({ url, title, description }) => {
  const { domain, Icon } = useMemo(() => {
    const linkType = detectLinkType(url);
    const domain = extractDomain(url);

    let Icon: LucideIcon;
    switch (linkType) {
      case 'document':
        Icon = FileText;
        break;
      case 'video':
        Icon = Video;
        break;
      case 'image':
        Icon = Image;
        break;
      default:
        Icon = Globe;
    }

    return { linkType, domain, Icon };
  }, [url]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group"
    >
      <div className="p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors">
          <Icon size={24} className="text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
              {title || 'External Resource'}
            </h3>
            <ExternalLink
              size={14}
              className="text-zinc-400 group-hover:text-violet-500 transition-colors shrink-0"
            />
          </div>
          {description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <Globe size={12} />
            <span className="truncate">{domain}</span>
          </div>
        </div>
      </div>
    </a>
  );
};

export default ExternalLinkRenderer;
