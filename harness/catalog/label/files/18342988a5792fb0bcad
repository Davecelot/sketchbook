import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor } from '../../helpers/tokens';

const TAG = 'sb-label';
const mount = (page: Page, markup: string) =>
  page.evaluate(async (inner) => {
    document.querySelector('#under-test')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="under-test">${inner}</div>`);
    await Promise.all([...document.querySelectorAll('#under-test *')].flatMap((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete ?? []));
  }, markup);
const active = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return `${el?.localName}#${el?.id}${el?.shadowRoot?.activeElement ? `>${el.shadowRoot.activeElement.localName}` : ''}`;
  });
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

test.describe('Label', () => {
  test('renders its text in a flex row from component tokens', async ({ page }) => {
    await gotoStory(page, 'components-label--with-icon', TAG);
    const host = page.locator(TAG);
    const s = await host.evaluate((el) => {
      const inner = getComputedStyle(el.shadowRoot!.querySelector('[part="label"]')!);
      return { display: inner.display, size: inner.fontSize, weight: inner.fontWeight, line: inner.lineHeight, color: inner.color, gap: inner.columnGap, select: inner.userSelect };
    });
    expect(s.display).toBe('flex');
    expect(s.size).toBe(await tokenValue(page, '--sb-label-font-size', 'font-size'));
    expect(s.weight).toBe('500');
    expect(s.line).toBe(s.size);
    expect(s.color).toBe(await tokenColor(host, '--sb-label-fg'));
    expect(s.gap).toBe(await tokenValue(page, '--sb-label-gap', 'column-gap'));
    expect(s.select).toBe('none');
  });

  test('clicking a label for a checkbox toggles it and focuses it', async ({ page }) => {
    await gotoStory(page, 'components-label--for-checkbox', TAG);
    await page.locator(TAG).click();
    await expect(page.locator('#terms')).toBeChecked();
    expect(await active(page)).toBe('input#terms');
    await page.locator(TAG).click();
    await expect(page.locator('#terms')).not.toBeChecked();
  });

  test('clicking a label for a text input focuses it', async ({ page }) => {
    await gotoStory(page, 'components-label--for-input', TAG);
    await page.locator(TAG).click();
    expect(await active(page)).toBe('input#email');
  });

  test('a wrapped control is activated', async ({ page }) => {
    await gotoStory(page, 'components-label--wrapping', TAG);
    await page.locator(TAG).click({ position: { x: 100, y: 5 } });
    await expect(page.locator('input')).toBeChecked();
  });

  test('a form-associated sb-* control with a shadow input receives focus', async ({ page }) => {
    await gotoStory(page, 'components-label--default', TAG);
    await mount(page, '<sb-label for="n">Name</sb-label><sb-input id="n" label="Name field"></sb-input>');
    await page.locator('#under-test sb-label').click();
    expect(await active(page)).toBe('sb-input#n>input');
  });

  test('names a native input and keeps the existing aria-labelledby', async ({ page }) => {
    await gotoStory(page, 'components-label--for-input', TAG);
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    const ids = await page.evaluate(() => ({ label: document.querySelector('sb-label')!.id, labelledby: document.querySelector('#email')!.getAttribute('aria-labelledby') }));
    expect(ids.label).not.toBe('');
    expect(ids.labelledby).toBe(ids.label);
    await mount(page, '<span id="hint">Work address</span><sb-label id="own" for="f">Email</sb-label><input id="f" aria-labelledby="hint" />');
    await expect(page.locator('#f')).toHaveAttribute('aria-labelledby', 'hint own');
    await expect(page.getByRole('textbox', { name: 'Work address Email' })).toBeVisible();
  });

  test('a control that appears after the label is still named and clickable', async ({ page }) => {
    await gotoStory(page, 'components-label--default', TAG);
    await mount(page, '<sb-label id="late" for="x">Late</sb-label>');
    await page.evaluate(() => document.querySelector('#under-test')!.insertAdjacentHTML('beforeend', '<input id="x" type="checkbox" />'));
    await page.locator('#under-test sb-label').click();
    await expect(page.locator('#x')).toBeChecked();
    await expect(page.locator('#x')).toHaveAttribute('aria-labelledby', 'late');
  });

  test('retargeting or removing the label cleans up aria-labelledby', async ({ page }) => {
    await gotoStory(page, 'components-label--default', TAG);
    await mount(page, '<sb-label id="l" for="a">A</sb-label><input id="a" /><input id="b" />');
    await expect(page.locator('#a')).toHaveAttribute('aria-labelledby', 'l');
    await page.evaluate(() => document.querySelector('#under-test sb-label')!.setAttribute('for', 'b'));
    await expect(page.locator('#b')).toHaveAttribute('aria-labelledby', 'l');
    await expect(page.locator('#a')).not.toHaveAttribute('aria-labelledby', /.*/);
    await page.evaluate(() => document.querySelector('#under-test sb-label')!.remove());
    await expect(page.locator('#b')).not.toHaveAttribute('aria-labelledby', /.*/);
  });

  test('a role-bearing custom host is named and activated through the label', async ({ page }) => {
    await gotoStory(page, 'components-label--default', TAG);
    await page.evaluate(() => {
      if (customElements.get('test-switch')) return;
      class TestSwitch extends HTMLElement {
        static formAssociated = true;
        connectedCallback() {
          this.setAttribute('role', 'switch');
          this.tabIndex = 0;
          this.setAttribute('aria-checked', 'false');
          this.addEventListener('click', () => this.setAttribute('aria-checked', String(this.getAttribute('aria-checked') !== 'true')));
        }
      }
      customElements.define('test-switch', TestSwitch);
    });
    await mount(page, '<sb-label for="sw">Notifications</sb-label><test-switch id="sw"></test-switch>');
    await expect(page.getByRole('switch', { name: 'Notifications' })).toHaveAttribute('aria-checked', 'false');
    await page.locator('#under-test sb-label').click();
    await expect(page.getByRole('switch', { name: 'Notifications' })).toHaveAttribute('aria-checked', 'true');
    expect(await active(page)).toBe('test-switch#sw');
  });

  test('disabled dims the label and forwards nothing', async ({ page }) => {
    await gotoStory(page, 'components-label--disabled', TAG);
    const host = page.locator(TAG);
    const opacity = await host.evaluate((el) => getComputedStyle(el.shadowRoot!.querySelector('[part="label"]')!).opacity);
    expect(opacity).toBe(await tokenValue(page, '--sb-label-disabled-opacity', 'opacity'));
    await host.click();
    expect(await active(page)).not.toContain('locked');
    await mount(page, '<sb-label for="c" disabled>Off</sb-label><input id="c" type="checkbox" />');
    await page.locator('#under-test sb-label').click();
    await expect(page.locator('#c')).not.toBeChecked();
  });

  test('a disabled control is not activated', async ({ page }) => {
    await gotoStory(page, 'components-label--default', TAG);
    await mount(page, '<sb-label for="d">Locked</sb-label><input id="d" type="checkbox" disabled />');
    await page.locator('#under-test sb-label').click();
    await expect(page.locator('#d')).not.toBeChecked();
  });

  test('a link inside the label keeps its own behavior', async ({ page }) => {
    await gotoStory(page, 'components-label--link-inside', TAG);
    await page.locator('sb-label a').click();
    await expect(page.locator('#policy')).not.toBeChecked();
    await page.locator(TAG).click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#policy')).toBeChecked();
  });

  test('is not focusable', async ({ page }) => {
    await gotoStory(page, 'components-label--default', TAG);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });

  for (const id of ['default', 'for-input', 'for-checkbox', 'wrapping', 'with-icon', 'disabled', 'link-inside']) {
    test(`has no axe violations (${id})`, async ({ page }) => {
      await gotoStory(page, `components-label--${id}`, TAG);
      expect(await axeViolations(page, '#storybook-root')).toEqual([]);
    });
  }
});
