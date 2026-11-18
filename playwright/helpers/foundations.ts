import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { loadAll, resolve } from '#harness/lib/tokens.mjs';
import type { TokenData } from '#harness/lib/tokens.mjs';
import type { FoundationPage } from '../../src/stories/foundations/families';
import { pageOf, storyId } from '../../src/stories/foundations/families';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export type { TokenData };

// The token files as the harness reads them (node side), to compare against what the page shows.
export const loadTokens = () => loadAll(ROOT);

export function resolved(map: Parameters<typeof resolve>[0], path: string) {
  const r = resolve(map, path);
  if ('error' in r && r.error) throw new Error(`${path}: ${r.error}`);
  return r;
}

export const tokensOf = (all: TokenData, page: FoundationPage) =>
  all.sets.filter((s) => s.layer !== 'component').flatMap((s) => s.tokens.filter((t) => pageOf(t.path) === page.id));

export async function gotoFoundation(page: Page, foundation: FoundationPage, theme?: 'light' | 'dark') {
  const globals = theme ? `&globals=theme:${theme}` : '';
  await page.goto(`/iframe.html?id=${storyId(foundation)}&viewMode=story${globals}`, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const phase = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }).__STORYBOOK_PREVIEW__?.currentRender?.phase;
    return phase === 'finished' || phase === 'completed' || phase === 'errored' || phase === 'aborted';
  });
  const main = page.locator(`main[data-foundation="${foundation.id}"]`);
  await expect(main).toBeVisible();
  return main;
}
