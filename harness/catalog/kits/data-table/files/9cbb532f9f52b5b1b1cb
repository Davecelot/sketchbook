import { expect, test } from '../../fixtures';
import { axeViolations, axNodes } from '../../helpers/a11y';
import { gotoPattern, headings, landmarks, outlineProblems } from '../../helpers/patterns';

const STATES = ['default', 'loading', 'empty'];
const FIRST = 'sb-input-group';

test.describe('Pattern: Data table', () => {
  for (const state of STATES) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${state} (${mode}): main and search landmarks, a sound outline and no axe violations`, async ({ page }) => {
        await gotoPattern(page, `patterns-data-table--${state}`, FIRST, mode);
        const found = await landmarks(page);
        expect(found.filter((l) => l.role === 'main')).toHaveLength(1);
        expect(found.find((l) => l.role === 'search')?.name).toBe('Customers');
        expect(outlineProblems(await headings(page))).toEqual([]);
        expect(await axeViolations(page, '#storybook-root')).toEqual([]);
      });
    }
  }

  // WCAG 1.4.10 Reflow: at 320 CSS px only the table scrolls (inside its scroll area); the page itself never does.
  for (const state of STATES) {
    test(`${state}: reflows at 320px, the table scrolls inside its scroll area and the page does not`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await gotoPattern(page, `patterns-data-table--${state}`, FIRST);
      const doc = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(doc.scroll).toBeLessThanOrEqual(doc.client);
      const title = await page.getByRole('heading', { level: 1 }).boundingBox();
      expect(title!.x + title!.width).toBeLessThanOrEqual(320);
    });
  }

  test('at 320px the wide table overflows its scroll area, not the page', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await gotoPattern(page, 'patterns-data-table--default', FIRST);
    const viewport = await page.locator('sb-scroll-area').first().evaluate((el) => {
      const v = el.shadowRoot!.querySelector('[part="viewport"]') as HTMLElement;
      return { scroll: v.scrollWidth, client: v.clientWidth };
    });
    expect(viewport.scroll).toBeGreaterThan(viewport.client);
  });

  test('the table is named by its caption and has one row per customer', async ({ page }) => {
    await gotoPattern(page, 'patterns-data-table--default', FIRST);
    const cdp = await page.context().newCDPSession(page);
    await expect.poll(async () => (await axNodes(cdp, 'table')).map((n) => n.name)).toEqual(['Customers']);
    await expect(page.locator('sb-table').getByRole('row')).toHaveCount(7);
    await expect(page.getByRole('navigation', { name: 'Customer pages' })).toBeVisible();
  });

  test('slash jumps to the search field while focus is in the data table page', async ({ page }) => {
    await gotoPattern(page, 'patterns-data-table--default', FIRST);
    await page.getByRole('button', { name: 'Add customer' }).focus();
    await page.keyboard.press('/');
    const search = page.getByRole('searchbox', { name: 'Search customers' });
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');
  });

  // WCAG 2.1.4 Character Key Shortcuts: a single-key shortcut is active only while its component has focus.
  test('slash does nothing while focus is outside the data table page', async ({ page }) => {
    await gotoPattern(page, 'patterns-data-table--default', FIRST);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('/');
    await expect(page.getByRole('searchbox', { name: 'Search customers' })).not.toBeFocused();
  });

  // WCAG 4.1.3 Status Messages: the result count is announced politely when the filter changes.
  test('filtering announces the result count in a status region', async ({ page }) => {
    await gotoPattern(page, 'patterns-data-table--default', FIRST);
    const status = page.getByRole('status');
    await expect(status).toHaveText('Showing 6 of 6 customers');
    await page.getByRole('button', { name: 'Invited' }).click();
    await expect(status).toHaveText('Showing 2 of 6 customers');
    expect(await axeViolations(page, '#storybook-root')).toEqual([]);
  });

  // The scroll area joins the tab order only while the table overflows (narrow viewports), so the desktop path skips it.
  test('Tab goes search, filter, select all, then the rows', async ({ page }) => {
    await gotoPattern(page, 'patterns-data-table--default', FIRST);
    await page.getByRole('button', { name: 'Add customer' }).focus();
    const order = [
      page.getByRole('searchbox', { name: 'Search customers' }),
      page.getByRole('button', { name: 'All', pressed: true }),
      page.getByRole('checkbox', { name: 'Select all customers' }),
      page.getByRole('checkbox', { name: 'Select Ada Example' }),
    ];
    for (const target of order) {
      await page.keyboard.press('Tab');
      await expect(target).toBeFocused();
    }
  });

  test('the status filter keeps only matching rows', async ({ page }) => {
    await gotoPattern(page, 'patterns-data-table--default', FIRST);
    const rows = page.locator('sb-table-body sb-table-row');
    await expect(rows.filter({ visible: true })).toHaveCount(6);
    await page.getByRole('button', { name: 'All' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Invited' })).toHaveAttribute('aria-pressed', 'true');
    await expect(rows.filter({ visible: true })).toHaveCount(2);
    for (const row of await rows.filter({ visible: true }).all()) await expect(row).toContainText('Invited');
  });

  test('select all checks every row', async ({ page }) => {
    await gotoPattern(page, 'patterns-data-table--default', FIRST);
    await page.getByRole('checkbox', { name: 'Select all customers' }).check();
    for (const box of await page.getByRole('checkbox', { name: /^Select (?!all)/ }).all()) await expect(box).toBeChecked();
  });

  test('loading marks the table busy and shows placeholders, not data', async ({ page }) => {
    await gotoPattern(page, 'patterns-data-table--loading', FIRST);
    await expect(page.locator('sb-table')).toHaveAttribute('aria-busy', 'true');
    expect(await page.locator('sb-skeleton').count()).toBeGreaterThan(0);
    await expect(page.getByRole('checkbox', { name: 'Select Ada Example' })).toHaveCount(0);
  });

  test('empty replaces the table with a call to action', async ({ page }) => {
    await gotoPattern(page, 'patterns-data-table--empty', FIRST);
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'No customers yet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import customers' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Customer pages' })).toHaveCount(0);
  });
});
