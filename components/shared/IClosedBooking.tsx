import React, { useEffect, useRef } from 'react';
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
 * Map prospect data to iClosed custom field identifiers.
 * Identifiers: monthlyrevenue, businesstype (configured in iClosed event settings).
 * Values must match iClosed dropdown options exactly.
 */
export function mapQualificationData(prospect: {
  monthlyIncome?: string;
  businessType?: string;
}): Record<string, string> {
  const data: Record<string, string> = {};

  // Monthly revenue: map our form values to iClosed options
  // iClosed options: Under $10k, $10k-$20k, $20k-$50k, $50k-$100k, $100k+
  if (prospect.monthlyIncome) {
    const revenueMap: Record<string, string> = {
      'Not generating revenue yet': 'Under $10k',
      'Under $5k': 'Under $10k',
      '$5k-$10k': 'Under $10k',
      '$10k-$30k': '$10k-$20k',
      '$30k-$50k': '$20k-$50k',
      '$30k-$100k': '$50k-$100k',
      '$50k-$100k': '$50k-$100k',
      '$100k+': '$100k+',
    };
    const mapped = revenueMap[prospect.monthlyIncome];
    if (mapped) data.monthlyrevenue = mapped;
  }

  // Business type: map our form values to iClosed options
  // iClosed options: Agency, Consultancy, SaaS, Coaching, Other
  if (prospect.businessType) {
    const typeMap: Record<string, string> = {
      Agency: 'Agency',
      'Done for you agency': 'Agency',
      Consulting: 'Consultancy',
      'Consulting or coaching': 'Consultancy',
      Coaching: 'Coaching',
      SaaS: 'SaaS',
      'SaaS or productised service': 'SaaS',
      Freelance: 'Other',
      'Freelancer or solo service': 'Other',
      'Service Provider': 'Other',
      Other: 'Other',
      'Other B2B offer': 'Other',
    };
    const mapped = typeMap[prospect.businessType];
    if (mapped) data.businesstype = mapped;
  }

  return data;
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

/**
 * Load the iClosed widget script once.
 * If a LIFT widget is already loaded (with data-cta-widget), skip — it handles both LIFT and inline/popup.
 */
function useIClosedWidgetScript() {
  useEffect(() => {
    // Skip if any iClosed widget script is already loaded (either inline or LIFT)
    if (
      document.getElementById('iclosed-widget-script') ||
      document.getElementById('iclosed-lift-widget')
    )
      return;

    const script = document.createElement('script');
    script.id = 'iclosed-widget-script';
    script.src = 'https://app.iclosed.io/assets/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);
}

/**
 * Load the iClosed LIFT floating CTA widget.
 * Loads widget.js with data-cta-widget attribute — handles both LIFT floating button AND inline/popup embeds.
 * Cleans up on unmount so the floating button only appears on pages that use this hook.
 *
 * When leadData is provided, a MutationObserver injects pre-fill params (iclosedName, iclosedEmail,
 * iclosedPhone) into any iClosed popup iframes the LIFT widget creates. If all three are present,
 * iClosed skips its qualifying questions entirely.
 */
export function useIClosedLiftWidget(
  widgetId = 'WB1jQQR2OgMi',
  leadData?: {
    name?: string;
    email?: string;
    phone?: string;
    qualificationData?: Record<string, string>;
  },
  enabled = true
) {
  const leadRef = useRef(leadData);
  leadRef.current = leadData;

  useEffect(() => {
    const LIFT_ID = 'iclosed-lift-widget';
    const WIDGET_ID = 'iclosed-widget-script';

    const cleanupDom = () => {
      const el = document.getElementById(LIFT_ID);
      if (el) el.remove();
      document
        .querySelectorAll(
          '[data-iclosed-lift], .iclosed-lift-widget, .iclosed-cta-widget, [class*="iclosed"]'
        )
        .forEach((node) => node.remove());
    };

    // When disabled, tear down any existing widget and bail out
    if (!enabled) {
      cleanupDom();
      return;
    }

    // Remove plain widget script if it was loaded first (no LIFT support)
    const existingPlain = document.getElementById(WIDGET_ID);
    if (existingPlain) existingPlain.remove();

    if (document.getElementById(LIFT_ID)) return;

    const script = document.createElement('script');
    script.id = LIFT_ID;
    script.src = 'https://app.iclosed.io/assets/widget.js';
    script.setAttribute('data-cta-widget', widgetId);
    script.async = true;
    document.body.appendChild(script);

    // MutationObserver: intercept iClosed popup iframes and inject lead pre-fill params
    const observer = new MutationObserver((mutations) => {
      const lead = leadRef.current;
      if (!lead?.name && !lead?.email && !lead?.phone) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          // Find iClosed iframes — either the node itself or descendants
          const iframes =
            node.tagName === 'IFRAME'
              ? [node as HTMLIFrameElement]
              : Array.from(node.querySelectorAll('iframe'));
          for (const iframe of iframes) {
            if (!iframe.src?.includes('iclosed.io/e/')) continue;
            // Already has pre-fill params — skip
            if (iframe.src.includes('iclosedName=') || iframe.src.includes('iclosedEmail='))
              continue;
            const url = new URL(iframe.src);
            if (lead.name) url.searchParams.set('iclosedName', lead.name);
            if (lead.email) url.searchParams.set('iclosedEmail', lead.email);
            if (lead.phone) url.searchParams.set('iclosedPhone', lead.phone);
            if (lead.qualificationData) {
              for (const [key, value] of Object.entries(lead.qualificationData)) {
                if (value) url.searchParams.set(key, value);
              }
            }
            iframe.src = url.toString();
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanupDom();
    };
  }, [widgetId, enabled]);
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
    <div className={`overflow-hidden ${className}`} style={{ scrollMarginTop: '16px' }}>
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
