import React, { useState, useEffect } from 'react';
import {
  Save,
  Users,
  Target,
  MessageSquare,
  Award,
  AlertTriangle,
  Gift,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingState } from '../../shared/LoadingSpinner';
import { fetchMemberICP, updateMemberICP } from '../../../services/gc-airtable';
import { MemberICP } from '../../../types/gc-types';

const ICPPage: React.FC = () => {
  const { gcMember } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [icp, setIcp] = useState<MemberICP | null>(null);
  const [formData, setFormData] = useState<Partial<MemberICP>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadICP();
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
