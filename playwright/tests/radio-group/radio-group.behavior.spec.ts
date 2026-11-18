import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import type { LitHost } from '../../helpers/elements';
import { axeViolations, axTree, expectScreenReaderView, type AXNode } from '../../helpers/a11y';
import { formEntries, mountForm, submitsOnDispatchedEnter, submitsOnEnter } from '../../helpers/forms';
import { gotoStory } from '../../helpers/storybook';
import { pseudo } from '../../helpers/styles';
import { tokenColor, tokenLength, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-radio-group';
const ITEM = 'sb-radio-group-item';
const item = (page: Page, value: string) => page.locator(`${ITEM}[value="${value}"]`);
const control = (page: Page, value: string) => item(page, value).locator('[part="control"]');
const groupValue = (page: Page) => page.locator(TAG).first().evaluate((el: HTMLElement & { value: string | null }) => el.value);
const focusedValue = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('value') ?? null);
const checkedCount = (page: Page) => page.locator(ITEM).evaluateAll((els) => els.filter((e) => e.shadowRoot?.querySelector<HTMLInputElement>('input')?.checked).length);
const recordChanges = (page: Page) =>
  page.evaluateHandle(() => {
    const seen: { value: string; bubbles: boolean; composed: boolean; target: string }[] = [];
    document.addEventListener('change', (e) => {
      if ((e.target as Element).localName === 'sb-radio-group')
        seen.push({ value: (e as CustomEvent<{ value: string }>).detail.value, bubbles: e.bubbles, composed: e.composed, target: (e.target as Element).localName });
    });
    return seen;
  });
const axRadios = async (page: Page) => {
  const cdp = await page.context().newCDPSession(page);
  const nodes = await axTree(cdp);
  const prop = (n: AXNode, name: string) => n.properties?.find((p) => p.name === name)?.value.value;
  return nodes
    .filter((n) => n.role?.value === 'radio')
    .map((n) => ({ name: n.name?.value, checked: prop(n, 'checked') }));
};

