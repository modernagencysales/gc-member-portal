import React, { useCallback, useRef, useState } from 'react';
import { submitIntakeForm } from '../../services/dfy-service';

interface IntakeFormProps {
  portalSlug: string;
  clientName: string;
  onComplete: () => void;
}

const CRM_OPTIONS = [
  'HubSpot',
  'Salesforce',
  'Pipedrive',
  'Close',
  'Attio',
  'Monday CRM',
  'Zoho CRM',
  'Other',
  'None',
];

const NOTETAKER_OPTIONS = ['Fathom', 'Gong', 'Otter', 'Fireflies', 'Grain', 'Other', 'None'];

const LINKEDIN_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;

const MAX_FILES = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const IntakeForm: React.FC<IntakeFormProps> = ({ clientName, onComplete }) => {
  const [idealClient, setIdealClient] = useState('');
  const [crmType, setCrmType] = useState('');
  const [crmAccess, setCrmAccess] = useState('');
  const [notetakerTool, setNotetakerTool] = useState('');
  const [notetakerOther, setNotetakerOther] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinError, setLinkedinError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const firstName = clientName.split(' ')[0] || clientName;

  // Progress calculation
  const sectionsComplete = [
    idealClient.trim().length > 0,
    true, // files are optional
    crmType.trim().length > 0,
    notetakerTool.trim().length > 0,
    linkedinUrl.trim().length > 0 && !linkedinError,
  ].filter(Boolean).length;

  const canSubmit =
    idealClient.trim() &&
    crmType.trim() &&
    notetakerTool.trim() &&
    linkedinUrl.trim() &&
    !linkedinError &&
    (notetakerTool !== 'Other' || notetakerOther.trim()) &&
    !submitting;

  const validateLinkedIn = useCallback((url: string) => {
    if (!url.trim()) {
      setLinkedinError('');
      return;
    }
    if (!LINKEDIN_REGEX.test(url.trim())) {
      setLinkedinError(
        'Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/your-profile)'
      );
    } else {
      setLinkedinError('');
    }
  }, []);

  const addFiles = useCallback(
    (newFiles: ArrayLike<File>) => {
      const incoming = Array.from(newFiles);
      const valid: File[] = [];
      for (const f of incoming) {
        if (files.length + valid.length >= MAX_FILES) break;
        if (f.size > MAX_FILE_SIZE) continue;
        valid.push(f);
      }
      setFiles((prev) => [...prev, ...valid]);
    },
    [files.length]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('ideal_client', idealClient.trim());
      formData.append('crm_type', crmType.trim());
      formData.append('crm_access', crmAccess.trim());
      formData.append('notetaker_tool', notetakerTool.trim());
      if (notetakerTool === 'Other') {
        formData.append('notetaker_other', notetakerOther.trim());
      }
      formData.append('linkedin_url', linkedinUrl.trim());
      for (const file of files) {
        formData.append('files', file);
      }

      await submitIntakeForm(formData);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:px-6">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
            <span>{sectionsComplete} of 5 sections complete</span>
            <span>{Math.round((sectionsComplete / 5) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
              style={{ width: `${(sectionsComplete / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Welcome header */}
        <div className="mb-10">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">
            Client Onboarding
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Fill out this form so our team can get started on your account. This should take about 5
            minutes.
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Ideal Client */}
          <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-5">
            <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">
              1. Describe your ideal client
            </label>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
              Include industry, job titles, company size, and any other qualifying criteria.
            </p>
            <textarea
              value={idealClient}
              onChange={(e) => setIdealClient(e.target.value)}
              rows={4}
              placeholder="e.g. B2B SaaS founders, 10-50 employees, Series A funded, in the marketing/sales tech space..."
              className="w-full text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-3 py-2 placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Section 2: Content Upload */}
          <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-5">
            <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">
              2. Upload relevant content{' '}
              <span className="font-normal text-gray-400 dark:text-zinc-500">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
              Case studies, pitch decks, brand guidelines, or any docs that help us understand your
              business. Max 10 files, 25MB each.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors ${
                dragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
              }`}
            >
              <svg
                className="mx-auto h-8 w-8 text-gray-400 dark:text-zinc-500 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Drag & drop files here, or{' '}
                <span className="text-blue-600 dark:text-blue-400">browse</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                PDF, Word, PowerPoint, Excel, images, CSV, text
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between text-sm text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/50 rounded-md px-3 py-1.5"
                  >
                    <span className="truncate mr-3">
                      {f.name}{' '}
                      <span className="text-xs text-gray-400 dark:text-zinc-500">
                        ({formatFileSize(f.size)})
                      </span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 flex-shrink-0"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section 3: CRM */}
          <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-5">
            <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">
              3. CRM information
            </label>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
              Which CRM do you use, and how should we get access?
            </p>
            <div className="space-y-3">
              <select
                value={crmType}
                onChange={(e) => setCrmType(e.target.value)}
                className="w-full text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select your CRM...</option>
                {CRM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {crmType && crmType !== 'None' && (
                <input
                  type="text"
                  value={crmAccess}
                  onChange={(e) => setCrmAccess(e.target.value)}
                  placeholder="How should we get access? (e.g. I'll send an invite to tim@modernagencysales.com)"
                  className="w-full text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-3 py-2 placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              )}
            </div>
          </div>

          {/* Section 4: Notetaker */}
          <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-5">
            <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">
              4. Call recording / notetaker tool
            </label>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
              We use call transcripts to learn your voice and create content in your style.
            </p>
            <div className="space-y-3">
              <select
                value={notetakerTool}
                onChange={(e) => setNotetakerTool(e.target.value)}
                className="w-full text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select a tool...</option>
                {NOTETAKER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {notetakerTool === 'Other' && (
                <input
                  type="text"
                  value={notetakerOther}
                  onChange={(e) => setNotetakerOther(e.target.value)}
                  placeholder="Which tool do you use?"
                  className="w-full text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-3 py-2 placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              )}
            </div>
          </div>

          {/* Section 5: LinkedIn */}
          <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-5">
            <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">
              5. Your LinkedIn profile URL
            </label>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
              We'll use this to optimize your profile and create targeted content.
            </p>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => {
                setLinkedinUrl(e.target.value);
                if (linkedinError) validateLinkedIn(e.target.value);
              }}
              onBlur={(e) => validateLinkedIn(e.target.value)}
              placeholder="https://linkedin.com/in/your-profile"
              className={`w-full text-sm rounded-md border bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-3 py-2 placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none ${
                linkedinError
                  ? 'border-red-400 dark:border-red-600 focus:border-red-500'
                  : 'border-gray-300 dark:border-zinc-700 focus:border-blue-500'
              }`}
            />
            {linkedinError && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{linkedinError}</p>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Submitting...
              </>
            ) : (
              'Submit & Continue to Dashboard'
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Questions? Contact us at{' '}
            <a
              href="mailto:tim@modernagencysales.com"
              className="underline hover:text-gray-600 dark:hover:text-zinc-300"
            >
              tim@modernagencysales.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntakeForm;
