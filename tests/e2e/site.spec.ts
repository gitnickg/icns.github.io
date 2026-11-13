import { test, expect, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const submit = async (page: import('@playwright/test').Page, cmd: string) => {
  const input = page.locator('input[data-term-input]');
  await input.fill(cmd);
  await input.press('Enter');
};

test('axe scan of / has zero violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('every request during load is same-origin', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(urls.length).toBeGreaterThan(0);
  for (const u of urls) expect(new URL(u).origin).toBe(origin);
});

test('passwd and help show the easter eggs', async ({ page }) => {
  await page.goto('/');
  const out = page.locator('[data-term-output]');
  await submit(page, 'passwd');
  await expect(out).toContainText('hunter2');
  await submit(page, 'help');
  await expect(out).toContainText('some commands are not listed.');
});

test.describe('mobile', () => {
  const { defaultBrowserType: _ignored, ...iphone } = devices['iPhone 13'];
  test.use({ ...iphone });
  test('tapping the status chip runs it', async ({ page }) => {
    await page.goto('/');
    const chip = page.locator('[data-term-chips] button[data-cmd="status"]');
    await expect(chip).toBeVisible();
    await chip.tap();
    await expect(page.locator('[data-term-output]')).toContainText('consulting: open, part-time, remote');
  });
});

test('Tab from the empty input leaves the terminal', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('input[data-term-input]');
  await expect(input).toBeVisible();
  await input.focus();
  // The chips sit inside the terminal region, so focus may pass through them
  // first; the check is that it is never trapped and does leave the region.
  const inRegion = () =>
    page.evaluate(() => {
      const region = document.querySelector('[role="region"][data-context]');
      return !!region && region.contains(document.activeElement);
    });
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.id)).not.toBe('term-input');
  let left = false;
  for (let i = 0; i < 12 && !left; i++) {
    if (!(await inRegion())) left = true;
    else await page.keyboard.press('Tab');
  }
  expect(left).toBe(true);
});

test.describe('no javascript', () => {
  test.use({ javaScriptEnabled: false });
  test('intro and contact email are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-term-output]')).toContainText('whoami');
    await expect(page.getByText('hello@icns.ca').first()).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('matrix prints the message and no canvas', async ({ page }) => {
    await page.goto('/');
    await submit(page, 'matrix');
    await expect(page.locator('[data-term-output]')).toContainText('wake up, visitor…');
    await expect(page.locator('canvas')).toHaveCount(0);
  });
});

test('/contact/ ends at /#contact', async ({ page }) => {
  await page.goto('/contact/');
  await page.waitForURL(/\/#contact$/);
  expect(new URL(page.url()).hash).toBe('#contact');
});

test('static files return 200', async ({ request }) => {
  for (const p of ['/bitcoin.pdf', '/.well-known/security.txt']) {
    expect((await request.get(p)).status(), p).toBe(200);
  }
});
