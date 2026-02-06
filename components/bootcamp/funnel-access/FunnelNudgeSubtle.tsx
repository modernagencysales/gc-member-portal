import React from 'react';
import { Sparkles, Phone } from 'lucide-react';

interface FunnelNudgeSubtleProps {
  userEmail?: string;
  calcomUrl?: string;
  daysRemaining: number | null;
}

const FunnelNudgeSubtle: React.FC<FunnelNudgeSubtleProps> = ({
  userEmail,
  calcomUrl,
  daysRemaining,
}) => {
  const blueprintUrl = userEmail
    ? `/blueprint?email=${encodeURIComponent(userEmail)}`
    : '/blueprint';
  const bookingUrl = calcomUrl || '#';

  return (
    <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800 space-y-2">
      <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
        Unlock your full potential
      </p>
      {daysRemaining !== null && (
        <p className="text-[10px] text-violet-500 dark:text-violet-400">
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
        </p>
      )}
      <div className="space-y-1.5">
        <a
          href={blueprintUrl}
          className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/60 transition-colors"
        >
          <Sparkles size={12} />
          Get your Blueprint
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/60 transition-colors"
        >
          <Phone size={12} />
          Book a call
        </a>
      </div>
    </div>
  );
};

export default FunnelNudgeSubtle;
