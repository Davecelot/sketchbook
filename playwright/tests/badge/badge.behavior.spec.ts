import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenLength, tokenLineHeight, tokenNumber, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-badge';
const VARIANTS = ['primary', 'secondary', 'destructive', 'tertiary', 'ghost', 'link'];
// Line box plus the vertical padding and border tokens: the height every variant shares.
const badgeHeight = async (host: Locator) => {
  const [line, padding, border] = await Promise.all([
    tokenLineHeight(host, '--sb-badge-line-height', '--sb-badge-font-size'),
    tokenPx(host, '--sb-badge-padding-y'),
    tokenPx(host, '--sb-badge-border-width'),
  ]);
  return parseFloat(line) + 2 * padding + 2 * border;
};
const badge = (host: Locator, props: string[]) =>
  host.evaluate(
    (el, names) => {
      const s = getComputedStyle(el.shadowRoot!.querySelector('[part="badge"]')!);
      return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
    },
    props,
  );
const variant = (page: Page, name: string) => page.locator(`${TAG}[variant="${name}"]`);
const tokenValue = (page: Page, token: string, prop: string) =>
  page.evaluate(
    ([t, p]) => {
      const probe = document.createElement('span');
      probe.style.cssText = `${p}:var(${t})`;
      document.body.append(probe);
      const v = getComputedStyle(probe).getPropertyValue(p);
      probe.remove();
      return v;
    },
    [token, prop] as const,
  );
const tag = (host: Locator) => host.evaluate((el) => el.shadowRoot!.querySelector('[part="badge"]')!.localName);

