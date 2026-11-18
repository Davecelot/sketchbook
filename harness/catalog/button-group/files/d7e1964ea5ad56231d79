import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import type { LitHost } from '../../helpers/elements';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-button-group';
// Playwright CSS pierces shadow roots, so name the children rather than using `> *`.
const kids = (page: Page) => page.locator(`${TAG} > :is(sb-button, sb-button-group-separator, sb-button-group-text)`);
const inner = (host: Locator) => host.locator('[part="button"]');
const corners = (loc: Locator) =>
  loc.evaluate((el) => {
    const s = getComputedStyle(el);
    return [s.borderStartStartRadius, s.borderStartEndRadius, s.borderEndEndRadius, s.borderEndStartRadius].map((v) => parseFloat(v));
  });
// A rounded corner has the radius token's size, a square one none; under a sharp brand both are 0 and the pattern stays as written.
const radius = (page: Page) => tokenPx(page.locator(TAG).first(), '--sb-button-group-radius');
const positions = (page: Page) => kids(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-position')));

test.describe('Button Group', () => {
  test('role=group named by aria-label, with its buttons reachable', async ({ page }) => {
    await gotoStory(page, 'components-button-group--default', TAG);
    const group = page.getByRole('group', { name: 'Message actions' });
    await expect(group).toBeVisible();
    expect(await group.ariaSnapshot()).toMatch(/button "Archive"[\s\S]*button "Report"[\s\S]*button "Snooze"/);
  });

  test('writes data-position and data-orientation, and keeps them current', async ({ page }) => {
    await gotoStory(page, 'components-button-group--default', TAG);
    await expect.poll(() => positions(page)).toEqual(['first', 'middle', 'last']);
    await page.locator(TAG).evaluate((el) => el.lastElementChild!.remove());
    await expect.poll(() => positions(page)).toEqual(['first', 'last']);
    await page.locator(TAG).evaluate((el) => el.lastElementChild!.remove());
    await expect.poll(() => positions(page)).toEqual(['only']);
    await page.locator(TAG).evaluate((el) => el.setAttribute('orientation', 'vertical'));
    await expect(kids(page).first()).toHaveAttribute('data-orientation', 'vertical');
  });

  test('horizontal: only the outer corners are rounded', async ({ page }) => {
    await gotoStory(page, 'components-button-group--default', TAG);
    const [first, mid, last] = await Promise.all([0, 1, 2].map((i) => corners(inner(kids(page).nth(i)))));
    const r = await radius(page);
    expect(first).toEqual([r, 0, 0, r]);
    expect(mid).toEqual([0, 0, 0, 0]);
    expect(last).toEqual([0, r, r, 0]);
  });

  test('vertical: top corners on the first, bottom corners on the last', async ({ page }) => {
    await gotoStory(page, 'components-button-group--vertical', TAG);
    const [first, last] = await Promise.all([0, 2].map((i) => corners(inner(kids(page).nth(i)))));
    const r = await radius(page);
    expect(first).toEqual([r, r, 0, 0]);
    expect(last).toEqual([0, 0, r, r]);
    const [a, b] = await Promise.all([kids(page).nth(0).boundingBox(), kids(page).nth(1).boundingBox()]);
    expect(b!.y).toBeGreaterThan(a!.y);
  });

  test('RTL puts the rounded corners on the other physical sides', async ({ page }) => {
    await gotoStory(page, 'components-button-group--rtl', TAG);
    const first = await inner(kids(page).first()).evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.borderTopRightRadius, s.borderTopLeftRadius].map((v) => parseFloat(v));
    });
    expect(first).toEqual([await radius(page), 0]);
  });

  test('a lone child keeps all its corners', async ({ page }) => {
    await gotoStory(page, 'components-button-group--single', TAG);
    const r = await radius(page);
    expect(await corners(inner(kids(page).first()))).toEqual([r, r, r, r]);
  });

  test('tertiary buttons share one border line', async ({ page }) => {
    await gotoStory(page, 'components-button-group--default', TAG);
    const [a, b] = await Promise.all([kids(page).nth(0).boundingBox(), kids(page).nth(1).boundingBox()]);
    expect(Math.round(a!.x + a!.width - b!.x)).toBe(await tokenPx(kids(page).first(), '--sb-button-group-border-width'));
  });

  test('separator is decorative, one border wide, token colored; no overlap after it', async ({ page }) => {
    await gotoStory(page, 'components-button-group--with-separator', TAG);
    const sep = page.locator('sb-button-group-separator');
    const line = sep.locator('[part="separator"]');
    await expect(line).toHaveAttribute('aria-hidden', 'true');
    expect((await line.boundingBox())?.width).toBe(await tokenPx(sep, '--sb-button-group-border-width'));
    expect(await line.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(sep, '--sb-button-group-separator-bg'));
    await expect(kids(page).nth(2)).not.toHaveAttribute('data-overlap');
    expect(await page.getByRole('group').ariaSnapshot()).not.toContain('separator');
  });

  test('separator stays visible in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-button-group--with-separator', TAG);
    const line = page.locator('sb-button-group-separator [part="separator"]');
    const canvas = await line.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:block;forced-color-adjust:none;background:Canvas';
      document.body.append(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    expect(await line.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(canvas);
  });

  test('separator turns horizontal in a vertical group', async ({ page }) => {
    await gotoStory(page, 'components-button-group--with-separator', TAG);
    await page.locator(TAG).evaluate((el) => el.setAttribute('orientation', 'vertical'));
    const border = await tokenPx(page.locator('sb-button-group-separator'), '--sb-button-group-border-width');
    await expect.poll(async () => (await page.locator('sb-button-group-separator [part="separator"]').boundingBox())?.height).toBe(border);
  });

  test('text cell shows its content with token colors and is not a control', async ({ page }) => {
    await gotoStory(page, 'components-button-group--with-text', TAG);
    const cell = page.locator('sb-button-group-text');
    await expect(cell).toContainText('Amount');
    expect(await cell.locator('[part="text"]').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(cell, '--sb-button-group-text-bg'));
    expect((await cell.locator('[part="text"]').boundingBox())?.height).toBe(await tokenPx(cell, '--sb-button-group-text-height'));
    await expect(page.getByRole('button')).toHaveCount(2);
  });

  test('Tab visits each button and the focused one is raised', async ({ page }) => {
    await gotoStory(page, 'components-button-group--default', TAG);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('Report');
    expect(await page.evaluate(() => getComputedStyle(document.activeElement!).position)).toBe('relative');
  });

  for (const id of ['default', 'vertical', 'with-separator', 'with-text']) {
    test(`axe clean: ${id}`, async ({ page }) => {
      await gotoStory(page, `components-button-group--${id}`, TAG);
      expect(await axeViolations(page, TAG, ['sb-button'])).toEqual([]);
    });
  }

  test('warns once when the group has no accessible name, and not when aria-label is set', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && m.text().includes('<sb-button-group> has no accessible name') && warnings.push(m.text()));
    await gotoStory(page, 'components-button-group--default', 'sb-button-group');
    await page.evaluate(async () => {
      const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const named = document.createElement('sb-button-group');
      named.setAttribute('aria-label', 'Named');
      const bare = document.createElement('sb-button-group') as LitHost;
      document.body.append(named, bare);
      await frames();
      bare.requestUpdate();
      await bare.updateComplete;
      await frames();
    });
    expect(warnings).toHaveLength(1);
  });
});
