import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, axNodes, expectScreenReaderView } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { systemColor } from '../../helpers/styles';
import { tokenColor, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-sidebar-provider';
const WIDE = { width: 1280, height: 800 };
const NARROW = { width: 600, height: 800 };

const open = async (page: Page, story: string, viewport = WIDE) => {
  await page.setViewportSize(viewport);
  await gotoStory(page, `components-sidebar--${story}`, TAG);
};

const sidebar = (page: Page) => page.locator('sb-sidebar');
const provider = (page: Page) => page.locator(TAG);
const trigger = (page: Page) => page.locator('sb-sidebar-trigger [part="trigger"]');
const panel = (page: Page) => page.locator('sb-sidebar [part="root"]');
const drawer = (page: Page) => page.getByRole('dialog', { name: 'Documentation' });
const link = (page: Page, name: string) => page.getByRole('link', { name, exact: true });

const focusInSidebar = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('sb-sidebar'));
const focusedLocalName = (page: Page) => page.evaluate(() => document.activeElement?.localName);
const focusedText = (page: Page) => page.evaluate(() => document.activeElement?.textContent?.replace(/\s+/g, ' ').trim());

const recordToggles = (page: Page) =>
  page.evaluateHandle(() => {
    const seen: { target: string; bubbles: boolean; composed: boolean; expanded: boolean }[] = [];
    document.addEventListener('sb-toggle', (e) => {
      const target = e.composedPath()[0] as Element;
      if (target.localName === 'sb-sidebar-provider')
        seen.push({ target: target.localName, bubbles: e.bubbles, composed: e.composed, expanded: (target as HTMLElement & { expanded: boolean }).expanded });
    }, true);
    return seen;
  });

const openDrawer = async (page: Page) => {
  await trigger(page).click();
  await expect(drawer(page)).toBeVisible();
};

