/** DfyOverviewCard. Overview card with client details grid, LinkedIn inline edit, Linear customer, and magic link. */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Mail } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { logError } from '../../../lib/logError';
import { queryKeys } from '../../../lib/queryClient';
import { formatCurrency } from '../../../lib/formatCurrency';
import { createLinearCustomer } from '../../../services/dfy-admin-supabase';
import InfoPair from './shared/InfoPair';

import type {
  DfyAdminEngagement,
  DfyCommunicationPreference,
} from '../../../types/dfy-admin-types';
import type { UseMutationResult } from '@tanstack/react-query';

// ─── Types ─────────────────────────────────────────────
export interface DfyOverviewCardProps {
  engagement: DfyAdminEngagement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engagementMutation: UseMutationResult<any, Error, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  magicLinkMutation: UseMutationResult<any, Error, void>;
}

// ─── Component ─────────────────────────────────────────
export default function DfyOverviewCard({
  engagement,
  engagementMutation,
  magicLinkMutation,
}: DfyOverviewCardProps) {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const [editingLinkedIn, setEditingLinkedIn] = useState(false);
  const [linkedInDraft, setLinkedInDraft] = useState('');

  // ─── Linear Customer Handlers ──────────────────────────
  const handleCreateLinearCustomer = async (suffix?: string) => {
    try {
      const data = await createLinearCustomer(engagement.id, suffix ? { suffix } : undefined);
      if (data.success) {
        window.alert(suffix ? `Created: ${data.name}` : `Customer created: ${data.name}`);
        queryClient.invalidateQueries({
          queryKey: queryKeys.dfyEngagement(engagement.id),
        });
      } else {
        window.alert(`Error: ${data.error}`);
      }
    } catch (err) {
      logError('DfyOverviewCard:createLinearCustomer', err);
      window.alert('Failed to create customer');
    }
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
        Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoPair label="Client Email" value={engagement.client_email} />
        <InfoPair label="Monthly Rate" value={`${formatCurrency(engagement.monthly_rate)}/mo`} />
        <InfoPair
          label="Start Date"
          value={
            engagement.start_date ? new Date(engagement.start_date).toLocaleDateString() : '\u2014'
          }
        />
        <InfoPair
          label="Stripe Subscription"
          value={
            engagement.stripe_subscription_id
              ? `${engagement.stripe_subscription_id.slice(0, 20)}...`
              : '\u2014'
          }
        />
        <InfoPair
          label="Portal Link"
          value={engagement.portal_slug}
          href={`/client/${engagement.portal_slug}`}
        />

        {/* LinkedIn URL — editable inline */}
        <div>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
          >
            LinkedIn URL
          </p>
          {editingLinkedIn ? (
            <input
              type="url"
              autoFocus
              value={linkedInDraft}
              onChange={(e) => setLinkedInDraft(e.target.value)}
              onBlur={() => {
                const trimmed = linkedInDraft.trim();
                const current = engagement.linkedin_url || '';
                if (trimmed !== current) {
                  engagementMutation.mutate({ linkedin_url: trimmed || null });
                }
                setEditingLinkedIn(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setLinkedInDraft(engagement.linkedin_url || '');
                  setEditingLinkedIn(false);
                }
              }}
              placeholder="https://linkedin.com/in/..."
              className={`mt-0.5 w-full text-sm font-medium px-2 py-1 rounded border ${
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500'
                  : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
              } focus:ring-1 focus:ring-violet-500 focus:border-transparent`}
            />
          ) : engagement.linkedin_url ? (
            <a
              href={engagement.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-medium flex items-center gap-1 mt-0.5 cursor-pointer ${
                isDarkMode
                  ? 'text-violet-400 hover:text-violet-300'
                  : 'text-violet-600 hover:text-violet-700'
              }`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey) return;
                e.preventDefault();
                setLinkedInDraft(engagement.linkedin_url || '');
                setEditingLinkedIn(true);
              }}
            >
              {engagement.linkedin_url
                .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
                .replace(/\/$/, '') || engagement.linkedin_url}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <button
              onClick={() => {
                setLinkedInDraft('');
                setEditingLinkedIn(true);
              }}
              className={`text-sm mt-0.5 ${
                isDarkMode
                  ? 'text-zinc-500 hover:text-zinc-400'
                  : 'text-zinc-400 hover:text-zinc-500'
              }`}
            >
              + Add LinkedIn URL
            </button>
          )}
        </div>

        <InfoPair
          label="Linear Project"
          value={engagement.linear_project_id ? 'View Project' : '\u2014'}
          href={
            engagement.linear_project_id
              ? `https://linear.app/modern-agency-sales/project/${engagement.linear_project_id}`
              : undefined
          }
        />

        {/* Linear Customer */}
        <div>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
          >
            Linear Customer
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {engagement.linear_customer_id ? (
              <>
                <a
                  href={`https://linear.app/modern-agency-sales/customer/${engagement.linear_customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-sm underline"
                >
                  View Customer
                </a>
                <button
                  onClick={async () => {
                    if (
                      !window.confirm('Create an additional Linear customer for this engagement?')
                    )
                      return;
                    await handleCreateLinearCustomer(`#${Date.now().toString(36)}`);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                >
                  + Additional
                </button>
              </>
            ) : (
              <button
                onClick={() => handleCreateLinearCustomer()}
                className="text-indigo-400 hover:text-indigo-300 text-sm underline"
              >
                Create Customer
              </button>
            )}
          </div>
        </div>

        <InfoPair label="Slack Channel" value={engagement.slack_channel_id || '\u2014'} />

        {/* Communication Preference */}
        <div>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
          >
            Communication
          </p>
          <select
            value={engagement.communication_preference || 'email'}
            onChange={(e) =>
              engagementMutation.mutate({
                communication_preference: e.target.value as DfyCommunicationPreference,
              })
            }
            disabled={engagementMutation.isPending}
            className={`mt-0.5 text-sm font-medium px-2 py-1 rounded border ${
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                : 'bg-white border-zinc-300 text-zinc-900'
            } disabled:opacity-50`}
          >
            <option value="email">Email</option>
            <option value="slack">Slack</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>

      {/* Resend Magic Link */}
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => magicLinkMutation.mutate()}
          disabled={magicLinkMutation.isPending}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          {magicLinkMutation.isPending
            ? 'Sending...'
            : magicLinkMutation.isSuccess
              ? 'Magic link sent!'
              : 'Resend Magic Link'}
        </button>
      </div>
    </div>
  );
}
