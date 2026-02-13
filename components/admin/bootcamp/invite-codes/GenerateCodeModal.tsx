import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../../context/ThemeContext';
import { BootcampCohort, ToolGrant } from '../../../../types/bootcamp-types';
import { AITool } from '../../../../types/chat-types';
import { fetchActiveAITools } from '../../../../services/chat-supabase';

const ACCESS_LEVELS = ['Lead Magnet', 'Funnel Access', 'Curriculum Only', 'Full Access'] as const;

interface GenerateCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    cohortId: string,
    count: number,
    options?: {
      maxUses?: number;
      expiresAt?: Date;
      customCode?: string;
      accessLevel?: string;
      toolGrants?: ToolGrant[];
    }
  ) => Promise<void>;
  cohorts: BootcampCohort[];
  isLoading?: boolean;
}

const GenerateCodeModal: React.FC<GenerateCodeModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  cohorts,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    cohortId: '',
    count: 1,
    maxUses: '',
    expiresAt: '',
    accessLevel: 'Lead Magnet',
    customCode: '',
    creditsPerTool: 10,
    selectedToolSlugs: [] as string[],
  });

  const { data: aiTools, isLoading: isLoadingTools } = useQuery({
    queryKey: ['ai-tools', 'active'],
    queryFn: fetchActiveAITools,
  });

  const handleCustomCodeChange = (value: string) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
    setFormData({
      ...formData,
      customCode: sanitized,
      count: sanitized ? 1 : formData.count,
    });
  };

  const handleToolToggle = (slug: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedToolSlugs: prev.selectedToolSlugs.includes(slug)
        ? prev.selectedToolSlugs.filter((s) => s !== slug)
        : [...prev.selectedToolSlugs, slug],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cohortId) return;

    const options: {
      maxUses?: number;
      expiresAt?: Date;
      customCode?: string;
      accessLevel?: string;
      toolGrants?: ToolGrant[];
    } = {};

    if (formData.maxUses) {
      options.maxUses = parseInt(formData.maxUses, 10);
    }
    if (formData.expiresAt) {
      options.expiresAt = new Date(formData.expiresAt);
    }
    if (formData.customCode) {
      options.customCode = formData.customCode;
    }
    if (formData.accessLevel) {
      options.accessLevel = formData.accessLevel;
    }
    if (formData.selectedToolSlugs.length > 0) {
      options.toolGrants = formData.selectedToolSlugs.map((slug) => ({
        toolSlug: slug,
        credits: formData.creditsPerTool,
      }));
    }

    await onGenerate(formData.cohortId, formData.count, options);

    // Reset form
    setFormData({
      cohortId: '',
      count: 1,
      maxUses: '',
      expiresAt: '',
      accessLevel: 'Lead Magnet',
      customCode: '',
      creditsPerTool: 10,
      selectedToolSlugs: [],
    });
  };

  if (!isOpen) return null;

  const inputClasses = `w-full px-4 py-2.5 rounded-lg border ${
    isDarkMode
      ? 'bg-slate-800 border-slate-700 text-white'
      : 'bg-white border-slate-300 text-slate-900'
  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  const labelClasses = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-slate-700'
  }`;

  const hintClasses = `text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-md rounded-xl overflow-hidden max-h-[90vh] flex flex-col ${
          isDarkMode ? 'bg-slate-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <h3 className="text-lg font-semibold">Generate Invite Codes</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* 1. Cohort dropdown */}
          <div>
            <label className={labelClasses}>Cohort *</label>
            <select
              value={formData.cohortId}
              onChange={(e) => setFormData({ ...formData, cohortId: e.target.value })}
              className={inputClasses}
              required
            >
              <option value="">Select a cohort</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Access Level dropdown */}
          <div>
            <label className={labelClasses}>Access Level</label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
              className={inputClasses}
            >
              {ACCESS_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <p className={hintClasses}>Controls what features redeemers can access</p>
          </div>

          {/* 3. Tool Grants section */}
          <div
            className={`p-4 rounded-lg border ${
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            }`}
          >
            <label className={labelClasses}>Tool Grants</label>

            <div className="mb-3">
              <label
                className={`block text-xs font-medium mb-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Credits per Tool
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.creditsPerTool}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    creditsPerTool: parseInt(e.target.value, 10) || 1,
                  })
                }
                className={inputClasses}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-medium mb-2 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Select Tools
              </label>
              {isLoadingTools ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Loading tools...
                  </span>
                </div>
              ) : aiTools && aiTools.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {aiTools.map((tool: AITool) => (
                    <label
                      key={tool.slug}
                      className={`flex items-center gap-2 text-sm cursor-pointer ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedToolSlugs.includes(tool.slug)}
                        onChange={() => handleToolToggle(tool.slug)}
                        className="rounded border-slate-400"
                      />
                      {tool.name}
                    </label>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  No active tools available
                </p>
              )}
            </div>
          </div>

          {/* 4. Custom Code text input */}
          <div>
            <label className={labelClasses}>Custom Code (Optional)</label>
            <input
              type="text"
              value={formData.customCode}
              onChange={(e) => handleCustomCodeChange(e.target.value)}
              className={inputClasses}
              placeholder="e.g. WELCOME-2026"
              maxLength={32}
            />
            <p className={hintClasses}>
              Letters, numbers, hyphens, underscores only. Sets count to 1.
            </p>
          </div>

          {/* 5. Number of Codes */}
          <div>
            <label className={labelClasses}>Number of Codes *</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.count}
              onChange={(e) =>
                setFormData({ ...formData, count: parseInt(e.target.value, 10) || 1 })
              }
              className={`${inputClasses} ${formData.customCode ? 'opacity-50 cursor-not-allowed' : ''}`}
              required
              disabled={!!formData.customCode}
            />
            <p className={hintClasses}>
              {formData.customCode
                ? 'Locked to 1 when custom code is set'
                : 'Generate 1-100 codes at once'}
            </p>
          </div>

          {/* 6. Max Uses */}
          <div>
            <label className={labelClasses}>Max Uses (Optional)</label>
            <input
              type="number"
              min="1"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
              className={inputClasses}
              placeholder="Unlimited"
            />
            <p className={hintClasses}>Leave empty for unlimited uses</p>
          </div>

          {/* 7. Expiration Date */}
          <div>
            <label className={labelClasses}>Expiration Date (Optional)</label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className={inputClasses}
            />
            <p className={hintClasses}>Leave empty for no expiration</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.cohortId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate {formData.count} Code{formData.count > 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateCodeModal;
