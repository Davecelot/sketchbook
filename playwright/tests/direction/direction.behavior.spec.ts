import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';

const TAG = 'sb-direction';
const tab = (page: Page, nth: number) => page.locator('sb-tabs-trigger').nth(nth).locator('[part="trigger"]');
const direction = (page: Page, selector: string) => page.locator(selector).evaluate((el) => getComputedStyle(el).direction);

test.describe('Direction', () => {
  test('dir reflects to the native attribute and sets the subtree direction', async ({ page }) => {
    await gotoStory(page, 'components-direction--default', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('dir', 'ltr');
    expect(await direction(page, 'sb-tabs')).toBe('ltr');
    await gotoStory(page, 'components-direction--right-to-left', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('dir', 'rtl');
    expect(await direction(page, 'sb-tabs')).toBe('rtl');
  });

  test('changing dir updates the subtree at once', async ({ page }) => {
    await gotoStory(page, 'components-direction--default', TAG);
    await page.locator(TAG).evaluate((el) => ((el as HTMLElement).dir = 'rtl'));
    await expect(page.locator(TAG)).toHaveAttribute('dir', 'rtl');
    expect(await direction(page, 'sb-tabs')).toBe('rtl');
  });

  test('an inner sb-direction overrides the outer one', async ({ page }) => {
    await gotoStory(page, 'components-direction--nested', TAG);
    expect(await direction(page, '#outer')).toBe('rtl');
    expect(await direction(page, '#inner')).toBe('ltr');
  });

  test('adds no box of its own', async ({ page }) => {
    await gotoStory(page, 'components-direction--default', TAG);
    expect(await page.locator(TAG).evaluate((el) => getComputedStyle(el).display)).toBe('contents');
  });

  test('roving focus in sb-tabs follows the direction: arrows reverse in rtl and flip back', async ({ page }) => {
    await gotoStory(page, 'components-direction--default', TAG);
    await page.keyboard.press('Tab');
    await expect(tab(page, 0)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 1)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 0)).toBeFocused();

    await page.locator(TAG).evaluate((el) => ((el as HTMLElement).dir = 'rtl'));
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 1)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 0)).toBeFocused();

    await page.locator(TAG).evaluate((el) => ((el as HTMLElement).dir = 'ltr'));
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 1)).toBeFocused();
  });

  test('story starting in rtl: ArrowLeft moves forward, ArrowRight backward', async ({ page }) => {
    await gotoStory(page, 'components-direction--right-to-left', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 1)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 2)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 1)).toBeFocused();
  });

  test('tabs lay out from the right in rtl', async ({ page }) => {
    await gotoStory(page, 'components-direction--right-to-left', TAG);
    const first = (await page.locator('sb-tabs-trigger').nth(0).boundingBox())!;
    const last = (await page.locator('sb-tabs-trigger').nth(2).boundingBox())!;
    expect(first.x).toBeGreaterThan(last.x);
  });

  test('pagination chevrons mirror only in rtl', async ({ page }) => {
    const icon = (p: Page) => p.locator('sb-pagination-previous [part="icon"]').evaluate((el) => getComputedStyle(el).transform);
    await gotoStory(page, 'components-direction--default', TAG);
    expect(await icon(page)).toBe('none');
    await gotoStory(page, 'components-direction--right-to-left', TAG);
    expect(await icon(page)).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'right-to-left', 'nested']) {
      await gotoStory(page, `components-direction--${id}`, TAG);
      expect(await axeViolations(page, TAG), id).toEqual([]);
    }
  });
});
