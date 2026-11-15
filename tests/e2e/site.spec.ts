import { test, expect, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const submit = async (page: import('@playwright/test').Page, cmd: string) => {
  const input = page.locator('input[data-term-input]');
  await input.fill(cmd);
  await input.press('Enter');
};

const scan = async (page: import('@playwright/test').Page) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
};

test('axe scan of / has zero violations after the intro, and in each theme', async ({ page }) => {
  await page.goto('/');
  // Intro is done once whoami has printed its last line.
  await expect(page.locator('[data-term-output]')).toContainText('Independent Consultant @ icns.ca', { timeout: 15000 });
  await expect(page.locator('[data-term-output]')).not.toHaveAttribute('aria-busy', 'true');
  await scan(page);
  for (const theme of ['amber', 'green']) {
    await submit(page, `theme ${theme}`);
    await expect(page.locator('[data-terminal]')).toHaveAttribute('data-theme', theme);
    await scan(page);
  }
});

test('axe scan of /404.html has zero violations', async ({ page }) => {
  await page.goto('/404.html');
  await scan(page);
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
  test('whoami intro and footer profile links are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-term-output]')).toContainText('Independent Consultant @ icns.ca');
    await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
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
  test('reboot and rm -rf / print text only', async ({ page }) => {
    await page.goto('/');
    await submit(page, 'rm -rf /');
    await expect(page.locator('[data-term-output]')).toContainText("refusing to remove '/'");
    await expect(page.locator('.rm-gone')).toHaveCount(0);
    await submit(page, 'reboot');
    await expect(page.locator('[data-term-output]')).toContainText('icns login: visitor');
    await expect(page.locator('input[data-term-input]')).toBeEnabled();
  });
});

test('rm -rf / empties the page and brings it back', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-term-output]')).not.toHaveAttribute('aria-busy', 'true', { timeout: 15000 });
  await submit(page, 'rm -rf /');
  await expect(page.locator('[data-terminal]')).toBeHidden({ timeout: 6000 });
  await expect(page.locator('.site-footer')).toBeHidden();
  await expect(page.locator('[data-terminal]')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('.rm-gone')).toHaveCount(0);
  await expect(page.locator('[data-term-output]')).toContainText("removed '/'");
});

test('reboot boots back to whoami', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-term-output]')).not.toHaveAttribute('aria-busy', 'true', { timeout: 15000 });
  await submit(page, 'reboot');
  await expect(page.locator('[data-term-output]')).toContainText('Reached target multi-user.target', { timeout: 8000 });
  await expect(page.locator('[data-term-output]')).toContainText('Independent Consultant', { timeout: 8000 });
  await expect(page.locator('input[data-term-input]')).toBeEnabled();
  await expect(page.locator('input[data-term-input]')).toBeFocused();
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
