import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenLength } from '../../helpers/tokens';

const TAG = 'sb-typography';
const NATIVE: Record<string, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  p: 'p',
  blockquote: 'blockquote',
  list: 'ul',
  'inline-code': 'code',
  lead: 'p',
  large: 'div',
  small: 'small',
  muted: 'p',
};
const kind = (page: Page, name: string) => page.locator(`${TAG}[kind="${name}"]`).first();
const text = (host: Locator) => host.evaluate((el) => el.shadowRoot!.querySelector('[part="text"]')!.localName);
const style = (host: Locator, props: string[]) =>
  host.evaluate(
    (el, names) => {
      const s = getComputedStyle(el.shadowRoot!.querySelector('[part="text"]')!);
      return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
    },
    props,
  );
// The resolved value of tokens, measured on a probe next to the host (a token can be a number or a length).
const resolved = (host: Locator, tokens: Record<string, string>) =>
  host.evaluate((el, map) => {
    const probe = document.createElement('span');
    el.after(probe);
    const out: Record<string, string> = {};
    for (const [prop, token] of Object.entries(map)) {
      probe.style.cssText = `font-size: var(${map['font-size'] ?? '--sb-typography-p-font-size'}); ${prop}: var(${token})`;
      out[prop] = getComputedStyle(probe).getPropertyValue(prop);
    }
    probe.remove();
    return out;
  }, tokens);

