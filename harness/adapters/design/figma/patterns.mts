// Figma design adapter, patterns: a pattern blueprint (harness/lib/design/patterns.mjs) -> use_figma scripts that draw one
// doc per pattern on the Patterns page, each state a screen composed of library instances, and a read-only read-back.
// It reuses the doc runtime (header, sections, bound fills and gaps); only the screen card is new.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { docsData } from '../../../lib/design/docs.mjs';
import { PATTERNS_PAGE, patternDoc } from '../../../lib/design/patterns.mjs';
import type { DocBlueprint, DocCard, DocSection, ScreenCard, ScreenNode } from '../../../lib/design/doc-text.mjs';
import { parseJson } from '../../../lib/files.mjs';
import type { HarnessConfigJson } from '../../../../generated/types/harness-config.js';
import { designFamily, designFonts, figmaModel } from './variables.mjs';
import { RUNTIME, SUM, lookups, sumOf } from './docs.mjs';
import type { DocFile } from './docs.mjs';

type SlimNode = Record<string, unknown>;
type SlimSection = Omit<DocSection, 'cards'> & { cards: (Exclude<DocCard, ScreenCard> | (Omit<ScreenCard, 'children'> & { children: SlimNode[] }))[] };
interface PatternUnit { name: string; link?: string; definition?: string; append?: boolean; sections: SlimSection[]; id: string }
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const sizeOf = (v: unknown): number => (typeof v === 'object' && v !== null ? Object.keys(v).length : typeof v === 'string' ? v.length : 0);

