// usage: node merge-tsv.mjs <out.tsv> <a.tsv> <b.tsv> ...  -> rows of all files, columns unioned
import { readFileSync, writeFileSync } from 'node:fs';

const [out, ...files] = process.argv.slice(2);
const rows = files.flatMap((f) => {
  const L = readFileSync(f, 'utf8').trim().split('\n').map((l) => l.split('\t'));
  return L.slice(1).map((r) => Object.fromEntries(L[0].map((k, i) => [k, r[i]])));
});
const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
writeFileSync(out, [cols.join('\t'), ...rows.map((r) => cols.map((c) => r[c] ?? '').join('\t'))].join('\n') + '\n');
console.log(`${rows.length} rows -> ${out}`);
