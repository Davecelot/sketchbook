import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import type { LitHost } from '../../helpers/elements';
import { axeViolations, expectScreenReaderView } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { systemColor } from '../../helpers/styles';
import { tokenColor, tokenLength, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-toggle-group';
const ITEM = 'sb-toggle-group-item';
const item = (page: Page, value: string) => page.locator(`${ITEM}[value="${value}"]`);
const btn = (page: Page, value: string) => item(page, value).locator('[part="button"]');
const pressedValues = (page: Page) => page.locator(TAG).first().evaluate((el: HTMLElement & { value: string[] }) => [...el.value]);
const recordChanges = (page: Page) =>
  page.evaluateHandle(() => {
    const seen: { value: string[]; bubbles: boolean; composed: boolean; target: string }[] = [];
    document.addEventListener('change', (e) =>
      seen.push({ value: [...(e as CustomEvent<{ value: string[] }>).detail.value], bubbles: e.bubbles, composed: e.composed, target: (e.target as Element).localName }),
    );
    return seen;
  });
const focusedValue = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('value') ?? null);
const radius = (loc: Locator) => loc.evaluate((el) => {
  const s = getComputedStyle(el);
  return [s.borderStartStartRadius, s.borderStartEndRadius, s.borderEndEndRadius, s.borderEndStartRadius].map((v) => parseFloat(v)) as [number, number, number, number];
});

