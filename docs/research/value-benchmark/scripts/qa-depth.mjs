// usage: node qa-depth.mjs <round5-runs-dir>  -> QA depth per arm and model, every report scored by the same score-qa.mjs
import { existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const V = join(here, '..');
const r5 = process.argv[2];
if (!r5) { console.error('usage: node qa-depth.mjs <round5-runs-dir>  (the runs/ folder of a round 5 benchmark root)'); process.exit(1); }
const dirs = (root, keep) => (existsSync(root) ? readdirSync(root).filter((d) => keep.test(d) && !d.includes('.')).map((d) => join(root, d)) : []);
const ARMS = {
  'C (files + CLI)': [...dirs(join(V, 'round3/outputs/qa'), /^qa-a2-/), ...dirs(r5, /^qa-a2-/)],
  'A3 old layer': dirs(join(V, 'round2/outputs/qa'), /^qa-a3-/),
  'A3 new layer': dirs(r5, /^qa-a3-/),
};
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const sd = (xs) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));
for (const [arm, list] of Object.entries(ARMS)) {
  for (const model of ['sonnet', 'opus']) {
    const s = list.filter((d) => d.includes(model)).map((d) => JSON.parse(execFileSync('node', [join(here, 'score-qa.mjs'), d], { encoding: 'utf8' })));
    if (!s.length) continue;
    const ev = s.map((x) => x.evidenced);
    console.log(`${arm.padEnd(16)} ${model.padEnd(6)} n=${String(s.length).padEnd(2)} found ${mean(s.map((x) => x.found)).toFixed(1)}/6  unseeded ${s.filter((x) => x.foundUnseeded).length}/${s.length}  evidenced ${mean(ev).toFixed(1)} ±${sd(ev).toFixed(1)} [${ev.join(',')}]  v1 ${mean(s.map((x) => x.evidencedV1)).toFixed(1)}  findings ${mean(s.map((x) => x.findings)).toFixed(1)}  hedged ${mean(s.map((x) => x.hedged)).toFixed(1)}`);
  }
}
