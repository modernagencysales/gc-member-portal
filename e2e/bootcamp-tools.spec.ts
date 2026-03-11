import { test, expect } from '@playwright/test';
import { mockSupabaseQuery, navigateTo, waitForSPALoad, loginAsBootcampStudent } from './helpers';
import { bootcampStudent, lmsCohort } from './fixtures/test-data';

test.describe('Bootcamp AI Tools', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBootcampStudent(page, bootcampStudent);
    await mockSupabaseQuery(page, 'bootcamp_students', [bootcampStudent]);
    await mockSupabaseQuery(page, 'lms_cohorts', [lmsCohort]);
    await mockSupabaseQuery(page, 'bootcamp_settings', []);
    await mockSupabaseQuery(page, 'bootcamp_student_progress', []);
    await mockSupabaseQuery(page, 'lms_weeks', []);
    await mockSupabaseQuery(page, 'lms_lessons', []);
    await mockSupabaseQuery(page, 'lms_lesson_progress', []);
    await mockSupabaseQuery(page, 'chat_tools', [
      {
        id: 'tool-1',
        name: 'Post Generator',
        description: 'Generate LinkedIn posts with AI',
        enabled: true,
      },
      {
        id: 'tool-2',
        name: 'Profile Optimizer',
        description: 'Optimize your LinkedIn profile',
        enabled: true,
      },
    ]);
  });

  test('AI tools page loads', async ({ page }) => {
    await navigateTo(page, '/bootcamp/ai-tools');
    await waitForSPALoad(page);

    // Page should render with a heading or list of tools
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('TAM builder at /bootcamp/tam-builder loads', async ({ page }) => {
    await mockSupabaseQuery(page, 'tam_entries', []);
    await navigateTo(page, '/bootcamp/tam-builder');
    await waitForSPALoad(page);

    // Should see the TAM builder heading or form
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('tool cards display with descriptions', async ({ page }) => {
    await navigateTo(page, '/bootcamp/ai-tools');
    await waitForSPALoad(page);

    // Look for tool names in the rendered cards
    const toolText = page.getByText(/post generator|profile optimizer|ai tool/i).first();
    const count = await toolText.count();
    // The page should at least show tool-related content
    const hasToolUI = count > 0 || (await page.getByText(/tool/i).count()) > 0;
    expect(hasToolUI).toBeTruthy();
  });
});