test.describe('Toggle Group', () => {
  test('group is a named role=group of buttons with aria-pressed', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--default', TAG);
    const group = page.getByRole('group', { name: 'Text formatting' });
    await expect(group).toBeVisible();
    expect(await group.ariaSnapshot()).toMatch(/group "Text formatting"[\s\S]*button "Bold"[\s\S]*button "Italic"[\s\S]*button "Underline"/);
    await expect(page.getByRole('button', { name: 'Bold', pressed: false })).toBeVisible();
  });

  test('single: pressing moves the selection and pressing again clears it', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--default', TAG);
    const changes = await recordChanges(page);
    await btn(page, 'bold').click();
    await btn(page, 'italic').click();
    await expect(page.getByRole('button', { name: 'Italic', pressed: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bold', pressed: false })).toBeVisible();
    await btn(page, 'italic').click();
    expect(await pressedValues(page)).toEqual([]);
    expect(await changes.jsonValue()).toEqual([
      { value: ['bold'], bubbles: true, composed: true, target: TAG },
      { value: ['italic'], bubbles: true, composed: true, target: TAG },
      { value: [], bubbles: true, composed: true, target: TAG },
    ]);
  });

  test('multiple: items toggle independently', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--multiple', TAG);
    expect(await pressedValues(page)).toEqual(['bold', 'italic']);
    await btn(page, 'underline').click();
    await btn(page, 'bold').click();
    expect(await pressedValues(page)).toEqual(['italic', 'underline']);
    await expect(btn(page, 'italic')).toHaveAttribute('aria-pressed', 'true');
    await expect(btn(page, 'bold')).toHaveAttribute('aria-pressed', 'false');
  });

  test('value property and space-separated attribute set the pressed items without a change event', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--default', TAG);
    const changes = await recordChanges(page);
    await page.locator(TAG).evaluate((el: HTMLElement & { value: string[] }) => { el.value = ['underline']; });
    await expect(btn(page, 'underline')).toHaveAttribute('aria-pressed', 'true');
    await page.locator(TAG).evaluate((el) => { el.setAttribute('selection', 'multiple'); el.setAttribute('value', 'bold underline'); });
    await expect(btn(page, 'bold')).toHaveAttribute('aria-pressed', 'true');
    await expect(btn(page, 'underline')).toHaveAttribute('aria-pressed', 'true');
    expect(await pressedValues(page)).toEqual(['bold', 'underline']);
    expect((await changes.jsonValue()).length).toBe(0);
  });

  test('roving focus: one tab stop, arrows wrap and never press, Home and End jump', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--default', TAG);
    const tabIndexes = () => page.locator(ITEM).evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex));
    expect(await tabIndexes()).toEqual([0, -1, -1]);
    await page.keyboard.press('Tab');
    expect(await focusedValue(page)).toBe('bold');
    await page.keyboard.press('ArrowRight');
    expect(await focusedValue(page)).toBe('italic');
    await page.keyboard.press('End');
    expect(await focusedValue(page)).toBe('underline');
    await page.keyboard.press('ArrowRight');
    expect(await focusedValue(page)).toBe('bold');
    await page.keyboard.press('ArrowLeft');
    expect(await focusedValue(page)).toBe('underline');
    await page.keyboard.press('Home');
    expect(await focusedValue(page)).toBe('bold');
    expect(await pressedValues(page)).toEqual([]);
    expect(await tabIndexes()).toEqual([0, -1, -1]);
    await page.keyboard.press('Tab');
    expect(await focusedValue(page)).not.toBe('italic');
  });

  test('Enter and Space press the focused item; Tab enters on the pressed item', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--multiple', TAG);
    await page.keyboard.press('Tab');
    expect(await focusedValue(page)).toBe('bold');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    expect(await pressedValues(page)).toEqual(['bold', 'italic']);
    await page.locator(TAG).evaluate((el: HTMLElement & { value: string[] }) => { el.value = ['underline']; });
    await expect.poll(() => page.locator(ITEM).evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex))).toEqual([-1, -1, 0]);
  });

  test('vertical orientation moves with Up and Down only', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--vertical', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    expect(await focusedValue(page)).toBe('bold');
    await page.keyboard.press('ArrowDown');
    expect(await focusedValue(page)).toBe('italic');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    expect(await focusedValue(page)).toBe('underline');
    const [a, b] = await Promise.all([item(page, 'bold').boundingBox(), item(page, 'italic').boundingBox()]);
    expect(b!.y).toBeGreaterThan(a!.y);
    expect(b!.x).toBe(a!.x);
  });

  test('RTL reverses the arrow keys', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--rtl', TAG);
    await page.keyboard.press('Tab');
    expect(await focusedValue(page)).toBe('bold');
    await page.keyboard.press('ArrowLeft');
    expect(await focusedValue(page)).toBe('italic');
  });

  test('disabled item is skipped by arrows and cannot be pressed', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--disabled-item', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    expect(await focusedValue(page)).toBe('right');
    await btn(page, 'center').click({ force: true });
    expect(await pressedValues(page)).toEqual([]);
    await expect(btn(page, 'center')).toBeDisabled();
  });

  test('disabled group disables every item and leaves the tab order', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--disabled', TAG);
    for (const v of ['bold', 'italic', 'underline']) await expect(btn(page, v)).toBeDisabled();
    expect(await btn(page, 'bold').evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5');
  });

  test('a <fieldset disabled> disables the group without touching the attribute', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--in-fieldset', TAG);
    await expect(btn(page, 'bold')).toBeDisabled();
    await expect(page.locator(TAG)).not.toHaveAttribute('disabled');
    await page.locator('fieldset').evaluate((el: HTMLFieldSetElement) => { el.disabled = false; });
    await expect(btn(page, 'bold')).toBeEnabled();
  });

  test('joined group: data-position, shared borders, only outer corners rounded', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--outline', TAG);
    await expect(item(page, 'bold')).toHaveAttribute('data-position', 'first');
    await expect(item(page, 'italic')).toHaveAttribute('data-position', 'middle');
    await expect(item(page, 'underline')).toHaveAttribute('data-position', 'last');
    const [first, mid, last] = await Promise.all(['bold', 'italic', 'underline'].map((v) => radius(btn(page, v))));
    // Outer corners take the radius token, inner ones none (both 0 under a sharp brand).
    const r = await tokenPx(item(page, 'bold'), '--sb-toggle-group-radius');
    expect(first![0]).toBe(r);
    expect(first![1]).toBe(0);
    expect(mid).toEqual([0, 0, 0, 0]);
    expect(last![1]).toBe(r);
    expect(last![0]).toBe(0);
    expect(await btn(page, 'italic').evaluate((el) => getComputedStyle(el).borderInlineStartWidth)).toBe('0px');
    expect(await btn(page, 'bold').evaluate((el) => getComputedStyle(el).borderInlineStartWidth)).toBe(await tokenLength(item(page, 'bold'), '--sb-toggle-group-border-width'));
    const [a, b] = await Promise.all([item(page, 'bold').boundingBox(), item(page, 'italic').boundingBox()]);
    expect(Math.round(b!.x - (a!.x + a!.width))).toBe(0);
  });

  test('spacing separates the items and rounds each', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--spacing', TAG);
    const [a, b] = await Promise.all([item(page, 'bold').boundingBox(), item(page, 'italic').boundingBox()]);
    // spacing="2" is two spacing units.
    expect(Math.round(b!.x - (a!.x + a!.width))).toBe(2 * (await tokenPx(item(page, 'bold'), '--sb-toggle-group-spacing-unit')));
    const r = await tokenPx(item(page, 'italic'), '--sb-toggle-group-radius');
    expect(await radius(btn(page, 'italic'))).toEqual([r, r, r, r]);
    await expect(page.locator(TAG)).toHaveAttribute('spacing', '2');
  });

  test('item colors come from component tokens: pressed, tertiary border, hover', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--outline', TAG);
    await btn(page, 'bold').click();
    await page.mouse.move(0, 0);
    await expect.poll(() => btn(page, 'bold').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(item(page, 'bold'), '--sb-toggle-group-on-bg'));
    expect(await btn(page, 'italic').evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(await tokenColor(item(page, 'italic'), '--sb-toggle-group-outline-border'));
    await item(page, 'italic').hover();
    await expect.poll(() => btn(page, 'italic').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(item(page, 'italic'), '--sb-toggle-group-outline-bg-hover'));
  });

  test('sizes match the control heights', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--variants', TAG);
    for (const [size, token] of [['small', 'sm'], ['medium', 'default'], ['large', 'lg']] as const) {
      const item = page.locator(`${TAG}[variant="ghost"][size="${size}"] ${ITEM}`).first();
      const h = await tokenPx(item, `--sb-toggle-group-height-${token}`);
      const box = await item.locator('[part="button"]').boundingBox();
      expect(box?.height, size).toBe(h);
      expect(box?.width, size).toBeGreaterThanOrEqual(h);
    }
  });

  test('a pressed item has a 3:1 border, not only a fill', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, 'components-toggle-group--multiple', TAG);
    const border = await tokenColor(page.locator(TAG).first(), '--sb-toggle-group-on-border');
    expect(await btn(page, 'bold').evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(border);
    expect(await btn(page, 'underline').evaluate((el) => getComputedStyle(el).borderTopColor)).not.toBe(border);
  });

  test('a tertiary item with spacing shows the focus ring', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, 'components-toggle-group--spacing', TAG);
    const ring = await tokenColor(page.locator(TAG).first(), '--sb-toggle-group-focus-ring-color');
    await page.keyboard.press('Tab');
    const focused = page.locator(`${ITEM}:focus`).locator('[part="button"]');
    expect(await focused.evaluate((el) => getComputedStyle(el).boxShadow)).toContain(ring);
  });

  test('in forced colors a pressed item is filled with the system highlight', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await gotoStory(page, 'components-toggle-group--multiple', TAG);
    const look = await btn(page, 'bold').evaluate((el) => { const s = getComputedStyle(el); return { bg: s.backgroundColor, fg: s.color, adjust: s.getPropertyValue('forced-color-adjust') }; });
    expect(look).toEqual({ bg: await systemColor(page, 'Highlight'), fg: await systemColor(page, 'HighlightText'), adjust: 'none' });
  });

  test('the focus ring shows for keyboard focus only', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--default', TAG);
    await btn(page, 'bold').click();
    expect(await btn(page, 'bold').evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await btn(page, 'bold').evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  });

  test('screen-reader view: arrows move focus without pressing, space presses the focused item', async ({ page }) => {
    await gotoStory(page, 'components-toggle-group--multiple', TAG);
    await btn(page, 'bold').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(btn(page, 'underline')).toBeFocused();
    await expect(btn(page, 'underline')).toHaveAttribute('aria-pressed', 'false');
    await expectScreenReaderView(page, 'toggle-group-moved');
    await page.keyboard.press('Space');
    await expect(btn(page, 'underline')).toHaveAttribute('aria-pressed', 'true');
    await expectScreenReaderView(page, 'toggle-group-pressed');
  });

  for (const id of ['variants', 'multiple', 'outline', 'vertical', 'disabled-item', 'with-text']) {
    test(`axe clean: ${id}`, async ({ page }) => {
      await gotoStory(page, `components-toggle-group--${id}`, TAG);
      expect(await axeViolations(page, TAG)).toEqual([]);
    });
  }

  test('warns once when the group has no accessible name, and not when aria-label is set', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && m.text().includes('<sb-toggle-group> has no accessible name') && warnings.push(m.text()));
    await gotoStory(page, 'components-toggle-group--default', 'sb-toggle-group');
    await page.evaluate(async () => {
      const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const named = document.createElement('sb-toggle-group');
      named.setAttribute('aria-label', 'Named');
      const bare = document.createElement('sb-toggle-group') as LitHost;
      document.body.append(named, bare);
      await frames();
      bare.requestUpdate();
      await bare.updateComplete;
      await frames();
    });
    expect(warnings).toHaveLength(1);
  });
});
