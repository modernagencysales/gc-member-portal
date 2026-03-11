/**
 * TextContentEditor — Markdown editor with toolbar and preview toggle.
 * Supports DOCX import (via mammoth) and inline Markdown rendering.
 * Never manages its own persistence — all state flows through value/onChange props.
 */

import React, { useState, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Eye,
  Code,
  Minus,
  Upload,
} from 'lucide-react';
import { logError, logWarn } from '../../../../lib/logError';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TextContentEditorProps {
  value: string;
  onChange: (val: string) => void;
  isDarkMode: boolean;
  required?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const TextContentEditor: React.FC<TextContentEditorProps> = ({
  value,
  onChange,
  isDarkMode,
  required,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);

  // ─── DOCX Import ──────────────────────────────────────────────────────────

  const handleDocxImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (result.value) {
          // Prefix with marker so the student view knows to render as HTML
          onChange('<!--docx-->' + result.value);
          setShowPreview(true);
        }
        if (result.messages.length > 0) {
          logWarn('TextContentEditor:docxImport', 'DOCX import warnings', {
            messages: result.messages,
          });
        }
      } catch (err) {
        logError('TextContentEditor:docxImport', err);
        window.alert('Failed to import DOCX file. Please try again.');
      } finally {
        setImporting(false);
        // Reset file input so same file can be re-imported
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [onChange]
  );

  // ─── Toolbar ──────────────────────────────────────────────────────────────

  const insertMarkdown = useCallback(
    (before: string, after: string = '') => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.substring(start, end);
      const newText = value.substring(0, start) + before + selected + after + value.substring(end);
      onChange(newText);
      // Restore cursor position after the inserted text
      requestAnimationFrame(() => {
        ta.focus();
        const cursorPos = start + before.length + selected.length + after.length;
        ta.setSelectionRange(
          selected ? cursorPos : start + before.length,
          selected ? cursorPos : start + before.length
        );
      });
    },
    [value, onChange]
  );

  const handleHeading = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    // Find start of current line
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const linePrefix = value.substring(lineStart, start);
    if (selected) {
      // Wrap selection as heading
      const prefix = lineStart === start && !linePrefix ? '' : '\n';
      const newText =
        value.substring(0, start) + prefix + '## ' + selected + '\n' + value.substring(end);
      onChange(newText);
    } else {
      // Add heading at start of current line (or new line)
      if (linePrefix.trim() === '') {
        const newText = value.substring(0, lineStart) + '## ' + value.substring(start);
        onChange(newText);
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(lineStart + 3, lineStart + 3);
        });
      } else {
        const newText = value.substring(0, start) + '\n## ';
        onChange(newText + value.substring(start));
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(start + 4, start + 4);
        });
      }
    }
  }, [value, onChange]);

  const toolbarButtons = [
    {
      icon: <Bold className="w-3.5 h-3.5" />,
      action: () => insertMarkdown('**', '**'),
      title: 'Bold',
    },
    {
      icon: <Italic className="w-3.5 h-3.5" />,
      action: () => insertMarkdown('*', '*'),
      title: 'Italic',
    },
    { icon: <Heading2 className="w-3.5 h-3.5" />, action: handleHeading, title: 'Heading' },
    {
      icon: <List className="w-3.5 h-3.5" />,
      action: () => insertMarkdown('\n- '),
      title: 'Bullet list',
    },
    {
      icon: <ListOrdered className="w-3.5 h-3.5" />,
      action: () => insertMarkdown('\n1. '),
      title: 'Numbered list',
    },
    {
      icon: <Link2 className="w-3.5 h-3.5" />,
      action: () => insertMarkdown('[', '](url)'),
      title: 'Link',
    },
    {
      icon: <Code className="w-3.5 h-3.5" />,
      action: () => insertMarkdown('`', '`'),
      title: 'Code',
    },
    {
      icon: <Minus className="w-3.5 h-3.5" />,
      action: () => insertMarkdown('\n---\n'),
      title: 'Divider',
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label
          className={`block text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
        >
          Text Content *
        </label>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            showPreview
              ? 'bg-violet-600 text-white'
              : isDarkMode
                ? 'text-zinc-400 hover:bg-zinc-800'
                : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {showPreview ? 'Editing' : 'Preview'}
        </button>
      </div>

      {showPreview ? (
        <div
          className={`w-full min-h-[300px] max-h-[60vh] overflow-y-auto px-6 py-4 rounded-lg border text-sm document-content ${
            isDarkMode
              ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
              : 'bg-white border-zinc-300 text-zinc-800'
          }`}
        >
          <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
            {value || '*Nothing to preview*'}
          </ReactMarkdown>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div
            className={`flex items-center gap-0.5 px-2 py-1.5 rounded-t-lg border border-b-0 ${
              isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
            }`}
          >
            {toolbarButtons.map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={btn.action}
                title={btn.title}
                className={`p-1.5 rounded ${
                  isDarkMode
                    ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                    : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
                }`}
              >
                {btn.icon}
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your content using Markdown formatting..."
            rows={16}
            required={required}
            className={`w-full px-4 py-3 rounded-b-lg border ${
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500'
                : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
            } focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y font-mono text-sm min-h-[200px]`}
          />
        </>
      )}

      <div className="flex items-center gap-2 mt-1.5">
        <p className={`text-xs flex-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Supports Markdown: **bold**, *italic*, ## headings, - lists, [links](url), --- dividers
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleDocxImport}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            isDarkMode
              ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
          } ${importing ? 'opacity-50 cursor-wait' : ''}`}
        >
          <Upload className="w-3.5 h-3.5" />
          {importing ? 'Importing...' : 'Import DOCX'}
        </button>
      </div>
    </div>
  );
};

export default TextContentEditor;
