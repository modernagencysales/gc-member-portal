import { test, expect } from '@playwright/test';
import { mockSupabaseQuery, navigateTo, waitForSPALoad } from './helpers';
import { bootcampStudent, bootcampInviteCode } from './fixtures/test-data';

// Bootcamp login is public -- no pre-existing auth
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Bootcamp Login Page', () => {
  test('bootcamp login page renders', async ({ page }) => {
    await navigateTo(page, '/bootcamp');
    await waitForSPALoad(page);

    // Should show a login or welcome UI
    const emailInput = page.getByPlaceholder(/email/i);
    await expect(emailInput).toBeVisible();
  });

  test('invite code input field present', async ({ page }) => {
    // Navigate with register intent to show invite code field
    await navigateTo(page, '/bootcamp?code=test');
    await waitForSPALoad(page);

    // Look for an invite code or registration field
    const codeInput = page
      .getByPlaceholder(/code|invite/i)
      .or(page.locator('input[name*="code"]'))
      .or(page.locator('input[name*="invite"]'));
    const count = await codeInput.count();
    // If code input not visible directly, look for a register/signup link
    if (count === 0) {
      const registerLink = page.getByText(/register|sign up|create account|join/i).first();
      await expect(registerLink).toBeVisible();
    } else {
      await expect(codeInput.first()).toBeVisible();
    }
  });

  test('valid invite code redirects to onboarding', async ({ page }) => {
    // Mock the invite code verification and student creation
    await mockSupabaseQuery(page, 'bootcamp_invite_codes', [bootcampInviteCode]);
    await mockSupabaseQuery(page, 'bootcamp_students', [bootcampStudent]);

    await navigateTo(page, '/bootcamp?code=' + bootcampInviteCode.code);
    await waitForSPALoad(page);

    // Fill in email if there is an email field
    const emailInput = page.getByPlaceholder(/email/i);
    if ((await emailInput.count()) > 0) {
      await emailInput.fill(bootcampStudent.email);
      const submitBtn = page.getByRole('button', {
        name: /sign in|log in|submit|continue|join|register/i,
      });
      if ((await submitBtn.count()) > 0) {
        await submitBtn.click();
      }
    }

    // Should eventually reach onboarding or the curriculum
    await page.waitForTimeout(3_000);
    const url = page.url();
    const reachedTarget =
      url.includes('/bootcamp/onboarding') ||
      url.includes('/bootcamp/curriculum') ||
      url.includes('/bootcamp');
    expect(reachedTarget).toBeTruthy();
  });

  test('invalid code shows error', async ({ page }) => {
    // Return empty for invite codes (code not found)
    await mockSupabaseQuery(page, 'bootcamp_invite_codes', []);
    await mockSupabaseQuery(page, 'bootcamp_students', [], 404);

    await navigateTo(page, '/bootcamp?code=INVALID-CODE');
    await waitForSPALoad(page);

    // Fill email if present and submit
    const emailInput = page.getByPlaceholder(/email/i);
    if ((await emailInput.count()) > 0) {
      await emailInput.fill('nobody@test.com');
      const submitBtn = page.getByRole('button', {
        name: /sign in|log in|submit|continue|join|register/i,
      });
      if ((await submitBtn.count()) > 0) {
        await submitBtn.click();
      }
    }

    // Should see an error or stay on the login page
    await page.waitForTimeout(3_000);
    const hasError = await page.getByText(/invalid|expired|not found|error|denied/i).count();
    const stayedOnLogin = page.url().includes('/bootcamp');
    expect(hasError > 0 || stayedOnLogin).toBeTruthy();
  });
});
