import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Wait until the custom element is defined and upgraded so assertions don't
// race its first render.
// A host whose only content is a popover (top layer or display:none) has no box of its own: wait for 'attached'.
export async function gotoStory(
  page: Page,
  storyId: string,
  tagName: string,
  state: 'visible' | 'attached' = 'visible',
): Promise<void> {
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: 'load' });
  // Storybook renders after load and the dev server may reload once while it optimizes dependencies:
  // wait until the story has finished rendering so later evaluates don't run in a context that goes away.
  await page.waitForFunction(() => {
    const phase = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }).__STORYBOOK_PREVIEW__?.currentRender?.phase;
    return phase === 'finished' || phase === 'completed' || phase === 'errored' || phase === 'aborted';
  });
  await page.waitForFunction((tag) => !!customElements.get(tag), tagName);
  const host = page.locator(tagName).first();
  await host.evaluate((el) => (el as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete);
  await (state === 'visible' ? expect(host).toBeVisible() : expect(host).toBeAttached());
}
