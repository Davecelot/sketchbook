import type { Locator } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-separator';
const line = (host: Locator, props: string[]) =>
  host.evaluate(
    (el, names) => {
      const s = getComputedStyle(el.shadowRoot!.querySelector('[part="line"]')!);
      return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
    },
    props,
  );
const tokenLength = (host: Locator, token: string) =>
  host.evaluate((el, t) => {
    const probe = document.createElement('span');
    probe.style.cssText = `display:block;width:var(${t})`;
    el.after(probe);
    const v = getComputedStyle(probe).width;
    probe.remove();
    return v;
  }, token);

test.describe('Separator', () => {
  test('is decorative by default: role none, not in the accessibility tree', async ({ page }) => {
    await gotoStory(page, 'components-separator--default', TAG);
    const host = page.locator(TAG);
    await expect(host).toHaveAttribute('role', 'none');
    await expect(host).toHaveAttribute('orientation', 'horizontal');
    await expect(page.getByRole('separator')).toHaveCount(0);
  });

  test('decorative="false" exposes a horizontal separator without aria-orientation', async ({ page }) => {
    await gotoStory(page, 'components-separator--semantic', TAG);
    const host = page.locator(TAG);
    await expect(host).toHaveAttribute('role', 'separator');
    expect(await host.getAttribute('aria-orientation')).toBeNull();
    await expect(page.getByRole('separator')).toHaveCount(1);
  });

  test('a semantic vertical separator sets aria-orientation', async ({ page }) => {
    await gotoStory(page, 'components-separator--semantic-vertical', TAG);
    const sep = page.getByRole('separator');
    await expect(sep).toHaveAttribute('aria-orientation', 'vertical');
  });

  test('a decorative vertical separator has no role or orientation semantics', async ({ page }) => {
    await gotoStory(page, 'components-separator--vertical', TAG);
    await expect(page.getByRole('separator')).toHaveCount(0);
    expect(await page.locator(TAG).first().getAttribute('aria-orientation')).toBeNull();
  });

  test('the role is right from the first render and follows the property', async ({ page }) => {
    await gotoStory(page, 'components-separator--default', TAG);
    const roles = await page.evaluate(async () => {
      const seen: (string | null)[] = [];
      const el = document.createElement('sb-separator');
      new MutationObserver(() => seen.push(el.getAttribute('role'))).observe(el, { attributes: true, attributeFilter: ['role'] });
      document.body.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      seen.push(el.getAttribute('role'));
      (el as unknown as { decorative: boolean }).decorative = false;
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      seen.push(el.getAttribute('role'));
      return seen;
    });
    expect(roles.filter((r) => r === null)).toEqual([]);
    expect(roles.at(-1)).toBe('separator');
    expect(roles[0]).toBe('none');
  });

  test('horizontal is one thickness high and fills its container', async ({ page }) => {
    await gotoStory(page, 'components-separator--default', TAG);
    const host = page.locator(TAG);
    const box = await host.boundingBox();
    const parentWidth = await host.evaluate((el) => el.parentElement!.getBoundingClientRect().width);
    expect(box!.height).toBe(await tokenPx(host, '--sb-separator-thickness'));
    expect(box!.width).toBe(parentWidth);
  });

  test('vertical is one thickness wide and as high as its flex row', async ({ page }) => {
    await gotoStory(page, 'components-separator--vertical', TAG);
    const box = await page.locator(TAG).first().boundingBox();
    expect(box!.width).toBe(await tokenPx(page.locator(TAG).first(), '--sb-separator-thickness'));
    expect(box!.height).toBe(20); // the story's own 20px flex row
  });

  test('color and thickness come from tokens', async ({ page }) => {
    await gotoStory(page, 'components-separator--default', TAG);
    const host = page.locator(TAG);
    const s = await line(host, ['background-color', 'height']);
    expect(s['background-color']).toBe(await tokenColor(host, '--sb-separator-color'));
    expect(s.height).toBe(await tokenLength(host, '--sb-separator-thickness'));
  });

  test('stays visible in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-separator--semantic', TAG);
    const host = page.locator(TAG);
    const s = await line(host, ['background-color']);
    const canvas = await host.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:block;forced-color-adjust:none;background:Canvas';
      el.after(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    expect(s['background-color']).not.toBe(canvas);
  });

  test('is not focusable', async ({ page }) => {
    await gotoStory(page, 'components-separator--semantic', TAG);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });

  for (const id of ['default', 'vertical', 'semantic', 'semantic-vertical']) {
    test(`has no axe violations (${id})`, async ({ page }) => {
      await gotoStory(page, `components-separator--${id}`, TAG);
      expect(await axeViolations(page, '#storybook-root')).toEqual([]);
    });
  }
});
