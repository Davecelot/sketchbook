import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoPattern, headings, landmarks, outlineProblems } from '../../helpers/patterns';

const STATES = ['default', 'loading'];
const FIRST = 'sb-card';

test.describe('Pattern: Dashboard', () => {
  for (const state of STATES) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${state} (${mode}): banner and main, a sound outline and no axe violations`, async ({ page }) => {
        await gotoPattern(page, `patterns-dashboard--${state}`, FIRST, mode);
        const roles = (await landmarks(page)).map((l) => l.role);
        expect(roles.filter((r) => r === 'banner')).toHaveLength(1);
        expect(roles.filter((r) => r === 'main')).toHaveLength(1);
        expect(outlineProblems(await headings(page))).toEqual([]);
        expect(await axeViolations(page, '#storybook-root')).toEqual([]);
      });
    }
  }

  test('each stat card is a level-2 heading with its value', async ({ page }) => {
    await gotoPattern(page, 'patterns-dashboard--default', FIRST);
    for (const name of ['Revenue', 'Active customers', 'Open orders', 'Refund rate']) await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Quarterly goal' })).toHaveAttribute('aria-valuenow', '68');
    await expect(page.getByRole('table', { name: 'Recent orders' })).toBeVisible();
    await expect(page.getByRole('img', { name: /Weekly visits/ })).toBeVisible();
  });

  test('Tab reaches the page action, then the view tabs; arrows switch views', async ({ page }) => {
    await gotoPattern(page, 'patterns-dashboard--default', FIRST);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Export' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Reports' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('sb-tabs-content[value="reports"]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Revenue' })).toHaveCount(0);
  });

  test('loading announces itself once and hides the numbers behind placeholders', async ({ page }) => {
    await gotoPattern(page, 'patterns-dashboard--loading', FIRST);
    await expect(page.getByRole('status', { name: 'Loading the overview' })).toBeVisible();
    await expect(page.locator('sb-tabs-content[value="overview"]')).toHaveAttribute('aria-busy', 'true');
    expect(await page.locator('sb-skeleton').count()).toBeGreaterThanOrEqual(4);
    await expect(page.getByText('$48,200')).toHaveCount(0);
  });
});
