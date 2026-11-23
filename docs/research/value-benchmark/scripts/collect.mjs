// usage: node collect.mjs <bench-root> <out.tsv>   scores every finished run in <bench-root>/runs
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
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
  const parts = id.match(/^([a-z]+)-([a-z0-9]+)-(.+)-(r\d+)$/);
  if (!parts) throw new Error(`Unexpected trial name: ${id}`);
  const [, task, arm, model, rep] = parts;
  if (task === 'probe') continue;
  const m = node('parse-run.mjs', join(bench, 'runs', f));
  const dir = join(bench, 'runs', id);
  let s = {};
  const t0 = Date.now();
  if (existsSync(dir)) {
    if (task === 'author') s = node('score-author.mjs', dir, join(bench, 'tpl', `author-${arm === 'a1' || arm === 'n' ? 'a3' : arm}`));
    if (task === 'qa') {
      const template = join(bench, 'tpl', `qa-${arm === 'a1' || arm === 'n' ? 'a3' : arm}`, 'out/settings.html');
      const review = join(bench, 'reviews', `${id}.json`);
      s = node('score-qa.mjs', dir, existsSync(template) ? template : '', ...(existsSync(review) ? [review] : []));
    }
    if (task === 'ui') { const shots = join(bench, 'shots', id); mkdirSync(shots, { recursive: true }); s = node('score-ui.mjs', dir, shots); }
  }
  const timing = join(bench, 'runs', `${id}.meta`);
  const meta = existsSync(timing) ? readFileSync(timing, 'utf8').match(/^exit (\d+) wall (\d+)s/m) : null;
  rows.push({ id, task, arm, ...m, ...s, model: m.model ?? model, rep, exitCode: meta ? +meta[1] : undefined, wallSeconds: meta ? +meta[2] : undefined, scorerMs: Date.now() - t0 });
}
const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((c) => !['changed', 'errorList'].includes(c));
const cell = (v) => (v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));
writeFileSync(out, [cols.join('\t'), ...rows.map((r) => cols.map((c) => cell(r[c])).join('\t'))].join('\n') + '\n');
console.log(`${rows.length} rows -> ${out}`);
