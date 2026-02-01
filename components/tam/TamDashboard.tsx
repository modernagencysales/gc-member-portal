import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Download, MessageSquare, Filter } from 'lucide-react';
import { TamContact, TamQualificationStatus, TamEmailStatus } from '../../types/tam-types';
import { useTamCompanies, useTamContacts, useTamStats } from '../../hooks/useTamProject';
import TamStatsBar from './TamStatsBar';

interface TamDashboardProps {
  projectId: string;
  onOpenChat: () => void;
}

type SegmentTab = 'all' | 'linkedin_active' | 'email_only' | 'needs_review';

interface Filters {
  qualificationStatus: string;
  emailStatus: string;
  linkedinStatus: string;
  source: string;
}

const TamDashboard: React.FC<TamDashboardProps> = ({ projectId, onOpenChat }) => {
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [activeSegment, setActiveSegment] = useState<SegmentTab>('all');
  const [filters, setFilters] = useState<Filters>({
    qualificationStatus: 'all',
    emailStatus: 'all',
    linkedinStatus: 'all',
    source: 'all',
  });

  // Fetch data
  const { data: stats } = useTamStats(projectId);
  const { data: companies = [] } = useTamCompanies(projectId);
  const { data: contacts = [] } = useTamContacts(projectId);

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
      // Apply qualification status filter
      if (
        filters.qualificationStatus !== 'all' &&
        company.qualificationStatus !== filters.qualificationStatus
      ) {
        return false;
      }

      // Apply source filter
      if (filters.source !== 'all' && company.source !== filters.source) {
        return false;
      }

      const companyContacts = contactsByCompany.get(company.id) || [];

      // Apply segment filters
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

      // Apply email status filter
      if (filters.emailStatus !== 'all') {
        const hasMatchingEmail = companyContacts.some((c) => c.emailStatus === filters.emailStatus);
        if (!hasMatchingEmail) return false;
      }

      // Apply LinkedIn status filter
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

  // Toggle company expansion
  const toggleCompany = (companyId: string) => {
    const newExpanded = new Set(expandedCompanyIds);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanyIds(newExpanded);
  };

  // Toggle contact selection
  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  // Select all visible contacts
  const selectAllContacts = () => {
    if (selectedContactIds.size === allFilteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(allFilteredContacts.map((c) => c.id)));
    }
  };

  // CSV Export
  const exportToCsv = () => {
    const contactsToExport =
      selectedContactIds.size > 0
        ? allFilteredContacts.filter((c) => selectedContactIds.has(c.id))
        : allFilteredContacts;

    const companyMap = new Map(companies.map((c) => [c.id, c]));
    const headers =
      'first_name,last_name,email,company_name,title,linkedin_url,phone,email_status,linkedin_active';
    const rows = contactsToExport.map((c) => {
      const company = companyMap.get(c.companyId);
      return [
        c.firstName || '',
        c.lastName || '',
        c.email || '',
        company?.name || '',
        c.title || '',
        c.linkedinUrl || '',
        c.phone || '',
        c.emailStatus || '',
        c.linkedinActive ? 'true' : 'false',
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new globalThis.Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tam-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status badge classes
  const getQualificationBadgeClasses = (status: TamQualificationStatus) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'disqualified':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'pending':
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
    }
  };

  const getEmailStatusDot = (status: TamEmailStatus | null) => {
    switch (status) {
      case 'verified':
      case 'found':
        return 'bg-green-500';
      case 'catch_all':
        return 'bg-yellow-500';
      case 'invalid':
      case 'not_found':
        return 'bg-red-500';
      default:
        return 'bg-zinc-300 dark:bg-zinc-600';
    }
  };

  const getLinkedInActivityDot = (linkedinActive: boolean | null, lastPostDate: string | null) => {
    if (!linkedinActive && linkedinActive !== false) {
      return { color: 'bg-zinc-300 dark:bg-zinc-600', label: 'Unknown' };
    }
    if (!lastPostDate) {
      return { color: 'bg-zinc-300 dark:bg-zinc-600', label: 'No activity' };
    }

    const daysSincePost = Math.floor(
      (Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSincePost < 30) {
      return { color: 'bg-green-500', label: `${daysSincePost}d ago` };
    } else if (daysSincePost < 90) {
      return { color: 'bg-yellow-500', label: `${daysSincePost}d ago` };
    } else {
      return { color: 'bg-zinc-400 dark:bg-zinc-600', label: `${daysSincePost}d ago` };
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      {stats && <TamStatsBar stats={stats} />}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <Filter className="w-4 h-4 text-zinc-400" />

        {/* Qualification Status Filter */}
        <select
          value={filters.qualificationStatus}
          onChange={(e) => setFilters({ ...filters, qualificationStatus: e.target.value })}
          className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="qualified">Qualified</option>
          <option value="disqualified">Disqualified</option>
          <option value="pending">Pending</option>
        </select>

        {/* Email Status Filter */}
        <select
          value={filters.emailStatus}
          onChange={(e) => setFilters({ ...filters, emailStatus: e.target.value })}
          className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        >
          <option value="all">All Email Statuses</option>
          <option value="verified">Verified</option>
          <option value="catch_all">Catch-all</option>
          <option value="not_found">Not Found</option>
          <option value="invalid">Invalid</option>
        </select>

        {/* LinkedIn Filter */}
        <select
          value={filters.linkedinStatus}
          onChange={(e) => setFilters({ ...filters, linkedinStatus: e.target.value })}
          className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        >
          <option value="all">All LinkedIn</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Source Filter */}
        <select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        >
          <option value="all">All Sources</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>

      {/* Segment Tabs */}
      <div className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveSegment('all')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeSegment === 'all'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveSegment('linkedin_active')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeSegment === 'linkedin_active'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          LinkedIn Active
        </button>
        <button
          onClick={() => setActiveSegment('email_only')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeSegment === 'email_only'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Email Only
        </button>
        <button
          onClick={() => setActiveSegment('needs_review')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeSegment === 'needs_review'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Needs Review
        </button>
      </div>

      {/* Company Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedContactIds.size > 0 &&
                      selectedContactIds.size === allFilteredContacts.length
                    }
                    onChange={selectAllContacts}
                    className="rounded border-zinc-300 dark:border-zinc-600"
                  />
                </th>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Industry
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Employees
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Location
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Contacts
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredCompanies.map((company) => {
                const companyContacts = contactsByCompany.get(company.id) || [];
                const isExpanded = expandedCompanyIds.has(company.id);

                return (
                  <React.Fragment key={company.id}>
                    {/* Company Row */}
                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleCompany(company.id)}
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900 dark:text-white">
                          {company.name}
                        </div>
                        {company.domain && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {company.domain}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {company.industry || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {company.employeeCount ? company.employeeCount.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {company.location || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        {companyContacts.length}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualificationBadgeClasses(
                            company.qualificationStatus
                          )}`}
                        >
                          {company.qualificationStatus}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Contact Rows */}
                    {isExpanded &&
                      companyContacts.map((contact) => {
                        const linkedinActivity = getLinkedInActivityDot(
                          contact.linkedinActive,
                          contact.linkedinLastPostDate
                        );

                        return (
                          <tr
                            key={contact.id}
                            className="bg-zinc-50/50 dark:bg-zinc-800/20 hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                          >
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedContactIds.has(contact.id)}
                                onChange={() => toggleContact(contact.id)}
                                className="rounded border-zinc-300 dark:border-zinc-600"
                              />
                            </td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2" colSpan={2}>
                              <div className="pl-8">
                                <div className="text-sm font-medium text-zinc-900 dark:text-white">
                                  {contact.firstName} {contact.lastName}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {contact.title || 'No title'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2" colSpan={2}>
                              {contact.email ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${getEmailStatusDot(
                                      contact.emailStatus
                                    )}`}
                                  ></span>
                                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {contact.email}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                                  No email
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center justify-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${linkedinActivity.color}`}
                                ></span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {linkedinActivity.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {contact.phone || '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCompanies.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No companies found</p>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedContactIds.size > 0 && (
        <div className="fixed bottom-20 left-1/2 transform -tranzinc-x-1/2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {selectedContactIds.size} contact{selectedContactIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={exportToCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      )}

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

export default TamDashboard;