const SCREEN = `figma.skipInvisibleInstanceChildren = false;
const later = [];
const place = (parent, child, node) => {
  parent.appendChild(child);
  if (node.width === 'fill') child.layoutSizingHorizontal = 'FILL';
  else if (node.width && node.width.span) child.resize(spanPx(node.width.span, inner), child.height);
  if (node.height === 'hug') child.layoutSizingVertical = 'HUG';
  else if (node.height === 'fill') child.layoutSizingVertical = 'FILL';
};
const align = (b, a, row) => {
  if (a === 'center') { b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER'; }
  else if (a === 'center-x') { if (row) b.primaryAxisAlignItems = 'CENTER'; else b.counterAxisAlignItems = 'CENTER'; }
  else if (a === 'end') { if (row) b.primaryAxisAlignItems = 'MAX'; else b.counterAxisAlignItems = 'MAX'; }
  else if (a === 'between') b.primaryAxisAlignItems = 'SPACE_BETWEEN';
  if (row && a === 'top') b.counterAxisAlignItems = 'MIN';
  else if (row && a !== 'center') b.counterAxisAlignItems = 'CENTER';
};
async function put(inst, key, value) {
  if (key.endsWith('@end')) {
    const cell = inst.findAll((x) => x.type === 'TEXT' && x.name === key.slice(0, -4))[0];
    if (cell && value) { cell.textAlignHorizontal = 'RIGHT'; if (cell.parent.layoutMode === 'HORIZONTAL') cell.parent.primaryAxisAlignItems = 'MAX'; } else if (!cell) report.problems.push(inst.name + ': nothing named ' + key);
    return;
  }
  const defs = inst.componentProperties;
  const prop = Object.keys(defs).find((p) => p.split('#')[0] === key);
  if (prop) { inst.setProperties({ [prop]: value }); return; }
  const m = /^(?:(.+)\\/)?([^\\[]+)(?:\\[(\\d+)\\])?$/.exec(key);
  const scope = m[1] ? inst.findOne((x) => x.name === m[1]) : inst;
  const nested = scope && scope.type === 'INSTANCE' && scope !== inst ? Object.keys(scope.componentProperties).find((p) => p.split('#')[0] === m[2]) : null;
  if (nested) { scope.setProperties({ [nested]: value }); return; }
  const part = scope && scope.findAll((x) => x.name === m[2])[m[3] ? +m[3] : 0];
  if (part && part.type !== 'TEXT' && /^[0-9.]+%$/.test(value)) { later.push(() => { const found = (m[1] ? inst.findOne((x) => x.name === m[1]) : inst).findAll((x) => x.name === m[2])[m[3] ? +m[3] : 0]; const host = found.parent; host.primaryAxisAlignItems = 'MIN'; found.layoutSizingHorizontal = 'FILL'; host.paddingRight = Math.round(host.width * (1 - parseFloat(value) / 100)); }); return; }
  const layer = scope && typeof value === 'string' ? scope.findAll((x) => x.type === 'TEXT' && x.name === m[2])[m[3] ? +m[3] : 0] : null;
  if (layer) layer.characters = value; else report.problems.push(inst.name + ': nothing named ' + key);
}
async function closeGroup(g) {
  if (!g || !g.layoutMode || g.layoutMode === 'NONE') return;
  const kids = g.children.filter((c) => c.visible && 'topLeftRadius' in c);
  if (kids.length < 2) return;
  const row = g.layoutMode === 'HORIZONTAL';
  const lead = row ? ['topLeftRadius', 'bottomLeftRadius'] : ['topLeftRadius', 'topRightRadius'];
  const trail = row ? ['topRightRadius', 'bottomRightRadius'] : ['bottomLeftRadius', 'bottomRightRadius'];
  const first = kids[0], last = kids[kids.length - 1];
  for (const [k, f] of lead.entries()) {
    const alias = first.boundVariables && first.boundVariables[f];
    const v = alias && await figma.variables.getVariableByIdAsync(alias.id);
    if (v) last.setBoundVariable(trail[k], v); else last[trail[k]] = first[f];
  }
}
const FLIP = { MIN: 'MAX', MAX: 'MIN' };
function mirror(node) {
  if (node.type === 'TEXT') { node.textAlignHorizontal = 'RIGHT'; return; }
  if (node.type === 'INSTANCE') {
    for (const t of node.findAll((x) => x.type === 'TEXT')) {
      // A label in a row that hugs it has no room to align, and setting RIGHT on one left nested instances (Toggle in
      // ToggleGroup) wider than their content; a text in a wider field still needs RIGHT.
      // Reading parent throws on some sublayers of instances nested in a slot.
      let row = null;
      try { row = t.parent; } catch (e) { row = null; }
      const hugged = t.textAutoResize === 'WIDTH_AND_HEIGHT' && row && row.layoutMode === 'HORIZONTAL' && row.primaryAxisSizingMode === 'AUTO';
      if (!hugged) t.textAlignHorizontal = 'RIGHT';
      // Storybook's select value fills its row, so in RTL it sits at the row's right edge; a hugging text would stay left.
      if (node.name === 'NativeSelect' && t.name === 'value' && row && row.layoutMode === 'HORIZONTAL') t.layoutSizingHorizontal = 'FILL';
    }
    for (const f of node.findAll((x) => x.type === 'FRAME' && x.layoutMode === 'VERTICAL' && x.counterAxisAlignItems === 'MIN')) f.counterAxisAlignItems = 'MAX';
    for (const f of node.findAll((x) => x.type === 'FRAME' && x.layoutMode === 'HORIZONTAL' && x.primaryAxisAlignItems === 'MIN')) f.primaryAxisAlignItems = 'MAX';
    if (node.layoutMode === 'VERTICAL' && node.counterAxisAlignItems === 'MIN') node.counterAxisAlignItems = 'MAX';
    return;
  }
  if (!('children' in node)) return;
  if (node.layoutMode === 'HORIZONTAL') {
    [...node.children].reverse().forEach((c, i) => node.insertChild(i, c));
    if (FLIP[node.primaryAxisAlignItems]) node.primaryAxisAlignItems = FLIP[node.primaryAxisAlignItems];
  } else if (node.layoutMode === 'VERTICAL' && FLIP[node.counterAxisAlignItems]) node.counterAxisAlignItems = FLIP[node.counterAxisAlignItems];
  for (const c of node.children) mirror(c);
}
async function build(n) {
  if (n.rule) return rect('Rule', { fill: 'color.border', h: 'border-width.default' });
  if (n.kind === 'stack' || n.kind === 'row') {
    const row = n.kind === 'row';
    const C = S.cards.instruction;
    const b = box(row ? 'Row' : 'Stack', n.surface ? { dir: row ? 'row' : undefined, wrap: n.wrap, fill: C.fill, stroke: C.stroke, strokeWidth: C.strokeWidth, radius: C.radius, pad: C.pad, gap: n.gap } : { dir: row ? 'row' : undefined, wrap: n.wrap, fill: n.fill, gap: n.gap, pad: n.pad, radius: n.radius });
    align(b, n.align, row);
    for (const k of n.children) place(b, await build(k), k);
    return b;
  }
  if (n.kind === 'text') return text(n.text, { name: 'Text', style: 'text-style.' + n.style.replace('font.size.', ''), color: n.color });
  const i = await instanceOf(n.set, n.variant);
  if (!i) return rect('Missing ' + n.set, {});
  i.name = n.set;
  if (n.ratio) later.push(() => { i.layoutSizingVertical = 'FIXED'; i.resize(i.width, i.width / n.ratio); });
  for (const [k, v] of Object.entries(n.text || {})) await put(i, k, v);
  for (const [k, v] of Object.entries(n.show || {})) await put(i, k, v);
  for (const key of n.hide || []) {
    const m = /^(?:(.+)\\/)?([^\\[]+)(?:\\[(\\d+)\\])?$/.exec(key);
    const scope = m[1] ? i.findOne((x) => x.name === m[1]) : i;
    const part = scope && scope.findAll((x) => x.name === m[2])[m[3] ? +m[3] : 0];
    if (part) { let group = null; try { group = part.parent; } catch (e) {} part.visible = false; if (group && group.type === 'INSTANCE') { try { await closeGroup(group); } catch (e) {} } } else report.problems.push(n.set + ': nothing to hide named ' + key);
  }
  for (const key of n.clear || []) {
    const m = /^(?:(.+)\\/)?([^\\[]+)(?:\\[(\\d+)\\])?$/.exec(key);
    const scope = m[1] ? i.findOne((x) => x.name === m[1]) : i;
    const part = scope && scope.findAll((x) => x.name === m[2])[m[3] ? +m[3] : 0];
    if (part && 'fills' in part) part.fills = []; else report.problems.push(n.set + ': nothing to clear named ' + key);
  }
  for (const [path, name] of Object.entries(n.icons || {})) {
    let layer = i;
    for (const step of path.split('/')) layer = layer && layer.findOne((x) => x.name === step);
    const icons = figma.root.children.find((p) => p.name === 'Icons');
    if (icons) await icons.loadAsync();
    const set = icons && icons.findOne((x) => x.type === 'COMPONENT_SET' && x.name === name);
    const target = set && (set.children.find((c) => c.name === 'Size=default') || set.defaultVariant);
    if (layer && layer.type === 'INSTANCE' && target) layer.swapComponent(target); else report.problems.push(n.set + ': cannot show icon ' + name + ' at ' + path);
  }
  for (const [name, kids] of Object.entries(n.slots || {})) {
    const slot = i.findOne((x) => x.type === 'SLOT' && x.name === name);
    if (!slot) { report.problems.push(n.set + ': no slot ' + name); continue; }
    for (const c of [...slot.children]) c.remove();
    for (const k of kids) place(slot, await build(k), k);
    slot.visible = kids.length > 0;
    if (n.set === 'Direction') for (const c of slot.children) mirror(c);
  }
  return i;
}
async function screen(c) {
  const C = S.cards.instruction;
  const f = box('Screen', { fill: c.screen.fill, stroke: C.stroke, strokeWidth: C.strokeWidth, radius: C.radius, pad: c.screen.pad, width: spanPx(c.span, inner) });
  f.clipsContent = true;
  align(f, c.screen.align, false);
  for (const n of c.children) place(f, await build(n), n);
  for (const apply of later.splice(0)) apply();
  return f;
}
`;

