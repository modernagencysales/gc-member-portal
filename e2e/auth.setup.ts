import { test as setup, expect } from '@playwright/test';
import { mockSupabaseQuery } from './helpers';
import { gcMember } from './fixtures/test-data';

const authFile = 'e2e/.auth/user.json';

setup('authenticate as GC member', async ({ page }) => {
  // Mock the Supabase verify-member call so login succeeds without a real DB
  await mockSupabaseQuery(page, 'gc_members', [gcMember]);

  await page.goto('/login');

  // Fill in the email field and submit
  await page.getByPlaceholder(/you@company\.com|email/i).fill(gcMember.email);
  await page.getByRole('button', { name: /continue|sign in|log in|submit/i }).click();

  // Wait for redirect to /portal after successful login
  await page.waitForURL('**/portal', { timeout: 15_000 });

  // Verify we landed on the portal
  await expect(page).toHaveURL(/\/portal/);

  // Persist auth state (localStorage-based) so subsequent tests skip login
  await page.context().storageState({ path: authFile });
});