test.describe('Typography', () => {
  test('renders the native element for each kind', async ({ page }) => {
    await gotoStory(page, 'components-typography--variants', TAG);
    for (const [name, tag] of Object.entries(NATIVE)) expect(await text(kind(page, name)), name).toBe(tag);
  });

  test('h1-h4 are real headings with their levels', async ({ page }) => {
    await gotoStory(page, 'components-typography--variants', TAG);
    for (const level of [1, 2, 3, 4]) await expect(page.getByRole('heading', { level })).toHaveCount(1);
  });

  test('defaults to p and reflects kind', async ({ page }) => {
    await gotoStory(page, 'components-typography--default', TAG);
    const host = page.locator(TAG);
    await expect(host).toHaveAttribute('kind', 'p');
    expect(await text(host)).toBe('p');
    await expect(page.getByRole('paragraph')).toBeVisible();
  });

  test('changing kind swaps the native element', async ({ page }) => {
    await gotoStory(page, 'components-typography--default', TAG);
    const host = page.locator(TAG);
    await host.evaluate((el) => el.setAttribute('kind', 'h2'));
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    expect(await text(host)).toBe('h2');
  });

  for (const [name, weight] of [['h1', 'display'], ['h2', 'heading'], ['h3', 'heading'], ['h4', 'heading']] as const) {
    test(`${name} takes size, line height and weight from its tokens`, async ({ page }) => {
      await gotoStory(page, 'components-typography--variants', TAG);
      const host = kind(page, name);
      const t = (p: string) => `--sb-typography-${name}-${p}`;
      const actual = await style(host, ['font-size', 'line-height', 'font-weight']);
      const expected = await resolved(host, { 'font-size': t('font-size'), 'line-height': t('line-height'), 'font-weight': t('font-weight') });
      expect(actual, weight).toEqual(expected);
      expect(Number(actual['font-weight'])).toBeGreaterThanOrEqual(600);
    });
  }

  for (const [name, sizeToken, lhToken, weightToken] of [
    ['p', '--sb-typography-p-font-size', '--sb-typography-p-line-height', null],
    ['lead', '--sb-typography-lead-font-size', '--sb-typography-lead-line-height', null],
    ['large', '--sb-typography-large-font-size', '--sb-typography-large-line-height', '--sb-typography-large-font-weight'],
    ['small', '--sb-typography-small-font-size', '--sb-typography-small-line-height', '--sb-typography-small-font-weight'],
    ['muted', '--sb-typography-muted-font-size', '--sb-typography-muted-line-height', null],
    ['inline-code', '--sb-typography-code-font-size', '--sb-typography-code-line-height', '--sb-typography-code-font-weight'],
  ] as const) {
    test(`${name} takes its size and line height from its tokens`, async ({ page }) => {
      await gotoStory(page, 'components-typography--variants', TAG);
      const host = kind(page, name);
      const map: Record<string, string> = { 'font-size': sizeToken, 'line-height': lhToken };
      if (weightToken) map['font-weight'] = weightToken;
      expect(await style(host, Object.keys(map))).toEqual(await resolved(host, map));
    });
  }

  test('inline-code and small are inline, the rest are blocks', async ({ page }) => {
    await gotoStory(page, 'components-typography--default', TAG);
    const displays = await page.evaluate((names) => {
      const box = document.createElement('div');
      const els = names.map((n) => {
        const el = document.createElement('sb-typography');
        el.setAttribute('kind', n);
        el.textContent = 'x';
        return [n, el] as const;
      });
      box.append(...els.map(([, el]) => el));
      document.body.append(box);
      return Object.fromEntries(els.map(([n, el]) => [n, getComputedStyle(el).display]));
    }, Object.keys(NATIVE));
    for (const [name, display] of Object.entries(displays)) {
      expect(display, name).toBe(name === 'inline-code' || name === 'small' ? 'inline' : 'block');
    }
  });

  test('inline-code sits inside a sentence on the same line', async ({ page }) => {
    await gotoStory(page, 'components-typography--article', TAG);
    const code = kind(page, 'inline-code');
    const paragraph = page.locator(`${TAG}[kind="p"]:has(${TAG}[kind="inline-code"])`);
    const [c, p] = [await code.boundingBox(), await paragraph.boundingBox()];
    expect(c!.y).toBeGreaterThanOrEqual(p!.y);
    expect(c!.x).toBeGreaterThan(p!.x);
  });

  test('inline-code is mono on the muted background', async ({ page }) => {
    await gotoStory(page, 'components-typography--inline-code', TAG);
    const host = page.locator(TAG);
    const s = await style(host, ['background-color', 'font-family', 'padding-left', 'padding-top', 'border-top-left-radius']);
    expect(s['background-color']).toBe(await tokenColor(host, '--sb-typography-code-bg'));
    expect(s['font-family']).toBe(await host.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.fontFamily = 'var(--sb-typography-code-font-family)';
      el.after(probe);
      const family = getComputedStyle(probe).fontFamily;
      probe.remove();
      return family;
    }));
    expect(s['padding-left']).toBe(await tokenLength(host, '--sb-typography-code-padding-x'));
    expect(s['padding-top']).toBe(await tokenLength(host, '--sb-typography-code-padding-y'));
    expect(s['border-top-left-radius']).toBe(await tokenLength(host, '--sb-typography-code-radius'));
  });

  test('lead and muted use the muted foreground', async ({ page }) => {
    await gotoStory(page, 'components-typography--variants', TAG);
    for (const name of ['lead', 'muted']) {
      const host = kind(page, name);
      expect((await style(host, ['color'])).color, name).toBe(await tokenColor(host, '--sb-typography-muted-fg'));
    }
    const p = kind(page, 'p');
    expect((await style(p, ['color'])).color).toBe(await tokenColor(p, '--sb-typography-fg'));
  });

  test('top margin applies only when not the first child', async ({ page }) => {
    await gotoStory(page, 'components-typography--article', TAG);
    const margin = (host: Locator) => host.evaluate((el) => getComputedStyle(el).marginTop);
    const token = (host: Locator, name: string) =>
      host.evaluate((el, t) => {
        const probe = document.createElement('span');
        probe.style.marginTop = `var(${t})`;
        el.after(probe);
        const value = getComputedStyle(probe).marginTop;
        probe.remove();
        return value;
      }, name);
    const h1 = kind(page, 'h1');
    expect(await margin(h1)).toBe('0px');
    const p = page.locator(`${TAG}[kind="p"]`).first();
    expect(await margin(p)).toBe(await token(p, '--sb-typography-p-margin-top'));
    const h2 = kind(page, 'h2');
    expect(await margin(h2)).toBe(await token(h2, '--sb-typography-h2-margin-top'));
    const h3 = kind(page, 'h3');
    expect(await margin(h3)).toBe(await token(h3, '--sb-typography-h3-margin-top'));
    const firstH2 = await page.evaluate(() => {
      const box = document.createElement('div');
      box.innerHTML = '<sb-typography kind="h2">First</sb-typography>';
      document.body.append(box);
      return getComputedStyle(box.firstElementChild!).marginTop;
    });
    expect(firstH2).toBe('0px');
  });

  test('h2 has a bottom rule and blockquote a left bar, italic', async ({ page }) => {
    await gotoStory(page, 'components-typography--article', TAG);
    const h2 = await style(kind(page, 'h2'), ['border-bottom-width', 'border-bottom-style', 'padding-bottom']);
    expect(h2['border-bottom-width']).toBe(await tokenLength(kind(page, 'h2'), '--sb-typography-h2-border-width'));
    expect(h2['border-bottom-style']).toBe('solid');
    expect(h2['padding-bottom']).toBe(await tokenLength(kind(page, 'h2'), '--sb-typography-h2-padding-bottom'));
    const quote = await style(kind(page, 'blockquote'), ['border-left-width', 'padding-left', 'font-style']);
    expect(quote).toEqual({
      'border-left-width': await tokenLength(kind(page, 'blockquote'), '--sb-typography-blockquote-border-width'),
      'padding-left': await tokenLength(kind(page, 'blockquote'), '--sb-typography-blockquote-padding-start'),
      'font-style': 'italic',
    });
  });

  test('list items stay list items and show disc markers', async ({ page }) => {
    await gotoStory(page, 'components-typography--article', TAG);
    await expect(page.getByRole('list')).toHaveCount(1);
    await expect(page.getByRole('listitem')).toHaveCount(3);
    const list = await style(kind(page, 'list'), ['list-style-type', 'margin-left', 'padding-left']);
    expect(list).toEqual({ 'list-style-type': 'disc', 'margin-left': await tokenLength(kind(page, 'list'), '--sb-typography-list-margin-start'), 'padding-left': '0px' });
  });

  test('is not focusable', async ({ page }) => {
    await gotoStory(page, 'components-typography--article', TAG);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });

  for (const id of ['components-typography--variants', 'components-typography--article']) {
    test(`has no axe violations (${id})`, async ({ page }) => {
      await gotoStory(page, id, TAG);
      expect(await axeViolations(page, TAG)).toEqual([]);
    });
  }
});
