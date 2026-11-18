import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { axeViolations, axNodes } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenLength, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-avatar';
const TAGS = [TAG, 'sb-avatar-image', 'sb-avatar-fallback', 'sb-avatar-badge', 'sb-avatar-group', 'sb-avatar-group-count'];
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const css = (page: Page, selector: string, props: string[]) =>
  page.locator(selector).first().evaluate((el, names) => {
    const s = getComputedStyle(el);
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]));
  }, props);

const mount = (page: Page, src: string) =>
  page.evaluate(async (source) => {
    document.querySelector('#under-test')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<sb-avatar id="under-test"><sb-avatar-image src="${source}" alt="Pat Example"></sb-avatar-image><sb-avatar-fallback>PE</sb-avatar-fallback></sb-avatar>`);
    const el = document.querySelector('#under-test')!;
    await Promise.all([...el.children].map((c) => (c as unknown as { updateComplete: Promise<unknown> }).updateComplete));
  }, src);

test.describe('Avatar', () => {
  test('registers every element of the family', async ({ page }) => {
    await gotoStory(page, 'components-avatar--default', TAG);
    for (const tag of TAGS) expect(await page.evaluate((t) => !!customElements.get(t), tag)).toBe(true);
  });

  test('is a circle at the media size token, smaller at small and larger at large, and size reflects', async ({ page }) => {
    await gotoStory(page, 'components-avatar--sizes', TAG);
    for (const [size, token] of [['medium', '--sb-avatar-size'], ['small', '--sb-avatar-size-sm'], ['large', '--sb-avatar-size-lg']] as const) {
      const host = page.locator(`${TAG}[size="${size}"]`).first();
      const px = await tokenPx(host, token);
      expect(await host.boundingBox()).toMatchObject({ width: px, height: px });
      expect((await css(page, `${TAG}[size="${size}"]`, ['border-top-left-radius']))['border-top-left-radius']).toBe(await tokenLength(host, '--sb-avatar-radius'));
    }
    const host = page.locator(TAG).first();
    await host.evaluate((el) => ((el as HTMLElement & { size: string }).size = 'large'));
    await expect(host).toHaveAttribute('size', 'large');
    expect(await host.boundingBox()).toMatchObject({ width: await tokenPx(host, '--sb-avatar-size-lg') });
  });

  test('shows the image and hides the fallback once loaded', async ({ page }) => {
    await gotoStory(page, 'components-avatar--default', TAG);
    await expect(page.locator(TAG).first()).toHaveAttribute('data-image-status', 'loaded');
    await expect(page.locator('sb-avatar-fallback').first()).toBeHidden();
    await expect(page.locator('sb-avatar-image').first().locator('img')).toBeVisible();
  });

  test('keeps the fallback visible until a slow image arrives', async ({ page }) => {
    await page.route('**/slow-avatar.png', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await route.fulfill({ contentType: 'image/png', body: PIXEL });
    });
    await gotoStory(page, 'components-avatar--default', TAG);
    await mount(page, '/slow-avatar.png');
    const host = page.locator('#under-test');
    await expect(host).toHaveAttribute('data-image-status', 'idle');
    await expect(host.locator('sb-avatar-fallback')).toBeVisible();
    await expect(host.locator('sb-avatar-image img')).toBeHidden();
    await expect(host).toHaveAttribute('data-image-status', 'loaded');
    await expect(host.locator('sb-avatar-fallback')).toBeHidden();
    await expect(host.locator('sb-avatar-image img')).toBeVisible();
  });

  test('keeps the fallback when the image fails, and returns to it when src changes to a bad one', async ({ page }) => {
    await page.route('**/ok-avatar.png', (route) => route.fulfill({ contentType: 'image/png', body: PIXEL }));
    await gotoStory(page, 'components-avatar--default', TAG);
    await mount(page, '/does-not-exist.png');
    const host = page.locator('#under-test');
    await expect(host).toHaveAttribute('data-image-status', 'error');
    await expect(host.locator('sb-avatar-fallback')).toBeVisible();
    await expect(host.locator('sb-avatar-image img')).toBeHidden();
    await host.locator('sb-avatar-image').evaluate((el) => el.setAttribute('src', '/ok-avatar.png'));
    await expect(host).toHaveAttribute('data-image-status', 'loaded');
    await expect(host.locator('sb-avatar-fallback')).toBeHidden();
    await host.locator('sb-avatar-image').evaluate((el) => el.setAttribute('src', '/also-missing.png'));
    await expect(host).toHaveAttribute('data-image-status', 'error');
    await expect(host.locator('sb-avatar-fallback')).toBeVisible();
  });

  test('fallback-only story shows initials in the fallback colors', async ({ page }) => {
    await gotoStory(page, 'components-avatar--fallback-only', TAG);
    const fallback = page.locator('sb-avatar-fallback');
    await expect(fallback).toBeVisible();
    expect(await css(page, 'sb-avatar-fallback', ['background-color', 'color', 'font-size'])).toEqual({
      'background-color': await tokenColor(fallback, '--sb-avatar-fallback-bg'),
      color: await tokenColor(fallback, '--sb-avatar-fallback-fg'),
      'font-size': await tokenLength(fallback, '--sb-avatar-fallback-font-size'),
    });
    const size = await tokenPx(fallback, '--sb-avatar-size');
    expect(await fallback.boundingBox()).toMatchObject({ width: size, height: size });
  });

  test('image alt is the accessible name; a hidden image or fallback is out of the tree', async ({ page }) => {
    await gotoStory(page, 'components-avatar--default', TAG);
    const cdp = await page.context().newCDPSession(page);
    const images = (await axNodes(cdp, 'image')).map((n) => n.name);
    expect(images).toContain('Ada Example');
    expect(images.filter((n) => n === 'Ada Example')).toHaveLength(1);
  });

  test('a loaded image with an empty alt is named by the fallback label', async ({ page }) => {
    await gotoStory(page, 'components-avatar--default', TAG);
    await page.route('**/named-avatar.png', (route) => route.fulfill({ contentType: 'image/png', body: PIXEL }));
    await page.evaluate(async () => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<sb-avatar id="named"><sb-avatar-image src="/named-avatar.png" alt=""></sb-avatar-image><sb-avatar-fallback label="Pat Example">PE</sb-avatar-fallback></sb-avatar>',
      );
      const el = document.querySelector('#named')!;
      await Promise.all([...el.children].map((c) => (c as unknown as { updateComplete: Promise<unknown> }).updateComplete));
    });
    await expect(page.locator('#named sb-avatar-fallback')).toBeHidden();
    const cdp = await page.context().newCDPSession(page);
    expect((await axNodes(cdp, 'image')).map((n) => n.name)).toContain('Pat Example');
    await page.locator('#named sb-avatar-image').evaluate((el) => ((el as HTMLElement & { alt: string }).alt = 'Custom text'));
    await expect.poll(async () => (await axNodes(cdp, 'image')).map((n) => n.name)).toContain('Custom text');
  });

  test('fallback label gives initials the role img and a name before first render', async ({ page }) => {
    await gotoStory(page, 'components-avatar--fallback-only', TAG);
    const fallback = page.locator('sb-avatar-fallback');
    await expect(fallback).toHaveAttribute('role', 'img');
    await expect(fallback).toHaveAttribute('aria-label', 'Grace Sample');
    const cdp = await page.context().newCDPSession(page);
    expect((await axNodes(cdp, 'image')).map((n) => n.name)).toContain('Grace Sample');
    const roles = await page.evaluate(async () => {
      const seen: (string | null)[] = [];
      const el = document.createElement('sb-avatar-fallback');
      el.setAttribute('label', 'X Y');
      new MutationObserver(() => seen.push(el.getAttribute('role'))).observe(el, { attributes: true, attributeFilter: ['role'] });
      document.body.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      return seen;
    });
    expect(roles).toEqual(['img']);
  });

  test('fallback without a label has no role', async ({ page }) => {
    await gotoStory(page, 'components-avatar--default', TAG);
    const role = await page.evaluate(async () => {
      const el = document.createElement('sb-avatar-fallback');
      document.body.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      return el.getAttribute('role');
    });
    expect(role).toBeNull();
  });

  test('badge sits at the bottom end with a ring and is 30% of the avatar', async ({ page }) => {
    await gotoStory(page, 'components-avatar--sizes', TAG);
    for (const size of ['medium', 'large'] as const) {
      const avatar = page.locator(`${TAG}[size="${size}"]`).first();
      const [a, b] = await Promise.all([avatar.boundingBox(), avatar.locator('sb-avatar-badge').boundingBox()]);
      expect(Math.abs(b!.x + b!.width - (a!.x + a!.width))).toBeLessThanOrEqual(1);
      expect(Math.abs(b!.y + b!.height - (a!.y + a!.height))).toBeLessThanOrEqual(1);
      expect(Math.abs(b!.width - 0.3 * a!.width)).toBeLessThanOrEqual(0.5);
    }
    const badge = page.locator('sb-avatar-badge').first();
    expect((await css(page, 'sb-avatar-badge', ['border-top-left-radius', 'background-color']))['background-color']).toBe(await tokenColor(badge, '--sb-color-primary'));
    expect((await css(page, 'sb-avatar-badge', ['box-shadow']))['box-shadow']).toContain(await tokenLength(badge, '--sb-avatar-badge-ring-width'));
  });

  test('badge icon is hidden at small and shown at medium', async ({ page }) => {
    await gotoStory(page, 'components-avatar--default', TAG);
    await page.evaluate(() => {
      for (const size of ['small', 'medium']) {
        const wrap = document.createElement('div');
        wrap.innerHTML = `<sb-avatar size="${size}"><sb-avatar-fallback>A</sb-avatar-fallback><sb-avatar-badge label="Online"><svg id="badge-${size}" viewBox="0 0 24 24"></svg></sb-avatar-badge></sb-avatar>`;
        document.body.append(wrap);
      }
    });
    const display = (size: string) => page.evaluate((s) => getComputedStyle(document.getElementById(`badge-${s}`)!).display, size);
    await expect.poll(() => display('small')).toBe('none');
    expect(await display('medium')).not.toBe('none');
  });

  test('badge is named by label, or hidden when decorative', async ({ page }) => {
    await gotoStory(page, 'components-avatar--with-badge', TAG);
    const badge = page.locator('sb-avatar-badge');
    await expect(badge).toHaveAttribute('role', 'img');
    await expect(badge).toHaveAttribute('aria-label', 'Online');
    const attrs = await page.evaluate(async () => {
      const el = document.createElement('sb-avatar-badge');
      document.body.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      return { hidden: el.getAttribute('aria-hidden'), role: el.getAttribute('role') };
    });
    expect(attrs).toEqual({ hidden: 'true', role: null });
  });

  test('a group overlaps avatars by the overlap token with a ring in the background color', async ({ page }) => {
    await gotoStory(page, 'components-avatar--group', 'sb-avatar-group');
    const avatars = page.locator('sb-avatar-group > sb-avatar');
    const [first, second] = await Promise.all([avatars.nth(0).boundingBox(), avatars.nth(1).boundingBox()]);
    expect(Math.abs(second!.x - (first!.x + first!.width - (await tokenPx(avatars.first(), '--sb-avatar-group-overlap'))))).toBeLessThanOrEqual(1);
    expect((await css(page, 'sb-avatar-group > sb-avatar', ['box-shadow']))['box-shadow']).toContain(await tokenLength(avatars.first(), '--sb-avatar-group-ring-width'));
    expect((await css(page, 'sb-avatar-group > sb-avatar', ['box-shadow']))['box-shadow']).toContain((await tokenColor(avatars.first(), '--sb-color-background')).replace('rgb', 'rgb'));
  });

  test('group count matches the avatars size and the group size follows its largest avatar', async ({ page }) => {
    await gotoStory(page, 'components-avatar--group', 'sb-avatar-group');
    const count = page.locator('sb-avatar-group-count');
    const base = await tokenPx(count, '--sb-avatar-size');
    expect(await count.boundingBox()).toMatchObject({ width: base, height: base });
    await expect(page.locator('sb-avatar-group')).toHaveAttribute('data-size', 'medium');
    await page.locator('sb-avatar-group > sb-avatar').first().evaluate((el) => el.setAttribute('size', 'large'));
    await expect(page.locator('sb-avatar-group')).toHaveAttribute('data-size', 'large');
    const large = await tokenPx(count, '--sb-avatar-size-lg');
    expect(await count.boundingBox()).toMatchObject({ width: large, height: large });
    await gotoStory(page, 'components-avatar--group-with-icon-count', 'sb-avatar-group');
    const icon = await tokenPx(page.locator('sb-avatar-group-count'), '--sb-avatar-icon-size-lg');
    expect(await page.locator('sb-avatar-group-count svg').boundingBox()).toMatchObject({ width: icon, height: icon });
  });

  test('group count uses the count colors and the group keeps authored role and name', async ({ page }) => {
    await gotoStory(page, 'components-avatar--group', 'sb-avatar-group');
    const count = page.locator('sb-avatar-group-count');
    expect((await css(page, 'sb-avatar-group-count', ['background-color', 'color']))).toEqual({
      'background-color': await tokenColor(count, '--sb-avatar-count-bg'),
      color: await tokenColor(count, '--sb-avatar-count-fg'),
    });
    await expect(page.getByRole('group', { name: 'Project members' })).toBeVisible();
  });

  test('group count label gives the count the role img and a name before first render', async ({ page }) => {
    await gotoStory(page, 'components-avatar--group', 'sb-avatar-group');
    const cdp = await page.context().newCDPSession(page);
    expect((await axNodes(cdp, 'image')).map((n) => n.name)).toContain('3 more members');
    await gotoStory(page, 'components-avatar--group-with-icon-count', 'sb-avatar-group');
    expect((await axNodes(await page.context().newCDPSession(page), 'image')).map((n) => n.name)).toContain('Add member');
    const result = await page.evaluate(async () => {
      const seen: (string | null)[] = [];
      const el = document.createElement('sb-avatar-group-count');
      el.setAttribute('label', '2 more');
      new MutationObserver(() => seen.push(el.getAttribute('role'))).observe(el, { attributes: true, attributeFilter: ['role'] });
      document.body.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      const name = el.getAttribute('aria-label');
      el.removeAttribute('label');
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      return { seen, name, after: el.getAttribute('role') };
    });
    expect(result).toEqual({ seen: ['img', null], name: '2 more', after: null });
  });

  test('badge, fallback and group count stay visible in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-avatar--with-badge', TAG);
    const canvas = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:block;forced-color-adjust:none;background:Canvas';
      document.body.append(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    expect((await css(page, 'sb-avatar-badge', ['background-color']))['background-color']).not.toBe(canvas);
    await gotoStory(page, 'components-avatar--fallback-only', TAG);
    expect(await css(page, 'sb-avatar-fallback', ['outline-style'])).toEqual({ 'outline-style': 'solid' });
    await gotoStory(page, 'components-avatar--group', 'sb-avatar-group');
    expect(await css(page, 'sb-avatar-group-count', ['outline-style'])).toEqual({ 'outline-style': 'solid' });
  });

  test('has no axe violations', async ({ page }) => {
    for (const id of ['default', 'fallback-only', 'sizes', 'with-badge', 'group', 'group-with-icon-count']) {
      await gotoStory(page, `components-avatar--${id}`, TAG);
      expect(await axeViolations(page, 'sb-avatar, sb-avatar-group')).toEqual([]);
    }
  });
});