test.describe('Radio Group', () => {
  test('accessibility tree: a named radiogroup of labelled radios with set positions', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--preselected', TAG);
    await expect(page.getByRole('radiogroup', { name: 'Spacing' })).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(3);
    await expect(page.getByRole('radio', { name: 'Comfortable', checked: true })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Default', checked: false })).toBeVisible();
    const radios = await axRadios(page);
    expect(radios.map((r) => [r.name, r.checked])).toEqual([['Default', 'false'], ['Comfortable', 'true'], ['Compact', 'false']]);
    const sets = await page.locator(ITEM).evaluateAll((els) => els.map((e) => e.shadowRoot!.querySelector('input')!.getAttribute('aria-posinset') + '/' + e.shadowRoot!.querySelector('input')!.getAttribute('aria-setsize')));
    expect(sets).toEqual(['1/3', '2/3', '3/3']);
  });

  test('click and label click select one at a time and fire one composed change', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--default', TAG);
    const changes = await recordChanges(page);
    await control(page, 'default').click();
    await item(page, 'compact').locator('[part="label"]').click();
    expect(await groupValue(page)).toBe('compact');
    expect(await checkedCount(page)).toBe(1);
    await expect(page.getByRole('radio', { name: 'Compact', checked: true })).toBeVisible();
    await control(page, 'compact').click();
    expect(await changes.jsonValue()).toEqual([
      { value: 'default', bubbles: true, composed: true, target: TAG },
      { value: 'compact', bubbles: true, composed: true, target: TAG },
    ]);
  });

  test('value property selects without a change event; an unknown value selects nothing', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--default', TAG);
    const changes = await recordChanges(page);
    await page.locator(TAG).evaluate((el: HTMLElement & { value: string | null }) => { el.value = 'compact'; });
    await expect(page.getByRole('radio', { name: 'Compact', checked: true })).toBeVisible();
    await page.locator(TAG).evaluate((el: HTMLElement & { value: string | null }) => { el.value = 'nope'; });
    await expect.poll(() => checkedCount(page)).toBe(0);
    expect((await changes.jsonValue()).length).toBe(0);
  });

  test('Tab enters on the first item, Space selects it', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--default', TAG);
    await page.keyboard.press('Tab');
    expect(await focusedValue(page)).toBe('default');
    await page.keyboard.press('Space');
    expect(await groupValue(page)).toBe('default');
  });

  test('Tab enters on the selected item and leaves the group on the next Tab', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--preselected', TAG);
    expect(await page.locator(ITEM).evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex))).toEqual([-1, 0, -1]);
    await page.keyboard.press('Tab');
    expect(await focusedValue(page)).toBe('comfortable');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.localName)).not.toBe(ITEM);
  });

  test('arrows select as they move, wrap, and all four directions work; Home and End jump', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--preselected', TAG);
    const changes = await recordChanges(page);
    await page.keyboard.press('Tab');
    for (const [key, expected] of [['ArrowDown', 'compact'], ['ArrowRight', 'default'], ['ArrowUp', 'compact'], ['ArrowLeft', 'comfortable'], ['End', 'compact'], ['Home', 'default']] as const) {
      await page.keyboard.press(key);
      expect(await focusedValue(page), key).toBe(expected);
      expect(await groupValue(page), key).toBe(expected);
    }
    expect(await checkedCount(page)).toBe(1);
    expect((await changes.jsonValue()).length).toBe(6);
  });

  test('RTL reverses ArrowLeft and ArrowRight', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--rtl', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowLeft');
    expect(await focusedValue(page)).toBe('comfortable');
    await page.keyboard.press('ArrowRight');
    expect(await focusedValue(page)).toBe('default');
  });

  test('a disabled item is skipped and cannot be selected', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--disabled-item', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    expect(await focusedValue(page)).toBe('c');
    await control(page, 'b').click({ force: true });
    expect(await groupValue(page)).toBe('c');
    await expect(control(page, 'b')).toBeDisabled();
    await expect(item(page, 'b')).toHaveCSS('opacity', '1');
    expect(await item(page, 'b').locator('[part="root"]').evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5');
  });

  test('a disabled group disables every radio', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--disabled', TAG);
    for (const v of ['default', 'comfortable', 'compact']) await expect(control(page, v)).toBeDisabled();
    await expect(page.getByRole('radio', { name: 'Default', checked: true })).toBeDisabled();
  });

  test('horizontal orientation lays items out in a row', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--horizontal', TAG);
    const [a, b] = await Promise.all([item(page, 'default').boundingBox(), item(page, 'comfortable').boundingBox()]);
    expect(b!.x).toBeGreaterThan(a!.x);
    expect(Math.abs(b!.y - a!.y)).toBeLessThan(2);
  });

  test('control size, border and dot come from component tokens', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--preselected', TAG);
    const box = await control(page, 'comfortable').boundingBox();
    const size = await tokenPx(item(page, 'comfortable'), '--sb-radio-group-size');
    expect([box?.width, box?.height]).toEqual([size, size]);
    expect(await control(page, 'comfortable').evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(await tokenColor(item(page, 'comfortable'), '--sb-radio-group-border'));
    expect(await pseudo(control(page, 'comfortable'), '::before', 'background-color')).toBe(await tokenColor(item(page, 'comfortable'), '--sb-radio-group-dot'));
    expect(await pseudo(control(page, 'default'), '::before', 'background-color')).toBe('rgba(0, 0, 0, 0)');
  });

  test('in forced colors the checked dot stays visible against the control', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-radio-group--preselected', TAG);
    const fill = await control(page, 'comfortable').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await pseudo(control(page, 'comfortable'), '::before', 'background-color')).not.toBe(fill);
  });

  test('the focus ring shows for keyboard focus only', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--default', TAG);
    const shadow = () => control(page, 'default').evaluate((el) => getComputedStyle(el).boxShadow);
    const resting = await shadow();
    await control(page, 'default').click();
    expect(await shadow()).toBe(resting);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect.poll(shadow).toContain(await tokenLength(item(page, 'default'), '--sb-radio-group-focus-ring-width'));
  });

  test('form: submits name and value, nothing when none selected, reset restores the initial value', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--default', TAG);
    await mountForm(page, `<sb-radio-group name="size" value="m" aria-label="Size"><sb-radio-group-item value="s" label="Small"></sb-radio-group-item><sb-radio-group-item value="m" label="Medium"></sb-radio-group-item><sb-radio-group-item value="l" label="Large"></sb-radio-group-item></sb-radio-group><sb-radio-group name="empty" aria-label="Empty"><sb-radio-group-item value="x" label="X"></sb-radio-group-item></sb-radio-group>`);
    expect(await formEntries(page)).toEqual([['size', 'm']]);
    await page.locator('form#under-test').getByText('Large').click();
    expect(await formEntries(page)).toEqual([['size', 'l']]);
    await page.locator('form#under-test').evaluate((f: HTMLFormElement) => f.reset());
    await expect(page.getByRole('radio', { name: 'Medium', checked: true })).toBeVisible();
    expect(await formEntries(page)).toEqual([['size', 'm']]);
  });

  test('a change listener on the form reads the new value synchronously', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--default', TAG);
    await mountForm(page, `<sb-radio-group name="size" aria-label="Size"><sb-radio-group-item value="s" label="Small"></sb-radio-group-item><sb-radio-group-item value="m" label="Medium"></sb-radio-group-item></sb-radio-group>`);
    const seen = await page.evaluateHandle(() => {
      const out: unknown[] = [];
      const form = document.querySelector<HTMLFormElement>('form#under-test')!;
      form.addEventListener('change', () => out.push([...new FormData(form).entries()]));
      return out;
    });
    await page.getByRole('radio', { name: 'Medium' }).click();
    expect(await seen.jsonValue()).toEqual([[['size', 'm']]]);
  });

  test('<fieldset disabled> disables the group, is not submitted, and re-enabling restores it', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--in-fieldset', TAG);
    await expect(control(page, 'compact')).toBeDisabled();
    await expect(page.locator(TAG)).not.toHaveAttribute('disabled');
    await page.locator('fieldset').evaluate((el: HTMLFieldSetElement) => { el.disabled = false; });
    await expect(control(page, 'compact')).toBeEnabled();
  });

  test('required: valueMissing with a message until one is selected; reportValidity focuses the first radio', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--required', TAG);
    const state = () => page.locator(TAG).evaluate((el: HTMLElement & { validity: ValidityState; validationMessage: string; checkValidity(): boolean }) => ({ missing: el.validity.valueMissing, valid: el.checkValidity(), message: el.validationMessage }));
    const before = await state();
    expect(before.missing).toBe(true);
    expect(before.valid).toBe(false);
    expect(before.message).not.toBe('');
    await expect(page.locator('[role="radiogroup"]')).toHaveAttribute('aria-required', 'true');
    await page.locator(TAG).evaluate((el: HTMLElement & { reportValidity(): boolean }) => el.reportValidity());
    expect(await focusedValue(page)).toBe('default');
    await control(page, 'compact').click();
    expect(await state()).toEqual({ missing: false, valid: true, message: '' });
  });

  test('<label for> pointing at the group focuses its tab stop', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--in-form', TAG);
    await page.locator('#plan-label').click();
    expect(await focusedValue(page)).toBe('pro');
  });

  test('warns once when an item has no label', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
    await gotoStory(page, 'components-radio-group--default', TAG);
    await page.evaluate(async () => {
      const i = document.createElement('sb-radio-group-item');
      i.setAttribute('value', 'z');
      document.querySelector('sb-radio-group')!.append(i);
      await (i as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    expect(warnings.filter((w) => w.includes('<sb-radio-group-item> has no accessible name'))).toHaveLength(1);
  });

  test('Enter on an item submits the form (implicit submission)', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--default', TAG);
    const markup = `<sb-radio-group name="a" value="s" aria-label="Size"><sb-radio-group-item value="s" label="Small"></sb-radio-group-item><sb-radio-group-item value="m" label="Medium"></sb-radio-group-item></sb-radio-group>`;
    expect(await submitsOnEnter(page, markup, 'sb-radio-group-item input')).toBe(1);
  });

  test('Enter on a disabled control does not submit its form', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--default', TAG);
    expect(await submitsOnDispatchedEnter(page, `<sb-radio-group name="a" value="s" aria-label="Size" disabled><sb-radio-group-item value="s" label="Small"></sb-radio-group-item></sb-radio-group>`, 'sb-radio-group-item input')).toBe(0);
  });

  test('screen-reader view: arrows move focus and check the next radio', async ({ page }) => {
    await gotoStory(page, 'components-radio-group--default', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => groupValue(page)).not.toBeNull();
    const first = await groupValue(page);
    await expectScreenReaderView(page, 'radio-group-arrow-down');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => groupValue(page)).not.toBe(first);
    await expectScreenReaderView(page, 'radio-group-arrow-down-again');
  });

  for (const id of ['default', 'preselected', 'horizontal', 'disabled', 'disabled-item', 'in-form']) {
    test(`axe clean: ${id}`, async ({ page }) => {
      await gotoStory(page, `components-radio-group--${id}`, TAG);
      expect(await axeViolations(page, TAG)).toEqual([]);
    });
  }

  test('warns once when the group has no accessible name, and not when aria-label is set', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && m.text().includes('<sb-radio-group> has no accessible name') && warnings.push(m.text()));
    await gotoStory(page, 'components-radio-group--default', 'sb-radio-group');
    await page.evaluate(async () => {
      const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const named = document.createElement('sb-radio-group');
      named.setAttribute('aria-label', 'Named');
      const bare = document.createElement('sb-radio-group') as LitHost;
      document.body.append(named, bare);
      await frames();
      bare.requestUpdate();
      await bare.updateComplete;
      await frames();
    });
    expect(warnings).toHaveLength(1);
  });
});
