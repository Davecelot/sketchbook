import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoPattern, headings, landmarks, outlineProblems } from '../../helpers/patterns';

const STATES = ['default', 'right-to-left'];
const FIRST = 'sb-input';

test.describe('Pattern: Form states', () => {
  for (const state of STATES) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${state} (${mode}): one main, a sound outline and no axe violations`, async ({ page }) => {
        await gotoPattern(page, `patterns-form-states--${state}`, FIRST, mode);
        expect((await landmarks(page)).filter((l) => l.role === 'main')).toHaveLength(1);
        expect(outlineProblems(await headings(page))).toEqual([]);
        expect(await axeViolations(page, '#storybook-root')).toEqual([]);
      });
    }
  }

  test('one section per control, each with its states', async ({ page }) => {
    await gotoPattern(page, 'patterns-form-states--default', FIRST);
    const sections = ['Input', 'Input group', 'Textarea', 'Native select', 'Checkbox', 'Radio group', 'Switch', 'Slider', 'Toggle', 'Toggle group', 'Field and label'];
    for (const name of sections) await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  });

  test('Tab skips disabled controls and stops on read-only ones', async ({ page }) => {
    await gotoPattern(page, 'patterns-form-states--default', FIRST);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: 'Default input' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: 'Invalid input' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: 'Read-only input' })).toBeFocused();
    await expect(page.getByRole('textbox', { name: 'Disabled input' })).toBeDisabled();
  });

  test('every invalid control says so and is described by its error', async ({ page }) => {
    await gotoPattern(page, 'patterns-form-states--default', FIRST);
    for (const name of ['Invalid input', 'Invalid textarea']) {
      const box = page.getByRole('textbox', { name });
      await expect(box).toHaveAttribute('aria-invalid', 'true');
      await expect(box).toHaveAccessibleDescription(/.+/);
    }
    await expect(page.getByRole('combobox', { name: 'Invalid select' })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('checkbox', { name: 'Invalid checkbox' })).toHaveAttribute('aria-invalid', 'true');
  });

  test('every disabled control is disabled to assistive technology too', async ({ page }) => {
    await gotoPattern(page, 'patterns-form-states--default', FIRST);
    await expect(page.getByRole('textbox', { name: 'Disabled textarea' })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Disabled select' })).toBeDisabled();
    await expect(page.getByRole('checkbox', { name: 'Disabled checkbox' })).toBeDisabled();
    await expect(page.getByRole('switch', { name: 'Disabled switch' })).toBeDisabled();
    await expect(page.getByRole('slider', { name: 'Disabled slider' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Disabled toggle' })).toBeDisabled();
  });

  test('right to left mirrors the gallery', async ({ page }) => {
    await gotoPattern(page, 'patterns-form-states--right-to-left', FIRST);
    expect(await page.getByRole('textbox', { name: 'Default input' }).evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
  });
});
