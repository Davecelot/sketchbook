// usage: node score-qa.mjs <run-dir>  -> one JSON line: seeded defects found, findings, false findings, page untouched
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const run = process.argv[2];
const spec = JSON.parse(readFileSync(new URL('../qa/defects.json', import.meta.url), 'utf8'));
const defects = spec.defects;
const HEDGE = /\b(likely|probably|possibly|may |might|could not|cannot|can't verify|unclear|if intentional|unless|confirm)\b/i;
// v1 (rounds 1-5 as first published) missed evidence phrased as "does not exist", "skips from …" or "props: …".
const EVIDENCE_V1 = /\.ts\b|contract|tokens\.css|contrast\.json|registry|scale stops|not a (valid )?(token|attribute|prop)|no such/i;
const EVIDENCE = /\.ts\b|contract|tokens\.css|contrast\.json|registry|scale (stops|skips|ends)|skips from|not a (valid )?(token|attribute|prop)|no such|(does|do)( not|n.t) (exist|define|declare|have)|not (defined|declared) (in|by)|props?: |only (has|accepts|defines)|anti-pattern/i;
const calibration = JSON.parse(readFileSync(new URL('../qa/evidence-calibration.json', import.meta.url), 'utf8')).lines;
const miscalibrated = calibration.filter((c) => EVIDENCE.test(c.text) !== c.evidenced);
if (miscalibrated.length) { console.error(`EVIDENCE disagrees with qa/evidence-calibration.json:\n${miscalibrated.map((c) => c.text).join('\n')}`); process.exit(1); }
const seeded = readFileSync(new URL('../qa/settings.html', import.meta.url));
const reportPath = join(run, 'qa-report.md');
if (!existsSync(reportPath)) { console.log(JSON.stringify({ report: false, found: 0, of: defects.length })); process.exit(0); }

const lines = readFileSync(reportPath, 'utf8').split('\n').filter((l) => /^\s*-\s/.test(l));
const re = defects.map((d) => ({ id: d.id, re: new RegExp(d.pattern, 'i') }));
const hit = new Set();
let falseFindings = 0, hedged = 0, evidenced = 0, evidencedV1 = 0, extra = false;
const u1 = new RegExp(spec.unseeded.pattern, 'i');
for (const l of lines) {
  const m = re.filter((d) => d.re.test(l));
  m.forEach((d) => hit.add(d.id));
  if (!m.length) falseFindings++;
  if (HEDGE.test(l)) hedged++;
  if (EVIDENCE.test(l)) evidenced++;
  if (EVIDENCE_V1.test(l)) evidencedV1++;
  if (u1.test(l)) extra = true;
}
const page = join(run, 'out/settings.html');
const untouched = existsSync(page) && createHash('sha1').update(readFileSync(page)).digest('hex') === createHash('sha1').update(seeded).digest('hex');
console.log(JSON.stringify({
  report: true, found: hit.size, of: defects.length, foundIds: [...hit].sort(), findings: lines.length, hedged, evidenced, evidencedV1, foundUnseeded: extra, unmatchedFindings: falseFindings, pageUntouched: untouched,
}));
