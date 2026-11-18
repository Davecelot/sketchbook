import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss, { type Root } from 'postcss';
import { kitManifestOf, type Kit } from '../commands/catalog.mjs';
import { errorMessage, harnessPath, parseJson } from '../lib/files.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';
import { VAR_REF, allowedLiteral, cssVarName, literalsIn } from '../lib/css.mjs';

export const id = 'K1';
export const title = 'Patterns use only the system: its elements and semantic tokens';

const DIR = 'src/patterns';
const INDEX = 'harness/kits/index.json';
type StyleKey = 'gap' | 'pad' | 'fill' | 'radius' | 'color' | 'style';
interface LayoutNode extends Partial<Record<StyleKey, string>> { use?: string; component?: string; stack?: LayoutNode[]; row?: LayoutNode[]; slots?: Record<string, LayoutNode | LayoutNode[]> }
interface Layout { screen?: { fill?: string; pad?: string }; parts?: Record<string, LayoutNode>; states?: Record<string, LayoutNode[]> }
interface Pattern { name?: string; summary?: string; components?: string[]; landmarks?: string[]; a11y?: string[]; states?: string[]; layout?: Layout }
type PatternField = Exclude<keyof Pattern, 'layout'>;

const FIELDS: [PatternField, 'string' | 'array'][] = [['name', 'string'], ['summary', 'string'], ['components', 'array'], ['landmarks', 'array'], ['a11y', 'array'], ['states', 'array']];
const SCREEN_KEYS: ('fill' | 'pad')[] = ['fill', 'pad'];
const STYLE_KEYS: StyleKey[] = ['gap', 'pad', 'fill', 'radius', 'color', 'style'];

const kebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const lineOf = (text: string, index: number): number => text.slice(0, index).split('\n').length;
const sameSet = (a: string[], b: string[]): boolean => a.length === b.length && a.every((x) => b.includes(x));

