import React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import {
  Prospect,
  ProspectStatus,
  PROSPECT_STATUS_LABELS,
  getProspectDisplayName,
} from '../../../types/blueprint-types';
import { useTheme } from '../../../context/ThemeContext';

interface BlueprintTableProps {
  prospects: Prospect[];
  onRowClick: (prospect: Prospect) => void;
  onCopyUrl: (prospect: Prospect) => void;
}

/**
 * Get status badge styling based on prospect status
 */
function getStatusBadgeClasses(status?: ProspectStatus): string {
  switch (status) {
    case 'complete':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'pending_scrape':
    case 'scraping_profile':
    case 'scraping_posts':
    case 'pending_enrichment':
    case 'enriching':
    case 'enrichment_complete':
    case 'generating_posts':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'error':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

/**
 * Get a simplified status label for display
 */
function getSimplifiedStatusLabel(status?: ProspectStatus): string {
  if (!status) return 'Unknown';
  if (status === 'complete') return 'Complete';
  if (status === 'error') return 'Error';
  return 'Pending';
}

const BlueprintTable: React.FC<BlueprintTableProps> = ({ prospects, onRowClick, onCopyUrl }) => {
  const { isDarkMode } = useTheme();

  const handleCopyClick = (e: React.MouseEvent, prospect: Prospect) => {
    e.stopPropagation(); // Prevent row click
    onCopyUrl(prospect);
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={`border-b ${
                isDarkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Name
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Offer
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-200'}`}>
            {prospects.map((prospect) => (
              <tr
                key={prospect.id}
                onClick={() => onRowClick(prospect)}
                className={`cursor-pointer ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'}`}
              >
                {/* Name */}
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">
                      {getProspectDisplayName(prospect)}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {prospect.email || 'No email'}
                    </div>
                  </div>
                </td>

                {/* Score */}
                <td className="px-4 py-3 text-center">
                  {prospect.authorityScore !== undefined ? (
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                        prospect.authorityScore >= 70
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : prospect.authorityScore >= 40
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {prospect.authorityScore}
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500">--</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(prospect.status)}`}
                  >
                    {getSimplifiedStatusLabel(prospect.status)}
                  </span>
                </td>

                {/* Offer */}
                <td className="px-4 py-3">
                  {prospect.offerUnlocked ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Locked
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {prospect.slug && (
                      <button
                        onClick={(e) => handleCopyClick(e, prospect)}
                        className={`p-2 rounded-lg ${
                          isDarkMode
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                        }`}
                        title="Copy Blueprint URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(prospect);
                      }}
                      className={`p-2 rounded-lg ${
                        isDarkMode
                          ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                      }`}
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {prospects.length === 0 && (
        <div className="p-8 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            No blueprints found
          </p>
        </div>
      )}
    </div>
  );
};

export default BlueprintTable;