test.describe('Sidebar, wide viewport', () => {
  test('label names the navigation landmark', async ({ page }) => {
    await open(page, 'default');
    await expect(page.getByRole('navigation', { name: 'Documentation' })).toBeVisible();
    await sidebar(page).evaluate((el) => el.setAttribute('label', 'Guides'));
    await expect(page.getByRole('navigation', { name: 'Guides' })).toBeVisible();
  });

  test('label and collapsible reflect their defaults', async ({ page }) => {
    await open(page, 'default');
    await page.evaluate(() => {
      const el = document.createElement('sb-sidebar');
      el.id = 'fresh';
      document.body.append(el);
    });
    const fresh = page.locator('#fresh');
    await expect(fresh).toHaveAttribute('label', 'Sidebar');
    await expect(fresh).toHaveAttribute('collapsible', 'offcanvas');
  });

  test('an empty label warns once in the console', async ({ page }) => {
    await open(page, 'default');
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
    await sidebar(page).evaluate((el) => el.setAttribute('label', ''));
    await expect.poll(() => warnings.filter((w) => w.includes('<sb-sidebar>')).length).toBe(1);
    await sidebar(page).evaluate((el) => el.setAttribute('collapsible', 'none'));
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(warnings.filter((w) => w.includes('<sb-sidebar>'))).toHaveLength(1);
  });

  test('menus are lists of list items; an author role is kept', async ({ page }) => {
    await open(page, 'default');
    await expect(page.getByRole('list')).toHaveCount(2);
    await expect(page.getByRole('listitem')).toHaveCount(6);
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByRole('menuitem')).toHaveCount(0);
    await page.evaluate(() => {
      const menu = document.createElement('sb-sidebar-menu');
      menu.id = 'authored';
      menu.setAttribute('role', 'presentation');
      document.body.append(menu);
    });
    await expect(page.locator('#authored')).toHaveAttribute('role', 'presentation');
  });

  test('groups are named by their group label, and follow a label added later', async ({ page }) => {
    // Element-reference names are only in the browser's accessibility tree, not in Playwright's role engine.
    await open(page, 'default');
    const cdp = await page.context().newCDPSession(page);
    const groupNames = async () => (await axNodes(cdp, 'group')).map((n) => n.name);
    await expect.poll(groupNames).toEqual(['Getting started', 'Components']);
    await page.locator('sb-sidebar-group-label').nth(1).evaluate((el) => el.remove());
    await page.locator('sb-sidebar-group').nth(1).evaluate((group) => {
      const label = document.createElement('sb-sidebar-group-label');
      label.textContent = 'Library';
      group.prepend(label);
    });
    await expect.poll(groupNames).toEqual(['Getting started', 'Library']);
  });

  test('a group without a label has no group role, and takes it when a label arrives; an author role is kept', async ({ page }) => {
    await open(page, 'default');
    const group = page.locator('sb-sidebar-group').nth(1);
    await page.locator('sb-sidebar-group-label').nth(1).evaluate((el) => el.remove());
    await expect(group).not.toHaveAttribute('role', /.+/);
    await group.evaluate((g) => {
      const label = document.createElement('sb-sidebar-group-label');
      label.textContent = 'Library';
      g.prepend(label);
    });
    await expect(group).toHaveAttribute('role', 'group');
    await group.evaluate((g) => g.querySelector('sb-sidebar-group-label')!.remove());
    await group.evaluate((g) => g.setAttribute('aria-label', 'Named by author'));
    await expect(group).toHaveAttribute('role', 'group');
    await page.evaluate(() => {
      const g = document.createElement('sb-sidebar-group');
      g.id = 'authored-group';
      g.setAttribute('role', 'region');
      document.body.append(g);
    });
    await expect(page.locator('#authored-group')).toHaveAttribute('role', 'region');
  });

  test('without ariaLabelledByElements, the copied group name follows a label text change', async ({ page }) => {
    await page.addInitScript(() => delete (ElementInternals.prototype as { ariaLabelledByElements?: unknown }).ariaLabelledByElements);
    await open(page, 'default');
    const cdp = await page.context().newCDPSession(page);
    const groupNames = async () => (await axNodes(cdp, 'group')).map((n) => n.name);
    await expect.poll(groupNames).toEqual(['Getting started', 'Components']);
    await page.locator('sb-sidebar-group-label').nth(1).evaluate((el) => {
      const text = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim()) as Text;
      text.data = 'Library';
    });
    await expect.poll(groupNames).toEqual(['Getting started', 'Library']);
  });
  test('menu button: a link with href, a button without', async ({ page }) => {
    await open(page, 'default');
    await expect(link(page, 'Installation')).toHaveAttribute('href', '#installation');
    await page.locator('sb-sidebar-menu-button').nth(1).evaluate((el) => el.removeAttribute('href'));
    await expect(page.getByRole('button', { name: 'Installation' })).toBeVisible();
    await expect(link(page, 'Installation')).toHaveCount(0);
  });

  test('active marks the current page, and is ignored without href', async ({ page }) => {
    await open(page, 'default');
    await expect(link(page, 'Introduction')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[aria-current]')).toHaveCount(1);
    await expect(page.locator('sb-sidebar-menu-button').first()).toHaveAttribute('active', '');
    await page.locator('sb-sidebar-menu-button').nth(1).evaluate((el) => {
      el.removeAttribute('href');
      el.setAttribute('active', '');
    });
    await expect(page.getByRole('button', { name: 'Installation' })).not.toHaveAttribute('aria-current', /.*/);
    await expect(page.locator('[aria-current]')).toHaveCount(1);
  });

  test('menu button click is native, bubbles and composes', async ({ page }) => {
    await open(page, 'default');
    const clicked = page.evaluate(
      () =>
        new Promise<{ bubbles: boolean; composed: boolean }>((resolve) =>
          document.querySelector('sb-sidebar-provider')!.addEventListener('click', (e) => resolve({ bubbles: e.bubbles, composed: e.composed }), { once: true }),
        ),
    );
    await link(page, 'Installation').click();
    await expect(clicked).resolves.toEqual({ bubbles: true, composed: true });
  });

  test('trigger: a button named by label, expanded, controlling the sidebar by element reference', async ({ page }) => {
    await open(page, 'default');
    const button = page.getByRole('button', { name: 'Toggle Sidebar' });
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('sb-sidebar-trigger')).toHaveAttribute('label', 'Toggle Sidebar');
    await expect
      .poll(() => trigger(page).evaluate((el) => (el as HTMLElement & { ariaControlsElements?: Element[] }).ariaControlsElements?.[0]?.localName))
      .toBe('sb-sidebar');
    // Chromium reflects an element reference as an empty attribute: no ID is ever written.
    expect(await trigger(page).getAttribute('aria-controls') ?? '').toBe('');
    await page.locator('sb-sidebar-trigger').evaluate((el) => el.setAttribute('label', 'Show navigation'));
    await expect(page.getByRole('button', { name: 'Show navigation' })).toBeVisible();
  });

  test('trigger: re-links to a sidebar added after the first render', async ({ page }) => {
    await open(page, 'default');
    const controlled = () => trigger(page).evaluate((el) => (el as HTMLElement & { ariaControlsElements?: Element[] | null }).ariaControlsElements?.[0]?.id ?? null);
    await expect.poll(controlled).toBe('');
    await page.evaluate(() => {
      const old = document.querySelector('sb-sidebar')!;
      const late = document.createElement('sb-sidebar');
      late.id = 'late';
      late.setAttribute('label', 'Late');
      old.replaceWith(late);
    });
    await expect.poll(controlled).toBe('late');
  });

  test('trigger: warns once where ariaControlsElements is unsupported', async ({ page }) => {
    await page.addInitScript(() => delete (Element.prototype as { ariaControlsElements?: unknown }).ariaControlsElements);
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
    await open(page, 'default');
    await expect.poll(() => warnings.filter((w) => w.includes('<sb-sidebar-trigger>')).length).toBe(1);
    await trigger(page).click();
    await trigger(page).click();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(warnings.filter((w) => w.includes('<sb-sidebar-trigger>'))).toHaveLength(1);
  });

  test('an empty breakpoint token warns once and keeps the wide layout', async ({ page }) => {
    await open(page, 'default', NARROW);
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
    const resolved = await page.evaluate(() => {
      const el = document.createElement('sb-sidebar-provider');
      el.id = 'empty-breakpoint';
      el.setAttribute('style', '--sb-sidebar-breakpoint: ;');
      el.append(document.createElement('sb-sidebar'));
      document.body.append(el);
      const value = getComputedStyle(el).getPropertyValue('--sb-sidebar-breakpoint').trim();
      el.remove();
      document.body.append(el);
      return value;
    });
    expect(resolved).toBe('');
    await expect.poll(() => warnings.filter((w) => w.includes('--sb-sidebar-breakpoint')).length).toBe(1);
    await expect.poll(() => page.locator('#empty-breakpoint sb-sidebar').evaluate((el) => !!el.shadowRoot?.querySelector('[part="root"]') && !el.shadowRoot?.querySelector('dialog'))).toBe(true);
    await expect.poll(() => page.locator('#empty-breakpoint sb-sidebar').evaluate((el) => el.shadowRoot!.querySelector('[part="root"]')!.getBoundingClientRect().width)).toBeGreaterThan(0);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(warnings.filter((w) => w.includes('--sb-sidebar-breakpoint'))).toHaveLength(1);
  });

  test('a long menu button or group label wraps instead of clipping, and the row grows', async ({ page }) => {
    await open(page, 'default');
    const long = 'A long page title that cannot fit on one line of the panel, nor on two lines of its caption-sized group label';
    const button = page.locator('sb-sidebar-menu-button').nth(2);
    const label = page.locator('sb-sidebar-group-label').first();
    await button.evaluate((el, t) => (el.textContent = t), long);
    await label.evaluate((el, t) => (el.textContent = t), long);
    const fits = (el: Element, part: string) => {
      const box = el.shadowRoot!.querySelector(`[part="${part}"]`)!;
      return box.scrollHeight <= box.clientHeight && box.scrollWidth <= box.clientWidth;
    };
    await expect.poll(() => button.evaluate(fits, 'button')).toBe(true);
    await expect.poll(() => label.evaluate(fits, 'label')).toBe(true);
    const row = await tokenPx(provider(page), '--sb-sidebar-menu-button-height');
    await expect.poll(async () => (await button.locator('[part="button"]').boundingBox())!.height).toBeGreaterThan(row);
    await expect.poll(async () => (await label.locator('[part="label"]').boundingBox())!.height).toBeGreaterThan(await tokenPx(provider(page), '--sb-sidebar-group-label-height'));
  });

  test('focus inside the panel moves to the trigger when the viewport turns narrow', async ({ page }) => {
    await open(page, 'default');
    await link(page, 'Card').focus();
    await expect.poll(() => focusInSidebar(page)).toBe(true);
    await page.setViewportSize(NARROW);
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => focusedLocalName(page)).toBe('sb-sidebar-trigger');
  });

  test('closing the panel from code while it holds focus moves focus to the trigger', async ({ page }) => {
    await open(page, 'default');
    await link(page, 'Card').focus();
    await expect.poll(() => focusInSidebar(page)).toBe(true);
    await provider(page).evaluate((el) => ((el as HTMLElement & { expanded: boolean }).expanded = false));
    await expect.poll(() => focusedLocalName(page)).toBe('sb-sidebar-trigger');
    await link(page, 'Introduction').evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await provider(page).evaluate((el) => ((el as HTMLElement & { expanded: boolean }).expanded = true));
    await provider(page).evaluate((el) => ((el as HTMLElement & { expanded: boolean }).expanded = false));
    await expect.poll(() => focusedLocalName(page)).toBe('body');
  });

  test('provider expanded reflects and defaults to true', async ({ page }) => {
    await open(page, 'default');
    await expect(provider(page)).toHaveAttribute('expanded', '');
    await page.evaluate(() => {
      const el = document.createElement('sb-sidebar-provider');
      el.id = 'fresh';
      document.body.append(el);
    });
    await expect(page.locator('#fresh')).toHaveAttribute('expanded', '');
    await provider(page).first().evaluate((el) => ((el as HTMLElement & { expanded: boolean }).expanded = false));
    await expect(provider(page).first()).not.toHaveAttribute('expanded', '');
  });

  test('offcanvas: the trigger collapses the panel out of view, the tab order and the accessibility tree', async ({ page }) => {
    await open(page, 'default');
    await trigger(page).click();
    await expect(provider(page)).not.toHaveAttribute('expanded', '');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Documentation' })).toHaveCount(0);
    await expect(link(page, 'Introduction')).toBeHidden();
    await expect.poll(() => sidebar(page).evaluate((el) => el.getBoundingClientRect().width)).toBe(0);
    await page.evaluate(() => {
      const before = document.createElement('button');
      before.id = 'before';
      before.textContent = 'Before';
      document.body.prepend(before);
    });
    await trigger(page).focus();
    await page.keyboard.press('Shift+Tab');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('before');
    expect(await focusInSidebar(page)).toBe(false);
    await trigger(page).click();
    await expect(page.getByRole('navigation', { name: 'Documentation' })).toBeVisible();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
  });

  test('Enter and Space on the trigger toggle the panel', async ({ page }) => {
    await open(page, 'default');
    await trigger(page).focus();
    await page.keyboard.press('Enter');
    await expect(provider(page)).not.toHaveAttribute('expanded', '');
    await page.keyboard.press('Space');
    await expect(provider(page)).toHaveAttribute('expanded', '');
  });

  test('sb-toggle fires on the provider, bubbling and composed, from the trigger and from code', async ({ page }) => {
    await open(page, 'default');
    const seen = await recordToggles(page);
    await trigger(page).click();
    await expect.poll(() => seen.evaluate((s) => s.length)).toBe(1);
    await provider(page).evaluate((el) => ((el as HTMLElement & { expanded: boolean }).expanded = true));
    await expect.poll(() => seen.evaluate((s) => s.length)).toBe(2);
    expect(await seen.jsonValue()).toEqual([
      { target: TAG, bubbles: true, composed: true, expanded: false },
      { target: TAG, bubbles: true, composed: true, expanded: true },
    ]);
  });

  test('Collapsed story: the panel starts hidden and the trigger collapsed', async ({ page }) => {
    await open(page, 'collapsed');
    await expect(page.getByRole('navigation')).toHaveCount(0);
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('collapsible=none: the panel never hides and the trigger is hidden', async ({ page }) => {
    await open(page, 'not-collapsible');
    await expect(page.locator('sb-sidebar-trigger')).toBeHidden();
    await provider(page).evaluate((el) => ((el as HTMLElement & { expanded: boolean }).expanded = false));
    await expect(page.getByRole('navigation', { name: 'Documentation' })).toBeVisible();
  });

  test('Tab moves through the links in document order, then the trigger', async ({ page }) => {
    await open(page, 'default');
    await page.locator('body').focus();
    const order: (string | undefined)[] = [];
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('Tab');
      order.push((await focusedLocalName(page)) === 'sb-sidebar-trigger' ? 'trigger' : await focusedText(page));
    }
    expect(order).toEqual(['Introduction', 'Installation', 'Button', 'Card', 'Dialog', 'Sidebar', 'trigger']);
  });

  test('focus ring: keyboard only, in the focus-ring token', async ({ page }) => {
    await open(page, 'default');
    const inner = page.locator('sb-sidebar-menu-button').nth(1).locator('[part="button"]');
    await inner.click();
    expect(await inner.evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const ring = await tokenColor(provider(page), '--sb-sidebar-focus-ring-color');
    await expect.poll(() => inner.evaluate((el) => getComputedStyle(el).boxShadow)).toContain(ring);
  });

  test('hover and current page take the accent fill from tokens', async ({ page }) => {
    await open(page, 'default');
    const active = page.locator('sb-sidebar-menu-button').first().locator('[part="button"]');
    const rest = page.locator('sb-sidebar-menu-button').nth(2).locator('[part="button"]');
    expect(await active.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(provider(page), '--sb-sidebar-menu-button-active-bg'));
    expect(await active.evaluate((el) => getComputedStyle(el).color)).toBe(await tokenColor(provider(page), '--sb-sidebar-menu-button-active-fg'));
    const weight = await provider(page).evaluate(() => {
      const probe = document.createElement('span');
      probe.style.fontWeight = 'var(--sb-sidebar-menu-button-active-font-weight)';
      document.body.append(probe);
      const w = getComputedStyle(probe).fontWeight;
      probe.remove();
      return w;
    });
    expect(await active.evaluate((el) => getComputedStyle(el).fontWeight)).toBe(weight);
    await rest.hover();
    const hover = await tokenColor(provider(page), '--sb-sidebar-menu-button-hover-bg');
    await expect.poll(() => rest.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(hover);
  });

  test('panel size and colors come from the sidebar tokens', async ({ page }) => {
    await open(page, 'default');
    const width = await tokenPx(provider(page), '--sb-sidebar-width');
    await expect.poll(async () => Math.round((await panel(page).boundingBox())!.width)).toBe(Math.round(width));
    await expect.poll(async () => Math.round((await panel(page).boundingBox())!.height)).toBe(WIDE.height);
    const style = await panel(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, fg: s.color, border: s.borderInlineEndColor };
    });
    expect(style).toEqual({
      bg: await tokenColor(provider(page), '--sb-sidebar-bg'),
      fg: await tokenColor(provider(page), '--sb-sidebar-fg'),
      border: await tokenColor(provider(page), '--sb-sidebar-border-color'),
    });
    const row = Math.round(await tokenPx(provider(page), '--sb-sidebar-menu-button-height'));
    const size = Math.round(await tokenPx(provider(page), '--sb-sidebar-trigger-size'));
    await expect.poll(async () => Math.round((await page.locator('sb-sidebar-menu-button').first().locator('[part="button"]').boundingBox())!.height)).toBe(row);
    await expect.poll(async () => {
      const square = (await trigger(page).boundingBox())!;
      return [Math.round(square.width), Math.round(square.height)];
    }).toEqual([size, size]);
  });

  test('the media query is the breakpoint token, inlined', async ({ page }) => {
    await open(page, 'default');
    const token = await provider(page).evaluate((el) => getComputedStyle(el).getPropertyValue('--sb-sidebar-breakpoint').trim());
    expect(token).toMatch(/^\d+(\.\d+)?(px|rem|em)$/);
    const conditions = await sidebar(page).evaluate((el) =>
      el.shadowRoot!.adoptedStyleSheets.flatMap((sheet) => [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule).map((r) => r.conditionText)),
    );
    const widthQueries = conditions.filter((c) => c.includes('width <'));
    expect(widthQueries.length).toBeGreaterThan(0);
    for (const c of widthQueries) expect(c).toBe(`(width < ${token})`);
  });

  test('right-to-left puts the panel at the right edge', async ({ page }) => {
    await open(page, 'rtl');
    const box = await panel(page).boundingBox();
    expect(box!.x + box!.width).toBeCloseTo(WIDE.width, 0);
    await expect(page.getByRole('navigation', { name: 'التوثيق' })).toBeVisible();
  });

  test('dark mode: the panel uses the dark sidebar colors', async ({ page }) => {
    await open(page, 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await panel(page).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(provider(page), '--sb-sidebar-bg'));
  });

  test('forced colors: the current item keeps a Highlight marker and the panel keeps its border', async ({ page }) => {
    await open(page, 'default');
    await page.emulateMedia({ forcedColors: 'active' });
    const active = page.locator('sb-sidebar-menu-button').first().locator('[part="button"]');
    await expect.poll(() => active.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await systemColor(page, 'Highlight'));
    expect(await active.evaluate((el) => getComputedStyle(el).color)).toBe(await systemColor(page, 'HighlightText'));
    const border = await panel(page).evaluate((el) => ({ style: getComputedStyle(el).borderInlineEndStyle, width: parseFloat(getComputedStyle(el).borderInlineEndWidth) }));
    expect(border.style).toBe('solid');
    expect(border.width).toBeGreaterThan(0);
  });

  test('reduced motion: no slide', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'default');
    const durations = await sidebar(page).evaluate((el) => [getComputedStyle(el).transitionDuration, getComputedStyle(el.shadowRoot!.querySelector('[part="root"]')!).transitionDuration]);
    for (const d of durations) expect(d.split(',').every((v) => parseFloat(v) === 0)).toBe(true);
  });
});

