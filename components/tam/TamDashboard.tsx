import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { MessageSquare, RefreshCw, Loader2 } from 'lucide-react';
import { TamContact, TamCompany, TamCompanyFeedback } from '../../types/tam-types';
import {
  useTamCompanies,
  useTamContacts,
  useTamStats,
  useCompanyFeedbackMutation,
} from '../../hooks/useTamProject';
import { useTamRefine } from '../../hooks/useTamRefine';
import TamStatsBar from './TamStatsBar';
import FilterBar, { Filters } from './dashboard/FilterBar';
import ContactTable from './dashboard/ContactTable';
import BulkActions from './dashboard/BulkActions';

interface TamDashboardProps {
  projectId: string;
  onOpenChat: () => void;
}

type SegmentTab = 'all' | 'linkedin_active' | 'email_only' | 'needs_review';

const TamDashboard: React.FC<TamDashboardProps> = ({ projectId, onOpenChat }) => {
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [activeSegment, setActiveSegment] = useState<SegmentTab>('all');
  const [filters, setFilters] = useState<Filters>({
    qualificationStatus: 'qualified',
    emailStatus: 'all',
    linkedinStatus: 'all',
    source: 'all',
  });

  const feedbackMutation = useCompanyFeedbackMutation();
  const refine = useTamRefine();

  // Fetch data
  const { data: stats } = useTamStats(projectId);
  const { data: companies = [], refetch: refetchCompanies } = useTamCompanies(projectId);
  const { data: contacts = [] } = useTamContacts(projectId);

  // Refetch companies when refine completes
  useEffect(() => {
    if (refine.result) refetchCompanies();
  }, [refine.result, refetchCompanies]);

  // Company lookup map
  const companyMap = useMemo(() => {
    return new Map(companies.map((c) => [c.id, c]));
  }, [companies]);

  // Group contacts by company
  const contactsByCompany = useMemo(() => {
    const map = new Map<string, TamContact[]>();
    contacts.forEach((contact) => {
      const companyContacts = map.get(contact.companyId) || [];
      companyContacts.push(contact);
      map.set(contact.companyId, companyContacts);
    });
    return map;
  }, [contacts]);

  // Get unique sources
  const sources = useMemo(() => {
    const sourceSet = new Set<string>();
    companies.forEach((c) => {
      if (c.source) sourceSet.add(c.source);
    });
    return Array.from(sourceSet).sort();
  }, [companies]);

  // Filter contacts based on their parent company's qualification + all other filters
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const company = companyMap.get(contact.companyId);
      if (!company) return false;

      // Company-level filters
      if (
        filters.qualificationStatus !== 'all' &&
        company.qualificationStatus !== filters.qualificationStatus
      ) {
        return false;
      }

      if (filters.source !== 'all' && company.source !== filters.source) {
        return false;
      }

      // Segment filters
      if (activeSegment === 'linkedin_active') {
        if (
          !contact.linkedinActive ||
          (contact.emailStatus !== 'verified' && contact.emailStatus !== 'catch_all')
        ) {
          return false;
        }
      } else if (activeSegment === 'email_only') {
        if (
          contact.linkedinActive ||
          (contact.emailStatus !== 'verified' && contact.emailStatus !== 'catch_all')
        ) {
          return false;
        }
      } else if (activeSegment === 'needs_review') {
        if (
          contact.email &&
          contact.emailStatus !== 'invalid' &&
          contact.emailStatus !== 'not_found'
        ) {
          return false;
        }
      }

      // Contact-level filters
      if (filters.emailStatus !== 'all' && contact.emailStatus !== filters.emailStatus) {
        return false;
      }

      if (filters.linkedinStatus !== 'all') {
        if (filters.linkedinStatus === 'active' && !contact.linkedinActive) return false;
        if (
          filters.linkedinStatus === 'inactive' &&
          contact.linkedinActive !== false &&
          contact.linkedinActive !== null
        )
          return false;
      }

      return true;
    });
  }, [contacts, companyMap, filters, activeSegment]);

  const toggleContact = useCallback((contactId: string) => {
    setSelectedContactIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(contactId)) {
        newSelected.delete(contactId);
      } else {
        newSelected.add(contactId);
      }
      return newSelected;
    });
  }, []);

  const selectAllContacts = useCallback(() => {
    setSelectedContactIds((prev) => {
      if (prev.size === filteredContacts.length) {
        return new Set();
      } else {
        return new Set(filteredContacts.map((c) => c.id));
      }
    });
  }, [filteredContacts]);

  // DiscoLike feedback stats
  const discolikeStats = useMemo(() => {
    const discolikeCompanies = companies.filter((c) => c.source === 'discolike');
    return {
      total: discolikeCompanies.length,
      liked: discolikeCompanies.filter((c) => c.feedback === 'liked').length,
      disliked: discolikeCompanies.filter((c) => c.feedback === 'disliked').length,
    };
  }, [companies]);

  const handleFeedback = useCallback(
    (companyId: string, feedback: TamCompanyFeedback | null) => {
      feedbackMutation.mutate({ companyId, feedback });
    },
    [feedbackMutation]
  );

  const handleRefine = useCallback(() => {
    refine.startRefine(projectId);
  }, [projectId, refine]);

  // Qualification summary for the info banner
  const qualificationSummary = useMemo(() => {
    const qualified = companies.filter((c) => c.qualificationStatus === 'qualified').length;
    const disqualified = companies.filter((c) => c.qualificationStatus === 'disqualified').length;
    const pending = companies.filter((c) => c.qualificationStatus === 'pending').length;
    return { qualified, disqualified, pending };
  }, [companies]);

  const segmentTabs: { key: SegmentTab; label: string; count: number }[] = useMemo(
    () => [
      { key: 'all', label: 'All Contacts', count: filteredContacts.length },
      {
        key: 'linkedin_active',
        label: 'LinkedIn Active',
        count: contacts.filter(
          (c) =>
            c.linkedinActive &&
            (c.emailStatus === 'verified' || c.emailStatus === 'catch_all') &&
            (filters.qualificationStatus === 'all' ||
              companyMap.get(c.companyId)?.qualificationStatus === filters.qualificationStatus)
        ).length,
      },
      {
        key: 'email_only',
        label: 'Email Only',
        count: contacts.filter(
          (c) =>
            !c.linkedinActive &&
            (c.emailStatus === 'verified' || c.emailStatus === 'catch_all') &&
            (filters.qualificationStatus === 'all' ||
              companyMap.get(c.companyId)?.qualificationStatus === filters.qualificationStatus)
        ).length,
      },
      {
        key: 'needs_review',
        label: 'Needs Review',
        count: contacts.filter(
          (c) =>
            (!c.email || c.emailStatus === 'invalid' || c.emailStatus === 'not_found') &&
            (filters.qualificationStatus === 'all' ||
              companyMap.get(c.companyId)?.qualificationStatus === filters.qualificationStatus)
        ).length,
      },
    ],
    [filteredContacts, contacts, filters.qualificationStatus, companyMap]
  );

  return (
    <div className="space-y-6">
      {stats && <TamStatsBar stats={stats} />}

      {/* Qualification Summary */}
      {qualificationSummary.qualified + qualificationSummary.disqualified > 0 && (
        <div className="flex items-center gap-4 text-sm px-1">
          <span className="text-zinc-500 dark:text-zinc-400">Companies:</span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            {qualificationSummary.qualified} qualified
          </span>
          {qualificationSummary.disqualified > 0 && (
            <span className="text-red-500 dark:text-red-400">
              {qualificationSummary.disqualified} disqualified
            </span>
          )}
          {qualificationSummary.pending > 0 && (
            <span className="text-zinc-400">{qualificationSummary.pending} pending</span>
          )}
          <span className="text-violet-600 dark:text-violet-400 font-medium">
            {filteredContacts.length} contacts shown
          </span>
        </div>
      )}

      <FilterBar filters={filters} onFiltersChange={setFilters} sources={sources} />

      {/* DiscoLike Refine Bar */}
      {discolikeStats.total > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/10 px-4 py-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-violet-700 dark:text-violet-300">
              Lookalike Companies
            </span>
            <span className="text-violet-600 dark:text-violet-400">
              {discolikeStats.total} found
            </span>
            {(discolikeStats.liked > 0 || discolikeStats.disliked > 0) && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {discolikeStats.liked > 0 && `${discolikeStats.liked} liked`}
                {discolikeStats.liked > 0 && discolikeStats.disliked > 0 && ', '}
                {discolikeStats.disliked > 0 && `${discolikeStats.disliked} disliked`}
              </span>
            )}
          </div>
          <button
            onClick={handleRefine}
            disabled={
              refine.isRefining || (discolikeStats.liked === 0 && discolikeStats.disliked === 0)
            }
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refine.isRefining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {refine.isRefining
              ? `Refining${refine.progress > 0 ? ` (${refine.progress}%)` : '...'}`
              : 'Refine Lookalikes'}
          </button>
        </div>
      )}

      {refine.result && !refine.isRefining && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Found {(refine.result.companiesFound as number) || 0} new lookalike companies
        </p>
      )}

      {refine.error && <p className="text-sm text-red-600 dark:text-red-400">{refine.error}</p>}

      {/* Segment Tabs */}
      <div className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
        {segmentTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSegment(tab.key)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeSegment === tab.key
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-zinc-400 dark:text-zinc-500">({tab.count})</span>
          </button>
        ))}
      </div>

      <ContactTable
        contacts={filteredContacts}
        companyMap={companyMap}
        selectedContactIds={selectedContactIds}
        onToggleContact={toggleContact}
        onSelectAll={selectAllContacts}
      />

      <BulkActions
        selectedContactIds={selectedContactIds}
        allFilteredContacts={filteredContacts}
        companies={companies}
      />

      {/* Floating Chat Button */}
      <button
        onClick={onOpenChat}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-violet-500 text-white shadow-lg hover:bg-violet-600 flex items-center justify-center transition-colors"
        title="Open chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
};

export default memo(TamDashboard);
