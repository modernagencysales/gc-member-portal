import React from 'react';
import { AlertTriangle, Sparkles, Phone } from 'lucide-react';

interface FunnelNudgeUrgentProps {
  userEmail?: string;
  calcomUrl?: string;
  daysRemaining: number | null;
}

const FunnelNudgeUrgent: React.FC<FunnelNudgeUrgentProps> = ({
  userEmail,
  calcomUrl,
  daysRemaining,
}) => {
  const blueprintUrl = userEmail
    ? `/blueprint?email=${encodeURIComponent(userEmail)}`
    : '/blueprint';
  const bookingUrl = calcomUrl || '#';

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg mb-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800">
      <div className="flex items-center gap-3">
        <div className="relative">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          {daysRemaining !== null && daysRemaining > 0 ? (
            <>
              Only{' '}
              <strong>
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
              </strong>{' '}
              left! Act now before you lose access.
            </>
          ) : (
            'Your access is about to expire! Take action now.'
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={blueprintUrl}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        >
          <Sparkles size={12} />
          Get Blueprint
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <Phone size={12} />
          Book Call
        </a>
      </div>
    </div>
  );
};

export default FunnelNudgeUrgent;
