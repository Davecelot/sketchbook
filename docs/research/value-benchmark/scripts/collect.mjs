// usage: node collect.mjs <bench-root> <out.tsv>   scores every finished run in <bench-root>/runs
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [bench, out] = process.argv.slice(2);
const here = fileURLToPath(new URL('.', import.meta.url));
const node = (script, ...args) => {
  const r = spawnSync('node', [join(here, script), ...args], { encoding: 'utf8', timeout: 180000 });
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return { error: (r.stderr || r.stdout || '').slice(0, 200) }; }
};
const rows = [];
for (const f of readdirSync(join(bench, 'runs')).filter((n) => n.endsWith('.jsonl')).sort()) {
  const id = f.replace('.jsonl', '');
  const [task, arm, model, rep] = id.split('-');
  if (task === 'probe') continue;
  const m = node('parse-run.mjs', join(bench, 'runs', f));
  const dir = join(bench, 'runs', id);
  let s = {};
  const t0 = Date.now();
  if (existsSync(dir)) {
    if (task === 'author') s = node('score-author.mjs', dir, join(bench, 'tpl', `author-${arm === 'a1' || arm === 'n' ? 'a3' : arm}`));
    if (task === 'qa') s = node('score-qa.mjs', dir);
    if (task === 'ui') { const shots = join(bench, 'shots', id); mkdirSync(shots, { recursive: true }); s = node('score-ui.mjs', dir, shots); }
  }
  rows.push({ id, task, arm, model, rep, ...m, ...s, scorerMs: Date.now() - t0 });
}
const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((c) => !['changed', 'errorList'].includes(c));
const cell = (v) => (v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));
writeFileSync(out, [cols.join('\t'), ...rows.map((r) => cols.map((c) => cell(r[c])).join('\t'))].join('\n') + '\n');
console.log(`${rows.length} rows -> ${out}`);
