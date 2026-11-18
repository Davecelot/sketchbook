import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, expectScreenReaderView } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-button';
const inner = (page: Page, nth = 0) => page.locator(TAG).nth(nth).locator('[part="button"]');
const style = (page: Page, prop: string, nth = 0) => inner(page, nth).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
const countClicks = (page: Page) =>
  page.evaluateHandle(() => {
    const c = { n: 0 };
    document.addEventListener('click', (e) => { if ((e.target as Element).localName === 'sb-button') c.n++; });
    return c;
  });

test.describe('Button', () => {
  test('renders a native button named by its label', async ({ page }) => {
    await gotoStory(page, 'components-button--default', TAG);
    await expect(page.getByRole('button', { name: 'Button' })).toBeVisible();
    await expect(inner(page)).toHaveAttribute('type', 'button');
  });

  test('variant and size reflect, and colors come from component tokens', async ({ page }) => {
    await gotoStory(page, 'components-button--variants', TAG);
    const host = page.locator('sb-button[variant="primary"][size="medium"]');
    expect(await host.locator('[part="button"]').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(host, '--sb-button-default-bg'));
    const destructive = page.locator('sb-button[variant="destructive"][size="medium"]');
    expect(await destructive.locator('[part="button"]').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(destructive, '--sb-button-destructive-bg'));
    const outline = page.locator('sb-button[variant="tertiary"][size="medium"]');
    expect(await outline.locator('[part="button"]').evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(await tokenColor(outline, '--sb-button-outline-border'));
  });

  test('sizes match the contract heights; icon sizes are square', async ({ page }) => {
    await gotoStory(page, 'components-button--variants', TAG);
    for (const [size, token] of [['tiny', 'xs'], ['small', 'sm'], ['medium', 'default'], ['large', 'lg'], ['icon-tiny', 'xs'], ['icon-small', 'sm'], ['icon', 'default'], ['icon-large', 'lg']] as const) {
      const host = page.locator(`sb-button[variant="primary"][size="${size}"]`);
      const h = await tokenPx(host, `--sb-button-height-${token}`);
      const box = await host.locator('[part="button"]').boundingBox();
      expect(box?.height, size).toBe(h);
      if (size.startsWith('icon')) expect(box?.width, size).toBe(h);
    }
  });

  test('Enter and Space activate it; the focus ring shows for keyboard focus only', async ({ page }) => {
    await gotoStory(page, 'components-button--default', TAG);
    const clicks = await countClicks(page);
    await inner(page).click();
    expect(await style(page, 'box-shadow')).toBe('none');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await style(page, 'box-shadow')).not.toBe('none');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    expect(await clicks.evaluate((c) => c.n)).toBe(3);
  });

  test('disabled: no clicks, out of the tab order, dimmed', async ({ page }) => {
    await gotoStory(page, 'components-button--disabled', TAG);
    const clicks = await countClicks(page);
    await inner(page).click({ force: true });
    expect(await clicks.evaluate((c) => c.n)).toBe(0);
    await expect(inner(page)).toBeDisabled();
    expect(await style(page, 'opacity')).toBe('0.5');
  });

  test('loading: ignores clicks, stays focusable, announces busy, shows spinner and label', async ({ page }) => {
    await gotoStory(page, 'components-button--loading', TAG);
    const clicks = await countClicks(page);
    // aria-disabled makes Playwright refuse the click; a person can still click it, so force it.
    await inner(page).click({ force: true });
    expect(await clicks.evaluate((c) => c.n)).toBe(0);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(inner(page)).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await clicks.evaluate((c) => c.n)).toBe(0);
    await expect(inner(page)).toHaveAttribute('aria-busy', 'true');
    await expect(inner(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator(TAG).locator('sb-spinner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Saving' })).toBeVisible();
    expect(await style(page, 'opacity')).toBe('0.5');
  });

  test('every variant shows the focus ring on keyboard focus', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, 'components-button--default', TAG);
    await page.evaluate(() => {
      const root = document.querySelector('#storybook-root')!;
      root.innerHTML = ['primary', 'destructive', 'tertiary', 'secondary', 'ghost', 'link'].map((v) => `<sb-button variant="${v}">${v}</sb-button>`).join('');
    });
    const ring = await tokenColor(page.locator(TAG).first(), '--sb-button-focus-ring-color');
    await page.locator(TAG).first().evaluate((el) => (el as HTMLElement).blur());
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await style(page, 'box-shadow', i), `variant #${i}`).toContain(ring);
    }
  });

  test('Enter in a native field submits through the first submit button, once, with its name and value', async ({ page }) => {
    await gotoStory(page, 'components-button--default', TAG);
    const run = (html: string) =>
      page.evaluate(async (markup) => {
        const root = document.querySelector('#storybook-root')!;
        root.innerHTML = `<form id="f">${markup}</form>`;
        const form = root.querySelector('form')!;
        const seen: [string, FormDataEntryValue][][] = [];
        form.addEventListener('submit', (e) => { e.preventDefault(); seen.push([...new FormData(form).entries()]); });
        await customElements.whenDefined('sb-button');
        const field = form.querySelector('input')!;
        field.focus();
        field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, composed: true }));
        return seen;
      }, html);
    expect(await run('<input name="a" value="1"><input name="b" value="2"><sb-button type="submit" name="intent" value="go">Go</sb-button>')).toEqual([[['a', '1'], ['b', '2'], ['intent', 'go']]]);
    expect(await run('<input name="a"><input name="b"><sb-button type="submit" disabled>Go</sb-button>')).toEqual([]);
    expect(await run('<input name="a"><sb-button type="button">Go</sb-button>')).toEqual([]);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { document.querySelector('#storybook-root')!.innerHTML = '<form id="g"><input name="a" value="1"><button>native</button><sb-button type="submit" name="intent" value="go">Go</sb-button></form>'; });
    const native = await page.evaluateHandle(() => {
      const n = { count: 0 };
      document.querySelector('#g')!.addEventListener('submit', (e) => { e.preventDefault(); n.count++; });
      return n;
    });
    await page.locator('#g input').press('Enter');
    expect(await native.evaluate((n) => n.count)).toBe(1);
  });

  test('type=submit submits name and value; type=reset resets; default does not submit', async ({ page }) => {
    await gotoStory(page, 'components-button--in-form', TAG);
    const submitted = await page.evaluateHandle(() => {
      const seen: [string, FormDataEntryValue][][] = [];
      const form = document.querySelector('form#demo') as HTMLFormElement;
      form.addEventListener('submit', (e) => { e.preventDefault(); seen.push([...new FormData(form, e.submitter).entries()]); });
      return seen;
    });
    await page.getByRole('button', { name: 'Plain' }).click();
    expect(await submitted.evaluate((s) => s.length)).toBe(0);
    await page.getByRole('button', { name: 'Save' }).click();
    expect(await submitted.evaluate((s) => s[0])).toEqual([['note', 'draft'], ['intent', 'save']]);
    await page.getByRole('textbox', { name: 'Note' }).fill('changed');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByRole('textbox', { name: 'Note' })).toHaveValue('draft');
    await page.getByRole('button', { name: 'Save' }).click();
    expect(await submitted.evaluate((s) => s.at(-1))).toEqual([['note', 'draft'], ['intent', 'save']]);
  });

  test('href renders a link; disabled keeps it a link without href, marked disabled', async ({ page }) => {
    await gotoStory(page, 'components-button--as-link', TAG);
    const link = page.getByRole('link', { name: 'Read the docs' });
    await expect(link).toHaveAttribute('href', '#docs');
    await page.locator(TAG).evaluate((el) => el.setAttribute('disabled', ''));
    await expect(link).not.toHaveAttribute('href');
    await expect(link).toBeDisabled();
  });

  test('host.click() is ignored while disabled or loading', async ({ page }) => {
    await gotoStory(page, 'components-button--default', TAG);
    const clicks = await countClicks(page);
    await page.locator(TAG).evaluate((el) => { el.setAttribute('loading', ''); (el as HTMLElement).click(); el.removeAttribute('loading'); el.setAttribute('disabled', ''); (el as HTMLElement).click(); });
    expect(await clicks.evaluate((c) => c.n)).toBe(0);
  });

  test('disabled wins over loading: no spinner, not busy', async ({ page }) => {
    await gotoStory(page, 'components-button--loading', TAG);
    await page.locator(TAG).evaluate((el) => el.setAttribute('disabled', ''));
    await expect(page.locator(TAG).locator('sb-spinner')).toHaveCount(0);
    await expect(inner(page)).not.toHaveAttribute('aria-busy', 'true');
    await expect(inner(page)).toBeDisabled();
  });

  test('as a link: disabled and loading are exposed and block navigation', async ({ page }) => {
    await gotoStory(page, 'components-button--as-link', TAG);
    const host = page.locator(TAG);
    await host.evaluate((el) => el.setAttribute('loading', ''));
    await expect(inner(page)).toHaveAttribute('aria-busy', 'true');
    await expect(inner(page)).toHaveAttribute('aria-disabled', 'true');
    await host.evaluate((el) => { el.removeAttribute('loading'); el.setAttribute('disabled', ''); });
    await expect(inner(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(inner(page)).not.toHaveAttribute('href');
  });

  test('icon size is named by the forwarded aria-label', async ({ page }) => {
    await gotoStory(page, 'components-button--icon-only', TAG);
    await expect(page.getByRole('button', { name: 'Add item' })).toBeVisible();
  });

  test('warns once in the console when it has no accessible name', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
    await gotoStory(page, 'components-button--default', TAG);
    await page.evaluate(async () => {
      const b = document.createElement('sb-button');
      b.setAttribute('size', 'icon');
      document.body.append(b);
      await (b as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      // The check runs one frame after the first render, once slotted text has arrived.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    expect(warnings.filter((w) => w.includes('<sb-button> has no accessible name'))).toHaveLength(1);
  });

  test('screen-reader view: a focused button is a named button, and loading is busy', async ({ page }) => {
    await gotoStory(page, 'components-button--default', TAG);
    await page.keyboard.press('Tab');
    await expect(inner(page)).toBeFocused();
    await expectScreenReaderView(page, 'button-focused');
    await gotoStory(page, 'components-button--loading', TAG);
    await page.keyboard.press('Tab');
    await expect(inner(page)).toBeFocused();
    await expect(inner(page)).toHaveAttribute('aria-busy', 'true');
    await expectScreenReaderView(page, 'button-loading');
  });

  test('has no axe violations across variants and sizes', async ({ page }) => {
    await gotoStory(page, 'components-button--variants', TAG);
    expect(await axeViolations(page, TAG, ['sb-spinner'])).toEqual([]);
    await gotoStory(page, 'components-button--loading', TAG);
    expect(await axeViolations(page, TAG, ['sb-spinner'])).toEqual([]);
  });
});

test('href: javascript:, vbscript: and data: URLs are not rendered, other URLs are (SB-0115)', async ({ page }) => {
  await gotoStory(page, 'components-button--default', TAG);
  const urls = ['java\tscript:alert(1)', ' JAVASCRIPT:alert(1)', 'vbscript:msgbox(1)', 'data:text/html,x', 'https://example.com/a', '/docs#b', 'sms:+100'];
  const tags = ['sb-button'];
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
