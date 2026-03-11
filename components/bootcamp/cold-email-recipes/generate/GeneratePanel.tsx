import React, { useState, useCallback } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import {
  useRecipes,
  useContactLists,
  useContacts,
  useResetContactEnrichment,
} from '../../../../hooks/useColdEmailRecipes';
import { updateContactEnrichment } from '../../../../services/cold-email-recipes-supabase';
import type {
  BootcampContact,
  RecipeStep,
  TransformConfig,
  FieldMapConfig,
} from '../../../../types/cold-email-recipe-types';
import EnrichmentProgress from './EnrichmentProgress';
import EmailPreview from './EmailPreview';
import ExportButton from './ExportButton';
import { logError } from '../../../../lib/logError';

interface Props {
  userId: string;
}

const BATCH_SIZE = 5; // Small batch for AI calls

// Run client-side transform steps
function runTransformStep(
  fields: Record<string, string>,
  config: TransformConfig
): Record<string, string> {
  const result = { ...fields };
  for (const t of config.transforms) {
    switch (t.type) {
      case 'template':
        result[t.output_field] = (t.template || '').replace(
          /\{\{([^}]+)\}\}/g,
          (_, key) => result[key.trim()] || ''
        );
        break;
      case 'concat':
        result[t.output_field] = (t.input_fields || [])
          .map((f) => result[f] || '')
          .join(t.separator || ' ');
        break;
      case 'lowercase':
        if (t.input_fields?.[0])
          result[t.output_field] = (result[t.input_fields[0]] || '').toLowerCase();
        break;
      case 'uppercase':
        if (t.input_fields?.[0])
          result[t.output_field] = (result[t.input_fields[0]] || '').toUpperCase();
        break;
      case 'strip':
        if (t.input_fields?.[0]) result[t.output_field] = (result[t.input_fields[0]] || '').trim();
        break;
    }
  }
  return result;
}

// Run client-side field_map steps
function runFieldMapStep(
  fields: Record<string, string>,
  config: FieldMapConfig
): Record<string, string> {
  const result = { ...fields };
  for (const m of config.mappings) {
    if (m.from && m.to && result[m.from] !== undefined) {
      result[m.to] = result[m.from];
    }
  }
  return result;
}

