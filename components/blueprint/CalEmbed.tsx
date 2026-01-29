import React, { forwardRef, useEffect } from 'react';

// ============================================
// Types
// ============================================

interface CalEmbedProps {
  calLink: string; // e.g., "vlad-timinski-pqqica/30min"
  className?: string;
}

// ============================================
// CalEmbed Component
// ============================================

/**
 * Cal.com inline embed via iframe.
 * Listens for postMessage from the Cal.com iframe to detect booking
 * completion and redirect to the call-booked thank-you page.
 */
const CalEmbed = forwardRef<HTMLDivElement, CalEmbedProps>(({ calLink, className = '' }, ref) => {
  const isDark =
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const calUrl = `https://cal.com/${calLink}?embed=true&theme=${isDark ? 'dark' : 'light'}&layout=month_view`;
  const redirectUrl = `${window.location.origin}/blueprint/call-booked`;

  useEffect(() => {
    const handleMessage = (event: { origin: string; data: unknown }) => {
      // Cal.com embeds post messages from these origins
      if (!event.origin.includes('cal.com') && !event.origin.includes('app.cal.com')) {
        return;
      }

      try {
        const raw = event.data;
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

        // Cal.com uses different event formats — check for all known booking signals
        if (
          data?.action === 'bookingSuccessful' ||
          data?.type === 'booking_successful' ||
          data?.data?.type === 'booking_successful' ||
          (data?.type === '__routeChanged' &&
            typeof data?.data === 'string' &&
            data.data.includes('booking'))
        ) {
          window.location.href = redirectUrl;
        }
      } catch {
        // Not a message we care about
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [redirectUrl]);

  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none overflow-hidden ${className}`}
      data-section="CalEmbed"
      style={{ scrollMarginTop: '16px' }}
    >
      <div className="relative w-full" style={{ minHeight: '650px' }}>
        <iframe
          src={calUrl}
          title="Book a call"
          className="w-full h-full absolute inset-0 border-0"
          style={{ minHeight: '650px' }}
          allow="payment"
        />
      </div>
    </div>
  );
});

CalEmbed.displayName = 'CalEmbed';

export default CalEmbed;
