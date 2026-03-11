import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Sentry before importing logError
vi.mock('@sentry/react', () => ({
  withScope: vi.fn((cb) =>
    cb({
      setTag: vi.fn(),
      setExtras: vi.fn(),
      setLevel: vi.fn(),
    })
  ),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { logError, logWarn } from '../../lib/logError';
import * as Sentry from '@sentry/react';

describe('logError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('logs to console.error with context prefix', () => {
    const error = new Error('test error');
    logError('test-context', error);
    expect(console.error).toHaveBeenCalledWith('[test-context]', error, '');
  });

  it('logs to console.error with metadata', () => {
    const error = new Error('test error');
    const meta = { userId: '123', action: 'save' };
    logError('test-context', error, meta);
    expect(console.error).toHaveBeenCalledWith('[test-context]', error, meta);
  });

  it('captures to Sentry in production', () => {
    vi.stubEnv('PROD', 'true');

    const error = new Error('sentry test');
    logError('sentry-context', error, { key: 'val' });

    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error);

    vi.unstubAllEnvs();
  });

  it('wraps non-Error values in Error for Sentry', () => {
    vi.stubEnv('PROD', 'true');

    logError('string-error', 'just a string');

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'just a string' })
    );

    vi.unstubAllEnvs();
  });

  it('does not capture to Sentry in development', () => {
    logError('dev-context', new Error('dev error'));
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});

describe('logWarn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('logs to console.warn with context prefix', () => {
    logWarn('warn-context', 'something happened');
    expect(console.warn).toHaveBeenCalledWith('[warn-context]', 'something happened', '');
  });

  it('logs to console.warn with metadata', () => {
    logWarn('warn-context', 'msg', { detail: 'info' });
    expect(console.warn).toHaveBeenCalledWith('[warn-context]', 'msg', { detail: 'info' });
  });

  it('logs to console.warn without metadata', () => {
    logWarn('warn-context', 'no meta');
    expect(console.warn).toHaveBeenCalledWith('[warn-context]', 'no meta', '');
  });

  it('captures to Sentry as message (not exception) in production', () => {
    vi.stubEnv('PROD', 'true');

    logWarn('warn-sentry', 'warning message');

    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalledWith('[warn-sentry] warning message');
    expect(Sentry.captureException).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it('does not capture to Sentry in development', () => {
    logWarn('dev-warn', 'dev warning');
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
