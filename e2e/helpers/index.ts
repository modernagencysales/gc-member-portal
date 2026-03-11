import { Page, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Supabase REST API mock
// ---------------------------------------------------------------------------

/**
 * Intercept Supabase PostgREST calls for a given table and return mock data.
 *
 * Matches any request whose URL contains `/rest/v1/<table>`.
 */
export async function mockSupabaseQuery(page: Page, table: string, data: unknown, status = 200) {
  await page.route(`**/rest/v1/${table}*`, (route) => {
    const method = route.request().method();
    if (method === 'GET' || method === 'POST' || method === 'PATCH') {
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    }
    return route.continue();
  });
}

// ---------------------------------------------------------------------------
// SPA navigation helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to a path in the SPA. Waits for the React Router URL to update and
 * for the network to settle.
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await waitForSPALoad(page);
}

/**
 * Wait for the React app to hydrate / finish its initial render.
 *
 * Strategy: wait until the root element is non-empty and the loading spinner
 * (if any) disappears.
 */
export async function waitForSPALoad(page: Page) {
  // Wait for the root React container to have content
  await page.waitForSelector('#root:not(:empty)', { timeout: 15_000 });

  // Wait for any full-screen loading spinners to disappear
  const spinner = page.locator('.animate-spin');
  if ((await spinner.count()) > 0) {
    await spinner
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => {
        // spinner may already be gone -- that's fine
      });
  }
}

// ---------------------------------------------------------------------------
// Auth helpers for non-GC contexts (bootcamp student, admin)
// ---------------------------------------------------------------------------

/**
 * Set up localStorage as if a bootcamp student is logged in.
 */
export async function loginAsBootcampStudent(
  page: Page,
  student: { email: string; first_name: string; last_name: string; [k: string]: unknown }
) {
  await page.addInitScript((s) => {
    localStorage.setItem(
      'lms_user_obj',
      JSON.stringify({ email: s.email, name: `${s.first_name} ${s.last_name}` })
    );
  }, student);
}

/**
 * Set up localStorage as if a GC admin is logged in.
 */
export async function loginAsAdmin(page: Page, admin: { email: string; [k: string]: unknown }) {
  await page.addInitScript((a) => {
    localStorage.setItem('gc_member', JSON.stringify(a));
  }, admin);
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper: assert visible text on the page.
 */
export async function expectVisible(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 10_000 });
}
