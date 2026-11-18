// A doc blueprint (harness/lib/design/docs.mjs) as plain text, in the wireframe notation of docs/design-docs/: the
// tool-neutral rendering, so a component's documentation reads the same in a terminal as in a design file.
import { show } from '../files.mjs';

export type ScreenWidth = string | { span: number[] };
export interface ScreenBox { fill?: string | null; pad?: string | null; gap?: string | null; align?: string; width?: ScreenWidth; wrap?: boolean; surface?: boolean }
export interface ScreenBoxNode extends ScreenBox { kind: 'stack' | 'row'; radius: string | null; height: string | null; rule?: boolean; children: ScreenNode[] }
export interface ScreenTextNode { kind: 'text'; text: string | Record<string, string>; style?: string; color?: string; width: ScreenWidth }
export interface ScreenComponentNode {
  kind: 'component'; component: string; set: string; variant: string;
  text: string | Record<string, string>; show: Record<string, string | boolean>; hide: string[]; clear: string[];
  icons?: Record<string, string>;
  slots: Record<string, ScreenNode[]>; width: ScreenWidth; height: string | null; ratio: number | null;
}
export type ScreenNode = ScreenBoxNode | ScreenTextNode | ScreenComponentNode;

export interface DocTreeNode { name: string; tags: string[]; note?: string; children: DocTreeNode[] }
export interface DocTableCell { text?: string; accent?: boolean; kind?: string; token?: string; fg?: string; bg?: string; mode?: string; caption?: string }
interface CardBase { span?: number[]; title?: string }
export interface MatrixCard extends CardBase { type: 'matrix'; set?: string; minWidth?: number; rowLabel?: string; cols: string[]; rows: { label: string; cells: unknown[] }[] }
export interface PreviewCard extends CardBase { type: 'preview'; set?: string; items: string[] }
export interface TreeCard extends CardBase { type: 'tree'; roots: DocTreeNode[] }
export interface TableCard extends CardBase { type: 'table'; columns: string[]; widths?: number[]; rows: [{ text: string; accent?: boolean }, ...DocTableCell[]][] }
export interface CodeCard extends CardBase { type: 'code'; source: string[]; marks?: number[][] }
export interface TagsCard extends CardBase { type: 'tags'; items: { kind?: string; label: string; token?: string; value?: string }[] }
export interface InstructionCard extends CardBase { type: 'instruction'; linkTo?: string; lines: string[] }
export interface ScreenCard extends CardBase { type: 'screen'; state?: string; screen: ScreenBox; children: ScreenNode[] }
export interface SpecimenCard extends CardBase { type: 'specimen'; perRow?: number; surface?: boolean; items: unknown[] }
export type DocCard = MatrixCard | PreviewCard | TreeCard | TableCard | CodeCard | TagsCard | InstructionCard | ScreenCard | SpecimenCard;
export interface DocSection { title?: string; cards: DocCard[] }
export interface DocBlueprint { name: string; link: string; definition: string; sections: DocSection[] }

const pad = (s: unknown, n: number): string => String(s).padEnd(n);
const table = (head: unknown[], rows: unknown[][]): string[] => {
  const widths = head.map((h, i) => Math.max(String(h).length, ...rows.map((r) => String(r[i]).length)));
  const line = (r: unknown[]) => `| ${r.map((c, i) => pad(c, widths[i] ?? 0)).join(' | ')} |`;
  const rule = `+-${widths.map((w) => '-'.repeat(w)).join('-+-')}-+`;
  return [rule, line(head), rule, ...rows.map(line), rule];
};

