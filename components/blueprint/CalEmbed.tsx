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
 * Cal.com inline embed component using the official Cal.com embed script.
 * Runs in the parent page context so redirectUrl works after booking.
 * Accepts a ref for IntersectionObserver (used by StickyCTA).
 */
const CalEmbed = forwardRef<HTMLDivElement, CalEmbedProps>(({ calLink, className = '' }, ref) => {
  const embedContainerId = 'cal-embed-container';
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const isDark = document.documentElement.classList.contains('dark');
    const redirectUrl = `${window.location.origin}/blueprint/call-booked`;

    // Load Cal.com embed script
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    script.onload = () => {
      const Cal = (window as unknown as Record<string, unknown>).Cal as (
        action: string,
        ...args: unknown[]
      ) => void;

      if (!Cal) return;

      Cal('init');
      Cal('inline', {
        elementOrSelector: `#${embedContainerId}`,
        calLink,
        layout: 'month_view',
        config: {
          theme: isDark ? 'dark' : 'light',
          redirectUrl,
        },
      });

      Cal('ui', {
        theme: isDark ? 'dark' : 'light',
        styles: { branding: { brandColor: '#8b5cf6' } },
        hideEventTypeDetails: false,
      });
    };
    document.head.appendChild(script);
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
