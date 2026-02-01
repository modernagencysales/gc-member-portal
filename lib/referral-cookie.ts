/**
 * Referral cookie utility for affiliate attribution.
 * Sets a first-touch cookie that persists for 30 days.
 */

const COOKIE_NAME = 'gtm_ref';
const COOKIE_DAYS = 30;

export function setReferralCookie(code: string): void {
  // First-touch: don't overwrite existing cookie
  if (getReferralCode()) return;

  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getReferralCode(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearReferralCookie(): void {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Get referral code from URL param or cookie.
 * URL param takes priority for the current session but doesn't overwrite cookie.
 */
export function getActiveReferralCode(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || getReferralCode();
}
