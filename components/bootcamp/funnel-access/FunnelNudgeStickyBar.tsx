import React from 'react';
import { Sparkles, Phone, Clock } from 'lucide-react';

interface FunnelNudgeStickyBarProps {
  userEmail?: string;
  calcomUrl?: string;
  daysRemaining: number | null;
  isUrgent: boolean;
}

const FunnelNudgeStickyBar: React.FC<FunnelNudgeStickyBarProps> = ({
  userEmail,
  calcomUrl,
  daysRemaining,
  isUrgent,
}) => {
  const blueprintUrl = userEmail
    ? `/blueprint?email=${encodeURIComponent(userEmail)}`
    : '/blueprint';
  const bookingUrl = calcomUrl || '#';

  const bgClass = isUrgent ? 'bg-red-600 dark:bg-red-700' : 'bg-zinc-800 dark:bg-zinc-700';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 ${bgClass} text-white py-2.5 px-4 flex items-center justify-between shadow-lg`}
    >
      <div className="flex items-center gap-2 text-sm">
        <Clock size={14} />
        {daysRemaining !== null ? (
          <span>
            <strong>{daysRemaining}</strong> day{daysRemaining !== 1 ? 's' : ''} remaining
          </span>
        ) : (
          <span>Time-limited access</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <a
          href={blueprintUrl}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 hover:bg-white/30 transition-colors"
        >
          <Sparkles size={12} />
          Get Blueprint
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <Phone size={12} />
          Book a Call
        </a>
      </div>
    </div>
  );
};

export default FunnelNudgeStickyBar;