const PATTERN_DRAW = `async function draw(d) {
  let doc = page.children.find((n) => n.name === d.name && n.type === 'FRAME');
  let body, h;
  if (d.append) {
    if (!doc) throw new Error(d.name + ': draw its first part before this one');
    body = doc.children.find((n) => n.name === 'Body');
  } else {
    for (const n of page.children.filter((n) => n.name === d.name && n.type === 'FRAME').slice(1)) n.remove();
    const at = doc ? { x: doc.x, y: doc.y } : { x: page.children.reduce((m, n) => Math.max(m, n.x + n.width + cfg.px.docGap), 0), y: 0 };
    if (doc) doc.remove();
    doc = docFrame(d.name);
    doc.x = at.x; doc.y = at.y;
    page.appendChild(doc);
    h = await cover(doc, d);
    body = box('Body', { pad: S.body.pad, gap: S.body.gap });
    doc.appendChild(body); fillW(body);
  }
  const fresh = [];
  for (const sec of d.sections) {
    const s = box('Section', { gap: S.section.gap });
    body.appendChild(s); fillW(s);
    const t = await text(sec.title, { name: 'SectionTitle', size: S.section.title.size, color: S.section.title.color, width: inner });
    s.appendChild(t); fillW(t);
    const row = box('Cards', { dir: 'row', wrap: true, gapPx: cfg.px.gutter });
    s.appendChild(row); fillW(row);
    for (const c of sec.cards) row.appendChild(await (c.type === 'screen' ? screen(c) : card(c)));
    fresh.push(s);
  }
  if (h) rings(h);
  if (d.append) for (const s of fresh) report.zeros += await bindZeros(s); else report.zeros += await bindZeros(doc);
  report.docs.push({ name: d.name, id: doc.id, size: [Math.round(doc.width), Math.round(doc.height)], sections: d.sections.length });
}
`;

