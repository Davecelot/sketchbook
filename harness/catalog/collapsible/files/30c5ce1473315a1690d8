import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView } from '../../helpers/a11y';
import { recordHostEvents } from '../../helpers/events';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenSeconds } from '../../helpers/tokens';

const TAG = 'sb-collapsible';
const trigger = (page: Page) => page.locator('sb-collapsible-trigger').locator('[part="trigger"]');
const content = (page: Page) => page.locator('sb-collapsible-content');
const style = (page: Page, prop: string) => trigger(page).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test.describe('Collapsible', () => {
  test('the trigger is a native button named by aria-label; aria-expanded follows expanded', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    const button = page.getByRole('button', { name: 'Toggle details' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(await trigger(page).evaluate((el) => el.localName)).toBe('button');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('the content is hidden until opened, then shown', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    await expect(page.getByText('Delivery notes')).toBeHidden();
    await trigger(page).click();
    await expect(page.getByText('Delivery notes')).toBeVisible();
    await trigger(page).click();
    await expect(page.getByText('Delivery notes')).toBeHidden();
  });

  test('expanded reflects and starts the content visible', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--open', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('expanded', '');
    await expect(page.getByText('Delivery notes')).toBeVisible();
    await trigger(page).click();
    await expect(page.locator(TAG)).not.toHaveAttribute('expanded');
  });

  test('Enter and Space toggle from the keyboard', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    await page.keyboard.press('Tab');
    await expect(trigger(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator(TAG)).toHaveAttribute('expanded', '');
    await page.keyboard.press('Space');
    await expect(page.locator(TAG)).not.toHaveAttribute('expanded');
  });

  test('sb-toggle bubbles and is composed, and fires for programmatic changes', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    const events = await recordHostEvents(page, 'sb-toggle');
    await trigger(page).click();
    await page.locator(TAG).evaluate((el) => ((el as HTMLElement & { expanded: boolean }).expanded = false));
    await expect.poll(() => events.evaluate((e) => e.length)).toBe(2);
    expect(await events.evaluate((e) => e[0])).toEqual({ bubbles: true, composed: true, cancelable: false, target: TAG });
  });

  test('disabled: no toggle, native disabled, dimmed', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--disabled', TAG);
    await expect(trigger(page)).toBeDisabled();
    await trigger(page).click({ force: true });
    await expect(page.locator(TAG)).not.toHaveAttribute('expanded');
    expect(await style(page, 'opacity')).toBe('0.5');
  });

  test('aria-controls resolves to the content host across the shadow root (element reflection)', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    const same = await page.evaluate(() => {
      const button = document.querySelector('sb-collapsible-trigger')!.shadowRoot!.querySelector('button') as HTMLButtonElement;
      return button.ariaControlsElements?.[0] === document.querySelector('sb-collapsible-content');
    });
    expect(same).toBe(true);
  });

  test('closed content is out of the tab order', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.localName)).not.toBe('a');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Delivery notes')).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.localName)).toBe('a');
  });

  test('the focus ring shows for keyboard focus only, in the token color', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    await trigger(page).click();
    expect(await style(page, 'box-shadow')).toBe('none');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await style(page, 'box-shadow')).toContain(await tokenColor(page.locator(TAG), '--sb-collapsible-focus-ring-color'));
  });

  test('height animates with the motion token, and not with reduced motion', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    const inner = () => content(page).locator('[part="content"]').evaluate((el) => {
      const s = getComputedStyle(el);
      return { property: s.transitionProperty, duration: s.transitionDuration };
    });
    const animated = await inner();
    expect(animated.property).toContain('grid-template-rows');
    expect(parseFloat(animated.duration)).toBeCloseTo(await tokenSeconds(page.locator(TAG).first(), '--sb-collapsible-transition-duration'), 3);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await inner()).duration).toBe('0s');
  });

  test('an icon-only trigger is named by the forwarded aria-label', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    await page.locator('sb-collapsible-trigger').evaluate((el) => el.setAttribute('aria-label', 'Show more'));
    await expect(page.getByRole('button', { name: 'Show more' })).toBeVisible();
  });

  test('screen-reader view: space expands the content', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    await trigger(page).focus();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expectScreenReaderView(page, 'collapsible-closed');
    await page.keyboard.press('Space');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'More about this order' })).toBeVisible();
    await expectScreenReaderView(page, 'collapsible-open');
  });

  test('has no axe violations, closed or open', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    expect(await axeViolations(page, TAG)).toEqual([]);
    await trigger(page).click();
    expect(await axeViolations(page, TAG)).toEqual([]);
    await gotoStory(page, 'components-collapsible--text-trigger', TAG);
    expect(await axeViolations(page, TAG)).toEqual([]);
  });

  test('content added after the trigger is wired: aria-controls follows', async ({ page }) => {
    await gotoStory(page, 'components-collapsible--default', TAG);
    await page.evaluate(async () => {
      document.body.insertAdjacentHTML('beforeend', '<sb-collapsible id="late"><sb-collapsible-trigger aria-label="More">+</sb-collapsible-trigger></sb-collapsible>');
      await (document.querySelector('#late sb-collapsible-trigger') as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 100)); // the first wiring has settled
      document.querySelector('#late')!.insertAdjacentHTML('beforeend', '<sb-collapsible-content id="late-panel">later</sb-collapsible-content>');
    });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const button = document.querySelector('#late sb-collapsible-trigger')!.shadowRoot!.querySelector('button') as HTMLButtonElement;
          return button.ariaControlsElements?.[0] === document.querySelector('#late-panel');
        }),
      )
      .toBe(true);
  });
});
