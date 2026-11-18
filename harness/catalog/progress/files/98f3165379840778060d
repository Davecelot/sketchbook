import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { systemColor } from '../../helpers/styles';
import { tokenColor, tokenLength, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-progress';
const bar = (page: Page) => page.getByRole('progressbar');
const part = (page: Page, name: string) => page.locator(TAG).locator(`[part="${name}"]`);
const setAttr = (page: Page, name: string, value: string | null) =>
  page.locator(TAG).evaluate((el, [n, v]) => (v === null ? el.removeAttribute(n) : el.setAttribute(n, v)), [name, value] as const);

test.describe('Progress', () => {
  test('is a progressbar named by label, with value, min and max', async ({ page }) => {
    await gotoStory(page, 'components-progress--default', TAG);
    await expect(page.getByRole('progressbar', { name: 'Upload progress' })).toBeVisible();
    await expect(bar(page)).toHaveAttribute('aria-valuenow', '60');
    await expect(bar(page)).toHaveAttribute('aria-valuemin', '0');
    await expect(bar(page)).toHaveAttribute('aria-valuemax', '100');
  });

  test('max sets the scale and the fill follows value over max', async ({ page }) => {
    await gotoStory(page, 'components-progress--custom-max', TAG);
    await expect(bar(page)).toHaveAttribute('aria-valuemax', '8');
    await expect.poll(async () => {
      const [t, i] = [await part(page, 'track').boundingBox(), await part(page, 'indicator').boundingBox()];
      return Math.round((i!.width / t!.width) * 1000) / 1000;
    }).toBe(0.375);
  });

  test('changing value updates the fill and aria-valuenow', async ({ page }) => {
    await gotoStory(page, 'components-progress--default', TAG);
    await setAttr(page, 'value', '100');
    await expect(bar(page)).toHaveAttribute('aria-valuenow', '100');
    await expect.poll(async () => (await part(page, 'indicator').boundingBox())!.width).toBe((await part(page, 'track').boundingBox())!.width);
  });

  test('values outside the range are clamped', async ({ page }) => {
    await gotoStory(page, 'components-progress--default', TAG);
    await setAttr(page, 'value', '250');
    await expect(bar(page)).toHaveAttribute('aria-valuenow', '100');
    await setAttr(page, 'value', '-5');
    await expect(bar(page)).toHaveAttribute('aria-valuenow', '0');
  });

  test('indeterminate: no aria-valuenow, animated, and still under reduced motion', async ({ page }) => {
    await gotoStory(page, 'components-progress--indeterminate', TAG);
    await expect(bar(page)).not.toHaveAttribute('aria-valuenow');
    const animation = () => part(page, 'indicator').evaluate((el) => getComputedStyle(el).animationName);
    expect(await animation()).not.toBe('none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await animation()).toBe('none');
  });

  test('a page aria-label or aria-labelledby names the bar', async ({ page }) => {
    await gotoStory(page, 'components-progress--default', TAG);
    await setAttr(page, 'label', null);
    await setAttr(page, 'aria-label', 'Disk usage');
    await expect(page.getByRole('progressbar', { name: 'Disk usage' })).toBeVisible();
    await gotoStory(page, 'components-progress--named-by-text', TAG);
    await expect(page.getByRole('progressbar', { name: 'Syncing library' })).toBeVisible();
  });

  test('clearing label removes the aria-label it set but keeps an author aria-label', async ({ page }) => {
    await gotoStory(page, 'components-progress--default', TAG);
    await expect(bar(page)).toHaveAttribute('aria-label', 'Upload progress');
    await setAttr(page, 'label', null);
    await expect(bar(page)).not.toHaveAttribute('aria-label');
    await setAttr(page, 'aria-label', 'Disk usage');
    await setAttr(page, 'label', 'Upload progress');
    await expect(bar(page)).toHaveAttribute('aria-label', 'Upload progress');
    await setAttr(page, 'label', null);
    await expect(bar(page)).toHaveAttribute('aria-label', 'Disk usage');
  });

  test('an empty value attribute is indeterminate, not zero', async ({ page }) => {
    await gotoStory(page, 'components-progress--default', TAG);
    await setAttr(page, 'value', '');
    await expect(bar(page)).not.toHaveAttribute('aria-valuenow');
    await expect(page.locator(TAG)).toHaveAttribute('data-indeterminate', '');
    await setAttr(page, 'value', '0');
    await expect(bar(page)).toHaveAttribute('aria-valuenow', '0');
    await expect(page.locator(TAG)).not.toHaveAttribute('data-indeterminate');
  });

  test('warns once when the bar has no accessible name', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && m.text().includes('accessible name') && warnings.push(m.text()));
    await gotoStory(page, 'components-progress--default', TAG);
    await page.evaluate(() => {
      const bar = document.createElement('sb-progress');
      document.body.append(bar);
      (bar as HTMLElement & { value: number }).value = 10;
      (bar as HTMLElement & { value: number }).value = 20;
    });
    await expect.poll(() => warnings.length).toBeGreaterThan(0);
    // The warning is checked a frame after render: two more frames give any duplicate its chance to appear.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    expect(warnings).toHaveLength(1);
  });

  test('size, radius and colors come from tokens', async ({ page }) => {
    await gotoStory(page, 'components-progress--default', TAG);
    const host = page.locator(TAG);
    expect((await part(page, 'track').boundingBox())!.height).toBe(await tokenPx(host, '--sb-progress-height'));
    expect(await part(page, 'indicator').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(host, '--sb-progress-indicator-bg'));
    expect(await part(page, 'track').evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe(await tokenLength(host, '--sb-progress-radius'));
    expect(await part(page, 'track').evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(await tokenColor(host, '--sb-progress-track-bg'));
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'empty', 'complete', 'indeterminate', 'named-by-text']) {
      await gotoStory(page, `components-progress--${id}`, TAG);
      expect(await axeViolations(page, TAG), id).toEqual([]);
    }
  });

  test('forced colors: the fill is a system highlight and the track is outlined, so the bar stays visible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-progress--default', TAG);
    const indicator = await part(page, 'indicator').evaluate((el) => getComputedStyle(el).backgroundColor);
    const track = await part(page, 'track').evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, outline: getComputedStyle(el).outlineStyle }));
    expect(indicator).toBe(await systemColor(page, 'Highlight'));
    expect(indicator).not.toBe(track.bg);
    expect(track.outline).toBe('solid');
  });
});
