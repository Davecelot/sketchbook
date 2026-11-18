// Figma design adapter, sync: writes the use_figma scripts an agent runs through the Figma MCP (one call per script,
// never in parallel). Recording what reached the file is tool-neutral: harness/lib/design/sync.mjs.
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { designOf } from '../../../lib/design/sync.mjs';
import { expandPages } from '../../../lib/design/docs.mjs';
import { brandScript, componentScripts, docsSpec, foundationScripts, foundationsVerifyScript, guideScript, themeMatrixScripts } from './docs.mjs';
import { iconScripts } from './icons.mjs';
import { patternScripts } from './patterns.mjs';
import { patternIds } from '../../../lib/design/patterns.mjs';
import { describeScripts, layoutScript, libraryScripts, stemOf, verifyAllScript } from './library.mjs';
import { loadApi, withSets } from '../../../lib/api.mjs';
import { FOUNDATION_PAGES } from '../../../lib/design/verify.mjs';
import { coverage, figmaModel, snapshotOf, stylesScript, variableParts, variablesScript, verifyScript } from './variables.mjs';
import type { Snapshot } from './variables.mjs';
import { parseJson } from '../../../lib/files.mjs';
import type { Progress } from '../../../lib/design/sync.mjs';
import type { SkippedToken } from '../../../lib/design/tokens.mjs';

export const OUT = 'generated/design/figma';
export const TARGETS = ['tokens', 'pages', 'brand', 'guide', 'foundations', 'icons', 'library', 'describe', 'verify-library', 'layout', 'theme-matrix', 'components', 'patterns'];
export const PUSHED = `${OUT}/pushed.json`;

export interface Prepared { written: string[]; skipped: string[] | SkippedToken[]; delta: boolean; coverage: { total: number; missing: string[] } }

const readPushed = async (root: string): Promise<Snapshot | null> => { try { return parseJson<Snapshot>(await readFile(join(root, PUSHED), 'utf8')); } catch { return null; } };

// After every script ran without errors (sync stamp tokens): what is now in the file.
export async function writePushed(root: string): Promise<string> {
  await mkdir(join(root, OUT), { recursive: true });
  await writeFile(join(root, PUSHED), JSON.stringify(snapshotOf(await figmaModel(root))) + '\n');
  return PUSHED;
}

// The library sets drawn so far (progress past "planned"), with their element sets; or the names given.
export async function drawnSets(root: string, names: string[] = []): Promise<string[]> {
  if (names.length) return names;
  const progress = parseJson<Pick<Progress, 'components'>>(await readFile(join(root, 'generated/design/progress.json'), 'utf8').catch(() => '{"components":{}}')).components;
  const drawn = withSets(loadApi(root), Object.entries(progress).filter(([, p]) => p.stage !== 'planned').map(([n]) => n));
  if (!drawn.length) throw Object.assign(new Error('No component is drawn yet.'), { fix: 'sketchbook sync library button' });
  return drawn;
}

