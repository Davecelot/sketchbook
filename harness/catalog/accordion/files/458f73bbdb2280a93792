import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, axNodes, expectScreenReaderView } from '../../helpers/a11y';
import { recordHostEvents } from '../../helpers/events';
import { gotoStory } from '../../helpers/storybook';
import { systemColor } from '../../helpers/styles';
import { tokenColor, tokenSeconds } from '../../helpers/tokens';

const TAG = 'sb-accordion';
const trigger = (page: Page, nth: number) => page.locator('sb-accordion-trigger').nth(nth).locator('[part="trigger"]');
const open = (page: Page) => page.locator(TAG).evaluate((el) => (el as HTMLElement & { value: string }).value);

test.describe('Accordion', () => {
  test('each item is a heading around a native button named by its text', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    await expect(page.getByRole('heading', { name: 'Shipping', level: 3 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Shipping' })).toHaveAttribute('aria-expanded', 'false');
    expect(await trigger(page, 0).evaluate((el) => el.localName)).toBe('button');
  });

  test('without element references, the copied region name follows trigger text changes', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    const label = await page.evaluate(async () => {
      delete (ElementInternals.prototype as Partial<ElementInternals>).ariaLabelledByElements;
      const root = document.querySelector('#storybook-root')!;
      root.innerHTML = '<sb-accordion selection="single" value="a"><sb-accordion-item value="a"><sb-accordion-trigger>First</sb-accordion-trigger><sb-accordion-content>Body</sb-accordion-content></sb-accordion-item></sb-accordion>';
      const content = root.querySelector('sb-accordion-content') as HTMLElement & { updateComplete: Promise<unknown> };
      await content.updateComplete;
      await new Promise((r) => setTimeout(r));
      const before = content.getAttribute('aria-label');
      root.querySelector('sb-accordion-trigger')!.textContent = 'Second';
      await new Promise((r) => setTimeout(r));
      return [before, content.getAttribute('aria-label')];
    });
    expect(label).toEqual(['First', 'Second']);
  });

  test('level sets the heading level', async ({ page }) => {
    await gotoStory(page, 'components-accordion--disabled-item', TAG);
    await expect(page.getByRole('heading', { name: 'Third', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'First', level: 3 })).toBeVisible();
  });

  test('single: opening one closes the others and collapsible closes the open one', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    await trigger(page, 0).click();
    await expect(page.getByText('Orders ship')).toBeVisible();
    await trigger(page, 1).click();
    await expect(page.getByText('Returns are accepted')).toBeVisible();
    await expect(page.getByText('Orders ship')).toBeHidden();
    expect(await open(page)).toBe('item-2');
    await trigger(page, 1).click();
    await expect(page.getByText('Returns are accepted')).toBeHidden();
    expect(await open(page)).toBe('');
  });

  test('single without collapsible: the open item stays open and its trigger is aria-disabled', async ({ page }) => {
    await gotoStory(page, 'components-accordion--not-collapsible', TAG);
    await expect(trigger(page, 0)).toHaveAttribute('aria-disabled', 'true');
    await expect(trigger(page, 1)).not.toHaveAttribute('aria-disabled');
    await trigger(page, 0).click({ force: true });
    await expect(page.getByText('Orders ship')).toBeVisible();
    await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'true');
    await trigger(page, 1).click();
    await expect(trigger(page, 0)).not.toHaveAttribute('aria-disabled');
  });

  test('multiple: several items open and value lists them', async ({ page }) => {
    await gotoStory(page, 'components-accordion--multiple', TAG);
    await expect(page.getByText('Orders ship')).toBeVisible();
    await expect(page.getByText('Coverage lasts')).toBeVisible();
    await trigger(page, 1).click();
    await expect(page.getByText('Returns are accepted')).toBeVisible();
    await expect(page.getByText('Orders ship')).toBeVisible();
    await expect(page.locator(TAG)).toHaveAttribute('value', 'item-1 item-3 item-2');
    await trigger(page, 0).click();
    await expect(page.getByText('Orders ship')).toBeHidden();
  });

  test('change carries the open values, bubbles, is composed, and skips programmatic changes', async ({ page }) => {
    await gotoStory(page, 'components-accordion--multiple', TAG);
    const events = await recordHostEvents(page, 'change');
    const detail = await page.evaluateHandle(() => {
      const seen: string[][] = [];
      document.addEventListener('change', (e) => seen.push((e as CustomEvent<{ value: string[] }>).detail.value));
      return seen;
    });
    await trigger(page, 1).click();
    await page.locator(TAG).evaluate((el) => ((el as HTMLElement & { value: string }).value = 'item-1'));
    await expect.poll(() => events.evaluate((e) => e.length)).toBe(1);
    expect(await events.evaluate((e) => e[0])).toEqual({ bubbles: true, composed: true, cancelable: false, target: TAG });
    expect(await detail.evaluate((d) => d[0])).toEqual(['item-1', 'item-3', 'item-2']);
  });

  test('a slotted checkbox\'s native change reaches the host with another target and no detail', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    const seen = await page.evaluateHandle(() => {
      const root = document.querySelector('#storybook-root')!;
      root.innerHTML = '<sb-accordion value="a"><sb-accordion-item value="a"><sb-accordion-trigger>First</sb-accordion-trigger><sb-accordion-content><label><input type="checkbox"> Gift wrap</label></sb-accordion-content></sb-accordion-item></sb-accordion>';
      const host = root.querySelector('sb-accordion')!;
      const events: { fromHost: boolean; detail: unknown }[] = [];
      host.addEventListener('change', (e) => events.push({ fromHost: e.target === host, detail: (e as CustomEvent).detail ?? null }));
      return events;
    });
    await page.getByRole('checkbox', { name: 'Gift wrap' }).check();
    await expect.poll(() => seen.evaluate((e) => e.length)).toBe(1);
    expect(await seen.evaluate((e) => e[0])).toEqual({ fromHost: false, detail: null });
    expect(await open(page)).toBe('a');
  });

  test('Arrow keys, Home and End move between triggers; every trigger stays in the tab order', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    await page.keyboard.press('Tab');
    await expect(trigger(page, 0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(trigger(page, 1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(trigger(page, 2)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(trigger(page, 0)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(trigger(page, 2)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(trigger(page, 0)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(trigger(page, 1)).toBeFocused();
  });

  test('Enter and Space toggle the focused item', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Space');
    await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'false');
  });

  test('disabled items are skipped by the arrows and out of the tab order', async ({ page }) => {
    await gotoStory(page, 'components-accordion--disabled-item', TAG);
    await expect(trigger(page, 1)).toBeDisabled();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await expect(trigger(page, 2)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(trigger(page, 0)).toBeFocused();
  });

  test('disabled accordion disables every trigger and dims them', async ({ page }) => {
    await gotoStory(page, 'components-accordion--disabled', TAG);
    for (const i of [0, 1, 2]) await expect(trigger(page, i)).toBeDisabled();
    expect(await trigger(page, 0).evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5');
  });

  test('aria-controls reaches the panel and the panel is a region named by its trigger', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    await trigger(page, 0).click();
    const controls = await page.evaluate(() => {
      const button = document.querySelector('sb-accordion-trigger')!.shadowRoot!.querySelector('button') as HTMLButtonElement;
      return button.ariaControlsElements?.[0] === document.querySelector('sb-accordion-content');
    });
    expect(controls).toBe(true);
    const cdp = await page.context().newCDPSession(page);
    await expect.poll(async () => (await axNodes(cdp, 'region')).map((n) => n.name)).toEqual(['Shipping']);
  });

  test('the chevron turns when open', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    const chevron = page.locator('sb-accordion-trigger').first().locator('[part="chevron"]');
    expect(await chevron.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    await trigger(page, 0).click();
    await expect.poll(() => chevron.evaluate((el) => getComputedStyle(el).transform)).toBe('matrix(-1, 0, 0, -1, 0, 0)');
  });

  test('the focus ring shows for keyboard focus only, in the token color', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    await trigger(page, 0).click();
    expect(await trigger(page, 0).evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await trigger(page, 0).evaluate((el) => getComputedStyle(el).boxShadow)).toContain(await tokenColor(page.locator(TAG), '--sb-accordion-focus-ring-color'));
  });

  test('height animates with the motion token, and not with reduced motion', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    const panel = () => page.locator('sb-accordion-content').first().locator('[part="content"]').evaluate((el) => {
      const s = getComputedStyle(el);
      return { property: s.transitionProperty, duration: s.transitionDuration };
    });
    expect((await panel()).property).toContain('grid-template-rows');
    expect(parseFloat((await panel()).duration)).toBeCloseTo(await tokenSeconds(page.locator(TAG).first(), '--sb-accordion-transition-duration'), 3);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await panel()).duration).toBe('0s');
  });

  test('screen-reader view: enter opens an item, arrow and enter move to the next and swap the open panel', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    await trigger(page, 0).focus();
    await page.keyboard.press('Enter');
    await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('sb-accordion-content').nth(0)).toBeVisible();
    await expectScreenReaderView(page, 'accordion-first-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(trigger(page, 1)).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('sb-accordion-content').nth(1)).toBeVisible();
    await expect(page.locator('sb-accordion-content').nth(0)).toBeHidden();
    await expectScreenReaderView(page, 'accordion-second-open');
  });

  test('has no axe violations in the main stories', async ({ page }) => {
    for (const id of ['default', 'multiple', 'disabled-item', 'not-collapsible']) {
      await gotoStory(page, `components-accordion--${id}`, TAG);
      expect(await axeViolations(page, TAG), id).toEqual([]);
    }
    await gotoStory(page, 'components-accordion--default', TAG);
    await trigger(page, 0).click();
    expect(await axeViolations(page, TAG)).toEqual([]);
  });

  test('content or a trigger added later is wired: aria-controls and the region name follow', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    await page.evaluate(async () => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<sb-accordion id="late" selection="multiple" value="a b"><sb-accordion-item value="a"><sb-accordion-trigger>Alpha</sb-accordion-trigger></sb-accordion-item><sb-accordion-item value="b"><sb-accordion-content>bee</sb-accordion-content></sb-accordion-item></sb-accordion>',
      );
      await Promise.all([...document.querySelectorAll('#late *')].flatMap((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete ?? []));
      await new Promise((resolve) => setTimeout(resolve, 100)); // the first wiring has settled
      document.querySelector('#late sb-accordion-item[value="a"]')!.insertAdjacentHTML('beforeend', '<sb-accordion-content id="alpha-panel">alpha text</sb-accordion-content>');
      document.querySelector('#late sb-accordion-item[value="b"]')!.insertAdjacentHTML('afterbegin', '<sb-accordion-trigger>Beta</sb-accordion-trigger>');
    });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const button = document.querySelector('#late sb-accordion-trigger')!.shadowRoot!.querySelector('button') as HTMLButtonElement;
          return button.ariaControlsElements?.[0] === document.querySelector('#alpha-panel');
        }),
      )
      .toBe(true);
    const cdp = await page.context().newCDPSession(page);
    await expect.poll(async () => (await axNodes(cdp, 'region')).map((n) => n.name)).toEqual(expect.arrayContaining(['Alpha', 'Beta']));
  });

  test('level is clamped to 2-6 for the heading', async ({ page }) => {
    await gotoStory(page, 'components-accordion--default', TAG);
    const levels = await page.evaluate(async () => {
      const out: (string | null)[] = [];
      for (const level of ['1', '0', '9', '4', 'abc']) {
        const el = document.createElement('sb-accordion-trigger');
        el.setAttribute('level', level);
        document.body.append(el);
        await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
        out.push(el.shadowRoot!.querySelector('[role="heading"]')!.getAttribute('aria-level'));
        el.remove();
      }
      return out;
    });
    expect(levels).toEqual(['2', '2', '6', '4', '3']);
  });

  test('warns once when an item value contains whitespace', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && m.text().includes('whitespace') && warnings.push(m.text()));
    await gotoStory(page, 'components-accordion--default', TAG);
    await page.evaluate(async () => {
      document.body.insertAdjacentHTML('beforeend', '<sb-accordion><sb-accordion-item value="two words"><sb-accordion-trigger>T</sb-accordion-trigger></sb-accordion-item></sb-accordion>');
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    expect(warnings).toHaveLength(1);
  });

  test('forced colors: the chevron takes the button text system color', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-accordion--default', TAG);
    const chevron = await page.locator('sb-accordion-trigger').first().evaluate((el) => getComputedStyle(el.shadowRoot!.querySelector('[part="chevron"]')!).color);
    expect(chevron).toBe(await systemColor(page, 'ButtonText'));
  });
});
