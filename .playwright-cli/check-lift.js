async (page) => {
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  const el = await page.evaluate(() => {
    const c = document.getElementById("iclosed-cta-container");
    if (!c) return "NOT FOUND";
    return { display: c.style.display, visible: c.offsetParent !== null, html: c.outerHTML.substring(0, 200) };
  });
  return JSON.stringify(el);
}
