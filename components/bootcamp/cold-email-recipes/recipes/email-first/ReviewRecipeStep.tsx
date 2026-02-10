import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  Loader2,
  Eye,
  Plus,
} from 'lucide-react';
import type {
  RecipeStep,
  AiPromptConfig,
  AiExtractConfig,
  EmailTemplate,
} from '../../../../../types/cold-email-recipe-types';
import type { PreviewResult } from '../../../../../types/email-first-recipe-types';
import StepEditor from '../StepEditor';
import EmailTemplateEditor from '../EmailTemplateEditor';

interface Props {
  steps: RecipeStep[];
  onStepsChange: (steps: RecipeStep[]) => void;
  emailTemplate: EmailTemplate;
  onEmailTemplateChange: (template: EmailTemplate) => void;
  onPreview: (sampleLead: Record<string, string>) => void;
  previewing: boolean;
  previewResult: PreviewResult | null;
  onNext: () => void;
  onBack: () => void;
}

const STEP_TYPE_ICONS: Record<string, string> = {
  ai_prompt: 'AI',
  ai_extract: 'EX',
  transform: 'TX',
  field_map: 'FM',
  google_search: 'GS',
  news_search: 'NS',
  website_scrape: 'WS',
  web_scrape: 'WB',
  linkedin_scrape: 'LI',
  linkedin_posts: 'LP',
  youtube_transcript: 'YT',
  gemini_video: 'GV',
  find_email: 'FE',
  validate_email: 'VE',
};

const STEP_TYPE_COLORS: Record<string, string> = {
  ai_prompt: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  ai_extract: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  transform: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  field_map: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  google_search: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  news_search: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  website_scrape: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  web_scrape: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  linkedin_scrape: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  linkedin_posts: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  youtube_transcript: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  gemini_video: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  find_email: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  validate_email: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
};

const DEFAULT_STEP_ICON = '??';
const DEFAULT_STEP_COLOR = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';

