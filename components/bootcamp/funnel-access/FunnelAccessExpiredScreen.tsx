import React from 'react';
import { Lock, Sparkles, Phone, ArrowRight } from 'lucide-react';

interface FunnelAccessExpiredScreenProps {
  userEmail?: string;
  calcomUrl?: string;
  studentName?: string;
}

const FunnelAccessExpiredScreen: React.FC<FunnelAccessExpiredScreenProps> = ({
  userEmail,
  calcomUrl,
  studentName,
}) => {
  const blueprintUrl = userEmail
    ? `/blueprint?email=${encodeURIComponent(userEmail)}`
    : '/blueprint';
  const bookingUrl = calcomUrl || '#';
  const displayName = studentName || 'there';

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-lg text-center space-y-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
          <Lock className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Hey {displayName}, your access has expired
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            Your trial period has ended. Here's how to continue getting results with our tools:
          </p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          <a
            href={blueprintUrl}
            className="flex items-center justify-between w-full px-6 py-4 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-semibold">Get Your LinkedIn Blueprint</div>
                <div className="text-xs text-violet-200">Free personalized LinkedIn analysis</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </a>

          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-6 py-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-semibold">Book a Strategy Call</div>
                <div className="text-xs text-zinc-400 dark:text-zinc-600">
                  Talk to our team about full access
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Questions? Reach out to support@modernagencysales.com
        </p>
      </div>
    </div>
  );
};

export default FunnelAccessExpiredScreen;
