import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView, expectSolidInvalidRing } from '../../helpers/a11y';
import { countHostChanges, countHostInputs } from '../../helpers/events';
import { formEntries, mountForm, recordEntriesOnChange, submitsOnDispatchedEnter, submitsOnEnter } from '../../helpers/forms';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-switch';
const host = (page: Page) => page.locator(TAG).first();
const input = (page: Page) => host(page).locator('[part="input"]');
const thumb = (page: Page) => host(page).locator('[part="thumb"]');
const formValid = (page: Page) =>
  page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).checkValidity());

test.describe('Switch', () => {
  test('is a switch named by its label, and clicking the label toggles it', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    const sw = page.getByRole('switch', { name: 'Offline mode' });
    await expect(sw).not.toBeChecked();
    await host(page).locator('[part="label"]').click();
    await expect(sw).toBeChecked();
    expect(await host(page).evaluate((el: HTMLElement & { selected: boolean }) => el.selected)).toBe(true);
  });

  test('wraps a native checkbox with role=switch and no aria-checked', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    await expect(input(page)).toHaveAttribute('type', 'checkbox');
    await expect(input(page)).toHaveAttribute('role', 'switch');
    await expect(input(page)).not.toHaveAttribute('aria-checked');
  });

  test('Space toggles it and the thumb moves to the end', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    const x = async () => (await thumb(page).boundingBox())!.x;
    const off = await x();
    await page.keyboard.press('Tab');
    await expect(input(page)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByRole('switch')).toBeChecked();
    // The thumb travels the track less its inset on both sides.
    const travel = (await tokenPx(host(page), '--sb-switch-width')) - (await tokenPx(host(page), '--sb-switch-thumb-size')) - 2 * (await tokenPx(host(page), '--sb-switch-inset'));
    await expect.poll(async () => Math.abs((await x()) - (off + travel))).toBeLessThanOrEqual(1);
    await page.keyboard.press('Space');
    await expect(page.getByRole('switch')).not.toBeChecked();
  });

  test('default and sm take their track and thumb size tokens', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    const px = (token: string) => tokenPx(host(page), token);
    expect(await input(page).boundingBox()).toMatchObject({ width: await px('--sb-switch-width'), height: await px('--sb-switch-height') });
    expect(await thumb(page).boundingBox()).toMatchObject({ width: await px('--sb-switch-thumb-size'), height: await px('--sb-switch-thumb-size') });
    await gotoStory(page, 'components-switch--small', TAG);
    expect(await input(page).boundingBox()).toMatchObject({ width: await px('--sb-switch-sm-width'), height: await px('--sb-switch-sm-height') });
    expect(await thumb(page).boundingBox()).toMatchObject({ width: await px('--sb-switch-sm-thumb-size'), height: await px('--sb-switch-sm-thumb-size') });
  });

  test('on uses the primary track', async ({ page }) => {
    await gotoStory(page, 'components-switch--checked', TAG);
    const bg = await input(page).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe(await tokenColor(host(page), '--sb-switch-checked-bg'));
  });

  test('in forced colors the thumb stays visible and on differs from off', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const look = async (id: string) => {
      await gotoStory(page, `components-switch--${id}`, TAG);
      return {
        track: await input(page).evaluate((el) => getComputedStyle(el).backgroundColor),
        thumb: await thumb(page).evaluate((el) => getComputedStyle(el).backgroundColor),
      };
    };
    const off = await look('default');
    const on = await look('checked');
    expect(off.thumb).not.toBe(off.track);
    expect(on.thumb).not.toBe(on.track);
    expect(on.track).not.toBe(off.track);
  });

  test('shows a focus ring on keyboard focus', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    await page.keyboard.press('Tab');
    expect(await input(page).evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  });

  test('description and error are the accessible description; error marks it invalid', async ({ page }) => {
    await gotoStory(page, 'components-switch--with-description', TAG);
    await expect(page.getByRole('switch')).toHaveAccessibleDescription('Pauses syncing until you turn it off.');
    await gotoStory(page, 'components-switch--with-error', TAG);
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('switch')).toHaveAccessibleDescription('Turn this on to continue.');
    await expect(host(page).locator('[part="error"]')).toHaveAttribute('aria-live', 'polite');
  });

  test('required: native required, asterisk hidden; off shows the native message after blur', async ({ page }) => {
    await gotoStory(page, 'components-switch--required', TAG);
    await expect(input(page)).toHaveAttribute('required', '');
    await expect(host(page).locator('[part="required-indicator"]')).toHaveAttribute('aria-hidden', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
  });

  test('hide-label keeps the accessible name', async ({ page }) => {
    await gotoStory(page, 'components-switch--hidden-label', TAG);
    await expect(page.getByRole('switch', { name: 'Show alerts' })).toBeVisible();
    expect((await host(page).locator('[part="label"]').boundingBox())?.width).toBeLessThanOrEqual(1);
  });

  test('input and change reach the host once per toggle', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    const inputs = await countHostInputs(page, TAG);
    const changes = await countHostChanges(page, TAG);
    await page.getByRole('switch').check();
    expect(await inputs.evaluate((c) => c.count)).toBe(1);
    expect(await changes.evaluate((c) => c.count)).toBe(1);
  });

  test('disabled cannot be toggled', async ({ page }) => {
    await gotoStory(page, 'components-switch--disabled', TAG);
    await expect(page.getByRole('switch')).toBeDisabled();
    await host(page).locator('[part="label"]').click({ force: true });
    await expect(page.getByRole('switch')).not.toBeChecked();
  });

  test('takes part in forms: value only while on, custom value, reset, validity', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    await mountForm(
      page,
      '<sb-switch name="news" label="News" value="yes"></sb-switch><sb-switch name="tos" label="Terms" required></sb-switch><sb-switch name="pre" label="Pre" selected></sb-switch><sb-switch name="off" label="Off" selected disabled></sb-switch>',
    );
    expect(await formEntries(page)).toEqual([['pre', 'on']]);
    expect(await formValid(page)).toBe(false);
    const seen = await recordEntriesOnChange(page);
    await page.getByRole('switch', { name: 'News', exact: true }).check();
    expect(await seen.evaluate((s) => s.at(-1))).toEqual([['news', 'yes'], ['pre', 'on']]);
    await page.getByRole('switch', { name: 'Terms', exact: true }).check();
    expect(await formValid(page)).toBe(true);
    await page.getByRole('switch', { name: 'Pre', exact: true }).uncheck();
    expect(await formEntries(page)).toEqual([['news', 'yes'], ['tos', 'on']]);
    await page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).reset());
    expect(await formEntries(page)).toEqual([['pre', 'on']]);
    await expect(page.getByRole('switch', { name: 'News', exact: true })).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Pre', exact: true })).toBeChecked();
  });

  test('a disabled fieldset disables it and re-enabling restores it', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    await mountForm(page, '<fieldset id="fs"><sb-switch name="a" label="Alpha" selected></sb-switch></fieldset>');
    const sw = page.getByRole('switch', { name: 'Alpha', exact: true });
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = true));
    await expect(sw).toBeDisabled();
    expect(await formEntries(page)).toEqual([]);
    expect(await page.locator('form#under-test sb-switch').evaluate((el) => el.hasAttribute('disabled'))).toBe(false);
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = false));
    await expect(sw).toBeEnabled();
    expect(await formEntries(page)).toEqual([['a', 'on']]);
  });

  test('the errorMessage prop makes the field invalid for the form', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    await mountForm(page, '<sb-switch name="a" label="Alpha" error-message="Nope."></sb-switch>');
    expect(await formValid(page)).toBe(false);
    await page.locator('form#under-test sb-switch').evaluate((el) => el.removeAttribute('error-message'));
    expect(await formValid(page)).toBe(true);
  });

  test('a label for= activates the host', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    await mountForm(page, '<label for="ext">Outside</label><sb-switch id="ext" name="a" label="Alpha"></sb-switch>');
    await page.locator('label[for="ext"]').click();
    await expect(page.getByRole('switch', { name: 'Alpha', exact: true })).toBeChecked();
    expect(await formEntries(page)).toEqual([['a', 'on']]);
  });

  test('Enter on the control submits its form (implicit submission)', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    expect(await submitsOnEnter(page, `<sb-switch name="a" label="Alerts"></sb-switch>`, 'sb-switch input')).toBe(1);
  });

  test('Enter on a disabled control does not submit its form', async ({ page }) => {
    await gotoStory(page, 'components-switch--default', TAG);
    expect(await submitsOnDispatchedEnter(page, `<sb-switch name="a" label="Alerts" disabled></sb-switch>`, 'sb-switch input')).toBe(0);
  });

  test('screen-reader view: Space turns it on and off', async ({ page }) => {
    await gotoStory(page, 'components-switch--with-description', TAG);
    await page.keyboard.press('Tab');
    await expect(input(page)).toBeFocused();
    await expectScreenReaderView(page, 'switch-focused');
    await page.keyboard.press('Space');
    await expect(page.getByRole('switch')).toBeChecked();
    await expectScreenReaderView(page, 'switch-on');
    await page.keyboard.press('Space');
    await expect(page.getByRole('switch')).not.toBeChecked();
    await expectScreenReaderView(page, 'switch-off');
  });

  test('has no axe violations', async ({ page }) => {
    for (const story of ['default', 'checked', 'small', 'with-description', 'with-error', 'required', 'disabled', 'disabled-checked', 'hidden-label', 'sizes']) {
      await gotoStory(page, `components-switch--${story}`, TAG);
      expect(await axeViolations(page, TAG), story).toEqual([]);
    }
  });

  test('keyboard focus on an invalid control shows a solid ring in the invalid color', async ({ page }) => {
    await expectSolidInvalidRing(page, 'components-switch--with-error', 'sb-switch', 'input', '--sb-switch-border-invalid');
  });
});
