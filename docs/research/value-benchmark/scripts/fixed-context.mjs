// usage: node fixed-context.mjs [projectDir=.] [--model sonnet] [--only full,bare] [--runs 3]
// Fixed context per arm: one trivial headless prompt, tokens = input + cache write + cache read (README §1).
// Arms: bare (empty folder), full (the project's Claude layer), and one ablation per layer. Each arm reports the median of its runs.
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const project = resolve(args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? '.');
const model = flag('model', 'sonnet');
const only = flag('only', '')?.split(',').filter(Boolean);
const runs = Number(flag('runs', 1));
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const parseRun = join(dirname(fileURLToPath(import.meta.url)), 'parse-run.mjs');

const ARMS = {
  bare: () => {},
  full: (d) => layer(d),
  'no-hooks': (d) => { layer(d); writeFileSync(join(d, '.claude/settings.json'), '{}'); },
  'no-rules': (d) => { layer(d); rmSync(join(d, '.claude/rules'), { recursive: true, force: true }); },
  'no-skills': (d) => { layer(d); rmSync(join(d, '.claude/skills'), { recursive: true, force: true }); rmSync(join(d, '.claude/commands'), { recursive: true, force: true }); writeFileSync(join(d, '.claude/settings.json'), '{}'); },
  'no-claude-md': (d) => { layer(d); rmSync(join(d, 'CLAUDE.md'), { force: true }); },
};

function layer(d) {
  cpSync(join(project, '.claude'), join(d, '.claude'), { recursive: true, filter: (s) => !/^\.claude[/\\](worktrees|\.hammock-state\.json)/.test(relative(project, s)) });
  if (existsSync(join(project, 'CLAUDE.md'))) cpSync(join(project, 'CLAUDE.md'), join(d, 'CLAUDE.md'));
}

const rows = [];
for (const [arm, setup] of Object.entries(ARMS)) {
  if (only?.length && !only.includes(arm)) continue;
  const samples = [];
  for (let i = 0; i < runs; i++) {
  const dir = mkdtempSync(join(tmpdir(), `sb-fixed-${arm}-`));
  try {
    setup(dir);
    const out = execFileSync('claude', ['-p', 'Reply with the single word OK', '--model', model, '--output-format', 'stream-json', '--verbose'], { cwd: dir, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, timeout: 180000 });
    const file = join(dir, 'run.jsonl');
    writeFileSync(file, out);
    const m = JSON.parse(execFileSync('node', [parseRun, file], { encoding: 'utf8' }));
    samples.push({ tokens: (m.input ?? 0) + (m.cacheWrite ?? 0) + (m.cacheRead ?? 0), cost: m.cost ?? 0, turns: m.turns });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  }
  rows.push({ arm, tokens: median(samples.map((s) => s.tokens)), cost: +median(samples.map((s) => s.cost)).toFixed(4), samples: samples.map((s) => s.tokens), turns: samples.map((s) => s.turns) });
}
const bare = rows.find((r) => r.arm === 'bare')?.tokens;
const full = rows.find((r) => r.arm === 'full')?.tokens;
for (const r of rows) {
  if (bare) r.overBare = r.tokens - bare;
  if (full && r.arm.startsWith('no-')) r.layerCost = full - r.tokens;
}
console.log(JSON.stringify({ model, project, rows }, null, 2));