test.describe('Badge', () => {
  test('is a span by default with the text as content', async ({ page }) => {
    await gotoStory(page, 'components-badge--default', TAG);
    const host = page.locator(TAG);
    expect(await tag(host)).toBe('span');
    await expect(host).toHaveText('Badge');
    await expect(host).toHaveAttribute('variant', 'primary');
    await expect(page.getByRole('link')).toHaveCount(0);
  });

  test('href renders a native link named by its text, and swaps back without it', async ({ page }) => {
    await gotoStory(page, 'components-badge--as-link', TAG);
    const first = variant(page, 'primary');
    expect(await tag(first)).toBe('a');
    await expect(page.getByRole('link', { name: 'primary', exact: true })).toHaveAttribute('href', '#badges');
    await first.evaluate((el) => el.removeAttribute('href'));
    await expect.poll(() => tag(first)).toBe('span');
  });

  for (const [name, token] of [['primary', 'default'], ['secondary', 'secondary'], ['destructive', 'destructive']] as const) {
    test(`${name} is filled from its tokens`, async ({ page }) => {
      await gotoStory(page, 'components-badge--variants', TAG);
      const host = variant(page, name);
      const s = await badge(host, ['background-color', 'color']);
      expect(s['background-color']).toBe(await tokenColor(host, `--sb-badge-${token}-bg`));
      expect(s.color).toBe(await tokenColor(host, `--sb-badge-${token}-fg`));
    });
  }

  test('tertiary has a border color and no fill', async ({ page }) => {
    await gotoStory(page, 'components-badge--variants', TAG);
    const host = variant(page, 'tertiary');
    const s = await badge(host, ['background-color', 'color', 'border-top-color']);
    expect(s['background-color']).toBe('rgba(0, 0, 0, 0)');
    expect(s.color).toBe(await tokenColor(host, '--sb-badge-outline-fg'));
    expect(s['border-top-color']).toBe(await tokenColor(host, '--sb-badge-outline-border'));
  });

  test('ghost and link have no fill; link text is primary', async ({ page }) => {
    await gotoStory(page, 'components-badge--variants', TAG);
    const ghost = await badge(variant(page, 'ghost'), ['background-color', 'color']);
    expect(ghost['background-color']).toBe('rgba(0, 0, 0, 0)');
    expect(ghost.color).toBe(await tokenColor(variant(page, 'ghost'), '--sb-badge-ghost-fg'));
    const link = variant(page, 'link');
    const l = await badge(link, ['background-color', 'color']);
    expect(l['background-color']).toBe('rgba(0, 0, 0, 0)');
    expect(l.color).toBe(await tokenColor(link, '--sb-badge-link-fg'));
  });

  test('is a pill with the token size, padding, gap and icon size', async ({ page }) => {
    await gotoStory(page, 'components-badge--with-icon', TAG);
    const host = page.locator(TAG);
    const s = await badge(host, ['border-top-left-radius', 'padding-left', 'padding-top', 'column-gap', 'font-size', 'font-weight', 'white-space', 'border-top-width']);
    expect(s['border-top-left-radius']).toBe(await tokenValue(page, '--sb-badge-radius', 'border-top-left-radius'));
    expect(s['padding-left']).toBe(await tokenValue(page, '--sb-badge-padding-x', 'padding-left'));
    expect(s['padding-top']).toBe(await tokenValue(page, '--sb-badge-padding-y', 'padding-top'));
    expect(s['column-gap']).toBe(await tokenValue(page, '--sb-badge-gap', 'column-gap'));
    expect(s['font-size']).toBe(await tokenValue(page, '--sb-badge-font-size', 'font-size'));
    expect(Number(s['font-weight'])).toBe(await tokenNumber(host, '--sb-badge-font-weight'));
    expect(s['white-space']).toBe('nowrap');
    expect(s['border-top-width']).toBe(await tokenLength(host, '--sb-badge-border-width'));
    expect(await host.evaluate((el) => getComputedStyle(el).display)).toBe('inline-flex');
    expect((await host.boundingBox())!.height).toBeCloseTo(await badgeHeight(host), 0);
    const icon = await tokenPx(host, '--sb-badge-icon-size');
    expect(await page.locator(`${TAG} svg`).boundingBox()).toMatchObject({ width: icon, height: icon });
  });

  test('every variant is the same size', async ({ page }) => {
    await gotoStory(page, 'components-badge--variants', TAG);
    const heights = await Promise.all(VARIANTS.map(async (n) => (await variant(page, n).boundingBox())!.height));
    const expected = await badgeHeight(variant(page, 'primary'));
    for (const h of heights) expect(h).toBeCloseTo(expected, 0);
  });

  test('a link badge reacts to hover; a plain badge does not', async ({ page }) => {
    await gotoStory(page, 'components-badge--as-link', TAG);
    const link = variant(page, 'primary');
    const before = (await badge(link, ['background-color']))['background-color'];
    await link.hover();
    expect((await badge(link, ['background-color']))['background-color']).not.toBe(before);
    const ghost = variant(page, 'ghost');
    await ghost.hover();
    await expect.poll(async () => (await badge(ghost, ['background-color']))['background-color']).toBe(await tokenColor(ghost, '--sb-badge-ghost-bg-hover'));
    await gotoStory(page, 'components-badge--variants', TAG);
    const plain = variant(page, 'primary');
    const plainBefore = (await badge(plain, ['background-color']))['background-color'];
    await plain.hover();
    expect((await badge(plain, ['background-color']))['background-color']).toBe(plainBefore);
  });

  test('a link badge is at least the minimum target height, a plain one is not enlarged', async ({ page }) => {
    await gotoStory(page, 'components-badge--as-link', TAG);
    const box = await variant(page, 'primary').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(await tokenPx(variant(page, 'primary'), '--sb-badge-link-min-height'));
  });

  test('keyboard: Tab focuses a link badge with a ring, Enter follows it', async ({ page }) => {
    await gotoStory(page, 'components-badge--as-link', TAG);
    await page.keyboard.press('Tab');
    const first = variant(page, 'primary');
    expect(await first.evaluate((el) => el.matches(':focus-within') || el === document.activeElement)).toBe(true);
    const ringColor = await tokenColor(first, '--sb-badge-focus-ring-color');
    await expect.poll(async () => (await badge(first, ['box-shadow']))['box-shadow']).toContain(ringColor);
    await page.keyboard.press('Enter');
    expect(page.url()).toContain('#badges');
  });

  test('host focus() reaches the link, and a plain badge is not focusable', async ({ page }) => {
    await gotoStory(page, 'components-badge--as-link', TAG);
    await variant(page, 'secondary').evaluate((el) => (el as HTMLElement).focus());
    expect(await page.evaluate(() => document.activeElement?.getAttribute('variant'))).toBe('secondary');
    await gotoStory(page, 'components-badge--default', TAG);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });

  for (const id of ['default', 'variants', 'as-link', 'with-icon', 'count']) {
    test(`has no axe violations (${id})`, async ({ page }) => {
      await gotoStory(page, `components-badge--${id}`, TAG);
      expect(await axeViolations(page, '#storybook-root')).toEqual([]);
    });
  }
});

test('href: javascript:, vbscript: and data: URLs are not rendered, other URLs are (SB-0115)', async ({ page }) => {
  await gotoStory(page, 'components-badge--default', TAG);
  const urls = ['java\tscript:alert(1)', ' JAVASCRIPT:alert(1)', 'vbscript:msgbox(1)', 'data:text/html,x', 'https://example.com/a', '/docs#b', 'sms:+100'];
  const tags = ['sb-badge'];
  const rendered = await page.evaluate(
    async ([tagNames, hrefs]) => {
      const out: (string | null)[] = [];
      for (const tag of tagNames)
        for (const href of hrefs) {
          const el = document.createElement(tag) as HTMLElement & { updateComplete: Promise<unknown> };
          el.setAttribute('href', href);
          el.textContent = 'Link';
          document.body.append(el);
          await el.updateComplete;
          out.push(el.shadowRoot!.querySelector('a')?.getAttribute('href') ?? null);
          el.remove();
        }
      return out;
    },
    [tags, urls] as const,
  );
  expect(rendered).toEqual(tags.flatMap(() => [null, null, null, null, ...urls.slice(4)]));
});
