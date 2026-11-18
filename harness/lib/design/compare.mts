/// <reference lib="dom" />
// Storybook <-> design file parity of a pattern's screens, tool-neutral: each side yields an inventory of its visible texts
// with their boxes (page coordinates, same width), and the diff names what is missing, extra, out of order or placed
// elsewhere. Readable report: docs/design-docs/parity.md.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseJson, show } from '../files.mjs';
import { patternIds, patternOf } from './patterns.mjs';
import { TOLERANCE, diffInventories, norm } from './compare-runtime.mjs';

export interface InventoryText { t: string; x: number; y: number; w: number; h: number; a?: string }
export interface Inventory { page?: { width: number; height: number }; texts: InventoryText[] }
export interface StateDiff { texts: number; matched: number; missing: string[]; extra: string[]; moved: string[]; order: number; bounds: string | null; ok: boolean }
export interface ParityRow { id: string; state: unknown; ok: boolean; error?: string; texts?: number; matched?: number; missing: unknown[]; extra: unknown[]; moved: unknown[]; order?: unknown; bounds?: unknown }

export const COMPARE_DIR = 'generated/design/compare';
export const PARITY_VIEW = 'docs/design-docs/parity.md';
export const SCREEN_WIDTH = 1344;

export const stateId = (state: string): string => state;
export const stateTitle = (state: string): string => state.split('-').map((w, i) => (i ? w : (w[0] ?? '').toUpperCase() + w.slice(1))).join(' ');

// Runs in the browser: every visible text (shadow roots included) and the value of text fields, with page coordinates.
const COLLECT = (): Inventory => {
  const out: InventoryText[] = [];
  const seen = new Set<Element>();
  const isText = (x: Node): x is Text => x.nodeType === 3;
  const isElement = (x: Node): x is Element => x.nodeType === 1;
  const isField = (x: Element): x is HTMLInputElement | HTMLTextAreaElement => /^(INPUT|TEXTAREA)$/.test(x.tagName);
  const isSelect = (x: Element): x is HTMLSelectElement => x.tagName === 'SELECT';
  const hostOf = (x: Element): Element | undefined => { const r = x.getRootNode(); return r instanceof ShadowRoot ? r.host : undefined; };
  const box = (r: DOMRect) => ({ x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) });
  const shown = (el: Element) => { const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none'; };
  const clipped = (el: Element) => {
    for (let e: Element | null | undefined = el, i = 0; e && i < 4; e = e.parentElement || hostOf(e), i++) {
      const s = getComputedStyle(e);
      if ((s.clipPath && s.clipPath !== 'none') || (s.clip && s.clip !== 'auto')) return true;
    }
    return false;
  };
  const walk = (root: Node) => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n: Node | null;
    while ((n = tw.nextNode())) {
      if (isText(n)) {
        const el = n.parentElement;
        if (!el || /^(SCRIPT|STYLE)$/.test(el.tagName) || !shown(el) || seen.has(el)) continue;
        seen.add(el);
        if (clipped(el)) continue;
        const groups: Text[][] = [[]];
        for (const c of el.childNodes) {
          if (isText(c)) groups.at(-1)?.push(c);
          else if (c.nodeType === 1) groups.push([]);
        }
        for (const parts of groups.filter((g) => g.length)) {
          const t = parts.map((c) => c.textContent).join('').replace(/\s+/g, ' ').trim();
          const first = parts[0];
          const last = parts[parts.length - 1];
          if (!t || !first || !last) continue;
          const range = document.createRange();
          range.setStartBefore(first);
          range.setEndAfter(last);
          const r = range.getBoundingClientRect();
          if (r.width > 2 && r.height > 2) out.push({ t, ...box(r) });
        }
        continue;
      }
      if (!isElement(n)) continue;
      if (n.shadowRoot) walk(n.shadowRoot);
      if (isField(n) && !/^(checkbox|radio|range)$/.test(n.type) && shown(n)) {
        const t = (n.value || n.placeholder || '').trim();
        const r = n.getBoundingClientRect();
        if (t && r.width > 2) out.push({ t, ...box(r) });
      }
      if (isSelect(n) && shown(n)) {
        const r = n.getBoundingClientRect();
        const t = n.selectedOptions[0]?.textContent?.trim();
        if (t && r.width > 2) out.push({ t, ...box(r) });
      }
    }
  };
  walk(document.body);
  return { page: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }, texts: out };
};

