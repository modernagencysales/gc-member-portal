import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { submitInterview } from '../../../services/intro-offer-supabase';

interface InterviewFormProps {
  offerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Field names match gtm-system InterviewData schema (src/lib/intro-offers/types.ts)
interface FormState {
  // ICP
  industry: string;
  company_size: string;
  job_titles: string;
  pain_points: string;
  buying_triggers: string;
  // Content
  key_topics: string;
  client_stories: string;
  tone_notes: string;
  avoid: string;
  // Lead Magnet
  preferred_archetype: string;
  topic_direction: string;
  existing_assets: string;
  // Outreach
  target_companies: string;
  geographic_focus: string;
  exclusions: string;
}

const initialForm: FormState = {
  industry: '',
  company_size: '',
  job_titles: '',
  pain_points: '',
  buying_triggers: '',
  key_topics: '',
  client_stories: '',
  tone_notes: '',
  avoid: '',
  preferred_archetype: '',
  topic_direction: '',
  existing_assets: '',
  target_companies: '',
  geographic_focus: '',
  exclusions: '',
};

const InterviewForm: React.FC<InterviewFormProps> = ({ offerId, onClose, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const interviewData = {
      icp: {
        industry: form.industry,
        company_size: form.company_size,
        job_titles: form.job_titles.split('\n').filter(Boolean),
        pain_points: form.pain_points.split('\n').filter(Boolean),
        buying_triggers: form.buying_triggers.split('\n').filter(Boolean),
      },
      content: {
        key_topics: form.key_topics.split('\n').filter(Boolean),
        client_stories: form.client_stories.split('\n\n').filter(Boolean),
        tone_notes: form.tone_notes,
        avoid: form.avoid.split('\n').filter(Boolean),
      },
      lead_magnet: {
        preferred_archetype: form.preferred_archetype,
        topic_direction: form.topic_direction,
        existing_assets: form.existing_assets.split('\n').filter(Boolean),
      },
      outreach: {
        target_companies: form.target_companies.split('\n').filter(Boolean),
        geographic_focus: form.geographic_focus,
        exclusions: form.exclusions.split('\n').filter(Boolean),
      },
    };

    try {
      await submitInterview(offerId, interviewData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit interview data');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDarkMode
      ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500'
      : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`;

  const textareaClass = `${inputClass} resize-none`;

  const labelClass = `block text-sm font-medium mb-1 ${
    isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
  }`;

  const sectionClass = `space-y-4 pb-6 mb-6 border-b ${
    isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl ${
          isDarkMode ? 'bg-zinc-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Interview Data
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-0">
          {/* ICP Section */}
          <div className={sectionClass}>
            <h4
              className={`text-sm font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Ideal Customer Profile
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Industry</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => update('industry', e.target.value)}
                  placeholder="e.g., B2B SaaS"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Company Size</label>
                <input
                  type="text"
                  value={form.company_size}
                  onChange={(e) => update('company_size', e.target.value)}
                  placeholder="e.g., 50-200 employees"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Job Titles (one per line)</label>
              <textarea
                value={form.job_titles}
                onChange={(e) => update('job_titles', e.target.value)}
                rows={3}
                placeholder="VP Marketing&#10;Head of Growth&#10;CMO"
                className={textareaClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Pain Points (one per line)</label>
              <textarea
                value={form.pain_points}
                onChange={(e) => update('pain_points', e.target.value)}
                rows={3}
                placeholder="Lead generation is inconsistent&#10;Low LinkedIn engagement&#10;No clear content strategy"
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass}>Buying Triggers (one per line)</label>
              <textarea
                value={form.buying_triggers}
                onChange={(e) => update('buying_triggers', e.target.value)}
                rows={2}
                placeholder="Just raised funding&#10;Hired new marketing lead&#10;Expanding to new market"
                className={textareaClass}
              />
            </div>
          </div>

          {/* Content Section */}
          <div className={sectionClass}>
            <h4
              className={`text-sm font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Content Preferences
            </h4>
            <div>
              <label className={labelClass}>Key Topics (one per line)</label>
              <textarea
                value={form.key_topics}
                onChange={(e) => update('key_topics', e.target.value)}
                rows={3}
                placeholder="LinkedIn lead generation&#10;B2B sales strategies&#10;Agency growth"
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass}>Client Stories (separate with blank line)</label>
              <textarea
                value={form.client_stories}
                onChange={(e) => update('client_stories', e.target.value)}
                rows={4}
                placeholder="Helped Agency X go from 0 to 50 leads/month...&#10;&#10;Worked with SaaS startup Y to build their outbound..."
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tone / Voice Notes</label>
              <input
                type="text"
                value={form.tone_notes}
                onChange={(e) => update('tone_notes', e.target.value)}
                placeholder="e.g., Professional but approachable, thought-leader"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Topics to Avoid (one per line)</label>
              <textarea
                value={form.avoid}
                onChange={(e) => update('avoid', e.target.value)}
                rows={2}
                placeholder="Politics&#10;Controversial opinions"
                className={textareaClass}
              />
            </div>
          </div>

          {/* Lead Magnet Section */}
          <div className={sectionClass}>
            <h4
              className={`text-sm font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Lead Magnet
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Preferred Archetype</label>
                <select
                  value={form.preferred_archetype}
                  onChange={(e) => update('preferred_archetype', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select type...</option>
                  <option value="checklist">Checklist</option>
                  <option value="guide">Guide</option>
                  <option value="template">Template</option>
                  <option value="calculator">Calculator</option>
                  <option value="quiz">Quiz</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Topic Direction</label>
                <input
                  type="text"
                  value={form.topic_direction}
                  onChange={(e) => update('topic_direction', e.target.value)}
                  placeholder="e.g., LinkedIn outreach for agencies"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Existing Assets (one per line)</label>
              <textarea
                value={form.existing_assets}
                onChange={(e) => update('existing_assets', e.target.value)}
                rows={2}
                placeholder="Blog posts about lead gen&#10;Case study PDF&#10;Webinar recordings"
                className={textareaClass}
              />
            </div>
          </div>

          {/* Outreach Section */}
          <div className="space-y-4 pb-4">
            <h4
              className={`text-sm font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Outreach
            </h4>
            <div>
              <label className={labelClass}>Target Companies (one per line)</label>
              <textarea
                value={form.target_companies}
                onChange={(e) => update('target_companies', e.target.value)}
                rows={3}
                placeholder="Companies or types of companies to target..."
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass}>Geographic Focus</label>
              <input
                type="text"
                value={form.geographic_focus}
                onChange={(e) => update('geographic_focus', e.target.value)}
                placeholder="e.g., US, UK, EMEA"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Exclusions (one per line)</label>
              <textarea
                value={form.exclusions}
                onChange={(e) => update('exclusions', e.target.value)}
                rows={2}
                placeholder="Companies or industries to exclude..."
                className={textareaClass}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className={`p-3 rounded-lg text-sm ${
                isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit & Start Fulfillment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewForm;
