import React, { forwardRef, useEffect, useRef } from 'react';

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
 * Cal.com inline embed using the official embed loader.
 * The loader bootstraps the Cal namespace, then we call Cal('inline')
 * to render the booking widget in the parent page context so redirectUrl works.
 */
const CalEmbed = forwardRef<HTMLDivElement, CalEmbedProps>(({ calLink, className = '' }, ref) => {
  const embedContainerId = 'cal-embed-container';
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const isDark = document.documentElement.classList.contains('dark');
    const redirectUrl = `${window.location.origin}/blueprint/call-booked`;

    // Cal.com embed loader IIFE — bootstraps the Cal namespace before embed.js loads
    (function (C: string, A: string, _L: string) {
      const p = function (a: unknown, ar?: unknown) {
        (p as unknown as { q: unknown[] }).q.push([a, ar]);
      };
      (p as unknown as { q: unknown[] }).q = [];
      const d = document;
      (window as unknown as Record<string, unknown>)[C] = p;
      const s = d.createElement('script');
      s.src = A;
      s.async = true;
      d.head.appendChild(s);
    })('Cal', 'https://app.cal.com/embed/embed.js', 'init');

    // Wait for embed.js to load and process the queue
    const interval = setInterval(() => {
      const Cal = (window as unknown as Record<string, unknown>).Cal as
        | ((action: string, ...args: unknown[]) => void)
        | undefined;

      if (Cal && typeof Cal === 'function' && (Cal as unknown as { loaded?: boolean }).loaded) {
        clearInterval(interval);

        Cal('init', { origin: 'https://cal.com' });

        Cal('inline', {
          elementOrSelector: `#${embedContainerId}`,
          calLink,
          layout: 'month_view',
          config: {
            theme: isDark ? 'dark' : 'light',
          },
        });

        Cal('ui', {
          theme: isDark ? 'dark' : 'light',
          styles: { branding: { brandColor: '#8b5cf6' } },
          hideEventTypeDetails: false,
        });
      }
    }, 100);

    // Redirect on booking complete via postMessage from Cal embed
    const handleMessage = (event: { origin: string; data: unknown }) => {
      if (event.origin !== 'https://app.cal.com') return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.action === 'bookingSuccessful' || data?.type === 'booking_successful') {
          window.location.href = redirectUrl;
        }
      } catch {
        // Not a JSON message we care about
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, [calLink]);

  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none overflow-hidden ${className}`}
      data-section="CalEmbed"
      style={{ scrollMarginTop: '16px' }}
    >
      <div id={embedContainerId} style={{ width: '100%', minHeight: '650px', overflow: 'auto' }} />
    </div>
  );
});

CalEmbed.displayName = 'CalEmbed';

export default CalEmbed;
