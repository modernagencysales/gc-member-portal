import React from 'react';
import { Sparkles, Loader2, Lightbulb } from 'lucide-react';

interface Props {
  emailText: string;
  onEmailTextChange: (value: string) => void;
  audienceDescription: string;
  onAudienceDescriptionChange: (value: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
}

const EXAMPLE_EMAIL = `Hi {{first_name}},

I noticed {{company}} has been {{recent_activity}} -- really impressive work.

{{company_pain_point}}

We've helped similar companies in {{industry}} solve this by {{value_proposition}}.

Would you be open to a quick 15-min call this week to see if we can help {{company}} achieve similar results?

Best,
[Your name]`;

export default function WriteEmailStep({
  emailText,
  onEmailTextChange,
  audienceDescription,
  onAudienceDescriptionChange,
  onAnalyze,
  analyzing,
}: Props) {
  const handleUseExample = () => {
    onEmailTextChange(EXAMPLE_EMAIL);
  };

  return (
    <div className="space-y-5">
      {/* Hero section */}
      <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/10 dark:to-zinc-900 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <Sparkles size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Start with your email
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Write or paste a cold email the way you want it to sound. Use{' '}
              <code className="px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                {'{{variable_name}}'}
              </code>{' '}
              for any personalized data. AI will detect your variables and auto-build the enrichment
              recipe to fill them.
            </p>
          </div>
        </div>
      </div>

      {/* Email textarea */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Your cold email
          </label>
          <button
            onClick={handleUseExample}
            className="inline-flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-600 font-medium transition-colors"
          >
            <Lightbulb size={11} />
            Use example
          </button>
        </div>
        <textarea
          value={emailText}
          onChange={(e) => onEmailTextChange(e.target.value)}
          rows={14}
          placeholder={`Hi {{first_name}},\n\nI noticed {{company}} has been...\n\nUse {{variable_name}} for any personalized data you want filled in automatically.`}
          className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all resize-y min-h-[280px] font-mono leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {emailText.length > 0
              ? `${emailText.length} characters`
              : 'Paste your email or write one from scratch'}
          </p>
          {emailText.length > 0 && <VariableCount text={emailText} />}
        </div>
      </div>

      {/* Optional audience description */}
      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
          Target audience{' '}
          <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={audienceDescription}
          onChange={(e) => onAudienceDescriptionChange(e.target.value)}
          placeholder="e.g. B2B SaaS founders, agency owners, e-commerce brands"
          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all"
        />
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
          Helps AI generate more relevant enrichment steps for your audience.
        </p>
      </div>
    </div>
  );
}

function VariableCount({ text }: { text: string }) {
  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  const unique = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim()))];

  if (unique.length === 0) return null;

  return (
    <p className="text-[11px] text-violet-500 dark:text-violet-400 font-medium">
      {unique.length} variable{unique.length !== 1 ? 's' : ''} detected
    </p>
  );
}