const PATTERN_RUNTIME = RUNTIME.slice(0, RUNTIME.indexOf('async function draw(d) {')).replace('const report = { page: cfg.page,', 'const report = { problems: [], page: cfg.page,')
  + SCREEN + PATTERN_DRAW + RUNTIME.slice(RUNTIME.indexOf('for (const d of cfg.docs'));

// The runtime is the same for every doc, so it is pasted once (patterns-runtime.js) and kept in the file as hidden text,
// in chunks small enough for a text layer; each part then carries only its data, checks the stored runtime against its
// checksum and runs it. patterns-runtime-remove.js deletes the text again, so the file keeps no code.
const RUNTIME_NODE = 'Pattern runtime';
const RUNTIME_CHUNK = 8000;
const RUNTIME_SUM = sumOf(PATTERN_RUNTIME);
const RUNTIME_CHUNKS = PATTERN_RUNTIME.match(new RegExp(`[\\s\\S]{1,${RUNTIME_CHUNK}}`, 'g'));
const PART_LIMIT = 12000;

const PART_LOADER = `const page0 = figma.root.children.find((p) => p.name === cfg.page);
if (!page0) throw new Error('no page ' + cfg.page);
await figma.setCurrentPageAsync(page0);
const stored = page0.children.filter((n) => n.type === 'TEXT' && n.name.startsWith('${RUNTIME_NODE} ')).sort((a, b) => (a.name < b.name ? -1 : 1));
const src = stored.map((n) => n.characters).join('');
if (sumOf(src) !== cfg.rsum) throw new Error('The stored pattern runtime is missing or out of date; run patterns-runtime.js first.');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
return await new AsyncFunction('cfg', src)(cfg);
`;

