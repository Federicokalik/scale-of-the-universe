import { expect, test } from '@playwright/test';

test('landing credits the original, states the experiment and the privacy stance', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="https://scaleofuniverse.com/"]')).toBeVisible();
  await expect(page.locator('body')).toContainText('Cary and Michael Huang');
  await expect(page.locator('body')).toContainText('Fable 5.2');
  await expect(page.locator('body')).toContainText('No cookies, no tracking');
  await expect(page.locator('body')).toContainText('Federico Calicchia');
});

test('landing leads into the chosen language', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[hreflang="it"]').click();
  await expect(page).toHaveURL(/\/it\/$/);
});

test('landing does not redirect on its own', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/localhost:4321\/$/);
});

test('landing remembers the last language chosen', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[hreflang="it"]').click();
  await page.goto('/');
  await expect(page.locator('a[hreflang="it"]')).toHaveAttribute('data-last', 'true');
});

test('landing works when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  const errors: Error[] = [];
  page.on('pageerror', (e) => errors.push(e));
  await page.goto('/');
  await expect(page.locator('a[hreflang="it"]')).toBeVisible();
  await page.locator('a[hreflang="it"]').click();
  await expect(page).toHaveURL(/\/it\/$/);
  expect(errors).toEqual([]);
});

test('landing sets no cookies', async ({ page, context }) => {
  await page.goto('/');
  expect(await context.cookies()).toEqual([]);
});
