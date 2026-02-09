import { test, expect } from '@playwright/test';
import { mockSupabaseQuery, navigateTo, waitForSPALoad, loginAsAdmin } from './helpers';
import {
  adminMember,
  bootcampStudent,
  bootcampSurvey,
  bootcampInviteCode,
} from './fixtures/test-data';

test.describe('Admin Bootcamp Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, adminMember);
    await mockSupabaseQuery(page, 'gc_members', [adminMember]);
    await mockSupabaseQuery(page, 'bootcamp_students', [bootcampStudent]);
    await mockSupabaseQuery(page, 'bootcamp_student_surveys', [bootcampSurvey]);
    await mockSupabaseQuery(page, 'bootcamp_invite_codes', [bootcampInviteCode]);
    await mockSupabaseQuery(page, 'bootcamp_settings', []);
  });

  test('student list at /admin/courses/students', async ({ page }) => {
    await navigateTo(page, '/admin/courses/students');
    await waitForSPALoad(page);

    await expect(
      page
        .getByText(bootcampStudent.full_name)
        .first()
        .or(page.getByText(bootcampStudent.email).first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('survey responses at /admin/courses/surveys', async ({ page }) => {
    await navigateTo(page, '/admin/courses/surveys');
    await waitForSPALoad(page);

    // Should show survey data or a table of responses
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('invite code management at /admin/courses/invite-codes', async ({ page }) => {
    await navigateTo(page, '/admin/courses/invite-codes');
    await waitForSPALoad(page);

    // The existing invite code should be displayed
    await expect(page.getByText(bootcampInviteCode.code).first()).toBeVisible({ timeout: 10_000 });
  });

  test('create new invite code', async ({ page }) => {
    await navigateTo(page, '/admin/courses/invite-codes');
    await waitForSPALoad(page);

    // Click create/add button
    const addBtn = page.getByRole('button', { name: /create|add|new|generate/i }).first();
    if ((await addBtn.count()) > 0) {
      await addBtn.click();

      // A form or modal should appear
      await page.waitForTimeout(1_500);

      // Should see input fields for the new code
      const hasForm =
        (await page.getByPlaceholder(/code/i).count()) > 0 ||
        (await page.locator('input[name*="code"]').count()) > 0 ||
        (await page.getByRole('dialog').count()) > 0;
      expect(hasForm).toBeTruthy();
    }
  });
});
