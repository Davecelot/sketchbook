// Guards: the docs site's hand-written reference lists and internal links stay true to the repository
// (the check list once said 22 checks when there were 25).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECKS } from '../checks/run.mjs';
import { sourceRepoOnly } from './helpers.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

test('README check counts match the site statistic', sourceRepoOnly, async () => {
  const readme = await readFile(`${ROOT}README.md`, 'utf8');
  const counts = (text: string) => [...text.matchAll(/checks-(\d+)%20deterministic|\b(\d+) (?:deterministic )?checks\b/g)]
    .map((m) => Number(m[1] ?? m[2]));
  assert.equal(counts(readme).length, 4, 'keep every README check-count claim covered');
  assert.deepEqual(counts(readme), Array(4).fill(CHECKS.length));
  assert.notDeepEqual(counts(readme.replace(`${CHECKS.length} deterministic checks`, `${CHECKS.length - 1} deterministic checks`)), Array(4).fill(CHECKS.length));
});

test('apps/docs/content/reference/checks.md lists every check and only real ones', sourceRepoOnly, async () => {
  const page = await readFile(`${ROOT}apps/docs/content/reference/checks.md`, 'utf8');
  const documented = [...page.matchAll(/^\| ([A-Z]\d+) \|/gm)].map((m) => m[1]).sort();
  assert.deepEqual(documented, CHECKS.map((c) => c.id).sort());
});

test('apps/docs/content/reference/rules.md has one section per rule file', sourceRepoOnly, async () => {
  const page = await readFile(`${ROOT}apps/docs/content/reference/rules.md`, 'utf8');
  const documented = [...page.matchAll(/^## (\S+)$/gm)].map((m) => m[1]).sort();
  const files = (await readdir(`${ROOT}.claude/rules`)).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort();
  assert.deepEqual(documented, files);
});

const slug = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
async function* mdFiles(dir: string): AsyncGenerator<string> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('_')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* mdFiles(p);
    else if (e.name.endsWith('.md')) yield p;
  }
}

test('internal links and anchors in docs app sources resolve', sourceRepoOnly, async () => {
  const site = `${ROOT}apps/docs/content`;
  const pages = new Map<string, { file: string; text: string; ids: Set<string> } | null>();
  for await (const file of mdFiles(site)) {
    const rel = file.slice(site.length + 1, -3);
    const url = rel === 'index' ? '/' : rel.endsWith('/index') ? `/${rel.slice(0, -6)}/` : `/${rel}/`;
    const text = await readFile(file, 'utf8');
    const ids = new Set([...text.matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug((m[1] ?? '').replace(/[`*]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'))));
    pages.set(url, { file: rel, text, ids });
  }
  const generator = await readFile(`${ROOT}apps/docs/scripts/docs-site.mjs`, 'utf8');
  for (const [, s] of generator.matchAll(/slug: '([\w-]+)'/g)) pages.set(`/cli/${s}/`, null);
  for (const [, source, asset] of generator.matchAll(/await cp\('([^']+)', `\$\{OUT\}\/assets\/([^`]+)`\)/g)) {
    // The docs build produces the bundle before running the generator. The harness suite also runs from a clean checkout.
    if (source !== 'dist/sketchbook.js') await readFile(join(ROOT, source!));
    pages.set(`/assets/${asset}`, null);
  }
  const bad: string[] = [];
  for (const entry of pages.values()) {
    if (!entry) continue;
    const body = entry.text.replace(/```[\s\S]*?```/g, '');
    for (const [, target] of body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
      const [path = '', hash] = (target ?? '').split('#');
      const page = pages.get(path);
      if (page === undefined) bad.push(`${entry.file}: ${target} (no such page)`);
      else if (hash && page && !page.ids.has(hash)) bad.push(`${entry.file}: ${target} (no such heading)`);
    }
  }
  assert.deepEqual(bad, []);
});


test('the project getting-started guide uses the installed CLI and matches its source', sourceRepoOnly, async () => {
  const source = await readFile(`${ROOT}docs/getting-started.md`, 'utf8');
  const template = await readFile(`${ROOT}harness/templates/project/docs/getting-started.md`, 'utf8');
  assert.equal(template, source);
  assert.doesNotMatch(template, /node harness\/cli\.mjs/);
  assert.match(template, /npx sketchbook explain/);
});
