import { expect, test } from '@playwright/test';
import { harnessCatalog } from '../../../harness/lib/agent-catalog.mjs';

test('mobile navigation is a scrollable modal and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/reference/glossary/');
  const trigger = page.getByRole('button', { name: 'Open navigation' });
  const sheet = page.getByRole('dialog', { name: 'Navigation' });
  const close = sheet.getByRole('button', { name: 'Close navigation' });
  await trigger.click();
  await expect(sheet).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(close).toBeFocused();
  const nav = sheet.locator('#sidebar');
  expect(await nav.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(sheet.getByRole('link', { name: 'Glossary' })).toBeInViewport();
  await nav.evaluate((el) => { el.scrollTop = 0; });
  await nav.hover();
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => nav.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(sheet).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await close.click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(5, 5);
  await expect(sheet).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(sheet).not.toBeVisible();
  await expect(page.locator('#sidebar')).toBeVisible();
});

test.describe('mobile navigation touch targets', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [{ width: 320, height: 568 }, { width: 667, height: 375 }]) {
    test(`last link is tappable near the sheet edge at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.getByRole('button', { name: 'Open navigation' }).tap();
      const sheet = page.getByRole('dialog', { name: 'Navigation' });
      const nav = sheet.locator('#sidebar');
      const lastLink = nav.getByRole('link').last();
      await nav.evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await expect(lastLink).toBeInViewport({ ratio: 1 });
      const href = await lastLink.getAttribute('href');
      expect(href).toBeTruthy();

      // Tap near the sheet edge, not the center of whatever width the link happens to have.
      const { x, y, height } = await lastLink.evaluate((link) => {
        const dialog = link.closest('dialog')!;
        const nav = link.closest('#sidebar')!;
        const row = link.getBoundingClientRect();
        const inset = parseFloat(getComputedStyle(nav).paddingRight);
        const border = parseFloat(getComputedStyle(dialog).borderRightWidth);
        const scrollbar = nav.offsetWidth - nav.clientWidth;
        return { x: dialog.getBoundingClientRect().right - border - scrollbar - inset - 4, y: row.top + row.height / 2, height: row.height };
      });
      expect(height).toBeGreaterThanOrEqual(44);
      await page.touchscreen.tap(x, y);
      await expect(page).toHaveURL(new URL(href!, page.url()).href);
    });
  }
});

test('mobile header links fit and search remains a dialog', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const github = page.getByRole('link', { name: 'GitHub', exact: true });
  const npm = page.getByRole('link', { name: 'npm', exact: true });
  await expect(github).toHaveAttribute('href', 'https://github.com/Davecelot/sketchbook');
  await expect(npm).toHaveAttribute('href', 'https://www.npmjs.com/package/@usesketchbook/cli');
  for (const link of [github, npm]) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAccessibleDescription('Opens in a new tab.');
    await expect(link.locator('.external-link-icon')).toHaveCount(0);
  }
  expect(await page.locator('.topbar').evaluate((header) =>
    [...header.children].every((child) => child.getBoundingClientRect().right <= innerWidth)
  )).toBe(true);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('dialog', { name: 'Search documentation' })).toBeVisible();
  await page.keyboard.press('Escape');
});

test('desktop keeps the sidebar and links', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.locator('#sidebar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'GitHub', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'npm', exact: true })).toBeVisible();
});

test('Release resources open in a new tab with a visible and accessible cue', async ({ context, page }) => {
  await page.goto('/changelog/');
  const changelog = page.url();
  const resources = page.getByRole('group', { name: 'Release resources' });
  for (const [name, destination] of [
    ['All GitHub releases', 'https://github.com/Davecelot/sketchbook/releases'],
    ['All npm versions', 'https://www.npmjs.com/package/@usesketchbook/cli?activeTab=versions'],
  ] as const) {
    await context.route((url) => url.href === destination, (route) => route.fulfill({ body: 'Release resource' }));
    const link = resources.getByRole('link', { name, exact: true });
    await expect(link).toHaveAccessibleDescription('Opens in a new tab.');
    await expect(link.locator('.external-link-icon')).toBeVisible();
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const [tab] = await Promise.all([
      context.waitForEvent('page'),
      name === 'All GitHub releases' ? link.click() : link.press('Enter'),
    ]);
    await expect(tab).toHaveURL(destination);
    await expect(page).toHaveURL(changelog);
    await tab.close();
  }
});

test('Changelog inline links stay icon-free without changing link behavior', async ({ page }) => {
  await page.goto('/changelog/');
  const article = page.getByRole('article');
  const releaseLink = article.getByRole('link', { name: /^GitHub release v/ }).first();
  await expect(releaseLink).toHaveAttribute('target', '_blank');
  await expect(releaseLink).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(releaseLink).toHaveAccessibleDescription('Opens in a new tab.');
  await expect(releaseLink.locator('.external-link-icon')).toHaveCount(0);

  const docsLink = article.getByRole('link', { name: 'upgrade guide', exact: true }).first();
  await expect(docsLink).not.toHaveAttribute('target', '_blank');
  await expect(docsLink.locator('.external-link-icon')).toHaveCount(0);
  const sectionLink = page.getByRole('navigation', { name: 'On this page' }).getByRole('link').first();
  await sectionLink.click();
  await expect(page).toHaveURL(new URL((await sectionLink.getAttribute('href'))!, page.url()).href);
});

for (const width of [1280, 375]) {
  test(`Agent harness pages are discoverable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Open navigation' });
    const mobile = width < 768;
    const section = page.getByRole('group', { name: 'Agent harness', exact: true });
    for (const [name, path] of [
      ['Harness catalog', '/harness/'],
      ['Skills', '/harness/skills/'],
      ['Harness reference', '/harness/reference/'],
    ] as const) {
      if (mobile) await trigger.click();
      const link = section.getByRole('link', { name, exact: true });
      await expect(link).toHaveAttribute('href', path);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('heading', { name, level: 1, exact: true })).toBeVisible();
      if (mobile) await trigger.click();
      await expect(link).toHaveAttribute('aria-current', 'page');
      if (mobile) await page.keyboard.press('Escape');
    }
  });
}

test('Harness catalog keeps existing section links', async ({ page }) => {
  for (const id of ['browse-in-a-terminal', 'use-explicit-commands', 'what-gets-installed',
    'hammock-configuration', 'updating-an-existing-installation', 'catalog-items']) {
    await page.goto(`/harness/#${id}`);
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test('skills are grouped by task and kept separate from integration references', async ({ page }) => {
  await page.goto('/harness/skills/');
  const content = page.getByRole('main');
  await expect(content.getByRole('heading', { name: 'Build components and pages' })).toBeVisible();
  const skills = harnessCatalog().filter(({ kind, partOf }) => kind === 'skill' && !partOf).map(({ id }) => id);
  expect((await content.locator('li > code').allTextContents()).sort()).toEqual(skills.sort());
  await expect(content.getByRole('table')).toHaveCount(0);
  await expect(content.getByText('hook:guard-generated', { exact: true })).toHaveCount(0);
  await page.goto('/harness/reference/');
  await expect(content.getByRole('heading', { name: 'Integration references' })).toBeVisible();
  await expect(content.getByText('hook:guard-generated', { exact: true })).toBeVisible();
});
