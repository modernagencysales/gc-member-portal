import React, { useEffect } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';

// ============================================
// Types
// ============================================

export interface IClosedBookingProps {
  eventUrl: string;
  leadEmail?: string;
  leadName?: string;
  leadPhone?: string;
  qualificationData?: Record<string, string>;
  mode: 'inline' | 'popup';
  utmParams?: Record<string, string>;
  qualified?: boolean;
  disqualifiedRedirectUrl?: string;
  className?: string;
  ctaText?: string;
}

// ============================================
// Helpers
// ============================================

/** Extract UTM params from the current page URL */
function getPageUtmParams(): Record<string, string> {
  const params: Record<string, string> = {};
  if (typeof window === 'undefined') return params;

  const searchParams = new URLSearchParams(window.location.search);
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('utm_')) {
      params[key] = value;
    }
  }
  return params;
}

/**
 * Build the full iClosed booking URL with pre-filled data.
 * Supports: iclosedName, iclosedEmail, iclosedPhone, custom qualificationData, UTM params.
 */
function buildIClosedUrl(
  eventUrl: string,
  options?: {
    leadEmail?: string;
    leadName?: string;
    leadPhone?: string;
    qualificationData?: Record<string, string>;
    utmParams?: Record<string, string>;
  }
): string {
  if (!eventUrl) return '';

  // Parse existing URL to preserve any existing params
  const url = new URL(eventUrl, 'https://app.iclosed.io');
  const params = url.searchParams;

  // Pre-fill lead info
  if (options?.leadName) params.set('iclosedName', options.leadName);
  if (options?.leadEmail) params.set('iclosedEmail', options.leadEmail);
  if (options?.leadPhone) params.set('iclosedPhone', options.leadPhone);

  // Add qualification data as custom identifiers
  if (options?.qualificationData) {
    for (const [key, value] of Object.entries(options.qualificationData)) {
      if (value) params.set(key, value);
    }
  }

  // Merge UTM params: explicit utmParams override page-level UTMs
  const pageUtms = getPageUtmParams();
  const mergedUtms = { ...pageUtms, ...(options?.utmParams || {}) };
  for (const [key, value] of Object.entries(mergedUtms)) {
    if (value) params.set(key, value);
  }

  return url.toString();
}

/** Load the iClosed widget script once */
function useIClosedWidgetScript() {
  useEffect(() => {
    const SCRIPT_ID = 'iclosed-widget-script';
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://app.iclosed.io/assets/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // No cleanup — the widget script should persist for the page lifetime
  }, []);
}

// ============================================
// IClosedBooking Component
// ============================================

const IClosedBooking: React.FC<IClosedBookingProps> = ({
  eventUrl,
  leadEmail,
  leadName,
  leadPhone,
  qualificationData,
  mode,
  utmParams,
  qualified = true,
  disqualifiedRedirectUrl,
  className = '',
  ctaText,
}) => {
  useIClosedWidgetScript();

  // If disqualified and a redirect URL is provided, show resource link instead
  if (qualified === false && disqualifiedRedirectUrl) {
    return (
      <div className={`text-center ${className}`}>
        <a
          href={disqualifiedRedirectUrl}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Free Resources
        </a>
      </div>
    );
  }

  // Don't render if no event URL
  if (!eventUrl) return null;

  const fullUrl = buildIClosedUrl(eventUrl, {
    leadEmail,
    leadName,
    leadPhone,
    qualificationData,
    utmParams,
  });

  // Popup mode: render a button that triggers the iClosed popup widget
  if (mode === 'popup') {
    return (
      <div className={className}>
        <a
          href={fullUrl}
          data-iclosed-link={fullUrl}
          data-embed-type="popup"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold bg-violet-500 hover:bg-violet-600 text-white transition-colors shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 cursor-pointer"
        >
          <Calendar className="w-5 h-5" />
          {ctaText || 'Book Your Strategy Call'}
        </a>
      </div>
    );
  }

  // Inline mode: render an iframe embedding the booking page
  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none overflow-hidden ${className}`}
      style={{ scrollMarginTop: '16px' }}
    >
      <div className="relative w-full" style={{ minHeight: '700px' }}>
        <iframe
          src={fullUrl}
          title="Book a call"
          className="w-full h-full absolute inset-0 border-0"
          style={{ minHeight: '700px' }}
          allow="payment"
        />
      </div>
    </div>
  );
};

export default IClosedBooking;
