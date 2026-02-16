import React, { memo } from 'react';
import { TamContact, TamCompany, TamEmailStatus } from '../../../types/tam-types';

interface ContactTableProps {
  contacts: TamContact[];
  companyMap: Map<string, TamCompany>;
  selectedContactIds: Set<string>;
  onToggleContact: (contactId: string) => void;
  onSelectAll: () => void;
}

function getEmailStatusDot(status: TamEmailStatus | null): { color: string; label: string } {
  switch (status) {
    case 'verified':
      return { color: 'bg-green-500', label: 'Verified' };
    case 'found':
      return { color: 'bg-green-500', label: 'Found' };
    case 'catch_all':
      return { color: 'bg-yellow-500', label: 'Catch-all' };
    case 'invalid':
      return { color: 'bg-red-500', label: 'Invalid' };
    case 'not_found':
      return { color: 'bg-red-500', label: 'Not found' };
    default:
      return { color: 'bg-zinc-300 dark:bg-zinc-600', label: 'Unknown' };
  }
}

const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  companyMap,
  selectedContactIds,
  onToggleContact,
  onSelectAll,
}) => {
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
                    selectedContactIds.size > 0 && selectedContactIds.size === contacts.length
                  }
                  onChange={onSelectAll}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                LinkedIn
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {contacts.map((contact) => {
              const company = companyMap.get(contact.companyId);
              const emailStatus = getEmailStatusDot(contact.emailStatus);

              return (
                <tr key={contact.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.has(contact.id)}
                      onChange={() => onToggleContact(contact.id)}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-white text-sm">
                      {contact.firstName} {contact.lastName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {contact.title || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      {company?.name || '-'}
                    </div>
                    {company?.industry && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {company.industry}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {contact.email ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${emailStatus.color}`}
                          title={emailStatus.label}
                        />
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
                          {contact.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {contact.linkedinUrl ? (
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-600 dark:text-violet-400 hover:underline truncate max-w-[160px] block"
                      >
                        Profile
                      </a>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {contacts.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No contacts found. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default memo(ContactTable);
