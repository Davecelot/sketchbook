import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { systemColor } from '../../helpers/styles';
import { tokenColor, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-pagination';
const link = (page: Page, host: string, nth = 0) => page.locator(host).nth(nth).locator('[part="link"]');
const css = (page: Page, host: string, prop: string, nth = 0) => link(page, host, nth).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test.describe('Pagination', () => {
  test('is a navigation landmark with a list of items', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    await expect(page.getByRole('navigation', { name: 'pagination' })).toBeVisible();
    await expect(page.getByRole('list')).toBeVisible();
    // Six items; the one holding only the hidden ellipsis is hidden too.
    await expect(page.getByRole('listitem')).toHaveCount(5);
  });

  test('label renames the landmark', async ({ page }) => {
    await gotoStory(page, 'components-pagination--translated-labels', TAG);
    await expect(page.getByRole('navigation', { name: 'paginación' })).toBeVisible();
  });

  test('page links are native links with their href', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    await expect(page.getByRole('link', { name: '3', exact: true })).toHaveAttribute('href', '#page-3');
    expect(await link(page, 'sb-pagination-link').evaluate((el) => el.localName)).toBe('a');
  });

  test('the active link is the current page and looks outlined', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    await expect(page.locator('sb-pagination-link[active] [part="link"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
    const host = page.locator('sb-pagination-link').first();
    expect(await css(page, 'sb-pagination-link', 'border-top-color', 1)).toBe(await tokenColor(host, '--sb-pagination-link-active-border'));
    expect(await css(page, 'sb-pagination-link', 'background-color', 1)).toBe(await tokenColor(host, '--sb-pagination-link-active-bg'));
    expect(await css(page, 'sb-pagination-link', 'border-top-color', 0)).toBe('rgba(0, 0, 0, 0)');
  });

  test('in forced colors the current page is filled with the system highlight', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await gotoStory(page, 'components-pagination--default', TAG);
    const active = page.locator('sb-pagination-link[active] [part="link"]');
    const look = await active.evaluate((el) => { const s = getComputedStyle(el); return { bg: s.backgroundColor, fg: s.color, adjust: s.getPropertyValue('forced-color-adjust') }; });
    expect(look).toEqual({ bg: await systemColor(page, 'Highlight'), fg: await systemColor(page, 'HighlightText'), adjust: 'none' });
  });

  test('previous and next are named by their label and show their text', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    await expect(page.getByRole('link', { name: 'Go to previous page' })).toHaveText('Previous', { useInnerText: true });
    await expect(page.getByRole('link', { name: 'Go to next page' })).toHaveText('Next', { useInnerText: true });
    await gotoStory(page, 'components-pagination--translated-labels', TAG);
    await expect(page.getByRole('link', { name: 'Ir a la página anterior' })).toBeVisible();
    expect(await page.locator('sb-pagination-previous').evaluate((el) => (el.shadowRoot!.querySelector('slot') as HTMLSlotElement).assignedNodes().map((n) => n.textContent))).toEqual(['Anterior']);
  });

  test('without a label, previous and next are named by their slotted text (label in name)', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    await page.evaluate(async () => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<div id="named"><sb-pagination-previous href="#a">Anterior</sb-pagination-previous><sb-pagination-next href="#b">Siguiente</sb-pagination-next><sb-pagination-next href="#c" label="Ir a la siguiente">Siguiente</sb-pagination-next></div>',
      );
      await Promise.all([...document.querySelectorAll('#named > *')].map((el) => (el as unknown as { updateComplete: Promise<unknown> }).updateComplete));
    });
    await expect(page.locator('#named').getByRole('link', { name: 'Anterior', exact: true })).toBeVisible();
    await expect(page.locator('#named').getByRole('link', { name: 'Siguiente', exact: true })).toHaveCount(1);
    await expect(page.locator('#named').getByRole('link', { name: 'Ir a la siguiente' })).toHaveCount(1);
  });

  test('an author role on the content or an item is kept', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    const roles = await page.evaluate(async () => {
      document.body.insertAdjacentHTML('beforeend', '<sb-pagination-content id="c" role="menubar"><sb-pagination-item id="i" role="none"></sb-pagination-item></sb-pagination-content>');
      await Promise.all(['c', 'i'].map((id) => (document.getElementById(id) as unknown as { updateComplete: Promise<unknown> }).updateComplete));
      return [document.getElementById('c')!.getAttribute('role'), document.getElementById('i')!.getAttribute('role')];
    });
    expect(roles).toEqual(['menubar', 'none']);
  });

  test('the item holding only the ellipsis is hidden, so the list has no empty item', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    const index = await page.locator('sb-pagination-item').evaluateAll((els) => els.findIndex((el) => el.querySelector(':scope > sb-pagination-ellipsis')));
    const holder = page.locator('sb-pagination-item').nth(index);
    await expect(holder).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('sb-pagination-item[aria-hidden]')).toHaveCount(1);
    await holder.evaluate((el) => el.replaceChildren(Object.assign(document.createElement('sb-pagination-link'), { href: '#9', textContent: '9' })));
    await expect(holder).not.toHaveAttribute('aria-hidden');
  });

  test('warns once when a link has no href', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && m.text().includes('<sb-pagination-link> has no href') && warnings.push(m.text()));
    await gotoStory(page, 'components-pagination--default', TAG);
    await page.evaluate(async () => {
      const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const bare = document.createElement('sb-pagination-link');
      bare.textContent = '9';
      document.body.append(bare);
      await frames();
      (bare as unknown as { requestUpdate: () => void }).requestUpdate();
      await frames();
    });
    expect(warnings).toHaveLength(1);
  });

  test('the ellipsis is hidden from assistive technology and keeps its text', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    const gap = page.locator('sb-pagination-ellipsis');
    await expect(gap).toHaveAttribute('aria-hidden', 'true');
    expect(await gap.evaluate((el) => el.shadowRoot!.textContent.trim())).toBe('More pages');
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    expect(nodes.filter((n) => !n.ignored).some((n) => String(n.name?.value).includes('More pages'))).toBe(false);
  });

  test('sizes: number links are square at the link size, previous and next as high', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    const number = await link(page, 'sb-pagination-link').boundingBox();
    const size = await tokenPx(page.locator(TAG).first(), '--sb-pagination-link-size');
    expect([number?.width, number?.height]).toEqual([size, size]);
    const previous = await link(page, 'sb-pagination-previous').boundingBox();
    expect(previous?.height).toBe(size);
    expect(previous!.width).toBeGreaterThan(size);
  });

  test('hover uses the accent tokens', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // no transition to wait out
    await gotoStory(page, 'components-pagination--default', TAG);
    await link(page, 'sb-pagination-link', 2).hover();
    const host = page.locator('sb-pagination-link').first();
    await expect.poll(() => css(page, 'sb-pagination-link', 'background-color', 2)).toBe(await tokenColor(host, '--sb-pagination-link-hover-bg'));
  });

  test('Tab visits the links in order and Enter follows one; the ring is keyboard-only', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // no transition to wait out
    await gotoStory(page, 'components-pagination--default', TAG);
    await link(page, 'sb-pagination-link', 0).click();
    expect(await css(page, 'sb-pagination-link', 'box-shadow')).toBe('none');
    await page.keyboard.press('Tab');
    await expect(link(page, 'sb-pagination-link', 1)).toBeFocused();
    await expect.poll(() => css(page, 'sb-pagination-link', 'box-shadow', 1)).toContain(await tokenColor(page.locator(TAG), '--sb-pagination-focus-ring-color'));
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(link(page, 'sb-pagination-next')).toBeFocused();
    await page.keyboard.press('Enter');
    expect(new URL(page.url()).hash).toBe('#page-3');
  });

  test('aria-label on a link host names the inner link', async ({ page }) => {
    await gotoStory(page, 'components-pagination--translated-labels', TAG);
    await expect(page.getByRole('link', { name: 'Página 2' })).toBeVisible();
  });

  test('chevrons mirror in right-to-left', async ({ page }) => {
    await gotoStory(page, 'components-pagination--default', TAG);
    const icon = page.locator('sb-pagination-previous [part="icon"]');
    expect(await icon.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    expect(await icon.evaluate((el) => getComputedStyle(el).transform)).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'translated-labels']) {
      await gotoStory(page, `components-pagination--${id}`, TAG);
      expect(await axeViolations(page, TAG), id).toEqual([]);
    }
  });
});

test('href: javascript:, vbscript: and data: URLs are not rendered, other URLs are (SB-0115)', async ({ page }) => {
  await gotoStory(page, 'components-pagination--default', TAG);
  const urls = ['java\tscript:alert(1)', ' JAVASCRIPT:alert(1)', 'vbscript:msgbox(1)', 'data:text/html,x', 'https://example.com/a', '/docs#b', 'sms:+100'];
  const tags = ['sb-pagination-link', 'sb-pagination-previous', 'sb-pagination-next'];
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
