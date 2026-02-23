import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle2, Send, RotateCcw, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { queryKeys } from '../../../lib/queryClient';
import {
  fetchIntroOfferById,
  fetchDeliverables,
  fetchLeadName,
  approveReview,
  triggerHandoff,
  retryDeliverable,
} from '../../../services/intro-offer-supabase';
import { STATUS_CONFIGS, DELIVERABLE_LABELS } from '../../../types/intro-offer-types';
import type { IntroOfferDeliverable } from '../../../types/intro-offer-types';
import InterviewForm from './InterviewForm';

function StatusBadge({ status }: { status: string }) {
  const { isDarkMode } = useTheme();
  const config = STATUS_CONFIGS[status] || { label: status, color: 'slate' };

  const colorMap: Record<string, { light: string; dark: string }> = {
    slate: { light: 'bg-zinc-100 text-zinc-700', dark: 'bg-zinc-800 text-zinc-300' },
    green: { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
    blue: { light: 'bg-violet-100 text-violet-700', dark: 'bg-violet-900/30 text-violet-400' },
    yellow: { light: 'bg-yellow-100 text-yellow-700', dark: 'bg-yellow-900/30 text-yellow-400' },
    purple: { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400' },
    emerald: {
      light: 'bg-emerald-100 text-emerald-700',
      dark: 'bg-emerald-900/30 text-emerald-400',
    },
    red: { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' },
  };

  const colors = colorMap[config.color] || colorMap.slate;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
        isDarkMode ? colors.dark : colors.light
      }`}
    >
      {config.label}
    </span>
  );
}

const IntroOfferDetail: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInterviewForm, setShowInterviewForm] = useState(false);

  const { data: offer, isLoading: offerLoading } = useQuery({
    queryKey: queryKeys.introOffer(offerId!),
    queryFn: () => fetchIntroOfferById(offerId!),
    enabled: !!offerId,
  });

  const { data: deliverables, isLoading: delsLoading } = useQuery({
    queryKey: queryKeys.introOfferDeliverables(offerId!),
    queryFn: () => fetchDeliverables(offerId!),
    enabled: !!offerId,
  });

  const { data: leadName } = useQuery({
    queryKey: ['lead', 'name', offer?.leadId],
    queryFn: () => fetchLeadName(offer!.leadId!),
    enabled: !!offer?.leadId,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.introOffer(offerId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.introOfferDeliverables(offerId!) });
  };

  const handleAction = async (action: string, fn: () => Promise<unknown>) => {
    setActionLoading(action);
    setError(null);
    try {
      await fn();
      refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (offerLoading || delsLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="p-8 text-center">
        <p className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Offer not found</p>
      </div>
    );
  }

  const hasErrors = (deliverables || []).some((d) => d.status === 'error');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/intro-offers')}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {leadName || 'Intro Offer'}
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {offer.id} · Created {new Date(offer.createdAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={offer.status} />
        <button
          onClick={refreshAll}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            isDarkMode
              ? 'bg-red-900/20 border-red-800 text-red-300'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {offer.status === 'interview_pending' && (
          <button
            onClick={() => setShowInterviewForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700"
          >
            Enter Interview Data
          </button>
        )}
        {offer.status === 'review' && (
          <button
            onClick={() => handleAction('review', () => approveReview(offerId!))}
            disabled={actionLoading === 'review'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {actionLoading === 'review' ? 'Approving...' : 'Approve & Deliver'}
          </button>
        )}
        {offer.status === 'delivered' && (
          <button
            onClick={() => handleAction('handoff', () => triggerHandoff(offerId!))}
            disabled={actionLoading === 'handoff'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {actionLoading === 'handoff' ? 'Handing off...' : 'Trigger Handoff'}
          </button>
        )}
      </div>

      {/* Interview Form Modal */}
      {showInterviewForm && (
        <InterviewForm
          offerId={offerId!}
          onClose={() => setShowInterviewForm(false)}
          onSuccess={() => {
            setShowInterviewForm(false);
            refreshAll();
          }}
        />
      )}

      {/* Deliverables */}
      <div
        className={`rounded-xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Deliverables
          </h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {(deliverables || []).map((d) => (
            <DeliverableRow
              key={d.id}
              deliverable={d}
              offerId={offerId!}
              onRetry={() => handleAction(`retry-${d.id}`, () => retryDeliverable(offerId!, d.id))}
              retrying={actionLoading === `retry-${d.id}`}
            />
          ))}
          {(!deliverables || deliverables.length === 0) && (
            <p
              className={`px-4 py-6 text-sm text-center ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              No deliverables yet
            </p>
          )}
        </div>
      </div>

      {/* Interview Data (if available) */}
      {offer.interviewData && (
        <div
          className={`rounded-xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div
            className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
          >
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Interview Data
            </h3>
          </div>
          <pre
            className={`px-4 py-3 text-xs overflow-x-auto ${
              isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
            }`}
          >
            {JSON.stringify(offer.interviewData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

function DeliverableRow({
  deliverable,
  offerId,
  onRetry,
  retrying,
}: {
  deliverable: IntroOfferDeliverable;
  offerId: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
          {deliverable.title || DELIVERABLE_LABELS[deliverable.type] || deliverable.type}
        </p>
        <p className={`text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {deliverable.type} · Order #{deliverable.deliveryOrder}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={deliverable.status} />
        {deliverable.status === 'error' && (
          <button
            onClick={onRetry}
            disabled={retrying}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              isDarkMode
                ? 'text-yellow-400 hover:bg-yellow-900/20'
                : 'text-yellow-700 hover:bg-yellow-50'
            } disabled:opacity-50`}
          >
            <RotateCcw className="w-3 h-3" />
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
}

export default IntroOfferDetail;
