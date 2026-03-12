import React, { useState } from 'react';

interface ClientEntry {
  url: string;
  notes: string;
}

interface StepBestClientsProps {
  entries: ClientEntry[];
  onChange: (entries: ClientEntry[]) => void;
}

const HTTPS_URL_RE = /^https?:\/\/.+\..+/i;

function validateCompanyUrl(url: string): string | null {
  if (!url.trim()) return null;
  if (!HTTPS_URL_RE.test(url.trim())) {
    return 'Enter a valid website URL (e.g. https://www.company.com)';
  }
  return null;
}

const StepBestClients: React.FC<StepBestClientsProps> = ({ entries, onChange }) => {
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [touchedUrls, setTouchedUrls] = useState<Set<number>>(new Set());

  const updateEntry = (index: number, field: keyof ClientEntry, value: string) => {
    const updated = entries.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry));
    onChange(updated);
  };

  const addEntry = () => {
    if (entries.length >= 5) return;
    onChange([...entries, { url: '', notes: '' }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 2) return;
    const updated = entries.filter((_, i) => i !== index);
    onChange(updated);
    setExpandedNotes((prev) => {
      const next = new Set<number>();
      prev.forEach((idx) => {
        if (idx < index) next.add(idx);
        else if (idx > index) next.add(idx - 1);
      });
      return next;
    });
    setTouchedUrls((prev) => {
      const next = new Set<number>();
      prev.forEach((idx) => {
        if (idx < index) next.add(idx);
        else if (idx > index) next.add(idx - 1);
      });
      return next;
    });
  };

  const toggleNotes = (index: number) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const markTouched = (index: number) => {
    setTouchedUrls((prev) => new Set(prev).add(index));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
        Who are your best clients right now?
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
        Paste the website URLs of 3-5 companies you'd clone if you could. We'll use these to find
        similar companies to target.
      </p>

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const urlError = touchedUrls.has(index) ? validateCompanyUrl(entry.url) : null;

          return (
            <div key={index} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-start gap-3">
                {/* Globe icon */}
                <div className="flex-shrink-0 mt-2">
                  <svg
                    className="w-5 h-5 text-zinc-400 dark:text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.25 14.25 0 014 9 14.25 14.25 0 01-4 9 14.25 14.25 0 01-4-9 14.25 14.25 0 014-9z"
                    />
                  </svg>
                </div>

                {/* URL input */}
                <div className="flex-1">
                  <input
                    type="url"
                    value={entry.url}
                    onChange={(e) => updateEntry(index, 'url', e.target.value)}
                    onBlur={() => markTouched(index)}
                    placeholder="https://www.company.com"
                    className={`w-full text-sm bg-white dark:bg-zinc-900 border rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors ${
                      urlError
                        ? 'border-red-400 dark:border-red-600'
                        : 'border-gray-300 dark:border-zinc-700'
                    } text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500`}
                  />
                  {urlError && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{urlError}</p>
                  )}
                </div>

                {/* Remove button */}
                {entries.length > 2 && (
                  <button
                    onClick={() => removeEntry(index)}
                    className="flex-shrink-0 mt-2 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
                    aria-label={`Remove entry ${index + 1}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Notes toggle + textarea */}
              <div className="ml-8 mt-2">
                <button
                  onClick={() => toggleNotes(index)}
                  className="text-xs text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
                >
                  {expandedNotes.has(index) ? 'Hide notes' : 'Why are they great?'}
                </button>
                {expandedNotes.has(index) && (
                  <textarea
                    value={entry.notes}
                    onChange={(e) => updateEntry(index, 'notes', e.target.value)}
                    rows={2}
                    placeholder="e.g. They scaled from $20k to $80k/mo in 6 months, great communicators..."
                    className="mt-2 w-full text-sm bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add another button */}
      {entries.length < 5 && (
        <button
          onClick={addEntry}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add another
        </button>
      )}
    </div>
  );
};

export default StepBestClients;
