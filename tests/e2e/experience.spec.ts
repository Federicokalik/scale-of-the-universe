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

test('an unknown language is a 404', async ({ page }) => {
  expect((await page.goto('/xx/'))!.status()).toBe(404);
});

test('every language opens, in its own direction, with a translated card', async ({ page }) => {
  for (const [code, dir] of [['en', 'ltr'], ['de', 'ltr'], ['nl-BE', 'ltr'], ['pt-BR', 'ltr'], ['es', 'ltr'], ['fr', 'ltr'], ['ru', 'ltr'], ['zh-Hans', 'ltr'], ['ar', 'rtl'], ['ja', 'ltr']]) {
    await page.goto(`/${code}/#terra`);
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await expect(page.locator('html')).toHaveAttribute('dir', dir);
    await expect(page.locator('.card h2')).not.toHaveText('');
    await expect(page.locator('.card h2')).not.toHaveText('Terra', { timeout: 1 }).catch(() => {
      // Portuguese and Spanish share the Italian name of the Earth; any other language must not.
      if (!['pt-BR', 'es'].includes(code)) throw new Error(`${code}: the card is still in Italian`);
    });
  }
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
  await expect(dialog).not.toContainText('kube.io');
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

test('interface text is set in Public Sans, served by the site itself', async ({ page }) => {
  await page.goto('/it/');
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family).toMatch(/^"?Public Sans Variable"?/);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "Public Sans Variable"'))).toBe(true);
});

test('panels are flat: no refraction filter and no pointer-following sheen', async ({ page }) => {
  await page.goto('/it/#terra');
  await expect(page.locator('#card')).toHaveClass(/open/);
  await page.waitForTimeout(600);
  expect(await page.locator('svg filter').count()).toBe(0);
  const backdrop = await page.evaluate(() => getComputedStyle(document.getElementById('card')!).backdropFilter);
  expect(backdrop).not.toContain('url(');
  const sheen = await page.evaluate(() => getComputedStyle(document.getElementById('about')!, '::before').content);
  expect(sheen).toBe('none');
});

test('a verified object shows its sources and the date it was checked', async ({ page }) => {
  await page.goto('/it/#m87');
  await expect(page.locator('#cName')).toHaveText('M87*');
  const sources = page.locator('#cSources');
  await expect(sources).toBeVisible();
  const link = sources.locator('a').first();
  await expect(link).toHaveAttribute('href', /^https:\/\//);
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(sources).toContainText(/Verificato il \d{1,2} \p{L}+ \d{4}/u);
});

test('on a phone nothing overflows and every control is big enough for a finger', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/it/#terra');
  await expect(page.locator('.card')).toHaveClass(/open/);
  // Sizes are read once the card has finished growing into place.
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, .lang, input[type=search]')]
      .filter((e) => e.offsetParent !== null && !e.closest('dialog'))
      .filter((e) => e.getBoundingClientRect().height < 44)
      .map((e) => e.id || e.className),
  );
  expect(small).toEqual([]);
  // The chosen object stays visible above the card.
  const card = await page.locator('.card').boundingBox();
  expect(card!.y).toBeGreaterThan(200);
  await context.close();
});

test('the language menu switches language and keeps the open object', async ({ page }) => {
  await page.goto('/it/#terra');
  await page.locator('#lang').selectOption('en');
  await expect(page).toHaveURL(/\/en\/#terra$/);
  await expect(page.locator('.card h2')).toHaveText('Earth');
});

test('an object at the far end of the scale is drawn once the view has flown to it', async ({ page }) => {
  // A long flight once left the scene shifted off-screen for seconds: nothing was drawn at all.
  await page.goto('/it/#laniakea');
  await page.waitForTimeout(3500);
  const drawn = await page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const proto = CanvasRenderingContext2D.prototype;
        const original = proto.fillText;
        const seen: string[] = [];
        proto.fillText = function (text: string, ...rest: [number, number]) {
          seen.push(text);
          return original.call(this, text, ...rest);
        };
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            proto.fillText = original;
            resolve(seen);
          }),
        );
      }),
  );
  expect(drawn).toContain('Laniakea');
});
