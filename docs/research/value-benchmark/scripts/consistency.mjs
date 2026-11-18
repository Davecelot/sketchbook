// usage: node consistency.mjs <results.tsv>  -> markdown: spread between reps, output similarity, share of effort spent checking
import { readFileSync } from 'node:fs';

const L = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => l.split('\t'));
const h = L[0];
const rows = L.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));
const cv = (xs) => (mean(xs) ? (100 * sd(xs)) / mean(xs) : 0);
const json = (v) => { try { return JSON.parse(v); } catch { return []; } };
const jaccard = (sets) => {
  const pairs = [];
  for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
    const a = new Set(sets[i]), b = new Set(sets[j]);
    const u = new Set([...a, ...b]);
    pairs.push(u.size ? [...a].filter((x) => b.has(x)).length / u.size : 1);
  }
  return pairs.length ? mean(pairs) : 1;
};
const ARMS = { a0: 'A0', f: 'F', a2: 'C', h: 'H', a3: 'A3', n: 'A3N' };
const out = [];
const line = (s) => out.push(s);

line('| task | model | arm | n | cost mean $ | cost CV % | turns CV % | tokens CV % | wall CV % | verify turns % | verify tokens % | verify calls | output similarity | quality spread |');
line('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const task of ['author', 'ui', 'qa']) {
  for (const model of ['sonnet', 'opus']) {
    for (const arm of Object.keys(ARMS)) {
      const g = rows.filter((r) => r.task === task && r.model.includes(model) && r.arm === arm);
      if (g.length < 2) continue;
      const num = (k) => g.map((r) => +r[k]);
      const ctx = g.map((r) => +r.input + +r.cacheWrite + +r.cacheRead);
      let sim = '', spread = '';
      if (task === 'ui') {
        sim = `components ${jaccard(g.map((r) => json(r.usedTags))).toFixed(2)}`;
        spread = `sb elements ${Math.min(...num('sbElements'))}-${Math.max(...num('sbElements'))}, unknown attrs ${Math.min(...g.map((r) => json(r.unknownAttrs).length))}-${Math.max(...g.map((r) => json(r.unknownAttrs).length))}, raw controls ${Math.min(...num('rawControls'))}-${Math.max(...num('rawControls'))}`;
      }
      if (task === 'author') {
        sim = `files ${Math.min(...num('files'))}-${Math.max(...num('files'))}`;
        spread = `expert ${Math.min(...num('expert'))}-${Math.max(...num('expert'))}/16, check pass ${g.filter((r) => r.checkExit === '0').length}/${g.length}`;
      }
      if (task === 'qa') {
        sim = `defects found ${jaccard(g.map((r) => json(r.foundIds))).toFixed(2)}`;
        spread = `found ${Math.min(...num('found'))}-${Math.max(...num('found'))}/6, findings ${mean(num('findings')).toFixed(1)}, hedged ${mean(num('hedged')).toFixed(1)}, evidenced ${mean(num('evidenced')).toFixed(1)}, unseeded real defect ${g.filter((r) => r.foundUnseeded === 'true').length}/${g.length}`;
      }
      line(`| ${task} | ${model} | ${ARMS[arm]} | ${g.length} | ${mean(num('cost')).toFixed(2)} | ${cv(num('cost')).toFixed(0)} | ${cv(num('turns')).toFixed(0)} | ${cv(ctx).toFixed(0)} | ${cv(num('ms')).toFixed(0)} | ${(100 * mean(num('verifyTurnShare'))).toFixed(0)} | ${(100 * mean(num('verifyTokenShare'))).toFixed(0)} | ${mean(num('verifyCalls')).toFixed(1)} | ${sim} | ${spread} |`);
    }
  }
}
const sc = rows.map((r) => +r.scorerMs).filter(Boolean);
line('');
line(`Our own scoring: ${rows.length} runs, mean ${(mean(sc) / 1000).toFixed(1)} s per run (deterministic, no model calls, $0).`);
console.log(out.join('\n'));
