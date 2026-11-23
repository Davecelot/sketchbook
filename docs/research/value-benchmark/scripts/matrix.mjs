// usage: node matrix.mjs <results.tsv>  -> one table per task, arms side by side (rates pooled over both models, n = runs)
import { readFileSync } from 'node:fs';

const L = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => l.split('\t'));
const h = L[0];
const rows = L.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const json = (v) => { try { return JSON.parse(v); } catch { return {}; } };
const ARMS = [['a0', 'A0 nothing'], ['f', 'F files'], ['a2', 'C files+CLI'], ['h', 'H files+harness'], ['a3', 'A3 all three'], ['n', 'A3N all three + CLI named']];
const pct = (g, p) => (g.length ? `${g.filter(p).length}/${g.length}` : '-');
const usd = (g, m) => { const x = g.filter((r) => r.model.includes(m)).map((r) => +r.cost); return x.length ? mean(x).toFixed(2) : '-'; };
const nonEmpty = (v) => Object.keys(json(v)).length > 0;
const cliOkRun = (r) => (r.arm === 'a0' ? false : r.cliOk ? nonEmpty(r.cliOk) : nonEmpty(r.cliCommands));
const cliTryRun = (r) => (r.arm === 'a0' ? false : r.cliAttempts ? nonEmpty(r.cliAttempts) : nonEmpty(r.cliCommands));
const cliUse = (g) => pct(g, cliOkRun);
const cliTry = (g) => pct(g, cliTryRun);
const whenMeasured = (g, key, fn) => { const measured = g.filter((r) => r[key] !== undefined && r[key] !== ''); return measured.length ? fn(measured) : '-'; };

const TASKS = {
  author: [
    ['valid spec + checks pass', (g) => pct(g, (r) => r.contractFound === 'true' && r.checkExit === '0')],
    ['contract file written', (g) => pct(g, (r) => r.contractFound === 'true')],
    ['expert items /16', (g) => mean(g.map((r) => +r.expert)).toFixed(1)],
    ['runs with a working CLI call', cliUse],
    ['runs trying the CLI (incl. failed)', cliTry],
    ['runs invoking a skill', (g) => pct(g, (r) => r.skillCalls && r.skillCalls !== '[]')],
  ],
  ui: [
    ['uses working sb components', (g) => pct(g, (r) => +r.sbElements > 0 && r.pageOperational !== 'false')],
    ['working page (offline, keyboard, Save, themes, axe)', (g) => whenMeasured(g, 'workflowPass', (m) => pct(m, (r) => r.workflowPass === 'true'))],
    ['tokens only (no literal colours)', (g) => pct(g, (r) => +r.ownVarSb > 0 && +r.ownLiteralColors === 0)],
    ['all controls work by keyboard', (g) => whenMeasured(g, 'keyboardAllControls', (m) => pct(m, (r) => r.keyboardAllControls === 'true'))],
    ['keyboard Save submits with Email enabled', (g) => whenMeasured(g, 'saveWithDefaultValue', (m) => pct(m, (r) => r.saveWithDefaultValue === 'true'))],
    ['uses checkboxes from the design system for deferred Save', (g) => whenMeasured(g, 'usesExpectedSettingsControls', (m) => pct(m, (r) => r.usesExpectedSettingsControls === 'true'))],
    ['axe findings on loaded pages (mean)', (g) => whenMeasured(g.filter((r) => r.pageOperational !== 'false'), 'axeLight', (m) => mean(m.map((r) => +r.axeLight)).toFixed(1))],
    ['runs with a working CLI call', cliUse],
    ['runs trying the CLI (incl. failed)', cliTry],
  ],
  qa: [
    ['seeded found (mean /6)', (g) => mean(g.map((r) => +r.found)).toFixed(1)],
    ['unseeded real defect found', (g) => pct(g, (r) => r.foundUnseeded === 'true')],
    ['evidenced findings / report', (g) => mean(g.map((r) => +r.evidenced)).toFixed(1)],
    ['human-verified findings / reviewed report', (g) => whenMeasured(g, 'verifiedFindings', (m) => mean(m.map((r) => +r.verifiedFindings)).toFixed(1))],
    ['human-confirmed false positives / reviewed report', (g) => whenMeasured(g, 'falsePositives', (m) => mean(m.map((r) => +r.falsePositives)).toFixed(1))],
    ['hedged findings / report', (g) => mean(g.map((r) => +r.hedged)).toFixed(1)],
    ['runs with a working CLI call', cliUse],
    ['runs trying the CLI (incl. failed)', cliTry],
  ],
};

for (const [task, metrics] of Object.entries(TASKS)) {
  const arms = ARMS.filter(([a]) => rows.some((r) => r.task === task && r.arm === a));
  if (!arms.length) continue;
  console.log(`\n### ${task}\n`);
  console.log(`| metric | ${arms.map(([, n]) => n).join(' | ')} |`);
  console.log(`|---|${arms.map(() => '---').join('|')}|`);
  const G = (a) => rows.filter((r) => r.task === task && r.arm === a);
  for (const [name, fn] of metrics) console.log(`| ${name} | ${arms.map(([a]) => fn(G(a))).join(' | ')} |`);
  console.log(`| $ / run, sonnet | ${arms.map(([a]) => usd(G(a), 'sonnet')).join(' | ')} |`);
  console.log(`| $ / run, opus | ${arms.map(([a]) => usd(G(a), 'opus')).join(' | ')} |`);
  console.log(`| wall s (mean) | ${arms.map(([a]) => mean(G(a).map((r) => r.wallSeconds ? +r.wallSeconds : +r.ms / 1000)).toFixed(0)).join(' | ')} |`);
  console.log(`| verify tokens % | ${arms.map(([a]) => (100 * mean(G(a).map((r) => +r.verifyTokenShare))).toFixed(0)).join(' | ')} |`);
  console.log(`| runs with permission denials | ${arms.map(([a]) => whenMeasured(G(a), 'permissionDenials', (m) => pct(m, (r) => +r.permissionDenials > 0))).join(' | ')} |`);
  console.log(`| runs | ${arms.map(([a]) => G(a).length).join(' | ')} |`);
}