const runtimeScript = (): DocFile => ({
  file: 'patterns-runtime.js', names: [],
  script: `// GENERATED by sketchbook sync patterns (the runtime every part uses, pasted once). Run it first with the Figma MCP use_figma tool; patterns-runtime-remove.js deletes it again.\nconst CHUNKS = ${JSON.stringify(RUNTIME_CHUNKS)};\nconst RSUM = ${RUNTIME_SUM};\n${SUM}if (sumOf(CHUNKS.join('')) !== RSUM) throw new Error('This script was altered when pasted (checksum mismatch); paste the file exactly.');
const page = figma.root.children.find((p) => p.name === '${PATTERNS_PAGE}');
if (!page) throw new Error('no page ${PATTERNS_PAGE}');
await figma.setCurrentPageAsync(page);
for (const n of page.children.filter((x) => x.type === 'TEXT' && x.name.startsWith('${RUNTIME_NODE} '))) n.remove();
const font = { family: 'Inter', style: 'Regular' };
await figma.loadFontAsync(font);
const made = [];
CHUNKS.forEach((chunk, i) => {
  const t = figma.createText();
  t.name = '${RUNTIME_NODE} ' + String(i + 1).padStart(2, '0');
  t.fontName = font;
  t.characters = chunk;
  t.textAutoResize = 'NONE';
  t.resize(10, 10);
  t.x = -200;
  t.y = -200 - i * 12;
  page.appendChild(t);
  t.visible = false;
  made.push(t.id);
});
const back = page.children.filter((x) => x.type === 'TEXT' && x.name.startsWith('${RUNTIME_NODE} ')).sort((a, b) => (a.name < b.name ? -1 : 1)).map((n) => n.characters).join('');
return { chunks: made.length, length: back.length, ok: sumOf(back) === RSUM };
`,
});

const runtimeRemoveScript = (): DocFile => ({
  file: 'patterns-runtime-remove.js', names: [],
  script: `// GENERATED by sketchbook sync patterns (removes the stored runtime). Run it last with the Figma MCP use_figma tool.
const page = figma.root.children.find((p) => p.name === '${PATTERNS_PAGE}');
if (!page) return { removed: 0 };
await figma.setCurrentPageAsync(page);
const stored = page.children.filter((x) => x.type === 'TEXT' && x.name.startsWith('${RUNTIME_NODE} '));
for (const n of stored) n.remove();
return { removed: stored.length };
`,
});

const SHELL_USED = ['doc', 'header', 'body', 'section', 'cards', 'caption', 'tag'];

const slim = (n: unknown): SlimNode => {
  const o: SlimNode = {};
  if (!isRecord(n)) return o;
  for (const [k, v] of Object.entries(n)) {
    if (k === 'component' || v === null || (k === 'wrap' && v === false) || (k === 'width' && v === 'hug') || (k === 'align' && v === 'start')) continue;
    if (n.kind === 'component' && ['text', 'show', 'slots', 'hide', 'clear'].includes(k) && !sizeOf(v)) continue;
    if (k === 'surface' && v === false) continue;
    o[k] = k === 'children' && Array.isArray(v) ? v.map(slim) : k === 'slots' && isRecord(v) ? Object.fromEntries(Object.entries(v).map(([name, list]) => [name, Array.isArray(list) ? list.map(slim) : list])) : v;
  }
  return o;
};
const slimSection = (sec: DocSection): SlimSection => ({ ...sec, cards: sec.cards.map((c) => (c.type === 'screen' ? { ...c, children: c.children.map(slim) } : c)) });

const count = (nodes: ScreenNode[]): number => nodes.reduce((n, x) => n + (x.kind === 'component' ? 1 + Object.values(x.slots).reduce((m, k) => m + count(k), 0) : 'children' in x ? count(x.children) : 0), 0);
const texts = (nodes: ScreenNode[]): (string | Record<string, string>)[] => nodes.flatMap((x) => (x.kind === 'text' ? [x.text] : x.kind === 'component' ? [...Object.entries(x.text).filter(([k, t]) => typeof t === 'string' && !/^[0-9.]+%$/.test(t) && !/(^|\/)Variant$/.test(k)).map(([, t]) => t), ...Object.values(x.slots).flatMap(texts)] : texts(x.children)));
const sets = (nodes: ScreenNode[]): string[] => nodes.flatMap((x) => (x.kind === 'component' ? [x.set, ...Object.values(x.slots).flatMap(sets)] : 'children' in x ? sets(x.children) : []));

