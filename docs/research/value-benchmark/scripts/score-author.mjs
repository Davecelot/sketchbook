// usage: node score-author.mjs <run-dir> <template-dir>  -> one JSON line
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const [run, tpl] = process.argv.slice(2);
const SKIP = new Set(['node_modules', '.git', '.claude']);
const walk = (d, base = d, out = {}) => {
  for (const n of readdirSync(d)) {
    if (SKIP.has(n)) continue;
    const p = join(d, n);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, base, out); else out[relative(base, p)] = s.size;
  }
  return out;
};
const before = walk(tpl);
const after = walk(run);
const changed = Object.keys(after).filter((f) => before[f] !== after[f]);
const text = changed.map((f) => readFileSync(join(run, f), 'utf8')).join('\n').toLowerCase();

const R = (re) => re.test(text);
const rubric = {
  // asked for in the brief
  label: R(/\blabel\b/), description: R(/\bdescription\b/), error: R(/\berror\b/), sizes: R(/\b(sm|small)\b/),
  nameValue: R(/\bname\b/) && R(/\bvalue\b/), required: R(/\brequired\b/), disabled: R(/\bdisabled\b/), resetFieldset: R(/reset/) && R(/fieldset/),
  // expert knowledge the brief does not name
  roleSwitch: R(/role[^a-z\n]{0,8}switch/), nativeInput: R(/type=["']?checkbox|native (checkbox|input)|<input/), spaceKey: R(/\bspace\b/),
  checked: R(/\bchecked\b/), changeEvent: R(/events?[^\n]{0,80}\bchange\b|\bchange event|"change"/), focusVisible: R(/focus-visible|focus ring|focus indicator/),
  accessibleName: R(/accessible name|aria-label|aria-labelledby/), invalid: R(/aria-invalid|:invalid|invalid state/), describedby: R(/aria-describedby/),
  targetSize: R(/24 ?(px|×|x)|target size|2\.5\.8/), nonTextContrast: R(/1\.4\.11|non-text contrast|3:1/), reducedMotion: R(/reduced[- ]motion/),
  rtl: R(/\brtl\b|right-to-left|\bdirection\b/), anatomy: R(/\btrack\b/) && R(/\bthumb\b/), liveError: R(/aria-live|role[^a-z\n]{0,6}alert|live region/),
  antiPatterns: R(/checkbox/) && R(/radio/) && R(/(not for|instead|anti-?pattern)/),
};
const asked = Object.entries(rubric).slice(0, 8), expert = Object.entries(rubric).slice(8);
const n = (e) => e.filter(([, v]) => v).length;

let contractFound = changed.some((f) => /contract\.json$/.test(f));
let check = null;
if (existsSync(join(run, 'harness.config.json'))) {
  const cli = ['node_modules/@usesketchbook/cli/harness/cli.mjs', 'node_modules/sketchbook/harness/cli.mjs']
    .map((path) => resolve(run, path)).find(existsSync) ?? process.env.SB_ENGINE;
  if (cli) {
    const r = spawnSync(process.execPath, [resolve(cli), 'check', '--only', 'C1,C2,C4,A1,T7,H1', '--json'], { cwd: run, encoding: 'utf8' });
    check = r.status;
  }
}
const gold = JSON.parse(readFileSync(new URL('../gold-switch-contract.json', import.meta.url), 'utf8'));
const cj = changed.find((f) => /contract\.json$/.test(f));
let structure = null;
if (cj) {
  try {
    const c = JSON.parse(readFileSync(join(run, cj), 'utf8'));
    const n = (o) => (o && typeof o === 'object' ? Object.keys(o).length : 0);
    const a = c.accessibility ?? {};
    structure = {
      topKeys: Object.keys(gold).filter((k) => k in c).length, topKeysOf: Object.keys(gold).length,
      props: n(c.props), events: n(c.events), states: n(c.states), tokens: n(c.tokens), anatomy: Array.isArray(c.anatomy) ? c.anatomy.length : n(c.anatomy),
      a11yKeys: Object.keys(gold.accessibility).filter((k) => k in a).length, a11yKeysOf: Object.keys(gold.accessibility).length,
      aiHints: n(c.aiHints), openQuestions: Array.isArray(c.openQuestions) ? c.openQuestions.length : 0, status: c.status,
    };
  } catch { structure = { parseError: true }; }
}
console.log(JSON.stringify({
  structure,
  files: changed.length, chars: text.length, asked: n(asked), askedOf: asked.length, expert: n(expert), expertOf: expert.length,
  missed: Object.entries(rubric).filter(([, v]) => !v).map(([k]) => k), contractFound, checkExit: check, changed,
}));
