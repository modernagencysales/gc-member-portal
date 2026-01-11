import * as Sentry from '@sentry/react';

export function initSentry() {
  // Only initialize in production or if SENTRY_DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session replay (optional - useful for debugging)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out known non-critical errors
    ignoreErrors: [
      // Browser extensions
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      // Network errors that are usually user-side
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // Cancelled requests
      'AbortError',
    ],

    // Add context to errors
    beforeSend(event) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        console.error('Sentry event (not sent in dev):', event);
        return null;
      }
      return event;
    },
  });
}

// Helper to set user context after login
export function setSentryUser(user: { id: string; email: string; name?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
}

// Helper to add breadcrumbs for debugging
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