test.describe('Sidebar, keyboard shortcut', () => {
  test('Control+B and Meta+B toggle the panel on a wide viewport; the trigger announces the shortcut', async ({ page }) => {
    await open(page, 'default');
    await expect(trigger(page)).toHaveAttribute('aria-keyshortcuts', 'Control+B Meta+B');
    await page.keyboard.press('Control+b');
    await expect(provider(page)).not.toHaveAttribute('expanded', '');
    await page.keyboard.press('Meta+b');
    await expect(provider(page)).toHaveAttribute('expanded', '');
  });

  test('the shortcut is ignored while typing in a text field, and with collapsible=none', async ({ page }) => {
    await open(page, 'default');
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'typing';
      document.body.prepend(input);
    });
    await page.locator('#typing').focus();
    await page.keyboard.press('Control+b');
    await expect(provider(page)).toHaveAttribute('expanded', '');
    await page.locator('#typing').blur();
    await sidebar(page).evaluate((el) => el.setAttribute('collapsible', 'none'));
    await page.keyboard.press('Control+b');
    await expect(provider(page)).toHaveAttribute('expanded', '');
  });

  test('on a narrow viewport the shortcut opens the drawer and closes it, returning focus', async ({ page }) => {
    await open(page, 'default', NARROW);
    await trigger(page).focus();
    await page.keyboard.press('Control+b');
    await expect(drawer(page)).toBeVisible();
    await expect.poll(() => focusInSidebar(page)).toBe(true);
    await page.keyboard.press('Control+b');
    await expect(drawer(page)).toBeHidden();
    await expect.poll(() => focusedLocalName(page)).toBe('sb-sidebar-trigger');
  });

  test('closing the drawer by shortcut returns focus to the trigger even when focus started elsewhere', async ({ page }) => {
    await open(page, 'default', NARROW);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Control+b');
    await expect(drawer(page)).toBeVisible();
    await page.keyboard.press('Control+b');
    await expect(drawer(page)).toBeHidden();
    await expect.poll(() => focusedLocalName(page)).toBe('sb-sidebar-trigger');
  });
});

