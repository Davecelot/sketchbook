// usage: node aggregate.mjs <results.tsv>  -> markdown tables (means over reps)
import { readFileSync } from 'node:fs';

const L = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => l.split('\t'));
const h = L[0];
const rows = L.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const f = (x, d = 0) => x.toFixed(d);
const ARMS = { a0: 'A0 nothing', f: 'F files only', a2: 'C files+CLI', h: 'H files+harness', a3: 'A3 files+CLI+harness', n: 'A3N A3 + CLI named', a1: 'A1 harness only (round 1)' };

for (const task of ['author', 'ui', 'qa']) {
  console.log(`\n### ${task}\n`);
  console.log('| model | arm | n | $ / run | turns | tokens in (M) | output tokens | wall s | CLI calls | quality |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  for (const model of ['sonnet', 'opus']) {
    for (const arm of Object.keys(ARMS)) {
      const g = rows.filter((r) => r.task === task && r.model.includes(model) && r.arm === arm);
      if (!g.length) continue;
      const num = (k) => g.map((r) => +r[k]);
      const ctx = g.map((r) => +r.input + +r.cacheWrite + +r.cacheRead);
      const q = task === 'author'
        ? `expert ${f(mean(num('expert')), 1)}/16, contract ${g.filter((r) => r.contractFound === 'true').length}/${g.length}, check pass ${g.filter((r) => r.checkExit === '0').length}/${g.length}`
        : `kbd ${g.filter((r) => r.keyboardToggle === 'true').length}/${g.length}, axe ${f(mean(num('axeLight')), 1)}, theme ${g.filter((r) => r.themeFollows === 'true').length}/${g.length}, tokens-only ${g.filter((r) => +r.ownVarSb > 0 && +r.ownLiteralColors === 0).length}/${g.length}, sb-components ${g.filter((r) => +r.sbElements > 0).length}/${g.length}`;
      console.log(`| ${model} | ${ARMS[arm]} | ${g.length} | ${f(mean(num('cost')), 2)} | ${f(mean(num('turns')), 0)} | ${f(mean(ctx) / 1e6, 2)} | ${f(mean(num('output')) / 1000, 1)}k | ${f(mean(num('ms')) / 1000, 0)} | ${f(mean(num('cliCalls')), 1)} | ${q} |`);
    }
  }
}
