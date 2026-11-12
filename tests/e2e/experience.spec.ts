import { expect, test } from '@playwright/test';

test('shows how many objects there are', async ({ page }) => {
  await page.goto('/it/');
  await expect(page.locator('#count')).toHaveText(/^\d+ oggetti da 10⁻³⁵ a 10²⁷ metri$/);
});

test('search opens the card of the chosen object', async ({ page }) => {
  await page.goto('/it/');
  await page.fill('#q', 'terra');
  await page.locator('#results button', { hasText: /^Terra/ }).first().click();
  await expect(page.locator('#card')).toHaveClass(/open/);
  await expect(page.locator('#cName')).toHaveText('Terra');
  await expect(page.locator('#cSize')).toHaveText('12.742 km');
  await expect(page).toHaveURL(/\/it\/#terra$/);
});

test('search with no match says so', async ({ page }) => {
  await page.goto('/it/');
  await page.fill('#q', 'zzzz');
  await expect(page.locator('#results')).toContainText('Nessun oggetto con questo nome.');
});

test('the mouse wheel changes the scale', async ({ page }) => {
  await page.goto('/it/');
  const before = await page.locator('#pretty').textContent();
  await page.mouse.move(400, 300);
  await page.mouse.wheel(0, 2000);
  await expect(page.locator('#pretty')).not.toHaveText(before!);
});

test('a direct link opens that object', async ({ page }) => {
  await page.goto('/it/#sole');
  await expect(page.locator('#card')).toHaveClass(/open/);
  await expect(page.locator('#cName')).toHaveText('Sole');
});

test('an unknown id in the link opens no card and raises no error', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (e) => errors.push(e));
  await page.goto('/it/#non-esiste');
  await expect(page.locator('#count')).toBeVisible();
  await expect(page.locator('#card')).not.toHaveClass(/open/);
  expect(errors).toEqual([]);
});

test('an object without a description hides the paragraph', async ({ page }) => {
  await page.goto('/it/#formica');
  await expect(page.locator('#cName')).toHaveText('Formica');
  await expect(page.locator('#cNote')).toBeHidden();
});

test('closing the card clears the link', async ({ page }) => {
  await page.goto('/it/#sole');
  await page.click('#close');
  await expect(page.locator('#card')).not.toHaveClass(/open/);
  await expect(page).toHaveURL(/\/it\/$/);
});

test('a filter chip toggles', async ({ page }) => {
  await page.goto('/it/');
  const chip = page.locator('.chip').first();
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
});

test('a language that is not enabled yet is a 404', async ({ page }) => {
  expect((await page.goto('/de/'))!.status()).toBe(404);
  expect((await page.goto('/xx/'))!.status()).toBe(404);
});

test('method dialog: credit, experiment, differences, interface sources, privacy', async ({ page }) => {
  await page.goto('/it/');
  await page.click('#about');
  const dialog = page.locator('#dlg');
  await expect(dialog.locator('a[href="https://scaleofuniverse.com/"]').first()).toBeVisible();
  await expect(dialog).toContainText('Cary e Michael Huang');
  await expect(dialog).toContainText('Fable 5.2');
  await expect(dialog).toContainText("In cosa differisce dall'originale");
  await expect(dialog).toContainText("Fonti dell'interfaccia");
  await expect(dialog).toContainText('non usa cookie e non traccia nulla');
  await expect(dialog).toContainText('Federico Calicchia');
});

test('the page sets no cookies and calls no other host', async ({ page, context }) => {
  const foreign: string[] = [];
  page.on('request', (r) => {
    if (new URL(r.url()).host !== 'localhost:4321' && !r.url().startsWith('data:')) foreign.push(r.url());
  });
  await page.goto('/it/#terra');
  await page.click('#about');
  expect(await context.cookies()).toEqual([]);
  expect(foreign).toEqual([]);
});

test('a malformed id in the link raises no error', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (e) => errors.push(e));
  await page.goto('/it/#%E0%A4');
  await expect(page.locator('#count')).toBeVisible();
  await expect(page.locator('#card')).not.toHaveClass(/open/);
  expect(errors).toEqual([]);
});
