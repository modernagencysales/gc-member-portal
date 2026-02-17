import React, { useState, useEffect } from 'react';
import { X, Plus, Shield } from 'lucide-react';
import type {
  QualificationCriteria as CriteriaType,
  ProtectedKeywords,
} from '../../../types/connection-qualifier-types';
import { DEFAULT_PROTECTED_KEYWORDS } from '../../../types/connection-qualifier-types';
import type { MemberICP } from '../../../types/gc-types';

interface AggressiveRankerCriteriaProps {
  savedIcp: MemberICP | null;
  totalConnections: number;
  onSubmit: (criteria: CriteriaType, protectedKeywords: ProtectedKeywords, runName: string) => void;
  onBack: () => void;
}

function TagInput({
  label,
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = input.trim().replace(/,$/, '');
      if (trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        onAdd(trimmed);
      }
      setInput('');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs rounded-full"
          >
            {tag}
            <button
              onClick={() => onRemove(i)}
              className="hover:text-violet-900 dark:hover:text-violet-200"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          onClick={() => {
            const trimmed = input.trim();
            if (trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
              onAdd(trimmed);
            }
            setInput('');
          }}
          className="px-3 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AggressiveRankerCriteria({
  savedIcp,
  totalConnections,
  onSubmit,
  onBack,
}: AggressiveRankerCriteriaProps) {
  const [targetTitles, setTargetTitles] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [freeTextDescription, setFreeTextDescription] = useState('');
  const [runName, setRunName] = useState('');
  const [filmKeywords, setFilmKeywords] = useState<string[]>([...DEFAULT_PROTECTED_KEYWORDS.film]);
  const [musicKeywords, setMusicKeywords] = useState<string[]>([
    ...DEFAULT_PROTECTED_KEYWORDS.music,
  ]);

  useEffect(() => {
    if (savedIcp) {
      if (savedIcp.jobTitles) {
        setTargetTitles(
          savedIcp.jobTitles
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        );
      }
      if (savedIcp.verticals) {
        setTargetIndustries(
          savedIcp.verticals
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        );
      }
      if (savedIcp.targetDescription) {
        setFreeTextDescription(savedIcp.targetDescription);
      }
    }
  }, [savedIcp]);

  // Estimate gray zone size (~40% of connections) and cost
  const estimatedGrayZone = Math.round(totalConnections * 0.4);
  const estimatedCostLow = Math.round(estimatedGrayZone * 0.12); // ~$0.0012 per call
  const estimatedCostHigh = Math.round(estimatedGrayZone * 0.25);

  const isValid =
    targetTitles.length > 0 || targetIndustries.length > 0 || freeTextDescription.trim().length > 0;

  const handleSubmit = () => {
    const criteria: CriteriaType = {
      targetTitles,
      targetIndustries,
      excludeTitles: [],
      excludeCompanies: [],
      connectedAfter: null,
      freeTextDescription,
    };
    const protectedKeywords: ProtectedKeywords = {
      film: filmKeywords,
      music: musicKeywords,
    };
    onSubmit(criteria, protectedKeywords, runName || `Run ${new Date().toLocaleDateString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Configure Aggressive Ranking
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Define your ICP criteria and protected categories for {totalConnections.toLocaleString()}{' '}
          connections.
          {savedIcp && (
            <span className="text-violet-600 dark:text-violet-400">
              {' '}
              Pre-filled from your saved ICP.
            </span>
          )}
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Run Name (optional)
          </label>
          <input
            type="text"
            value={runName}
            onChange={(e) => setRunName(e.target.value)}
            placeholder="e.g. February 2026 Prune"
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <TagInput
          label="Target Job Titles"
          tags={targetTitles}
          onAdd={(t) => setTargetTitles([...targetTitles, t])}
          onRemove={(i) => setTargetTitles(targetTitles.filter((_, idx) => idx !== i))}
          placeholder="e.g. CEO, Founder, VP Sales — press Enter to add"
        />

        <TagInput
          label="Target Industries / Company Types"
          tags={targetIndustries}
          onAdd={(t) => setTargetIndustries([...targetIndustries, t])}
          onRemove={(i) => setTargetIndustries(targetIndustries.filter((_, idx) => idx !== i))}
          placeholder="e.g. SaaS, Marketing Agency — press Enter to add"
        />

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Additional ICP Context (optional)
          </label>
          <textarea
            value={freeTextDescription}
            onChange={(e) => setFreeTextDescription(e.target.value)}
            rows={3}
            placeholder="e.g. B2B SaaS founders in the US/UK scaling past $1M ARR who need outbound sales help"
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Protected Categories */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Protected Categories
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Connections matching these keywords will be auto-protected from removal, regardless of
            score.
          </p>

          <div className="space-y-4">
            <TagInput
              label="Film / TV Keywords"
              tags={filmKeywords}
              onAdd={(t) => setFilmKeywords([...filmKeywords, t])}
              onRemove={(i) => setFilmKeywords(filmKeywords.filter((_, idx) => idx !== i))}
              placeholder="Add keyword — press Enter"
            />

            <TagInput
              label="Music Keywords"
              tags={musicKeywords}
              onAdd={(t) => setMusicKeywords([...musicKeywords, t])}
              onRemove={(i) => setMusicKeywords(musicKeywords.filter((_, idx) => idx !== i))}
              placeholder="Add keyword — press Enter"
            />
          </div>
        </div>

        {/* Cost Estimate */}
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Phase 2 Cost Estimate
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            ~{estimatedGrayZone.toLocaleString()} gray zone connections will be enriched via Gemini
            with web search.
          </p>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mt-1">
            ~${(estimatedCostLow / 100).toFixed(0)}-${(estimatedCostHigh / 100).toFixed(0)}{' '}
            estimated
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            You can skip Phase 2 after reviewing Phase 1 results.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="px-6 py-2.5 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Start Ranking
        </button>
      </div>
    </div>
  );
}
