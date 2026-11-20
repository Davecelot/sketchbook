import { expect, test } from '@playwright/test';

test('customization follows Demo pages, leaves Docs unchanged, and resets', async ({ page }) => {
  await page.goto('/playground/change-one-source/');
  const choose = async (name: string, value: string) => {
    const control = page.locator(`[data-control="${name}"]`);
    const group = control.locator('xpath=ancestor::details');
    if (!(await group.evaluate((element) => element.open))) await group.locator('summary').click();
    await control.locator('select').selectOption(value);
  };
  const initialColor = await page.locator('[data-control="primary"] select').inputValue();
  const rootColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sb-color-primary').trim());

  await choose('primary', '#2563EB');
  await choose('density', 'compact');
  await choose('spacing', 'grid-8');
  await choose('font', 'serif');
  await choose('typeScale', 'perfect-fourth');
  await page.locator('.playground-control-group summary[aria-label="Color and shape"]').click();
  const slider = page.locator('[data-control="radius"] input');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.goto('/demo/button/');
  const button = page.locator('.live-demo sb-button').first().locator('button');
  await expect(button).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  await expect(button).toHaveCSS('height', '32px');
  await expect(button).toHaveCSS('border-radius', '9px');
  await expect(button).toHaveCSS('font-family', /Georgia/);
  await expect(page.locator('html')).toHaveCSS('--sb-space-4', '32px');
  await expect(page.locator('html')).toHaveCSS('--sb-font-size-2xl', '38px');
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sb-color-primary').trim())).toBe(rootColor);
  await page.goto('/playground/change-one-source/');
  await page.locator('.playground-control-group summary[aria-label="Typography"]').click();
  await expect(page.locator('[data-control="font"] select')).toHaveValue('serif');
  await page.locator('[data-reset]').click();
  await expect(page.locator('[data-control="primary"] select')).toHaveValue(initialColor);
  await page.goto('/demo/button/');
  await expect(button).toHaveCSS('height', '36px');
  await expect(button).toHaveCSS('border-radius', '8px');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sb-color-primary').trim())).toBe(rootColor);
});

test('inspector remains contained on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/playground/change-one-source/');
  await page.locator('.playground-control-group summary[aria-label="Typography"]').click();
  const sizes = await page.locator('[data-playground]').evaluate((panel) => ({ scroll: panel.scrollWidth, client: panel.clientWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('inspector sections open with the keyboard and summarize their values', async ({ page }) => {
  await page.goto('/playground/change-one-source/');
  const group = page.locator('.playground-control-group').filter({ has: page.locator('summary[aria-label="Density and spacing"]') });
  const summary = group.locator('summary');
  await expect(group).not.toHaveAttribute('open', '');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(group).toHaveAttribute('open', '');
  await group.locator('[data-control="density"] select').selectOption('compact');
  await page.keyboard.press('Escape');
  await expect(group).not.toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
  await expect(page.locator('[data-summary="spacing"]')).toContainText('Compact');
});

for (const theme of ['light', 'dark']) {
  test(`toolbar icons and interaction states in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('sb-docs-theme', value), theme);
    await page.goto('/playground/change-one-source/');
    const trigger = page.locator('summary[aria-label="Color and shape"]');
    await expect(trigger.locator('svg.lucide-palette')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('summary[aria-label="Density and spacing"] svg.lucide-sliders-horizontal')).toBeAttached();
    await expect(page.locator('summary[aria-label="Typography"] svg.lucide-type')).toBeAttached();
    const background = () => trigger.evaluate((element) => getComputedStyle(element).backgroundColor);
    const rest = await background();
    await trigger.hover();
    const hover = await background();
    expect(hover).not.toBe(rest);
    await page.mouse.down();
    await expect(trigger).not.toHaveCSS('transform', 'none');
    await page.mouse.up();
    await expect(trigger.locator('xpath=..')).toHaveAttribute('open', '');
    expect(await background()).not.toBe(hover);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveCSS('outline-style', 'solid');
  });
}
