import type { Page } from '@playwright/test';

import { gotoStory } from './storybook';

export type Mode = 'light' | 'dark';

// The mode goes in through the toolbar global, so components first render in it: switching afterwards
// would let axe read colors halfway through their transitions. Then every custom element is awaited.
export async function gotoPattern(page: Page, storyId: string, firstTag: string, mode: Mode = 'light'): Promise<void> {
  await gotoStory(page, `${storyId}&globals=theme:${mode}`, firstTag);
  await page.evaluate(async () => {
    const pending = [...document.querySelectorAll('*')].flatMap((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete ?? []);
    await Promise.all(pending);
  });
}

interface AxNode {
  ignored?: boolean;
  role?: { value: string };
  name?: { value: string };
  properties?: { name: string; value: { value: unknown } }[];
}

const axTree = async (page: Page): Promise<AxNode[]> => {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AxNode[] };
  await cdp.detach();
  return nodes.filter((node) => !node.ignored);
};

// Rendered headings in reading (flat-tree) order, shadow-rendered ones (sb-typography, accordion triggers) included.
export function headings(page: Page): Promise<{ level: number; name: string }[]> {
  return page.evaluate(() => {
    const children = (node: Node): Node[] => {
      if (node instanceof HTMLSlotElement) return node.assignedNodes().length ? node.assignedNodes() : [...node.childNodes];
      if (node instanceof Element && node.shadowRoot) return [...node.shadowRoot.childNodes];
      return [...node.childNodes];
    };
    const text = (node: Node): string =>
      node.nodeType === Node.TEXT_NODE ? (node.textContent ?? '') : node instanceof HTMLStyleElement ? '' : children(node).map(text).join('');
    const found: { level: number; name: string }[] = [];
    const walk = (node: Node) => {
      if (node instanceof Element) {
        // Not checkVisibility(): hosts with display: contents have no box but their content is rendered.
        const style = getComputedStyle(node);
        if (style.display === 'none') return;
        const level = /^H[1-6]$/.test(node.tagName) ? Number(node.tagName[1]) : node.getAttribute('role') === 'heading' ? Number(node.getAttribute('aria-level') ?? 2) : 0;
        if (level && style.visibility !== 'hidden') {
          found.push({ level, name: text(node).replace(/\s+/g, ' ').trim() });
          return;
        }
      }
      children(node).forEach(walk);
    };
    walk(document.querySelector('#storybook-root')!);
    return found;
  });
}

const LANDMARKS = ['banner', 'main', 'navigation', 'complementary', 'contentinfo', 'form', 'region', 'search'];

export async function landmarks(page: Page): Promise<{ role: string; name: string }[]> {
  return (await axTree(page))
    .filter((node) => LANDMARKS.includes(node.role?.value ?? ''))
    .map((node) => ({ role: node.role!.value, name: node.name?.value ?? '' }));
}

// One h1, first; no level skipped on the way down (h2 -> h4). Empty means the outline is sound.
export function outlineProblems(list: { level: number; name: string }[]): string[] {
  const problems: string[] = [];
  if (list[0]?.level !== 1) problems.push(`first heading is not h1: ${JSON.stringify(list[0])}`);
  if (list.filter((h) => h.level === 1).length !== 1) problems.push('expected exactly one h1');
  list.forEach((h, i) => {
    const prev = list[i - 1];
    if (prev && h.level > prev.level + 1) problems.push(`"${h.name}" (h${h.level}) skips a level after h${prev.level}`);
  });
  return problems;
}

// Counts form submissions and keeps the page from navigating away.
export const countSubmits = (page: Page, selector = 'form') =>
  page.evaluateHandle((sel) => {
    const counter = { n: 0 };
    document.querySelector(sel)!.addEventListener('submit', (event) => {
      event.preventDefault();
      counter.n++;
    });
    return counter;
  }, selector);
