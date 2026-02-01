import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Affiliate Application Flow
// ---------------------------------------------------------------------------

test.describe('Affiliate Application', () => {
  test('can view the application page', async ({ page }) => {
    await page.goto('/affiliate/apply');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading')).toContainText(/affiliate/i);
    await expect(page.getByPlaceholder('John Smith')).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com').first()).toBeVisible();
  });

  test('can fill out and submit application form', async ({ page }) => {
    await page.goto('/affiliate/apply');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('John Smith').fill('Test Affiliate');
    await page.getByPlaceholder('you@company.com').first().fill('test-e2e@example.com');
    await page.getByPlaceholder('Acme Inc.').fill('Test Corp');

    // Fill optional bio field if present
    const bioField = page.getByPlaceholder(/brief intro|about/i);
    if ((await bioField.count()) > 0) {
      await bioField.first().fill('I have a large audience interested in growth tools.');
    }

    // Submit the form
    await page.getByRole('button', { name: /submit|apply/i }).click();
    await page.waitForLoadState('networkidle');

    // Expect a success state (confirmation message, redirect, or thank-you text)
    const successIndicator = page.getByText(/thank|success|submitted|received|confirm/i);
    await expect(successIndicator.first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows validation on empty submit', async ({ page }) => {
    await page.goto('/affiliate/apply');
    await page.waitForLoadState('networkidle');

    // The submit button should be disabled when form is empty
    const submitBtn = page.getByRole('button', { name: /submit|apply/i });
    const isDisabled = await submitBtn.isDisabled();

    if (isDisabled) {
      // Button is disabled — validation prevents submission
      expect(isDisabled).toBeTruthy();
    } else {
      // Click submit and check for validation errors
      await submitBtn.click();
      const hasCustomErrors = await page.getByText(/required|please|invalid|enter/i).count();
      if (hasCustomErrors > 0) {
        await expect(page.getByText(/required|please|invalid|enter/i).first()).toBeVisible();
      } else {
        // Form did not navigate away
        expect(page.url()).toContain('/affiliate/apply');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Referral Landing Page
// ---------------------------------------------------------------------------

test.describe('Referral Landing Page', () => {
  test('shows not found for invalid slug', async ({ page }) => {
    await page.goto('/refer/nonexistent-slug-12345');
    await page.waitForLoadState('networkidle');

    const notFoundText = page.getByText(/not found|invalid|expired|error|no affiliate/i);
    const hasNotFound = (await notFoundText.count()) > 0;
    const redirectedAway = !page.url().includes('/refer/nonexistent-slug-12345');

    expect(hasNotFound || redirectedAway).toBeTruthy();
  });

  test('referral landing page loads', async ({ page }) => {
    const response = await page.goto('/refer/test');
    await page.waitForLoadState('networkidle');

    expect(response?.status()).toBeLessThan(500);
    await page.waitForSelector('#root:not(:empty)', { timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Affiliate Dashboard (unauthenticated)
// ---------------------------------------------------------------------------

test.describe('Affiliate Dashboard - Auth', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/affiliate/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show affiliate login form with email placeholder
    const emailInput = page.getByPlaceholder(/you@company\.com|email/i);
    const loginRedirected = page.url().includes('/login') || page.url().includes('/sign-in');

    if (loginRedirected) {
      expect(page.url()).toMatch(/login|sign-in/i);
    } else {
      await expect(emailInput.first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('affiliate login form is accessible', async ({ page }) => {
    await page.goto('/affiliate/dashboard');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByPlaceholder(/you@company\.com|email/i);
    await expect(emailInput.first()).toBeVisible({ timeout: 10_000 });

    const loginButton = page.getByRole('button', { name: /sign in|log in|continue/i });
    await expect(loginButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Affiliate Routes (navigation structure / smoke tests)
// ---------------------------------------------------------------------------

test.describe('Affiliate Routes', () => {
  test('affiliate apply route exists', async ({ page }) => {
    const response = await page.goto('/affiliate/apply');
    expect(response?.status()).toBe(200);
  });

  test('affiliate onboard route exists', async ({ page }) => {
    const response = await page.goto('/affiliate/onboard');
    expect(response?.status()).toBe(200);
  });

  test('affiliate dashboard route exists', async ({ page }) => {
    const response = await page.goto('/affiliate/dashboard');
    expect(response?.status()).toBe(200);
  });

  test('affiliate referrals route exists', async ({ page }) => {
    const response = await page.goto('/affiliate/dashboard/referrals');
    expect(response?.status()).toBe(200);
  });

  test('affiliate payouts route exists', async ({ page }) => {
    const response = await page.goto('/affiliate/dashboard/payouts');
    expect(response?.status()).toBe(200);
  });

  test('affiliate assets route exists', async ({ page }) => {
    const response = await page.goto('/affiliate/dashboard/assets');
    expect(response?.status()).toBe(200);
  });

  test('affiliate settings route exists', async ({ page }) => {
    const response = await page.goto('/affiliate/dashboard/settings');
    expect(response?.status()).toBe(200);
  });
});
