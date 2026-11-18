import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenLength, tokenNumber, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-empty';
const TAGS = [TAG, 'sb-empty-header', 'sb-empty-media', 'sb-empty-title', 'sb-empty-description', 'sb-empty-content'];

const css = (page: Page, selector: string, props: string[]) =>
  page.locator(selector).first().evaluate((el, names) => {
    const s = getComputedStyle(el);
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
  }, props);

test.describe('Empty', () => {
  test('registers every element of the family', async ({ page }) => {
    await gotoStory(page, 'components-empty--default', TAG);
    for (const tag of TAGS) expect(await page.evaluate((t) => !!customElements.get(t), tag)).toBe(true);
  });

  test('is a centered column with the large padding from 768px wide and the regular padding below', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await gotoStory(page, 'components-empty--default', TAG);
    expect(await css(page, TAG, ['display', 'flex-direction', 'align-items', 'justify-content', 'row-gap', 'padding-top', 'text-align', 'border-top-left-radius'])).toEqual({
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'justify-content': 'center',
      'row-gap': await tokenLength(page.locator(TAG).first(), '--sb-empty-gap'),
      'padding-top': await tokenLength(page.locator(TAG).first(), '--sb-empty-padding-lg'),
      'text-align': 'center',
      'border-top-left-radius': await tokenLength(page.locator(TAG).first(), '--sb-empty-radius'),
    });
    await page.setViewportSize({ width: 600, height: 700 });
    expect((await css(page, TAG, ['padding-top']))['padding-top']).toBe(await tokenLength(page.locator(TAG).first(), '--sb-empty-padding'));
  });

  test('balances text wrapping', async ({ page }) => {
    await gotoStory(page, 'components-empty--default', TAG);
    expect((await css(page, TAG, ['text-wrap-style']))['text-wrap-style']).toBe('balance');
  });

  test('header and content are at most 48ch wide and centered', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 700 });
    await gotoStory(page, 'components-empty--default', TAG);
    const host = page.locator(TAG);
    const [hostBox, header, content] = await Promise.all([page.locator(TAG), page.locator('sb-empty-header'), page.locator('sb-empty-content')].map((l) => l.boundingBox()));
    const ch = await page.locator('sb-empty-header').evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;width:48ch';
      el.after(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    });
    expect(header!.width).toBeLessThanOrEqual(ch + 1);
    expect(content!.width).toBeLessThanOrEqual(ch + 1);
    expect(Math.abs(header!.x + header!.width / 2 - (hostBox!.x + hostBox!.width / 2))).toBeLessThanOrEqual(1);
    expect(await css(page, 'sb-empty-header', ['row-gap', 'align-items'])).toEqual({ 'row-gap': await tokenLength(host, '--sb-empty-header-gap'), 'align-items': 'center' });
    expect(await css(page, 'sb-empty-content', ['row-gap', 'font-size'])).toEqual({ 'row-gap': await tokenLength(host, '--sb-empty-content-gap'), 'font-size': await tokenLength(host, '--sb-empty-content-font-size') });
  });

  test('icon media is a muted rounded square with the media size and an svg at the icon size', async ({ page }) => {
    await gotoStory(page, 'components-empty--default', TAG);
    const media = page.locator('sb-empty-media');
    await expect(media).toHaveAttribute('variant', 'icon');
    const square = await tokenPx(media, '--sb-empty-media-icon-size');
    const svg = await tokenPx(media, '--sb-empty-media-icon-svg-size');
    expect(await media.boundingBox()).toMatchObject({ width: square, height: square });
    expect(await page.locator('sb-empty-media svg').boundingBox()).toMatchObject({ width: svg, height: svg });
    expect(await css(page, 'sb-empty-media', ['border-top-left-radius', 'margin-bottom', 'background-color'])).toEqual({
      'border-top-left-radius': await tokenLength(media, '--sb-empty-media-icon-radius'),
      'margin-bottom': await tokenLength(media, '--sb-empty-media-margin-bottom'),
      'background-color': await tokenColor(media, '--sb-color-muted'),
    });
  });

  test('primary media has no box and variant reflects', async ({ page }) => {
    await gotoStory(page, 'components-empty--default-media', TAG);
    const media = page.locator('sb-empty-media');
    await expect(media).toHaveAttribute('variant', 'primary');
    expect((await css(page, 'sb-empty-media', ['background-color']))['background-color']).toBe('rgba(0, 0, 0, 0)');
    expect((await media.boundingBox())!.width).not.toBe(await tokenPx(media, '--sb-empty-media-icon-size'));
    await media.evaluate((el) => ((el as HTMLElement & { variant: string }).variant = 'icon'));
    await expect(media).toHaveAttribute('variant', 'icon');
    const square = await tokenPx(media, '--sb-empty-media-icon-size');
    expect(await media.boundingBox()).toMatchObject({ width: square, height: square });
  });

  for (const mode of ['light', 'dark']) {
    test(`title and description typography and color in ${mode} mode`, async ({ page }) => {
      await gotoStory(page, 'components-empty--default', TAG);
      await page.evaluate((m) => document.documentElement.setAttribute('data-theme', m), mode);
      expect(await css(page, 'sb-empty-title', ['font-size', 'font-weight'])).toEqual({
        'font-size': await tokenLength(page.locator(TAG), '--sb-empty-title-font-size'),
        'font-weight': String(await tokenNumber(page.locator(TAG), '--sb-empty-title-font-weight')),
      });
      const description = await css(page, 'sb-empty-description', ['font-size', 'color']);
      expect(description['font-size']).toBe(await tokenLength(page.locator(TAG), '--sb-empty-description-font-size'));
      expect(description.color).toBe(await tokenColor(page.locator(TAG), '--sb-color-muted-foreground'));
      expect((await css(page, 'sb-empty-media', ['color']))['color']).toBe(await tokenColor(page.locator(TAG), '--sb-color-foreground'));
    });
  }

  test('links in the description are underlined and turn primary on hover', async ({ page }) => {
    await gotoStory(page, 'components-empty--default-media', TAG);
    const link = page.getByRole('link', { name: 'Clear filters' });
    expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('underline');
    expect(await link.evaluate((el) => getComputedStyle(el).textUnderlineOffset)).toBe(await tokenLength(link, '--sb-empty-description-link-underline-offset'));
    await link.hover();
    expect(await link.evaluate((el) => getComputedStyle(el).color)).toBe(await tokenColor(page.locator('sb-empty-description'), '--sb-color-primary'));
  });

  test('adds no roles or ARIA to any element', async ({ page }) => {
    await gotoStory(page, 'components-empty--default', TAG);
    const found = await page.evaluate((tags) => tags.flatMap((t) => [...document.querySelectorAll(t)].flatMap((el) => el.getAttributeNames().filter((a) => a === 'role' || a.startsWith('aria-')))), TAGS);
    expect(found).toEqual([]);
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'outline', 'default-media', 'title-only']) {
      await gotoStory(page, `components-empty--${id}`, TAG);
      expect(await axeViolations(page, TAG, ['sb-button'])).toEqual([]);
    }
  });
});
