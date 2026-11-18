import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView, expectSolidInvalidRing } from '../../helpers/a11y';
import { countHostChanges, countHostInputs } from '../../helpers/events';
import { formEntries, mountForm } from '../../helpers/forms';
import { gotoStory } from '../../helpers/storybook';
import { tokenPx } from '../../helpers/tokens';

const TAG = 'sb-textarea';
const field = (page: Page) => page.locator(TAG).first();
const control = (page: Page) => field(page).locator('[part="textarea"]');
const formValid = (page: Page) =>
  page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).checkValidity());

test.describe('Textarea', () => {
  test('the label names the field, clicking it focuses the textarea, min height follows the token', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    const box = page.getByRole('textbox', { name: 'Message' });
    await expect(box).toBeVisible();
    await field(page).locator('[part="label"]').click();
    await expect(box).toBeFocused();
    expect((await control(page).boundingBox())?.height).toBeGreaterThanOrEqual(await tokenPx(field(page), '--sb-textarea-min-height'));
    expect(await control(page).evaluate((el) => getComputedStyle(el).resize)).toBe('vertical');
  });

  test('hide-label keeps the accessible name but hides the text', async ({ page }) => {
    await gotoStory(page, 'components-textarea--hidden-label', TAG);
    await expect(page.getByRole('textbox', { name: 'Notes' })).toBeVisible();
    expect((await field(page).locator('[part="label"]').boundingBox())?.width).toBeLessThanOrEqual(1);
  });

  test('description and error are the accessible description; error marks it invalid', async ({ page }) => {
    await gotoStory(page, 'components-textarea--with-description', TAG);
    await expect(page.getByRole('textbox', { name: 'Message' })).toHaveAccessibleDescription(
      'Plain text, up to a few paragraphs.',
    );
    await expect(control(page)).not.toHaveAttribute('aria-invalid', 'true');
    await gotoStory(page, 'components-textarea--with-error', TAG);
    await expect(page.getByRole('textbox', { name: 'Message' })).toHaveAccessibleDescription(
      'Write at least 20 characters.',
    );
    await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(field(page).locator('[part="error"]')).toHaveAttribute('aria-live', 'polite');
  });

  test('native validity shows after blur, not while typing the first time', async ({ page }) => {
    await gotoStory(page, 'components-textarea--required', TAG);
    const box = page.getByRole('textbox', { name: 'Message' });
    await box.focus();
    await box.pressSequentially('a');
    await box.press('Backspace');
    await expect(control(page)).not.toHaveAttribute('aria-invalid', 'true');
    await page.keyboard.press('Tab');
    await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(field(page).locator('[part="error"]')).not.toBeEmpty();
  });

  test('required: native required, asterisk hidden from assistive tech', async ({ page }) => {
    await gotoStory(page, 'components-textarea--required', TAG);
    await expect(control(page)).toHaveAttribute('required', '');
    await expect(field(page).locator('[part="required-indicator"]')).toHaveAttribute('aria-hidden', 'true');
  });

  test('input fires on every edit and change on commit, both reaching the host', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    const inputs = await countHostInputs(page, TAG);
    const changes = await countHostChanges(page, TAG);
    await page.getByRole('textbox', { name: 'Message' }).pressSequentially('ab');
    expect(await inputs.evaluate((c) => c.count)).toBe(2);
    expect(await changes.evaluate((c) => c.count)).toBe(0);
    await page.keyboard.press('Tab');
    expect(await changes.evaluate((c) => c.count)).toBe(1);
  });

  test('Enter inserts a newline and does not submit the form', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    await mountForm(page, '<sb-textarea name="note" label="Note"></sb-textarea>');
    const submits = await page.evaluateHandle(() => {
      const c = { n: 0 };
      document.querySelector('form#under-test')!.addEventListener('submit', (e) => {
        e.preventDefault();
        c.n++;
      });
      return c;
    });
    const box = page.getByRole('textbox', { name: 'Note' });
    await box.focus();
    await page.keyboard.type('one');
    await page.keyboard.press('Enter');
    await page.keyboard.type('two');
    expect(await submits.evaluate((c) => c.n)).toBe(0);
    expect(await formEntries(page)).toEqual([['note', 'one\ntwo']]);
  });

  test('shows a focus ring on keyboard focus', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    await page.keyboard.press('Tab');
    await expect(control(page)).toBeFocused();
    expect(await control(page).evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  });

  test('takes part in forms: value, validity, reset and disabled', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    await mountForm(
      page,
      '<sb-textarea name="bio" label="Bio" value="hello"></sb-textarea><sb-textarea name="why" label="Why" required></sb-textarea><sb-textarea name="off" label="Off" value="x" disabled></sb-textarea>',
    );
    expect(await formEntries(page)).toEqual([['bio', 'hello'], ['why', '']]);
    expect(await formValid(page)).toBe(false);
    await page.getByRole('textbox', { name: 'Bio' }).fill('multi\nline');
    await page.getByRole('textbox', { name: 'Why' }).fill('because');
    expect(await formEntries(page)).toEqual([['bio', 'multi\nline'], ['why', 'because']]);
    expect(await formValid(page)).toBe(true);
    await page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).reset());
    expect(await formEntries(page)).toEqual([['bio', 'hello'], ['why', '']]);
    await expect(page.getByRole('textbox', { name: 'Why' })).toHaveValue('');
  });

  test('minlength makes a short value invalid', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    await mountForm(page, '<sb-textarea name="n" label="N" minlength="5"></sb-textarea>');
    await page.getByRole('textbox', { name: 'N', exact: true }).fill('abc');
    expect(await page.locator('form#under-test sb-textarea').evaluate((el: HTMLElement & { validity: ValidityState }) => el.validity.tooShort)).toBe(true);
    await page.getByRole('textbox', { name: 'N', exact: true }).fill('abcdef');
    expect(await formValid(page)).toBe(true);
  });

  test('a disabled fieldset disables it and re-enabling restores it', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    await mountForm(page, '<fieldset id="fs"><sb-textarea name="a" label="A" value="v"></sb-textarea></fieldset>');
    const box = page.getByRole('textbox', { name: 'A', exact: true });
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = true));
    await expect(box).toBeDisabled();
    expect(await formEntries(page)).toEqual([]);
    expect(await page.locator('form#under-test sb-textarea').evaluate((el) => el.hasAttribute('disabled'))).toBe(false);
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = false));
    await expect(box).toBeEnabled();
    expect(await formEntries(page)).toEqual([['a', 'v']]);
  });

  test('aria-invalid on the host marks the inner textarea invalid', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    await field(page).evaluate((el) => el.setAttribute('aria-invalid', 'true'));
    await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
    await field(page).evaluate((el) => el.removeAttribute('aria-invalid'));
    await expect(control(page)).not.toHaveAttribute('aria-invalid');
  });

  test('the errorMessage prop makes the field invalid for the form', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    await mountForm(page, '<sb-textarea name="a" label="A" value="x" error-message="Nope."></sb-textarea>');
    expect(await formValid(page)).toBe(false);
    await page.locator('form#under-test sb-textarea').evaluate((el) => el.removeAttribute('error-message'));
    expect(await formValid(page)).toBe(true);
  });

  test('a label for= activates the host and focuses the textarea', async ({ page }) => {
    await gotoStory(page, 'components-textarea--default', TAG);
    await mountForm(page, '<label for="ext">Outside</label><sb-textarea id="ext" name="a" label="A"></sb-textarea>');
    await page.locator('label[for="ext"]').click();
    await expect(page.getByRole('textbox', { name: 'A', exact: true })).toBeFocused();
  });

  test('screen-reader view: typing a value, then the error is described and invalid', async ({ page }) => {
    await gotoStory(page, 'components-textarea--with-description', TAG);
    const box = page.getByRole('textbox', { name: 'Message' });
    await box.focus();
    await page.keyboard.type('Hello there');
    await expect(box).toHaveValue('Hello there');
    await expectScreenReaderView(page, 'textarea-typed');
    await gotoStory(page, 'components-textarea--with-error', TAG);
    await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
    await expectScreenReaderView(page, 'textarea-error');
  });

  test('has no axe violations', async ({ page }) => {
    for (const story of ['default', 'with-description', 'with-error', 'required', 'disabled', 'readonly', 'hidden-label']) {
      await gotoStory(page, `components-textarea--${story}`, TAG);
      expect(await axeViolations(page, TAG), story).toEqual([]);
    }
  });

  test('keyboard focus on an invalid control shows a solid ring in the invalid color', async ({ page }) => {
    await expectSolidInvalidRing(page, 'components-textarea--with-error', 'sb-textarea', 'textarea', '--sb-textarea-border-invalid');
  });
});
