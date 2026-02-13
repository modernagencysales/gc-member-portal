import React, { useState, useCallback, memo } from 'react';
import { ChevronDown, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  TamCompany,
  TamCompanyFeedback,
  TamContact,
  TamQualificationStatus,
} from '../../../types/tam-types';
import ContactRow from './ContactRow';

interface CompanyTableProps {
  companies: TamCompany[];
  contactsByCompany: Map<string, TamContact[]>;
  allFilteredContacts: TamContact[];
  selectedContactIds: Set<string>;
  onToggleContact: (contactId: string) => void;
  onSelectAll: () => void;
  onFeedback?: (companyId: string, feedback: TamCompanyFeedback | null) => void;
}

function getQualificationBadgeClasses(status: TamQualificationStatus): string {
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
}

const CompanyTable: React.FC<CompanyTableProps> = ({
  companies,
  contactsByCompany,
  allFilteredContacts,
  selectedContactIds,
  onToggleContact,
  onSelectAll,
  onFeedback,
}) => {
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());

  const toggleCompany = useCallback((companyId: string) => {
    setExpandedCompanyIds((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(companyId)) {
        newExpanded.delete(companyId);
      } else {
        newExpanded.add(companyId);
      }
      return newExpanded;
    });
  }, []);

  return (
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
                  onChange={onSelectAll}
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
              {onFeedback && (
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Feedback
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {companies.map((company) => {
              const companyContacts = contactsByCompany.get(company.id) || [];
              const isExpanded = expandedCompanyIds.has(company.id);

              return (
                <React.Fragment key={company.id}>
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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualificationBadgeClasses(company.qualificationStatus)}`}
                      >
                        {company.qualificationStatus}
                      </span>
                    </td>
                    {onFeedback && company.source === 'discolike' ? (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onFeedback(company.id, company.feedback === 'liked' ? null : 'liked');
                            }}
                            className={`p-1 rounded transition-colors ${
                              company.feedback === 'liked'
                                ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
                                : 'text-zinc-400 hover:text-green-600 dark:hover:text-green-400'
                            }`}
                            title="Good match"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onFeedback(
                                company.id,
                                company.feedback === 'disliked' ? null : 'disliked'
                              );
                            }}
                            className={`p-1 rounded transition-colors ${
                              company.feedback === 'disliked'
                                ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                                : 'text-zinc-400 hover:text-red-600 dark:hover:text-red-400'
                            }`}
                            title="Bad match"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    ) : onFeedback ? (
                      <td className="px-4 py-3"></td>
                    ) : null}
                  </tr>

                  {isExpanded &&
                    companyContacts.map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedContactIds.has(contact.id)}
                        onToggle={onToggleContact}
                      />
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {companies.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No companies found</p>
        </div>
      )}
    </div>
  );
};

export default memo(CompanyTable);
