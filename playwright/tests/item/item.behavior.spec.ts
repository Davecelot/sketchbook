import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, type AXNode } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenLength, tokenLineHeight, tokenNumber, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-item';
const TAGS = [TAG, 'sb-item-group', 'sb-item-separator', 'sb-item-media', 'sb-item-content', 'sb-item-title', 'sb-item-description', 'sb-item-actions', 'sb-item-header', 'sb-item-footer'];

const axTree = async (page: Page) => {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as unknown as { nodes: AXNode[] };
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const role = (n: AXNode) => (n.ignored ? 'ignored' : String(n.role?.value));
  const semanticChildren = (n: AXNode): AXNode[] =>
    (n.childIds ?? []).flatMap((id) => {
      const child = byId.get(id)!;
      return child.ignored || ['generic', 'none', 'presentation'].includes(role(child)) ? semanticChildren(child) : [child];
    });
  return { nodes, role, semanticChildren };
};

const css = (page: Page, selector: string, props: string[], inner = false) =>
  page.locator(selector).first().evaluate(
    (el, [names, useInner]) => {
      const target = useInner ? el.shadowRoot!.querySelector('[part="item"]')! : el;
      const s = getComputedStyle(target);
      return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
    },
    [props, inner] as const,
  );

const mixed = (page: Page, el: ReturnType<Page['locator']>, expression: string) =>
  el.evaluate((node, value) => {
    const probe = document.createElement('span');
    probe.style.background = value;
    node.after(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, expression);

test.describe('Item', () => {
  test('registers every element of the family', async ({ page }) => {
    await gotoStory(page, 'components-item--default', TAG);
    for (const tag of TAGS) expect(await page.evaluate((t) => !!customElements.get(t), tag)).toBe(true);
  });

  test('default is a wrapping flex row with token padding and gap and radius, a transparent border', async ({ page }) => {
    await gotoStory(page, 'components-item--default', TAG);
    expect(await css(page, TAG, ['display', 'flex-wrap', 'align-items', 'padding-top', 'padding-left', 'column-gap', 'border-top-left-radius', 'border-top-width', 'border-top-color', 'background-color', 'font-size'], true)).toEqual({
      display: 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'padding-top': await tokenLength(page.locator(TAG).first(), '--sb-item-padding'),
      'padding-left': await tokenLength(page.locator(TAG).first(), '--sb-item-padding'),
      'column-gap': await tokenLength(page.locator(TAG).first(), '--sb-item-gap'),
      'border-top-left-radius': await tokenLength(page.locator(TAG).first(), '--sb-item-radius'),
      'border-top-width': await tokenLength(page.locator(TAG).first(), '--sb-item-border-width'),
      'border-top-color': 'rgba(0, 0, 0, 0)',
      'background-color': 'rgba(0, 0, 0, 0)',
      'font-size': await tokenLength(page.locator(TAG).first(), '--sb-item-font-size'),
    });
  });

  test('variant and size reflect, and small tightens padding and gap', async ({ page }) => {
    await gotoStory(page, 'components-item--variants', TAG);
    const small = page.locator(TAG).nth(1);
    await expect(small).toHaveAttribute('size', 'small');
    expect((await css(page, `${TAG}[size="small"]`, ['padding-top', 'padding-left', 'column-gap'], true))).toEqual({
      'padding-top': await tokenLength(small, '--sb-item-padding-block-sm'),
      'padding-left': await tokenLength(small, '--sb-item-padding-inline-sm'),
      'column-gap': await tokenLength(small, '--sb-item-gap-sm'),
    });
    await small.evaluate((el) => ((el as HTMLElement & { size: string }).size = 'medium'));
    await expect(small).toHaveAttribute('size', 'medium');
    expect((await css(page, `${TAG}[size="medium"]`, ['padding-top'], true))['padding-top']).toBe(await tokenLength(small, '--sb-item-padding'));
    await expect(page.locator(`${TAG}[variant="tertiary"]`).first()).toHaveAttribute('variant', 'tertiary');
  });

  for (const mode of ['light', 'dark']) {
    test(`tertiary border and muted surface in ${mode} mode`, async ({ page }) => {
      await gotoStory(page, 'components-item--variants', TAG);
      await page.evaluate((m) => document.documentElement.setAttribute('data-theme', m), mode);
      const host = page.locator(TAG).first();
      const outline = `${TAG}[variant="tertiary"][size="medium"]`;
      await expect.poll(async () => (await css(page, outline, ['border-top-color'], true))['border-top-color']).toBe(await tokenColor(host, '--sb-color-border'));
      const muted = `${TAG}[variant="muted"][size="medium"]`;
      const expected = await mixed(page, host, 'color-mix(in oklab, var(--sb-color-muted) 50%, transparent)');
      await expect.poll(async () => (await css(page, muted, ['background-color'], true))['background-color']).toBe(expected);
      expect((await css(page, 'sb-item-description', ['color']))['color']).toBe(await tokenColor(host, '--sb-color-muted-foreground'));
    });
  }

  test('without href the row is a plain container, not a link', async ({ page }) => {
    await gotoStory(page, 'components-item--default', TAG);
    await expect(page.getByRole('link')).toHaveCount(0);
    expect(await page.locator(TAG).evaluate((el) => el.shadowRoot!.querySelector('[part="item"]')!.localName)).toBe('div');
    await expect(page.locator(TAG)).not.toHaveAttribute('role', /.*/);
  });

  test('an empty href is no link: no anchor without href', async ({ page }) => {
    await gotoStory(page, 'components-item--default', TAG);
    const part = await page.evaluate(async () => {
      const item = document.createElement('sb-item');
      item.setAttribute('href', '');
      item.textContent = 'Empty link';
      document.body.append(item);
      await (item as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      return item.shadowRoot!.querySelector('[part="item"]')!.localName;
    });
    expect(part).toBe('div');
  });

  test('href renders a native link named by the row text, followed with Enter', async ({ page }) => {
    await gotoStory(page, 'components-item--as-link', TAG);
    const link = page.getByRole('link', { name: /Quarterly plan/ });
    await expect(link).toHaveAttribute('href', '#plan');
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    expect(page.url()).toContain('#plan');
  });

  test('a linked row shows a solid focus ring for keyboard focus only', async ({ page }) => {
    await gotoStory(page, 'components-item--as-link', TAG);
    const link = page.getByRole('link', { name: /Quarterly plan/ });
    const ring = () => link.evaluate((el) => ({ shadow: getComputedStyle(el).boxShadow, border: getComputedStyle(el).borderTopColor }));
    await link.click();
    expect((await ring()).shadow).toBe('none');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const ringColor = await tokenColor(page.locator(TAG), '--sb-color-ring');
    await expect.poll(async () => (await ring()).shadow).toContain(await tokenLength(page.locator(TAG), '--sb-item-focus-ring-width'));
    await expect.poll(async () => (await ring()).shadow).toContain(ringColor);
    await expect.poll(async () => (await ring()).border).toBe(ringColor);
  });

  test('a linked row tints on hover; a plain row does not', async ({ page }) => {
    await gotoStory(page, 'components-item--as-link', TAG);
    const link = page.getByRole('link', { name: /Quarterly plan/ });
    await link.hover();
    const expected = await mixed(page, page.locator(TAG), 'color-mix(in oklab, var(--sb-color-accent) 50%, transparent)');
    await expect.poll(() => link.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(expected);
    await gotoStory(page, 'components-item--default', TAG);
    await page.locator(TAG).hover();
    expect((await css(page, TAG, ['background-color'], true))['background-color']).toBe('rgba(0, 0, 0, 0)');
  });

  test('a group is a list whose only semantic children are items', async ({ page }) => {
    await gotoStory(page, 'components-item--group', TAG);
    await expect(page.locator('sb-item-group')).toHaveAttribute('role', 'list');
    await expect(page.locator('sb-item-group > sb-item').first()).toHaveAttribute('role', 'listitem');
    await expect(page.locator('sb-item-separator').first()).toHaveAttribute('role', 'presentation');
    const { nodes, role, semanticChildren } = await axTree(page);
    const list = nodes.find((n) => role(n) === 'list')!;
    expect(semanticChildren(list).map(role)).toEqual(['listitem', 'listitem', 'listitem']);
  });

  test('a standalone item has no role, and roles are set before first render', async ({ page }) => {
    await gotoStory(page, 'components-item--default', TAG);
    const result = await page.evaluate(async () => {
      const group = document.createElement('sb-item-group');
      const item = document.createElement('sb-item');
      const alone = document.createElement('sb-item');
      const changes: (string | null)[] = [];
      new MutationObserver(() => changes.push(item.getAttribute('role'))).observe(item, { attributes: true, attributeFilter: ['role'] });
      group.append(item);
      document.body.append(group, alone);
      await Promise.all([group, item, alone].map((el) => (el as unknown as { updateComplete: Promise<unknown> }).updateComplete));
      return { alone: alone.getAttribute('role'), item: item.getAttribute('role'), group: group.getAttribute('role'), changes };
    });
    expect(result).toEqual({ alone: null, item: 'listitem', group: 'list', changes: ['listitem'] });
  });

  test('moving an item into or out of a group updates its listitem role, an author role stays', async ({ page }) => {
    await gotoStory(page, 'components-item--default', TAG);
    const roles = await page.evaluate(() => {
      const group = document.createElement('sb-item-group');
      const item = document.createElement('sb-item');
      const authored = document.createElement('sb-item');
      authored.setAttribute('role', 'button');
      const stray = document.createElement('div');
      document.body.append(group, stray, item, authored);
      const role = () => [item.getAttribute('role'), authored.getAttribute('role')];
      const out = [role()];
      group.append(item, authored);
      out.push(role());
      stray.append(item, authored);
      out.push(role());
      return out;
    });
    expect(roles).toEqual([[null, 'button'], ['listitem', 'button'], [null, 'button']]);
  });

  test('the separator is a thin rule across the group', async ({ page }) => {
    await gotoStory(page, 'components-item--group', TAG);
    const separator = page.locator('sb-item-separator').first();
    expect((await separator.boundingBox())!.height).toBe(await tokenPx(separator, '--sb-item-separator-height'));
    expect((await css(page, 'sb-item-separator', ['background-color']))['background-color']).toBe(await tokenColor(separator, '--sb-color-border'));
  });

  test('the separator stays visible in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-item--group', TAG);
    const separator = page.locator('sb-item-separator').first();
    const canvas = await separator.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:block;forced-color-adjust:none;background:Canvas';
      el.after(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    expect((await css(page, 'sb-item-separator', ['background-color']))['background-color']).not.toBe(canvas);
  });

  test('media frames: icon tile, image crop, primary unframed', async ({ page }) => {
    await gotoStory(page, 'components-item--media-variants', TAG);
    const media = page.locator('sb-item-media');
    await expect(media.nth(0)).toHaveAttribute('variant', 'primary');
    const tile = await tokenPx(media.nth(1), '--sb-item-media-icon-size');
    const crop = await tokenPx(media.nth(2), '--sb-item-media-image-size');
    const glyph = await tokenPx(media.nth(1), '--sb-item-media-icon-svg-size');
    expect((await media.nth(0).boundingBox())!.width).not.toBe(tile);
    expect(await media.nth(1).boundingBox()).toMatchObject({ width: tile, height: tile });
    expect(await css(page, 'sb-item-media[variant="icon"]', ['border-top-left-radius', 'border-top-width', 'background-color'])).toEqual({
      'border-top-left-radius': await tokenLength(media.nth(1), '--sb-item-media-icon-radius'),
      'border-top-width': await tokenLength(media.nth(1), '--sb-item-border-width'),
      'background-color': await tokenColor(media.nth(1), '--sb-color-muted'),
    });
    expect(await media.nth(1).locator('svg').boundingBox()).toMatchObject({ width: glyph, height: glyph });
    expect(await media.nth(2).boundingBox()).toMatchObject({ width: crop, height: crop });
    expect(await media.nth(2).locator('img').boundingBox()).toMatchObject({ width: crop, height: crop });
  });

  test('media moves to the top when a description exists, and back when it is removed', async ({ page }) => {
    await gotoStory(page, 'components-item--default', TAG);
    const host = page.locator(TAG);
    await expect(host).toHaveAttribute('data-has-description', '');
    const media = page.locator('sb-item-media');
    expect(await media.evaluate((el) => getComputedStyle(el).alignSelf)).toMatch(/start/);
    const [mediaBox, contentBox] = await Promise.all([media.boundingBox(), page.locator('sb-item-content').boundingBox()]);
    expect(Math.abs(mediaBox!.y - (contentBox!.y + (await tokenPx(media, '--sb-item-media-offset'))))).toBeLessThanOrEqual(1);
    await page.locator('sb-item-description').evaluate((el) => el.remove());
    await expect(host).not.toHaveAttribute('data-has-description', /.*/);
    expect(await media.evaluate((el) => getComputedStyle(el).alignSelf)).toBe('auto');
  });

  test('content grows; a second content block does not', async ({ page }) => {
    await gotoStory(page, 'components-item--two-content-blocks', TAG);
    const [first, second] = [page.locator('sb-item-content').nth(0), page.locator('sb-item-content').nth(1)];
    await expect(first).not.toHaveAttribute('data-fixed', /.*/);
    await expect(second).toHaveAttribute('data-fixed', '');
    expect(await first.evaluate((el) => getComputedStyle(el).flexGrow)).toBe('1');
    expect(await second.evaluate((el) => getComputedStyle(el).flexGrow)).toBe('0');
    expect((await first.boundingBox())!.width).toBeGreaterThan((await second.boundingBox())!.width);
  });

  test('title takes the label weight; description is muted, body size and not clamped', async ({ page }) => {
    await gotoStory(page, 'components-item--default', TAG);
    expect((await css(page, 'sb-item-title', ['font-weight', 'display']))).toEqual({ 'font-weight': String(await tokenNumber(page.locator('sb-item-title'), '--sb-item-title-font-weight')), display: 'flex' });
    await page.locator('sb-item-description').evaluate((el) => (el.textContent = 'Long text. '.repeat(40)));
    expect(await css(page, 'sb-item-description', ['font-size', '-webkit-line-clamp', 'overflow'])).toEqual({
      'font-size': await tokenLength(page.locator('sb-item-description'), '--sb-item-font-size'),
      '-webkit-line-clamp': 'none',
      overflow: 'visible',
    });
    const line = parseFloat(await tokenLineHeight(page.locator('sb-item-description'), '--sb-item-description-line-height', '--sb-item-font-size'));
    expect((await page.locator('sb-item-description').boundingBox())!.height).toBeGreaterThan(3 * line);
  });

  test('actions are a row with the actions gap; header and footer span the full row', async ({ page }) => {
    await gotoStory(page, 'components-item--header-and-footer', TAG);
    const [item, header, footer] = await Promise.all([page.locator(TAG), page.locator('sb-item-header'), page.locator('sb-item-footer')].map((l) => l.boundingBox()));
    const inset = 2 * ((await tokenPx(page.locator(TAG), '--sb-item-padding')) + (await tokenPx(page.locator(TAG), '--sb-item-border-width')));
    expect(Math.abs(header!.width - (item!.width - inset))).toBeLessThanOrEqual(1);
    expect(Math.abs(footer!.width - header!.width)).toBeLessThanOrEqual(1);
    expect(header!.y).toBeLessThan((await page.locator('sb-item-content').boundingBox())!.y);
    expect((await css(page, 'sb-item-header', ['justify-content', 'column-gap']))).toEqual({ 'justify-content': 'space-between', 'column-gap': await tokenLength(page.locator('sb-item-header'), '--sb-item-actions-gap') });
    await gotoStory(page, 'components-item--with-actions', TAG);
    expect((await css(page, 'sb-item-actions', ['display', 'column-gap']))).toEqual({ display: 'flex', 'column-gap': await tokenLength(page.locator('sb-item-actions'), '--sb-item-actions-gap') });
  });

  test('links in the description are underlined', async ({ page }) => {
    await gotoStory(page, 'components-item--default', TAG);
    await page.locator('sb-item-description').evaluate((el) => (el.innerHTML = 'See <a href="#more">the notes</a>'));
    expect(await page.getByRole('link', { name: 'the notes' }).evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('underline');
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'variants', 'with-actions', 'as-link', 'media-variants', 'header-and-footer', 'group', 'two-content-blocks']) {
      await gotoStory(page, `components-item--${id}`, TAG);
      expect(await axeViolations(page, 'sb-item, sb-item-group', ['sb-button'])).toEqual([]);
    }
  });
});

test('href: javascript:, vbscript: and data: URLs are not rendered, other URLs are (SB-0115)', async ({ page }) => {
  await gotoStory(page, 'components-item--default', TAG);
  const urls = ['java\tscript:alert(1)', ' JAVASCRIPT:alert(1)', 'vbscript:msgbox(1)', 'data:text/html,x', 'https://example.com/a', '/docs#b', 'sms:+100'];
  const tags = ['sb-item'];
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
