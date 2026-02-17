import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Check,
  Loader2,
  Mail,
  ListChecks,
  Settings2,
  Save,
} from 'lucide-react';
import type { RecipeStep, EmailTemplate } from '../../../../types/cold-email-recipe-types';
import type {
  DetectedVariable,
  AnalyzeEmailResponse,
  PreviewResult,
  EmailFirstStep,
} from '../../../../types/email-first-recipe-types';
import { useCreateRecipe } from '../../../../hooks/useColdEmailRecipes';
import WriteEmailStep from './email-first/WriteEmailStep';
import ReviewVariablesStep from './email-first/ReviewVariablesStep';
import ReviewRecipeStep from './email-first/ReviewRecipeStep';
import SaveRecipeStep from './email-first/SaveRecipeStep';

import { GTM_SYSTEM_URL, buildGtmHeaders } from '../../../../lib/api-config';

interface Props {
  userId: string;
  onClose: () => void;
  onSaved?: () => void;
}

const STEPS: { id: EmailFirstStep; label: string; icon: React.ReactNode }[] = [
  { id: 'write', label: 'Write Email', icon: <Mail size={14} /> },
  { id: 'variables', label: 'Variables', icon: <ListChecks size={14} /> },
  { id: 'recipe', label: 'Recipe', icon: <Settings2 size={14} /> },
  { id: 'save', label: 'Save', icon: <Save size={14} /> },
];

export default function EmailFirstRecipeBuilder({ userId, onClose, onSaved }: Props) {
  const createRecipe = useCreateRecipe();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<EmailFirstStep>('write');

  // Step 1: Write email
  const [emailText, setEmailText] = useState('');
  const [audienceDescription, setAudienceDescription] = useState('');

  // Step 2: Variables (populated by AI)
  const [variables, setVariables] = useState<DetectedVariable[]>([]);
  const [originalEmail, setOriginalEmail] = useState('');

  // Step 3: Recipe (populated by AI)
  const [recipeSteps, setRecipeSteps] = useState<RecipeStep[]>([]);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({ subject: '', body: '' });

  // Step 4: Save
  const [recipeName, setRecipeName] = useState('');
  const [recipeSlug, setRecipeSlug] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');

  // Shared state
  const [analyzing, setAnalyzing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gtmSystemUrl = GTM_SYSTEM_URL;
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // --- API calls ---

  const handleAnalyzeEmail = useCallback(async () => {
    if (!emailText.trim()) {
      setError('Please write or paste a cold email first.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch(`${gtmSystemUrl}/api/cold-email/recipes/analyze`, {
        method: 'POST',
        headers: buildGtmHeaders(),
        body: JSON.stringify({
          emailText: emailText.trim(),
          targetAudience: audienceDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Analysis failed (${res.status})`);
      }

      const data: AnalyzeEmailResponse = await res.json();

      // Map API response (nested under analysis / ready_recipe) to UI state
      setVariables(data.analysis.variables);
      setOriginalEmail(emailText); // API does not return originalEmail; use local state

      // Map ready_recipe steps to UI RecipeStep shape
      const uiSteps: RecipeStep[] = data.ready_recipe.steps.map((s) => ({
        id: s.id,
        type: s.type as RecipeStep['type'],
        name: s.name,
        config: s.config as unknown as RecipeStep['config'],
      }));
      setRecipeSteps(uiSteps);

      // API does not return emailTemplate — initialize empty
      setEmailTemplate({ subject: '', body: '' });

      setRecipeName(data.ready_recipe.name);
      setRecipeSlug(data.ready_recipe.slug);
      setRecipeDescription(data.ready_recipe.description);

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        setError(data.warnings.join(' '));
      }

      setCurrentStep('variables');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze email');
    } finally {
      setAnalyzing(false);
    }
  }, [emailText, audienceDescription, gtmSystemUrl]);

  const handlePreview = useCallback(
    async (sampleLead: Record<string, string>) => {
      setPreviewing(true);
      setPreviewResult(null);
      setError(null);

      try {
        const res = await fetch(`${gtmSystemUrl}/api/cold-email/recipes/preview`, {
          method: 'POST',
          headers: buildGtmHeaders(),
          body: JSON.stringify({
            recipeSteps,
            sampleLead,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Preview failed (${res.status})`);
        }

        const data: PreviewResult = await res.json();
        setPreviewResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Preview failed');
      } finally {
        setPreviewing(false);
      }
    },
    [recipeSteps, gtmSystemUrl]
  );

  const handleSave = useCallback(async () => {
    if (!recipeName.trim()) {
      setError('Recipe name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createRecipe.mutateAsync({
        studentId: userId,
        name: recipeName,
        slug: recipeSlug || slugify(recipeName),
        description: recipeDescription,
        steps: recipeSteps,
        emailTemplate: emailTemplate.subject || emailTemplate.body ? emailTemplate : null,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setSaving(false);
    }
  }, [
    recipeName,
    recipeSlug,
    recipeDescription,
    recipeSteps,
    emailTemplate,
    userId,
    createRecipe,
    onClose,
    onSaved,
  ]);

  // --- Navigation ---

  const goToStep = (step: EmailFirstStep) => {
    setError(null);
    setCurrentStep(step);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'write':
        return emailText.trim().length > 0;
      case 'variables':
        return variables.length > 0;
      case 'recipe':
        return recipeSteps.length > 0;
      case 'save':
        return recipeName.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to recipes
        </button>
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-violet-500" />
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            AI Recipe Builder
          </span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = idx < currentStepIndex;
          const isClickable = idx <= currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {idx > 0 && (
                <div
                  className={`flex-1 h-px ${
                    isCompleted ? 'bg-violet-500' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              )}
              <button
                onClick={() => isClickable && goToStep(step.id)}
                disabled={!isClickable}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-violet-500 text-white shadow-sm'
                    : isCompleted
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-default'
                }`}
              >
                {isCompleted ? <Check size={12} /> : step.icon}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Step Content */}
      {currentStep === 'write' && (
        <WriteEmailStep
          emailText={emailText}
          onEmailTextChange={setEmailText}
          audienceDescription={audienceDescription}
          onAudienceDescriptionChange={setAudienceDescription}
          onAnalyze={handleAnalyzeEmail}
          analyzing={analyzing}
        />
      )}

      {currentStep === 'variables' && (
        <ReviewVariablesStep
          variables={variables}
          onVariablesChange={setVariables}
          originalEmail={originalEmail}
          onNext={() => goToStep('recipe')}
          onBack={() => goToStep('write')}
        />
      )}

      {currentStep === 'recipe' && (
        <ReviewRecipeStep
          steps={recipeSteps}
          onStepsChange={setRecipeSteps}
          emailTemplate={emailTemplate}
          onEmailTemplateChange={setEmailTemplate}
          onPreview={handlePreview}
          previewing={previewing}
          previewResult={previewResult}
          onNext={() => goToStep('save')}
          onBack={() => goToStep('variables')}
        />
      )}

      {currentStep === 'save' && (
        <SaveRecipeStep
          name={recipeName}
          onNameChange={setRecipeName}
          slug={recipeSlug}
          onSlugChange={setRecipeSlug}
          description={recipeDescription}
          onDescriptionChange={setRecipeDescription}
          steps={recipeSteps}
          emailTemplate={emailTemplate}
          onSave={handleSave}
          saving={saving}
          onBack={() => goToStep('recipe')}
        />
      )}

      {/* Bottom Navigation (for steps that don't have their own nav) */}
      {currentStep === 'write' && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleAnalyzeEmail}
            disabled={!canGoNext() || analyzing}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Analyze Email
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
