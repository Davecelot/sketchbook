import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView, expectSolidInvalidRing } from '../../helpers/a11y';
import { countHostChanges, countHostInputs } from '../../helpers/events';
import { formEntries, mountForm } from '../../helpers/forms';
import { gotoStory } from '../../helpers/storybook';
import { tokenPx } from '../../helpers/tokens';

const TAG = 'sb-native-select';
const host = (page: Page) => page.locator(TAG).first();
const select = (page: Page) => host(page).locator('[part="select"]');
const formValid = (page: Page) =>
  page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).checkValidity());

test.describe('NativeSelect', () => {
  test('the label names the select and clicking it focuses the select', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    const box = page.getByRole('combobox', { name: 'Region' });
    await expect(box).toBeVisible();
    await host(page).locator('[part="label"]').click();
    await expect(box).toBeFocused();
    expect((await select(page).boundingBox())?.height).toBe(await tokenPx(host(page), '--sb-native-select-height'));
  });

  test('size sm takes the small control height', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--small', TAG);
    expect((await select(page).boundingBox())?.height).toBe(await tokenPx(host(page), '--sb-native-select-height-sm'));
  });

  test('light-DOM options are mirrored, including groups, disabled options and later changes', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    expect(await select(page).locator('option').allTextContents()).toEqual([
      'Choose a region', 'North', 'South', 'East', 'West', 'Central',
    ]);
    await expect(select(page).locator('option', { hasText: 'West' })).toBeDisabled();
    await host(page).evaluate((el) => {
      const option = document.createElement('option');
      option.value = 'extra';
      option.textContent = 'Extra';
      el.append(option);
      el.querySelector('option[value="north"]')!.textContent = 'Far north';
    });
    await expect(select(page).locator('option', { hasText: 'Extra' })).toHaveCount(1);
    await expect(select(page).locator('option', { hasText: 'Far north' })).toHaveCount(1);
    await gotoStory(page, 'components-nativeselect--groups', TAG);
    expect(await select(page).locator('optgroup').evaluateAll((g) => g.map((x) => (x as HTMLOptGroupElement).label))).toEqual(['Europe', 'Asia']);
    await expect(select(page).locator('optgroup').nth(1).locator('option').nth(1)).toBeDisabled();
  });

  test('selecting an option updates value and fires input and change on the host once', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    const inputs = await countHostInputs(page, TAG);
    const changes = await countHostChanges(page, TAG);
    await page.getByRole('combobox', { name: 'Region' }).selectOption('south');
    expect(await host(page).evaluate((el: HTMLElement & { value: string }) => el.value)).toBe('south');
    expect(await inputs.evaluate((c) => c.count)).toBe(1);
    expect(await changes.evaluate((c) => c.count)).toBe(1);
  });

  test('typing from the keyboard selects the matching option', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    await page.keyboard.press('Tab');
    await expect(select(page)).toBeFocused();
    await page.keyboard.type('Ce');
    await expect(select(page)).toHaveValue('central');
    expect(await host(page).evaluate((el: HTMLElement & { value: string }) => el.value)).toBe('central');
  });

  test('the value prop selects an option; the default is the first one', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    await expect(select(page)).toHaveValue('');
    await gotoStory(page, 'components-nativeselect--selected', TAG);
    await expect(select(page)).toHaveValue('south');
  });

  test('shows a focus ring on keyboard focus', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    await page.keyboard.press('Tab');
    await expect(select(page)).toBeFocused();
    expect(await select(page).evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  });

  test('hide-label keeps the accessible name', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--hidden-label', TAG);
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
    expect((await host(page).locator('[part="label"]').boundingBox())?.width).toBeLessThanOrEqual(1);
  });

  test('the chevron is hidden from assistive tech and ignores the pointer', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    await expect(host(page).locator('[part="icon"]')).toHaveAttribute('aria-hidden', 'true');
    expect(await host(page).locator('[part="icon"]').evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
  });

  test('description and error are the accessible description; error marks it invalid', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--with-description', TAG);
    await expect(page.getByRole('combobox')).toHaveAccessibleDescription('Sets the default for new entries.');
    await gotoStory(page, 'components-nativeselect--with-error', TAG);
    await expect(select(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('combobox')).toHaveAccessibleDescription('Choose a region to continue.');
    await expect(host(page).locator('[part="error"]')).toHaveAttribute('aria-live', 'polite');
  });

  test('required: native required, asterisk hidden; empty choice shows the native message after blur', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--required', TAG);
    await expect(select(page)).toHaveAttribute('required', '');
    await expect(host(page).locator('[part="required-indicator"]')).toHaveAttribute('aria-hidden', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(select(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(host(page).locator('[part="error"]')).not.toBeEmpty();
  });

  test('disabled cannot be changed', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--disabled', TAG);
    await expect(page.getByRole('combobox')).toBeDisabled();
  });

  test('takes part in forms: value, validity, reset and disabled', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    await mountForm(
      page,
      `<sb-native-select name="region" label="Pick" value="b"><option value="a">A</option><option value="b">B</option></sb-native-select>
       <sb-native-select name="req" label="Need" required><option value="">Choose</option><option value="x">X</option></sb-native-select>
       <sb-native-select name="def" label="Default"><option value="1">One</option><option value="2" selected>Two</option></sb-native-select>
       <sb-native-select name="off" label="Off" disabled><option value="o">O</option></sb-native-select>`,
    );
    expect(await formEntries(page)).toEqual([['region', 'b'], ['req', ''], ['def', '2']]);
    expect(await formValid(page)).toBe(false);
    await page.getByRole('combobox', { name: 'Pick', exact: true }).selectOption('a');
    await page.getByRole('combobox', { name: 'Need', exact: true }).selectOption('x');
    await page.getByRole('combobox', { name: 'Default', exact: true }).selectOption('1');
    expect(await formEntries(page)).toEqual([['region', 'a'], ['req', 'x'], ['def', '1']]);
    expect(await formValid(page)).toBe(true);
    await page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).reset());
    expect(await formEntries(page)).toEqual([['region', 'b'], ['req', ''], ['def', '2']]);
    await expect(page.getByRole('combobox', { name: 'Default', exact: true })).toHaveValue('2');
  });

  test('a disabled fieldset disables it and re-enabling restores it', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    await mountForm(page, '<fieldset id="fs"><sb-native-select name="a" label="Alpha" value="v"><option value="v">V</option></sb-native-select></fieldset>');
    const box = page.getByRole('combobox', { name: 'Alpha', exact: true });
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = true));
    await expect(box).toBeDisabled();
    expect(await formEntries(page)).toEqual([]);
    expect(await page.locator('form#under-test sb-native-select').evaluate((el) => el.hasAttribute('disabled'))).toBe(false);
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = false));
    await expect(box).toBeEnabled();
    expect(await formEntries(page)).toEqual([['a', 'v']]);
  });

  test('the errorMessage prop makes the field invalid for the form', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    await mountForm(page, '<sb-native-select name="a" label="Alpha" error-message="Nope."><option value="v">V</option></sb-native-select>');
    expect(await formValid(page)).toBe(false);
    await page.locator('form#under-test sb-native-select').evaluate((el) => el.removeAttribute('error-message'));
    expect(await formValid(page)).toBe(true);
  });

  test('a label for= activates the host and focuses the select', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    await mountForm(page, '<label for="ext">Outside</label><sb-native-select id="ext" name="a" label="Alpha"><option value="v">V</option></sb-native-select>');
    await page.locator('label[for="ext"]').click();
    await expect(page.getByRole('combobox', { name: 'Alpha', exact: true })).toBeFocused();
  });

  test('screen-reader view: typing selects the option the select announces', async ({ page }) => {
    await gotoStory(page, 'components-nativeselect--default', TAG);
    await page.keyboard.press('Tab');
    await expect(select(page)).toBeFocused();
    await expectScreenReaderView(page, 'native-select-focused');
    await page.keyboard.type('Ce');
    await expect(select(page)).toHaveValue('central');
    await expectScreenReaderView(page, 'native-select-central');
  });

  test('has no axe violations', async ({ page }) => {
    for (const story of ['default', 'selected', 'with-description', 'with-error', 'required', 'disabled', 'hidden-label', 'small', 'groups', 'sizes']) {
      await gotoStory(page, `components-nativeselect--${story}`, TAG);
      expect(await axeViolations(page, TAG), story).toEqual([]);
    }
  });

  test('keyboard focus on an invalid control shows a solid ring in the invalid color', async ({ page }) => {
    await expectSolidInvalidRing(page, 'components-nativeselect--with-error', 'sb-native-select', 'select', '--sb-native-select-border-invalid');
  });
});
