/** Structured logging. Logs to console and captures to Sentry in production.
 *  Never import console.log/error/warn directly — use these functions instead. */
import * as Sentry from '@sentry/react';

/**
 * Log an error with structured context. Captures to Sentry in production.
 * Use for actual errors (failed DB calls, unexpected states, caught exceptions).
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  console.error(`[${context}]`, error, metadata ?? '');

  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      scope.setTag('context', context);
      if (metadata) scope.setExtras(metadata);
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    });
  }
}

/**
 * Log a warning with structured context. Captures to Sentry as message in production.
 * Use for non-critical issues (missing optional data, fallback paths, deprecation notices).
 */
export function logWarn(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  console.warn(`[${context}]`, message, metadata ?? '');

  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      scope.setTag('context', context);
      scope.setLevel('warning');
      if (metadata) scope.setExtras(metadata);
      Sentry.captureMessage(`[${context}] ${message}`);
    });
  }
}
