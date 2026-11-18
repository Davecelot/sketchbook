// CLI registry (cases L1–L11 in TEST.md): one registry, a --json envelope on every command, read-only introspection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { runChecks } from '../checks/run.mjs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, edit, reference, ROOT, must } from './helpers.mjs';
import { Readable } from 'node:stream';
import { commands, GROUPS } from '../cli/registry.mjs';
import { cliDocs } from '../cli/docs.mjs';
import { knownCommands } from '../cli/known.mjs';
import { interactive, wantsInteractive, type InteractiveIO } from '../cli/interactive.mjs';
import { parseJson } from '../lib/files.mjs';
import type { Envelope } from '../cli/types.mjs';
import type { KnownCommands } from '../lib/claude-layer.mjs';
import type { ComponentRegistry } from '../../generated/types/registry.js';

// The parts of `data` these tests read (status, presets): D types the --json boundary per call.
interface StatusData { prefix: string; brand: { name: string }; components: { total: number; byStatus: unknown }; overrides: number; design: object }
interface PresetsData { families: { family: string }[]; presets: { id: string }[] }

const CLI = join(ROOT, 'harness/cli.mjs');
const cli = <D = unknown,>(dir: string, ...args: string[]) => {
  const r = spawnSync('node', [CLI, ...args], { cwd: dir, encoding: 'utf8' });
  let json: (Envelope & { data: D }) | null = null;
  try { json = parseJson<Envelope & { data: D }>(r.stdout); } catch { /* human output */ }
  return { code: r.status, out: r.stdout, err: r.stderr, json };
};
const envelope: (j: Envelope | null, command: string | undefined) => asserts j is Envelope = (j, command) => {
  assert.ok(j, 'stdout is JSON');
  for (const k of ['ok', 'command', 'changed', 'warnings', 'errors', 'next']) assert.ok(k in j, `envelope lacks ${k}`);
  assert.equal(j.command, command);
  for (const k of ['changed', 'warnings', 'errors'] as const) assert.ok(Array.isArray(j[k]), k);
  for (const e of j.errors) for (const k of ['file', 'msg', 'fix']) assert.ok(k in e, `error lacks ${k}`);
};

test('L1 every registered command declares its contract', () => {
  const names = commands().map((c) => c.name);
  for (const n of ['add', 'check', 'init', 'prefix', 'explain', 'swap', 'sync', 'status', 'presets', 'help']) assert.ok(names.includes(n), n);
  for (const c of commands()) {
    for (const k of ['name', 'group', 'summary', 'args', 'options', 'examples', 'mutates']) assert.ok(k in c, `${c.name} lacks ${k}`);
    assert.equal(typeof c.run, 'function');
  }
});

test('L2 + L6 --json envelope on every command; dry runs write nothing', async () => {
  const dir = await fixture();
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (r) => r.components.push({ name: 'Probe Widget', tier: 3, status: 'planned' }));
  const files = ['brand.config.json', 'harness.config.json', 'spec/registry.json', 'src/components/button/Button.ts'];
  const before = await Promise.all(files.map((f) => readFile(join(dir, f), 'utf8')));
  const runs = [
    ['status'], ['presets'], ['presets', 'motion'], ['help'], ['help', 'init'], ['explain', 'color.primary'],
    ['add', 'Probe Widget', '--dry-run'], ['init', '--radius', 'round', '--dry-run'], ['prefix', 'acme', '--dry-run'],
    ['swap', 'tokens', 'plain', '--dry-run'], ['sync', 'tokens', '--dry-run'], ['sync', 'stamp', 'tokens', '--dry-run'],
  ];
  for (const args of runs) {
    const r = cli(dir, ...args, '--json');
    envelope(r.json, args[0]);
    assert.equal(r.json.ok, true, `${args.join(' ')}: ${r.out}${r.err}`);
    assert.equal(r.code, 0, args.join(' '));
  }
  const after = await Promise.all(files.map((f) => readFile(join(dir, f), 'utf8')));
  assert.deepEqual(after, before);
  const add = cli(dir, 'add', 'Probe Widget', '--dry-run', '--json').json;
  assert.ok(add?.changed.some((c) => c.includes('spec/components/probe-widget/contract.json')));
  const check = cli(dir, 'check', '--json', '--only=T3');
  envelope(check.json, 'check');
  assert.equal(check.code, 0);
  await rm(dir, { recursive: true });
});

test('L3 unknown command and bad option fail with a fix', async () => {
  const dir = await fixture(['harness.config.json', 'brand.config.json']);
  const a = cli(dir, 'nope', '--json');
  envelope(a.json, 'nope');
  assert.equal(a.json.ok, false);
  assert.equal(a.code, 1);
  assert.match(must(a.json.errors[0], 'an error').fix ?? '', /sketchbook help/);
  const b = cli(dir, 'init', '--colour', 'red', '--json');
  assert.equal(b.json?.ok, false);
  assert.equal(b.code, 1);
  await rm(dir, { recursive: true });
});

