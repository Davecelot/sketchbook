import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, axNodes } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { systemColor } from '../../helpers/styles';
import { tokenColor, tokenLength, tokenNumber } from '../../helpers/tokens';

const TAG = 'sb-table';
const css = (page: Page, selector: string, prop: string, nth = 0) =>
  page.locator(selector).nth(nth).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
const mixed = (page: Page, token: string) =>
  page.locator(TAG).evaluate((el, t) => {
    const probe = document.createElement('span');
    probe.style.color = `color-mix(in oklab, var(${t}) 50%, transparent)`;
    el.after(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);

test.describe('Table', () => {
  test('exposes table, rowgroup, row, columnheader and cell roles', async ({ page }) => {
    await gotoStory(page, 'components-table--default', TAG);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('rowgroup')).toHaveCount(3);
    await expect(page.getByRole('row')).toHaveCount(6);
    await expect(page.getByRole('columnheader')).toHaveCount(4);
    await expect(page.getByRole('cell', { name: 'ORD-1003' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('an author role on sb-table is kept; a head or cell role can be overridden', async ({ page }) => {
    await gotoStory(page, 'components-table--default', TAG);
    const roles = await page.evaluate(async () => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<sb-table id="grid" role="grid"><sb-table-body><sb-table-row><sb-table-head id="rh" role="rowheader">Row</sb-table-head><sb-table-cell>x</sb-table-cell></sb-table-row></sb-table-body></sb-table>',
      );
      await Promise.all([...document.querySelectorAll('#grid, #grid *')].flatMap((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete ?? []));
      return [document.getElementById('grid')!.getAttribute('role'), document.getElementById('rh')!.getAttribute('role')];
    });
    expect(roles).toEqual(['grid', 'rowheader']);
    await expect(page.locator('#rh')).toHaveRole('rowheader');
  });

  test('the caption names the table; an aria-label does too', async ({ page }) => {
    await gotoStory(page, 'components-table--default', TAG);
    const cdp = await page.context().newCDPSession(page);
    await expect.poll(async () => (await axNodes(cdp, 'table')).map((n) => n.name)).toEqual(['Recent orders']);
    await gotoStory(page, 'components-table--labelled-by-attribute', TAG);
    await expect(page.getByRole('table', { name: 'Stock levels' })).toBeVisible();
  });

  test('without element references, the copied caption name follows caption changes', async ({ page }) => {
    await gotoStory(page, 'components-table--default', TAG);
    const label = await page.evaluate(async () => {
      delete (ElementInternals.prototype as Partial<ElementInternals>).ariaLabelledByElements;
      const root = document.querySelector('#storybook-root')!;
      root.innerHTML = '<sb-table><sb-table-caption>First</sb-table-caption></sb-table>';
      const table = root.querySelector('sb-table') as HTMLElement & { updateComplete: Promise<unknown> };
      await table.updateComplete;
      const before = table.getAttribute('aria-label');
      root.querySelector('sb-table-caption')!.textContent = 'Second';
      await new Promise((r) => setTimeout(r));
      return [before, table.getAttribute('aria-label')];
    });
    expect(label).toEqual(['First', 'Second']);
  });

  test('a wide table in a labelled scroll area is a keyboard-reachable, named region', async ({ page }) => {
    await gotoStory(page, 'components-table--wide-in-scroll-area', TAG);
    await page.keyboard.press('Tab');
    const region = page.getByRole('region', { name: 'Recent orders' });
    await expect(region).toBeFocused();
    const before = await region.evaluate((el) => el.scrollLeft);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
  });

  test('hosts use CSS table display and columns line up', async ({ page }) => {
    await gotoStory(page, 'components-table--default', TAG);
    const displays = await Promise.all(
      ['sb-table', 'sb-table-header', 'sb-table-body', 'sb-table-footer', 'sb-table-row', 'sb-table-head', 'sb-table-cell', 'sb-table-caption'].map((s) => css(page, s, 'display')),
    );
    expect(displays).toEqual(['table', 'table-header-group', 'table-row-group', 'table-footer-group', 'table-row', 'table-cell', 'table-cell', 'table-caption']);
    const x = async (selector: string, nth: number) => (await page.locator(selector).nth(nth).boundingBox())!.x;
    expect(await x('sb-table-cell', 1)).toBe(await x('sb-table-head', 1));
    expect(await x('sb-table-cell', 5)).toBe(await x('sb-table-head', 1));
  });

  test('head height and cell padding come from tokens', async ({ page }) => {
    await gotoStory(page, 'components-table--default', TAG);
    const table = page.locator(TAG);
    expect(await css(page, 'sb-table-head', 'height')).toBe(await tokenLength(table, '--sb-table-head-height'));
    expect(await css(page, 'sb-table-cell', 'padding-top')).toBe(await tokenLength(table, '--sb-table-cell-padding'));
    expect(await css(page, 'sb-table-head', 'padding-left')).toBe(await tokenLength(table, '--sb-table-head-padding-x'));
    expect(await css(page, 'sb-table-head', 'font-weight')).toBe(String(await tokenNumber(table, '--sb-table-head-font-weight')));
  });

  test('rows have a bottom border except the last body row; the footer has a top border and fill', async ({ page }) => {
    await gotoStory(page, 'components-table--default', TAG);
    const border = await tokenColor(page.locator(TAG), '--sb-table-border');
    expect(await css(page, 'sb-table-header sb-table-row', 'border-bottom-color')).toBe(border);
    expect(await css(page, 'sb-table-body sb-table-row', 'border-bottom-width', 0)).toBe(await tokenLength(page.locator(TAG), '--sb-table-border-width'));
    expect(await css(page, 'sb-table-body sb-table-row', 'border-bottom-width', 3)).toBe('0px');
    expect(await css(page, 'sb-table-footer', 'border-top-width')).toBe(await tokenLength(page.locator(TAG), '--sb-table-border-width'));
    expect(await css(page, 'sb-table-footer', 'background-color')).toBe(await mixed(page, '--sb-table-footer-bg'));
    expect(await css(page, 'sb-table-footer', 'font-weight')).toBe('500');
  });

  test('hover fills a body row', async ({ page }) => {
    await gotoStory(page, 'components-table--default', TAG);
    await page.locator('sb-table-body sb-table-row').nth(1).hover();
    await expect.poll(() => css(page, 'sb-table-body sb-table-row', 'background-color', 1)).toBe(await mixed(page, '--sb-table-row-hover-bg'));
    expect(await css(page, 'sb-table-body sb-table-row', 'background-color', 0)).toBe('rgba(0, 0, 0, 0)');
  });

  test('selected rows are filled and aria-selected', async ({ page }) => {
    await gotoStory(page, 'components-table--selected-row', TAG);
    const row = page.locator('sb-table-body sb-table-row').nth(1);
    await expect(row).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('sb-table-row[aria-selected]')).toHaveCount(1);
    expect(await css(page, 'sb-table-row[selected]', 'background-color')).toBe(await tokenColor(page.locator(TAG), '--sb-table-row-selected-bg'));
    await row.evaluate((el) => el.removeAttribute('selected'));
    await expect(row).not.toHaveAttribute('aria-selected');
  });

  test('the selected row has a 3:1 outline, not only a fill', async ({ page }) => {
    await gotoStory(page, 'components-table--selected-row', TAG);
    expect(await css(page, 'sb-table-row[selected]', 'outline-style')).toBe('solid');
    expect(await css(page, 'sb-table-row[selected]', 'outline-color')).toBe(await tokenColor(page.locator(TAG), '--sb-table-row-selected-border'));
    expect(await css(page, 'sb-table-body sb-table-row:not([selected])', 'outline-style')).toBe('none');
  });

  test('in forced colors the selected row is outlined in the system highlight', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-table--selected-row', TAG);
    expect(await css(page, 'sb-table-row[selected]', 'outline-style')).toBe('solid');
    expect(await css(page, 'sb-table-row[selected]', 'outline-color')).toBe(await systemColor(page, 'Highlight'));
    expect(await css(page, 'sb-table-body sb-table-row:not([selected])', 'outline-style')).toBe('none');
  });

  test('the caption draws below the table in the muted color', async ({ page }) => {
    await gotoStory(page, 'components-table--default', TAG);
    const caption = (await page.locator('sb-table-caption').boundingBox())!;
    const footer = (await page.locator('sb-table-footer').boundingBox())!;
    expect(caption.y).toBeGreaterThanOrEqual(footer.y + footer.height);
    expect(await css(page, 'sb-table-caption', 'color')).toBe(await tokenColor(page.locator(TAG), '--sb-table-caption-fg'));
    await expect(page.locator('sb-table-caption')).toHaveAttribute('role', 'caption');
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'selected-row', 'labelled-by-attribute']) {
      await gotoStory(page, `components-table--${id}`, TAG);
      expect(await axeViolations(page, TAG), id).toEqual([]);
    }
  });
});
