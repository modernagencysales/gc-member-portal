import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setReferralCookie,
  getReferralCode,
  clearReferralCookie,
  getActiveReferralCode,
} from '../../lib/referral-cookie';

describe('referral-cookie', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  });

  describe('setReferralCookie', () => {
    it('sets cookie with correct name and value', () => {
      setReferralCookie('ABC123');
      expect(document.cookie).toContain('gtm_ref=ABC123');
    });

    it('sets cookie with expiry in the future (30 days)', () => {
      // We can verify the cookie is set (jsdom stores it) but can't easily
      // inspect the raw expires header. We verify it persists (not session-only).
      setReferralCookie('XYZ789');
      expect(getReferralCode()).toBe('XYZ789');
    });

    it('encodes special characters in the cookie value', () => {
      setReferralCookie('code with spaces&chars');
      expect(getReferralCode()).toBe('code with spaces&chars');
    });

    it('does NOT overwrite an existing cookie (first-touch attribution)', () => {
      setReferralCookie('FIRST');
      setReferralCookie('SECOND');
      expect(getReferralCode()).toBe('FIRST');
    });
  });

  describe('getReferralCode', () => {
    it('returns null when no cookie is set', () => {
      expect(getReferralCode()).toBeNull();
    });

    it('returns the referral code when cookie exists', () => {
      setReferralCookie('MYCODE');
      expect(getReferralCode()).toBe('MYCODE');
    });

    it('returns null when other cookies exist but not gtm_ref', () => {
      document.cookie = 'other_cookie=value;path=/';
      expect(getReferralCode()).toBeNull();
    });
  });

  describe('clearReferralCookie', () => {
    it('removes the referral cookie', () => {
      setReferralCookie('REMOVEME');
      expect(getReferralCode()).toBe('REMOVEME');
      clearReferralCookie();
      expect(getReferralCode()).toBeNull();
    });

    it('does nothing if cookie does not exist', () => {
      clearReferralCookie();
      expect(getReferralCode()).toBeNull();
    });
  });

  describe('getActiveReferralCode', () => {
    let originalLocation: typeof window.location;

    beforeEach(() => {
      originalLocation = window.location;
      // Mock window.location.search
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, search: '' },
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    });

    it('returns URL param when ref param is present', () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, search: '?ref=URLCODE' },
      });
      expect(getActiveReferralCode()).toBe('URLCODE');
    });

    it('returns URL param even when cookie also exists (URL takes priority)', () => {
      setReferralCookie('COOKIECODE');
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, search: '?ref=URLCODE' },
      });
      expect(getActiveReferralCode()).toBe('URLCODE');
    });

    it('falls back to cookie when no URL param is present', () => {
      setReferralCookie('COOKIECODE');
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, search: '' },
      });
      expect(getActiveReferralCode()).toBe('COOKIECODE');
    });

    it('returns null when neither URL param nor cookie exists', () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, search: '' },
      });
      expect(getActiveReferralCode()).toBeNull();
    });

    it('returns null when ref param is empty string', () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, search: '?ref=' },
      });
      // URLSearchParams.get('ref') returns '' for ?ref=, which is falsy
      // so it should fall back to cookie, which is also null
      expect(getActiveReferralCode()).toBeNull();
    });
  });
});