test.describe('Sidebar, narrow viewport (drawer)', () => {
  test('the panel is out of the layout and the trigger reports the closed drawer', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await expect(page.getByRole('navigation')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => sidebar(page).evaluate((el) => el.getBoundingClientRect().width)).toBe(0);
  });

  test('the trigger opens a modal drawer named by label; focus moves inside', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer(page).getByRole('navigation', { name: 'Documentation' })).toBeVisible();
    expect(await drawer(page).evaluate((el) => el.matches(':modal'))).toBe(true);
    await expect.poll(() => focusInSidebar(page)).toBe(true);
    await expect(provider(page)).toHaveAttribute('expanded', '');
  });

  test('Enter on the trigger opens the drawer', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await trigger(page).focus();
    await page.keyboard.press('Enter');
    await expect(drawer(page)).toBeVisible();
  });

  test('screen-reader view: Enter opens the drawer, Escape closes it, the wide panel marks the current page', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await trigger(page).focus();
    await page.keyboard.press('Enter');
    await expect(drawer(page)).toBeVisible();
    await expect.poll(() => focusInSidebar(page)).toBe(true);
    await expectScreenReaderView(page, 'sidebar-drawer-open');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(() => focusedLocalName(page)).toBe('sb-sidebar-trigger');
    await expect(page.getByRole('button', { name: 'Toggle Sidebar' })).toHaveAttribute('aria-expanded', 'false');
    await expectScreenReaderView(page, 'sidebar-drawer-closed');
    await open(page, 'default');
    await expect(link(page, 'Introduction')).toHaveAttribute('aria-current', 'page');
    await expectScreenReaderView(page, 'sidebar-wide');
  });

  test('Tab wraps from the last link to the first, and Shift+Tab from the first to the last', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    await expect.poll(() => focusedText(page)).toBe('Introduction');
    const forward: (string | undefined)[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      forward.push(await focusedText(page));
    }
    expect(forward).toEqual(['Installation', 'Button', 'Card', 'Dialog', 'Sidebar', 'Introduction']);
    await page.keyboard.press('Shift+Tab');
    expect(await focusedText(page)).toBe('Sidebar');
    await page.keyboard.press('Shift+Tab');
    expect(await focusedText(page)).toBe('Dialog');
    expect(await focusInSidebar(page)).toBe(true);
  });

  test('the Tab wrap counts a summary as focusable and skips hidden candidates', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await page.locator('sb-sidebar-footer').evaluate((footer) => {
      const details = document.createElement('details');
      details.innerHTML = '<summary>More</summary><a href="#inside">Inside</a>';
      const hidden = document.createElement('a');
      hidden.href = '#hidden';
      hidden.hidden = true;
      hidden.textContent = 'Hidden';
      footer.append(details, hidden);
    });
    await openDrawer(page);
    await expect.poll(() => focusedText(page)).toBe('Introduction');
    await page.keyboard.press('Shift+Tab');
    expect(await focusedLocalName(page)).toBe('summary');
    await page.keyboard.press('Tab');
    expect(await focusedText(page)).toBe('Introduction');
  });

  test('Escape closes the drawer and returns focus to the trigger', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => focusedLocalName(page)).toBe('sb-sidebar-trigger');
  });

  test('a press and release on the backdrop closes the drawer; a drag from inside does not', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    const box = (await drawer(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(NARROW.width - 10, NARROW.height / 2);
    await page.mouse.up();
    await expect(drawer(page)).toBeVisible();
    await page.mouse.click(NARROW.width - 10, NARROW.height / 2);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(() => focusedLocalName(page)).toBe('sb-sidebar-trigger');
  });

  test('activating a menu link closes the drawer', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    await link(page, 'Card').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/#card$/);
  });

  test('a modified click on a menu link (new tab) keeps the drawer open', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    await link(page, 'Card').click({ modifiers: ['ControlOrMeta'] });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await link(page, 'Card').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('crossing to a wide viewport closes the drawer and shows the panel', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    await page.setViewportSize(WIDE);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Documentation' })).toBeVisible();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    await page.setViewportSize(NARROW);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('focus inside the open drawer moves to the trigger when the viewport turns wide', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    await link(page, 'Card').focus();
    await expect.poll(() => focusInSidebar(page)).toBe(true);
    await page.setViewportSize(WIDE);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(() => focusedLocalName(page)).toBe('sb-sidebar-trigger');
  });

  test('the drawer does not change expanded or fire sb-toggle', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    const seen = await recordToggles(page);
    await openDrawer(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await provider(page).evaluate((el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(await seen.evaluate((s) => s.length)).toBe(0);
    await expect(provider(page)).toHaveAttribute('expanded', '');
    await provider(page).evaluate((el) => ((el as HTMLElement & { expanded: boolean }).expanded = false));
    await expect.poll(() => seen.evaluate((s) => s.length)).toBe(1);
  });

  test('drawer width, surface and backdrop come from the sidebar tokens', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    await expect.poll(async () => Math.round((await drawer(page).boundingBox())!.x)).toBe(0);
    const box = (await drawer(page).boundingBox())!;
    expect(box.width).toBeCloseTo(await tokenPx(provider(page), '--sb-sidebar-drawer-width'), 0);
    expect(box.height).toBeCloseTo(NARROW.height, 0);
    const style = await drawer(page).evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, backdrop: getComputedStyle(el, '::backdrop').backgroundColor }));
    expect(style).toEqual({ bg: await tokenColor(provider(page), '--sb-sidebar-bg'), backdrop: await tokenColor(provider(page), '--sb-sidebar-backdrop') });
  });

  test('collapsible=none still gives a drawer on narrow viewports', async ({ page }) => {
    await open(page, 'not-collapsible', NARROW);
    await expect(page.locator('sb-sidebar-trigger')).toBeVisible();
    await openDrawer(page);
  });

  test('right-to-left: the drawer sits at the right edge', async ({ page }) => {
    await open(page, 'rtl', NARROW);
    await trigger(page).click();
    const dialog = page.getByRole('dialog', { name: 'التوثيق' });
    await expect(dialog).toBeVisible();
    await expect.poll(async () => {
      const box = (await dialog.boundingBox())!;
      return Math.round(box.x + box.width);
    }).toBe(NARROW.width);
  });
});

