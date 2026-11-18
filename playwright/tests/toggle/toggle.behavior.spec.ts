import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView } from '../../helpers/a11y';
import { recordHostEvents } from '../../helpers/events';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-toggle';
const inner = (page: Page, nth = 0) => page.locator(TAG).nth(nth).locator('[part="button"]');
const style = (page: Page, prop: string, nth = 0) => inner(page, nth).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
const recordChanges = (page: Page) =>
  page.evaluateHandle(() => {
    const seen: { selected: boolean; bubbles: boolean; composed: boolean; target: string }[] = [];
    document.addEventListener('change', (e) =>
      seen.push({ selected: (e as CustomEvent<{ selected: boolean }>).detail.selected, bubbles: e.bubbles, composed: e.composed, target: (e.target as Element).localName }),
    );
    return seen;
  });

test.describe('Toggle', () => {
  test('renders a native button with aria-pressed, named by its label', async ({ page }) => {
    await gotoStory(page, 'components-toggle--default', TAG);
    await expect(page.getByRole('button', { name: 'Bold', pressed: false })).toBeVisible();
    await expect(inner(page)).toHaveAttribute('type', 'button');
  });

  test('selected reflects to aria-pressed', async ({ page }) => {
    await gotoStory(page, 'components-toggle--pressed', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('selected', '');
    await expect(page.getByRole('button', { name: 'Bold', pressed: true })).toBeVisible();
    await page.locator(TAG).evaluate((el: HTMLElement & { selected: boolean }) => { el.selected = false; });
    await expect(page.getByRole('button', { name: 'Bold', pressed: false })).toBeVisible();
    await expect(page.locator(TAG)).not.toHaveAttribute('selected');
  });

  test('click, Enter and Space flip it and fire one composed change each', async ({ page }) => {
    await gotoStory(page, 'components-toggle--default', TAG);
    const changes = await recordChanges(page);
    await inner(page).click();
    await expect(inner(page)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Enter');
    await expect(inner(page)).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Space');
    await expect(inner(page)).toHaveAttribute('aria-pressed', 'true');
    expect(await changes.jsonValue()).toEqual([
      { selected: true, bubbles: true, composed: true, target: TAG },
      { selected: false, bubbles: true, composed: true, target: TAG },
      { selected: true, bubbles: true, composed: true, target: TAG },
    ]);
  });

  test('setting selected from code fires no change', async ({ page }) => {
    await gotoStory(page, 'components-toggle--default', TAG);
    const changes = await recordChanges(page);
    await page.locator(TAG).evaluate((el: HTMLElement & { selected: boolean }) => { el.selected = true; });
    await expect(inner(page)).toHaveAttribute('aria-pressed', 'true');
    expect((await changes.jsonValue()).length).toBe(0);
  });

  test('click event is native: bubbles and is composed', async ({ page }) => {
    await gotoStory(page, 'components-toggle--default', TAG);
    const clicks = await recordHostEvents(page, 'click');
    await inner(page).click();
    const [first] = await clicks.jsonValue();
    expect(first).toMatchObject({ bubbles: true, composed: true });
  });

  test('sizes match the control heights and are at least as wide as high', async ({ page }) => {
    await gotoStory(page, 'components-toggle--variants', TAG);
    for (const [size, token] of [['small', 'sm'], ['medium', 'default'], ['large', 'lg']] as const) {
      const host = page.locator(`sb-toggle[variant="ghost"][size="${size}"]`);
      const h = await tokenPx(host, `--sb-toggle-height-${token}`);
      const box = await host.locator('[part="button"]').boundingBox();
      expect(box?.height, size).toBe(h);
      expect(box?.width, size).toBeGreaterThanOrEqual(h);
    }
  });

  test('pressed has a 3:1 border on both variants, not only a fill', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, 'components-toggle--default', TAG);
    const host = page.locator(TAG).first();
    const border = await tokenColor(host, '--sb-toggle-on-border');
    expect(await style(page, 'border-top-color')).toBe('rgba(0, 0, 0, 0)');
    for (const variant of ['ghost', 'tertiary']) {
      await host.evaluate(async (el, v) => { el.setAttribute('variant', v); el.setAttribute('selected', ''); await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete; }, variant);
      expect(await style(page, 'border-top-color'), variant).toBe(border);
    }
  });

  test('on state, hover and tertiary colors come from component tokens', async ({ page }) => {
    await gotoStory(page, 'components-toggle--variants', TAG);
    const off = page.locator('sb-toggle[variant="ghost"][size="medium"]');
    expect(await off.locator('[part="button"]').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    await off.evaluate((el: HTMLElement & { selected: boolean }) => { el.selected = true; });
    await expect.poll(() => off.locator('[part="button"]').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(off, '--sb-toggle-on-bg'));
    const outline = page.locator('sb-toggle[variant="tertiary"][size="medium"]');
    expect(await outline.locator('[part="button"]').evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(await tokenColor(outline, '--sb-toggle-outline-border'));
    expect(await outline.locator('[part="button"]').evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
    await page.locator('sb-toggle[variant="ghost"][size="small"]').hover();
    await expect.poll(() => page.locator('sb-toggle[variant="ghost"][size="small"] [part="button"]').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      await tokenColor(off, '--sb-toggle-hover-bg'),
    );
  });

  test('the focus ring shows for keyboard focus only', async ({ page }) => {
    await gotoStory(page, 'components-toggle--default', TAG);
    await inner(page).click();
    expect(await style(page, 'box-shadow')).toBe('none');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await style(page, 'box-shadow')).not.toBe('none');
  });

  test('the tertiary variant shows the focus ring too', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, 'components-toggle--default', TAG);
    await page.locator(TAG).first().evaluate((el) => el.setAttribute('variant', 'tertiary'));
    const ring = await tokenColor(page.locator(TAG).first(), '--sb-toggle-focus-ring-color');
    await page.keyboard.press('Tab');
    expect(await style(page, 'box-shadow')).toContain(ring);
  });

  test('in forced colors the pressed toggle is filled with a system highlight', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await gotoStory(page, 'components-toggle--default', TAG);
    const canvas = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:block;forced-color-adjust:none;background:Canvas';
      document.body.append(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    await page.locator(TAG).first().evaluate(async (el) => { el.setAttribute('selected', ''); await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete; });
    const fill = await style(page, 'background-color');
    expect(fill).not.toBe(canvas);
    expect(fill).not.toMatch(/rgba\(.*, 0\)$/);
  });

  test('disabled: no toggle, out of the tab order, dimmed', async ({ page }) => {
    await gotoStory(page, 'components-toggle--disabled', TAG);
    await inner(page).click({ force: true });
    await expect(inner(page)).toBeDisabled();
    await expect(inner(page)).toHaveAttribute('aria-pressed', 'false');
    expect(await style(page, 'opacity')).toBe('0.5');
  });

  test('a <fieldset disabled> disables it without touching the attribute', async ({ page }) => {
    await gotoStory(page, 'components-toggle--in-fieldset', TAG);
    await expect(inner(page)).toBeDisabled();
    await expect(page.locator(TAG)).not.toHaveAttribute('disabled');
    await page.locator('fieldset').evaluate((el: HTMLFieldSetElement) => { el.disabled = false; });
    await expect(inner(page)).toBeEnabled();
  });

  test('icon-only toggle is named by the forwarded aria-label', async ({ page }) => {
    await gotoStory(page, 'components-toggle--icon-only', TAG);
    await expect(page.getByRole('button', { name: 'Toggle bold' })).toBeVisible();
  });

  test('warns once when it has no accessible name', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
    await gotoStory(page, 'components-toggle--default', TAG);
    await page.evaluate(async () => {
      const t = document.createElement('sb-toggle') as HTMLElement & { updateComplete: Promise<unknown> };
      document.body.append(t);
      await t.updateComplete;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    expect(warnings.filter((w) => w.includes('<sb-toggle> has no accessible name')).length).toBe(1);
  });

  test('screen-reader view: space presses the toggle', async ({ page }) => {
    await gotoStory(page, 'components-toggle--default', TAG);
    await inner(page).focus();
    await expect(inner(page)).toHaveAttribute('aria-pressed', 'false');
    await expectScreenReaderView(page, 'toggle-off');
    await page.keyboard.press('Space');
    await expect(inner(page)).toHaveAttribute('aria-pressed', 'true');
    await expectScreenReaderView(page, 'toggle-on');
  });

  for (const id of ['variants', 'pressed', 'outline', 'icon-only', 'disabled']) {
    test(`axe clean: ${id}`, async ({ page }) => {
      await gotoStory(page, `components-toggle--${id}`, TAG);
      expect(await axeViolations(page, TAG)).toEqual([]);
    });
  }
});
