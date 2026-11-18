import type { Locator } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor } from '../../helpers/tokens';

const TAG = 'sb-kbd';
const inner = (host: Locator, part: string, props: string[]) =>
  host.evaluate(
    (el, [p, names]) => {
      const s = getComputedStyle(el.shadowRoot!.querySelector(`[part="${p}"]`)!);
      return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
    },
    [part, props] as const,
  );
const tokenLength = (host: Locator, token: string, prop = 'width') =>
  host.evaluate(
    (el, [t, p]) => {
      const probe = document.createElement('span');
      probe.style.cssText = `display:block;${p}:var(${t})`;
      el.after(probe);
      const v = getComputedStyle(probe).getPropertyValue(p);
      probe.remove();
      return v;
    },
    [token, prop] as const,
  );

test.describe('Kbd', () => {
  test('renders a native kbd with the slotted text', async ({ page }) => {
    await gotoStory(page, 'components-kbd--default', TAG);
    const host = page.locator(TAG);
    expect(await host.evaluate((el) => el.shadowRoot!.querySelector('[part="key"]')!.localName)).toBe('kbd');
    await expect(host).toHaveText('Esc');
  });

  test('is the key height with the key minimum width, and grows with its text', async ({ page }) => {
    await gotoStory(page, 'components-kbd--default', TAG);
    const host = page.locator(TAG);
    const box = await host.boundingBox();
    const height = parseFloat(await tokenLength(host, '--sb-kbd-height'));
    const minWidth = parseFloat(await tokenLength(host, '--sb-kbd-min-width'));
    expect(box!.height).toBe(height);
    expect(box!.width).toBeGreaterThanOrEqual(minWidth);
    // With the padding taken out and a narrow glyph the minimum is what sets the width, whatever the brand's padding and type size.
    await host.evaluate((el) => {
      el.style.setProperty('--sb-kbd-padding-x', '0px');
      el.textContent = 'I';
    });
    expect((await host.boundingBox())!.width).toBe(minWidth);
    await host.evaluate((el) => {
      el.style.removeProperty('--sb-kbd-padding-x');
      el.textContent = 'Shift';
    });
    expect((await host.boundingBox())!.width).toBeGreaterThan(minWidth);
    expect(await inner(host, 'key', ['height', 'min-width'])).toEqual({ height: await tokenLength(host, '--sb-kbd-height'), 'min-width': await tokenLength(host, '--sb-kbd-min-width') });
  });

  test('takes color, background, font and radius from its tokens', async ({ page }) => {
    await gotoStory(page, 'components-kbd--default', TAG);
    const host = page.locator(TAG);
    const s = await inner(host, 'key', ['color', 'background-color', 'font-size', 'font-weight', 'border-top-left-radius', 'padding-left']);
    expect(s.color).toBe(await tokenColor(host, '--sb-kbd-fg'));
    expect(s['background-color']).toBe(await tokenColor(host, '--sb-kbd-bg'));
    expect(s['font-size']).toBe(await tokenLength(host, '--sb-kbd-font-size', 'font-size'));
    expect(s['font-weight']).toBe('500');
    expect(s['border-top-left-radius']).toBe(await tokenLength(host, '--sb-kbd-radius', 'border-top-left-radius'));
    expect(s['padding-left']).toBe(await tokenLength(host, '--sb-kbd-padding-x', 'padding-left'));
  });

  test('a slotted svg takes the icon size', async ({ page }) => {
    await gotoStory(page, 'components-kbd--with-icon', TAG);
    const box = await page.locator(`${TAG} svg`).boundingBox();
    const icon = parseFloat(await tokenLength(page.locator(TAG), '--sb-kbd-icon-size'));
    expect(box).toMatchObject({ width: icon, height: icon });
    await expect(page.getByRole('img', { name: 'Shift' })).toBeVisible();
  });

  test('a group lays keys out in a row with the gap token', async ({ page }) => {
    await gotoStory(page, 'components-kbd--group', 'sb-kbd-group');
    const group = page.locator('sb-kbd-group');
    expect(await group.evaluate((el) => el.shadowRoot!.querySelector('[part="group"]')!.localName)).toBe('kbd');
    const s = await inner(group, 'group', ['column-gap', 'align-items']);
    expect(await group.evaluate((el) => getComputedStyle(el).display)).toBe('inline-flex');
    expect(s['column-gap']).toBe(await tokenLength(group, '--sb-kbd-group-gap', 'column-gap'));
    expect(s['align-items']).toBe('center');
    const boxes = await page.locator(TAG).evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    expect(boxes).toHaveLength(3);
    expect(boxes[1]!.left - boxes[0]!.right).toBe(parseFloat(await tokenLength(group, '--sb-kbd-group-gap')));
    expect(boxes[2]!.top).toBe(boxes[0]!.top);
  });

  test('the group does not fall back to the native kbd monospace font', async ({ page }) => {
    await gotoStory(page, 'components-kbd--group', 'sb-kbd-group');
    const group = page.locator('sb-kbd-group');
    const s = await inner(group, 'group', ['font-family', 'font-size']);
    const host = await group.evaluate((el) => ({ family: getComputedStyle(el).fontFamily, size: getComputedStyle(el).fontSize }));
    expect(s['font-family']).toBe(host.family);
    expect(s['font-size']).toBe(host.size);
  });

  test('keys sit inline in a sentence', async ({ page }) => {
    await gotoStory(page, 'components-kbd--in-text', TAG);
    const [key, line] = [await page.locator(TAG).first().boundingBox(), await page.locator('p:has(sb-kbd)').boundingBox()];
    expect(key!.y).toBeGreaterThanOrEqual(line!.y);
    expect(key!.y + key!.height).toBeLessThanOrEqual(line!.y + line!.height + 4);
  });

  test('is not focusable and adds no role', async ({ page }) => {
    await gotoStory(page, 'components-kbd--group', TAG);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    expect(await page.locator(TAG).first().getAttribute('role')).toBeNull();
  });

  for (const id of ['default', 'group', 'with-icon', 'in-text']) {
    test(`has no axe violations (${id})`, async ({ page }) => {
      await gotoStory(page, `components-kbd--${id}`, TAG);
      expect(await axeViolations(page, id === 'in-text' ? 'p:has(sb-kbd)' : TAG)).toEqual([]);
    });
  }
});
