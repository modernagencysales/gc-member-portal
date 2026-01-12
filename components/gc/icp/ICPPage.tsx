import React, { useState, useEffect } from 'react';
import {
  Save,
  Users,
  Target,
  MessageSquare,
  Award,
  AlertTriangle,
  Loader2,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingState } from '../../shared/LoadingSpinner';
import { fetchMemberICP, updateMemberICP } from '../../../services/supabase';
import { MemberICP } from '../../../types/gc-types';
import { generateICPSuggestions, ICPSuggestion } from '../../../services/ai';

const ICPPage: React.FC = () => {
  const { gcMember } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [icp, setIcp] = useState<MemberICP | null>(null);
  const [formData, setFormData] = useState<Partial<MemberICP>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ICPSuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    loadICP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gcMember]);

  const loadICP = async () => {
    if (!gcMember) return;

    setLoading(true);
    try {
      const data = await fetchMemberICP(gcMember.id);
      setIcp(data);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Failed to load ICP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof MemberICP, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!gcMember) return;

    setSaving(true);
    try {
      await updateMemberICP(icp?.id, gcMember.id, formData);
      await loadICP();
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save ICP:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!formData.companyName && !gcMember?.company) {
      setAiError('Please enter a company name first');
      return;
    }

    setGenerating(true);
    setAiError(null);
    setAiSuggestions(null);

    try {
      const suggestions = await generateICPSuggestions(
        formData.companyName || gcMember?.company || '',
        gcMember?.website,
        formData
      );
      setAiSuggestions(suggestions);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const applySuggestion = (field: keyof ICPSuggestion) => {
    if (aiSuggestions && aiSuggestions[field]) {
      handleChange(field as keyof MemberICP, aiSuggestions[field] as string);
    }
  };

  const applyAllSuggestions = () => {
    if (!aiSuggestions) return;

    const fieldsToApply: (keyof ICPSuggestion)[] = [
      'targetDescription',
      'verticals',
      'companySize',
      'jobTitles',
      'geography',
      'painPoints',
      'offer',
      'differentiator',
      'socialProof',
      'commonObjections',
    ];

    fieldsToApply.forEach((field) => {
      if (aiSuggestions[field]) {
        handleChange(field as keyof MemberICP, aiSuggestions[field] as string);
      }
    });

    setAiSuggestions(null);
  };

  if (loading) {
    return <LoadingState message="Loading your ICP..." />;
  }

  const sections = [
    {
      title: 'Target Audience',
      icon: Target,
      fields: [
        {
          key: 'targetDescription' as const,
          label: 'Target Description',
          placeholder: 'Who are you targeting? Describe your ideal customer...',
          type: 'textarea',
        },
        {
          key: 'verticals' as const,
          label: 'Verticals / Industries',
          placeholder: 'e.g., SaaS, E-commerce, Healthcare, etc.',
          type: 'input',
        },
        {
          key: 'companySize' as const,
          label: 'Company Size',
          placeholder: 'e.g., 50-200 employees, $10M-50M revenue',
          type: 'input',
        },
        {
          key: 'jobTitles' as const,
          label: 'Job Titles',
          placeholder: 'e.g., VP of Marketing, CMO, Head of Growth',
          type: 'input',
        },
        {
          key: 'geography' as const,
          label: 'Geography',
          placeholder: 'e.g., US, North America, English-speaking markets',
          type: 'input',
        },
      ],
    },
    {
      title: 'Pain Points & Value',
      icon: MessageSquare,
      fields: [
        {
          key: 'painPoints' as const,
          label: 'Pain Points',
          placeholder: 'What problems does your ideal customer face? What keeps them up at night?',
          type: 'textarea',
        },
        {
          key: 'offer' as const,
          label: 'Your Offer',
          placeholder: 'What is your main offer or service being sold?',
          type: 'textarea',
        },
      ],
    },
    {
      title: 'Differentiation',
      icon: Award,
      fields: [
        {
          key: 'differentiator' as const,
          label: 'Differentiator',
          placeholder: 'What makes you unique? Why should they choose you?',
          type: 'textarea',
        },
        {
          key: 'socialProof' as const,
          label: 'Social Proof',
          placeholder: 'Case studies, logos, testimonials, results you can reference...',
          type: 'textarea',
        },
      ],
    },
    {
      title: 'Objection Handling',
      icon: AlertTriangle,
      fields: [
        {
          key: 'commonObjections' as const,
          label: 'Common Objections',
          placeholder: 'What objections do you commonly face and how do you handle them?',
          type: 'textarea',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            ICP & Positioning
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Define your ideal customer profile and messaging strategy
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateAI}
            disabled={generating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              generating
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
            } text-white`}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasChanges && !saving
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : isDarkMode
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Error Message */}
      {aiError && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{aiError}</p>
          <button
            onClick={() => setAiError(null)}
            className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AI Suggestions Panel */}
      {aiSuggestions && (
        <div
          className={`rounded-xl p-5 border-2 ${
            isDarkMode
              ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30'
              : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles
                className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
              />
              <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                AI-Generated Suggestions
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={applyAllSuggestions}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Check className="w-3 h-3" />
                Apply All
              </button>
              <button
                onClick={() => setAiSuggestions(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
                }`}
              >
                <X className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </button>
            </div>
          </div>

          <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Review the suggestions below and click on any field to apply it to your ICP.
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(aiSuggestions).map(([key, value]) => {
              if (!value) return null;
              const fieldLabels: Record<string, string> = {
                targetDescription: 'Target Description',
                verticals: 'Verticals',
                companySize: 'Company Size',
                jobTitles: 'Job Titles',
                geography: 'Geography',
                painPoints: 'Pain Points',
                offer: 'Offer',
                differentiator: 'Differentiator',
                socialProof: 'Social Proof',
                commonObjections: 'Common Objections',
              };

              return (
                <button
                  key={key}
                  onClick={() => applySuggestion(key as keyof ICPSuggestion)}
                  className={`text-left p-3 rounded-lg border transition-all hover:scale-[1.02] ${
                    isDarkMode
                      ? 'bg-slate-800/50 border-slate-700 hover:border-purple-500'
                      : 'bg-white/80 border-slate-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
                    >
                      {fieldLabels[key] || key}
                    </span>
                    <Check
                      className={`w-3 h-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                    />
                  </div>
                  <p
                    className={`text-sm line-clamp-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    {value}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Company Name Header */}
      <div
        className={`rounded-xl p-5 ${
          isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Users className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Company Information
          </h2>
        </div>
        <div>
          <label
            className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
          >
            Company Name
          </label>
          <input
            type="text"
            value={formData.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="Your company name"
            className={`w-full mt-1 px-4 py-2.5 rounded-lg text-sm ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div
          key={section.title}
          className={`rounded-xl p-5 ${
            isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <section.icon
              className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
            />
            <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {section.title}
            </h2>
          </div>

          <div className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label
                  className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`w-full mt-1 px-4 py-2.5 rounded-lg text-sm resize-none ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full mt-1 px-4 py-2.5 rounded-lg text-sm ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div
          className={`sticky bottom-4 p-4 rounded-xl ${
            isDarkMode ? 'bg-slate-800/90 backdrop-blur' : 'bg-white/90 backdrop-blur shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              You have unsaved changes
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ICPPage;