// full: every variable; otherwise only what changed since the last stamp (everything when nothing was stamped).
export async function prepare(root: string, what: string, { full = false, names = [], detail = null }: { full?: boolean; names?: string[]; detail?: string | null } = {}): Promise<Prepared> {
  await designOf(root);
  if (!TARGETS.includes(what)) throw Object.assign(new Error(`The Figma adapter does not render "${what}" yet.`), { fix: `Use ${TARGETS.join(', ')} or verify.` });
  if (what === 'foundations') {
    await mkdir(join(root, OUT, 'docs'), { recursive: true });
    const written: string[] = [];
    const groups = await foundationScripts(root, FOUNDATION_PAGES);
    for (const [i, g] of groups.entries()) {
      const file = `foundations-${i + 1}.js`;
      await writeFile(join(root, OUT, 'docs', file), g.script);
      written.push(`${OUT}/docs/${file} (${g.names.join(', ')})`);
    }
    await writeFile(join(root, OUT, 'docs', 'foundations-verify.js'), foundationsVerifyScript(groups));
    written.push(`${OUT}/docs/foundations-verify.js (read-only read-back, run last)`);
    return { written, skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'library') {
    if (!names.length) throw Object.assign(new Error('Name the component(s) to draw.'), { fix: 'sketchbook sync library spinner button input' });
    const dir = join(root, OUT, 'library');
    await mkdir(dir, { recursive: true });
    const written: string[] = [];
    const skipped: string[] = [];
    for (const name of names) {
      const r = await libraryScripts(root, name, { detail });
      for (const f of (await readdir(dir)).filter((x) => x.startsWith(`${stemOf(name)}.`))) await rm(join(dir, f));
      for (const s of r.scripts) { await writeFile(join(dir, s.file), s.script); written.push(`${OUT}/library/${s.file}`); }
      if (r.missing.length) skipped.push(...r.missing.map((m) => `${name}: ${m}`));
    }
    return { written, skipped, delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'describe') {
    const drawn = await drawnSets(root, names);
    const dir = join(root, OUT, 'library');
    await mkdir(dir, { recursive: true });
    for (const f of (await readdir(dir)).filter((x) => /^descriptions-\d+\.js$/.test(x))) await rm(join(dir, f));
    const written: string[] = [];
    for (const s of await describeScripts(root, drawn)) { await writeFile(join(dir, s.file), s.script); written.push(`${OUT}/library/${s.file} (${s.names.join(', ')})`); }
    return { written, skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'verify-library') {
    const drawn = await drawnSets(root, names);
    const dir = join(root, OUT, 'library');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'verify-all.js'), await verifyAllScript(root, drawn));
    return { written: [`${OUT}/library/verify-all.js (${drawn.join(', ')})`], skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'layout') {
    const drawn = await drawnSets(root, names);
    const dir = join(root, OUT, 'library');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'layout.js'), await layoutScript(root, drawn));
    return { written: [`${OUT}/library/layout.js (${drawn.length} sets)`], skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'icons') {
    const dir = join(root, OUT, 'icons');
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    const written: string[] = [];
    for (const [i, script] of (await iconScripts(root)).entries()) {
      const file = `${String(i + 1).padStart(2, '0')}.js`;
      await writeFile(join(dir, file), script);
      written.push(`${OUT}/icons/${file}`);
    }
    return { written, skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'theme-matrix') {
    const dir = join(root, OUT, 'docs');
    await mkdir(dir, { recursive: true });
    for (const f of (await readdir(dir)).filter((x) => x.startsWith('theme-matrix-'))) await rm(join(dir, f));
    const written: string[] = [];
    for (const s of await themeMatrixScripts(root, await drawnSets(root, names))) { await writeFile(join(dir, s.file), s.script); written.push(`${OUT}/docs/${s.file}${s.rows.length ? ` (${s.rows.join(', ')})` : ''}`); }
    return { written, skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'components') {
    const batch = names[0];
    if (names.length !== 1 || batch === undefined) throw Object.assign(new Error('Name one batch.'), { fix: `sketchbook sync components 0 (batches: ${(docsSpec(root).batches ?? []).map((b) => b.id).join(', ')})` });
    const dir = join(root, OUT, 'docs');
    await mkdir(dir, { recursive: true });
    for (const f of (await readdir(dir)).filter((x) => x.startsWith(`components-${batch}-`))) await rm(join(dir, f));
    const written: string[] = [];
    for (const s of await componentScripts(root, batch)) { await writeFile(join(dir, s.file), s.script); written.push(`${OUT}/docs/${s.file}${s.names.length ? ` (${s.names.join(', ')})` : ''}`); }
    return { written, skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'patterns') {
    const dir = join(root, OUT, 'docs');
    await mkdir(dir, { recursive: true });
    for (const f of (await readdir(dir)).filter((x) => x.startsWith('patterns-'))) await rm(join(dir, f));
    const written: string[] = [];
    for (const s of await patternScripts(root, names.length ? names : await patternIds(root))) { await writeFile(join(dir, s.file), s.script); written.push(`${OUT}/docs/${s.file}${s.names.length ? ` (${s.names.join(', ')})` : ''}`); }
    return { written, skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'brand') {
    await mkdir(join(root, OUT), { recursive: true });
    await writeFile(join(root, OUT, 'brand.js'), await brandScript(root));
    return { written: [`${OUT}/brand.js`], skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'guide') {
    await mkdir(join(root, OUT, 'docs'), { recursive: true });
    await writeFile(join(root, OUT, 'docs', 'guide.js'), await guideScript(root));
    return { written: [`${OUT}/docs/guide.js`], skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  if (what === 'pages') {
    await mkdir(join(root, OUT), { recursive: true });
    await writeFile(join(root, OUT, 'pages.js'), pagesScript(expandPages(docsSpec(root)).map((p) => p.name)));
    return { written: [`${OUT}/pages.js`], skipped: [], delta: false, coverage: { total: 0, missing: [] } };
  }
  const model = await figmaModel(root);
  const dir = join(root, OUT, 'variables');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const written: string[] = [];
  const previous = full ? null : await readPushed(root);
  for (const part of variableParts(model, previous)) {
    await writeFile(join(dir, part.file), variablesScript(part, model.hash));
    written.push(`${OUT}/variables/${part.file}`);
  }
  await writeFile(join(dir, 'styles.js'), stylesScript(model));
  written.push(`${OUT}/variables/styles.js`);
  return { written, skipped: model.skipped, delta: Boolean(previous), coverage: await coverage(root, model) };
}

export async function prepareVerify(root: string, { detail }: { detail?: string | null } = {}): Promise<string> {
  await designOf(root);
  const model = await figmaModel(root);
  if (detail && !model.combos.some((c) => c.key === detail)) throw Object.assign(new Error(`Unknown combination "${detail}".`), { fix: `Use one of: ${model.combos.map((c) => c.key).join('; ')}` });
  await rm(join(root, OUT, 'verify'), { recursive: true, force: true });
  await mkdir(join(root, OUT), { recursive: true });
  await writeFile(join(root, OUT, 'verify.js'), verifyScript(model, { detail }));
  return `${OUT}/verify.js`;
}

// The file's pages in spec order (spec/design-docs.json, batches expanded). Creates and renames, never deletes: a page
// the spec does not name stays where it is, after the spec's pages. A blank first page is reused for the first one.
export function pagesScript(names: string[]): string {
  return `// GENERATED by sketchbook sync pages. Run with the Figma MCP use_figma tool.
const names = ${JSON.stringify(names)};
const report = { created: [], renamed: [], kept: [], order: [] };
const pages = () => [...figma.root.children];
const first = pages()[0];
if (!pages().some((p) => p.name === names[0]) && first && first.children.length === 0 && !names.includes(first.name)) { report.renamed.push(first.name + ' -> ' + names[0]); first.name = names[0]; }
const used = new Set();
names.forEach((name, i) => {
  let page = pages().find((p) => p.name === name && !used.has(p.id));
  if (!page) { page = figma.createPage(); page.name = name; report.created.push(name); }
  used.add(page.id);
  figma.root.insertChild(i, page);
});
report.kept = pages().filter((p) => !used.has(p.id)).map((p) => p.name);
report.order = pages().map((p) => p.name);
return report;
`;
}
