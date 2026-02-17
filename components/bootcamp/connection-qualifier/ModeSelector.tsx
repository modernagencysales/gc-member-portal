import React from 'react';
import { Filter, BarChart3, History } from 'lucide-react';
import type { QualifierMode } from '../../../types/connection-qualifier-types';

interface ModeSelectorProps {
  onSelect: (mode: QualifierMode) => void;
  onViewHistory: () => void;
}

export default function ModeSelector({ onSelect, onViewHistory }: ModeSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Choose Qualification Mode
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Select how you want to qualify your LinkedIn connections.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('standard')}
          className="text-left p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all group"
        >
          <Filter className="w-6 h-6 text-violet-500 mb-3" />
          <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
            Standard Qualification
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            AI-powered binary qualified/not qualified. Best for smaller lists or quick filtering.
          </p>
          <ul className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 space-y-1">
            <li>Claude AI (Haiku) classification</li>
            <li>Qualified / Not Qualified output</li>
            <li>CSV export</li>
          </ul>
        </button>

        <button
          onClick={() => onSelect('aggressive')}
          className="text-left p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all group"
        >
          <BarChart3 className="w-6 h-6 text-orange-500 mb-3" />
          <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
            Aggressive Ranking
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Numerical scoring (0-100) with web enrichment. Built for pruning 30K connections.
          </p>
          <ul className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 space-y-1">
            <li>Three-phase scoring system</li>
            <li>Gemini web enrichment for gray zone</li>
            <li>Film/music protection</li>
            <li>Tiered removal lists</li>
          </ul>
        </button>
      </div>

      <button
        onClick={onViewHistory}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        <History className="w-4 h-4" />
        View Past Ranking Runs
      </button>
    </div>
  );
}
