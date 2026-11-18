// usage: node compare-round5.mjs  -> C (round 3 a2, plus round 5 a2 QA runs), old A3 (round 3 a3) and new A3 (round 5 a3) per task and model.
// QA evidence is compared by qa-depth.mjs, which re-scores every arm's reports with the same scorer.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const V = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const load = (f) => {
  const L = readFileSync(join(V, f), 'utf8').trim().split('\n').map((l) => l.split('\t'));
  return L.slice(1).map((r) => Object.fromEntries(L[0].map((k, i) => [k, r[i]])));
};
const r3 = load('round3/results-all.tsv');
const r5 = load('round5/results.tsv');
const ARMS = [['C', [...r3, ...r5].filter((r) => r.arm === 'a2')], ['A3 old', r3.filter((r) => r.arm === 'a3')], ['A3 new', r5.filter((r) => r.arm === 'a3')]];
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const rate = (g, p) => `${g.filter(p).length}/${g.length}`;
const QUALITY = {
  author: [['valid spec', (g) => rate(g, (r) => r.contractFound === 'true' && r.checkExit === '0')]],
  ui: [
    ['sb components', (g) => rate(g, (r) => +r.sbElements > 0)],
    ['tokens only', (g) => rate(g, (r) => +r.ownVarSb > 0 && +r.ownLiteralColors === 0)],
    ['switch x3', (g) => rate(g, (r) => +r.switches === 3)],
    ['axe-clean', (g) => rate(g, (r) => +r.axeLight === 0 && +r.axeDark === 0)],
  ],
  qa: [
    ['all 6 seeded found', (g) => rate(g, (r) => +r.found === 6)],
    ['unseeded found', (g) => rate(g, (r) => r.foundUnseeded === 'true')],
  ],
};
for (const task of ['author', 'ui', 'qa']) {
  console.log(`\n## ${task}`);
  const c = {};
  for (const [name, rows] of ARMS) {
    const g = rows.filter((r) => r.task === task);
    const cost = (m) => mean(g.filter((r) => r.model.includes(m)).map((r) => +r.cost));
    c[name] = { s: cost('sonnet'), o: cost('opus') };
    const vsC = name === 'C' ? '' : ` | vs C ${((c[name].s / c.C.s - 1) * 100).toFixed(0)}% / ${((c[name].o / c.C.o - 1) * 100).toFixed(0)}%`;
    const q = QUALITY[task].map(([k, f]) => `${k} ${f(g)}`).join(', ');
    console.log(`${name.padEnd(7)} $ ${c[name].s.toFixed(3)} / ${c[name].o.toFixed(3)}${vsC} | turns ${mean(g.map((r) => +r.turns)).toFixed(0)} | ${q}`);
  }
}
