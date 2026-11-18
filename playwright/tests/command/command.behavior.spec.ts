import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, axNodes, expectScreenReaderView } from '../../helpers/a11y';
import { submitsOnEnter } from '../../helpers/forms';
import { gotoStory } from '../../helpers/storybook';
import { systemColor } from '../../helpers/styles';
import { tokenColor, tokenLength } from '../../helpers/tokens';

const TAG = 'sb-command';
const field = (page: Page) => page.locator('sb-command-input [part="input"]').first();
const optionNames = (page: Page) => page.getByRole('option').evaluateAll((els) => els.map((el) => el.textContent?.replace(/\s+/g, ' ').trim()));
const activeName = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector('sb-command-input')!.shadowRoot!.querySelector('input')!.ariaActiveDescendantElement;
    if (!el) return null;
    return [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join('').trim();
  });
const recordSelects = (page: Page) =>
  page.evaluateHandle(() => {
    const seen: { value: string; target: string; bubbles: boolean; composed: boolean; cancelable: boolean }[] = [];
    document.addEventListener('sb-select', (e) =>
      seen.push({ value: (e as CustomEvent<{ value: string }>).detail.value, target: (e.target as Element).localName, bubbles: e.bubbles, composed: e.composed, cancelable: e.cancelable }),
    );
    return seen;
  });