test('L4 status reports prefix, brand, components, overrides and design sync', async () => {
  const dir = await fixture();
  const json = must(cli<StatusData>(dir, 'status', '--json').json, 'status --json output');
  assert.equal(json.data.prefix, 'sb');
  assert.ok(json.data.brand.name);
  assert.ok(json.data.components.total > 0);
  assert.equal(typeof json.data.components.byStatus, 'object');
  assert.equal(json.data.overrides, 0);
  assert.ok('tool' in json.data.design && 'tokens' in json.data.design);
  const human = cli(dir, 'status');
  assert.match(human.out, /Prefix: sb/);
  await rm(dir, { recursive: true });
});

test('L5 presets lists families, then ids with sources', async () => {
  const dir = await fixture(['harness.config.json', 'brand.config.json']);
  const all = must(cli<PresetsData>(dir, 'presets', '--json').json, 'presets --json output');
  assert.ok(all.data.families.some((f) => f.family === 'motion'));
  const motion = must(cli<PresetsData>(dir, 'presets', 'motion', '--json').json, 'presets motion --json output');
  const ids = motion.data.presets.map((p) => p.id);
  assert.ok(ids.includes('material-like') && ids.includes('tailwind-like'));
  assert.ok(motion.data.presets.every((p) => 'source' in p && 'verified' in p));
  assert.match(cli(dir, 'presets', 'motion').out, /material-like/);
  assert.equal(cli(dir, 'presets', 'nope', '--json').code, 1);
  await rm(dir, { recursive: true });
});

test('L7 docs/cli.md is generated from the registry', async () => {
  assert.equal(await readFile(join(ROOT, 'docs/cli.md'), 'utf8'), cliDocs());
});

test('L8 known-commands.json is generated from the registry plus planned-commands.json', async () => {
  assert.equal(await readFile(join(ROOT, 'harness/cli/known-commands.json'), 'utf8'), knownCommands());
  const known = parseJson<KnownCommands>(knownCommands());
  for (const c of commands()) assert.ok(known.commands[c.name] && !known.commands[c.name]?.planned, c.name);
  assert.deepEqual([...must(known.commands.sync?.subcommands, 'sync subcommands')].sort(), ['all', 'brand', 'compare', 'components', 'describe', 'foundations', 'guide', 'icons', 'layout', 'library', 'pages', 'patterns', 'progress', 'realize', 'stamp', 'theme-matrix', 'tokens', 'verify', 'verify-library']);
  // A registry command wins over its planned entry; subcommands are the union.
  const merged = parseJson<KnownCommands>(knownCommands({ starters: ['blank'], commands: { sync: { summary: 'old', subcommands: ['later'] }, ghost: { summary: 'g' } } }));
  assert.equal(merged.commands.sync?.summary, must(commands().find((c) => c.name === 'sync'), 'the sync command').summary);
  assert.ok(merged.commands.sync?.subcommands?.includes('later') && merged.commands.sync.subcommands.includes('verify'));
  assert.deepEqual(merged.commands.ghost, { summary: 'g', planned: true });
  assert.deepEqual(merged.starters, ['blank']);
  const dir = await fixture();
  await mkdir(join(dir, 'harness/cli'), { recursive: true });
  await writeFile(join(dir, 'harness/cli/known-commands.json'), knownCommands().replace('"verify"', '"teleport"'));
  const g1 = (await runChecks(dir, { only: ['G1'] })).results.find((r) => r.id === 'G1');
  assert.ok(g1?.errors.some((e) => e.file === 'harness/cli/known-commands.json'), 'G1 rejects a hand-edited allowlist');
  await rm(dir, { recursive: true });
});

// Scripted stdin for the interactive menu; `run` records argv instead of running commands unless real is set.
async function menu(lines: string[], { real = false, root }: { real?: boolean; root?: string } = {}) {
  root ??= await reference();
  const calls: string[][] = [];
  let text = '';
  const output = { write: (s: string) => { text += s; } };
  const run: InteractiveIO['run'] = real ? undefined : (argv, { stdout }) => { calls.push(argv); must(stdout, 'dispatch stdout')(`(ran ${argv.join(' ')})\n`); return Promise.resolve(0); };
  const code = await interactive({ root, input: Readable.from(lines.map((l) => `${l}\n`)), output, ...(run ? { run } : {}) });
  return { calls, text, code };
}
const groupIndex = (g: string): string => String(Object.keys(GROUPS).filter((k) => commands().some((c) => c.group === k)).indexOf(g) + 1);
const commandIndex = (name: string): string => { const c = must(commands().find((x) => x.name === name), `command ${name}`); return String(commands().filter((x) => x.group === c.group).indexOf(c) + 1); };

