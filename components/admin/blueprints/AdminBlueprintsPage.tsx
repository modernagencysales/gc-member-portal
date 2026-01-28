import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Search, Filter, RefreshCw, FileText } from 'lucide-react';
import { listProspects } from '../../../services/blueprint-supabase';
import { queryKeys } from '../../../lib/queryClient';
import { useTheme } from '../../../context/ThemeContext';
import { Prospect, ProspectStatus } from '../../../types/blueprint-types';
import BlueprintTable from './BlueprintTable';
import BlueprintDetailPanel from './BlueprintDetailPanel';
import BlueprintSettingsModal from './BlueprintSettingsModal';
import ContentEditor from './ContentEditor';

type StatusFilter = 'all' | 'complete' | 'pending' | 'error';
type OfferFilter = 'all' | 'unlocked' | 'locked';

const AdminBlueprintsPage: React.FC = () => {
  const { isDarkMode } = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [offerFilter, setOfferFilter] = useState<OfferFilter>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContentEditorOpen, setIsContentEditorOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // Query
  const {
    data: prospects,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.blueprintAdminProspects(),
    queryFn: () => listProspects(),
  });

  // Filter prospects
  const filteredProspects = useMemo(() => {
    if (!prospects) return [];

    return prospects.filter((prospect) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        prospect.fullName?.toLowerCase().includes(searchLower) ||
        prospect.firstName?.toLowerCase().includes(searchLower) ||
        prospect.lastName?.toLowerCase().includes(searchLower) ||
        prospect.email?.toLowerCase().includes(searchLower) ||
        prospect.company?.toLowerCase().includes(searchLower);

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'complete') {
          matchesStatus = prospect.status === 'complete';
        } else if (statusFilter === 'error') {
          matchesStatus = prospect.status === 'error';
        } else if (statusFilter === 'pending') {
          matchesStatus =
            prospect.status !== 'complete' &&
            prospect.status !== 'error' &&
            prospect.status !== undefined;
        }
      }

      // Offer filter
      let matchesOffer = true;
      if (offerFilter !== 'all') {
        if (offerFilter === 'unlocked') {
          matchesOffer = prospect.offerUnlocked === true;
        } else if (offerFilter === 'locked') {
          matchesOffer = prospect.offerUnlocked !== true;
        }
      }

      return matchesSearch && matchesStatus && matchesOffer;
    });
  }, [prospects, searchQuery, statusFilter, offerFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!prospects) return { total: 0, complete: 0, pending: 0, error: 0 };
    return {
      total: prospects.length,
      complete: prospects.filter((p) => p.status === 'complete').length,
      pending: prospects.filter((p) => p.status && p.status !== 'complete' && p.status !== 'error')
        .length,
      error: prospects.filter((p) => p.status === 'error').length,
    };
  }, [prospects]);

  // Handlers
  const handleRowClick = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedProspect(null);
  };

  const handleDetailPanelUpdate = () => {
    refetch();
  };

  const handleCopyUrl = async (prospect: Prospect) => {
    if (!prospect.slug) return;
    const url = `${window.location.origin}/blueprint/${prospect.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      // TODO: Add toast notification
      console.log('URL copied:', url);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleOpenContentEditor = () => {
    setIsContentEditorOpen(true);
  };

  const handleCloseContentEditor = () => {
    setIsContentEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Blueprints</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage LinkedIn Authority Blueprint prospects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenContentEditor}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            title="Content Editor"
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenSettings}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Blueprints', value: stats.total, color: 'blue' },
          { label: 'Complete', value: stats.complete, color: 'green' },
          { label: 'Pending', value: stats.pending, color: 'amber' },
          { label: 'Errors', value: stats.error, color: 'red' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
            }`}
          >
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={`px-4 py-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-zinc-900 border-zinc-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            <option value="complete">Complete</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>
          <select
            value={offerFilter}
            onChange={(e) => setOfferFilter(e.target.value as OfferFilter)}
            className={`px-4 py-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-zinc-900 border-zinc-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Offers</option>
            <option value="unlocked">Unlocked</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Loading blueprints...
          </p>
        </div>
      ) : (
        <BlueprintTable
          prospects={filteredProspects}
          onRowClick={handleRowClick}
          onCopyUrl={handleCopyUrl}
        />
      )}

      {/* Settings Modal */}
      <BlueprintSettingsModal isOpen={isSettingsOpen} onClose={handleCloseSettings} />

      {/* Content Editor Modal */}
      <ContentEditor isOpen={isContentEditorOpen} onClose={handleCloseContentEditor} />

      {/* Blueprint Detail Panel */}
      <BlueprintDetailPanel
        prospect={selectedProspect}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        onUpdate={handleDetailPanelUpdate}
      />
    </div>
  );
};

export default AdminBlueprintsPage;
