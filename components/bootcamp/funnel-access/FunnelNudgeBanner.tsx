import React, { useState } from 'react';
import { Clock, Sparkles, Phone, X } from 'lucide-react';

interface FunnelNudgeBannerProps {
  userEmail?: string;
  calcomUrl?: string;
  daysRemaining: number | null;
}

const FunnelNudgeBanner: React.FC<FunnelNudgeBannerProps> = ({
  userEmail,
  calcomUrl,
  daysRemaining,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const blueprintUrl = userEmail
    ? `/blueprint?email=${encodeURIComponent(userEmail)}`
    : '/blueprint';
  const bookingUrl = calcomUrl || '#';

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {daysRemaining !== null ? (
            <>
              Your access expires in{' '}
              <strong>
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
              </strong>
              .
            </>
          ) : (
            'Your access is time-limited.'
          )}{' '}
          Make the most of it!
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={blueprintUrl}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        >
          <Sparkles size={12} />
          Blueprint
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
        >
          <Phone size={12} />
          Book Call
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors"
        >
          <X className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </button>
      </div>
    </div>
  );
};

export default FunnelNudgeBanner;
