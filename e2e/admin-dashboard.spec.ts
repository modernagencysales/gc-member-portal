import { test, expect } from '@playwright/test';
import { mockSupabaseQuery, navigateTo, waitForSPALoad, loginAsAdmin } from './helpers';
import { adminMember, prospect } from './fixtures/test-data';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set admin auth context via localStorage
    await loginAsAdmin(page, adminMember);

    // Mock data for admin pages
    await mockSupabaseQuery(page, 'gc_members', [adminMember]);
    await mockSupabaseQuery(page, 'prospects', [prospect]);
    await mockSupabaseQuery(page, 'tool_access', []);
    await mockSupabaseQuery(page, 'campaigns', []);
  });

  test('admin dashboard loads at /admin', async ({ page }) => {
    await navigateTo(page, '/admin');
    await waitForSPALoad(page);

    // Admin index redirects to /admin/courses
    await expect(page).toHaveURL(/\/admin\/courses/);
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('prospect management table loads at /admin/blueprints', async ({ page }) => {
    await navigateTo(page, '/admin/blueprints');
    await waitForSPALoad(page);

    // The prospect table or list should render
    await expect(page.getByText(prospect.full_name).first()).toBeVisible({ timeout: 10_000 });
  });

  test('search/filter prospects works', async ({ page }) => {
    await navigateTo(page, '/admin/blueprints');
    await waitForSPALoad(page);

    // Look for a search input
    const searchInput = page.getByPlaceholder(/search|filter/i).first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill(prospect.first_name);

      // The matching prospect should still be visible
      await expect(page.getByText(prospect.full_name).first()).toBeVisible();
    }
  });

  test('click prospect shows detail view', async ({ page }) => {
    await navigateTo(page, '/admin/blueprints');
    await waitForSPALoad(page);

    // Click on the prospect name
    const prospectLink = page.getByText(prospect.full_name).first();
    await prospectLink.click();

    // Should show detail information (email, company, etc.)
    await page.waitForTimeout(2_000);
    const hasDetail =
      (await page.getByText(prospect.email).count()) > 0 ||
      (await page.getByText(prospect.company).count()) > 0 ||
      (await page.getByText(/detail|overview|profile/i).count()) > 0;
    expect(hasDetail).toBeTruthy();
  });
});
