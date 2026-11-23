import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView, expectSolidInvalidRing } from '../../helpers/a11y';
import { countHostChanges, countHostInputs } from '../../helpers/events';
import { formEntries, mountForm } from '../../helpers/forms';
import { gotoStory } from '../../helpers/storybook';
import { tokenPx } from '../../helpers/tokens';

const TAG = 'sb-input';
const field = (page: Page) => page.locator(TAG).first();
const control = (page: Page) => field(page).locator('[part="input"]');

test.describe('Input', () => {
  test('the label names the field and clicking it focuses the input', async ({ page }) => {
    await gotoStory(page, 'components-input--default', TAG);
    const box = page.getByRole('textbox', { name: 'Email' });
    await expect(box).toBeVisible();
    await field(page).locator('[part="label"]').click();
    await expect(box).toBeFocused();
    expect((await control(page).boundingBox())?.height).toBe(await tokenPx(control(page), '--sb-input-height'));
  });

  test('hide-label keeps the accessible name but hides the text', async ({ page }) => {
    await gotoStory(page, 'components-input--hidden-label', TAG);
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
    expect((await field(page).locator('[part="label"]').boundingBox())?.width).toBeLessThanOrEqual(1);
  });

  test('description and error are the accessible description; error marks it invalid', async ({ page }) => {
    await gotoStory(page, 'components-input--with-description', TAG);
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription('We only use it for receipts.');
    await expect(control(page)).not.toHaveAttribute('aria-invalid', 'true');
    await gotoStory(page, 'components-input--with-error', TAG);
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription('Enter an email like name@example.com.');
    await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(field(page).locator('[part="error"]')).toHaveAttribute('aria-live', 'polite');
  });

  test('native validity shows after blur, not while typing the first time', async ({ page }) => {
    await gotoStory(page, 'components-input--required', TAG);
    const box = page.getByRole('textbox', { name: 'Email' });
    await box.focus();
    await box.pressSequentially('a');
    await box.press('Backspace');
    await expect(control(page)).not.toHaveAttribute('aria-invalid', 'true');
    await page.keyboard.press('Tab');
    await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(field(page).locator('[part="error"]')).not.toBeEmpty();
  });

  test('a submit attempt reveals the native error; programmatic values and reset update it', async ({ page }) => {
    await gotoStory(page, 'components-input--default', TAG);
    await mountForm(page, '<sb-input name="field" label="Field" required></sb-input>');
    const input = page.locator('form#under-test sb-input');
    const error = input.locator('[part="error"]');
    await expect(error).toBeEmpty();
    await page.locator('form#under-test').evaluate((form: HTMLFormElement) => form.requestSubmit());
    await expect(error).not.toBeEmpty();
    await input.evaluate((el: HTMLElement & { value: string }) => { el.value = 'Ready'; });
    await expect(error).toBeEmpty();
    expect(await formEntries(page)).toEqual([['field', 'Ready']]);
    await page.locator('form#under-test').evaluate((form: HTMLFormElement) => form.reset());
    await expect(input.locator('input')).toHaveValue('');
    await expect(error).toBeEmpty();
  });

  test('required: native required on the input, asterisk hidden from assistive tech', async ({ page }) => {
    await gotoStory(page, 'components-input--required', TAG);
    await expect(control(page)).toHaveAttribute('required', '');
    await expect(field(page).locator('[part="required-indicator"]')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  });

  test('input fires on every edit and change on commit, both reaching the host', async ({ page }) => {
    await gotoStory(page, 'components-input--default', TAG);
    const inputs = await countHostInputs(page, TAG);
    const changes = await countHostChanges(page, TAG);
    await page.getByRole('textbox', { name: 'Email' }).pressSequentially('ab');
    expect(await inputs.evaluate((c) => c.count)).toBe(2);
    expect(await changes.evaluate((c) => c.count)).toBe(0);
    await page.keyboard.press('Tab');
    expect(await changes.evaluate((c) => c.count)).toBe(1);
  });

  test('shows a focus ring on keyboard focus', async ({ page }) => {
    await gotoStory(page, 'components-input--default', TAG);
    await page.keyboard.press('Tab');
    await expect(control(page)).toBeFocused();
    expect(await control(page).evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  });

  test('takes part in forms: value, validity, reset and disabled', async ({ page }) => {
    await gotoStory(page, 'components-input--default', TAG);
    await mountForm(page, '<sb-input name="email" label="Work email" value="a@b.co"></sb-input><sb-input name="code" label="Code" required></sb-input><sb-input name="off" label="Off" value="x" disabled></sb-input>');
    expect(await formEntries(page)).toEqual([['email', 'a@b.co'], ['code', '']]);
    expect(await page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).checkValidity())).toBe(false);
    await page.getByRole('textbox', { name: 'Work email' }).fill('z@y.co');
    await page.getByRole('textbox', { name: 'Code' }).fill('42');
    expect(await formEntries(page)).toEqual([['email', 'z@y.co'], ['code', '42']]);
    expect(await page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).checkValidity())).toBe(true);
    await page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).reset());
    expect(await formEntries(page)).toEqual([['email', 'a@b.co'], ['code', '']]);
  });

  test('Enter in the field submits its form (implicit submission)', async ({ page }) => {
    await gotoStory(page, 'components-input--default', TAG);
    await mountForm(page, '<sb-input name="q" label="Query"></sb-input>');
    const submits = await page.evaluateHandle(() => {
      const c = { n: 0 };
      document.querySelector('form#under-test')!.addEventListener('submit', (e) => { e.preventDefault(); c.n++; });
      return c;
    });
    await page.getByRole('textbox', { name: 'Query' }).fill('abc');
    await page.getByRole('textbox', { name: 'Query' }).press('Enter');
    expect(await submits.evaluate((c) => c.n)).toBe(1);
  });

  test('aria-invalid on the host marks the inner input invalid', async ({ page }) => {
    await gotoStory(page, 'components-input--default', TAG);
    await field(page).evaluate((el) => el.setAttribute('aria-invalid', 'true'));
    await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
    await field(page).evaluate((el) => el.removeAttribute('aria-invalid'));
    await expect(control(page)).not.toHaveAttribute('aria-invalid');
  });

  test('the errorMessage prop makes the field invalid for the form', async ({ page }) => {
    await gotoStory(page, 'components-input--default', TAG);
    await mountForm(page, '<sb-input name="email" label="Work email" value="a@b.co" error-message="Already taken."></sb-input>');
    const form = () => page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).checkValidity());
    expect(await form()).toBe(false);
    await page.locator('form#under-test sb-input').evaluate((el) => el.removeAttribute('error-message'));
    expect(await form()).toBe(true);
  });

  test('screen-reader view: typing a value, then the error is described and invalid', async ({ page }) => {
    await gotoStory(page, 'components-input--with-description', TAG);
    const box = page.getByRole('textbox', { name: 'Email' });
    await box.focus();
    await page.keyboard.type('name@example.com');
    await expect(box).toHaveValue('name@example.com');
    await expectScreenReaderView(page, 'input-typed');
    await gotoStory(page, 'components-input--with-error', TAG);
    await expect(control(page)).toHaveAttribute('aria-invalid', 'true');
    await expectScreenReaderView(page, 'input-error');
  });

  test('has no axe violations', async ({ page }) => {
    for (const story of ['default', 'with-description', 'with-error', 'required', 'disabled', 'readonly', 'hidden-label']) {
      await gotoStory(page, `components-input--${story}`, TAG);
      expect(await axeViolations(page, TAG), story).toEqual([]);
    }
  });

  test('keyboard focus on an invalid control shows a solid ring in the invalid color', async ({ page }) => {
    await expectSolidInvalidRing(page, 'components-input--with-error', 'sb-input', 'input', '--sb-input-border-invalid');
  });
});
