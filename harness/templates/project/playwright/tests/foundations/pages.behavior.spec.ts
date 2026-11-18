import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoFoundation, loadTokens, tokensOf } from '../../helpers/foundations';
import { PAGES } from '../../../src/stories/foundations/families';

// Every Foundations page is rendered from the token files: it must list each token of its family
// that the harness finds (foundation and semantic layers, every mode), and pass axe in both modes.
test.describe('Foundations pages', () => {
  for (const foundation of PAGES) {
    test.describe(foundation.title, () => {
      test('renders its title, intro and how to change it', async ({ page }) => {
        const main = await gotoFoundation(page, foundation);
        await expect(main.getByRole('heading', { level: 1 })).toHaveText(foundation.title);
        await expect(main.locator('[data-intro]')).not.toBeEmpty();
        await expect(main.locator('[data-how-to-change]')).toContainText('sketchbook tokens');
        await expect(main.locator('[data-how-to-change]')).toContainText('brand.config.json');
      });

      test('lists every token of its family found in the JSON', async ({ page }) => {
        const all = await loadTokens();
        const expected = tokensOf(all, foundation).map((t) => `${t.layer}|${t.mode ?? ''}|${t.path}`).sort();
        const main = await gotoFoundation(page, foundation);
        const rows = await main
          .locator('tr[data-token-row]')
          .evaluateAll((trs) => trs.map((tr) => `${tr.getAttribute('data-layer')}|${tr.getAttribute('data-mode') ?? ''}|${tr.getAttribute('data-path')}`));
        expect(rows.sort()).toEqual(expected);
      });

      test('names each token by its CSS variable', async ({ page }) => {
        const main = await gotoFoundation(page, foundation);
        const pairs = await main
          .locator('tr[data-token-row]')
          .evaluateAll((trs) => trs.map((tr) => [tr.getAttribute('data-path'), tr.querySelector('[data-css-var]')?.textContent?.trim()]));
        for (const [path, cssVar] of pairs) expect(cssVar, path ?? '').toBe(`--sb-${path!.replace(/\./g, '-')}`);
      });

      // WCAG 1.4.10 Reflow: at 320 CSS px the page never scrolls sideways.
      test('reflows at 320px without horizontal scrolling', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await gotoFoundation(page, foundation);
        const doc = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
        expect(doc.scroll).toBeLessThanOrEqual(doc.client);
      });

      for (const theme of ['light', 'dark'] as const) {
        test(`has no axe violations in ${theme} mode`, async ({ page }) => {
          await gotoFoundation(page, foundation, theme);
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          expect(await axeViolations(page, `main[data-foundation="${foundation.id}"]`)).toEqual([]);
        });
      }
    });
  }
});
