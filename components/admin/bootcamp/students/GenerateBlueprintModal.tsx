import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { GTM_SYSTEM_URL } from '../../../../lib/api-config';

const INTAKE_API_URL = `${GTM_SYSTEM_URL}/api/webhooks/blueprint-form`;

interface GenerateBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  studentEmail: string;
}

const GenerateBlueprintModal: React.FC<GenerateBlueprintModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentEmail,
}) => {
  const { isDarkMode } = useTheme();

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate LinkedIn URL
    const linkedinPattern = /linkedin\.com\/in\//i;
    if (!linkedinPattern.test(linkedinUrl)) {
      setError(
        'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/your-name)'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const webhookSecret = import.meta.env.VITE_BLUEPRINT_WEBHOOK_SECRET;
      if (webhookSecret) {
        headers['x-webhook-secret'] = webhookSecret;
      }

      const response = await fetch(INTAKE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          linkedin_url: linkedinUrl,
          full_name: studentName || '',
          email: studentEmail,
          business_type: businessType || '',
          monthly_income: '',
          send_email: false,
          source_url: window.location.href,
          lead_magnet_source: 'admin-bootcamp',
        }),
      });

      if (response.ok || response.status === 409) {
        setSuccess(true);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || data.error || `Request failed with status ${response.status}`);
      }
    } catch (err) {
      console.error('Blueprint generation failed:', err);
      setError('Network error. Please check the connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLinkedinUrl('');
    setBusinessType('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-xl ${
          isDarkMode ? 'bg-slate-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Generate Blueprint</h2>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Blueprint Generation Started</h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Blueprint generation has been triggered for{' '}
              <span className="font-medium text-slate-900 dark:text-white">
                {studentName || studentEmail}
              </span>
              . It will be automatically linked once complete.
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg font-medium bg-violet-600 text-white hover:bg-violet-700"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Generate a LinkedIn Authority Blueprint for{' '}
              <span className="font-medium text-slate-900 dark:text-white">
                {studentName || studentEmail}
              </span>
              .
            </p>

            {/* Pre-filled fields (read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  value={studentName || ''}
                  disabled
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                      : 'bg-slate-50 border-slate-300 text-slate-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={studentEmail}
                  disabled
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                      : 'bg-slate-50 border-slate-300 text-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* LinkedIn URL (required) */}
            <div>
              <label className="block text-sm font-medium mb-1.5">LinkedIn URL *</label>
              <input
                type="url"
                required
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>

            {/* Business Type (optional) */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Business Type{' '}
                <span className={`font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  (optional)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g., SaaS, Consulting, Agency"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className={`text-sm px-4 py-3 rounded-lg ${
                  isDarkMode
                    ? 'bg-red-900/20 text-red-400 border border-red-900/30'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GenerateBlueprintModal;