test.describe('Sidebar, axe', () => {
  test('Default has no violations', async ({ page }) => {
    await open(page, 'default');
    expect(await axeViolations(page, TAG)).toEqual([]);
  });

  test('Collapsed has no violations', async ({ page }) => {
    await open(page, 'collapsed');
    expect(await axeViolations(page, TAG)).toEqual([]);
  });

  test('Not collapsible has no violations', async ({ page }) => {
    await open(page, 'not-collapsible');
    expect(await axeViolations(page, TAG)).toEqual([]);
  });

  test('Narrow drawer, open, has no violations', async ({ page }) => {
    await open(page, 'narrow-drawer', NARROW);
    await openDrawer(page);
    expect(await axeViolations(page, TAG)).toEqual([]);
  });

  test('RTL has no violations', async ({ page }) => {
    await open(page, 'rtl');
    expect(await axeViolations(page, TAG)).toEqual([]);
  });

  test('Dark has no violations', async ({ page }) => {
    await open(page, 'dark');
    expect(await axeViolations(page, TAG)).toEqual([]);
  });
});

test('href: javascript:, vbscript: and data: URLs are not rendered, other URLs are (SB-0115)', async ({ page }) => {
  await gotoStory(page, 'components-sidebar--default', TAG);
  const urls = ['java\tscript:alert(1)', ' JAVASCRIPT:alert(1)', 'vbscript:msgbox(1)', 'data:text/html,x', 'https://example.com/a', '/docs#b', 'sms:+100'];
  const tags = ['sb-sidebar-menu-button'];
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
