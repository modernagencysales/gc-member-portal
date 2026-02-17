import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Shield,
  ArrowUpDown,
  Search,
  Check,
  X,
} from 'lucide-react';
import type {
  RankingRun,
  RankedConnection,
  RankingTier,
} from '../../../types/connection-qualifier-types';
import { TIER_CONFIG } from '../../../types/connection-qualifier-types';
import {
  fetchRankingResults,
  fetchResultsForExport,
  updateUserOverride,
} from '../../../services/connection-ranker-supabase';

interface RankingResultsProps {
  run: RankingRun;
  onStartOver: () => void;
}

function TierBadge({ tier }: { tier: RankingTier }) {
  const config = TIER_CONFIG[tier];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.bgColor} ${config.textColor}`}
    >
      {tier === 'protected' && <Shield className="w-3 h-3" />}
      {config.label}
    </span>
  );
}

function ScoreBreakdown({ conn }: { conn: RankedConnection }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs">
      <div>
        <span className="text-zinc-500 dark:text-zinc-400">Title</span>
        <p className="font-semibold text-zinc-900 dark:text-white">{conn.titleScore}</p>
      </div>
      <div>
        <span className="text-zinc-500 dark:text-zinc-400">Company</span>
        <p className="font-semibold text-zinc-900 dark:text-white">{conn.companyScore}</p>
      </div>
      <div>
        <span className="text-zinc-500 dark:text-zinc-400">Recency</span>
        <p className="font-semibold text-zinc-900 dark:text-white">{conn.recencyScore}</p>
      </div>
      <div>
        <span className="text-zinc-500 dark:text-zinc-400">AI</span>
        <p className="font-semibold text-zinc-900 dark:text-white">{conn.aiScore}</p>
      </div>
      {conn.aiReasoning && (
        <div className="col-span-2 sm:col-span-4">
          <span className="text-zinc-500 dark:text-zinc-400">AI Reasoning</span>
          <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">{conn.aiReasoning}</p>
        </div>
      )}
      {conn.aiGeography && (
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Geography</span>
          <p className="text-zinc-700 dark:text-zinc-300">{conn.aiGeography}</p>
        </div>
      )}
      {conn.aiIndustry && (
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Industry</span>
          <p className="text-zinc-700 dark:text-zinc-300">{conn.aiIndustry}</p>
        </div>
      )}
      {conn.isProtected && conn.protectedReason && (
        <div className="col-span-2 sm:col-span-4">
          <span className="text-purple-500">Protected: {conn.protectedReason}</span>
        </div>
      )}
    </div>
  );
}

function escapeCsvField(field: string): string {
  if (!field) return '';
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function generateExportCsv(connections: RankedConnection[]): string {
  const headers = [
    'Rank',
    'First Name',
    'Last Name',
    'URL',
    'Email',
    'Company',
    'Position',
    'Connected On',
    'Total Score',
    'Title Score',
    'Company Score',
    'Recency Score',
    'AI Score',
    'Tier',
    'Protected',
    'Geography',
    'Industry',
    'Override',
  ];
  const rows = connections.map((c) =>
    [
      String(c.rankPosition || ''),
      escapeCsvField(c.firstName || ''),
      escapeCsvField(c.lastName || ''),
      escapeCsvField(c.linkedinUrl || ''),
      escapeCsvField(c.emailAddress || ''),
      escapeCsvField(c.company || ''),
      escapeCsvField(c.position || ''),
      escapeCsvField(c.connectedOn || ''),
      String(c.totalScore),
      String(c.titleScore),
      String(c.companyScore),
      String(c.recencyScore),
      String(c.aiScore),
      c.tier || '',
      c.isProtected ? 'Yes' : 'No',
      escapeCsvField(c.aiGeography || ''),
      escapeCsvField(c.aiIndustry || ''),
      c.userOverride || '',
    ].join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RankingResults({ run, onStartOver }: RankingResultsProps) {
  const [activeTier, setActiveTier] = useState<RankingTier | 'all'>('all');
  const [results, setResults] = useState<RankedConnection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const PAGE_SIZE = 50;

  const loadResults = useCallback(async () => {
    try {
      const { results: r, total: t } = await fetchRankingResults(run.id, {
        tier: activeTier === 'all' ? undefined : activeTier,
        search: searchQuery || undefined,
        sortBy: 'rank_position',
        sortAsc,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setResults(r);
      setTotal(t);
    } catch (err) {
      console.error('Failed to load results:', err);
    }
  }, [run.id, activeTier, searchQuery, sortAsc, page]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [activeTier, searchQuery]);

  const handleOverride = async (resultId: string, override: 'keep' | 'remove' | null) => {
    await updateUserOverride(resultId, override);
    setResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, userOverride: override } : r))
    );
  };

  const handleExport = async (filter: 'all' | 'removal' | 'keep') => {
    setIsExporting(true);
    try {
      const data = await fetchResultsForExport(run.id, filter);
      const csv = generateExportCsv(data);
      const label =
        filter === 'removal' ? 'removal-list' : filter === 'keep' ? 'keep-list' : 'all-scores';
      downloadCsv(csv, `connection-ranking-${label}.csv`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const tierTabs: Array<{ key: RankingTier | 'all'; label: string; count: number }> = [
    { key: 'all', label: 'All', count: run.totalConnections },
    { key: 'protected', label: 'Protected', count: run.tierProtected },
    { key: 'definite_keep', label: 'Definite Keep', count: run.tierDefiniteKeep },
    { key: 'strong_keep', label: 'Strong Keep', count: run.tierStrongKeep },
    { key: 'borderline', label: 'Borderline', count: run.tierBorderline },
    { key: 'likely_remove', label: 'Likely Remove', count: run.tierLikelyRemove },
    { key: 'definite_remove', label: 'Definite Remove', count: run.tierDefiniteRemove },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Ranking Results</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {run.totalConnections.toLocaleString()} connections ranked.{' '}
          {run.geminiCalls > 0 && `${run.geminiCalls.toLocaleString()} web enrichments performed.`}
        </p>
      </div>

      {/* Tier Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tierTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTier(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              activeTier === tab.key
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {tab.label} ({tab.count.toLocaleString()})
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, or title..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          title={sortAsc ? 'Best first' : 'Worst first'}
        >
          <ArrowUpDown className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Results Table */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-left">
                <th className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-12">
                  #
                </th>
                <th className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Name
                </th>
                <th className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Company
                </th>
                <th className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Position
                </th>
                <th className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-16">
                  Score
                </th>
                <th className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-32">
                  Tier
                </th>
                <th className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {results.map((conn) => (
                <React.Fragment key={conn.id}>
                  <tr
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === conn.id ? null : conn.id)}
                  >
                    <td className="px-3 py-2 text-xs text-zinc-400">{conn.rankPosition}</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        {conn.firstName} {conn.lastName}
                        {expandedId === conn.id ? (
                          <ChevronUp className="w-3 h-3 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-zinc-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 max-w-[150px] truncate">
                      {conn.company || '—'}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">
                      {conn.position || '—'}
                    </td>
                    <td className="px-3 py-2 font-semibold text-zinc-900 dark:text-white">
                      {conn.totalScore}
                    </td>
                    <td className="px-3 py-2">{conn.tier && <TierBadge tier={conn.tier} />}</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleOverride(conn.id, conn.userOverride === 'keep' ? null : 'keep')
                          }
                          className={`p-1 rounded ${
                            conn.userOverride === 'keep'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                              : 'text-zinc-400 hover:text-green-500'
                          }`}
                          title="Keep"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            handleOverride(
                              conn.id,
                              conn.userOverride === 'remove' ? null : 'remove'
                            )
                          }
                          className={`p-1 rounded ${
                            conn.userOverride === 'remove'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                              : 'text-zinc-400 hover:text-red-500'
                          }`}
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === conn.id && (
                    <tr>
                      <td colSpan={7} className="px-3 py-2">
                        <ScoreBreakdown conn={conn} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {results.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-zinc-400 dark:text-zinc-500"
                  >
                    No connections found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of{' '}
            {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-600 rounded disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-600 rounded disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3 border-t border-zinc-200 dark:border-zinc-700 pt-4">
        <button
          onClick={() => handleExport('removal')}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Removal List ({(run.tierLikelyRemove + run.tierDefiniteRemove).toLocaleString()})
        </button>
        <button
          onClick={() => handleExport('keep')}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Keep List
        </button>
        <button
          onClick={() => handleExport('all')}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download All with Scores
        </button>
        <button
          onClick={onStartOver}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          New Ranking Run
        </button>
      </div>
    </div>
  );
}
