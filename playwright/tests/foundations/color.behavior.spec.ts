import { join } from 'node:path';

import { expect, test } from '../../fixtures';
import { gotoFoundation, loadTokens, resolved, ROOT } from '../../helpers/foundations';
import { wcagRatio } from '#harness/lib/color.mjs';
import { readJson } from '#harness/lib/files.mjs';
import { tokensForMode } from '#harness/lib/tokens.mjs';
import { CONTRAST_MIN, PAGES } from '../../../src/stories/foundations/families';

const COLOR = PAGES.find((p) => p.id === 'color')!;
type Pair = { fg: string; bg: string; kind: string };
const pairs = (): Pair[] => readJson<{ pairs: Pair[] }>(join(ROOT, 'spec/tokens/contrast.json')).pairs;

test.describe('Foundations: Color', () => {
  test('shows each foundation ramp with every step and its hex', async ({ page }) => {
    const all = await loadTokens();
    const foundation = all.sets.filter((s) => s.layer === 'foundation').flatMap((s) => s.tokens.filter((t) => t.path.startsWith('color.')));
    const main = await gotoFoundation(page, COLOR);
    const swatches = await main
      .locator('[data-swatch]')
      .evaluateAll((els) => els.map((el) => [el.getAttribute('data-swatch'), el.querySelector('[data-hex]')?.textContent?.trim()]));
    expect(swatches.map(([path]) => path).sort()).toEqual(foundation.map((t) => t.path).sort());
    for (const [path, hex] of swatches) expect(hex, path ?? '').toBe(String(foundation.find((t) => t.path === path)!.value).toUpperCase());
  });

  test('shows the semantic colors of every mode with their alias chain', async ({ page }) => {
    const all = await loadTokens();
    const main = await gotoFoundation(page, COLOR);
    for (const mode of all.modes) {
      const panel = main.locator(`[data-mode-panel="${mode}"]`);
      await expect(panel).toHaveAttribute('data-theme', mode);
      const map = tokensForMode(all, mode);
      const set = all.sets.find((s) => s.layer === 'semantic' && s.mode === mode)!;
      for (const t of set.tokens.filter((x) => x.path.startsWith('color.'))) {
        const r = resolved(map, t.path);
        await expect(panel.locator(`[data-chain="${t.path}"]`)).toHaveText(`${r.chain.join(' → ')} → ${String(r.value).toUpperCase()}`);
      }
    }
  });

  test('contrast table matches a node-side WCAG computation for every declared pair', async ({ page }) => {
    const all = await loadTokens();
    const main = await gotoFoundation(page, COLOR);
    await expect(main.locator('tr[data-contrast-row]')).toHaveCount(all.modes.length * pairs().length);
    for (const mode of all.modes) {
      const map = tokensForMode(all, mode);
      for (const { fg, bg, kind } of pairs()) {
        const ratio = wcagRatio(String(resolved(map, fg).value), String(resolved(map, bg).value));
        const row = main.locator(`tr[data-contrast-row][data-mode="${mode}"][data-fg="${fg}"][data-bg="${bg}"]`);
        await expect(row).toHaveCount(1);
        expect(Number(await row.getAttribute('data-ratio')), `${mode} ${fg} on ${bg}`).toBeCloseTo(ratio, 6);
        await expect(row.locator('[data-ratio-text]')).toHaveText(`${ratio.toFixed(2)}:1`);
        const pass = ratio >= CONTRAST_MIN[kind]!;
        await expect(row).toHaveAttribute('data-pass', String(pass));
        await expect(row.locator('[data-verdict]')).toHaveText(pass ? 'Pass' : 'Fail');
      }
    }
  });
});
