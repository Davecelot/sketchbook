// usage: node errs.mjs < envelope.json — counts envelope errors by check id and file.
let s = '';
process.stdin.on('data', (d) => (s += d)).on('end', () => {
  const j = JSON.parse(s);
  const by = {};
  for (const e of j.errors) { const k = `${e.check ?? '-'} ${e.file ?? ''}`; by[k] = (by[k] ?? 0) + 1; }
  console.log(`ok=${j.ok} errors=${j.errors.length} warnings=${j.warnings.length}`);
  for (const [k, n] of Object.entries(by)) console.log(`  ${n}x ${k}`);
});
