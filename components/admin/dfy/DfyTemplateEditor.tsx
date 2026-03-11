/**
 * DfyTemplateEditor. Thin orchestrator for the DFY engagement template editor.
 * Constraint: No business logic — delegates to useDfyTemplateEditor hook and sub-components.
 */

import React from 'react';
import { Plus, Save, Eye, Settings } from 'lucide-react';

import { useTheme } from '../../../context/ThemeContext';
import { useDfyTemplateEditor } from '../../../hooks/useDfyTemplateEditor';
import { TEMPLATE_OPTIONS } from './template/constants';
import MilestonesEditor from './template/MilestonesEditor';
import DeliverablesSection from './template/DeliverablesSection';

// ─── Component ──────────────────────────────────────────────────

const DfyTemplateEditor: React.FC = () => {
  const { isDarkMode } = useTheme();
  const editor = useDfyTemplateEditor();

  // ─── Style classes (theme-derived) ────────────────────────────

  const inputClass = `w-full h-9 px-3 py-1 rounded-md border bg-transparent text-sm shadow-sm transition-colors ${
    isDarkMode
      ? 'border-zinc-700 text-zinc-100 placeholder:text-zinc-500'
      : 'border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
  } focus:outline-none focus:ring-1 focus:ring-violet-500`;

  const selectClass = `w-full h-9 px-3 py-1 rounded-md border bg-transparent text-sm shadow-sm transition-colors ${
    isDarkMode ? 'border-zinc-700 text-zinc-100' : 'border-zinc-300 text-zinc-900'
  } focus:outline-none focus:ring-1 focus:ring-violet-500`;

  const labelClass = `block text-sm font-medium mb-1 ${
    isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
  }`;

  const cardClass = `rounded-xl border shadow ${
    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
  }`;

  // ─── Loading state ────────────────────────────────────────────

  if (editor.isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Engagement Template
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Configure milestone-based templates with automation for DFY engagements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={editor.selectedSlug}
            onChange={(e) => editor.handleSlugChange(e.target.value)}
            className={`px-3 py-1 h-9 rounded-md border bg-transparent text-sm font-medium shadow-sm ${
              isDarkMode ? 'border-zinc-700 text-zinc-100' : 'border-zinc-300 text-zinc-900'
            }`}
          >
            {TEMPLATE_OPTIONS.map((opt) => (
              <option key={opt.slug} value={opt.slug}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => editor.saveMutation.mutate()}
            disabled={!editor.hasChanges || editor.saveMutation.isPending}
            className="inline-flex items-center gap-2 h-9 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white shadow hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {editor.saveMutation.isPending ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Success / error feedback */}
      {editor.saveMutation.isSuccess && !editor.hasChanges && (
        <div
          className={`p-3 rounded-xl border text-sm ${
            isDarkMode
              ? 'bg-green-900/20 border-green-800 text-green-300'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          Template saved successfully.
        </div>
      )}
      {editor.saveMutation.isError && (
        <div
          className={`p-3 rounded-xl border text-sm ${
            isDarkMode
              ? 'bg-red-900/20 border-red-800 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          Failed to save:{' '}
          {editor.saveMutation.error instanceof Error
            ? editor.saveMutation.error.message
            : 'Unknown error'}
        </div>
      )}

      {/* No template — offer to create */}
      {editor.templateData === null && !editor.hasChanges && (
        <div className={cardClass}>
          <div className="p-8 text-center">
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              No template found for "
              {TEMPLATE_OPTIONS.find((o) => o.slug === editor.selectedSlug)?.label}".
            </p>
            <button
              onClick={editor.handleCreateFromDefault}
              className="inline-flex items-center gap-2 h-9 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white shadow hover:bg-violet-500 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create from Default Template
            </button>
          </div>
        </div>
      )}

      {/* Template content */}
      {(editor.templateData !== null || editor.hasChanges) && (
        <>
          {/* Template name */}
          <div className={cardClass}>
            <div className="p-4">
              <label className={labelClass}>Template Name</label>
              <input
                type="text"
                value={editor.templateName}
                onChange={(e) => {
                  editor.setTemplateName(e.target.value);
                  editor.setHasChanges(true);
                }}
                placeholder="e.g. Standard DFY Engagement"
                className={inputClass}
              />
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1">
            <button
              onClick={() => editor.setActiveTab('edit')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                editor.activeTab === 'edit'
                  ? 'bg-violet-600 text-white'
                  : isDarkMode
                    ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => editor.setActiveTab('preview')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                editor.activeTab === 'preview'
                  ? 'bg-violet-600 text-white'
                  : isDarkMode
                    ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>

          {editor.activeTab === 'preview' ? (
            /* Preview Tab */
            <div className={cardClass}>
              <div
                className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
              >
                <h3
                  className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
                >
                  Dependency Graph
                </h3>
              </div>
              <div className="p-4">
                {editor.previewText ? (
                  <pre
                    className={`text-sm font-mono whitespace-pre-wrap leading-relaxed ${
                      isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    {editor.previewText}
                  </pre>
                ) : (
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Add milestones and deliverables to see the dependency graph.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Edit Tab */
            <>
              <div className={cardClass}>
                <MilestonesEditor
                  milestones={editor.milestones}
                  deliverables={editor.deliverables}
                  collapsedMilestones={editor.collapsedMilestones}
                  isDarkMode={isDarkMode}
                  styles={{ inputClass, labelClass }}
                  onAdd={editor.addMilestone}
                  onRemove={editor.removeMilestone}
                  onUpdate={editor.updateMilestone}
                  onMove={editor.moveMilestone}
                  onToggle={editor.toggleMilestone}
                />
              </div>
              <div className={cardClass}>
                <DeliverablesSection
                  deliverables={editor.deliverables}
                  milestones={editor.milestones}
                  groupedDeliverables={editor.groupedDeliverables}
                  expandedDeliverable={editor.expandedDeliverable}
                  isDarkMode={isDarkMode}
                  styles={{ inputClass, selectClass, labelClass }}
                  onAdd={editor.addDeliverable}
                  onRemove={editor.removeDeliverable}
                  onUpdate={editor.updateDeliverable}
                  onMove={editor.moveDeliverable}
                  onToggle={editor.toggleDeliverable}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Bottom save button for long forms */}
      {editor.deliverables.length > 3 && (
        <div className="flex justify-end">
          <button
            onClick={() => editor.saveMutation.mutate()}
            disabled={!editor.hasChanges || editor.saveMutation.isPending}
            className="inline-flex items-center gap-2 h-9 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white shadow hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {editor.saveMutation.isPending ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DfyTemplateEditor;
