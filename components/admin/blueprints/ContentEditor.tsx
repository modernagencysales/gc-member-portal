import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import {
  getAllContentBlocksAdmin,
  updateContentBlock,
  createContentBlock,
} from '../../../services/blueprint-supabase';
import { queryKeys } from '../../../lib/queryClient';

interface ContentEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'blueprint' | 'offer' | 'ctas';

interface FAQItem {
  question: string;
  answer: string;
}

interface ContentBlockData {
  id?: string;
  title: string;
  content: string;
  items?: FAQItem[];
}

const TABS: { id: TabType; label: string }[] = [
  { id: 'blueprint', label: 'Blueprint Page' },
  { id: 'offer', label: 'Offer Page' },
  { id: 'ctas', label: 'CTAs' },
];

const ContentEditor: React.FC<ContentEditorProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('blueprint');
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for each content block
  const [allboundSystem, setAllboundSystem] = useState<ContentBlockData>({
    title: 'The Allbound System',
    content: '',
  });
  const [bootcampPitch, setBootcampPitch] = useState<ContentBlockData>({
    title: 'Bootcamp Pitch',
    content: '',
  });
  const [faqs, setFaqs] = useState<ContentBlockData>({
    title: 'FAQs',
    content: '',
    items: [],
  });
  const [offerFoundations, setOfferFoundations] = useState<ContentBlockData>({
    title: 'Foundations',
    content: '',
  });
  const [offerEngineering, setOfferEngineering] = useState<ContentBlockData>({
    title: 'Engineering',
    content: '',
  });
  const [cta1, setCta1] = useState<ContentBlockData>({
    title: 'CTA 1',
    content: '',
  });
  const [cta2, setCta2] = useState<ContentBlockData>({
    title: 'CTA 2',
    content: '',
  });
  const [cta3, setCta3] = useState<ContentBlockData>({
    title: 'CTA 3',
    content: '',
  });
  const [stickyCta, setStickyCta] = useState<ContentBlockData>({
    title: 'Sticky CTA',
    content: '',
  });

  // Fetch existing content blocks
  const { data: contentBlocks, isLoading } = useQuery({
    queryKey: queryKeys.blueprintContentBlocks(),
    queryFn: getAllContentBlocksAdmin,
    enabled: isOpen,
  });

  // Parse content blocks into form state
  useEffect(() => {
    if (!contentBlocks) return;

    contentBlocks.forEach((block) => {
      const key = block.title?.toLowerCase().replace(/\s+/g, '_');

      switch (key) {
        case 'allbound_system':
        case 'the_allbound_system':
          setAllboundSystem({
            id: block.id,
            title: block.title || 'The Allbound System',
            content: block.content || '',
          });
          break;
        case 'bootcamp_pitch':
          setBootcampPitch({
            id: block.id,
            title: block.title || 'Bootcamp Pitch',
            content: block.content || '',
          });
          break;
        case 'faqs':
          try {
            const items = block.content ? JSON.parse(block.content) : [];
            setFaqs({
              id: block.id,
              title: block.title || 'FAQs',
              content: block.content || '',
              items: Array.isArray(items) ? items : [],
            });
          } catch {
            setFaqs({
              id: block.id,
              title: block.title || 'FAQs',
              content: '',
              items: [],
            });
          }
          break;
        case 'offer_foundations':
        case 'foundations':
          setOfferFoundations({
            id: block.id,
            title: block.title || 'Foundations',
            content: block.content || '',
          });
          break;
        case 'offer_engineering':
        case 'engineering':
          setOfferEngineering({
            id: block.id,
            title: block.title || 'Engineering',
            content: block.content || '',
          });
          break;
        case 'cta_1':
          setCta1({
            id: block.id,
            title: block.title || 'CTA 1',
            content: block.content || '',
          });
          break;
        case 'cta_2':
          setCta2({
            id: block.id,
            title: block.title || 'CTA 2',
            content: block.content || '',
          });
          break;
        case 'cta_3':
          setCta3({
            id: block.id,
            title: block.title || 'CTA 3',
            content: block.content || '',
          });
          break;
        case 'sticky_cta':
          setStickyCta({
            id: block.id,
            title: block.title || 'Sticky CTA',
            content: block.content || '',
          });
          break;
      }
    });
  }, [contentBlocks]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id?: string; title: string; content: string }) => {
      if (id) {
        return updateContentBlock(id, { title, content });
      } else {
        return createContentBlock({
          blockType: 'feature', // Using 'feature' as a generic type
          title,
          content,
          isVisible: true,
          sortOrder: 0,
        });
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprintContentBlocks() });
      setShowSuccess(variables.title);
      setTimeout(() => setShowSuccess(null), 2000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setTimeout(() => setError(null), 3000);
    },
  });

  // Save handlers for each section
  const handleSaveBlock = useCallback(
    async (data: ContentBlockData) => {
      await saveMutation.mutateAsync({
        id: data.id,
        title: data.title,
        content: data.content,
      });
    },
    [saveMutation]
  );

  const handleSaveFaqs = useCallback(async () => {
    const content = JSON.stringify(faqs.items || []);
    await saveMutation.mutateAsync({
      id: faqs.id,
      title: 'FAQs',
      content,
    });
  }, [faqs, saveMutation]);

  // FAQ handlers
  const addFaqItem = () => {
    setFaqs((prev) => ({
      ...prev,
      items: [...(prev.items || []), { question: '', answer: '' }],
    }));
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqs((prev) => ({
      ...prev,
      items: prev.items?.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const removeFaqItem = (index: number) => {
    setFaqs((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index),
    }));
  };

  // Global save
  const handleSaveAll = async () => {
    try {
      if (activeTab === 'blueprint') {
        await handleSaveBlock(allboundSystem);
        await handleSaveBlock(bootcampPitch);
        await handleSaveFaqs();
      } else if (activeTab === 'offer') {
        await handleSaveBlock(offerFoundations);
        await handleSaveBlock(offerEngineering);
      } else if (activeTab === 'ctas') {
        await handleSaveBlock(cta1);
        await handleSaveBlock(cta2);
        await handleSaveBlock(cta3);
        await handleSaveBlock(stickyCta);
      }
    } catch (err) {
      console.error('Save all failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-lg font-semibold text-white">Content Editor</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-6 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-zinc-600 border-t-violet-500 rounded-full animate-spin" />
              <span className="ml-3 text-zinc-400">Loading content...</span>
            </div>
          ) : (
            <>
              {/* Blueprint Page Tab */}
              {activeTab === 'blueprint' && (
                <div className="space-y-8">
                  {/* Allbound System */}
                  <ContentSection
                    title="Allbound System"
                    description="Rich text content for the Allbound System section"
                    value={allboundSystem.content}
                    onChange={(content) => setAllboundSystem((prev) => ({ ...prev, content }))}
                    onSave={() => handleSaveBlock(allboundSystem)}
                    isSaving={saveMutation.isPending}
                    showSuccess={showSuccess === allboundSystem.title}
                  />

                  {/* Bootcamp Pitch */}
                  <ContentSection
                    title="Bootcamp Pitch"
                    description="Rich text content for the Bootcamp sales pitch"
                    value={bootcampPitch.content}
                    onChange={(content) => setBootcampPitch((prev) => ({ ...prev, content }))}
                    onSave={() => handleSaveBlock(bootcampPitch)}
                    isSaving={saveMutation.isPending}
                    showSuccess={showSuccess === bootcampPitch.title}
                  />

                  {/* FAQs */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-200">FAQs</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Question and answer pairs for the FAQ section
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={addFaqItem}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add FAQ
                        </button>
                        <button
                          onClick={handleSaveFaqs}
                          disabled={saveMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                        >
                          {saveMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : showSuccess === 'FAQs' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save FAQs
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {faqs.items?.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border border-zinc-800 bg-zinc-800/30 space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                  Question
                                </label>
                                <input
                                  type="text"
                                  value={item.question}
                                  onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                                  placeholder="Enter the question..."
                                  className="w-full px-3 py-2 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                  Answer
                                </label>
                                <textarea
                                  value={item.answer}
                                  onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                                  placeholder="Enter the answer..."
                                  rows={3}
                                  className="w-full px-3 py-2 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeFaqItem(index)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                              title="Remove FAQ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {faqs.items?.length === 0 && (
                        <div className="text-center py-8 text-zinc-500 text-sm">
                          No FAQs added yet. Click "Add FAQ" to create one.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Offer Page Tab */}
              {activeTab === 'offer' && (
                <div className="space-y-8">
                  {/* Foundations Content */}
                  <ContentSection
                    title="Foundations Content"
                    description="Content for the Foundations offer section"
                    value={offerFoundations.content}
                    onChange={(content) => setOfferFoundations((prev) => ({ ...prev, content }))}
                    onSave={() => handleSaveBlock(offerFoundations)}
                    isSaving={saveMutation.isPending}
                    showSuccess={showSuccess === offerFoundations.title}
                  />

                  {/* Engineering Content */}
                  <ContentSection
                    title="Engineering Content"
                    description="Content for the Engineering offer section"
                    value={offerEngineering.content}
                    onChange={(content) => setOfferEngineering((prev) => ({ ...prev, content }))}
                    onSave={() => handleSaveBlock(offerEngineering)}
                    isSaving={saveMutation.isPending}
                    showSuccess={showSuccess === offerEngineering.title}
                  />
                </div>
              )}

              {/* CTAs Tab */}
              {activeTab === 'ctas' && (
                <div className="space-y-8">
                  {/* Contextual CTAs */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-200">Contextual CTAs</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Three contextual call-to-action messages shown throughout the blueprint
                      </p>
                    </div>

                    <ContentSection
                      title="CTA 1"
                      description="First contextual CTA copy"
                      value={cta1.content}
                      onChange={(content) => setCta1((prev) => ({ ...prev, content }))}
                      onSave={() => handleSaveBlock(cta1)}
                      isSaving={saveMutation.isPending}
                      showSuccess={showSuccess === cta1.title}
                      compact
                    />

                    <ContentSection
                      title="CTA 2"
                      description="Second contextual CTA copy"
                      value={cta2.content}
                      onChange={(content) => setCta2((prev) => ({ ...prev, content }))}
                      onSave={() => handleSaveBlock(cta2)}
                      isSaving={saveMutation.isPending}
                      showSuccess={showSuccess === cta2.title}
                      compact
                    />

                    <ContentSection
                      title="CTA 3"
                      description="Third contextual CTA copy"
                      value={cta3.content}
                      onChange={(content) => setCta3((prev) => ({ ...prev, content }))}
                      onSave={() => handleSaveBlock(cta3)}
                      isSaving={saveMutation.isPending}
                      showSuccess={showSuccess === cta3.title}
                      compact
                    />
                  </div>

                  {/* Sticky CTA */}
                  <div className="pt-4 border-t border-zinc-800">
                    <ContentSection
                      title="Sticky CTA"
                      description="The floating call-to-action that appears at the bottom of the page"
                      value={stickyCta.content}
                      onChange={(content) => setStickyCta((prev) => ({ ...prev, content }))}
                      onSave={() => handleSaveBlock(stickyCta)}
                      isSaving={saveMutation.isPending}
                      showSuccess={showSuccess === stickyCta.title}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 shrink-0">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saveMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {saveMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save All
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable content section component
interface ContentSectionProps {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  showSuccess: boolean;
  compact?: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  description,
  value,
  onChange,
  onSave,
  isSaving,
  showSuccess,
  compact = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-zinc-200">{title}</h4>
          {!compact && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
        </div>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : showSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${title.toLowerCase()} content...`}
        rows={compact ? 3 : 6}
        className="w-full px-4 py-3 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none"
      />
    </div>
  );
};

export default ContentEditor;
