import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { MessageSquare, RefreshCw, Loader2 } from 'lucide-react';
import { TamContact, TamCompanyFeedback } from '../../types/tam-types';
import {
  useTamCompanies,
  useTamContacts,
  useTamStats,
  useCompanyFeedbackMutation,
} from '../../hooks/useTamProject';
import { useTamRefine } from '../../hooks/useTamRefine';
import TamStatsBar from './TamStatsBar';
import FilterBar, { Filters } from './dashboard/FilterBar';
import CompanyTable from './dashboard/CompanyTable';
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
    qualificationStatus: 'all',
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

  // Apply filters and segments
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      if (
        filters.qualificationStatus !== 'all' &&
        company.qualificationStatus !== filters.qualificationStatus
      ) {
        return false;
      }

      if (filters.source !== 'all' && company.source !== filters.source) {
        return false;
      }

      const companyContacts = contactsByCompany.get(company.id) || [];

      if (activeSegment === 'linkedin_active') {
        const hasActiveLinkedIn = companyContacts.some(
          (c) =>
            c.linkedinActive === true &&
            (c.emailStatus === 'verified' || c.emailStatus === 'catch_all')
        );
        if (!hasActiveLinkedIn) return false;
      } else if (activeSegment === 'email_only') {
        const hasEmailOnly = companyContacts.some(
          (c) =>
            (c.linkedinActive === false || c.linkedinActive === null) &&
            (c.emailStatus === 'verified' || c.emailStatus === 'catch_all')
        );
        if (!hasEmailOnly) return false;
      } else if (activeSegment === 'needs_review') {
        const needsReview = companyContacts.some(
          (c) => !c.email || c.emailStatus === 'invalid' || c.emailStatus === 'not_found'
        );
        if (!needsReview) return false;
      }

      if (filters.emailStatus !== 'all') {
        const hasMatchingEmail = companyContacts.some((c) => c.emailStatus === filters.emailStatus);
        if (!hasMatchingEmail) return false;
      }

      if (filters.linkedinStatus !== 'all') {
        if (filters.linkedinStatus === 'active') {
          const hasActive = companyContacts.some((c) => c.linkedinActive === true);
          if (!hasActive) return false;
        } else if (filters.linkedinStatus === 'inactive') {
          const hasInactive = companyContacts.some(
            (c) => c.linkedinActive === false || c.linkedinActive === null
          );
          if (!hasInactive) return false;
        }
      }

      return true;
    });
  }, [companies, contactsByCompany, filters, activeSegment]);

  // Get all contacts from filtered companies
  const allFilteredContacts = useMemo(() => {
    const contactSet = new Set<TamContact>();
    filteredCompanies.forEach((company) => {
      const companyContacts = contactsByCompany.get(company.id) || [];
      companyContacts.forEach((contact) => contactSet.add(contact));
    });
    return Array.from(contactSet);
  }, [filteredCompanies, contactsByCompany]);

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
      if (prev.size === allFilteredContacts.length) {
        return new Set();
      } else {
        return new Set(allFilteredContacts.map((c) => c.id));
      }
    });
  }, [allFilteredContacts]);

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

  const segmentTabs: { key: SegmentTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'linkedin_active', label: 'LinkedIn Active' },
    { key: 'email_only', label: 'Email Only' },
    { key: 'needs_review', label: 'Needs Review' },
  ];

  return (
    <div className="space-y-6">
      {stats && <TamStatsBar stats={stats} />}

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
          </button>
        ))}
      </div>

      <CompanyTable
        companies={filteredCompanies}
        contactsByCompany={contactsByCompany}
        allFilteredContacts={allFilteredContacts}
        selectedContactIds={selectedContactIds}
        onToggleContact={toggleContact}
        onSelectAll={selectAllContacts}
        onFeedback={discolikeStats.total > 0 ? handleFeedback : undefined}
      />

      <BulkActions
        selectedContactIds={selectedContactIds}
        allFilteredContacts={allFilteredContacts}
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
