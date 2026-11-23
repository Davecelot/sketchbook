// usage: node score-qa.mjs <run-dir> [seed-html] [review-json]
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const [run, seedPath, reviewPath] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(new URL('../qa/defects.json', import.meta.url), 'utf8'));
const defects = spec.defects;
const HEDGE = /\b(likely|probably|possibly|may |might|could not|cannot|can't verify|unclear|if intentional|unless|confirm)\b/i;
// v1 (rounds 1-5 as first published) missed evidence phrased as "does not exist", "skips from …" or "props: …".
const EVIDENCE_V1 = /\.ts\b|contract|tokens\.css|contrast\.json|registry|scale stops|not a (valid )?(token|attribute|prop)|no such/i;
const EVIDENCE = /\.ts\b|contract|tokens\.css|contrast\.json|registry|scale (stops|skips|ends)|skips from|not a (valid )?(token|attribute|prop)|no such|(does|do)( not|n.t) (exist|define|declare|have)|not (defined|declared) (in|by)|props?: |only (has|accepts|defines)|anti-pattern/i;
const calibration = JSON.parse(readFileSync(new URL('../qa/evidence-calibration.json', import.meta.url), 'utf8')).lines;
const miscalibrated = calibration.filter((c) => EVIDENCE.test(c.text) !== c.evidenced);
if (miscalibrated.length) { console.error(`EVIDENCE disagrees with qa/evidence-calibration.json:\n${miscalibrated.map((c) => c.text).join('\n')}`); process.exit(1); }
const seeded = readFileSync(seedPath || new URL('../qa/settings.html', import.meta.url));
const reportPath = join(run, 'qa-report.md');
if (!existsSync(reportPath)) { console.log(JSON.stringify({ report: false, found: 0, of: defects.length })); process.exit(0); }

const report = readFileSync(reportPath, 'utf8');
const lines = report.split('\n').map((text, i) => ({ text, number: i + 1 })).filter(({ text }) => /^\s*-\s/.test(text));
const re = defects.map((d) => ({ id: d.id, re: new RegExp(d.pattern, 'i') }));
const hit = new Set();
let unmatched = 0, hedged = 0, evidenced = 0, evidencedV1 = 0, extra = false;
const u1 = new RegExp(spec.unseeded.pattern, 'i');
for (const { text: l } of lines) {
  const m = re.filter((d) => d.re.test(l));
  m.forEach((d) => hit.add(d.id));
  if (!m.length) unmatched++;
  if (HEDGE.test(l)) hedged++;
  if (EVIDENCE.test(l)) evidenced++;
  if (EVIDENCE_V1.test(l)) evidencedV1++;
  if (u1.test(l)) extra = true;
}
const page = join(run, 'out/settings.html');
const untouched = existsSync(page) && readFileSync(page).equals(seeded);
let reviewed = {};
if (reviewPath) {
  const review = JSON.parse(readFileSync(reviewPath, 'utf8'));
  const reportSha256 = createHash('sha256').update(report).digest('hex');
  if (review.reportSha256 !== reportSha256) throw new Error('Review does not match qa-report.md');
  if (!review.verdicts || typeof review.verdicts !== 'object' || Array.isArray(review.verdicts)) throw new Error('Review must contain line-number verdicts');
  const verdicts = Object.entries(review.verdicts);
  for (const [line, verdict] of verdicts) {
    if (!lines.some(({ number }) => String(number) === line) || !['verified', 'false-positive', 'uncertain'].includes(verdict)) {
      throw new Error(`Invalid review verdict for line ${line}`);
    }
  }
  const count = (verdict) => verdicts.filter(([, value]) => value === verdict).length;
  reviewed = { verifiedFindings: count('verified'), falsePositives: count('false-positive'), uncertainFindings: count('uncertain') };
}
console.log(JSON.stringify({
  report: true, found: hit.size, of: defects.length, foundIds: [...hit].sort(), findings: lines.length, hedged, evidenced, evidencedV1, foundUnseeded: extra, unmatchedFindings: unmatched, pageUntouched: untouched,
  unreviewedFindings: lines.length - (reviewed.verifiedFindings ?? 0) - (reviewed.falsePositives ?? 0) - (reviewed.uncertainFindings ?? 0), ...reviewed,
}));
