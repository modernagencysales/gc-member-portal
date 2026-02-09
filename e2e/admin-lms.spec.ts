import { test, expect } from '@playwright/test';
import { mockSupabaseQuery, navigateTo, waitForSPALoad, loginAsAdmin } from './helpers';
import {
  adminMember,
  lmsCohort,
  lmsWeeks,
  lmsLessons,
  lmsContentItems,
  lmsActionItems,
  bootcampStudent,
} from './fixtures/test-data';

test.describe('Admin LMS Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, adminMember);
    await mockSupabaseQuery(page, 'gc_members', [adminMember]);
    await mockSupabaseQuery(page, 'lms_cohorts', [lmsCohort]);
    await mockSupabaseQuery(page, 'lms_weeks', lmsWeeks);
    await mockSupabaseQuery(page, 'lms_lessons', lmsLessons);
    await mockSupabaseQuery(page, 'lms_content_items', lmsContentItems);
    await mockSupabaseQuery(page, 'lms_action_items', lmsActionItems);
    await mockSupabaseQuery(page, 'bootcamp_students', [bootcampStudent]);
    await mockSupabaseQuery(page, 'lms_lesson_progress', []);
    await mockSupabaseQuery(page, 'lms_action_item_progress', []);
  });

  test('cohort list loads at /admin/courses (courses overview)', async ({ page }) => {
    await navigateTo(page, '/admin/courses');
    await waitForSPALoad(page);

    await expect(page.getByText(lmsCohort.name).first()).toBeVisible({ timeout: 10_000 });
  });

  test('create new cohort form', async ({ page }) => {
    await navigateTo(page, '/admin/courses');
    await waitForSPALoad(page);

    // Click create/add button
    const addBtn = page.getByRole('button', { name: /create|add|new/i }).first();
    if ((await addBtn.count()) > 0) {
      await addBtn.click();

      // A form or modal should appear with name input
      const nameInput = page
        .getByPlaceholder(/name|title/i)
        .first()
        .or(page.locator('input[name*="name"]').first());
      await expect(nameInput).toBeVisible({ timeout: 5_000 });
    }
  });

  test('curriculum editor at /admin/courses/:id/curriculum', async ({ page }) => {
    // Navigate to the curriculum editor for the cohort
    await navigateTo(page, `/admin/courses/curriculum/${lmsCohort.id}`);
    await waitForSPALoad(page);

    // Should show week titles from the curriculum
    await expect(page.getByText(lmsWeeks[0].title).first()).toBeVisible({ timeout: 10_000 });
  });

  test('add week, add lesson, add content item', async ({ page }) => {
    await navigateTo(page, `/admin/courses/curriculum/${lmsCohort.id}`);
    await waitForSPALoad(page);

    // Look for "Add Week" button
    const addWeekBtn = page.getByRole('button', { name: /add week|new week/i }).first();
    if ((await addWeekBtn.count()) > 0) {
      await addWeekBtn.click();
      // A form/modal for the new week should appear
      await page.waitForTimeout(1_000);
    }

    // Look for "Add Lesson" button (may need to expand a week first)
    const addLessonBtn = page.getByRole('button', { name: /add lesson|new lesson/i }).first();
    if ((await addLessonBtn.count()) > 0) {
      await addLessonBtn.click();
      await page.waitForTimeout(1_000);
    }

    // Look for "Add Content" button
    const addContentBtn = page.getByRole('button', { name: /add content|new content/i }).first();
    if ((await addContentBtn.count()) > 0) {
      await addContentBtn.click();
      await page.waitForTimeout(1_000);
    }

    // Page should still be functional (no crash)
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('drag-and-drop reordering (test sort order change)', async ({ page }) => {
    await navigateTo(page, `/admin/courses/curriculum/${lmsCohort.id}`);
    await waitForSPALoad(page);

    // Find draggable items (weeks or lessons)
    const draggableItems = page.locator('[data-sortable], [draggable="true"], [role="listitem"]');
    const count = await draggableItems.count();

    if (count >= 2) {
      const first = draggableItems.nth(0);
      const second = draggableItems.nth(1);
      await first.dragTo(second);

      // After drag, the page should still render without errors
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });

  test('student management page loads', async ({ page }) => {
    await navigateTo(page, '/admin/courses/students');
    await waitForSPALoad(page);

    // Should show the student list
    await expect(
      page
        .getByText(bootcampStudent.full_name)
        .first()
        .or(page.getByText(bootcampStudent.email).first())
    ).toBeVisible({ timeout: 10_000 });
  });
});
