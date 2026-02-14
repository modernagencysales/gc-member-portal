import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Package, ExternalLink } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { queryKeys } from '../../../lib/queryClient';
import { fetchIntroOfferById, fetchDeliverables } from '../../../services/intro-offer-supabase';
import type { DisplayStatus } from '../../../types/intro-offer-types';
import DeliverableCard from './DeliverableCard';

function toDisplayStatus(status: string): DisplayStatus {
  if (status === 'delivered') return 'delivered';
  if (['completed', 'review', 'in_progress'].includes(status)) return 'in_progress';
  return 'pending';
}

const OfferProgressTracker: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const { isDarkMode } = useTheme();

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

  if (offerLoading || delsLoading) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading your package...
          </p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}
      >
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Offer not found
        </p>
      </div>
    );
  }

  const isHandedOff = offer.status === 'handed_off';

  if (isHandedOff) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="max-w-lg mx-auto p-6 pt-16">
          <div className="flex items-center gap-3 mb-6">
            <Package
              className={`w-7 h-7 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
            />
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Your GTM Tools
            </h2>
          </div>
          <p className={`mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Your launch package is complete! Access your tools below.
          </p>
          <div className="space-y-3">
            <a
              href="https://app.magnetlab.ai"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                isDarkMode
                  ? 'bg-blue-900/20 border-blue-800 hover:bg-blue-900/30 text-blue-300'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800'
              }`}
            >
              <span className="font-medium">
                Magnetlab Dashboard — Posts, Lead Magnets, Funnels
              </span>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>
            <a
              href="https://app.heyreach.io"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                isDarkMode
                  ? 'bg-green-900/20 border-green-800 hover:bg-green-900/30 text-green-300'
                  : 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800'
              }`}
            >
              <span className="font-medium">HeyReach Dashboard — Prospect Lists, Campaigns</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const deliveredCount = (deliverables || []).filter((d) => d.status === 'delivered').length;
  const totalCount = (deliverables || []).length;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="max-w-lg mx-auto p-6 pt-16">
        <div className="flex items-center gap-3 mb-2">
          <Package className={`w-7 h-7 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Your GTM Launch Package
          </h2>
        </div>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Purchased {new Date(offer.createdAt).toLocaleDateString()} · {deliveredCount}/{totalCount}{' '}
          ready
        </p>

        {offer.status === 'interview_pending' && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              isDarkMode
                ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}
          >
            <p className="text-sm font-medium">
              We need to schedule your onboarding interview to customize your deliverables. Check
              your email for scheduling details.
            </p>
          </div>
        )}

        <div
          className={`rounded-xl border p-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {(deliverables || []).map((d) => (
            <DeliverableCard
              key={d.id}
              title={d.title}
              status={toDisplayStatus(d.status)}
              type={d.type}
              metadata={d.metadata}
              deliveredAt={d.deliveredAt}
            />
          ))}
          {(!deliverables || deliverables.length === 0) && (
            <p
              className={`text-sm py-4 text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
            >
              Deliverables are being prepared...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferProgressTracker;
