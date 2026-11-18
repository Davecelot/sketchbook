import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, axNodes, expectScreenReaderView } from '../../helpers/a11y';
import { recordHostEvents } from '../../helpers/events';
import { gotoStory } from '../../helpers/storybook';
import { systemColor } from '../../helpers/styles';
import { tokenColor, tokenLength } from '../../helpers/tokens';

const TAG = 'sb-tabs';
const tab = (page: Page, nth: number) => page.locator('sb-tabs-trigger').nth(nth).locator('[part="trigger"]');
const selected = (page: Page) => page.locator(TAG).evaluate((el) => (el as HTMLElement & { value: string }).value);

test.describe('Tabs', () => {
  test('without element references, the copied panel name follows tab text changes', async ({ page }) => {
    await page.addInitScript(() => delete (ElementInternals.prototype as { ariaLabelledByElements?: unknown }).ariaLabelledByElements);
    await gotoStory(page, 'components-tabs--default', TAG);
    const panel = page.locator('sb-tabs-content[data-state="active"]');
    const name = await panel.getAttribute('aria-label');
    expect(name).toBeTruthy();
    await page.locator('sb-tabs-trigger').first().evaluate((el) => {
      const text = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim()) as Text;
      text.data = 'Renamed';
    });
    await expect(panel).toHaveAttribute('aria-label', 'Renamed');
  });

  test('exposes a tablist of tabs, and shows only the selected panel', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    await expect(page.getByRole('tablist', { name: 'Project sections' })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByText('A summary of the project.')).toBeVisible();
    await expect(page.getByText('Recent changes appear here.')).toBeHidden();
    expect(await tab(page, 0).evaluate((el) => el.localName)).toBe('button');
  });

  test('a value selects its tab; with no value the first enabled tab is selected', async ({ page }) => {
    await gotoStory(page, 'components-tabs--line', TAG);
    await expect(page.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
    await gotoStory(page, 'components-tabs--default', TAG);
    expect(await selected(page)).toBe('overview');
    await expect(page.locator(TAG)).toHaveAttribute('value', 'overview');
  });

  test('clicking a tab selects it and shows its panel', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    await tab(page, 1).click();
    await expect(page.getByText('Recent changes appear here.')).toBeVisible();
    await expect(page.getByText('A summary of the project.')).toBeHidden();
    expect(await selected(page)).toBe('activity');
  });

  test('change carries the value, bubbles, is composed, and skips programmatic changes', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    const events = await recordHostEvents(page, 'change');
    const detail = await page.evaluateHandle(() => {
      const seen: string[] = [];
      document.addEventListener('change', (e) => seen.push((e as CustomEvent<{ value: string }>).detail.value));
      return seen;
    });
    await tab(page, 1).click();
    await page.locator(TAG).evaluate((el) => ((el as HTMLElement & { value: string }).value = 'overview'));
    await expect.poll(() => events.evaluate((e) => e.length)).toBe(1);
    expect(await events.evaluate((e) => e[0])).toEqual({ bubbles: true, composed: true, cancelable: false, target: TAG });
    expect(await detail.evaluate((d) => d)).toEqual(['activity']);
  });

  test('a slotted checkbox\'s native change reaches the host with another target and no detail', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    const seen = await page.evaluateHandle(() => {
      const host = document.querySelector('sb-tabs')!;
      const panel = host.querySelector('sb-tabs-content')!;
      panel.insertAdjacentHTML('beforeend', '<label><input type="checkbox"> Notify me</label>');
      const events: { fromHost: boolean; detail: unknown }[] = [];
      host.addEventListener('change', (e) => events.push({ fromHost: e.target === host, detail: (e as CustomEvent).detail ?? null }));
      return events;
    });
    await page.getByRole('checkbox', { name: 'Notify me' }).check();
    await expect.poll(() => seen.evaluate((e) => e.length)).toBe(1);
    expect(await seen.evaluate((e) => e[0])).toEqual({ fromHost: false, detail: null });
    expect(await selected(page)).toBe('overview');
  });

  test('one tab stop: Tab enters on the selected tab, then goes to the panel', async ({ page }) => {
    await gotoStory(page, 'components-tabs--line', TAG);
    await page.keyboard.press('Tab');
    await expect(tab(page, 1)).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.localName)).toBe('sb-tabs-content');
    await page.keyboard.press('Shift+Tab');
    await expect(tab(page, 1)).toBeFocused();
  });

  test('arrows move and select, wrap, skip disabled tabs; Home and End jump', async ({ page }) => {
    await gotoStory(page, 'components-tabs--disabled-tab', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 1)).toBeFocused();
    expect(await selected(page)).toBe('activity');
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 0)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(tab(page, 1)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tab(page, 0)).toBeFocused();
    expect(await selected(page)).toBe('overview');
  });

  test('disabled tab: not focusable, not selectable, dimmed', async ({ page }) => {
    await gotoStory(page, 'components-tabs--disabled-tab', TAG);
    await expect(tab(page, 2)).toBeDisabled();
    await tab(page, 2).click({ force: true });
    expect(await selected(page)).toBe('overview');
    expect(await tab(page, 2).evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5');
  });

  test('manual activation: arrows move focus only; Enter and Space select', async ({ page }) => {
    await gotoStory(page, 'components-tabs--manual-activation', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 1)).toBeFocused();
    expect(await selected(page)).toBe('overview');
    await page.keyboard.press('Enter');
    expect(await selected(page)).toBe('activity');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    expect(await selected(page)).toBe('settings');
  });

  test('vertical: aria-orientation, Arrow Up and Down move, Arrow Right does not', async ({ page }) => {
    await gotoStory(page, 'components-tabs--vertical', TAG);
    await expect(page.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(tab(page, 1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(tab(page, 0)).toBeFocused();
  });

  test('right-to-left reverses the arrows', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 1)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 0)).toBeFocused();
  });

  test('aria-controls reaches the panel; the panel is named by its tab', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    const same = await page.evaluate(() => {
      const button = document.querySelector('sb-tabs-trigger')!.shadowRoot!.querySelector('button') as HTMLButtonElement;
      return button.ariaControlsElements?.[0] === document.querySelector('sb-tabs-content[value="overview"]');
    });
    expect(same).toBe(true);
    const cdp = await page.context().newCDPSession(page);
    await expect.poll(async () => (await axNodes(cdp, 'tabpanel')).map((n) => n.name)).toEqual(['Overview']);
  });

  const mount = (page: Page, markup: string) =>
    page.evaluate(async (inner) => {
      document.querySelector('#under-test')?.remove();
      document.body.insertAdjacentHTML('beforeend', `<div id="under-test">${inner}</div>`);
      await Promise.all([...document.querySelectorAll('#under-test *')].flatMap((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete ?? []));
    }, markup);

  const TABS = (attrs = '', listAttrs = '') => `<sb-tabs ${attrs}><sb-tabs-list ${listAttrs} aria-label="Sections"><sb-tabs-trigger value="a" disabled>A</sb-tabs-trigger><sb-tabs-trigger value="b">B</sb-tabs-trigger><sb-tabs-trigger value="c">C</sb-tabs-trigger></sb-tabs-list><sb-tabs-content value="a">pa</sb-tabs-content><sb-tabs-content value="b">pb</sb-tabs-content><sb-tabs-content value="c">pc</sb-tabs-content></sb-tabs>`;

  test('an author role on the list is kept; without one the list is a tablist', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    await mount(page, TABS('', 'role="toolbar"'));
    await expect(page.locator('#under-test sb-tabs-list')).toHaveAttribute('role', 'toolbar');
    await mount(page, TABS());
    await expect(page.locator('#under-test sb-tabs-list')).toHaveAttribute('role', 'tablist');
  });

  test('a value that matches no enabled tab falls back to the first enabled tab', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    await mount(page, TABS('value="ghost"'));
    await expect(page.locator('#under-test sb-tabs')).toHaveAttribute('value', 'b');
    await mount(page, TABS('value="a"'));
    await expect(page.locator('#under-test sb-tabs')).toHaveAttribute('value', 'b');
    await mount(page, TABS('value="c"'));
    await expect(page.locator('#under-test sb-tabs')).toHaveAttribute('value', 'c');
  });

  test('a panel or tab added later is wired: aria-controls and the panel name follow', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    await mount(page, `<sb-tabs value="x"><sb-tabs-list aria-label="Sections"><sb-tabs-trigger value="x">X</sb-tabs-trigger><sb-tabs-trigger value="y">Y</sb-tabs-trigger></sb-tabs-list><sb-tabs-content value="x">px</sb-tabs-content></sb-tabs>`);
    await page.locator('#under-test sb-tabs').evaluate((el) => el.insertAdjacentHTML('beforeend', '<sb-tabs-content value="y">py</sb-tabs-content><sb-tabs-content value="z">pz</sb-tabs-content>'));
    await expect
      .poll(() =>
        page.evaluate(() => {
          const button = document.querySelectorAll('#under-test sb-tabs-trigger')[1]!.shadowRoot!.querySelector('button') as HTMLButtonElement;
          return button.ariaControlsElements?.[0] === document.querySelector('#under-test sb-tabs-content[value="y"]');
        }),
      )
      .toBe(true);
    await page.locator('#under-test sb-tabs-list').evaluate((el) => el.insertAdjacentHTML('beforeend', '<sb-tabs-trigger value="z">Zed</sb-tabs-trigger>'));
    await page.locator('#under-test sb-tabs-trigger[value="z"]').click();
    const cdp = await page.context().newCDPSession(page);
    await expect.poll(async () => (await axNodes(cdp, 'tabpanel')).map((n) => n.name)).toContain('Zed');
  });

  test('the list variant sets the track and the indicator from tokens', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    const list = page.locator('sb-tabs-list [part="list"]');
    expect(await list.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(page.locator(TAG), '--sb-tabs-list-bg'));
    expect(await list.evaluate((el) => getComputedStyle(el).height)).toBe(await tokenLength(page.locator(TAG), '--sb-tabs-list-height'));
    expect(await tab(page, 0).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(page.locator(TAG), '--sb-tabs-trigger-active-bg'));
    await gotoStory(page, 'components-tabs--line', TAG);
    expect(await page.locator('sb-tabs-list [part="list"]').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    expect(await tab(page, 1).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    const bar = await tab(page, 1).evaluate((el) => getComputedStyle(el, '::after').height);
    expect(bar).toBe(await tokenLength(page.locator(TAG), '--sb-tabs-indicator-width'));
  });

  test('the focus ring shows for keyboard focus only, in the token color', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    const ring = await tokenColor(page.locator(TAG), '--sb-tabs-focus-ring-color');
    const shadow = () => tab(page, 1).evaluate((el) => getComputedStyle(el).boxShadow);
    await tab(page, 1).click();
    await page.waitForTimeout(300);
    expect(await shadow()).not.toContain(ring);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect.poll(shadow).toContain(ring);
  });

  test('screen-reader view: arrows move between tabs and select the panel, manual activation waits for enter', async ({ page }) => {
    await gotoStory(page, 'components-tabs--default', TAG);
    await tab(page, 0).focus();
    await expectScreenReaderView(page, 'tabs-first');
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 1)).toHaveAttribute('aria-selected', 'true');
    await expectScreenReaderView(page, 'tabs-second');
    await gotoStory(page, 'components-tabs--manual-activation', TAG);
    await tab(page, 0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 1)).toBeFocused();
    await expect(tab(page, 0)).toHaveAttribute('aria-selected', 'true');
    await expectScreenReaderView(page, 'tabs-manual-focused');
  });

  test('has no axe violations in the main stories', async ({ page }) => {
    for (const id of ['default', 'line', 'vertical', 'disabled-tab', 'with-form-control']) {
      await gotoStory(page, `components-tabs--${id}`, TAG);
      expect(await axeViolations(page, TAG), id).toEqual([]);
    }
  });

  test('the selected tab has a 3:1 border in the default variant; the line variant keeps its indicator', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, 'components-tabs--default', TAG);
    const border = await tokenColor(page.locator(TAG), '--sb-tabs-trigger-active-border');
    const edge = (nth: number) => tab(page, nth).evaluate((el) => { const s = getComputedStyle(el); return { color: s.borderTopColor, width: s.borderTopWidth }; });
    expect((await edge(0)).color).toBe(border);
    expect((await edge(0)).width).not.toBe('0px');
    expect((await edge(1)).color).toBe('rgba(0, 0, 0, 0)');
    await gotoStory(page, 'components-tabs--line', TAG);
    expect((await edge(1)).color).toBe('rgba(0, 0, 0, 0)');
  });

  test('forced colors: the selected tab and the line indicator use system colors and stay visible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-tabs--default', TAG);
    const state = (nth: number) =>
      page.locator('sb-tabs-trigger').nth(nth).evaluate((el) => {
        const s = getComputedStyle(el.shadowRoot!.querySelector('button')!);
        return { bg: s.backgroundColor, fg: s.color };
      });
    const [active, inactive] = [await state(0), await state(1)];
    expect(active.bg).toBe(await systemColor(page, 'Highlight'));
    expect(active.fg).toBe(await systemColor(page, 'HighlightText'));
    expect(active.bg).not.toBe(inactive.bg);
    // A Canvas backplate behind the text would leave HighlightText on white: the selected pill opts out of adjusting.
    expect(await tab(page, 0).evaluate((el) => getComputedStyle(el).getPropertyValue('forced-color-adjust'))).toBe('none');
    await gotoStory(page, 'components-tabs--line', TAG);
    expect(await tab(page, 0).evaluate((el) => getComputedStyle(el).getPropertyValue('forced-color-adjust'))).toBe('auto');
    const line = await page.locator('sb-tabs-trigger').nth(1).evaluate((el) => {
      const s = getComputedStyle(el.shadowRoot!.querySelector('button')!, '::after');
      return { bg: s.backgroundColor, opacity: s.opacity };
    });
    expect(line).toEqual({ bg: await systemColor(page, 'Highlight'), opacity: '1' });
    const lineBg = await page.locator('sb-tabs-trigger').nth(1).evaluate((el) => getComputedStyle(el.shadowRoot!.querySelector('button')!).backgroundColor);
    expect(lineBg).not.toBe(await systemColor(page, 'Highlight'));
  });
});
