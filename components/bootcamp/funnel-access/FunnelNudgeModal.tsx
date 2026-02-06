import React, { useEffect, useState } from 'react';
import { AlertTriangle, Sparkles, Phone, X } from 'lucide-react';

interface FunnelNudgeModalProps {
  userEmail?: string;
  calcomUrl?: string;
  daysRemaining: number | null;
}

const SESSION_KEY = 'funnel_nudge_modal_shown';

const FunnelNudgeModal: React.FC<FunnelNudgeModalProps> = ({
  userEmail,
  calcomUrl,
  daysRemaining,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show once per session
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setIsOpen(true);
      sessionStorage.setItem(SESSION_KEY, '1');
    }
  }, []);

  if (!isOpen) return null;

  const blueprintUrl = userEmail
    ? `/blueprint?email=${encodeURIComponent(userEmail)}`
    : '/blueprint';
  const bookingUrl = calcomUrl || '#';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>

        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Time is running out!
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {daysRemaining !== null && daysRemaining > 0 ? (
                <>
                  You have{' '}
                  <strong>
                    {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                  </strong>{' '}
                  left on your access. Don't miss out on these two key actions:
                </>
              ) : (
                'Your access window is closing. Take these two key actions now:'
              )}
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={blueprintUrl}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              <Sparkles size={16} />
              Generate Your LinkedIn Blueprint
            </a>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              <Phone size={16} />
              Book a Strategy Call
            </a>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
};

export default FunnelNudgeModal;
