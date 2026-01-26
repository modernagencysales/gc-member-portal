import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { LmsContentType, detectContentType } from '../../../../types/lms-types';

interface SmartUrlInputProps {
  onAdd: (data: {
    title: string;
    contentType: LmsContentType;
    embedUrl?: string;
    contentText?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

const SmartUrlInput: React.FC<SmartUrlInputProps> = ({
  onAdd,
  placeholder = 'Paste URL or type title...',
  className = '',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const extractTitle = (url: string, type: LmsContentType): string => {
    // Try to extract a meaningful title from the URL
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Remove common prefixes and file extensions
      let title = pathname.split('/').filter(Boolean).pop() || '';

      // Clean up the title
      title = title
        .replace(/[-_]/g, ' ')
        .replace(/\.[^.]+$/, '')
        .trim();

      if (title) {
        return title.charAt(0).toUpperCase() + title.slice(1);
      }
    } catch {
      // Not a valid URL
    }

    // Fallback titles by type
    const fallbacks: Record<LmsContentType, string> = {
      video: 'Video',
      slide_deck: 'Slides',
      guide: 'Guide',
      clay_table: 'Clay Table',
      ai_tool: 'AI Tool',
      text: 'Text',
      external_link: 'Link',
      credentials: 'Credentials',
    };

    return fallbacks[type] || 'Content';
  };

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setIsAdding(false);
      return;
    }

    // Check if it's a URL
    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');

    if (isUrl) {
      const contentType = detectContentType(trimmed);
      const title = extractTitle(trimmed, contentType);
      onAdd({
        title,
        contentType,
        embedUrl: trimmed,
      });
    } else {
      // Plain text - treat as text content
      onAdd({
        title: trimmed.slice(0, 50) + (trimmed.length > 50 ? '...' : ''),
        contentType: 'text',
        contentText: trimmed,
      });
    }

    setValue('');
    setIsAdding(false);
  };

  const handleCancel = () => {
    setValue('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (value.trim()) {
        handleSave();
      } else {
        handleCancel();
      }
    }, 150);
  };

  if (isAdding) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-b border-violet-500 outline-none px-1 py-1 text-sm"
        />
        <span className="text-xs text-zinc-400">Enter to save</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className={`flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 ${className}`}
    >
      <Plus className="w-4 h-4" />
      Add content
    </button>
  );
};

export default SmartUrlInput;
