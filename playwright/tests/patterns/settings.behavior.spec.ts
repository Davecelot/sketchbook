import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { countSubmits, gotoPattern, headings, landmarks, outlineProblems } from '../../helpers/patterns';

const STATES = ['default', 'notifications', 'saved'];
const FIRST = 'sb-tabs';

test.describe('Pattern: Settings', () => {
  for (const state of STATES) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${state} (${mode}): one main, a sound outline and no axe violations`, async ({ page }) => {
        await gotoPattern(page, `patterns-settings--${state}`, FIRST, mode);
        expect((await landmarks(page)).filter((l) => l.role === 'main')).toHaveLength(1);
        expect(outlineProblems(await headings(page))).toEqual([]);
        expect(await axeViolations(page, '#storybook-root')).toEqual([]);
      });
    }
  }

  test('sections are tabs; arrows switch them and the panel takes the next Tab', async ({ page }) => {
    await gotoPattern(page, 'patterns-settings--default', FIRST);
    await expect(page.getByRole('tablist', { name: 'Settings sections' })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tab', { name: 'General' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Notifications' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'Notifications', level: 2 })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('sb-tabs-content[value="notifications"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('switch', { name: 'Mentions' })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByRole('switch', { name: 'Mentions' })).not.toBeChecked();
  });

  test('general settings walk in order and Save submits the form', async ({ page }) => {
    await gotoPattern(page, 'patterns-settings--default', FIRST);
    const submits = await countSubmits(page, 'form[aria-labelledby="general-title"]');
    await page.locator('sb-tabs-content[value="general"]').focus();
    const order = [
      page.getByRole('combobox', { name: 'Language' }),
      page.getByRole('combobox', { name: 'Time zone' }),
      page.getByRole('radio', { name: 'Monday' }),
      page.getByRole('textbox', { name: 'Email signature' }),
      page.getByRole('button', { name: 'Cancel' }),
      page.getByRole('button', { name: 'Save changes' }),
    ];
    for (const target of order) {
      await page.keyboard.press('Tab');
      await expect(target).toBeFocused();
    }
    await page.keyboard.press('Enter');
    expect(await submits.evaluate((c) => c.n)).toBe(1);
  });

  test('the slider moves by its step with the arrow keys', async ({ page }) => {
    await gotoPattern(page, 'patterns-settings--notifications', FIRST);
    const slider = page.getByRole('slider', { name: 'Reminder lead time' });
    await expect(slider).toHaveValue('15');
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('20');
  });

  test('saved shows a polite status, not an alert', async ({ page }) => {
    await gotoPattern(page, 'patterns-settings--saved', FIRST);
    await expect(page.getByRole('status')).toContainText('Changes saved');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
