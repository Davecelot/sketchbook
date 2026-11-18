import { expect, test } from '../../fixtures';
import { gotoFoundation, loadTokens, resolved } from '../../helpers/foundations';
import { tokensForMode } from '#harness/lib/tokens.mjs';
import { PAGES } from '../../../src/stories/foundations/families';

const page$ = (id: string) => PAGES.find((p) => p.id === id)!;

// Samples are drawn with the token's own value: the type scale at each size, the spacing scale as bars.
test.describe('Foundations samples', () => {
  test('type scale: each foundation size renders its sample at that size', async ({ page }) => {
    const all = await loadTokens();
    const sizes = all.sets.filter((s) => s.layer === 'foundation').flatMap((s) => s.tokens.filter((t) => t.path.startsWith('font.size.')));
    const main = await gotoFoundation(page, page$('typography'));
    for (const t of sizes) {
      const sample = main.locator(`[data-type-sample="${t.path}"]`);
      await expect(sample).toHaveCSS('font-size', String(t.value));
      await expect(main.locator(`[data-type-size="${t.path}"]`)).toContainText(String(t.value));
    }
  });

  test('spacing: each step is a bar as wide as its value', async ({ page }) => {
    const all = await loadTokens();
    const map = tokensForMode(all, all.modes[0] ?? null);
    const steps = all.sets.filter((s) => s.layer === 'foundation').flatMap((s) => s.tokens.filter((t) => t.path.startsWith('space.')));
    const main = await gotoFoundation(page, page$('spacing'));
    for (const t of steps) await expect(main.locator(`[data-bar="${t.path}"]`)).toHaveCSS('width', String(resolved(map, t.path).value));
    await expect(main.locator('[data-base-grid]')).toBeVisible();
  });

  test('z-index: layers are listed in stacking order', async ({ page }) => {
    const main = await gotoFoundation(page, page$('z-index'));
    const values = await main.locator('[data-layer-order] li').evaluateAll((lis) => lis.map((li) => Number(li.getAttribute('data-z'))));
    expect(values.length).toBeGreaterThan(0);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});
