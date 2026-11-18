import { readFileSync } from 'node:fs';
import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { ROOT } from '../../helpers/foundations';

const { icons } = JSON.parse(readFileSync(`${ROOT}spec/icons.json`, 'utf8')) as { icons: Record<string, { category: string }> };

test.describe('Foundations / Icons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-icons--page&viewMode=story', { waitUntil: 'load' });
    await expect(page.locator('main[data-icon-library]')).toBeVisible();
  });

  test('shows every icon of spec/icons.json, named and drawn', async ({ page }) => {
    const shown = await page.locator('[data-icon]').evaluateAll((els) => els.map((el) => [el.getAttribute('data-icon'), el.querySelectorAll('svg > *').length > 0]));
    expect(shown.map(([name]) => name).sort()).toEqual(Object.keys(icons).sort());
    expect(shown.every(([, drawn]) => drawn)).toBe(true);
  });

  test('groups icons under a heading per category', async ({ page }) => {
    const categories = [...new Set(Object.values(icons).map((i) => i.category))];
    await expect(page.locator('main h2')).toHaveCount(categories.length);
  });

  test('search filters icons by name and hides empty categories', async ({ page }) => {
    const [name = ''] = Object.keys(icons);
    await page.getByRole('searchbox', { name: 'Search icons' }).fill(name);
    await expect(page.locator(`[data-icon="${name}"]`)).toBeVisible();
    const other = Object.keys(icons).find((n) => !n.includes(name))!;
    await expect(page.locator(`[data-icon="${other}"]`)).not.toBeVisible();
    await expect(page.locator('main section:not([hidden])')).toHaveCount(1);
    await page.getByRole('searchbox', { name: 'Search icons' }).fill('zzzz-no-such-icon');
    await expect(page.locator('[data-icon]:not([hidden])')).toHaveCount(0);
  });

  test('has no axe violations', async ({ page }) => {
    expect(await axeViolations(page, 'main[data-icon-library]')).toEqual([]);
  });
});
