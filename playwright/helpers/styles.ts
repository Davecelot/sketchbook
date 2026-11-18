import type { Locator, Page } from '@playwright/test';

export const stateLayerOpacity = (root: Locator) =>
  root.evaluate((el) => Number(getComputedStyle(el, '::before').opacity));

export const pseudo = (el: Locator, which: '::before' | '::after', prop: string) =>
  el.evaluate((node, [w, p]) => getComputedStyle(node, w).getPropertyValue(p), [which, prop] as const);

// The computed color of a CSS system color keyword (Highlight, CanvasText, ...) under the page's current media emulation.
export const systemColor = (page: Page, keyword: string) =>
  page.evaluate((k) => {
    const probe = document.createElement('i');
    probe.style.color = k;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, keyword);
