import React, { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Upload as UploadIcon } from 'lucide-react';
import {
  useContactLists,
  useCreateContactList,
  useInsertContacts,
  useDeleteContactList,
} from '../../../../hooks/useColdEmailRecipes';
import { updateContactListCount } from '../../../../services/cold-email-recipes-supabase';
import type { CsvParseResult } from '../../../../types/cold-email-recipe-types';
import CsvUploader from './CsvUploader';
import ColumnMapper from './ColumnMapper';
import ContactTable from './ContactTable';
import { logError } from '../../../../lib/logError';

interface Props {
  userId: string;
}

type ImportStep = 'idle' | 'upload' | 'map';

export default function ContactListManager({ userId }: Props) {
  const { data: lists, isLoading } = useContactLists(userId);
  const createList = useCreateContactList();
  const insertContacts = useInsertContacts();
  const deleteList = useDeleteContactList();

  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [csvResult, setCsvResult] = useState<CsvParseResult | null>(null);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleParsed = useCallback((result: CsvParseResult) => {
    setCsvResult(result);
    setImportStep('map');
  }, []);

  const handleImport = useCallback(
    async (mapping: Record<string, string>, listName: string) => {
      if (!csvResult) return;

      setImporting(true);
      try {
        // Create the list
        const list = await createList.mutateAsync({
          studentId: userId,
          name: listName,
          columnMapping: mapping,
        });

        // Prepare contacts
        const reverseMapping: Record<string, string> = {};
        for (const [csvCol, stdField] of Object.entries(mapping)) {
          reverseMapping[stdField] = csvCol;
        }

        const contacts = csvResult.rows.map((row) => {
          // Standard fields from mapping
          const firstName = row[reverseMapping['first_name']] || '';
          const lastName = row[reverseMapping['last_name']] || '';
          const email = row[reverseMapping['email']] || '';
          const company = row[reverseMapping['company']] || '';
          const title = row[reverseMapping['title']] || '';
          const linkedinUrl = row[reverseMapping['linkedin_url']] || '';

          // Custom fields = all unmapped columns
          const customFields: Record<string, string> = {};
          for (const header of csvResult.headers) {
            if (!mapping[header]) {
              customFields[header] = row[header] || '';
            }
          }

          return {
            listId: list.id,
            studentId: userId,
            firstName,
            lastName,
            email,
            company,
            title,
            linkedinUrl,
            customFields,
          };
        });

        // Insert in batches of 500
        for (let i = 0; i < contacts.length; i += 500) {
          const batch = contacts.slice(i, i + 500);
          await insertContacts.mutateAsync({ contacts: batch });
        }

        // Update count after all batches complete
        await updateContactListCount(list.id);

        setImportStep('idle');
        setCsvResult(null);
        setImportError(null);
        setExpandedListId(list.id);
      } catch (err) {
        logError('ContactListManager:handleImport', err);
        setImportError(err instanceof Error ? err.message : 'Import failed. Please try again.');
      } finally {
        setImporting(false);
      }
    },
    [csvResult, userId, createList, insertContacts]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Show import flow
  if (importStep === 'upload') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setImportStep('idle')}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          &larr; Back to lists
        </button>
        <CsvUploader onParsed={handleParsed} />
      </div>
    );
  }

  if (importStep === 'map' && csvResult) {
    return (
      <div className="space-y-4">
        {importError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg px-4 py-2">
            {importError}
          </div>
        )}
        {importing && (
          <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
            <div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
            Importing contacts...
          </div>
        )}
        <ColumnMapper
          csvResult={csvResult}
          onConfirm={handleImport}
          onBack={() => setImportStep('upload')}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {lists?.length || 0} list{lists?.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setImportStep('upload')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        >
          <Plus size={14} />
          Import CSV
        </button>
      </div>

      {!lists || lists.length === 0 ? (
        <div className="text-center py-16 px-4">
          <UploadIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            No contact lists yet
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
            Import a CSV to create your first contact list.
          </p>
          <button
            onClick={() => setImportStep('upload')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            <Plus size={14} />
            Import CSV
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => (
            <div key={list.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setExpandedListId(expandedListId === list.id ? null : list.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {expandedListId === list.id ? (
                    <ChevronDown size={14} className="text-zinc-400" />
                  ) : (
                    <ChevronRight size={14} className="text-zinc-400" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{list.name}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {list.contactCount} contact{list.contactCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this list and all its contacts?')) {
                      deleteList.mutate({ listId: list.id, studentId: userId });
                    }
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </button>

              {expandedListId === list.id && (
                <div className="px-4 pb-4">
                  <ContactTable listId={list.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
