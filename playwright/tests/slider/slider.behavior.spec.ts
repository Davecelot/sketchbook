import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView } from '../../helpers/a11y';
import { countHostChanges, countHostInputs } from '../../helpers/events';
import { formEntries, mountForm, submitsOnDispatchedEnter, submitsOnEnter } from '../../helpers/forms';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-slider';
const host = (page: Page) => page.locator(TAG).first();
const thumbs = (page: Page) => host(page).locator('[part="thumb"]');
const valueOf = (page: Page) => host(page).evaluate((el: HTMLElement & { value: number[] }) => [...el.value]);
const formValid = (page: Page) =>
  page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).checkValidity());

test.describe('Slider', () => {
  test('one value is one slider, named by the label; clicking the label focuses it', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    const slider = page.getByRole('slider', { name: 'Volume' });
    await expect(slider).toHaveCount(1);
    await expect(slider).toHaveValue('40');
    await host(page).locator('[part="label"]').click();
    await expect(slider).toBeFocused();
    expect(await valueOf(page)).toEqual([40]);
  });

  test('a range is two sliders with distinct names', async ({ page }) => {
    await gotoStory(page, 'components-slider--range', TAG);
    await expect(page.getByRole('slider')).toHaveCount(2);
    await expect(page.getByRole('slider', { name: 'Budget minimum' })).toHaveValue('20');
    await expect(page.getByRole('slider', { name: 'Budget maximum' })).toHaveValue('80');
  });

  test('arrow keys change by step; Home and End jump to the ends', async ({ page }) => {
    await gotoStory(page, 'components-slider--steps', TAG);
    const slider = page.getByRole('slider', { name: 'Opacity' });
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('60');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(slider).toHaveValue('40');
    await page.keyboard.press('Home');
    await expect(slider).toHaveValue('0');
    await page.keyboard.press('End');
    await expect(slider).toHaveValue('100');
    await page.keyboard.press('PageDown');
    expect(Number(await slider.inputValue())).toBeLessThan(100);
    expect(await valueOf(page)).toEqual([Number(await slider.inputValue())]);
  });

  test('min, max and step bound the value', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    await host(page).evaluate((el) => {
      el.setAttribute('min', '10');
      el.setAttribute('max', '20');
      el.setAttribute('step', '5');
      el.setAttribute('value', '99');
    });
    const slider = page.getByRole('slider');
    await expect(slider).toHaveAttribute('min', '10');
    await expect(slider).toHaveAttribute('max', '20');
    await expect(slider).toHaveAttribute('step', '5');
    await expect(slider).toHaveValue('20');
    expect(await valueOf(page)).toEqual([20]);
  });

  test('a thumb cannot cross the other', async ({ page }) => {
    await gotoStory(page, 'components-slider--range', TAG);
    const low = page.getByRole('slider', { name: 'Budget minimum' });
    await low.focus();
    await page.keyboard.press('End');
    await expect(low).toHaveValue('80');
    expect(await valueOf(page)).toEqual([80, 80]);
    const high = page.getByRole('slider', { name: 'Budget maximum' });
    await high.focus();
    await page.keyboard.press('Home');
    await expect(high).toHaveValue('80');
  });

  test('pressing the track of a range moves the nearest thumb', async ({ page }) => {
    await gotoStory(page, 'components-slider--range', TAG);
    const box = (await host(page).locator('[part="control"]').boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
    const [low, high] = await valueOf(page);
    expect(low).toBe(20);
    expect(high).toBeGreaterThan(80);
  });

  test('pressing a single slider track moves its thumb', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    const box = (await host(page).locator('[part="control"]').boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
    expect((await valueOf(page))[0]).toBeGreaterThan(80);
  });

  test('the filled range follows the value; a range fills between the thumbs', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    const track = (await host(page).locator('[part="track"]').boundingBox())!;
    const range = (await host(page).locator('[part="range"]').boundingBox())!;
    expect(range.x).toBeCloseTo(track.x, 0);
    expect(range.width / track.width).toBeGreaterThan(0.38);
    expect(range.width / track.width).toBeLessThan(0.46);
    expect(track.height).toBe(await tokenPx(host(page), '--sb-slider-track-size'));
    expect((await host(page).locator('[part="control"]').boundingBox())!.height).toBe(await tokenPx(host(page), '--sb-slider-target-size'));
    await gotoStory(page, 'components-slider--range', TAG);
    const t2 = (await host(page).locator('[part="track"]').boundingBox())!;
    const r2 = (await host(page).locator('[part="range"]').boundingBox())!;
    expect(r2.x).toBeGreaterThan(t2.x + t2.width * 0.15);
    expect(r2.x + r2.width).toBeLessThan(t2.x + t2.width * 0.85);
  });

  test('RTL fills from the inline start, on the right', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    await host(page).evaluate((el) => el.setAttribute('dir', 'rtl'));
    const track = (await host(page).locator('[part="track"]').boundingBox())!;
    const range = (await host(page).locator('[part="range"]').boundingBox())!;
    expect(range.x + range.width).toBeCloseTo(track.x + track.width, 0);
    expect(range.width / track.width).toBeLessThan(0.46);
  });

  test('the unfilled track uses the 3:1 form-field color', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    expect(await host(page).locator('[part="track"]').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(host(page), '--sb-color-input'));
  });

  test('in forced colors the track and the filled range stay visible and distinct', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-slider--default', TAG);
    const bg = (part: string) => host(page).locator(`[part="${part}"]`).evaluate((el) => getComputedStyle(el).backgroundColor);
    const canvas = await host(page).evaluate(() => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:block;forced-color-adjust:none;background:Canvas';
      document.body.append(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    const [track, range] = [await bg('track'), await bg('range')];
    expect(track).not.toBe(canvas);
    expect(range).not.toBe(canvas);
    expect(range).not.toBe(track);
  });

  test('vertical: ArrowUp increases, aria-orientation is set, the track is tall', async ({ page }) => {
    await gotoStory(page, 'components-slider--vertical', TAG);
    const slider = page.getByRole('slider', { name: 'Volume' });
    await expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    const box = (await host(page).locator('[part="control"]').boundingBox())!;
    expect(box.height).toBe(3 * (await tokenPx(host(page), '--sb-slider-vertical-length')));
    expect(box.width).toBe(await tokenPx(host(page), '--sb-slider-target-size'));
    await slider.focus();
    await page.keyboard.press('ArrowUp');
    await expect(slider).toHaveValue('41');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(slider).toHaveValue('39');
    const track = (await host(page).locator('[part="track"]').boundingBox())!;
    const range = (await host(page).locator('[part="range"]').boundingBox())!;
    expect(range.y + range.height).toBeCloseTo(track.y + track.height, 0);
  });

  test('horizontal sliders have no aria-orientation override', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    await expect(thumbs(page).first()).not.toHaveAttribute('aria-orientation', 'vertical');
  });

  test('shows a focus ring on keyboard focus of a thumb', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    const clip = (await host(page).locator('[part="control"]').boundingBox())!;
    const area = { x: clip.x - 6, y: clip.y - 6, width: clip.width + 12, height: clip.height + 12 };
    const before = await page.screenshot({ clip: area });
    await page.keyboard.press('Tab');
    await expect(thumbs(page).first()).toBeFocused();
    const after = await page.screenshot({ clip: area });
    expect(after.equals(before)).toBe(false);
  });

  test('hide-label keeps the accessible name', async ({ page }) => {
    await gotoStory(page, 'components-slider--hidden-label', TAG);
    await expect(page.getByRole('slider', { name: 'Brightness' })).toBeVisible();
    expect((await host(page).locator('[part="label"]').boundingBox())?.width).toBeLessThanOrEqual(1);
  });

  test('description and error are the accessible description; error marks it invalid', async ({ page }) => {
    await gotoStory(page, 'components-slider--with-description', TAG);
    await expect(page.getByRole('slider')).toHaveAccessibleDescription('Applies to every channel.');
    await gotoStory(page, 'components-slider--with-error', TAG);
    await expect(thumbs(page).first()).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('slider')).toHaveAccessibleDescription('Choose a value below 80.');
    await expect(host(page).locator('[part="error"]')).toHaveAttribute('aria-live', 'polite');
  });

  test('input and change reach the host', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    const inputs = await countHostInputs(page, TAG);
    const changes = await countHostChanges(page, TAG);
    await page.getByRole('slider').focus();
    await page.keyboard.press('ArrowRight');
    expect(await inputs.evaluate((c) => c.count)).toBe(1);
    expect(await changes.evaluate((c) => c.count)).toBe(1);
  });

  test('disabled thumbs cannot be focused or changed', async ({ page }) => {
    await gotoStory(page, 'components-slider--disabled', TAG);
    await expect(page.getByRole('slider')).toBeDisabled();
  });

  test('takes part in forms: one entry per thumb, reset, disabled', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    await mountForm(
      page,
      '<sb-slider name="vol" label="Vol" value="30"></sb-slider><sb-slider name="rng" label="Rng" value="10,60"></sb-slider><sb-slider name="off" label="Off" value="5" disabled></sb-slider>',
    );
    expect(await formEntries(page)).toEqual([['vol', '30'], ['rng', '10'], ['rng', '60']]);
    expect(await formValid(page)).toBe(true);
    await page.getByRole('slider', { name: 'Vol', exact: true }).focus();
    await page.keyboard.press('End');
    await page.getByRole('slider', { name: 'Rng maximum' }).focus();
    await page.keyboard.press('ArrowLeft');
    expect(await formEntries(page)).toEqual([['vol', '100'], ['rng', '10'], ['rng', '59']]);
    await page.evaluate(() => (document.querySelector('form#under-test') as HTMLFormElement).reset());
    expect(await formEntries(page)).toEqual([['vol', '30'], ['rng', '10'], ['rng', '60']]);
    await expect(page.getByRole('slider', { name: 'Vol', exact: true })).toHaveValue('30');
  });

  test('a disabled fieldset disables it and re-enabling restores it', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    await mountForm(page, '<fieldset id="fs"><sb-slider name="a" label="Alpha" value="7"></sb-slider></fieldset>');
    const slider = page.getByRole('slider', { name: 'Alpha', exact: true });
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = true));
    await expect(slider).toBeDisabled();
    expect(await formEntries(page)).toEqual([]);
    expect(await page.locator('form#under-test sb-slider').evaluate((el) => el.hasAttribute('disabled'))).toBe(false);
    await page.locator('#fs').evaluate((el: HTMLFieldSetElement) => (el.disabled = false));
    await expect(slider).toBeEnabled();
    expect(await formEntries(page)).toEqual([['a', '7']]);
  });

  test('the errorMessage prop makes the field invalid for the form', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    await mountForm(page, '<sb-slider name="a" label="Alpha" error-message="Nope."></sb-slider>');
    expect(await formValid(page)).toBe(false);
    await page.locator('form#under-test sb-slider').evaluate((el) => el.removeAttribute('error-message'));
    expect(await formValid(page)).toBe(true);
  });

  test('a label for= activates the host and focuses the first thumb', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    await mountForm(page, '<label for="ext">Outside</label><sb-slider id="ext" name="a" label="Alpha"></sb-slider>');
    await page.locator('label[for="ext"]').click();
    await expect(page.getByRole('slider', { name: 'Alpha', exact: true })).toBeFocused();
  });

  test('Enter on the control submits its form (implicit submission)', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    expect(await submitsOnEnter(page, `<sb-slider name="a" label="Volume"></sb-slider>`, 'sb-slider input')).toBe(1);
  });

  test('Enter on a disabled control does not submit its form', async ({ page }) => {
    await gotoStory(page, 'components-slider--default', TAG);
    expect(await submitsOnDispatchedEnter(page, `<sb-slider name="a" label="Volume" disabled></sb-slider>`, 'sb-slider input')).toBe(0);
  });

  test('screen-reader view: arrows and End change the announced value', async ({ page }) => {
    await gotoStory(page, 'components-slider--steps', TAG);
    const slider = page.getByRole('slider', { name: 'Opacity' });
    await slider.focus();
    await expectScreenReaderView(page, 'slider-focused');
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('60');
    await expectScreenReaderView(page, 'slider-arrow-right');
    await page.keyboard.press('End');
    await expect(slider).toHaveValue('100');
    await expectScreenReaderView(page, 'slider-end');
  });

  test('has no axe violations', async ({ page }) => {
    for (const story of ['default', 'range', 'steps', 'with-description', 'with-error', 'disabled', 'hidden-label', 'vertical', 'vertical-range', 'orientations']) {
      await gotoStory(page, `components-slider--${story}`, TAG);
      expect(await axeViolations(page, TAG), story).toEqual([]);
    }
  });
});
