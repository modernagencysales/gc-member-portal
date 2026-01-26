import React from 'react';
import { AlertCircle } from 'lucide-react';
import {
  LmsContentItem,
  LmsContentType,
  detectContentType,
  extractAiToolSlug,
  extractTextContent,
} from '../../../types/lms-types';
import VideoRenderer from './VideoRenderer';
import SlideDeckRenderer from './SlideDeckRenderer';
import GuideRenderer from './GuideRenderer';
import ClayTableRenderer from './ClayTableRenderer';
import AiToolRenderer from './AiToolRenderer';
import TextRenderer from './TextRenderer';
import ExternalLinkRenderer from './ExternalLinkRenderer';
import CredentialsRenderer from './CredentialsRenderer';

interface ContentItemRendererProps {
  item: LmsContentItem;
  studentId?: string;
}

/**
 * Main content item renderer that routes to the appropriate
 * specialized renderer based on content type
 */
const ContentItemRenderer: React.FC<ContentItemRendererProps> = ({ item, studentId }) => {
  // Determine content type - use explicit type if set, otherwise detect from URL
  const contentType: LmsContentType =
    item.contentType || (item.embedUrl ? detectContentType(item.embedUrl) : 'text');

  switch (contentType) {
    case 'video':
      if (!item.embedUrl) {
        return <MissingContentError type="video" title={item.title} />;
      }
      return <VideoRenderer embedUrl={item.embedUrl} title={item.title} />;

    case 'slide_deck':
      if (!item.embedUrl) {
        return <MissingContentError type="slide deck" title={item.title} />;
      }
      return <SlideDeckRenderer embedUrl={item.embedUrl} title={item.title} />;

    case 'guide':
      if (!item.embedUrl) {
        return <MissingContentError type="guide" title={item.title} />;
      }
      return <GuideRenderer embedUrl={item.embedUrl} title={item.title} />;

    case 'clay_table':
      if (!item.embedUrl) {
        return <MissingContentError type="Clay table" title={item.title} />;
      }
      return <ClayTableRenderer embedUrl={item.embedUrl} title={item.title} />;

    case 'ai_tool': {
      // AI tool slug can come from explicit field or extracted from embedUrl
      const slug =
        item.aiToolSlug || (item.embedUrl ? extractAiToolSlug(item.embedUrl) : undefined);
      if (!slug) {
        return <MissingContentError type="AI tool" title={item.title} />;
      }
      return <AiToolRenderer aiToolSlug={slug} studentId={studentId} title={item.title} />;
    }

    case 'text': {
      // Text content can come from explicit field or extracted from embedUrl
      const content =
        item.contentText || (item.embedUrl ? extractTextContent(item.embedUrl) : undefined) || '';
      return <TextRenderer content={content} title={item.title} />;
    }

    case 'external_link':
      if (!item.embedUrl) {
        return <MissingContentError type="external link" title={item.title} />;
      }
      return (
        <ExternalLinkRenderer
          url={item.embedUrl}
          title={item.title}
          description={item.description}
        />
      );

    case 'credentials':
      if (!item.credentialsData) {
        return <MissingContentError type="credentials" title={item.title} />;
      }
      return <CredentialsRenderer credentials={item.credentialsData} title={item.title} />;

    default:
      return <UnsupportedContentType type={contentType} title={item.title} />;
  }
};

interface MissingContentErrorProps {
  type: string;
  title?: string;
}

const MissingContentError: React.FC<MissingContentErrorProps> = ({ type, title }) => (
  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6 flex items-start gap-4">
    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
    <div>
      <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
        {title || 'Content Error'}
      </h3>
      <p className="text-sm text-red-600 dark:text-red-400">
        Required data for this {type} is missing. Please contact support if this issue persists.
      </p>
    </div>
  </div>
);

interface UnsupportedContentTypeProps {
  type: string;
  title?: string;
}

const UnsupportedContentType: React.FC<UnsupportedContentTypeProps> = ({ type, title }) => (
  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-6 flex items-start gap-4">
    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
    <div>
      <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
        {title || 'Unsupported Content'}
      </h3>
      <p className="text-sm text-amber-600 dark:text-amber-400">
        Content type "{type}" is not yet supported. Please contact support.
      </p>
    </div>
  </div>
);

export default ContentItemRenderer;