// highlight(text) wraps an accessibility attribute or rule; plain by default.
export function docText(doc: DocBlueprint, { highlight = (s: string): string => s } = {}): string {
  const out = [`+-- ${doc.name} `.padEnd(80, '-') + '+', `| ${doc.link}`, `| ${doc.definition}`, '+'.padEnd(80, '-') + '+'];
  const card = (c: DocCard): string[] => {
    const lines = c.title ? [`${c.title}`] : [];
    if (c.type === 'matrix') lines.push(...table([c.rowLabel || '', ...c.cols], c.rows.map((r) => [r.label, ...r.cells.map((x) => (x === null ? 'n/a' : '[x]'))])));
    if (c.type === 'preview') lines.push(...c.items.map((n) => `[x] ${n}`));
    if (c.type === 'tree') {
      const walk = (n: DocTreeNode, depth: number): string[] => [`${'  '.repeat(depth)}- ${n.name} (${n.tags.join(')(')})${n.note ? `  ${n.note}` : ''}`, ...n.children.flatMap((k) => walk(k, depth + 1))];
      lines.push(...c.roots.flatMap((r) => walk(r, 0)));
    }
    if (c.type === 'table') {
      const w = Math.max(...c.rows.map((r) => r[0].text.length), c.columns[0]?.length ?? 0);
      lines.push(`${pad(c.columns[0], w)}  ${c.columns[1]}`, ...c.rows.map((r) => `${r[0].accent ? highlight(pad(r[0].text, w)) : pad(r[0].text, w)}  ${r[1]?.text}`));
    }
    if (c.type === 'code') {
      const n = String(c.source.length).length;
      c.source.forEach((l, i) => {
        const marks = (c.marks || []).filter(([line]) => line === i).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
        const text = marks.reduce((s, [, a, b]) => s.slice(0, a) + highlight(s.slice(a, b)) + s.slice(b), l);
        lines.push(`${String(i + 1).padStart(n)}  ${text}`);
      });
    }
    if (c.type === 'tags') lines.push(c.items.map((t) => `(${t.token ? 'o ' : ''}${t.label}${t.value ? `  ${t.value}` : ''})`).join(' '));
    if (c.type === 'instruction') lines.push(...c.lines.map((l) => `- ${l}`));
    if (c.type === 'screen') {
      const note = (n: ScreenBox) => [n.fill && `fill ${n.fill}`, n.pad && `pad ${n.pad}`, n.gap && `gap ${n.gap}`, n.align !== 'start' && n.align, n.width && n.width !== 'hug' && `width ${typeof n.width === 'object' && n.width.span ? n.width.span.join('/') : show(n.width)}`, n.wrap && 'wrap', n.surface && 'surface'].filter(Boolean).join(', ');
      const walk = (n: ScreenNode, depth: number): string[] => {
        const at = '  '.repeat(depth);
        if (n.kind === 'text') return [`${at}- text "${show(n.text)}" (${n.style}, ${n.color})`];
        if (n.kind === 'component') {
          const set = n.variant === n.set ? n.set : `${n.set} ${n.variant}`;
          const given = [...Object.entries(n.text).map(([k, v]) => `${k}: ${v}`), ...Object.entries(n.show).map(([k, v]) => `${k}: ${v}`), ...n.hide.map((k) => `hide ${k}`)].join('; ');
          return [`${at}- ${set}${given ? `  ${given}` : ''}${[n.width === 'fill' && 'fill', n.height === 'hug' && 'hug height', n.height === 'fill' && 'fill height'].filter(Boolean).map((x) => `  (${x})`).join('')}`, ...Object.entries(n.slots).flatMap(([name, kids]) => [`${at}  [${name}]`, ...kids.flatMap((k) => walk(k, depth + 2))])];
        }
        return [`${at}- ${n.kind} (${note(n)})`, ...n.children.flatMap((k) => walk(k, depth + 1))];
      };
      lines.push(`screen: ${note(c.screen)}`, ...c.children.flatMap((n) => walk(n, 0)));
    }
    return lines;
  };
  for (const s of doc.sections) {
    out.push('', `== ${s.title} ==`);
    for (const c of s.cards) out.push(...card(c), '');
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}
