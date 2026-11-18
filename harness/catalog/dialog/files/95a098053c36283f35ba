import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, axNodes, axTree, expectScreenReaderView } from '../../helpers/a11y';
import { recordHostEvents } from '../../helpers/events';
import { gotoStory } from '../../helpers/storybook';
import { systemColor } from '../../helpers/styles';
import { tokenColor, tokenLength, tokenNumber, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-dialog';
type Host = HTMLElement & { open: boolean };

const go = (page: Page, story: string) => gotoStory(page, `components-dialog--${story}`, TAG, 'attached');
const host = (page: Page) => page.locator(TAG).first();
const surface = (page: Page) => page.locator('sb-dialog-content [part="dialog"]').first();
const closeButton = (page: Page) => page.locator('sb-dialog-content [part="close"]').first();
const triggerButton = (page: Page) => page.locator('sb-dialog-trigger sb-button').first();
const isOpen = (page: Page) => host(page).evaluate((el) => (el as Host).open);
const modal = (page: Page) => surface(page).evaluate((el) => el.matches(':modal'));
const openWithTrigger = async (page: Page) => {
  await triggerButton(page).click();
  await expect.poll(() => modal(page)).toBe(true);
};

// The focused element and the focused element inside each shadow root below it, outermost first.
const focusPath = (page: Page) =>
  page.evaluate(() => {
    const path: string[] = [];
    let el: Element | null = document.activeElement;
    while (el && el !== document.body) {
      const label = el.getAttribute('label') ?? el.getAttribute('part');
      path.push(label ? `${el.localName}[${label}]` : el.localName);
      el = el.shadowRoot?.activeElement ?? null;
    }
    return path.join(' > ');
  });

const mount = (page: Page, markup: string) =>
  page.evaluate(async (inner) => {
    document.querySelector('#under-test')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="under-test">${inner}</div>`);
    await Promise.all([...document.querySelectorAll('#under-test *')].flatMap((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete ?? []));
  }, markup);

const mounted = (page: Page) => page.locator('#under-test sb-dialog').first();
const setOpen = (page: Page, value: boolean) => mounted(page).evaluate((el, v) => ((el as Host).open = v), value);

const settle = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

const preventCancel = (page: Page) => page.evaluate(() => document.addEventListener('sb-cancel', (e) => e.preventDefault()));

test.describe('Dialog', () => {
  test.describe('props', () => {
    test('open is false by default and reflects when the trigger opens it', async ({ page }) => {
      await go(page, 'default');
      await expect(host(page)).not.toHaveAttribute('open');
      expect(await modal(page)).toBe(false);
      await openWithTrigger(page);
      await expect(host(page)).toHaveAttribute('open', '');
    });

    test('open set in markup shows the dialog as soon as it is connected', async ({ page }) => {
      await go(page, 'open');
      await expect.poll(() => modal(page)).toBe(true);
      await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeVisible();
    });

    test('open set from code opens and closes the dialog', async ({ page }) => {
      await go(page, 'default');
      await host(page).evaluate((el) => ((el as Host).open = true));
      await expect.poll(() => modal(page)).toBe(true);
      await host(page).evaluate((el) => el.removeAttribute('open'));
      await expect.poll(() => surface(page).evaluate((el) => (el as HTMLDialogElement).open)).toBe(false);
    });

    test('hideCloseButton removes the built-in close button', async ({ page }) => {
      await go(page, 'no-close-button');
      await openWithTrigger(page);
      await expect(closeButton(page)).toHaveCount(0);
      await page.locator('sb-dialog-content').evaluate((el) => el.removeAttribute('hide-close-button'));
      await expect(closeButton(page)).toBeVisible();
    });

    test('closeLabel names the close button, "Close" by default', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
      await page.locator('sb-dialog-content').evaluate((el) => el.setAttribute('close-label', 'Cerrar'));
      await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
      expect(await closeButton(page).locator('svg').getAttribute('aria-hidden')).toBe('true');
    });
  });

  test.describe('events', () => {
    test('sb-toggle bubbles, is composed and fires after each change, from a person or from code', async ({ page }) => {
      await go(page, 'default');
      const events = await recordHostEvents(page, 'sb-toggle');
      const seen = () => events.evaluate((list) => list.length);
      await openWithTrigger(page);
      await expect.poll(seen).toBe(1);
      await closeButton(page).click();
      await expect.poll(seen).toBe(2);
      await host(page).evaluate((el) => ((el as Host).open = true));
      await expect.poll(seen).toBe(3);
      expect(await events.evaluate((list) => list[0])).toEqual({ bubbles: true, composed: true, cancelable: false, target: TAG });
    });

    test('Escape fires a cancelable sb-cancel, then closes', async ({ page }) => {
      await go(page, 'default');
      const events = await recordHostEvents(page, 'sb-cancel');
      await openWithTrigger(page);
      await page.keyboard.press('Escape');
      await expect.poll(() => isOpen(page)).toBe(false);
      expect(await events.evaluate((list) => list)).toEqual([{ bubbles: true, composed: true, cancelable: true, target: TAG }]);
    });

    test('Escape while an input method is composing neither fires sb-cancel nor closes', async ({ page }) => {
      await go(page, 'default');
      const events = await recordHostEvents(page, 'sb-cancel');
      await openWithTrigger(page);
      await page.evaluate(() => {
        const target = document.activeElement?.shadowRoot?.activeElement ?? document.activeElement ?? document.body;
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true, composed: true, cancelable: true }));
      });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(await isOpen(page)).toBe(true);
      expect(await events.evaluate((list) => list.length)).toBe(0);
    });

    test('a press and release on the backdrop fires sb-cancel, then closes', async ({ page }) => {
      await go(page, 'default');
      const events = await recordHostEvents(page, 'sb-cancel');
      await openWithTrigger(page);
      await page.mouse.click(4, 4);
      await expect.poll(() => isOpen(page)).toBe(false);
      expect(await events.evaluate((list) => list.length)).toBe(1);
    });

    test('the close button, sb-dialog-close and code close without sb-cancel', async ({ page }) => {
      await go(page, 'default');
      const events = await recordHostEvents(page, 'sb-cancel');
      await openWithTrigger(page);
      await closeButton(page).click();
      await expect.poll(() => isOpen(page)).toBe(false);
      await openWithTrigger(page);
      await page.locator('sb-dialog-close sb-button').click();
      await expect.poll(() => isOpen(page)).toBe(false);
      await openWithTrigger(page);
      await host(page).evaluate((el) => ((el as Host).open = false));
      await expect.poll(() => modal(page)).toBe(false);
      expect(await events.evaluate((list) => list.length)).toBe(0);
    });

    test('a prevented sb-cancel keeps the dialog open on Escape', async ({ page }) => {
      await go(page, 'default');
      await preventCancel(page);
      const events = await recordHostEvents(page, 'sb-cancel');
      await openWithTrigger(page);
      await page.keyboard.press('Escape');
      await expect.poll(() => events.evaluate((list) => list.length)).toBe(1);
      await page.keyboard.press('Escape');
      await expect.poll(() => events.evaluate((list) => list.length)).toBe(2);
      await settle(page);
      expect(await modal(page)).toBe(true);
      expect(await isOpen(page)).toBe(true);
      await closeButton(page).click();
      await expect.poll(() => isOpen(page)).toBe(false);
    });

    test('a prevented sb-cancel keeps the dialog open on a backdrop click', async ({ page }) => {
      await go(page, 'default');
      await preventCancel(page);
      const events = await recordHostEvents(page, 'sb-cancel');
      await openWithTrigger(page);
      await page.mouse.click(4, 4);
      await expect.poll(() => events.evaluate((list) => list.length)).toBe(1);
      await settle(page);
      expect(await modal(page)).toBe(true);
      expect(await isOpen(page)).toBe(true);
      await closeButton(page).click();
      await expect.poll(() => isOpen(page)).toBe(false);
    });
  });

  test.describe('trigger and close', () => {
    test('a click on the trigger control opens the dialog', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      expect(await isOpen(page)).toBe(true);
    });

    test('Enter on the trigger control opens the dialog', async ({ page }) => {
      await go(page, 'default');
      await triggerButton(page).focus();
      await page.keyboard.press('Enter');
      await expect.poll(() => modal(page)).toBe(true);
    });

    test('Space on the trigger control opens the dialog', async ({ page }) => {
      await go(page, 'default');
      await triggerButton(page).focus();
      await page.keyboard.press(' ');
      await expect.poll(() => modal(page)).toBe(true);
    });

    test('the trigger and close wrappers add no role; the slotted control keeps its own', async ({ page }) => {
      await go(page, 'default');
      for (const tag of ['sb-dialog-trigger', 'sb-dialog-close']) {
        expect(await page.locator(tag).first().evaluate((el) => [el.getAttribute('role'), getComputedStyle(el).display])).toEqual([null, 'contents']);
      }
      await expect(page.getByRole('button', { name: 'Edit profile' })).toBeVisible();
    });

    test('a control in sb-dialog-close closes the dialog', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect.poll(() => isOpen(page)).toBe(false);
    });

    test('the built-in close button closes the dialog', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await closeButton(page).click();
      await expect.poll(() => isOpen(page)).toBe(false);
      expect(await modal(page)).toBe(false);
    });
  });

  test.describe('modal', () => {
    test('is a modal dialog in the accessibility tree', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeVisible();
      expect(await surface(page).evaluate((el) => el.localName)).toBe('dialog');
    });

    test('the page behind is inert: it cannot be clicked or focused', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      const blocked = await triggerButton(page).evaluate((el) => {
        const box = el.getBoundingClientRect();
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        (el as HTMLElement).focus();
        return { hitTrigger: el.contains(hit), focused: document.activeElement === el };
      });
      expect(blocked).toEqual({ hitTrigger: false, focused: false });
    });

    test('the page does not scroll while open and scrolls again after', async ({ page }) => {
      await go(page, 'default');
      await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<div id="spacer" style="height:4000px"></div>'));
      await openWithTrigger(page);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
      await page.mouse.move(4, 4);
      await page.mouse.wheel(0, 600);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await closeButton(page).click();
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
      await page.mouse.wheel(0, 600);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    });

    test('moved to another container while open: stays modal with its backdrop and scroll lock, releases the lock on close', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await host(page).evaluate((el) => {
        const box = document.createElement('div');
        document.body.append(box);
        box.append(el);
      });
      await expect.poll(() => modal(page)).toBe(true);
      expect(await surface(page).evaluate((el) => getComputedStyle(el, '::backdrop').backgroundColor)).toBe(await tokenColor(host(page), '--sb-dialog-backdrop'));
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
      expect(await isOpen(page)).toBe(true);
      await closeButton(page).click();
      await expect.poll(() => isOpen(page)).toBe(false);
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
    });

    test('re-rendered while detached, then re-attached: the dialog stays open and modal', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await host(page).evaluate(async (el) => {
        const parent = el.parentElement!;
        el.remove();
        const content = el.querySelector('sb-dialog-content') as HTMLElement & { closeLabel: string; updateComplete: Promise<unknown> };
        content.closeLabel = 'Dismiss';
        await content.updateComplete;
        await new Promise((r) => setTimeout(r));
        parent.append(el);
      });
      await expect.poll(() => modal(page)).toBe(true);
      expect(await isOpen(page)).toBe(true);
    });

    test('nested: Escape closes the top dialog first; the page stays locked until the last closes', async ({ page }) => {
      await go(page, 'nested');
      await openWithTrigger(page);
      await page.getByRole('button', { name: 'Advanced...' }).click();
      const inner = page.locator(TAG).nth(1);
      await expect.poll(() => inner.evaluate((el) => (el as Host).open)).toBe(true);
      await expect(page.getByRole('dialog', { name: 'Advanced settings' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect.poll(() => inner.evaluate((el) => (el as Host).open)).toBe(false);
      expect(await isOpen(page)).toBe(true);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
      await page.keyboard.press('Escape');
      await expect.poll(() => isOpen(page)).toBe(false);
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
    });
  });

  test.describe('focus', () => {
    test('on open, focus goes to the element with autofocus', async ({ page }) => {
      await go(page, 'default');
      await mount(
        page,
        '<sb-dialog><sb-dialog-content><sb-dialog-title>Rename</sb-dialog-title><sb-input label="First"></sb-input><sb-input label="Second" autofocus></sb-input></sb-dialog-content></sb-dialog>',
      );
      await setOpen(page, true);
      await expect.poll(() => focusPath(page)).toMatch(/^sb-input\[Second\] > input/);
    });

    test('on open, a Command with autofocus gets focus in its search field', async ({ page }) => {
      await go(page, 'search-palette');
      await openWithTrigger(page);
      await expect.poll(() => focusPath(page)).toMatch(/^sb-command-input > input/);
    });

    test('on open, focus goes to the first focusable element without autofocus', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await expect.poll(() => focusPath(page)).toMatch(/^sb-input\[Name\] > input/);
    });

    test('on open, focus goes to the close button when nothing else is focusable', async ({ page }) => {
      await go(page, 'default');
      await mount(page, '<sb-dialog><sb-dialog-content><sb-dialog-header><sb-dialog-title>Saved</sb-dialog-title></sb-dialog-header></sb-dialog-content></sb-dialog>');
      await setOpen(page, true);
      await expect.poll(() => focusPath(page)).toBe('sb-dialog-content > sb-button[close] > button[button]');
    });

    test('on close, focus returns to the trigger control', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await page.keyboard.press('Escape');
      await expect.poll(() => focusPath(page)).toBe('sb-button > button[button]');
      await expect(triggerButton(page)).toBeFocused();
    });

    test('a trigger removed while open: closing raises no error and focus falls to the document', async ({ page }) => {
      await go(page, 'default');
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await openWithTrigger(page);
      await page.locator('sb-dialog-trigger').evaluate((el) => el.remove());
      await page.keyboard.press('Escape');
      await expect.poll(() => isOpen(page)).toBe(false);
      await expect.poll(() => focusPath(page)).toBe('');
      expect(errors).toEqual([]);
    });
  });

  test.describe('keyboard', () => {
    test('Escape closes the dialog', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await page.keyboard.press('Escape');
      await expect.poll(() => modal(page)).toBe(false);
    });

    test('Escape in a Command inside the dialog closes the dialog', async ({ page }) => {
      await go(page, 'search-palette');
      await openWithTrigger(page);
      await page.keyboard.type('cal');
      await page.keyboard.press('Escape');
      await expect.poll(() => isOpen(page)).toBe(false);
    });

    test('Tab and Shift+Tab move among the dialog controls only', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await expect.poll(() => focusPath(page)).toMatch(/^sb-input\[Name\]/);
      const forward: string[] = [];
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab');
        forward.push(await focusPath(page));
      }
      expect(forward.map((p) => p.split(' > ')[0])).toEqual(['sb-input[Username]', 'sb-button', 'sb-button', 'sb-dialog-content']);
      expect(forward[3]).toBe('sb-dialog-content > sb-button[close] > button[button]');
      await page.keyboard.press('Shift+Tab');
      await expect.poll(() => page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('Save changes');
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Shift+Tab');
        expect(await triggerButton(page).evaluate((el) => el.matches(':focus-within'))).toBe(false);
      }
    });
  });

  test.describe('focus wrap', () => {
    test('Tab from the last control wraps to the first, Shift+Tab from the first wraps to the last', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      await expect.poll(() => focusPath(page)).toMatch(/^sb-input\[Name\]/);
      await closeButton(page).focus();
      await page.keyboard.press('Tab');
      await expect.poll(() => focusPath(page)).toMatch(/^sb-input\[Name\]/);
      await page.keyboard.press('Shift+Tab');
      await expect.poll(() => focusPath(page)).toBe('sb-dialog-content > sb-button[close] > button[button]');
    });

    test('with the close button hidden, the last slotted control wraps to the first', async ({ page }) => {
      await go(page, 'default');
      await page.locator('sb-dialog-content').first().evaluate((el) => el.setAttribute('hide-close-button', ''));
      await openWithTrigger(page);
      await expect.poll(() => focusPath(page)).toMatch(/^sb-input\[Name\]/);
      await page.getByRole('button', { name: 'Save changes' }).focus();
      await page.keyboard.press('Tab');
      await expect.poll(() => focusPath(page)).toMatch(/^sb-input\[Name\]/);
    });
  });

  test.describe('light dismiss', () => {
    const backdropClickCloses = async (page: Page) => {
      await page.mouse.click(4, 4);
      await expect.poll(() => isOpen(page)).toBe(false);
    };

    test('a drag from inside the surface released on the backdrop does not close', async ({ page }) => {
      await go(page, 'default');
      const events = await recordHostEvents(page, 'sb-cancel');
      await openWithTrigger(page);
      const box = (await page.locator('sb-dialog-description').boundingBox())!;
      await page.mouse.move(box.x + 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(4, 4, { steps: 4 });
      await page.mouse.up();
      await settle(page);
      expect(await events.evaluate((list) => list.length)).toBe(0);
      expect(await isOpen(page)).toBe(true);
      await backdropClickCloses(page);
    });

    test('a click on the surface padding does not close', async ({ page }) => {
      await go(page, 'default');
      const events = await recordHostEvents(page, 'sb-cancel');
      await openWithTrigger(page);
      const box = (await surface(page).boundingBox())!;
      await page.mouse.click(box.x + 3, box.y + box.height / 2);
      await settle(page);
      expect(await events.evaluate((list) => list.length)).toBe(0);
      expect(await isOpen(page)).toBe(true);
      await backdropClickCloses(page);
    });
  });

  test.describe('accessibility', () => {
    test('the title names the dialog and the description describes it', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      const cdp = await page.context().newCDPSession(page);
      await expect
        .poll(() => axNodes(cdp, 'dialog'))
        .toEqual([{ name: 'Edit profile', description: "Make changes to your profile here. Click save when you're done." }]);
    });

    test('with no title, aria-label on sb-dialog-content names the dialog', async ({ page }) => {
      await go(page, 'search-palette');
      await openWithTrigger(page);
      await expect(page.getByRole('dialog', { name: 'Search documentation' })).toBeVisible();
    });

    test('the title is a level 2 heading', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      // The role comes from ElementInternals, which Playwright's role engine does not read: ask the browser's tree.
      const cdp = await page.context().newCDPSession(page);
      const headings = async () => {
        return (await axTree(cdp))
          .filter((n) => n.role?.value === 'heading')
          .map((n) => ({ name: n.name?.value, level: n.properties?.find((prop) => prop.name === 'level')?.value.value }));
      };
      await expect.poll(headings).toContainEqual({ name: 'Edit profile', level: 2 });
    });

    test('a title or description added after opening is linked again', async ({ page }) => {
      await go(page, 'default');
      await mount(page, '<sb-dialog><sb-dialog-content aria-label="Untitled"><p>Body</p></sb-dialog-content></sb-dialog>');
      await setOpen(page, true);
      await expect(page.getByRole('dialog', { name: 'Untitled' })).toBeVisible();
      await page.locator('#under-test sb-dialog-content').evaluate((el) =>
        el.insertAdjacentHTML('afterbegin', '<sb-dialog-title>Renamed</sb-dialog-title><sb-dialog-description>Now described</sb-dialog-description>'),
      );
      const cdp = await page.context().newCDPSession(page);
      await expect.poll(() => axNodes(cdp, 'dialog')).toEqual([{ name: 'Renamed', description: 'Now described' }]);
    });

    test('without ariaLabelledByElements, the copied title name follows a title text change', async ({ page }) => {
      await page.addInitScript(() => delete (Element.prototype as { ariaLabelledByElements?: unknown }).ariaLabelledByElements);
      await go(page, 'default');
      await openWithTrigger(page);
      await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeVisible();
      await page.locator('sb-dialog-title').first().evaluate((el) => {
        const text = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim()) as Text | undefined;
        if (text) text.data = 'Rename profile';
        else el.textContent = 'Rename profile';
      });
      await expect(page.getByRole('dialog', { name: 'Rename profile' })).toBeVisible();
    });

    test('a dialog with no title and no aria-label warns once in the console', async ({ page }) => {
      await go(page, 'default');
      const warnings: string[] = [];
      page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
      await mount(page, '<sb-dialog><sb-dialog-content><p>Body</p></sb-dialog-content></sb-dialog>');
      await setOpen(page, true);
      await expect.poll(() => warnings.filter((w) => w.includes('<sb-dialog-content>')).length).toBe(1);
      await setOpen(page, false);
      await setOpen(page, true);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      expect(warnings.filter((w) => w.includes('<sb-dialog-content>'))).toHaveLength(1);
    });

    test('screen-reader view: Enter opens the modal dialog, Escape returns to the trigger', async ({ page }) => {
      await go(page, 'default');
      await triggerButton(page).focus();
      await page.keyboard.press('Enter');
      await expect.poll(() => modal(page)).toBe(true);
      await settle(page);
      await expectScreenReaderView(page, 'dialog-open');
      await page.keyboard.press('Escape');
      await expect.poll(() => modal(page)).toBe(false);
      await expect(triggerButton(page)).toBeFocused();
      await settle(page);
      await expectScreenReaderView(page, 'dialog-closed');
    });

    for (const story of ['default', 'open', 'no-close-button', 'form', 'long-content', 'search-palette', 'nested', 'rtl']) {
      test(`has no axe violations: ${story}`, async ({ page }) => {
        await go(page, story);
        if (story === 'open') {
          await expect.poll(() => modal(page)).toBe(true);
        } else {
          // RTL opens in markup: close it so the trigger path is the one checked.
          await host(page).evaluate((el) => ((el as Host).open = false));
          await expect.poll(() => modal(page)).toBe(false);
          await openWithTrigger(page);
        }
        expect(await axeViolations(page, TAG, ['sb-button', 'sb-input', 'sb-command']), story).toEqual([]);
      });
    }

    test('has no axe violations in dark mode', async ({ page }) => {
      await go(page, 'default');
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await openWithTrigger(page);
      expect(await axeViolations(page, TAG, ['sb-button', 'sb-input'])).toEqual([]);
    });
  });

  test.describe('layout', () => {
    test('at 320px wide the surface keeps the viewport margin and scrolls inside', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 480 });
      await go(page, 'long-content');
      await openWithTrigger(page);
      const margin = await tokenPx(host(page), '--sb-dialog-viewport-margin');
      const box = (await surface(page).boundingBox())!;
      // The scroll lock keeps a stable scrollbar gutter: with classic scrollbars (Linux, Windows) it narrows the fixed
      // containing block the modal is sized in, which clientWidth does not report. A fixed probe shares that block.
      const available = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none';
        document.body.append(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return width;
      });
      expect(Math.round(box.x)).toBe(margin);
      expect(Math.round(box.width), `fixed containing block ${available}px, surface at x=${box.x}`).toBe(Math.round(available - 2 * margin));
      expect(box.height).toBeLessThanOrEqual(480 - 2 * margin + 1);
      expect(await surface(page).evaluate((el) => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY)).toBe('auto');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    });

    test('the surface grows to the max width on a wide viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await go(page, 'default');
      await openWithTrigger(page);
      expect(Math.round((await surface(page).boundingBox())!.width)).toBe(Math.round(await tokenPx(host(page), '--sb-dialog-max-width')));
    });

    test('from 40em the header is start-aligned and the footer is a row at the end; below, centered and stacked in DOM order', async ({ page }) => {
      const read = () =>
        page.evaluate(() => ({
          header: getComputedStyle(document.querySelector('sb-dialog-header')!).textAlign,
          footer: getComputedStyle(document.querySelector('sb-dialog-footer')!).flexDirection,
          endGap: (() => {
            const footer = document.querySelector('sb-dialog-footer')!;
            return Math.round(footer.getBoundingClientRect().right - footer.lastElementChild!.getBoundingClientRect().right);
          })(),
        }));
      await page.setViewportSize({ width: 800, height: 600 });
      await go(page, 'default');
      await openWithTrigger(page);
      expect(await read()).toEqual({ header: 'start', footer: 'row', endGap: 0 });
      await page.setViewportSize({ width: 360, height: 600 });
      await expect.poll(read).toEqual({ header: 'center', footer: 'column', endGap: 0 });
      const tops = await page.locator('sb-dialog-footer > *').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
      expect(tops[0]!).toBeLessThan(tops[1]!);
    });

    test('a long title on a narrow screen does not run under the close button', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 600 });
      await go(page, 'default');
      await mount(
        page,
        '<sb-dialog><sb-dialog-content><sb-dialog-header><sb-dialog-title>Delete every archived project in this workspace permanently</sb-dialog-title></sb-dialog-header></sb-dialog-content></sb-dialog>',
      );
      await setOpen(page, true);
      const title = page.locator('#under-test sb-dialog-title');
      const close = page.locator('#under-test sb-dialog-content [part="close"]');
      await expect(close).toBeVisible();
      const t = (await title.boundingBox())!;
      const c = (await close.boundingBox())!;
      const overlaps = t.x < c.x + c.width && c.x < t.x + t.width && t.y < c.y + c.height && c.y < t.y + t.height;
      expect(overlaps).toBe(false);
    });

    test('the close button sits at the inline end and mirrors in RTL', async ({ page }) => {
      await go(page, 'rtl');
      await expect.poll(() => modal(page)).toBe(true);
      // Offset from the padding box, inside the border, as the reference's absolute top-4 end-4.
      const inset = (await tokenPx(host(page), '--sb-dialog-close-inset')) + (await tokenPx(host(page), '--sb-dialog-border-width'));
      const s = (await surface(page).boundingBox())!;
      const c = (await closeButton(page).boundingBox())!;
      expect(Math.round(c.x - s.x)).toBe(inset);
      expect(Math.round(c.y - s.y)).toBe(inset);
    });

    test('forced colors: the surface keeps a visible border', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });
      await go(page, 'default');
      await openWithTrigger(page);
      const border = await surface(page).evaluate((el) => [getComputedStyle(el).borderTopStyle, getComputedStyle(el).borderTopColor]);
      expect(border).toEqual(['solid', await systemColor(page, 'CanvasText')]);
    });
  });

  test.describe('form', () => {
    test('a required field blocks submit; a valid submit reaches FormData, closes and returns focus', async ({ page }) => {
      await go(page, 'form');
      const submitted = await page.evaluateHandle(() => {
        const seen: (string | null)[] = [];
        document.addEventListener('submit', (e) => seen.push(new FormData(e.target as HTMLFormElement).get('project') as string | null));
        return seen;
      });
      await openWithTrigger(page);
      await page.getByRole('button', { name: 'Create' }).click();
      // A blocked submit focuses the invalid field; wait for it so the next click is not raced by that focus move.
      await expect(page.getByRole('textbox', { name: 'Project name' })).toBeFocused();
      expect(await submitted.evaluate((list) => list.length)).toBe(0);
      expect(await isOpen(page)).toBe(true);
      await page.getByRole('textbox', { name: 'Project name' }).fill('Atlas');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect.poll(() => submitted.evaluate((list) => list)).toEqual(['Atlas']);
      await expect.poll(() => isOpen(page)).toBe(false);
      await expect(triggerButton(page)).toBeFocused();
    });
  });

  test.describe('tokens', () => {
    test('the surface and backdrop read their component tokens', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      const s = surface(page);
      const style = await s.evaluate((el) => {
        const c = getComputedStyle(el);
        const b = getComputedStyle(el, '::backdrop');
        return { bg: c.backgroundColor, color: c.color, border: c.borderTopColor, width: c.borderTopWidth, radius: c.borderTopLeftRadius, padding: c.paddingTop, gap: c.rowGap, shadow: c.boxShadow, backdrop: b.backgroundColor };
      });
      const h = host(page);
      expect(style.bg).toBe(await tokenColor(h, '--sb-dialog-bg'));
      expect(style.color).toBe(await tokenColor(h, '--sb-dialog-fg'));
      expect(style.border).toBe(await tokenColor(h, '--sb-dialog-border'));
      expect(style.width).toBe(await tokenLength(h, '--sb-dialog-border-width'));
      expect(style.radius).toBe(await tokenLength(h, '--sb-dialog-radius'));
      expect(style.padding).toBe(await tokenLength(h, '--sb-dialog-padding'));
      expect(style.gap).toBe(await tokenLength(h, '--sb-dialog-gap'));
      expect(style.shadow).not.toBe('none');
      expect(style.backdrop).toBe(await tokenColor(h, '--sb-dialog-backdrop'));
    });

    test('the title and description read their typography tokens', async ({ page }) => {
      await go(page, 'default');
      await openWithTrigger(page);
      const h = host(page);
      const title = await page.locator('sb-dialog-title').evaluate((el) => [getComputedStyle(el).fontSize, Number(getComputedStyle(el).fontWeight)]);
      expect(title).toEqual([await tokenLength(h, '--sb-dialog-title-font-size'), await tokenNumber(h, '--sb-dialog-title-font-weight')]);
      const desc = page.locator('sb-dialog-description');
      expect(await desc.evaluate((el) => getComputedStyle(el).color)).toBe(await tokenColor(h, '--sb-dialog-description-fg'));
      expect(await desc.evaluate((el) => getComputedStyle(el).fontSize)).toBe(await tokenLength(h, '--sb-dialog-description-font-size'));
    });
  });
});
