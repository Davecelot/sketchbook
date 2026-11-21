import { expect, test } from '@playwright/test';

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

test('mobile header links fit and search remains a dialog', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const github = page.getByRole('link', { name: 'GitHub (opens in a new tab)' });
  const npm = page.getByRole('link', { name: 'npm (opens in a new tab)' });
  await expect(github).toHaveAttribute('href', 'https://github.com/Davecelot/sketchbook');
  await expect(npm).toHaveAttribute('href', 'https://www.npmjs.com/package/@usesketchbook/cli');
  for (const link of [github, npm]) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
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
  await expect(page.getByRole('link', { name: 'GitHub (opens in a new tab)' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'npm (opens in a new tab)' })).toBeVisible();
});