const settle = (page: Page, selector = TAG) =>
  page.evaluate(async (sel) => {
    await Promise.all([...document.querySelectorAll(sel)].flatMap((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete ?? []));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, selector);

const mount = (page: Page, markup: string) =>
  page.evaluate(async (inner) => {
    document.querySelector('#under-test')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="under-test">${inner}</div>`);
    await Promise.all([...document.querySelectorAll('#under-test *')].flatMap((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete ?? []));
  }, markup);

const COMMAND = (attrs = 'label="Things"', items = '<sb-command-item>Apple</sb-command-item><sb-command-item>Banana</sb-command-item><sb-command-item>Cherry</sb-command-item>') =>
  `<sb-command ${attrs}><sb-command-input></sb-command-input><sb-command-list><sb-command-empty>Nothing here.</sb-command-empty>${items}</sb-command-list></sb-command>`;

test.describe('Command', () => {
  test('a combobox search field controls a listbox of options in named groups', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const combobox = page.getByRole('combobox', { name: 'Search commands' });
    await expect(combobox).toHaveAttribute('aria-expanded', 'true');
    await expect(combobox).toHaveAttribute('aria-autocomplete', 'list');
    await expect(combobox).toHaveAttribute('type', 'text');
    await expect(combobox).toHaveAttribute('autocomplete', 'off');
    await expect(combobox).toHaveAttribute('spellcheck', 'false');
    await expect(page.getByRole('listbox', { name: 'Search commands' })).toBeVisible();
    await expect(page.getByRole('option')).toHaveCount(6);
    await expect(page.getByRole('group', { name: 'Suggestions' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Settings' })).toBeVisible();
    expect(await page.locator('sb-command-group [part="heading"]').first().getAttribute('aria-hidden')).toBe('true');
  });

  test('label names the field and the list; the placeholder is not the name', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await page.locator(TAG).evaluate((el) => el.setAttribute('label', 'Find an action'));
    await expect(page.getByRole('combobox', { name: 'Find an action' })).toHaveAttribute('placeholder', 'Type a command or search...');
    await expect(page.getByRole('listbox', { name: 'Find an action' })).toBeVisible();
  });

  test('a missing label warns once in the console', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
    await mount(page, COMMAND(''));
    await expect.poll(() => warnings.filter((w) => w.includes('<sb-command>')).length).toBe(1);
    await page.locator('#under-test sb-command').evaluate((el) => el.setAttribute('loop', ''));
    await page.locator('#under-test sb-command').evaluate((el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(warnings.filter((w) => w.includes('<sb-command>'))).toHaveLength(1);
  });

  test('filter auto: hides non-matching items, empty groups and separators, keeps order', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await field(page).fill('cal');
    await expect(page.getByRole('option')).toHaveCount(2);
    expect(await optionNames(page)).toEqual(['Calendar', 'Calculator']);
    await expect(page.getByRole('group')).toHaveCount(1);
    await expect(page.locator('sb-command-group[label="Settings"]')).toBeHidden();
    await expect(page.locator('sb-command-separator')).toBeHidden();
    await field(page).fill('');
    await expect(page.getByRole('option')).toHaveCount(6);
    await expect(page.locator('sb-command-separator')).toBeAttached();
    expect(await page.locator('sb-command-separator').evaluate((el) => (el as HTMLElement).hidden)).toBe(false);
  });

  test('matching ignores case and accents, needs every term, and searches keywords', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await field(page).fill('CÁL');
    await expect.poll(() => optionNames(page)).toEqual(['Calendar', 'Calculator']);
    await field(page).fill('search moji');
    await expect.poll(() => optionNames(page)).toEqual(['Search Emoji']);
    await field(page).fill('search calendar');
    await expect(page.getByRole('option')).toHaveCount(0);
    await field(page).fill('account');
    await expect.poll(() => optionNames(page)).toEqual(['Profile']);
  });

  test('an item value defaults to its trimmed text without the shortcut; an explicit value is matched and reported', async ({ page }) => {
    await gotoStory(page, 'components-command--groups-and-shortcuts', TAG);
    const selects = await recordSelects(page);
    await field(page).fill('⌘P');
    await expect(page.getByRole('option')).toHaveCount(0);
    await field(page).fill('profile');
    await expect.poll(() => activeName(page)).toBe('Profile');
    await page.keyboard.press('Enter');
    await mount(page, COMMAND('label="Things"', '<sb-command-item value="fruit-a">Apple</sb-command-item><sb-command-item>Banana</sb-command-item>'));
    const input = page.locator('#under-test sb-command-input [part="input"]');
    await input.fill('apple');
    await expect(page.locator('#under-test').getByRole('option')).toHaveCount(0);
    await input.fill('fruit');
    await expect(page.locator('#under-test').getByRole('option')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await selects.evaluate((s) => s)).map((s) => s.value)).toEqual(['Profile', 'fruit-a']);
  });

  test('filter manual: nothing hides; the consumer renders the matching items', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await mount(page, COMMAND('label="Things" filter="manual"'));
    await page.locator('#under-test sb-command-input [part="input"]').fill('zzz');
    await settle(page, '#under-test *');
    await expect(page.locator('#under-test').getByRole('option')).toHaveCount(3);
    await expect(page.locator('#under-test sb-command-empty')).toBeHidden();
    await gotoStory(page, 'components-command--manual-filter', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('filter', 'manual');
    await field(page).fill('bi');
    await expect.poll(() => optionNames(page)).toEqual(['Billing']);
    await expect.poll(() => activeName(page)).toBe('Billing');
    await field(page).fill('q');
    await expect(page.getByRole('option')).toHaveCount(0);
    await expect(page.locator('sb-command-empty')).toBeVisible();
  });

  test('changing filter after the first render re-filters with the current search text', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await mount(page, COMMAND());
    const scope = page.locator('#under-test');
    await scope.locator('sb-command-input [part="input"]').fill('ban');
    await expect(scope.getByRole('option')).toHaveCount(1);
    await scope.locator(TAG).evaluate((el) => el.setAttribute('filter', 'manual'));
    await settle(page, '#under-test *');
    await expect(scope.getByRole('option')).toHaveCount(3);
    await scope.locator(TAG).evaluate((el) => el.setAttribute('filter', 'auto'));
    await expect(scope.getByRole('option')).toHaveCount(1);
    await expect.poll(() => scope.getByRole('option').textContent()).toBe('Banana');
  });

  test('item value and keywords set as properties, and item text changes, re-filter', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await mount(page, COMMAND());
    const scope = page.locator('#under-test');
    await scope.locator('sb-command-input [part="input"]').fill('fruit');
    await expect(scope.getByRole('option')).toHaveCount(0);
    await scope.locator('sb-command-item').nth(1).evaluate((el) => ((el as HTMLElement & { keywords: string }).keywords = 'fruit'));
    await expect.poll(() => scope.getByRole('option').allTextContents()).toEqual(['Banana']);
    await scope.locator('sb-command-item').nth(2).evaluate((el) => ((el as HTMLElement & { value: string }).value = 'fruit-c'));
    await expect.poll(() => scope.getByRole('option').allTextContents()).toEqual(['Banana', 'Cherry']);
    await scope.locator('sb-command-input [part="input"]').fill('grape');
    await expect(scope.getByRole('option')).toHaveCount(0);
    await scope.locator('sb-command-item').first().evaluate((el) => (el.firstChild!.textContent = 'Grape'));
    await expect.poll(() => scope.getByRole('option').allTextContents()).toEqual(['Grape']);
  });

  test('light-DOM changes made while detached are reflected after re-attaching', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await mount(page, COMMAND());
    const scope = page.locator('#under-test');
    await scope.locator('sb-command-input [part="input"]').fill('grape');
    await expect(scope.getByRole('option')).toHaveCount(0);
    await expect(scope.locator('sb-command-empty')).toBeVisible();
    await page.evaluate(() => {
      const host = document.querySelector('#under-test sb-command')!;
      const parent = host.parentElement!;
      host.remove();
      host.querySelector('sb-command-item')!.firstChild!.textContent = 'Grape';
      parent.append(host);
    });
    await expect.poll(() => scope.getByRole('option').allTextContents()).toEqual(['Grape']);
    await expect(scope.locator('sb-command-empty')).toBeHidden();
  });

  test('hovering the item that is already active does not re-render the parts', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const billing = page.getByRole('option', { name: 'Billing' });
    await billing.hover();
    await expect.poll(() => activeName(page)).toBe('Billing');
    const updates = await page.evaluateHandle(() => {
      const count = { n: 0 };
      for (const el of document.querySelectorAll<HTMLElement & { requestUpdate: (...a: unknown[]) => void }>('sb-command-input, sb-command-list')) {
        const original = el.requestUpdate.bind(el);
        el.requestUpdate = (...a) => {
          count.n++;
          original(...a);
        };
      }
      return count;
    });
    const box = (await billing.boundingBox())!;
    for (let i = 1; i <= 5; i++) await page.mouse.move(box.x + 10 + i, box.y + box.height / 2);
    await settle(page);
    expect(await updates.evaluate((c) => c.n)).toBe(0);
    await page.getByRole('option', { name: 'Calendar' }).hover();
    await expect.poll(() => activeName(page)).toBe('Calendar');
    await settle(page);
    expect(await updates.evaluate((c) => c.n)).toBeGreaterThan(0);
  });

  test('the search row shows a focus ring only while no item is active', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const host = page.locator(TAG);
    const row = page.locator('sb-command-input [part="input-row"]');
    const outline = () => row.evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, color: getComputedStyle(el).outlineColor, width: getComputedStyle(el).outlineWidth }));
    await field(page).focus();
    expect((await outline()).style).toBe('none');
    await field(page).fill('nothing matches');
    await expect.poll(async () => (await outline()).style).toBe('solid');
    expect((await outline()).color).toBe(await tokenColor(host, '--sb-command-item-active-ring-color'));
    expect((await outline()).width).toBe(await tokenLength(host, '--sb-command-item-active-ring-width'));
    await field(page).fill('cal');
    await expect.poll(async () => (await outline()).style).toBe('none');
    await field(page).fill('nothing matches');
    await field(page).blur();
    await expect.poll(async () => (await outline()).style).toBe('none');
  });

  test('a browser without ARIA element reflection gets a console warning, once', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
    await page.evaluate(() => delete (Element.prototype as Partial<Element>).ariaActiveDescendantElement);
    await mount(page, COMMAND());
    await mount(page, COMMAND());
    await expect.poll(() => warnings.filter((w) => w.includes('<sb-command-input>')).length).toBe(1);
    await settle(page, '#under-test *');
    expect(warnings.filter((w) => w.includes('<sb-command-input>'))).toHaveLength(1);
  });

  test('the first enabled match is active after the search text changes', async ({ page }) => {
    await gotoStory(page, 'components-command--disabled-item', TAG);
    await expect.poll(() => activeName(page)).toBe('Calendar');
    await field(page).fill('calc');
    await expect.poll(() => activeName(page)).toBe(null);
    await field(page).fill('s');
    await expect.poll(() => activeName(page)).toBe('Search Emoji');
    await expect(page.getByRole('option', { name: 'Search Emoji' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('sb-command-item[aria-selected="true"]')).toHaveCount(1);
  });

  test('Arrow Down and Arrow Up move the active item and skip disabled items', async ({ page }) => {
    await gotoStory(page, 'components-command--disabled-item', TAG);
    await field(page).focus();
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeName(page)).toBe('Search Emoji');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeName(page)).toBe('Profile');
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => activeName(page)).toBe('Search Emoji');
    await expect(field(page)).toBeFocused();
  });

  test('loop off: the arrows stop at the ends', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await field(page).focus();
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => activeName(page)).toBe('Calendar');
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeName(page)).toBe('Settings');
  });

  test('loop on: the arrows wrap', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await page.locator(TAG).evaluate((el) => el.setAttribute('loop', ''));
    await field(page).focus();
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => activeName(page)).toBe('Settings');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeName(page)).toBe('Calendar');
  });

  test('hover makes an enabled item active; a disabled item is skipped', async ({ page }) => {
    await gotoStory(page, 'components-command--disabled-item', TAG);
    await page.getByRole('option', { name: 'Billing' }).hover();
    await expect.poll(() => activeName(page)).toBe('Billing');
    await page.getByRole('option', { name: 'Search Emoji' }).hover();
    await expect.poll(() => activeName(page)).toBe('Search Emoji');
    await page.getByRole('option', { name: 'Calculator' }).hover();
    await settle(page);
    expect(await activeName(page)).toBe('Search Emoji');
  });

  test('disabled item: aria-disabled, dimmed from the token, never selected', async ({ page }) => {
    await gotoStory(page, 'components-command--disabled-item', TAG);
    const selects = await recordSelects(page);
    const calc = page.locator('sb-command-item[disabled]');
    await expect(calc).toHaveAttribute('aria-disabled', 'true');
    const opacity = await page.locator(TAG).evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.opacity = 'var(--sb-command-item-disabled-opacity)';
      el.after(probe);
      const value = getComputedStyle(probe).opacity;
      probe.remove();
      return value;
    });
    expect(await calc.locator('[part="item"]').evaluate((el) => getComputedStyle(el).opacity)).toBe(opacity);
    await calc.click({ force: true });
    await field(page).fill('calc');
    await expect(page.getByRole('option', { name: 'Calculator' })).toHaveCount(1);
    await settle(page);
    await page.keyboard.press('Enter');
    await settle(page);
    expect(await selects.evaluate((s) => s.length)).toBe(0);
    await field(page).fill('profile');
    await expect.poll(() => activeName(page)).toBe('Profile');
    await page.keyboard.press('Enter');
    await expect.poll(() => selects.evaluate((s) => s.length)).toBe(1);
  });

  test('Enter selects the active item: sb-select carries the value, bubbles, is composed, targets the item', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const selects = await recordSelects(page);
    await field(page).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    expect(await selects.evaluate((s) => s)).toEqual([{ value: 'Search Emoji', target: 'sb-command-item', bubbles: true, composed: true, cancelable: false }]);
  });

  test('a click selects an item and keeps focus in the field', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const selects = await recordSelects(page);
    await field(page).focus();
    await page.getByRole('option', { name: 'Billing' }).click();
    expect((await selects.evaluate((s) => s)).map((s) => s.value)).toEqual(['Billing']);
    await expect(field(page)).toBeFocused();
  });

  test('changes made from code never fire sb-select', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const selects = await recordSelects(page);
    await page.locator('sb-command-input').evaluate((el) => ((el as HTMLElement & { value: string }).value = 'bill'));
    await expect.poll(() => activeName(page)).toBe('Billing');
    expect(await selects.evaluate((s) => s.length)).toBe(0);
  });

  test('sb-command-input value set from code filters the list; the native input event reaches sb-command', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await page.locator('sb-command-input').evaluate((el) => ((el as HTMLElement & { value: string }).value = 'set'));
    await expect.poll(() => optionNames(page)).toEqual(['Settings']);
    expect(await field(page).inputValue()).toBe('set');
    const inputs = await page.locator(TAG).evaluateHandle((el) => {
      const seen: { value: string; composed: boolean }[] = [];
      el.addEventListener('input', (e) => seen.push({ value: (e.target as HTMLElement & { value: string }).value, composed: e.composed }));
      return seen;
    });
    await field(page).fill('');
    await field(page).pressSequentially('pro');
    expect((await inputs.evaluate((s) => s)).at(-1)).toEqual({ value: 'pro', composed: true });
    await expect.poll(() => optionNames(page)).toEqual(['Profile']);
  });

  test('Enter inside a form never submits it', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const selects = await recordSelects(page);
    const submits = await submitsOnEnter(page, COMMAND(), 'sb-command-input');
    expect(submits).toBe(0);
    expect((await selects.evaluate((s) => s)).map((s) => s.value)).toEqual(['Apple']);
  });

  test('Home and End move the caret, not the active item', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await field(page).fill('s');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeName(page)).toBe('Profile');
    await page.keyboard.press('Home');
    expect(await field(page).evaluate((el: HTMLInputElement) => el.selectionStart)).toBe(0);
    await page.keyboard.press('End');
    expect(await field(page).evaluate((el: HTMLInputElement) => el.selectionStart)).toBe(1);
    await expect.poll(() => activeName(page)).toBe('Profile');
  });

  test('Escape is not handled: it reaches the container unprevented', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const seen = await page.evaluateHandle(() => {
      const keys: { prevented: boolean }[] = [];
      document.querySelector('#storybook-root')!.addEventListener('keydown', (e) => (e as KeyboardEvent).key === 'Escape' && keys.push({ prevented: e.defaultPrevented }));
      return keys;
    });
    await field(page).fill('cal');
    await page.keyboard.press('Escape');
    expect(await seen.evaluate((k) => k)).toEqual([{ prevented: false }]);
    expect(await field(page).inputValue()).toBe('cal');
  });

  test('one tab stop: Tab enters the search field, the next Tab leaves the command', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await page.keyboard.press('Tab');
    await expect(field(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(field(page)).not.toBeFocused();
    expect(await page.evaluate(() => document.activeElement?.closest('sb-command') ?? null)).toBeNull();
  });

  test('aria-controls and aria-activedescendant are element references, re-resolved on filtering', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    const refs = () =>
      page.evaluate(() => {
        const input = document.querySelector('sb-command-input')!.shadowRoot!.querySelector('input')!;
        return {
          controls: input.ariaControlsElements?.[0] === document.querySelector('sb-command-list'),
          active: input.ariaActiveDescendantElement?.localName ?? null,
          idRefs: !!(input.getAttribute('aria-controls') || input.getAttribute('aria-activedescendant')),
        };
      });
    expect(await refs()).toEqual({ controls: true, active: 'sb-command-item', idRefs: false });
    await field(page).fill('bill');
    await expect.poll(() => activeName(page)).toBe('Billing');
    await field(page).fill('nothing matches');
    await expect.poll(async () => (await refs()).active).toBeNull();
  });

  test('items added later are filtered and become active', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await field(page).fill('pear');
    await expect(page.locator('sb-command-empty')).toBeVisible();
    await page.locator('sb-command-group[label="Suggestions"]').evaluate((el) => el.insertAdjacentHTML('beforeend', '<sb-command-item>Pear</sb-command-item><sb-command-item>Plum</sb-command-item>'));
    await expect.poll(() => optionNames(page)).toEqual(['Pear']);
    await expect.poll(() => activeName(page)).toBe('Pear');
    await expect(page.locator('sb-command-empty')).toBeHidden();
  });

  test('the empty state shows only with no match; it and the separator are not exposed in the listbox', async ({ page }) => {
    await gotoStory(page, 'components-command--empty', TAG);
    await expect(page.locator('sb-command-empty')).toBeVisible();
    await expect(page.locator('sb-command-empty')).toHaveAttribute('role', 'none');
    await expect(page.locator('sb-command-separator')).toHaveAttribute('role', 'none');
    await field(page).fill('');
    await expect(page.locator('sb-command-empty')).toBeHidden();
  });

  test('a polite status announces the result count after typing pauses, then the empty text', async ({ page }) => {
    await gotoStory(page, 'components-command--disabled-item', TAG);
    const status = page.locator(TAG).locator('[role="status"]');
    const announced = { timeout: 10_000 };
    await expect(status).toHaveText('');
    await field(page).pressSequentially('ca');
    await expect(page.getByRole('option')).toHaveCount(2);
    await expect(status).toHaveText('1 results', announced);
    await field(page).pressSequentially('xx');
    await expect(page.getByRole('option')).toHaveCount(0);
    await expect(status).toHaveText('No results found.', announced);
    await page.locator(TAG).evaluate((el) => el.setAttribute('results-label', '{count} resultados'));
    await field(page).fill('s');
    await expect(page.getByRole('option')).toHaveCount(3);
    await expect(status).toHaveText('3 resultados', announced);
  });

  test('the shortcut hint is hidden from assistive technology and not part of the option name', async ({ page }) => {
    await gotoStory(page, 'components-command--groups-and-shortcuts', TAG);
    await expect(page.locator('sb-command-shortcut').first()).toHaveAttribute('aria-hidden', 'true');
    const cdp = await page.context().newCDPSession(page);
    await expect.poll(async () => (await axNodes(cdp, 'option')).map((n) => n.name)).toEqual(['Calendar', 'Search Emoji', 'Calculator', 'Profile', 'Billing', 'Settings']);
  });

  test('the active item takes the accent fill, its text color and an inset ring from tokens', async ({ page }) => {
    await gotoStory(page, 'components-command--groups-and-shortcuts', TAG);
    const host = page.locator(TAG);
    const style = (nth: number) =>
      page.locator('sb-command-item').nth(nth).locator('[part="item"]').evaluate((el) => {
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, fg: s.color, shadow: s.boxShadow };
      });
    const active = await style(0);
    expect(active.bg).toBe(await tokenColor(host, '--sb-command-item-active-bg'));
    expect(active.fg).toBe(await tokenColor(host, '--sb-command-item-active-fg'));
    expect(active.shadow).toContain(await tokenColor(host, '--sb-command-item-active-ring-color'));
    expect(active.shadow).toContain('inset');
    expect(active.shadow).toContain(await tokenLength(host, '--sb-command-item-active-ring-width'));
    expect((await style(1)).bg).toBe('rgba(0, 0, 0, 0)');
  });

  test('sizes and the shortcut come from tokens; the shortcut sits at the inline end', async ({ page }) => {
    await gotoStory(page, 'components-command--groups-and-shortcuts', TAG);
    const host = page.locator(TAG);
    const list = page.locator('sb-command-list [part="list"]');
    expect(await list.evaluate((el) => getComputedStyle(el).maxHeight)).toBe(await tokenLength(host, '--sb-command-list-max-height'));
    expect(await page.locator('sb-command-input [part="input-row"]').evaluate((el) => getComputedStyle(el).height)).toBe(await tokenLength(host, '--sb-command-input-height'));
    const shortcut = page.locator('sb-command-shortcut').first().locator('[part="shortcut"]');
    const letterSpacing = await host.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.fontSize = 'var(--sb-command-shortcut-font-size)';
      probe.style.letterSpacing = 'var(--sb-command-shortcut-letter-spacing)';
      el.after(probe);
      const value = getComputedStyle(probe).letterSpacing;
      probe.remove();
      return value;
    });
    expect(await shortcut.evaluate((el) => getComputedStyle(el).letterSpacing)).toBe(letterSpacing);
    expect(await page.locator('sb-command-group [part="heading"]').first().evaluate((el) => getComputedStyle(el).color)).toBe(await tokenColor(host, '--sb-command-group-heading-fg'));
    const item = await page.locator('sb-command-item').nth(3).boundingBox();
    const key = await page.locator('sb-command-shortcut').first().boundingBox();
    expect(item!.height).toBeGreaterThanOrEqual(32);
    expect(key!.x + key!.width).toBeGreaterThan(item!.x + item!.width - 16);
  });

  test('right to left: the shortcut sits at the inline end (left)', async ({ page }) => {
    await gotoStory(page, 'components-command--rtl', TAG);
    const item = await page.locator('sb-command-item').nth(3).boundingBox();
    const key = await page.locator('sb-command-shortcut').first().boundingBox();
    expect(key!.x).toBeLessThan(item!.x + 16);
  });

  test('scrollable: the active item scrolls into view', async ({ page }) => {
    await gotoStory(page, 'components-command--scrollable', TAG);
    const list = page.locator('sb-command-list [part="list"]');
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await field(page).focus();
    for (let i = 0; i < 18; i++) await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeName(page)).toBe('Color');
    await expect(page.locator('sb-command-item[aria-selected="true"]')).toBeInViewport();
    expect(await list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  });

  test('in a dialog: opening focuses the search field, Escape closes it', async ({ page }) => {
    await gotoStory(page, 'components-command--in-a-dialog', TAG, 'attached');
    await page.getByRole('button', { name: 'Open command palette' }).click();
    await expect(field(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog')).not.toHaveAttribute('open');
  });

  test('autofocus on the host focuses the search field', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await mount(page, `<dialog>${COMMAND('label="Things" autofocus')}</dialog>`);
    await page.locator('#under-test dialog').evaluate((d: HTMLDialogElement) => d.showModal());
    await expect(page.locator('#under-test sb-command-input [part="input"]')).toBeFocused();
  });

  test('forced colors: the active item is Highlight on HighlightText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-command--default', TAG);
    const item = page.locator('sb-command-item').first().locator('[part="item"]');
    expect(await item.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await systemColor(page, 'Highlight'));
    expect(await item.evaluate((el) => getComputedStyle(el).color)).toBe(await systemColor(page, 'HighlightText'));
  });

  // axe exempts a combobox's listbox from scrollable-region-focusable, but finds the combobox only through an
  // ID in aria-controls; the element reference (SB-0103) is invisible to it. The arrows scroll the list instead.
  const axeClean = async (page: Page, label: string) => {
    const violations = await axeViolations(page, TAG);
    const scroller = violations.filter((v) => v.id === 'scrollable-region-focusable');
    expect(violations.filter((v) => !scroller.includes(v)), label).toEqual([]);
    const targets = scroller.flatMap((v) => v.targets.map((t) => [t].flat().join(' ')));
    const overflowing = await page.locator('sb-command-list [part="list"]').evaluateAll((els) => els.filter((el) => el.scrollHeight > el.clientHeight).length);
    expect(targets, `${label}: only overflowing list scrollers are exempt`).toHaveLength(overflowing);
    for (const target of targets) expect(target, label).toMatch(/^sb-command-list\b/);
  };

  for (const id of ['default', 'groups-and-shortcuts', 'disabled-item', 'empty', 'manual-filter', 'scrollable', 'rtl']) {
    test(`has no axe violations: ${id}`, async ({ page }) => {
      await gotoStory(page, `components-command--${id}`, TAG);
      await axeClean(page, id);
    });
  }

  test('has no axe violations: filtered', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await field(page).fill('cal');
    await expect(page.getByRole('option')).toHaveCount(2);
    await settle(page);
    await axeClean(page, 'filtered');
  });

  test('screen-reader view: arrows move the active option, typing filters and announces the count', async ({ page }) => {
    await gotoStory(page, 'components-command--default', TAG);
    await field(page).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await settle(page);
    await expectScreenReaderView(page, 'command-arrow-down');
    await page.keyboard.type('cal');
    await expect(page.getByRole('option')).toHaveCount(2);
    await expect(page.getByRole('status')).toHaveText(/2/);
    await settle(page);
    await expectScreenReaderView(page, 'command-filtered');
  });

  test('has no axe violations: in a dialog', async ({ page }) => {
    await gotoStory(page, 'components-command--in-a-dialog', TAG, 'attached');
    await page.getByRole('button', { name: 'Open command palette' }).click();
    await expect(field(page)).toBeFocused();
    await settle(page);
    await axeClean(page, 'in-a-dialog');
  });
});
