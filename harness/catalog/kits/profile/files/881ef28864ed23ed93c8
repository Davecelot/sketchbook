import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { countSubmits, gotoPattern, headings, landmarks, outlineProblems } from '../../helpers/patterns';

const STATES = ['default', 'with-errors'];
const FIRST = 'sb-avatar';

test.describe('Pattern: Profile', () => {
  for (const state of STATES) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${state} (${mode}): breadcrumb and main, a sound outline and no axe violations`, async ({ page }) => {
        await gotoPattern(page, `patterns-profile--${state}`, FIRST, mode);
        const found = await landmarks(page);
        expect(found.filter((l) => l.role === 'main')).toHaveLength(1);
        expect(found).toContainEqual({ role: 'navigation', name: 'Breadcrumb' });
        expect(outlineProblems(await headings(page))).toEqual([]);
        expect(await axeViolations(page, '#storybook-root')).toEqual([]);
      });
    }
  }

  test('the person is the h1, the breadcrumb marks the current page', async ({ page }) => {
    await gotoPattern(page, 'patterns-profile--default', FIRST);
    await expect(page.getByRole('heading', { level: 1, name: 'Ada Example' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Ada Example' })).toBeVisible();
    await expect(page.locator('sb-breadcrumb-page')).toHaveText('Profile');
    await expect(page.locator('sb-breadcrumb-page [aria-current="page"]')).toHaveCount(1);
  });

  test('Tab walks breadcrumb, form, then the connected accounts', async ({ page }) => {
    await gotoPattern(page, 'patterns-profile--default', FIRST);
    const order = [
      page.getByRole('link', { name: 'Home' }),
      page.getByRole('link', { name: 'Account' }),
      page.getByRole('textbox', { name: 'Display name' }),
      page.getByRole('textbox', { name: 'Job title' }),
      page.getByRole('textbox', { name: 'Bio' }),
      page.getByRole('button', { name: 'Save profile' }),
      page.getByRole('button', { name: 'Disconnect Calendar' }),
      page.getByRole('button', { name: 'Disconnect Storage' }),
    ];
    for (const target of order) {
      await page.keyboard.press('Tab');
      await expect(target).toBeFocused();
    }
  });

  test('Enter in a field saves the profile', async ({ page }) => {
    await gotoPattern(page, 'patterns-profile--default', FIRST);
    const submits = await countSubmits(page);
    await page.getByRole('textbox', { name: 'Job title' }).press('Enter');
    expect(await submits.evaluate((c) => c.n)).toBe(1);
  });

  test('with errors, the invalid field is described by its error and the form does not submit', async ({ page }) => {
    await gotoPattern(page, 'patterns-profile--with-errors', FIRST);
    const name = page.getByRole('textbox', { name: 'Display name' });
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription(/Enter the name people see/);
    const submits = await countSubmits(page);
    await page.getByRole('button', { name: 'Save profile' }).click();
    expect(await submits.evaluate((c) => c.n)).toBe(0);
  });
});
