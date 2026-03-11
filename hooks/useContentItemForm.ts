/**
 * useContentItemForm — Form state and submit logic for LmsContentItemModal.
 * Manages formData, URL detection/normalization, and form submission.
 * Never imports React Router, Supabase, or any UI component.
 */

import { useState, useEffect } from 'react';
import type { LmsContentItem, LmsContentItemFormData, LmsContentType } from '../types/lms-types';
import { detectContentType, normalizeEmbedUrl } from '../types/lms-types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UseContentItemFormOptions {
  initialData?: LmsContentItem | null;
  initialContentType?: LmsContentType;
  isOpen: boolean;
  onSubmit: (data: LmsContentItemFormData) => Promise<void>;
}

interface UseContentItemFormReturn {
  formData: Partial<LmsContentItemFormData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<LmsContentItemFormData>>>;
  handleUrlChange: (url: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

// ─── Default State ────────────────────────────────────────────────────────────

const EMPTY_FORM: Partial<LmsContentItemFormData> = {
  title: '',
  contentType: 'video',
  embedUrl: '',
  aiToolSlug: '',
  contentText: '',
  credentialsData: { loginUrl: '', username: '', password: '', notes: '' },
  description: '',
  isVisible: true,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContentItemForm({
  initialData,
  initialContentType,
  isOpen,
  onSubmit,
}: UseContentItemFormOptions): UseContentItemFormReturn {
  const [formData, setFormData] = useState<Partial<LmsContentItemFormData>>(EMPTY_FORM);

  // Reset form whenever the modal opens or initial data changes
  useEffect(() => {
    if (initialData) {
      // For text content, extract text from embedUrl if contentText is empty
      let contentText = initialData.contentText || '';
      if (!contentText && initialData.embedUrl?.startsWith('text:')) {
        contentText = initialData.embedUrl.replace(/^text:\s*/, '');
      }
      setFormData({
        title: initialData.title,
        contentType: initialData.contentType,
        embedUrl: initialData.embedUrl?.startsWith('text:') ? '' : initialData.embedUrl || '',
        aiToolSlug: initialData.aiToolSlug || '',
        contentText,
        credentialsData: initialData.credentialsData || {
          loginUrl: '',
          username: '',
          password: '',
          notes: '',
        },
        description: initialData.description || '',
        isVisible: initialData.isVisible,
      });
    } else {
      setFormData({
        ...EMPTY_FORM,
        contentType: initialContentType || 'video',
      });
    }
  }, [initialData, initialContentType, isOpen]);

  const handleUrlChange = (url: string) => {
    const detectedType = detectContentType(url);
    const normalizedUrl = normalizeEmbedUrl(url);
    setFormData((prev) => ({
      ...prev,
      embedUrl: normalizedUrl || url,
      contentType: detectedType,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData as LmsContentItemFormData);
  };

  return { formData, setFormData, handleUrlChange, handleSubmit };
}