export default function ReviewRecipeStep({
  steps,
  onStepsChange,
  emailTemplate,
  onEmailTemplateChange,
  onPreview,
  previewing,
  previewResult,
  onNext,
  onBack,
}: Props) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showPreviewForm, setShowPreviewForm] = useState(false);
  const [sampleLead, setSampleLead] = useState<Record<string, string>>({
    first_name: 'John',
    last_name: 'Smith',
    email: 'john@acme.com',
    company: 'Acme Corp',
    title: 'CEO',
    linkedin_url: 'https://linkedin.com/in/johnsmith',
  });

  // Compute available fields from steps + standard fields
  const availableFields = useMemo(() => {
    const fields = new Set<string>([
      'first_name',
      'last_name',
      'email',
      'company',
      'title',
      'linkedin_url',
    ]);
    for (const step of steps) {
      if (step.type === 'ai_prompt') {
        const config = step.config as AiPromptConfig;
        if (config.output_field) fields.add(config.output_field);
      }
      if (step.type === 'ai_extract') {
        const config = step.config as AiExtractConfig;
        for (const f of config.fields) {
          if (f) fields.add(f);
        }
      }
    }
    return [...fields];
  }, [steps]);

  const updateStep = (index: number, updated: RecipeStep) => {
    onStepsChange(steps.map((s, i) => (i === index ? updated : s)));
  };

  const removeStep = (index: number) => {
    onStepsChange(steps.filter((_, i) => i !== index));
  };

  const addStep = () => {
    const newStep: RecipeStep = {
      id: window.crypto.randomUUID(),
      type: 'ai_prompt',
      name: '',
      config: { prompt: '', output_field: '', max_tokens: 300 },
    };
    onStepsChange([...steps, newStep]);
    setExpandedStep(newStep.id);
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    const newSteps = [...steps];
    const [moved] = newSteps.splice(from, 1);
    newSteps.splice(to, 0, moved);
    onStepsChange(newSteps);
  };

  const handlePreviewSubmit = () => {
    onPreview(sampleLead);
  };

  return (
    <div className="space-y-5">
      {/* AI-generated message */}
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-3">
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          AI has generated {steps.length} enrichment step{steps.length !== 1 ? 's' : ''} to fill
          your email variables. Review each step below, then preview with a sample lead.
        </p>
      </div>

      {/* Steps list (collapsed view with expand) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Enrichment Steps</h3>
          <button
            onClick={addStep}
            className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 font-medium transition-colors"
          >
            <Plus size={12} />
            Add Step
          </button>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              No steps. Add enrichment steps to fill your email variables.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={step.id}>
                {/* Collapsed step header */}
                <div
                  className={`rounded-lg border transition-colors ${
                    expandedStep === step.id
                      ? 'border-violet-300 dark:border-violet-700'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  >
                    {/* Drag handle + reorder */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveStep(index, index - 1);
                        }}
                        disabled={index === 0}
                        className="text-zinc-300 hover:text-zinc-500 disabled:opacity-0 text-[10px]"
                      >
                        &#9650;
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveStep(index, index + 1);
                        }}
                        disabled={index === steps.length - 1}
                        className="text-zinc-300 hover:text-zinc-500 disabled:opacity-0 text-[10px]"
                      >
                        &#9660;
                      </button>
                    </div>

                    {/* Step number + type badge */}
                    <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
                      {index + 1}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                        STEP_TYPE_COLORS[step.type] || DEFAULT_STEP_COLOR
                      }`}
                    >
                      {STEP_TYPE_ICONS[step.type] || DEFAULT_STEP_ICON}
                    </span>

                    {/* Step name */}
                    <span className="text-xs font-medium text-zinc-900 dark:text-white flex-1 truncate">
                      {step.name || `Step ${index + 1}`}
                    </span>

                    {/* Expand/collapse + delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(index);
                        }}
                        className="p-1 rounded text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                      {expandedStep === step.id ? (
                        <ChevronDown size={14} className="text-zinc-400" />
                      ) : (
                        <ChevronRight size={14} className="text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded step editor */}
                  {expandedStep === step.id && (
                    <div className="px-3 pb-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <StepEditor
                        step={step}
                        index={index}
                        onChange={(updated) => updateStep(index, updated)}
                        onRemove={() => removeStep(index)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Template */}
      <EmailTemplateEditor
        template={emailTemplate}
        onChange={onEmailTemplateChange}
        availableFields={availableFields}
      />

      {/* Preview Section */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Preview with Sample Lead
          </h3>
          <button
            onClick={() => setShowPreviewForm(!showPreviewForm)}
            className="inline-flex items-center gap-1.5 text-xs text-violet-500 hover:text-violet-600 font-medium transition-colors"
          >
            <Eye size={12} />
            {showPreviewForm ? 'Hide Preview' : 'Test Preview'}
          </button>
        </div>

        {showPreviewForm && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {['first_name', 'last_name', 'email', 'company', 'title', 'linkedin_url'].map(
                (field) => (
                  <div key={field}>
                    <label className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">
                      {field}
                    </label>
                    <input
                      type="text"
                      value={sampleLead[field] || ''}
                      onChange={(e) => setSampleLead({ ...sampleLead, [field]: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                )
              )}
            </div>

            <button
              onClick={handlePreviewSubmit}
              disabled={previewing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {previewing ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Running preview...
                </>
              ) : (
                <>
                  <Play size={12} />
                  Preview
                </>
              )}
            </button>

            {/* Preview results */}
            {previewResult?.preview && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Summary */}
                <div className="border-b border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-800/30">
                  <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                    Summary
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {previewResult.preview.summary.succeeded}/
                    {previewResult.preview.summary.total_steps} steps succeeded
                    {previewResult.preview.summary.failed > 0 &&
                      `, ${previewResult.preview.summary.failed} failed`}
                    {previewResult.preview.summary.skipped > 0 &&
                      `, ${previewResult.preview.summary.skipped} skipped`}{' '}
                    in {previewResult.preview.summary.total_duration_ms}ms
                  </p>
                </div>

                {/* Step results */}
                {previewResult.preview.step_results.length > 0 && (
                  <div className="border-b border-zinc-200 dark:border-zinc-800 p-3">
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                      Step Results
                    </p>
                    <div className="space-y-1.5">
                      {previewResult.preview.step_results.map((sr, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-[10px] font-mono text-zinc-400 shrink-0 pt-0.5">
                            {sr.step_name}:
                          </span>
                          <span
                            className={`text-xs break-all ${sr.success ? 'text-zinc-600 dark:text-zinc-300' : 'text-red-500 dark:text-red-400'}`}
                          >
                            {sr.error
                              ? sr.error
                              : (() => {
                                  const outputStr = JSON.stringify(sr.outputs);
                                  return outputStr.length > 200
                                    ? outputStr.slice(0, 200) + '...'
                                    : outputStr;
                                })()}
                          </span>
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            {sr.duration_ms}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final lead data */}
                {previewResult.preview.final_lead_data && (
                  <div className="p-4">
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                      Final Lead Data
                    </p>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-200 dark:border-zinc-800">
                      <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(previewResult.preview.final_lead_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={steps.length === 0}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save Recipe
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