export async function patternScripts(root: string, ids: string[]): Promise<DocFile[]> {
  const model = await figmaModel(root);
  const docs: (DocBlueprint & { id: string })[] = [];
  for (const id of ids) docs.push({ ...(await patternDoc(root, id)), id });
  const base = await docsData(root, PATTERNS_PAGE, {});
  const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
  base.codeFamilies = [designFamily(base.codeFamilies, designFonts(config))];
  const scriptOf = (g: Omit<PatternUnit, 'id'>[], i: number, n: number, file = `patterns-${i + 1}.js`): DocFile => {
    const { doc: _doc, ...rest } = base;
    const data = { ...rest, docs: g };
    const shell = Object.fromEntries(SHELL_USED.filter((k) => data.shell[k]).map((k) => [k, data.shell[k]]));
    const { pages: _pages, textStyles: _textStyles, ...kept } = data;
    const { effects: _effects, ...look } = lookups(model, { ...data, shell });
    const styles = new Set((JSON.stringify(g).match(/"style":"font\.size\.[a-z0-9-]+"/g) ?? []).map((m) => `text-style.${m.slice(19, -1)}`));
    const cfg = { ...kept, shell, ...look, textByToken: Object.fromEntries(Object.entries(look.textByToken).filter(([token]) => styles.has(token))), sum: sumOf(JSON.stringify([g, look.Z])), rsum: RUNTIME_SUM };
    const names = [...new Set(g.map((d) => d.name))];
    return { file, names, script: `// GENERATED by sketchbook sync patterns (part ${i + 1} of ${n}: ${names.join(', ')}). Run with the Figma MCP use_figma tool, parts in order.\nconst cfg = ${JSON.stringify(cfg)};\n${SUM}if (sumOf(JSON.stringify([cfg.docs, cfg.Z])) !== cfg.sum) throw new Error('This script was altered when pasted (checksum mismatch); paste the file exactly.');\n${PART_LOADER}` };
  };
  const units: PatternUnit[] = [];
  for (const { id, ...d } of docs) {
    let cur: PatternUnit = { ...d, sections: [], id };
    for (const sec of d.sections.map(slimSection)) {
      const next = { ...cur, sections: [...cur.sections, sec] };
      if (cur.sections.length && scriptOf([next], 0, 99).script.length > PART_LIMIT) { units.push(cur); cur = { name: d.name, append: true, sections: [sec], id }; } else cur = next;
    }
    units.push(cur);
  }
  const parts: Record<string, number> = {};
  const scripts = [runtimeScript(), ...units.map((u, i) => {
    const { id, ...unit } = u;
    parts[id] = (parts[id] ?? 0) + 1;
    return scriptOf([unit], i, units.length, `patterns-${id}-${parts[id]}.js`);
  })];
  const verified = { page: PATTERNS_PAGE, docs: docs.map((d) => ({ name: d.name, sections: d.sections.map((s) => s.title), screens: d.sections.flatMap((s) => s.cards.flatMap((c) => (c.type === 'screen' ? [{ title: s.title, instances: count(c.children), sets: sets(c.children).sort(), texts: texts(c.children) }] : []))) })) };
  const expected = { ...verified, sum: sumOf(JSON.stringify(verified)) };
  scripts.push({ file: 'patterns-verify.js', names: [], script: `// GENERATED by sketchbook sync patterns (read-only read-back). Run with the Figma MCP use_figma tool.\nconst cfg = ${JSON.stringify(expected)};\n${SUM}${VERIFY}` });
  scripts.push(runtimeRemoveScript());
  return scripts;
}