const dirs = (abs: string): string[] => {
  try { return readdirSync(abs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort(); } catch { return []; }
};

export function run({ root, config, all }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const warnings: CheckIssue[] = [];
  const prefix = config.prefix;
  const kits = dirs(join(root, DIR));

  const owner = new Map<string, string>();
  for (const { name, contract } of all.contracts) for (const tag of [contract?.tag, ...(contract?.elements || []).map((e) => e.tag)]) if (tag) owner.set(tag, name);
  const vars = (layer: 'semantic' | 'component') => new Set(all.sets.filter((s) => s.layer === layer).flatMap((s) => s.tokens.map((t) => cssVarName(prefix, t.path))));
  const semantic = vars('semantic');
  const component = vars('component');

  let index: Kit[] = [];
  try { index = parseJson<{ kits?: Kit[] }>(readFileSync(harnessPath(root, 'kits/index.json'), 'utf8')).kits ?? []; } catch {
    if (kits.length) errors.push({ file: INDEX, msg: 'missing or not JSON', fix: 'List every kit in harness/kits/index.json as {id, title, summary, path, components}.' });
  }

  const tagRe = new RegExp(`<(${prefix}-[a-z0-9-]+)`, 'g');
  for (const kit of kits) {
    const base = `${DIR}/${kit}`;
    const files = readdirSync(join(root, base));
    const used = new Set<string>();
    const states: string[] = [];
    const stories = files.filter((f) => f.endsWith('.stories.ts'));
    if (!stories.length) errors.push({ file: base, msg: 'kit has no stories', fix: 'Add <Kit>.stories.ts with a Patterns/<Kit> title.' });
    for (const f of stories) {
      const file = `${base}/${f}`;
      const text = readFileSync(join(root, file), 'utf8');
      for (const m of text.matchAll(tagRe)) {
        const tag = m[1] ?? '';
        used.add(tag);
        if (!owner.has(tag)) errors.push({ file, line: lineOf(text, m.index), token: tag, msg: 'is not a component (no contract has this tag or element)', fix: 'Compose existing components only; a new one goes through contract-first first.' });
      }
      for (const m of text.matchAll(/\sstyle=|<style[\s>]/g)) errors.push({ file, line: lineOf(text, m.index), msg: 'inline style in a pattern story', fix: `Put layout in the kit stylesheet (${kit}.css) with semantic tokens.` });
      for (const m of text.matchAll(/^export const (\w+)\s*[:=]/gm)) states.push(kebab(m[1] ?? ''));
    }

    const pfile = `${base}/pattern.json`;
    let pattern: Pattern | null | undefined;
    try { pattern = parseJson<Pattern | null>(readFileSync(join(root, pfile), 'utf8')); } catch {
      errors.push({ file: pfile, msg: 'missing or not JSON', fix: 'Add pattern.json: {name, summary, components, landmarks, a11y, states}.' });
    }
    if (pattern) {
      for (const [field, type] of FIELDS) {
        const value = pattern[field];
        const ok = type === 'array' ? Array.isArray(value) : typeof value === 'string' && value.trim();
        if (!ok) errors.push({ file: pfile, token: field, msg: `needs a ${type} "${field}"`, fix: 'Fill in every field of pattern.json.' });
      }
      const listed = Array.isArray(pattern.components) ? pattern.components : [];
      for (const tag of used) if (!listed.includes(tag)) errors.push({ file: pfile, token: tag, msg: 'is used by the stories but missing from components', fix: 'List exactly the tags the stories use.' });
      for (const tag of listed) if (!used.has(tag)) errors.push({ file: pfile, token: tag, msg: 'is listed in components but not used by the stories', fix: 'List exactly the tags the stories use.' });
      const declared = Array.isArray(pattern.states) ? pattern.states : [];
      for (const s of states) if (!declared.includes(s)) errors.push({ file: pfile, token: s, msg: `story ${s} is not listed in states`, fix: 'states lists every story, kebab-case (the story id suffix).' });
      for (const s of declared) if (!states.includes(s)) errors.push({ file: pfile, token: s, msg: 'state has no story', fix: 'Add the story or remove the state.' });
    }

    if (pattern?.layout) {
      const L = pattern.layout;
      const declared = Array.isArray(pattern.states) ? pattern.states : [];
      const names = new Set([...used].map((t) => owner.get(t)));
      for (const s of declared) if (!L.states?.[s]) errors.push({ file: pfile, token: s, msg: `layout has no state ${s}`, fix: 'layout.states has one tree per state in states.' });
      for (const s of Object.keys(L.states ?? {})) if (!declared.includes(s)) errors.push({ file: pfile, token: s, msg: `layout state ${s} is not listed in states`, fix: 'Remove it or add the story.' });
      const token = (value: string | undefined, where: string) => { if (value && !semantic.has(cssVarName(prefix, value))) errors.push({ file: pfile, token: value, msg: `${where} is not a semantic token`, fix: 'Layout tokens are semantic paths such as space.stack.lg.' }); };
      for (const key of SCREEN_KEYS) token(L.screen?.[key], `screen.${key}`);
      const walk = (node: LayoutNode, seen: Set<string>): void => {
        if (node.use) {
          const part = L.parts?.[node.use];
          if (!part) errors.push({ file: pfile, token: node.use, msg: 'layout uses a part that is not in parts', fix: 'Add it to layout.parts.' });
          else if (!seen.has(node.use)) { seen.add(node.use); walk(part, seen); }
          return;
        }
        for (const key of STYLE_KEYS) token(node[key], key);
        if (node.component && !names.has(node.component.split('/')[0])) errors.push({ file: pfile, token: node.component, msg: 'layout draws a component the stories do not use', fix: 'List it by using it in the stories, or remove it from the layout.' });
        for (const kid of [...(node.stack ?? []), ...(node.row ?? []), ...Object.values(node.slots ?? {}).flat()]) walk(kid, seen);
      };
      for (const nodes of Object.values(L.states ?? {})) for (const n of nodes) walk(n, new Set<string>());
    }

    for (const f of files.filter((x) => x.endsWith('.css'))) {
      const file = `${base}/${f}`;
      let ast: Root;
      try { ast = postcss.parse(readFileSync(join(root, file), 'utf8'), { from: file }); } catch (e) { errors.push({ file, msg: `CSS does not parse: ${errorMessage(e)}`, fix: 'Fix the CSS syntax.' }); continue; }
      ast.walkDecls((decl) => {
        const line = decl.source?.start?.line;
        if (decl.prop.startsWith(`--${prefix}-`)) errors.push({ file, line, token: decl.prop, msg: `${decl.prop} redefines a system token`, fix: 'Change tokens through the spec, not in a pattern.' });
        for (const [, name = ''] of decl.value.matchAll(VAR_REF)) {
          if (name.startsWith('--_') || semantic.has(name)) continue;
          const msg = component.has(name) ? `${name} is a component token; patterns use semantic tokens only` : `${name} is not a semantic token`;
          errors.push({ file, line, token: name, msg, fix: 'Use a semantic token (--sb-color-*, --sb-space-*, --sb-radius-*, ...); a component styles itself.' });
        }
        const allowed = allowedLiteral(decl);
        for (const l of literalsIn(decl)) {
          const item = { file, line, token: `${decl.prop}: ${decl.value}`, msg: `${l.what} "${l.match}"`, fix: l.fix };
          if (allowed) warnings.push({ ...item, msg: `${item.msg} allowed by sketchbook-allow-literal comment` });
          else errors.push(item);
        }
      });
    }

    const entry = index.find((k) => k.id === kit);
    if (!entry) { errors.push({ file: INDEX, token: kit, msg: 'kit is not listed', fix: `Add {id: "${kit}", title, summary, path: "${base}", components}.` }); continue; }
    const names = [...new Set([...used].map((t) => owner.get(t)).filter((n): n is string => !!n))].sort();
    if (entry.path !== base) errors.push({ file: INDEX, token: kit, msg: `path is "${entry.path}", not "${base}"`, fix: 'Point path at the kit folder.' });
    if (pattern && (entry.title !== pattern.name || entry.summary !== pattern.summary)) errors.push({ file: INDEX, token: kit, msg: 'title and summary differ from pattern.json name and summary', fix: 'Copy them from pattern.json.' });
    if (!sameSet(entry.components ?? [], names)) errors.push({ file: INDEX, token: kit, msg: `components ${JSON.stringify(entry.components)} should be ${JSON.stringify(names)}`, fix: 'List the component folders (spec/components/<name>) the kit uses.' });
  }
  // A listed kit that is not in src/patterns is fine while the catalog can install it (sketchbook kits add, SB-0045).
  for (const k of index) if (!kits.includes(k.id) && !kitManifestOf(root, k.id)) errors.push({ file: INDEX, token: k.id, msg: 'lists a kit that does not exist (not installed, not in harness/catalog/kits)', fix: `Remove it, add ${DIR}/${k.id}, or run npm run catalog:build where it exists.` });
  return { errors, warnings };
}