export default function GeneratePanel({ userId }: Props) {
  const { data: recipes } = useRecipes(userId);
  const { data: lists } = useContactLists(userId);
  const resetEnrichment = useResetContactEnrichment();

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [failed, setFailed] = useState(0);
  const [total, setTotal] = useState(0);
  const [enrichedContacts, setEnrichedContacts] = useState<BootcampContact[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { data: contactData, refetch: refetchContacts } = useContacts(
    selectedListId || undefined,
    1000,
    0
  );

  const selectedRecipe = recipes?.find((r) => r.id === selectedRecipeId);

  const handleRun = useCallback(async () => {
    if (!selectedRecipe || !selectedListId || !contactData?.contacts.length) return;

    setRunning(true);
    setCompleted(0);
    setFailed(0);
    setShowResults(false);
    setEnrichedContacts([]);

    const contacts = contactData.contacts;
    setTotal(contacts.length);
    const steps = selectedRecipe.steps;

    // Group steps into consecutive runs: client-side steps run locally,
    // AI steps are sent to edge function. Preserves original step order.
    type StepGroup = { type: 'client'; steps: RecipeStep[] } | { type: 'ai'; steps: RecipeStep[] };
    const groups: StepGroup[] = [];
    for (const step of steps) {
      const isAi = step.type === 'ai_prompt' || step.type === 'ai_extract';
      const groupType = isAi ? 'ai' : 'client';
      const last = groups[groups.length - 1];
      if (last && last.type === groupType) {
        last.steps.push(step);
      } else {
        groups.push({ type: groupType, steps: [step] });
      }
    }

    // Initialize contact fields
    const contactFields: Map<string, Record<string, string>> = new Map();
    for (const c of contacts) {
      contactFields.set(c.id, {
        first_name: c.firstName,
        last_name: c.lastName,
        email: c.email,
        company: c.company,
        title: c.title,
        linkedin_url: c.linkedinUrl,
        ...c.customFields,
      });
    }

    const failedIds = new Set<string>();

    // Process step groups in order
    for (const group of groups) {
      if (group.type === 'client') {
        // Run client-side steps on all contacts
        for (const c of contacts) {
          if (failedIds.has(c.id)) continue;
          let fields = contactFields.get(c.id)!;
          for (const step of group.steps) {
            if (step.type === 'transform') {
              fields = runTransformStep(fields, step.config as TransformConfig);
            } else if (step.type === 'field_map') {
              fields = runFieldMapStep(fields, step.config as FieldMapConfig);
            }
          }
          contactFields.set(c.id, fields);
        }
      } else {
        // Run AI steps in batches via edge function
        const activeContacts = contacts.filter((c) => !failedIds.has(c.id));
        for (let i = 0; i < activeContacts.length; i += BATCH_SIZE) {
          const batch = activeContacts.slice(i, i + BATCH_SIZE);
          const batchPayload = batch.map((c) => ({
            id: c.id,
            fields: contactFields.get(c.id)!,
          }));

          try {
            const { data, error } = await supabase.functions.invoke('run-recipe-steps', {
              body: { contacts: batchPayload, steps: group.steps },
            });

            if (error) throw error;

            const results = data?.results || [];
            for (const result of results) {
              if (result.error) {
                failedIds.add(result.contactId);
                setFailed((f) => f + 1);
              } else {
                // Merge AI outputs into accumulated fields
                const existing = contactFields.get(result.contactId) || {};
                contactFields.set(result.contactId, { ...existing, ...result.outputs });
              }
            }
          } catch (err) {
            logError('GeneratePanel:processBatch', err);
            for (const c of batch) {
              failedIds.add(c.id);
            }
            setFailed((f) => f + batch.length);
          }

          setCompleted((prev) => prev + batch.length);
        }
      }
    }

    // Save final outputs to DB
    for (const c of contacts) {
      const fields = contactFields.get(c.id) || {};
      const originalKeys = new Set([
        'first_name',
        'last_name',
        'email',
        'company',
        'title',
        'linkedin_url',
        ...Object.keys(c.customFields),
      ]);
      const newOutputs: Record<string, string> = {};
      for (const [key, val] of Object.entries(fields)) {
        if (!originalKeys.has(key)) newOutputs[key] = val;
      }

      const status = failedIds.has(c.id) ? 'failed' : 'done';
      await updateContactEnrichment(c.id, newOutputs, status);
    }

    // Refresh contacts and show results
    const updated = await refetchContacts();
    setEnrichedContacts(updated.data?.contacts || []);
    setRunning(false);
    setShowResults(true);
  }, [selectedRecipe, selectedListId, contactData, refetchContacts]);

  const handleReset = useCallback(async () => {
    if (!selectedListId) return;
    await resetEnrichment.mutateAsync(selectedListId);
    await refetchContacts();
    setShowResults(false);
    setEnrichedContacts([]);
    setCompleted(0);
    setFailed(0);
    setTotal(0);
  }, [selectedListId, resetEnrichment, refetchContacts]);

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Recipe
          </label>
          <select
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="">Select a recipe...</option>
            {recipes?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.steps.length} steps)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Contact List
          </label>
          <select
            value={selectedListId}
            onChange={(e) => {
              setSelectedListId(e.target.value);
              setShowResults(false);
              setEnrichedContacts([]);
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="">Select a contact list...</option>
            {lists?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.contactCount} contacts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recipe summary */}
      {selectedRecipe && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-xs space-y-1">
          <p className="font-medium text-zinc-900 dark:text-white">{selectedRecipe.name}</p>
          {selectedRecipe.description && (
            <p className="text-zinc-500 dark:text-zinc-400">{selectedRecipe.description}</p>
          )}
          <div className="flex gap-3 text-zinc-400 dark:text-zinc-500">
            <span>{selectedRecipe.steps.length} steps</span>
            <span>
              {
                selectedRecipe.steps.filter(
                  (s) => s.type === 'ai_prompt' || s.type === 'ai_extract'
                ).length
              }{' '}
              AI
            </span>
            <span>{selectedRecipe.emailTemplate ? 'Template set' : 'No template'}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={
            !selectedRecipeId || !selectedListId || running || !contactData?.contacts.length
          }
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play size={14} />
          {running ? 'Running...' : 'Run Enrichment'}
        </button>
        {showResults && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
        {showResults && selectedRecipe?.emailTemplate && (
          <ExportButton contacts={enrichedContacts} template={selectedRecipe.emailTemplate} />
        )}
      </div>

      {/* Progress */}
      {running && <EnrichmentProgress completed={completed} total={total} failed={failed} />}

      {/* Results */}
      {showResults && selectedRecipe?.emailTemplate && enrichedContacts.length > 0 && (
        <EmailPreview contacts={enrichedContacts} template={selectedRecipe.emailTemplate} />
      )}

      {showResults && !selectedRecipe?.emailTemplate && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          Enrichment complete, but this recipe has no email template. Add one in the Recipes tab to
          preview generated emails.
        </div>
      )}
    </div>
  );
}
