import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenLength, tokenLineHeight, tokenNumber, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-card';
const TAGS = [TAG, 'sb-card-header', 'sb-card-title', 'sb-card-description', 'sb-card-action', 'sb-card-content', 'sb-card-footer'];

const style = (page: Page, selector: string, props: string[]) =>
  page.locator(selector).first().evaluate((el, names) => {
    const s = getComputedStyle(el);
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
  }, props);

test.describe('Card', () => {
  test('registers every element of the family', async ({ page }) => {
    await gotoStory(page, 'components-card--default', TAG);
    for (const tag of TAGS) expect(await page.evaluate((t) => !!customElements.get(t), tag)).toBe(true);
  });

  test('is a bordered surface with token radius, padding and gap', async ({ page }) => {
    await gotoStory(page, 'components-card--default', TAG);
    expect(await style(page, TAG, ['border-top-width', 'border-top-left-radius', 'padding-top', 'padding-bottom', 'row-gap', 'display', 'flex-direction'])).toEqual({
      'border-top-width': await tokenLength(page.locator(TAG).first(), '--sb-card-border-width'),
      'border-top-left-radius': await tokenLength(page.locator(TAG).first(), '--sb-card-radius'),
      'padding-top': await tokenLength(page.locator(TAG).first(), '--sb-card-padding'),
      'padding-bottom': await tokenLength(page.locator(TAG).first(), '--sb-card-padding'),
      'row-gap': await tokenLength(page.locator(TAG).first(), '--sb-card-gap'),
      display: 'flex',
      'flex-direction': 'column',
    });
  });

  test('size reflects and small tightens padding, gap and the inset of every part', async ({ page }) => {
    await gotoStory(page, 'components-card--small', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('size', 'small');
    const small = await tokenLength(page.locator(TAG), '--sb-card-padding-sm');
    expect(await style(page, TAG, ['padding-top', 'row-gap'])).toEqual({ 'padding-top': small, 'row-gap': await tokenLength(page.locator(TAG), '--sb-card-gap-sm') });
    for (const part of ['sb-card-header', 'sb-card-content', 'sb-card-footer']) expect((await style(page, part, ['padding-left']))['padding-left']).toBe(small);
    await page.locator(TAG).evaluate((el) => ((el as HTMLElement & { size: string }).size = 'medium'));
    await expect(page.locator(TAG)).toHaveAttribute('size', 'medium');
    const regular = await tokenLength(page.locator(TAG), '--sb-card-padding');
    for (const part of ['sb-card-header', 'sb-card-content', 'sb-card-footer']) expect((await style(page, part, ['padding-left']))['padding-left']).toBe(regular);
  });

  test('parts inset by the default padding outside a card', async ({ page }) => {
    await gotoStory(page, 'components-card--default', TAG);
    const padding = await page.evaluate(() => {
      const el = document.createElement('sb-card-content');
      document.body.append(el);
      return getComputedStyle(el).paddingLeft;
    });
    expect(padding).toBe(await tokenLength(page.locator(TAG), '--sb-card-padding'));
  });

  for (const mode of ['light', 'dark']) {
    test(`uses the card colors in ${mode} mode`, async ({ page }) => {
      await gotoStory(page, 'components-card--default', TAG);
      await page.evaluate((m) => document.documentElement.setAttribute('data-theme', m), mode);
      const host = page.locator(TAG);
      expect((await style(page, TAG, ['background-color']))['background-color']).toBe(await tokenColor(host, '--sb-color-card'));
      expect((await style(page, TAG, ['color']))['color']).toBe(await tokenColor(host, '--sb-color-card-foreground'));
      expect((await style(page, TAG, ['border-top-color']))['border-top-color']).toBe(await tokenColor(host, '--sb-color-border'));
      expect((await style(page, 'sb-card-description', ['color']))['color']).toBe(await tokenColor(host, '--sb-color-muted-foreground'));
    });
  }

  test('title and description take their token type', async ({ page }) => {
    await gotoStory(page, 'components-card--default', TAG);
    const title = page.locator('sb-card-title').first();
    expect(await style(page, 'sb-card-title', ['font-size', 'font-weight', 'line-height'])).toEqual({
      'font-size': await tokenLength(title, '--sb-card-title-font-size'),
      'font-weight': String(await tokenNumber(title, '--sb-card-title-font-weight')),
      'line-height': await tokenLineHeight(title, '--sb-card-title-line-height', '--sb-card-title-font-size'),
    });
    expect((await style(page, 'sb-card-description', ['font-size']))['font-size']).toBe(await tokenLength(title, '--sb-card-description-font-size'));
  });

  test('header without an action has no data-has-action and keeps one column', async ({ page }) => {
    await gotoStory(page, 'components-card--default', TAG);
    await expect(page.locator('sb-card-header')).not.toHaveAttribute('data-has-action', /.*/);
  });

  test('header with an action puts it at the end, spanning both rows', async ({ page }) => {
    await gotoStory(page, 'components-card--with-action', TAG);
    const header = page.locator('sb-card-header');
    await expect(header).toHaveAttribute('data-has-action', '');
    const [h, title, description, action] = await Promise.all(
      [header, page.locator('sb-card-title'), page.locator('sb-card-description'), page.locator('sb-card-action')].map((l) => l.boundingBox()),
    );
    const inset = await tokenPx(header, '--sb-card-padding');
    expect(Math.abs(title!.x - h!.x - inset)).toBeLessThanOrEqual(1);
    expect(Math.abs(h!.x + h!.width - inset - (action!.x + action!.width))).toBeLessThanOrEqual(1);
    expect(action!.y).toBeLessThanOrEqual(title!.y + 1);
    // Its own height depends on the control size, so spanning is read from the grid placement: a row-gap bigger than the action would otherwise end above the description.
    expect(await page.locator('sb-card-action').evaluate((el) => getComputedStyle(el).gridRowEnd)).toBe('span 2');
    expect(description!.y).toBeGreaterThan(title!.y);
    expect(title!.x + title!.width).toBeLessThanOrEqual(action!.x + 1);
  });

  test('data-has-action follows an action added and removed later', async ({ page }) => {
    await gotoStory(page, 'components-card--default', TAG);
    const header = page.locator('sb-card-header');
    await header.evaluate((el) => el.append(document.createElement('sb-card-action')));
    await expect(header).toHaveAttribute('data-has-action', '');
    await header.evaluate((el) => el.querySelector('sb-card-action')!.remove());
    await expect(header).not.toHaveAttribute('data-has-action', /.*/);
  });

  test('adds no roles or ARIA to any part', async ({ page }) => {
    await gotoStory(page, 'components-card--with-action', TAG);
    const found = await page.evaluate((tags) => tags.flatMap((t) => [...document.querySelectorAll(t)].flatMap((el) => el.getAttributeNames().filter((a) => a === 'role' || a.startsWith('aria-')))), TAGS);
    expect(found).toEqual([]);
  });

  test('renders content in reading order', async ({ page }) => {
    await gotoStory(page, 'components-card--with-action', TAG);
    expect(await page.locator(TAG).innerText()).toBe('Weekly summary\nActivity from the last seven days.\nRefresh\nTotals and trends appear here.\nView report');
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['components-card--default', 'components-card--with-action', 'components-card--small', 'components-card--content-only']) {
      await gotoStory(page, id, TAG);
      expect(await axeViolations(page, TAG, ['sb-button'])).toEqual([]);
    }
  });
});
