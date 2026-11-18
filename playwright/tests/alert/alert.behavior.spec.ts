import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, axNodes } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenLength, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-alert';
const TAGS = [TAG, 'sb-alert-title', 'sb-alert-description', 'sb-alert-action'];

const css = (page: Page, selector: string, props: string[]) =>
  page.locator(selector).first().evaluate((el, names) => {
    const s = getComputedStyle(el);
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
  }, props);

const alertPx = <T extends string[]>(page: Page, tokens: [...T]) =>
  Promise.all(tokens.map((t) => tokenPx(page.locator(TAG).first(), t))) as Promise<{ [K in keyof T]: number }>;

test.describe('Alert', () => {
  test('registers every element of the family', async ({ page }) => {
    await gotoStory(page, 'components-alert--default', TAG);
    for (const tag of TAGS) expect(await page.evaluate((t) => !!customElements.get(t), tag)).toBe(true);
  });

  test('neutral feedback is a polite status, danger an assertive alert', async ({ page }) => {
    await gotoStory(page, 'components-alert--default', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('role', 'status');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await gotoStory(page, 'components-alert--danger', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('role', 'alert');
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('the live region exists before its content: an empty alert already has its role', async ({ page }) => {
    await gotoStory(page, 'components-alert--default', TAG);
    const cdp = await page.context().newCDPSession(page);
    const seen = await page.evaluate(async () => {
      const el = document.createElement('sb-alert');
      document.body.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      const before = el.getAttribute('role');
      el.textContent = 'Saved';
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      return { before, after: el.getAttribute('role') };
    });
    expect(seen).toEqual({ before: 'status', after: 'status' });
    expect((await axNodes(cdp, 'status')).length).toBeGreaterThan(1);
  });

  test('role is set before the first render and never flickers', async ({ page }) => {
    await gotoStory(page, 'components-alert--default', TAG);
    const roles = await page.evaluate(async () => {
      const seen: (string | null)[] = [];
      const el = document.createElement('sb-alert');
      el.setAttribute('feedback', 'danger');
      new MutationObserver(() => seen.push(el.getAttribute('role'))).observe(el, { attributes: true, attributeFilter: ['role'] });
      document.body.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      return seen;
    });
    expect(roles).toEqual(['alert']);
  });

  test('the role follows feedback changes, and an authored role is kept', async ({ page }) => {
    await gotoStory(page, 'components-alert--default', TAG);
    const host = page.locator(TAG);
    await host.evaluate((el) => el.setAttribute('feedback', 'danger'));
    await expect(host).toHaveAttribute('role', 'alert');
    await host.evaluate((el) => el.setAttribute('feedback', 'neutral'));
    await expect(host).toHaveAttribute('role', 'status');
    const authored = await page.evaluate(async () => {
      const el = document.createElement('sb-alert');
      el.setAttribute('role', 'note');
      el.setAttribute('feedback', 'danger');
      document.body.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      el.setAttribute('feedback', 'neutral');
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      return el.getAttribute('role');
    });
    expect(authored).toBe('note');
  });

  test('is a bordered callout with token radius and padding', async ({ page }) => {
    await gotoStory(page, 'components-alert--default', TAG);
    expect(await css(page, TAG, ['border-top-width', 'border-top-left-radius', 'padding-top', 'padding-left', 'font-size', 'display'])).toEqual({
      'border-top-width': await tokenLength(page.locator(TAG).first(), '--sb-alert-border-width'),
      'border-top-left-radius': await tokenLength(page.locator(TAG).first(), '--sb-alert-radius'),
      'padding-top': await tokenLength(page.locator(TAG).first(), '--sb-alert-padding-y'),
      'padding-left': await tokenLength(page.locator(TAG).first(), '--sb-alert-padding-x'),
      'font-size': await tokenLength(page.locator(TAG).first(), '--sb-alert-font-size'),
      display: 'grid',
    });
  });

  test('with an icon the text starts after the icon and the column gap, aligned with the title', async ({ page }) => {
    await gotoStory(page, 'components-alert--default', TAG);
    const [host, icon, title, description] = await Promise.all(
      [page.locator(TAG), page.locator('svg[slot="icon"]'), page.locator('sb-alert-title'), page.locator('sb-alert-description')].map((l) => l.boundingBox()),
    );
    const [border, padX, iconSize, gap] = await alertPx(page, ['--sb-alert-border-width', '--sb-alert-padding-x', '--sb-alert-icon-size', '--sb-alert-column-gap']);
    expect(icon).toMatchObject({ width: iconSize, height: iconSize });
    expect(Math.abs(icon!.x - (host!.x + border + padX))).toBeLessThanOrEqual(1);
    expect(Math.abs(title!.x - (icon!.x + iconSize + gap))).toBeLessThanOrEqual(1);
    expect(Math.abs(description!.x - title!.x)).toBeLessThanOrEqual(1);
    expect(description!.y).toBeGreaterThan(title!.y);
  });

  test('without an icon the text starts at the padding edge', async ({ page }) => {
    await gotoStory(page, 'components-alert--without-icon', TAG);
    const [host, title] = await Promise.all([page.locator(TAG).boundingBox(), page.locator('sb-alert-title').boundingBox()]);
    const [border, padX] = await alertPx(page, ['--sb-alert-border-width', '--sb-alert-padding-x']);
    expect(Math.abs(title!.x - (host!.x + border + padX))).toBeLessThanOrEqual(1);
  });

  test('an action sits at the end of the alert, spanning title and description', async ({ page }) => {
    await gotoStory(page, 'components-alert--with-action', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('data-has-action', '');
    const [host, title, description, action] = await Promise.all(
      [page.locator(TAG), page.locator('sb-alert-title'), page.locator('sb-alert-description'), page.locator('sb-alert-action')].map((l) => l.boundingBox()),
    );
    const [border, padX] = await alertPx(page, ['--sb-alert-border-width', '--sb-alert-padding-x']);
    expect(Math.abs(host!.x + host!.width - border - padX - (action!.x + action!.width))).toBeLessThanOrEqual(1);
    expect(title!.x + title!.width).toBeLessThanOrEqual(action!.x + 1);
    expect(action!.y).toBeLessThanOrEqual(title!.y + 1);
    expect(action!.y + action!.height).toBeGreaterThan(description!.y);
  });

  test('an action without an icon leaves no empty icon column: the title still starts at the padding edge', async ({ page }) => {
    await gotoStory(page, 'components-alert--with-action-no-icon', TAG);
    await expect(page.locator(TAG)).toHaveAttribute('data-has-action', '');
    await expect(page.locator(TAG)).not.toHaveAttribute('data-has-icon', /.*/);
    const [host, title, action] = await Promise.all([page.locator(TAG), page.locator('sb-alert-title'), page.locator('sb-alert-action')].map((l) => l.boundingBox()));
    const [border, padX] = await alertPx(page, ['--sb-alert-border-width', '--sb-alert-padding-x']);
    expect(Math.abs(title!.x - (host!.x + border + padX))).toBeLessThanOrEqual(1);
    expect(title!.x + title!.width).toBeLessThanOrEqual(action!.x + 1);
  });

  test('data-has-icon and data-has-action follow slotted content', async ({ page }) => {
    await gotoStory(page, 'components-alert--without-icon', TAG);
    const host = page.locator(TAG);
    await expect(host).not.toHaveAttribute('data-has-icon', /.*/);
    await host.evaluate((el) => el.insertAdjacentHTML('afterbegin', '<svg slot="icon" viewBox="0 0 24 24"></svg>'));
    await expect(host).toHaveAttribute('data-has-icon', '');
    await host.evaluate((el) => el.querySelector('[slot="icon"]')!.remove());
    await expect(host).not.toHaveAttribute('data-has-icon', /.*/);
  });

  for (const mode of ['light', 'dark']) {
    test(`uses feedback colors in ${mode} mode`, async ({ page }) => {
      await gotoStory(page, 'components-alert--variants', TAG);
      await page.evaluate((m) => document.documentElement.setAttribute('data-theme', m), mode);
      const [plain, danger] = [page.locator(`${TAG}[feedback="neutral"]`), page.locator(`${TAG}[feedback="danger"]`)];
      const color = (l: typeof plain, sel: string) => l.locator(sel).first().evaluate((el) => getComputedStyle(el).color);
      expect(await color(plain, ':scope')).toBe(await tokenColor(plain, '--sb-color-card-foreground'));
      expect(await color(plain, 'sb-alert-description')).toBe(await tokenColor(plain, '--sb-color-muted-foreground'));
      expect(await color(danger, ':scope')).toBe(await tokenColor(plain, '--sb-color-destructive'));
      expect(await color(danger, 'sb-alert-description')).toBe(await tokenColor(plain, '--sb-color-destructive'));
      expect(await plain.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(plain, '--sb-color-card'));
    });
  }

  test('the title is medium weight and is never truncated', async ({ page }) => {
    await gotoStory(page, 'components-alert--default', TAG);
    await page.locator('sb-alert-title').evaluate((el) => (el.textContent = 'A very long title that would not fit on one line of a narrow alert at all, so it wraps'));
    expect(await css(page, 'sb-alert-title', ['font-weight', 'text-overflow', 'white-space'])).toEqual({ 'font-weight': '500', 'text-overflow': 'clip', 'white-space': 'normal' });
    expect((await page.locator('sb-alert-title').boundingBox())!.height).toBeGreaterThan(25);
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'danger', 'without-icon', 'with-action', 'with-action-no-icon', 'title-only', 'variants']) {
      await gotoStory(page, `components-alert--${id}`, TAG);
      expect(await axeViolations(page, TAG, ['sb-button'])).toEqual([]);
    }
  });
});
