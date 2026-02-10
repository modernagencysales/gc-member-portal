import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Loader2, Rocket, Check } from 'lucide-react';
import type {
  RecipeStep,
  EmailTemplate,
  AiPromptConfig,
  AiExtractConfig,
} from '../../../../../types/cold-email-recipe-types';

interface Props {
  name: string;
  onNameChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  steps: RecipeStep[];
  emailTemplate: EmailTemplate;
  onSave: () => void;
  saving: boolean;
  onBack: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function SaveRecipeStep({
  name,
  onNameChange,
  slug,
  onSlugChange,
  description,
  onDescriptionChange,
  steps,
  emailTemplate,
  onSave,
  saving,
  onBack,
}: Props) {
  const [autoSlug, setAutoSlug] = useState(true);

  const handleNameChange = (value: string) => {
    onNameChange(value);
    if (autoSlug) {
      onSlugChange(slugify(value));
    }
  };

  // Summary stats
  const aiStepCount = steps.filter((s) => s.type === 'ai_prompt' || s.type === 'ai_extract').length;
  const transformStepCount = steps.filter(
    (s) => s.type === 'transform' || s.type === 'field_map'
  ).length;
  const hasTemplate = Boolean(emailTemplate.subject || emailTemplate.body);

  // Compute output fields
  const outputFields = useMemo(() => {
    const fields: string[] = [];
    for (const step of steps) {
      if (step.type === 'ai_prompt') {
        const config = step.config as AiPromptConfig;
        if (config.output_field) fields.push(config.output_field);
      }
      if (step.type === 'ai_extract') {
        const config = step.config as AiExtractConfig;
        fields.push(...config.fields.filter(Boolean));
      }
    }
    return fields;
  }, [steps]);

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800/30 dark:to-zinc-900 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Rocket size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Your recipe is ready
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Review the details below and save your enrichment recipe.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-3 text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{steps.length}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Steps
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-3 text-center">
            <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{aiStepCount}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              AI Steps
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-3 text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{outputFields.length}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Variables
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-3 text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-white">
              {hasTemplate ? <Check size={18} className="text-emerald-500 mx-auto" /> : '--'}
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Template
            </p>
          </div>
        </div>
      </div>

      {/* Name / Slug / Description */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Recipe name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. B2B Agency Outreach"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                onSlugChange(e.target.value);
                setAutoSlug(false);
              }}
              placeholder="b2b-agency-outreach"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            placeholder="What does this recipe do?"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
      </div>

      {/* Steps summary */}
      <div>
        <h4 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Recipe steps</h4>
        <div className="space-y-1">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 py-1"
            >
              <span className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-500 shrink-0">
                {idx + 1}
              </span>
              <span className="font-medium">{step.name || `Step ${idx + 1}`}</span>
              <span className="text-zinc-400 dark:text-zinc-500">({step.type})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Output fields */}
      {outputFields.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Output variables
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {outputFields.map((field) => (
              <span
                key={field}
                className="px-2 py-0.5 text-[10px] rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-mono font-medium"
              >
                {`{{${field}}}`}
              </span>
            ))}
          </div>
        </div>
      )}

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
          onClick={onSave}
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={14} />
              Save Recipe
            </>
          )}
        </button>
      </div>
    </div>
  );
}
