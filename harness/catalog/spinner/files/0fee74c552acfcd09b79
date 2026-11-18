import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenPx, tokenSeconds } from '../../helpers/tokens';

const TAG = 'sb-spinner';
const icon = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const el = document.querySelector('sb-spinner')!.shadowRoot!.querySelector('[part="icon"]')!;
    const s = getComputedStyle(el);
    return { animationName: s.animationName, duration: s.animationDuration, stroke: s.stroke };
  });

test.describe('Spinner', () => {
  test('announces "Loading" as a status by default', async ({ page }) => {
    await gotoStory(page, 'components-spinner--default', TAG);
    await expect(page.getByRole('status', { name: 'Loading' })).toBeVisible();
  });

  test('label changes the accessible name', async ({ page }) => {
    await gotoStory(page, 'components-spinner--custom-label', TAG);
    await expect(page.getByRole('status', { name: 'Loading results' })).toBeVisible();
  });

  test('decorative hides it from assistive technology', async ({ page }) => {
    await gotoStory(page, 'components-spinner--decorative', TAG);
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.locator(TAG)).toHaveAttribute('aria-hidden', 'true');
  });

  test('takes the spinner size token by default and follows --sb-spinner-size', async ({ page }) => {
    await gotoStory(page, 'components-spinner--default', TAG);
    const host = page.locator(TAG);
    const size = await tokenPx(host, '--sb-spinner-size');
    expect(await host.boundingBox()).toMatchObject({ width: size, height: size });
    await host.evaluate((el) => (el as HTMLElement).style.setProperty('--sb-spinner-size', '24px'));
    expect(await host.boundingBox()).toMatchObject({ width: 24, height: 24 });
  });

  test('spins, and spins slower with reduced motion', async ({ page }) => {
    await gotoStory(page, 'components-spinner--default', TAG);
    const normal = await icon(page);
    expect(normal.animationName).not.toBe('none');
    const loop = await tokenSeconds(page.locator(TAG).first(), '--sb-spinner-duration');
    expect(parseFloat(normal.duration)).toBeCloseTo(loop, 3);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(parseFloat((await icon(page)).duration)).toBeCloseTo(loop * 2, 3);
  });

  test('takes its color from the surrounding text', async ({ page }) => {
    await gotoStory(page, 'components-spinner--inherits-color', TAG);
    const parentColor = await page.locator('span:has(sb-spinner)').evaluate((el) => getComputedStyle(el).color);
    expect((await icon(page)).stroke).toBe(parentColor);
  });

  test('the status carries its label as text, and decorative never exposes a status', async ({ page }) => {
    await gotoStory(page, 'components-spinner--default', TAG);
    // The label is real text inside the status (shadow content), so a live region has content to announce.
    expect(await page.locator(TAG).evaluate((el) => el.shadowRoot!.textContent.trim())).toBe('Loading');
    const roles = await page.evaluate(async () => {
      const seen: (string | null)[] = [];
      const el = document.createElement('sb-spinner');
      el.setAttribute('decorative', '');
      new MutationObserver(() => seen.push(el.getAttribute('role'))).observe(el, { attributes: true });
      document.body.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      seen.push(el.getAttribute('role'));
      return seen;
    });
    expect(roles.every((r) => r === null)).toBe(true);
  });

  test('has no axe violations', async ({ page }) => {
    await gotoStory(page, 'components-spinner--default', TAG);
    expect(await axeViolations(page, TAG)).toEqual([]);
  });
});
