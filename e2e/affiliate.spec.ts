import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Affiliate Application Flow
// ---------------------------------------------------------------------------

test.describe('Affiliate Application', () => {
  test('can view the application page', async ({ page }) => {
    await page.goto('/affiliate/apply');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading')).toContainText(/affiliate/i);
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('can fill out and submit application form', async ({ page }) => {
    await page.goto('/affiliate/apply');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/name/i).fill('Test Affiliate');
    await page.getByLabel(/email/i).fill('test-e2e@example.com');
    await page.getByLabel(/company/i).fill('Test Corp');

    // Fill optional bio/notes field if present
    const bioField = page.getByLabel(/bio|notes|about|message/i);
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

    // Submit without filling anything
    await page.getByRole('button', { name: /submit|apply/i }).click();

    // Should show validation errors, required field indicators, or native validation
    // Check for either custom error messages or HTML5 validation via :invalid pseudo-class
    const hasCustomErrors = await page.getByText(/required|please|invalid|enter/i).count();
    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);

    if (hasCustomErrors > 0) {
      // Custom validation messages are visible
      await expect(page.getByText(/required|please|invalid|enter/i).first()).toBeVisible();
    } else {
      // Fallback: at least one required field should still be empty / form should not navigate away
      await expect(nameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
      // URL should still be the apply page (form did not submit)
      expect(page.url()).toContain('/affiliate/apply');
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

    // Should show error/not-found state, a redirect, or a fallback message
    const notFoundText = page.getByText(/not found|invalid|expired|error|no affiliate/i);
    const hasNotFound = (await notFoundText.count()) > 0;
    const redirectedAway = !page.url().includes('/refer/nonexistent-slug-12345');

    expect(hasNotFound || redirectedAway).toBeTruthy();
  });

  test('referral landing page loads', async ({ page }) => {
    const response = await page.goto('/refer/test');
    await page.waitForLoadState('networkidle');

    // Page should load without crashing (2xx or 3xx)
    expect(response?.status()).toBeLessThan(500);

    // The root React container should render
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

    // Should show login form, a redirect to login, or an email input for auth
    const emailInput = page.getByLabel(/email/i);
    const loginRedirected = page.url().includes('/login') || page.url().includes('/sign-in');

    if (loginRedirected) {
      expect(page.url()).toMatch(/login|sign-in/i);
    } else {
      await expect(emailInput).toBeVisible({ timeout: 10_000 });
    }
  });

  test('affiliate login form is accessible', async ({ page }) => {
    await page.goto('/affiliate/dashboard');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible({ timeout: 10_000 });

    const loginButton = page.getByRole('button', { name: /log in|sign in|continue/i });
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