const VERIFY = `if (sumOf(JSON.stringify({ page: cfg.page, docs: cfg.docs })) !== cfg.sum) throw new Error('This script was altered when pasted (checksum mismatch); paste the file exactly.');
const page = figma.root.children.find((p) => p.name === cfg.page);
if (!page) return { ok: false, problems: ['no page "' + cfg.page + '"'] };
await figma.setCurrentPageAsync(page);
const problems = [];
let instances = 0;
const setOf = async (i) => { const m = await i.getMainComponentAsync(); return m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name) : '?'; };
for (const d of cfg.docs) {
  const doc = page.children.find((n) => n.type === 'FRAME' && n.name === d.name);
  if (!doc) { problems.push(d.name + ': doc missing'); continue; }
  const body = doc.children.find((n) => n.name === 'Body');
  const sections = body ? body.children.filter((n) => n.name === 'Section') : [];
  const titles = sections.map((s) => (s.children.find((n) => n.name === 'SectionTitle') || {}).characters);
  if (JSON.stringify(titles) !== JSON.stringify(d.sections)) problems.push(d.name + ': sections ' + titles.join(', ') + ', expected ' + d.sections.join(', '));
  for (const want of d.screens) {
    const sec = sections.find((s) => (s.children.find((n) => n.name === 'SectionTitle') || {}).characters === want.title);
    const screen = sec && sec.findOne((n) => n.name === 'Screen');
    const at = d.name + ' / ' + want.title;
    if (!screen) { problems.push(at + ': screen missing'); continue; }
    const inst = screen.findAll((n) => n.type === 'INSTANCE');
    const mains = [];
    for (const i of inst) mains.push(await setOf(i));
    const top = inst.filter((i) => { let p = i.parent; while (p && p !== screen) { if (p.type === 'SLOT') return true; if (p.type === 'INSTANCE') return false; p = p.parent; } return true; });
    const ownSets = [];
    for (const i of top) ownSets.push(await setOf(i));
    instances += top.length;
    const got = {};
    for (const s of ownSets) got[s] = (got[s] || 0) + 1;
    const need = {};
    for (const s of want.sets) need[s] = (need[s] || 0) + 1;
    for (const s of new Set([...Object.keys(need), ...Object.keys(got)])) if ((need[s] || 0) !== (got[s] || 0)) problems.push(at + ': ' + (got[s] || 0) + ' ' + s + ', expected ' + (need[s] || 0));
    const chars = new Set(screen.findAll((n) => n.type === 'TEXT').map((t) => t.characters));
    for (const t of want.texts) if (!chars.has(t)) problems.push(at + ': text "' + t + '" not shown');
    const box = screen.absoluteBoundingBox;
    for (const n of screen.findAll((x) => x.visible && x.absoluteBoundingBox)) {
      const b = n.absoluteBoundingBox;
      if (b.x + b.width > box.x + box.width + 1 || b.y + b.height > box.y + box.height + 1 || b.x < box.x - 1 || b.y < box.y - 1) { problems.push(at + ': ' + n.name + ' spills out of the screen'); break; }
    }
    for (const n of screen.findAll((x) => x.visible && x.absoluteBoundingBox)) {
      let a = n.parent;
      while (a && a !== screen && !(a.clipsContent && a.absoluteBoundingBox)) a = a.parent;
      if (!a || a === screen) continue;
      const b = n.absoluteBoundingBox, c = a.absoluteBoundingBox;
      if (b.x + b.width > c.x + c.width + 2 || b.x < c.x - 2 || b.y + b.height > c.y + c.height + 2 || b.y < c.y - 2) { problems.push(at + ': ' + n.name + ' is cropped by ' + a.name); break; }
    }
    if (mains.includes('?')) problems.push(at + ': an instance lost its component');
  }
}
return { ok: !problems.length, docs: cfg.docs.length, instances, problems: problems.slice(0, 20), more: Math.max(0, problems.length - 20) };
`;
