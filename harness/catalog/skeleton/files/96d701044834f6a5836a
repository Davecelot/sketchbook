import type { Locator } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenSeconds } from '../../helpers/tokens';

const TAG = 'sb-skeleton';
const block = (host: Locator, props: string[]) =>
  host.evaluate(
    (el, names) => {
      const s = getComputedStyle(el.shadowRoot!.querySelector('[part="block"]')!);
      return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
    },
    props,
  );
const tokenValue = (host: Locator, token: string, prop: string) =>
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

test.describe('Skeleton', () => {
  test('is hidden from assistive technology', async ({ page }) => {
    await gotoStory(page, 'components-skeleton--default', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('aria-hidden', 'true');
    const tree = await page.locator(TAG).evaluate((el) => (el.parentElement as HTMLElement).innerText);
    expect(tree).toBe('');
  });

  test('aria-hidden is present from the first render', async ({ page }) => {
    await gotoStory(page, 'components-skeleton--default', TAG);
    const seen = await page.evaluate(async () => {
      const el = document.createElement('sb-skeleton');
      document.body.append(el);
      const first = el.getAttribute('aria-hidden');
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      return [first, el.getAttribute('aria-hidden')];
    });
    expect(seen).toEqual(['true', 'true']);
  });

  test('takes the size the author gives it', async ({ page }) => {
    await gotoStory(page, 'components-skeleton--default', TAG);
    // The story sizes it in rem (16rem by 1rem): the author's size, followed through the root font size.
    const rem = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(await page.locator(TAG).boundingBox()).toMatchObject({ width: 16 * rem, height: rem });
  });

  test('fill and radius come from tokens, and the radius can be overridden', async ({ page }) => {
    await gotoStory(page, 'components-skeleton--default', TAG);
    const host = page.locator(TAG);
    const s = await block(host, ['background-color', 'border-top-left-radius']);
    expect(s['background-color']).toBe(await tokenColor(host, '--sb-skeleton-bg'));
    expect(s['border-top-left-radius']).toBe(await tokenValue(host, '--sb-skeleton-radius', 'border-top-left-radius'));
    await gotoStory(page, 'components-skeleton--card-placeholder', TAG);
    const round = page.locator(TAG).first();
    const r = (await block(round, ['border-top-left-radius']))['border-top-left-radius'];
    expect(parseFloat(r!)).toBeGreaterThan(1000);
  });

  test('pulses at twice the loop duration', async ({ page }) => {
    await gotoStory(page, 'components-skeleton--default', TAG);
    const a = await block(page.locator(TAG), ['animation-name', 'animation-duration', 'animation-iteration-count']);
    expect(a['animation-name']).not.toBe('none');
    expect(parseFloat(a['animation-duration']!)).toBeCloseTo(await tokenSeconds(page.locator(TAG).first(), '--sb-skeleton-duration', 2), 3);
    expect(a['animation-iteration-count']).toBe('infinite');
  });

  test('does not animate with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, 'components-skeleton--default', TAG);
    expect((await block(page.locator(TAG), ['animation-name']))['animation-name']).toBe('none');
  });

  test('stays visible in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-skeleton--default', TAG);
    const host = page.locator(TAG);
    const fill = (await block(host, ['background-color']))['background-color'];
    const canvas = await host.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:block;forced-color-adjust:none;background:Canvas';
      el.after(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    expect(fill).not.toBe(canvas);
  });

  test('is not focusable', async ({ page }) => {
    await gotoStory(page, 'components-skeleton--default', TAG);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });

  for (const id of ['default', 'card-placeholder']) {
    test(`has no axe violations (${id})`, async ({ page }) => {
      await gotoStory(page, `components-skeleton--${id}`, TAG);
      expect(await axeViolations(page, '#storybook-root')).toEqual([]);
    });
  }
});
