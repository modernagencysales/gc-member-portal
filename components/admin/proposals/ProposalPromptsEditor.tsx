import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProposalPrompts,
  saveProposalPrompts,
  type ProposalPrompts,
} from '../../../services/proposal-gtm';
import { useTheme } from '../../../context/ThemeContext';
import { Save, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';

const TEMPLATE_VARIABLES = [
  { name: '{{client_name}}', description: 'Full name (e.g., Bobby Deraco)' },
  { name: '{{first_name}}', description: 'First name only (e.g., Bobby)' },
  { name: '{{client_company}}', description: 'Company name' },
  { name: '{{client_title}}', description: 'Job title' },
  { name: '{{client_website}}', description: 'Website URL' },
  { name: '{{transcript}}', description: 'Full call transcript text' },
  { name: '{{packages}}', description: 'Selected packages formatted as bullets' },
  { name: '{{additional_notes}}', description: 'Extra notes from the creator' },
  { name: '{{blueprint_intelligence}}', description: 'LinkedIn analysis data (if available)' },
];

interface PromptSectionProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
  defaultOpen?: boolean;
}

function PromptSection({
  label,
  description,
  value,
  onChange,
  isDarkMode,
  defaultOpen,
}: PromptSectionProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const lineCount = value.split('\n').length;

  return (
    <div
      className={`border rounded-xl overflow-hidden ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-5 py-4 flex items-center justify-between text-left ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
      >
        <div>
          <h4 className="font-semibold text-sm">{label}</h4>
          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {description} ({lineCount} lines, {value.length} chars)
          </p>
        </div>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && (
        <div
          className={`px-5 pb-5 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.min(Math.max(lineCount + 2, 10), 40)}
            className={`w-full mt-3 px-4 py-3 rounded-lg text-sm font-mono leading-relaxed resize-y ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white border-slate-300 text-slate-800'
            } border focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
          />
        </div>
      )}
    </div>
  );
}

const ProposalPromptsEditor: React.FC = () => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<ProposalPrompts | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['proposalPrompts'],
    queryFn: fetchProposalPrompts,
  });

  const saveMutation = useMutation({
    mutationFn: saveProposalPrompts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposalPrompts'] });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      window.alert(`Failed to save prompts: ${error.message}`);
    },
  });

  useEffect(() => {
    if (prompts) setLocal(prompts);
  }, [prompts]);

  const handleChange = (field: keyof ProposalPrompts, value: string) => {
    if (!local) return;
    setLocal({ ...local, [field]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (local) saveMutation.mutate(local);
  };

  if (isLoading || !local) {
    return (
      <div
        className={`p-8 rounded-xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
      >
        <div className="w-6 h-6 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
        <p className={`text-sm mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Loading prompts...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
    >
      {/* Header */}
      <div
        className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
      >
        <div className="flex items-center gap-3">
          <Sparkles className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
          <div>
            <h3 className="font-semibold">AI Proposal Prompts</h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Edit the prompts used to generate and evaluate proposals
            </p>
          </div>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Available variables reference */}
        <details
          className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}
        >
          <summary
            className={`text-xs font-semibold uppercase tracking-wider cursor-pointer ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
          >
            Available Template Variables
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEMPLATE_VARIABLES.map((v) => (
              <div key={v.name} className="flex items-baseline gap-2 text-xs">
                <code
                  className={`px-1.5 py-0.5 rounded font-mono ${isDarkMode ? 'bg-slate-700 text-violet-300' : 'bg-violet-50 text-violet-700'}`}
                >
                  {v.name}
                </code>
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                  {v.description}
                </span>
              </div>
            ))}
          </div>
        </details>

        {/* Prompt editors */}
        <PromptSection
          label="System Prompt"
          description="Sets the AI's persona and writing style for generation"
          value={local.system_prompt}
          onChange={(v) => handleChange('system_prompt', v)}
          isDarkMode={isDarkMode}
        />

        <PromptSection
          label="User Message Template"
          description="The main prompt with client data and output structure"
          value={local.user_message_template}
          onChange={(v) => handleChange('user_message_template', v)}
          isDarkMode={isDarkMode}
        />

        <PromptSection
          label="Evaluation Prompt"
          description="Reviews and cleans the generated proposal (AI cliche removal, voice check)"
          value={local.eval_prompt}
          onChange={(v) => handleChange('eval_prompt', v)}
          isDarkMode={isDarkMode}
          defaultOpen
        />
      </div>
    </div>
  );
};

export default ProposalPromptsEditor;
