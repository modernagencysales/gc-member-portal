import React, { forwardRef } from 'react';

// ============================================
// Types
// ============================================

interface CalEmbedProps {
  calLink: string; // e.g., "timkeen/30min"
  className?: string;
}

// ============================================
// CalEmbed Component
// ============================================

/**
 * Cal.com inline embed component
 * Uses iframe to embed the Cal.com booking page
 * Accepts a ref for IntersectionObserver (used by StickyCTA)
 */
const CalEmbed = forwardRef<HTMLDivElement, CalEmbedProps>(({ calLink, className = '' }, ref) => {
  // Construct the Cal.com embed URL
  // Format: https://cal.com/{calLink}?embed=true&theme=dark
  const isDark =
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const redirectUrl = `${window.location.origin}/blueprint/call-booked`;
  const calUrl = `https://cal.com/${calLink}?embed=true&theme=${isDark ? 'dark' : 'light'}&layout=month_view&redirectUrl=${encodeURIComponent(redirectUrl)}`;

  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none overflow-hidden ${className}`}
      data-section="CalEmbed"
    >
      {/* Section Header */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Book Your Strategy Call
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-sm">
          Select a time that works best for you to discuss your LinkedIn growth strategy.
        </p>
      </div>

      {/* Cal.com Iframe */}
      <div className="relative w-full" style={{ minHeight: '600px' }}>
        <iframe
          src={calUrl}
          title="Book a call"
          className="w-full h-full absolute inset-0 border-0"
          style={{ minHeight: '600px' }}
          allow="payment"
          loading="lazy"
        />
      </div>
    </div>
  );
});

CalEmbed.displayName = 'CalEmbed';

export default CalEmbed;
