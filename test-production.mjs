import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('=== Testing GC Member Portal ===\n');
  console.log('1. Loading site...');
  await page.goto('https://copy-of-gtm-os.vercel.app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"]').first();

  if (await emailInput.count() > 0) {
    console.log('2. Entering email: kristaps@peak9.co');
    await emailInput.fill('kristaps@peak9.co');

    const submitBtn = page.locator('button:has-text("Continue")').first();

    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('airtable.com'), { timeout: 15000 }
    ).catch(() => null);

    console.log('   Submitting...');
    await submitBtn.click();

    const response = await responsePromise;
    if (response) {
      console.log('\n3. Airtable Response:');
      console.log('   Status: ' + response.status());
      try {
        const body = await response.json();
        if (body.records && body.records.length > 0) {
          console.log('   ✅ User found!');
          console.log('   Data: ' + JSON.stringify(body.records[0].fields));
        } else if (body.records) {
          console.log('   ❌ No user found with that email');
        } else if (body.error) {
          console.log('   ❌ Error: ' + body.error.message);
        }
      } catch (e) {}
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'gc-test-result.png', fullPage: true });

    const url = page.url();
    const bodyText = await page.locator('body').innerText();

    console.log('\n4. Result:');
    console.log('   URL: ' + url);

    if (bodyText.includes('Dashboard') || bodyText.includes('Onboarding') || bodyText.includes('Welcome,')) {
      console.log('   ✅ LOGIN SUCCESSFUL - Dashboard loaded!');
    } else if (bodyText.includes('not found') || bodyText.includes('Not found')) {
      console.log('   ❌ User not found in GC Members table');
    } else {
      console.log('   Page content: ' + bodyText.substring(0, 200));
    }
  }

  await browser.close();
})();
