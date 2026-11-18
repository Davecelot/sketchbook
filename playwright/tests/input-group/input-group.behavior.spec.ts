import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectSolidInvalidRing } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenLength, tokenNumber, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-input-group';
const shell = (page: Page) => page.locator(`${TAG} [part="group"]`).first();
const shellStyle = (page: Page, prop: string) => shell(page).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test.describe('Input Group', () => {
  test('shell is at least the control height and has a token border; the slotted sb-input draws none', async ({ page }) => {
    await gotoStory(page, 'components-input-group--default', TAG);
    // A min-height: addons whose padding grows with the spacing grid can lift it, never below the token.
    expect((await shell(page).boundingBox())?.height).toBeGreaterThanOrEqual(await tokenPx(page.locator(TAG), '--sb-input-group-height'));
    expect(await shellStyle(page, 'border-top-color')).toBe(await tokenColor(page.locator(TAG), '--sb-input-group-border'));
    const input = page.locator('sb-input [part="input"]');
    expect(await input.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgba(0, 0, 0, 0)');
    expect(await input.evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none');
    expect(await input.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  });

  test('a native input has no border of its own and the shell keeps the control height', async ({ page }) => {
    await gotoStory(page, 'components-input-group--native-input', TAG);
    expect(await page.locator('input').evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('0px');
    expect((await shell(page).boundingBox())?.height).toBeGreaterThanOrEqual(await tokenPx(page.locator(TAG), '--sb-input-group-height'));
  });

  test('addons are ordered by align', async ({ page }) => {
    await gotoStory(page, 'components-input-group--with-text', TAG);
    const [start, control, end] = await Promise.all([
      page.locator('sb-input-group-addon').nth(0).boundingBox(),
      page.locator('sb-input').boundingBox(),
      page.locator('sb-input-group-addon').nth(1).boundingBox(),
    ]);
    expect(start!.x).toBeLessThan(control!.x);
    expect(end!.x).toBeGreaterThan(control!.x);
    await expect(page.locator('sb-input-group-addon').nth(0)).toHaveAttribute('align', 'inline-start');
  });

  test('block addons stack the shell: start above, end below', async ({ page }) => {
    await gotoStory(page, 'components-input-group--textarea-footer', TAG);
    const [area, footer] = await Promise.all([page.locator('textarea').boundingBox(), page.locator('sb-input-group-addon').boundingBox()]);
    expect(footer!.y).toBeGreaterThan(area!.y + area!.height - 1);
    await gotoStory(page, 'components-input-group--block-start', TAG);
    const [area2, header] = await Promise.all([page.locator('textarea').boundingBox(), page.locator('sb-input-group-addon').boundingBox()]);
    expect(header!.y).toBeLessThan(area2!.y);
  });

  test('focus in the control rings the shell once; an addon button does not', async ({ page }) => {
    await gotoStory(page, 'components-input-group--with-button', TAG);
    const resting = await shellStyle(page, 'box-shadow');
    await page.locator('input').focus();
    await expect(shell(page)).toHaveAttribute('data-focused', '');
    await expect.poll(() => shellStyle(page, 'box-shadow')).toContain(await tokenLength(page.locator(TAG), '--sb-input-group-focus-ring-width'));
    expect(await shellStyle(page, 'border-top-color')).toBe(await tokenColor(page.locator(TAG), '--sb-input-group-focus-ring-color'));
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Copy link' })).toBeFocused();
    await expect(shell(page)).not.toHaveAttribute('data-focused');
    await expect.poll(() => shellStyle(page, 'box-shadow')).toBe(resting);
  });

  test('a slotted sb-input shows no second ring when focused', async ({ page }) => {
    await gotoStory(page, 'components-input-group--default', TAG);
    await page.getByRole('textbox', { name: 'Search' }).focus();
    await expect(shell(page)).toHaveAttribute('data-focused', '');
    const ring = await page.locator('sb-input [part="input"]').evaluate((el) => getComputedStyle(el).boxShadow);
    expect(ring === 'none' || /0px 0px 0px 0px\s*$|0px 0px 0px 0px/.test(ring)).toBe(true);
  });

  test('validation error marks a slotted sb-input and sb-textarea invalid, not only by color', async ({ page }) => {
    await gotoStory(page, 'components-input-group--invalid', TAG);
    await expect(page.getByRole('textbox', { name: 'Search' })).toHaveAttribute('aria-invalid', 'true');
    await page.locator(TAG).evaluate((el) => el.removeAttribute('validation'));
    await expect(page.getByRole('textbox', { name: 'Search' })).not.toHaveAttribute('aria-invalid');
    await gotoStory(page, 'components-input-group--sb-textarea-footer', TAG);
    await page.locator(TAG).evaluate((el) => el.setAttribute('validation', 'error'));
    await expect(page.locator('sb-textarea').locator('textarea')).toHaveAttribute('aria-invalid', 'true');
  });

  test('a disabled native control is dimmed so it does not look editable', async ({ page }) => {
    await gotoStory(page, 'components-input-group--native-input', TAG);
    const input = page.locator(`${TAG} > input`);
    expect(await input.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await input.evaluate((el) => el.setAttribute('disabled', ''));
    await expect.poll(() => input.evaluate((el) => getComputedStyle(el).opacity)).toBe(String(await tokenNumber(page.locator(TAG), '--sb-input-group-disabled-opacity')));
    expect(await input.evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
  });

  test('validation error colors the shell and marks a native control', async ({ page }) => {
    await gotoStory(page, 'components-input-group--native-input', TAG);
    await page.locator(TAG).evaluate((el) => el.setAttribute('validation', 'error'));
    await expect(page.getByRole('textbox', { name: 'Website' })).toHaveAttribute('aria-invalid', 'true');
    await expect.poll(() => shellStyle(page, 'border-top-color')).toBe(await tokenColor(page.locator(TAG), '--sb-input-group-border-invalid'));
    await page.locator(TAG).evaluate((el) => el.removeAttribute('validation'));
    await expect(page.getByRole('textbox', { name: 'Website' })).not.toHaveAttribute('aria-invalid');
  });

  test('clicking addon text focuses the control; clicking a button does not', async ({ page }) => {
    await gotoStory(page, 'components-input-group--native-input', TAG);
    await page.locator('sb-input-group-text').click();
    await expect(page.getByRole('textbox', { name: 'Website' })).toBeFocused();
    await gotoStory(page, 'components-input-group--with-button', TAG);
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.getByRole('button', { name: 'Copy link' })).toBeFocused();
  });

  test('role=group only when the host has an aria-label', async ({ page }) => {
    await gotoStory(page, 'components-input-group--native-input', TAG);
    await expect(page.getByRole('group', { name: 'Website' })).toBeVisible();
    await gotoStory(page, 'components-input-group--with-button', TAG);
    await expect(page.locator(`${TAG} [part="group"]`)).not.toHaveAttribute('role');
  });

  test('icon-only button is named by aria-label and clicks reach the host', async ({ page }) => {
    await gotoStory(page, 'components-input-group--with-button', TAG);
    const clicks = await page.evaluateHandle(() => {
      const c = { n: 0, composed: false };
      document.addEventListener('click', (e) => { if ((e.target as Element).closest('sb-input-group-button')) { c.n++; c.composed = e.composed; } });
      return c;
    });
    await page.getByRole('button', { name: 'Copy link' }).click();
    expect(await clicks.jsonValue()).toEqual({ n: 1, composed: true });
    const box = await page.getByRole('button', { name: 'Copy link' }).boundingBox();
    const size = await tokenPx(page.locator('sb-input-group-button'), '--sb-button-height-xs');
    expect([box?.width, box?.height]).toEqual([size, size]);
  });

  test('button variant, disabled and submit pass through to the inner sb-button', async ({ page }) => {
    await gotoStory(page, 'components-input-group--button-disabled', TAG);
    await expect(page.getByRole('button', { name: 'Apply' })).toBeDisabled();
    await expect(page.locator('sb-input-group-button sb-button')).toHaveAttribute('variant', 'ghost');
    await gotoStory(page, 'components-input-group--in-form', TAG);
    const submitted = await page.evaluateHandle(() => {
      const seen: [string, FormDataEntryValue][][] = [];
      const form = document.querySelector('form')!;
      form.addEventListener('submit', (e) => { e.preventDefault(); seen.push([...new FormData(form).entries()]); });
      return seen;
    });
    await page.getByRole('button', { name: 'Go' }).click();
    expect(await submitted.jsonValue()).toEqual([[['query', 'draft']]]);
  });

  test('text in an addon uses the addon color token', async ({ page }) => {
    await gotoStory(page, 'components-input-group--with-text', TAG);
    const text = page.locator('sb-input-group-text [part="text"]').first();
    expect(await text.evaluate((el) => getComputedStyle(el).color)).toBe(await tokenColor(page.locator(TAG), '--sb-input-group-addon-fg'));
  });

  test('a slotted sb-textarea gets the shell ring, no second ring, and addon clicks focus it', async ({ page }) => {
    await gotoStory(page, 'components-input-group--sb-textarea-footer', TAG);
    const field = page.getByRole('textbox', { name: 'Message' });
    await field.focus();
    await expect(shell(page)).toHaveAttribute('data-focused', '');
    await expect.poll(() => shellStyle(page, 'box-shadow')).toContain(await tokenLength(page.locator(TAG), '--sb-input-group-focus-ring-width'));
    const inner = page.locator('sb-textarea [part="textarea"]');
    // The control's own border and ring fade out through its transition.
    await expect.poll(() => inner.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgba(0, 0, 0, 0)');
    await expect.poll(() => inner.evaluate((el) => getComputedStyle(el).boxShadow)).toMatch(/^none$|0px 0px 0px 0px/);
    await field.blur();
    await expect(shell(page)).not.toHaveAttribute('data-focused');
    await page.locator('sb-input-group-text').click();
    await expect(field).toBeFocused();
  });

  test('the inner button name follows the text when it is edited in place', async ({ page }) => {
    await gotoStory(page, 'components-input-group--textarea-footer', TAG);
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await page.locator('sb-input-group-button').evaluate((el) => ((el.firstChild as Text).data = 'Post'));
    await expect(page.getByRole('button', { name: 'Post' })).toBeVisible();
    await page.locator('sb-input-group-button').evaluate((el) => (el.textContent = 'Publish'));
    await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible();
  });

  for (const id of ['default', 'invalid', 'with-text', 'with-button', 'native-input', 'textarea-footer', 'sb-textarea-footer', 'button-disabled', 'block-start']) {
    test(`axe clean: ${id}`, async ({ page }) => {
      await gotoStory(page, `components-input-group--${id}`, TAG);
      expect(await axeViolations(page, TAG, ['sb-input'])).toEqual([]);
    });
  }

  test('keyboard focus on an invalid control shows a solid ring in the invalid color', async ({ page }) => {
    await expectSolidInvalidRing(page, 'components-input-group--invalid', 'sb-input-group', 'group', '--sb-input-group-border-invalid');
  });
});
