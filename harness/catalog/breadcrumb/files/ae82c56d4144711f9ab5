import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, type AXNode } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenLength, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-breadcrumb';
const TAGS = [TAG, 'sb-breadcrumb-list', 'sb-breadcrumb-item', 'sb-breadcrumb-link', 'sb-breadcrumb-page', 'sb-breadcrumb-separator', 'sb-breadcrumb-ellipsis'];

const axTree = async (page: Page) => {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as unknown as { nodes: AXNode[] };
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const role = (n: AXNode) => (n.ignored ? 'ignored' : String(n.role?.value));
  // Children as assistive technology sees them: ignored and generic wrappers are looked through.
  const semanticChildren = (n: AXNode): AXNode[] =>
    (n.childIds ?? []).flatMap((id) => {
      const child = byId.get(id)!;
      return child.ignored || ['generic', 'none', 'presentation'].includes(role(child)) ? semanticChildren(child) : [child];
    });
  return { nodes, role, semanticChildren };
};

const css = (page: Page, selector: string, props: string[]) =>
  page.locator(selector).first().evaluate((el, names) => {
    const s = getComputedStyle(el);
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
  }, props);

test.describe('Breadcrumb', () => {
  test('registers every element of the family', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    for (const tag of TAGS) expect(await page.evaluate((t) => !!customElements.get(t), tag)).toBe(true);
  });

  test('is a navigation landmark named by label', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(1);
    await page.locator(TAG).evaluate((el) => ((el as HTMLElement & { label: string }).label = 'Ruta de navegacion'));
    await expect(page.getByRole('navigation', { name: 'Ruta de navegacion' })).toHaveCount(1);
  });

  test('the accessibility tree has one list whose children are exactly the steps', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    const { nodes, role, semanticChildren } = await axTree(page);
    const lists = nodes.filter((n) => role(n) === 'list');
    expect(lists).toHaveLength(1);
    expect(semanticChildren(lists[0]!).map(role)).toEqual(['listitem', 'listitem', 'listitem']);
    expect(nodes.filter((n) => role(n) === 'listitem')).toHaveLength(3);
  });

  test('the default chevron separator mirrors in right-to-left', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    const icon = page.locator('sb-breadcrumb-separator').first().locator('svg');
    expect(await icon.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    expect(await icon.evaluate((el) => getComputedStyle(el).transform)).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  });

  test('separators are hidden from assistive technology', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    const separators = page.locator('sb-breadcrumb-separator');
    await expect(separators.first()).toHaveAttribute('role', 'presentation');
    await expect(separators.first()).toHaveAttribute('aria-hidden', 'true');
    const { nodes, role } = await axTree(page);
    expect(nodes.filter((n) => role(n) === 'image' || role(n) === 'img')).toHaveLength(0);
  });

  test('item and list roles are set before first render', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    const roles = await page.evaluate(async () => {
      const seen: Record<string, (string | null)[]> = { list: [], item: [] };
      const list = document.createElement('sb-breadcrumb-list');
      const item = document.createElement('sb-breadcrumb-item');
      new MutationObserver(() => seen.list!.push(list.getAttribute('role'))).observe(list, { attributes: true, attributeFilter: ['role'] });
      new MutationObserver(() => seen.item!.push(item.getAttribute('role'))).observe(item, { attributes: true, attributeFilter: ['role'] });
      list.append(item);
      document.body.append(list);
      await Promise.all([list, item].map((el) => (el as unknown as { updateComplete: Promise<unknown> }).updateComplete));
      return { list: list.getAttribute('role'), item: item.getAttribute('role'), changes: seen };
    });
    expect(roles).toEqual({ list: 'list', item: 'listitem', changes: { list: ['list'], item: ['listitem'] } });
  });

  test('the current page is an unfocusable, disabled link node marked aria-current=page', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    const current = page.locator('sb-breadcrumb-page [aria-current="page"]');
    await expect(page.locator('sb-breadcrumb-page')).toHaveText('Reports');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('link', { name: 'Reports' })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('sb-breadcrumb-page [href], sb-breadcrumb-page [tabindex]')).toHaveCount(0);
    const { nodes, role } = await axTree(page);
    // Chromium's AX tree has no 'current' property; a link node (not a pruned generic one) is what carries aria-current.
    const link = nodes.find((n) => role(n) === 'link' && n.name?.value === 'Reports');
    expect(link?.properties?.find((p) => p.name === 'disabled')?.value.value).toBe(true);
    expect(link?.properties?.some((p) => p.name === 'focusable')).toBe(false);
  });

  test('links are links with their href, in tab order', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    const home = page.getByRole('link', { name: 'Home' });
    await expect(home).toHaveAttribute('href', '#home');
    await page.keyboard.press('Tab');
    await expect(home).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Library' })).toBeFocused();
    await page.keyboard.press('Enter');
    expect(page.url()).toContain('#library');
  });

  test('shows a solid focus ring for keyboard focus only', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // no transition to wait out
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    const home = page.getByRole('link', { name: 'Home' });
    const ring = () => home.evaluate((el) => getComputedStyle(el).boxShadow);
    await home.click();
    expect(await ring()).toBe('none');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect.poll(ring).toContain(await tokenLength(page.locator(TAG), '--sb-breadcrumb-focus-ring-width'));
    await expect.poll(ring).toContain(await tokenColor(page.locator(TAG), '--sb-color-ring'));
  });

  for (const mode of ['light', 'dark']) {
    test(`link, page and hover colors in ${mode} mode`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' }); // no transition to wait out
      await gotoStory(page, 'components-breadcrumb--default', TAG);
      await page.evaluate((m) => document.documentElement.setAttribute('data-theme', m), mode);
      const host = page.locator(TAG);
      const home = page.getByRole('link', { name: 'Home' });
      const color = (l: typeof home) => l.evaluate((el) => getComputedStyle(el).color);
      await expect.poll(() => color(home)).toBe(await tokenColor(host, '--sb-color-muted-foreground'));
      await expect.poll(() => color(page.locator('sb-breadcrumb-page [aria-current]'))).toBe(await tokenColor(host, '--sb-color-foreground'));
      await home.hover();
      await expect.poll(() => color(home)).toBe(await tokenColor(host, '--sb-color-foreground'));
    });
  }

  test('the ellipsis is read by its label, with the dots hidden', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--with-ellipsis', TAG);
    const { nodes, role } = await axTree(page);
    expect(nodes.some((n) => role(n) === 'StaticText' && n.name?.value === 'More')).toBe(true);
    expect(await page.locator('sb-breadcrumb-ellipsis').evaluate((el) => el.shadowRoot!.querySelector('[part="icon"]')!.getAttribute('aria-hidden'))).toBe('true');
    await page.locator('sb-breadcrumb-ellipsis').evaluate((el) => ((el as HTMLElement & { label: string }).label = 'Hidden pages'));
    await expect(page.locator('sb-breadcrumb-ellipsis').locator('[part="label"]')).toHaveText('Hidden pages');
    const ellipsis = await tokenPx(page.locator('sb-breadcrumb-ellipsis'), '--sb-breadcrumb-ellipsis-size');
    expect(await page.locator('sb-breadcrumb-ellipsis').boundingBox()).toMatchObject({ width: ellipsis, height: ellipsis });
  });

  test('separator shows a chevron at the separator size by default and accepts replacement content', async ({ page }) => {
    await gotoStory(page, 'components-breadcrumb--default', TAG);
    const chevron = await tokenPx(page.locator(TAG), '--sb-breadcrumb-separator-size');
    expect(await page.locator('sb-breadcrumb-separator svg').first().boundingBox()).toMatchObject({ width: chevron, height: chevron });
    await gotoStory(page, 'components-breadcrumb--custom-separator', TAG);
    await expect(page.locator('sb-breadcrumb-separator')).toHaveText('/');
    await expect(page.locator('sb-breadcrumb-separator svg')).toBeHidden();
  });

  test('the list wraps with the gap token, and the wide gap from 640px wide', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 600 });
    await gotoStory(page, 'components-breadcrumb--wrapping', TAG);
    expect(await css(page, 'sb-breadcrumb-list', ['display', 'flex-wrap', 'column-gap', 'row-gap', 'font-size'])).toEqual({
      display: 'flex',
      'flex-wrap': 'wrap',
      'column-gap': await tokenLength(page.locator(TAG), '--sb-breadcrumb-gap'),
      'row-gap': await tokenLength(page.locator(TAG), '--sb-breadcrumb-gap'),
      'font-size': await tokenLength(page.locator(TAG), '--sb-breadcrumb-font-size'),
    });
    const [first, last] = await Promise.all([page.locator('sb-breadcrumb-item').first().boundingBox(), page.locator('sb-breadcrumb-item').last().boundingBox()]);
    expect(last!.y).toBeGreaterThan(first!.y);
    await page.setViewportSize({ width: 800, height: 600 });
    expect((await css(page, 'sb-breadcrumb-list', ['column-gap']))['column-gap']).toBe(await tokenLength(page.locator(TAG), '--sb-breadcrumb-gap-wide'));
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'with-ellipsis', 'custom-separator', 'wrapping']) {
      await gotoStory(page, `components-breadcrumb--${id}`, TAG);
      expect(await axeViolations(page, TAG)).toEqual([]);
    }
  });
});

test('href: javascript:, vbscript: and data: URLs are not rendered, other URLs are (SB-0115)', async ({ page }) => {
  await gotoStory(page, 'components-breadcrumb--default', TAG);
  const urls = ['java\tscript:alert(1)', ' JAVASCRIPT:alert(1)', 'vbscript:msgbox(1)', 'data:text/html,x', 'https://example.com/a', '/docs#b', 'sms:+100'];
  const tags = ['sb-breadcrumb-link'];
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
