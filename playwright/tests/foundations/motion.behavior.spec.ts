import { expect, test } from '../../fixtures';
import { gotoFoundation } from '../../helpers/foundations';
import { PAGES } from '../../../src/stories/foundations/families';

const MOTION = PAGES.find((p) => p.id === 'motion')!;

// Each duration and easing has a play button; the demo moves a marker with that token's timing,
// and jumps straight to the end state when the user asks for reduced motion.
test.describe('Foundations: Motion', () => {
  test('plays a demo with the token duration', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const main = await gotoFoundation(page, MOTION);
    const demos = main.locator('[data-motion-demo]');
    expect(await demos.count()).toBeGreaterThan(0);
    const demo = demos.first();
    await demo.getByRole('button').click();
    await expect(demo).toHaveAttribute('data-played', 'true');
    expect(Number(await demo.getAttribute('data-played-duration'))).toBeGreaterThan(0);
    await expect(main.locator('[data-reduced-note]')).toBeHidden();
  });

  test('honors prefers-reduced-motion: the demo jumps to its end state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const main = await gotoFoundation(page, MOTION);
    await expect(main.locator('[data-reduced-note]')).toBeVisible();
    for (const demo of await main.locator('[data-motion-demo]').all()) {
      await demo.getByRole('button').click();
      await expect(demo).toHaveAttribute('data-played', 'true');
      await expect(demo).toHaveAttribute('data-played-duration', '0');
    }
  });
});
