import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import type {
  DetectedVariable,
  ConfidenceLabel,
} from '../../../../../types/email-first-recipe-types';
import { confidenceToLabel } from '../../../../../types/email-first-recipe-types';

interface Props {
  variables: DetectedVariable[];
  onVariablesChange: (vars: DetectedVariable[]) => void;
  originalEmail: string;
  onNext: () => void;
  onBack: () => void;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  low: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

function HighlightedEmail({ text, variableNames }: { text: string; variableNames: string[] }) {
  if (!text) return null;

  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return (
    <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">
      {parts.map((part, i) => {
        const match = part.match(/^\{\{([^}]+)\}\}$/);
        if (match) {
          const varName = match[1].trim();
          const isKnown = variableNames.includes(varName);
          return (
            <span
              key={i}
              className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                isKnown
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50'
              }`}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export default function ReviewVariablesStep({
  variables,
  onVariablesChange,
  originalEmail,
  onNext,
  onBack,
}: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const variableNames = variables.map((v) => v.variableName);

  const updateVariable = (index: number, updates: Partial<DetectedVariable>) => {
    const updated = variables.map((v, i) => (i === index ? { ...v, ...updates } : v));
    onVariablesChange(updated);
  };

  const removeVariable = (index: number) => {
    onVariablesChange(variables.filter((_, i) => i !== index));
  };

  const addVariable = () => {
    onVariablesChange([
      ...variables,
      {
        variableName: '',
        description: '',
        dataSource: 'AI research',
        confidence: 0.5,
        exampleValue: '',
        emailSnippet: '',
      },
    ]);
    setEditingIndex(variables.length);
  };

  return (
    <div className="space-y-5">
      {/* Two-column layout */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left: Variables list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Detected Variables
            </h3>
            <button
              onClick={addVariable}
              className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 font-medium transition-colors"
            >
              <Plus size={12} />
              Add Variable
            </button>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            AI detected these personalization variables in your email. You can edit, remove, or add
            more.
          </p>

          {variables.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
              <AlertCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                No variables detected. Add some or go back and include{' '}
                <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                  {'{{variables}}'}
                </code>{' '}
                in your email.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {variables.map((variable, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  {editingIndex === index ? (
                    /* Editing mode */
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={variable.variableName}
                          onChange={(e) =>
                            updateVariable(index, {
                              variableName: e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_]/g, '_'),
                            })
                          }
                          placeholder="variable_name"
                          className="px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                        />
                        <select
                          value={confidenceToLabel(variable.confidence)}
                          onChange={(e) => {
                            const label = e.target.value as ConfidenceLabel;
                            const numericConfidence =
                              label === 'high' ? 0.9 : label === 'medium' ? 0.5 : 0.2;
                            updateVariable(index, { confidence: numericConfidence });
                          }}
                          className="px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                        >
                          <option value="high">High confidence</option>
                          <option value="medium">Medium confidence</option>
                          <option value="low">Low confidence</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={variable.description}
                        onChange={(e) => updateVariable(index, { description: e.target.value })}
                        placeholder="Description"
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                      />
                      <input
                        type="text"
                        value={variable.dataSource}
                        onChange={(e) => updateVariable(index, { dataSource: e.target.value })}
                        placeholder="Data source (e.g. LinkedIn profile, company website)"
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 font-medium"
                        >
                          <Check size={12} />
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 cursor-pointer" onClick={() => setEditingIndex(index)}>
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded">
                            {`{{${variable.variableName}}}`}
                          </code>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                              CONFIDENCE_STYLES[confidenceToLabel(variable.confidence)]
                            }`}
                          >
                            {confidenceToLabel(variable.confidence)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {variable.description}
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          Source: {variable.dataSource}
                        </p>
                      </div>
                      <button
                        onClick={() => removeVariable(index)}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Email preview with highlighted variables */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Your Email</h3>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 p-4 max-h-[420px] overflow-y-auto">
            <HighlightedEmail text={originalEmail} variableNames={variableNames} />
          </div>
        </div>
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
          disabled={variables.length === 0}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Generate Recipe
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
