/**
 * LessonContentRenderer.tsx
 * Renders a single lesson's content based on its embedUrl scheme.
 * Supports 9 content types: HTML text, markdown text, credentials, custom AI tool,
 * Pickaxe embed, AI Studio, PDF, external link, and generic iframe.
 * No state. Pure rendering based on props.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { ExternalLink, ShieldAlert, Bot, Copy, CheckCheck, Key } from 'lucide-react';
import type { Lesson } from '../../types';
import { ChatInterface } from '../chat';
import LessonDescription from './LessonDescription';
import SopLinksCard from './SopLinksCard';
import { preprocessTextContent } from '../../lib/markdown-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CredentialsData {
  loginUrl?: string;
  username?: string;
  password?: string;
  notes?: string;
}

export interface LessonContentRendererProps {
  lesson: Lesson;
  studentId?: string;
  isTextContent: boolean;
  isHtmlContent: boolean;
  htmlContent: string;
  textRawContent: string;
  isCredentials: boolean;
  credentialsData: CredentialsData | null;
  isCustomAITool: boolean;
  aiToolSlug: string | null;
  isPickaxe: boolean;
  pickaxeId: string | null;
  isAistudio: boolean;
  isPdf: boolean;
  isExternalLink: boolean;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

// ─── Markdown components (stable reference) ───────────────────────────────────

const MARKDOWN_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p: ({ children }) => <p style={{ marginBottom: '1rem' }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
  h2: ({ children }) => (
    <h2
      style={{
        fontSize: '1.35rem',
        fontWeight: 600,
        marginTop: '2.5rem',
        marginBottom: '0.75rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(161,161,170,0.2)',
      }}
    >
      {children}
    </h2>
  ),
  ul: ({ children }) => (
    <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
      {children}
    </ul>
  ),
  li: ({ children }) => <li style={{ marginBottom: '0.375rem' }}>{children}</li>,
  hr: () => (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid rgba(161,161,170,0.2)',
        margin: '2rem 0',
      }}
    />
  ),
};

// ─── Credential field row ─────────────────────────────────────────────────────

interface CredentialRowProps {
  label: string;
  value: string;
  fieldKey: string;
  href?: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

const CredentialRow: React.FC<CredentialRowProps> = ({
  label,
  value,
  fieldKey,
  href,
  copiedField,
  onCopy,
}) => (
  <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-violet-600 dark:text-violet-400 hover:underline truncate block"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-zinc-900 dark:text-white font-mono">{value}</p>
      )}
    </div>
    <button
      onClick={() => onCopy(value, fieldKey)}
      className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      title={`Copy ${label}`}
    >
      {copiedField === fieldKey ? (
        <CheckCheck size={18} className="text-green-500" />
      ) : (
        <Copy size={18} className="text-zinc-400" />
      )}
    </button>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const LessonContentRenderer: React.FC<LessonContentRendererProps> = ({
  lesson,
  studentId,
  isTextContent,
  isHtmlContent,
  htmlContent,
  textRawContent,
  isCredentials,
  credentialsData,
  isCustomAITool,
  aiToolSlug,
  isPickaxe,
  pickaxeId,
  isAistudio,
  isPdf,
  isExternalLink,
  copiedField,
  onCopy,
}) => {
  // ── Rendered content block ────────────────────────────────────────────────

  let contentBlock: React.ReactNode;

  if (isTextContent && isHtmlContent) {
    // HTML text (from DOCX import)
    contentBlock = (
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 text-zinc-700 dark:text-zinc-300 document-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  } else if (isTextContent) {
    // Plain markdown text
    contentBlock = (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 text-zinc-700 dark:text-zinc-300 document-content">
        <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]} components={MARKDOWN_COMPONENTS}>
          {preprocessTextContent(textRawContent)}
        </ReactMarkdown>
      </div>
    );
  } else if (isCredentials && credentialsData) {
    // Credentials card
    contentBlock = (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Key size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Access Credentials
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Click to copy each field</p>
          </div>
        </div>

        <div className="space-y-4">
          {credentialsData.loginUrl && (
            <CredentialRow
              label="Login URL"
              value={credentialsData.loginUrl}
              fieldKey="loginUrl"
              href={credentialsData.loginUrl}
              copiedField={copiedField}
              onCopy={onCopy}
            />
          )}
          {credentialsData.username && (
            <CredentialRow
              label="Username / Email"
              value={credentialsData.username}
              fieldKey="username"
              copiedField={copiedField}
              onCopy={onCopy}
            />
          )}
          {credentialsData.password && (
            <CredentialRow
              label="Password"
              value={credentialsData.password}
              fieldKey="password"
              copiedField={copiedField}
              onCopy={onCopy}
            />
          )}
          {credentialsData.notes && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">{credentialsData.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  } else if (isCustomAITool && aiToolSlug) {
    // Custom AI tool (ChatInterface)
    contentBlock = studentId ? (
      <ChatInterface toolSlug={aiToolSlug} studentId={studentId} />
    ) : (
      <div className="w-full h-[600px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
        <div className="text-center text-zinc-500 dark:text-zinc-400">
          <p>Loading AI Tool...</p>
        </div>
      </div>
    );
  } else if (isPickaxe && pickaxeId) {
    // Pickaxe embed (legacy)
    contentBlock = (
      <div className="w-full min-h-[800px] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div key={pickaxeId} id={pickaxeId} className="w-full flex-grow min-h-[700px]" />
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center gap-2">
          <Bot size={14} className="text-violet-500" />
          <span className="text-xs text-zinc-500">Powered by Modern Agency Sales</span>
        </div>
      </div>
    );
  } else if (isAistudio) {
    // Google AI Studio (cannot embed — show external link)
    contentBlock = (
      <div className="bg-zinc-900 p-12 rounded-lg border border-zinc-800 flex flex-col items-center justify-center text-center gap-6">
        <ShieldAlert size={32} className="text-violet-400" />
        <h3 className="text-white font-semibold text-lg mb-2">Google Security</h3>
        <a
          href={lesson.embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          Open AI Studio <ExternalLink size={16} />
        </a>
      </div>
    );
  } else if (isPdf) {
    // PDF viewer
    contentBlock = (
      <div
        className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-sm"
        style={{ height: '85vh' }}
      >
        <iframe src={lesson.embedUrl} className="w-full h-full border-0" title={lesson.title} />
      </div>
    );
  } else if (isExternalLink) {
    // External link card (non-embeddable URL)
    const hostname = (() => {
      try {
        return new URL(lesson.embedUrl).hostname.replace('www.', '');
      } catch {
        return lesson.embedUrl;
      }
    })();

    contentBlock = (
      <a
        href={lesson.embedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-lg transition-all group cursor-pointer overflow-hidden"
      >
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 px-8 py-10 flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
            <ExternalLink size={28} className="text-violet-500" />
          </div>
        </div>
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-zinc-900 dark:text-white font-semibold text-base mb-1 truncate">
              {lesson.title}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{hostname}</p>
          </div>
          <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-800/40 transition-colors">
            <ExternalLink size={14} className="text-violet-600 dark:text-violet-400" />
          </div>
        </div>
      </a>
    );
  } else {
    // Generic iframe (video, Loom, Grain, Google Drive, etc.)
    const iframeSrc = lesson.embedUrl.includes('drive.google.com/file')
      ? lesson.embedUrl.replace(/\/view.*$/, '/preview')
      : (lesson.embedUrl.includes('grain.com') || lesson.embedUrl.includes('grain.co')) &&
          lesson.embedUrl.includes('/share/')
        ? lesson.embedUrl.replace('/share/', '/_/embed/')
        : lesson.embedUrl;

    const isGoogleDriveFile = lesson.embedUrl.includes('drive.google.com/file');

    contentBlock = (
      <div
        className={`rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 shadow-sm ${isGoogleDriveFile ? 'min-h-[80vh]' : 'aspect-video'}`}
      >
        <iframe src={iframeSrc} className="w-full h-full border-0" allowFullScreen />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-slide-in">
      <div className="mb-8">
        {contentBlock}

        {/* Description text below content (not shown for text-type lessons) */}
        {!isTextContent && lesson.description && (
          <LessonDescription description={lesson.description} />
        )}

        {/* Reference SOPs */}
        {lesson.sopLinks && lesson.sopLinks.length > 0 && (
          <SopLinksCard sopLinks={lesson.sopLinks} />
        )}
      </div>
    </div>
  );
};

export default LessonContentRenderer;
