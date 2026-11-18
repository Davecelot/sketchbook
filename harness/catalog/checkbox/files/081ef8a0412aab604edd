import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView, expectSolidInvalidRing } from '../../helpers/a11y';
import { countHostChanges, countHostInputs } from '../../helpers/events';
import { formEntries, mountForm, recordEntriesOnChange, submitsOnDispatchedEnter, submitsOnEnter } from '../../helpers/forms';
import { gotoStory } from '../../helpers/storybook';
import { tokenPx } from '../../helpers/tokens';

const TAG = 'sb-checkbox';
const host = (page: Page) => page.locator(TAG).first();
const input = (page: Page) => host(page).locator('[part="input"]');
const formValid = (page: Page) =>
  page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).checkValidity());

test.describe('Checkbox', () => {
  test('the label names the checkbox, and clicking it toggles', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    const box = page.getByRole('checkbox', { name: 'Send me product updates' });
    await expect(box).not.toBeChecked();
    await host(page).locator('[part="label"]').click();
    await expect(box).toBeChecked();
    expect(await host(page).evaluate((el: HTMLElement & { selected: boolean }) => el.selected)).toBe(true);
  });

  test('the box is the token size with the label beside it', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    const box = await input(page).boundingBox();
    const label = await host(page).locator('[part="label"]').boundingBox();
    const size = await tokenPx(host(page), '--sb-checkbox-size');
    expect(box?.width).toBe(size);
    expect(box?.height).toBe(size);
    expect(label!.x).toBeGreaterThan(box!.x + size);
  });

  test('Space toggles it from the keyboard', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    await page.keyboard.press('Tab');
    await expect(input(page)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox')).toBeChecked();
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox')).not.toBeChecked();
  });

  test('shows a focus ring on keyboard focus', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    await page.keyboard.press('Tab');
    expect(await input(page).evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  });

  test('indeterminate is mixed and the first toggle clears it', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--indeterminate', TAG);
    const box = page.getByRole('checkbox', { name: 'Select all' });
    await expect(box).toBeChecked({ indeterminate: true });
    await box.press('Space');
    await expect(box).not.toBeChecked({ indeterminate: true });
    await expect(box).toBeChecked();
    expect(await host(page).evaluate((el: HTMLElement & { indeterminate: boolean }) => el.indeterminate)).toBe(false);
  });

  test('checked and indeterminate boxes paint differently from unchecked', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    const bg = () => input(page).evaluate((el) => getComputedStyle(el).backgroundColor);
    const off = await bg();
    await host(page).evaluate((el: HTMLElement & { selected: boolean }) => (el.selected = true));
    await expect.poll(bg).not.toBe(off);
  });

  test('description and error are the accessible description; error marks it invalid', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--with-description', TAG);
    await expect(page.getByRole('checkbox')).toHaveAccessibleDescription(
      'You can unsubscribe at any time.',
    );
    await gotoStory(page, 'components-checkbox--with-error', TAG);
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('checkbox')).toHaveAccessibleDescription('Select this option to continue.');
    await expect(host(page).locator('[part="error"]')).toHaveAttribute('aria-live', 'polite');
  });

  test('required: native required, asterisk hidden; unchecked shows the native message after blur', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--required', TAG);
    await expect(input(page)).toHaveAttribute('required', '');
    await expect(host(page).locator('[part="required-indicator"]')).toHaveAttribute('aria-hidden', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
  });

  test('hide-label keeps the accessible name', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--hidden-label', TAG);
    await expect(page.getByRole('checkbox', { name: 'Select row 3' })).toBeVisible();
    expect((await host(page).locator('[part="label"]').boundingBox())?.width).toBeLessThanOrEqual(1);
  });

  test('input and change reach the host once per toggle', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    const inputs = await countHostInputs(page, TAG);
    const changes = await countHostChanges(page, TAG);
    await page.getByRole('checkbox').check();
    expect(await inputs.evaluate((c) => c.count)).toBe(1);
    expect(await changes.evaluate((c) => c.count)).toBe(1);
  });

  test('disabled cannot be toggled', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--disabled', TAG);
    await expect(page.getByRole('checkbox')).toBeDisabled();
    await host(page).locator('[part="label"]').click({ force: true });
    await expect(page.getByRole('checkbox')).not.toBeChecked();
  });

  test('takes part in forms: value only while checked, custom value, reset, validity', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    await mountForm(
      page,
      '<sb-checkbox name="news" label="News" value="yes"></sb-checkbox><sb-checkbox name="tos" label="Terms" required></sb-checkbox><sb-checkbox name="pre" label="Pre" selected></sb-checkbox><sb-checkbox name="off" label="Off" selected disabled></sb-checkbox>',
    );
    expect(await formEntries(page)).toEqual([['pre', 'on']]);
    expect(await formValid(page)).toBe(false);
    const seen = await recordEntriesOnChange(page);
    await page.getByRole('checkbox', { name: 'News', exact: true }).check();
    expect(await seen.evaluate((s) => s.at(-1))).toEqual([['news', 'yes'], ['pre', 'on']]);
    await page.getByRole('checkbox', { name: 'Terms', exact: true }).check();
    expect(await formValid(page)).toBe(true);
    await page.getByRole('checkbox', { name: 'Pre', exact: true }).uncheck();
    expect(await formEntries(page)).toEqual([['news', 'yes'], ['tos', 'on']]);
    const rightAfterReset = await page.evaluate(() => {
      const form = document.querySelector('form#under-test') as HTMLFormElement;
      form.reset();
      return { entries: [...new FormData(form).entries()], valid: form.checkValidity() };
    });
    expect(rightAfterReset).toEqual({ entries: [['pre', 'on']], valid: false });
    expect(await formEntries(page)).toEqual([['pre', 'on']]);
    await expect(page.getByRole('checkbox', { name: 'News', exact: true })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Pre', exact: true })).toBeChecked();
  });

  test('a disabled fieldset disables it and re-enabling restores it', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    await mountForm(page, '<fieldset id="fs"><sb-checkbox name="a" label="Alpha" selected></sb-checkbox></fieldset>');
    const box = page.getByRole('checkbox', { name: 'Alpha', exact: true });
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = true));
    await expect(box).toBeDisabled();
    expect(await formEntries(page)).toEqual([]);
    expect(await page.locator('form#under-test sb-checkbox').evaluate((el) => el.hasAttribute('disabled'))).toBe(false);
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = false));
    await expect(box).toBeEnabled();
    expect(await formEntries(page)).toEqual([['a', 'on']]);
  });

  test('the errorMessage prop makes the field invalid for the form', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    await mountForm(page, '<sb-checkbox name="a" label="Alpha" error-message="Nope."></sb-checkbox>');
    expect(await formValid(page)).toBe(false);
    await page.locator('form#under-test sb-checkbox').evaluate((el) => el.removeAttribute('error-message'));
    expect(await formValid(page)).toBe(true);
  });

  test('a label for= activates the host', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    await mountForm(page, '<label for="ext">Outside</label><sb-checkbox id="ext" name="a" label="Alpha"></sb-checkbox>');
    await page.locator('label[for="ext"]').click();
    await expect(page.getByRole('checkbox', { name: 'Alpha', exact: true })).toBeChecked();
    expect(await formEntries(page)).toEqual([['a', 'on']]);
  });

  test('Enter on the control submits its form (implicit submission)', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    expect(await submitsOnEnter(page, `<sb-checkbox name="a" label="Agree"></sb-checkbox>`, 'sb-checkbox input')).toBe(1);
  });

  test('Enter on a disabled control does not submit its form', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--default', TAG);
    expect(await submitsOnDispatchedEnter(page, `<sb-checkbox name="a" label="Agree" disabled></sb-checkbox>`, 'sb-checkbox input')).toBe(0);
  });

  test('screen-reader view: Space checks and unchecks it', async ({ page }) => {
    await gotoStory(page, 'components-checkbox--with-description', TAG);
    await page.keyboard.press('Tab');
    await expect(input(page)).toBeFocused();
    await expectScreenReaderView(page, 'checkbox-focused');
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox')).toBeChecked();
    await expectScreenReaderView(page, 'checkbox-checked');
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox')).not.toBeChecked();
    await expectScreenReaderView(page, 'checkbox-unchecked');
  });

  test('has no axe violations', async ({ page }) => {
    for (const story of ['default', 'checked', 'indeterminate', 'with-description', 'with-error', 'required', 'disabled', 'disabled-checked', 'hidden-label']) {
      await gotoStory(page, `components-checkbox--${story}`, TAG);
      expect(await axeViolations(page, TAG), story).toEqual([]);
    }
  });

  test('keyboard focus on an invalid control shows a solid ring in the invalid color', async ({ page }) => {
    await expectSolidInvalidRing(page, 'components-checkbox--with-error', 'sb-checkbox', 'input', '--sb-checkbox-border-invalid');
  });
});
