import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor } from '../../helpers/tokens';

const TAG = 'sb-scroll-area';
const viewport = (page: Page) => page.locator(TAG).locator('[part="viewport"]');
const css = (page: Page, prop: string) => viewport(page).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test.describe('Scroll Area', () => {
  test('the viewport scrolls natively on the vertical axis by default', async ({ page }) => {
    await gotoStory(page, 'components-scroll-area--default', TAG);
    expect(await css(page, 'overflow-y')).toBe('auto');
    expect(await css(page, 'overflow-x')).toBe('hidden');
    await viewport(page).hover();
    await page.mouse.wheel(0, 200);
    await expect.poll(() => viewport(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  });

  test('sb-scroll-bar chooses the axes', async ({ page }) => {
    await gotoStory(page, 'components-scroll-area--horizontal', TAG);
    expect(await css(page, 'overflow-x')).toBe('auto');
    expect(await css(page, 'overflow-y')).toBe('hidden');
    await gotoStory(page, 'components-scroll-area--both-axes', TAG);
    expect(await css(page, 'overflow-x')).toBe('auto');
    expect(await css(page, 'overflow-y')).toBe('auto');
    await page.locator('sb-scroll-bar[orientation="horizontal"]').evaluate((el) => el.remove());
    await expect.poll(() => css(page, 'overflow-x')).toBe('hidden');
  });

  test('while scrollable the viewport is a focus stop and a region named by label', async ({ page }) => {
    await gotoStory(page, 'components-scroll-area--default', TAG);
    await expect(page.getByRole('region', { name: 'Release notes' })).toBeVisible();
    await expect(viewport(page)).toHaveAttribute('tabindex', '0');
  });

  test('with nothing to scroll it is neither focusable nor a region', async ({ page }) => {
    await gotoStory(page, 'components-scroll-area--nothing-to-scroll', TAG);
    await expect(viewport(page)).not.toHaveAttribute('tabindex');
    await expect(viewport(page)).not.toHaveAttribute('role');
    await expect(page.getByRole('region')).toHaveCount(0);
  });

  test('overflow is re-checked when content grows or shrinks', async ({ page }) => {
    await gotoStory(page, 'components-scroll-area--nothing-to-scroll', TAG);
    await page.locator(TAG).evaluate((el) => {
      const tall = document.createElement('div');
      tall.id = 'tall';
      tall.style.height = '600px';
      el.append(tall);
    });
    await expect(viewport(page)).toHaveAttribute('tabindex', '0');
    await expect(page.getByRole('region', { name: 'Release notes' })).toBeVisible();
    await page.locator('#tall').evaluate((el) => el.remove());
    await expect(viewport(page)).not.toHaveAttribute('tabindex');
  });

  test('overflow is still detected after the element is moved in the DOM', async ({ page }) => {
    await gotoStory(page, 'components-scroll-area--nothing-to-scroll', TAG);
    await page.locator(TAG).evaluate((el) => {
      const wrap = document.createElement('div');
      document.body.append(wrap);
      wrap.append(el);
      // Only a size change: the resize observer is the one that must notice.
      (el as HTMLElement).style.height = '40px';
    });
    await expect(viewport(page)).toHaveAttribute('tabindex', '0');
    await expect(page.getByRole('region', { name: 'Release notes' })).toBeVisible();
  });

  test('Tab focuses the viewport and the arrow keys scroll it; the ring is keyboard-only', async ({ page }) => {
    await gotoStory(page, 'components-scroll-area--default', TAG);
    await viewport(page).click();
    expect(await css(page, 'box-shadow')).toBe('none');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(viewport(page)).toBeFocused();
    expect(await css(page, 'box-shadow')).toContain(await tokenColor(page.locator(TAG), '--sb-scroll-area-focus-ring-color'));
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('PageDown');
    await expect.poll(() => viewport(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(40);
    await page.keyboard.press('End');
    await expect.poll(() => viewport(page).evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1)).toBe(true);
  });

  test('scrollbars are thin and take the thumb color from the token', async ({ page }) => {
    await gotoStory(page, 'components-scroll-area--default', TAG);
    expect(await css(page, 'scrollbar-width')).toBe('thin');
    expect(await css(page, 'scrollbar-color')).toContain(await tokenColor(page.locator(TAG), '--sb-scroll-area-thumb'));
  });

  test('warns once when a scrollable area has no label', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && m.text().includes('label') && warnings.push(m.text()));
    await gotoStory(page, 'components-scroll-area--default', TAG);
    await page.evaluate(() => {
      const area = document.createElement('sb-scroll-area');
      area.style.cssText = 'display:block;height:50px';
      area.innerHTML = '<div style="height:400px">x</div>';
      document.body.append(area);
    });
    await expect.poll(() => warnings.length).toBeGreaterThan(0);
    // Resize observations re-render the area: two more frames give any duplicate its chance to appear.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    expect(warnings).toHaveLength(1);
  });

  test('screen-reader view: the scrollable viewport is a named, focused region', async ({ page }) => {
    await gotoStory(page, 'components-scroll-area--default', TAG);
    await page.keyboard.press('Tab');
    await expect(viewport(page)).toBeFocused();
    await expectScreenReaderView(page, 'scroll-area-focused');
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'horizontal', 'both-axes', 'nothing-to-scroll']) {
      await gotoStory(page, `components-scroll-area--${id}`, TAG);
      expect(await axeViolations(page, TAG), id).toEqual([]);
    }
  });
});
