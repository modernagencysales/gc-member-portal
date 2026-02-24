import React, { useState } from 'react';

interface ClientEntry {
  url: string;
  notes: string;
}

interface StepBestClientsProps {
  entries: ClientEntry[];
  onChange: (entries: ClientEntry[]) => void;
}

const LINKEDIN_URL_RE = /^https?:\/\/(www\.)?linkedin\.com\/in\//i;

function validateLinkedInUrl(url: string): string | null {
  if (!url.trim()) return null;
  if (!LINKEDIN_URL_RE.test(url.trim())) {
    return 'Must start with https://linkedin.com/in/ or https://www.linkedin.com/in/';
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
    // Clean up expanded/touched state
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
        Paste the LinkedIn URLs of 3-5 clients you'd clone if you could. We'll analyze their
        profiles to understand exactly who you serve best.
      </p>

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const urlError = touchedUrls.has(index) ? validateLinkedInUrl(entry.url) : null;

          return (
            <div key={index} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-start gap-3">
                {/* LinkedIn icon */}
                <div className="flex-shrink-0 mt-2">
                  <svg
                    className="w-5 h-5 text-zinc-400 dark:text-zinc-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>

                {/* URL input */}
                <div className="flex-1">
                  <input
                    type="url"
                    value={entry.url}
                    onChange={(e) => updateEntry(index, 'url', e.target.value)}
                    onBlur={() => markTouched(index)}
                    placeholder="https://linkedin.com/in/client-name"
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