test('L9 interactive: groups -> command -> read-only commands run at once', async () => {
  const dir = await fixture();
  const { text, code } = await menu([groupIndex('project'), commandIndex('status'), 'q'], { real: true, root: dir });
  assert.match(text, /Groups:/);
  assert.match(text, /Running: sketchbook status/);
  assert.match(text, /Prefix: sb/);
  assert.match(text, /Bye/);
  assert.equal(code, 0);
  await rm(dir, { recursive: true });
});

test('L10 interactive: prompts with current values, dry run first, applies only on yes', async () => {
  const opts = Object.keys(must(commands().find((c) => c.name === 'init'), 'the init command').options);
  const answers = opts.map((k) => (k === 'font' ? 'Inter' : ''));
  const no = await menu([groupIndex('project'), commandIndex('init'), ...answers, 'n', 'q']);
  assert.deepEqual(no.calls, [['init', '--font', 'Inter', '--dry-run']]);
  assert.match(no.text, /--primary: .*\[current: /);
  assert.match(no.text, /Not applied/);
  const yes = await menu([groupIndex('design'), commandIndex('sync'), 'tokens', '', 'n', 'n', '', '', '', 'y', 'q']);
  assert.deepEqual(yes.calls, [['sync', 'tokens', '--dry-run'], ['sync', 'tokens']]);
  const required = await menu([groupIndex('project'), commandIndex('prefix'), '', 'acme', 'n']);
  assert.match(required.text, /Required\./);
  assert.deepEqual(required.calls, [['prefix', 'acme', '--dry-run']]);
  const bad = await menu(['9', 'x', 'b', 'q']);
  assert.match(bad.text, /Type 1-/);
  assert.deepEqual(bad.calls, []);
});

test('L11 bare sketchbook without a terminal (or with --json) prints help instead of the menu', async () => {
  assert.equal(wantsInteractive([], { stdin: { isTTY: true }, stdout: { isTTY: true } }), true);
  assert.equal(wantsInteractive([], { stdin: { isTTY: false }, stdout: { isTTY: true } }), false);
  assert.equal(wantsInteractive(['--json'], { stdin: { isTTY: true }, stdout: { isTTY: true } }), false);
  const dir = await fixture(['harness.config.json', 'brand.config.json']);
  const r = cli(dir);
  assert.equal(r.code, 0);
  assert.match(r.out, /sketchbook <command>/);
  envelope(cli(dir, '--json').json, 'help');
  await rm(dir, { recursive: true });
});

test('L12 outside a project: project commands fail with "not a Sketchbook project" and a fix; the rest still run', async () => {
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-empty-'));
  for (const args of [['status'], ['doctor'], ['check'], ['add', 'button', '--dry-run'], ['explain', 'color.primary'], ['upgrade', '--from', ROOT, '--dry-run']]) {
    const r = cli(dir, ...args, '--json');
    envelope(r.json, args[0]);
    assert.equal(r.code, 1, args.join(' '));
    assert.match(must(r.json.errors[0], 'an error').msg, /Not a Sketchbook project/, args.join(' '));
    assert.match(must(r.json.errors[0], 'an error').fix ?? '', /sketchbook init/, args.join(' '));
  }
  const human = cli(dir, 'status');
  assert.match(human.err, /Not a Sketchbook project[\s\S]*fix: .*sketchbook init/);
  for (const args of [['help'], ['presets'], ['list'], ['audit-css', 'nothing-here/*.css', '--dry-run']]) {
    const r = cli(dir, ...args, '--json');
    assert.doesNotMatch(JSON.stringify(r.json?.errors ?? []), /Not a Sketchbook project/, args.join(' '));
  }
  await rm(dir, { recursive: true });
});

test('L13 generate rebuilds every generated output from the spec (what a project\'s npm scripts call; no engine paths)', async () => {
  const dir = await fixture();
  await rm(join(dir, 'generated/css/tokens.css'));
  await writeFile(join(dir, 'src/index.ts'), '// stale\n');
  const r = cli(dir, 'generate', '--json');
  envelope(r.json, 'generate');
  assert.equal(r.code, 0, r.out + r.err);
  assert.ok(r.json.changed.includes('generated/css/tokens.css'));
  assert.match(await readFile(join(dir, 'src/index.ts'), 'utf8'), /export \* from '\.\/components\/button\/index\.js'/);
  assert.deepEqual((await runChecks(dir, { only: ['G1'] })).results[0]?.errors, []);
  await rm(dir, { recursive: true });
});