// Renders every state of the patterns from a running Storybook; writes <id>/<state>.sb.json and .sb.png.
export async function storybookInventories(root: string, ids: string[], { url }: { url: string }): Promise<string[]> {
  let chromium: typeof import('playwright').chromium;
  try { ({ chromium } = await import('playwright')); } catch { throw Object.assign(new Error('Playwright is not installed.'), { fix: 'npm install, then npm run test:install' }); }
  const reachable = await fetch(`${url}/iframe.html`).then((r) => r.ok).catch(() => false);
  if (!reachable) throw Object.assign(new Error(`No Storybook at ${url}.`), { fix: 'Start it (npm run storybook) and pass its address with --url.' });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: SCREEN_WIDTH, height: 900 } });
  const written: string[] = [];
  try {
    for (const id of ids) {
      const { states } = await patternOf(root, id);
      await mkdir(join(root, COMPARE_DIR, id), { recursive: true });
      for (const state of states) {
        await page.goto(`${url}/iframe.html?id=patterns-${id}--${state}&viewMode=story`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        const inv = await page.evaluate(COLLECT);
        await writeFile(join(root, COMPARE_DIR, id, `${state}.sb.json`), JSON.stringify(inv, null, 1) + '\n');
        await page.screenshot({ path: join(root, COMPARE_DIR, id, `${state}.sb.png`), fullPage: true });
        written.push(`${id}/${state}`);
      }
    }
  } finally { await browser.close(); }
  return written;
}

export async function readInventory(root: string, id: string, state: string): Promise<Inventory | null> {
  try { return parseJson<Inventory>(await readFile(join(root, COMPARE_DIR, id, `${state}.sb.json`), 'utf8')); } catch { return null; }
}

const list = (a: unknown[], n = 8): string => a.slice(0, n).join('; ') + (a.length > n ? `; ... (+${a.length - n})` : '');
export function parityText(rows: ParityRow[]): string {
  const ids = [...new Set(rows.map((r) => r.id))];
  const lines = ['# Pattern parity: Storybook and the design file', '', 'Generated by `sketchbook sync compare --ingest`; do not edit by hand. Each state is rendered from Storybook at the screen width and compared with the drawn screen: texts missing or extra, reading order, horizontal position and the content edges (tolerance 48 px). A difference that no layout can fix is a library gap, recorded with `sketchbook sync stamp note`.', ''];
  const ok = rows.filter((r) => r.ok).length;
  lines.push(`${ok} of ${rows.length} states match.`, '');
  for (const id of ids) {
    lines.push(`## ${id}`, '', '| State | Texts | Missing in file | Only in file | Moved | Order | Content edges |', '| --- | --- | --- | --- | --- | --- | --- |');
    for (const r of rows.filter((x) => x.id === id)) lines.push(r.error ? `| ${show(r.state)} | ${r.error} | | | | | |` : `| ${show(r.state)} | ${r.matched}/${r.texts} | ${list(r.missing, 4) || '-'} | ${list(r.extra, 4) || '-'} | ${list(r.moved, 3) || '-'} | ${r.order ? `${show(r.order)} out of order` : '-'} | ${show(r.bounds || '-')} |`);
    lines.push('');
  }
  return lines.join('\n');
}

export async function writeParity(root: string, rows: ParityRow[], { write = true } = {}): Promise<{ rows: ParityRow[]; text: string }> {
  const text = parityText(rows);
  if (write) {
    await mkdir(join(root, COMPARE_DIR), { recursive: true });
    await writeFile(join(root, COMPARE_DIR, 'report.json'), JSON.stringify(rows, null, 1) + '\n');
    await writeFile(join(root, PARITY_VIEW), text + '\n');
  }
  return { rows, text };
}

export { patternIds, TOLERANCE, diffInventories, norm };
