// CLI registry (cases L1–L11 in TEST.md): one registry, a --json envelope on every command, read-only introspection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { runChecks } from '../checks/run.mjs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, edit, reference, ROOT, must } from './helpers.mjs';
import { PassThrough, Readable } from 'node:stream';
import { setImmediate as tick } from 'node:timers/promises';
import { commands, GROUPS } from '../cli/registry.mjs';
import { cliDocs } from '../cli/docs.mjs';
import { knownCommands } from '../cli/known.mjs';
import { dispatch } from '../cli/run.mjs';
import { interactive, wantsInteractive, type InteractiveIO } from '../cli/interactive.mjs';
import { parseJson } from '../lib/files.mjs';
import type { Envelope } from '../cli/types.mjs';
import type { KnownCommands } from '../lib/claude-layer.mjs';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import { harnessCatalog } from '../lib/agent-catalog.mjs';

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
  await edit<HarnessConfigJson>(dir, 'harness.config.json', (j) => { j.adapters.design.file = 'file-1'; });
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
async function menu(lines: string[], { real = false, failDryRun = false, root, start, columns, rows }: { real?: boolean; failDryRun?: boolean; root?: string; start?: InteractiveIO['start']; columns?: number; rows?: number } = {}) {
  root ??= await reference();
  const calls: string[][] = [];
  let text = '';
  const output = { write: (s: string) => { text += s; }, columns, rows };
  const run: InteractiveIO['run'] = real ? undefined : (argv, { stdout }) => { calls.push(argv); must(stdout, 'dispatch stdout')(`(ran ${argv.join(' ')})\n`); return Promise.resolve(failDryRun && argv.includes('--dry-run') ? 1 : 0); };
  const code = await interactive({ root, start, input: Readable.from(lines.map((l) => `${l}\n`)), output, ...(run ? { run } : {}) });
  return { calls, text, code };
}
const groupIndex = (g: string): string => String(['harness', ...Object.keys(GROUPS).filter((k) => commands().some((c) => c.group === k))].indexOf(g) + 1);
const commandIndex = (name: string): string => { const c = must(commands().find((x) => x.name === name), `command ${name}`); return String(commands().filter((x) => x.group === c.group && x.name !== 'harness').indexOf(c) + 1); };

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
  const no = await menu([groupIndex('project'), commandIndex('init'), 'y', ...answers, 'n', 'q']);
  assert.deepEqual(no.calls, [['init', '--font', 'Inter', '--dry-run']]);
  assert.match(no.text, /--primary: .*\[current: /);
  assert.match(no.text, /Not applied/);
  const yes = await menu([groupIndex('design'), commandIndex('sync'), 'tokens', '', '', 'y', 'q']);
  assert.deepEqual(yes.calls, [['sync', 'tokens', '--dry-run'], ['sync', 'tokens']]);
  const required = await menu([groupIndex('project'), commandIndex('prefix'), '', 'acme', 'n']);
  assert.match(required.text, /Required\./);
  assert.deepEqual(required.calls, [['prefix', 'acme', '--dry-run']]);
  const choices = await menu([groupIndex('tokens'), 'b', 'q']);
  assert.match(choices.text, /1 {2}tokens\n {6}Set foundation values/);
  assert.match(choices.text, /2 {2}presets\n {6}Browse foundation presets/);
  const bad = await menu(['9', 'x', 'b', 'q']);
  assert.match(bad.text, /Type 1-/);
  assert.deepEqual(bad.calls, []);
  const defaultCancel = await menu([groupIndex('design'), commandIndex('sync'), 'tokens', '', '', 'maybe', '', 'q']);
  assert.deepEqual(defaultCancel.calls, [['sync', 'tokens', '--dry-run']]);
  assert.match(defaultCancel.text, /Please type y or n/);
  assert.match(defaultCancel.text, /Enter or n \+ Enter: cancel without applying/);
  assert.match(defaultCancel.text, /Not applied/);
  const apply = await menu([groupIndex('design'), commandIndex('sync'), 'tokens', '', '', 'y', 'q']);
  assert.deepEqual(apply.calls, [['sync', 'tokens', '--dry-run'], ['sync', 'tokens']]);
  assert.match(apply.text, /Preview changes[\s\S]*sketchbook sync tokens --dry-run[\s\S]*Apply these changes\?\n {2}sketchbook sync tokens\n/);
  const guided = await menu([groupIndex('tokens'), commandIndex('tokens'), 'set', '', 'typography.family Inter', '', 'n', 'q']);
  assert.match(guided.text, /Arguments for set: <key> <value>/);
  assert.match(guided.text, /Example to type: typography\.family Inter/);
  assert.match(guided.text, /Required\./);
  assert.match(guided.text, /Documentation: https:\/\/sketchbook-docs\.vercel\.app\//);
  assert.deepEqual(guided.calls, [['tokens', 'set', 'typography.family', 'Inter', '--dry-run']]);
  const quoted = await menu([groupIndex('tokens'), commandIndex('tokens'), 'set', 'color.primary #336699', '', '', 'q']);
  assert.match(quoted.text, /sketchbook tokens set color\.primary '#336699' --dry-run/);
  const failed = await menu([groupIndex('design'), commandIndex('sync'), 'tokens', '', '', 'q'], { failDryRun: true });
  assert.deepEqual(failed.calls, [['sync', 'tokens', '--dry-run']]);
  assert.match(failed.text, /dry run failed/);
  assert.doesNotMatch(failed.text, /Apply these changes/);
});

test('L11 bare sketchbook without a terminal (or with --json) prints help instead of the menu', async () => {
  assert.equal(wantsInteractive([], { stdin: { isTTY: true }, stdout: { isTTY: true } }), true);
  assert.equal(wantsInteractive([], { stdin: { isTTY: false }, stdout: { isTTY: true } }), false);
  assert.equal(wantsInteractive(['--json'], { stdin: { isTTY: true }, stdout: { isTTY: true } }), false);
  const tty = { stdin: { isTTY: true }, stdout: { isTTY: true } };
  assert.equal(wantsInteractive(['harness'], tty), true);
  for (const flag of ['list', '--json', '--details', '--help']) assert.equal(wantsInteractive(['harness', flag], tty), false);
  const dir = await fixture(['harness.config.json', 'brand.config.json']);
  const r = cli(dir);
  assert.equal(r.code, 0);
  assert.match(r.out, /sketchbook <command>/);
  envelope(cli(dir, '--json').json, 'help');
  await rm(dir, { recursive: true });
});

function picker(root: string, start: InteractiveIO['start'] = 'harness', columns = 60, rows = 21) {
  const input = Object.assign(new PassThrough(), { isRaw: false, setRawMode(value: boolean) { this.isRaw = value; } });
  const history: string[] = [];
  const frames: string[][] = [];
  const output = { isTTY: true, columns, rows, write(text: string) {
    // eslint-disable-next-line no-control-regex
    const clean = text.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
    history.push(clean);
    if (text.startsWith('\x1b[H')) frames.push(clean.split('\r\n'));
  } };
  const done = interactive({ root, start, input, output });
  const press = async (name: string, text = '', ctrl = false) => { input.emit('keypress', text, { name, ctrl }); await tick(); };
  const type = async (text: string) => { for (const char of text) await press(char, char); };
  return { input, done, press, type, frames, history, view: () => frames.at(-1)?.join('\n') ?? '' };
}

test('Harness opens from the first level; keyboard selection survives filter and safe default preview', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'sketchbook-harness-menu-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const ui = picker(root, 'home');
  assert.match(ui.history.join(''), /Harness {6}Browse and install workflows/);
  ui.input.write(`${groupIndex('harness')}\n`);
  await tick();
  assert.equal(ui.input.isRaw, true);
  assert.match(ui.view(), /› Install recommended[\s\S]*Customize installation/);
  await ui.press('down');
  await ui.press('return');
  assert.match(ui.view(), /› \[ \] Skill\s+Accessibility Checker/);
  assert.doesNotMatch(ui.view(), /Sketchbook essentials/);
  await ui.type('hammock');
  assert.doesNotMatch(ui.view(), /Hammock Default Mode|Integration references/);
  await ui.press('space', ' ');
  assert.match(ui.view(), /› \[x\] Skill\s+Hammock/);
  assert.match(ui.view(), /Think through changes/);
  assert.match(ui.view(), /project\s+settings/);
  await ui.press('escape');
  await ui.type('command:check');
  assert.match(ui.view(), /› \[ \] Command\s+Check/);
  await ui.press('space', ' ');
  assert.match(ui.view(), /2 selected.*match/);
  await ui.press('return');
  assert.match(ui.view(), /Custom install preview[\s\S]*Hammock[\s\S]*Check/);
  assert.match(ui.view(), /› Back to selection/);
  await ui.press('return'); // Default must not install.
  assert.match(ui.view(), /2 selected.*match/);
  assert.equal(existsSync(join(root, '.agents')), false);
  assert.ok(ui.frames.every((frame) => frame.length <= 21 && frame.every((line) => line.length < 60)));
  await ui.press('escape'); // Clear the filter.
  await ui.press('escape'); // Back to install options.
  assert.match(ui.view(), /› Customize installation/);
  await ui.press('escape'); // Back to the first-level menu.
  assert.equal(ui.input.isRaw, false);
  assert.match(ui.history.at(-1) ?? '', /Enter a number/);
  ui.input.write('q\n');
  assert.equal(await ui.done, 0);
});

test('Harness recommended is a separate path and installs complete modules without a checklist', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'sketchbook-harness-preset-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const ui = picker(root, 'harness', 100, 24);
  await ui.press('return');
  assert.match(ui.view(), /Recommended install preview[\s\S]*Recommended modules[\s\S]*Contract Author[\s\S]*Hammock[\s\S]*Review Rangers/);
  assert.match(ui.view(), /› Back to install options/);
  assert.doesNotMatch(ui.view(), /\[ \]/);
  await ui.press('return');
  assert.equal(existsSync(join(root, '.agents')), false);
  await ui.press('return');
  await ui.press('tab');
  assert.match(ui.view(), /› Install recommended/);
  await ui.press('return');
  assert.match(ui.view(), /Installed \d+ files/);
  assert.ok(existsSync(join(root, '.sketchbook/hammock.json')));
  assert.ok(existsSync(join(root, '.agents/skills/review-rangers/assets/committee-member-template.md')));
  assert.equal(existsSync(join(root, '.claude')), false);
  await ui.press('return');
  await ui.press('escape');
  assert.equal(await ui.done, 0);
});

test('Harness preview blocks conflicts; Tab and Enter install only the repaired selection', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'sketchbook-harness-menu-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const skill = join(root, '.agents/skills/hammock');
  await mkdir(skill, { recursive: true });
  await writeFile(join(skill, 'SKILL.md'), 'Team-owned skill.\n');
  const ui = picker(root);
  await ui.press('down');
  await ui.press('return');
  await ui.type('command:check');
  await ui.press('space', ' ');
  await ui.press('escape');
  await ui.type('hammock');
  await ui.press('space', ' ');
  await ui.press('return');
  assert.match(ui.view(), /Install blocked/);
  assert.match(ui.view(), /\.agents\/skills\/hammock\/SKILL\.md/);
  assert.doesNotMatch(ui.view(), /Install selected/);
  assert.equal(existsSync(join(root, '.agents/sketchbook/commands/check.md')), false);
  await ui.press('return');
  await ui.press('space', ' '); // Remove Hammock without clearing the other selection.
  await ui.press('return');
  await ui.press('tab');
  assert.match(ui.view(), /› Install selected/);
  await ui.press('return');
  assert.match(ui.view(), /Installed 1 file\./);
  assert.equal(await readFile(join(skill, 'SKILL.md'), 'utf8'), 'Team-owned skill.\n');
  assert.ok(existsSync(join(root, '.agents/sketchbook/commands/check.md')));
  await ui.press('return');
  await ui.type('command:check');
  await ui.press('space', ' ');
  await ui.press('return');
  assert.match(ui.view(), /Already installed: 1 file/);
  assert.match(ui.view(), /Nothing to install/);
  assert.doesNotMatch(ui.view(), /Install selected/);
  await ui.press('c', '\x03', true);
  assert.equal(await ui.done, 130);
  assert.equal(ui.input.isRaw, false);
});

test('Harness requires fresh confirmation if the install plan changes after preview', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'sketchbook-harness-preview-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const config = join(root, '.sketchbook/hammock.json');
  await mkdir(join(root, '.sketchbook'));
  await writeFile(config, '{"defaultMode":"ultra"}\n');
  const ui = picker(root, 'harness', 100, 28);
  await ui.press('down');
  await ui.press('return');
  await ui.type('hammock');
  await ui.press('space', ' ');
  await ui.press('return');
  assert.match(ui.view(), /Project settings kept[\s\S]*Files to write \(4\)/);
  await rm(config);
  await ui.press('tab');
  await ui.press('return');
  assert.match(ui.view(), /Plan changed[\s\S]*Files to write \(5\)/);
  assert.match(ui.view(), /› Back to selection/);
  assert.equal(existsSync(join(root, '.agents')), false);
  assert.equal(existsSync(config), false);
  await ui.press('tab');
  await ui.press('return');
  assert.match(ui.view(), /Installed 5 files/);
  assert.ok(existsSync(config));
  await ui.press('c', '\x03', true);
  assert.equal(await ui.done, 130);
});

test('Harness list is grouped for people and keeps every entry in the JSON interface', () => {
  const short = cli(ROOT, 'harness', 'list');
  assert.equal(short.code, 0);
  assert.match(short.out, /Recommended:[\s\S]*recommended[\s\S]*Skills:[\s\S]*hammock[\s\S]*Commands:/);
  assert.doesNotMatch(short.out, /hook:guard-generated|config:hammock\/default-mode|\[skill; manual skill\]/);
  assert.match(cli(ROOT, 'harness', 'list', '--details').out, /Integration references:[\s\S]*hook:guard-generated/);
  const json = cli<{ entries: { id: string; partOf?: string }[] }>(ROOT, 'harness', '--json');
  assert.equal(json.json?.data.entries.length, harnessCatalog().length);
  assert.ok(json.json?.data.entries.some((entry) => entry.id === 'hook:guard-generated'));
  assert.equal(json.json?.data.entries.find((entry) => entry.id === 'config:hammock/default-mode')?.partOf, 'hammock');
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

test('project commands identify the nearest ancestor project without executing from a subdirectory', async () => {
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const parent = await mkdtemp(join(tmpdir(), 'sketchbook project root '));
  const project = join(parent, 'design system');
  const nested = join(project, 'src/components');
  try {
    await mkdir(nested, { recursive: true });
    await writeFile(join(parent, 'harness.config.json'), '{}');
    await writeFile(join(project, 'harness.config.json'), '{}');
    for (const command of ['status', 'doctor', 'check']) {
      const result = cli(nested, command, '--json');
      assert.equal(result.code, 1);
      const fix = must(must(result.json, 'JSON envelope').errors[0], 'an error').fix ?? '';
      assert.ok(fix.includes(project), fix);
      assert.match(fix, /Change directory to .*Sketchbook resolves file paths from the project root/s);
    }
    const human = cli(nested, 'status');
    assert.match(human.err, /Change directory to .*Sketchbook resolves file paths from the project root/s);
    assert.ok(human.err.includes(project));
    assert.equal((await readFile(join(project, 'harness.config.json'), 'utf8')), '{}');
  } finally { await rm(parent, { recursive: true, force: true }); }
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


test('terminal presentation shows concise help and respects pipes, NO_COLOR, and JSON', async () => {
  const dir = await reference();
  const run = async (args: string[], human: boolean) => {
    let out = ''; let err = '';
    const code = await dispatch(args, { root: dir, human, stdout: (s) => { out += s; }, stderr: (s) => { err += s; } });
    return { code, out, err };
  };
  const help = await run(['help'], true);
  assert.match(help.out, /SKETCHBOOK/);
  assert.match(help.out, /help --details/);
  const short = await run(['help', 'init'], true);
  assert.match(short.out, /Usage[\s\S]*sketchbook init[\s\S]*Try:/);
  assert.doesNotMatch(short.out, /\nOptions:/);
  const detailed = await run(['help', 'init', '--details'], true);
  assert.match(detailed.out, /Options:[\s\S]*--adopt[\s\S]*Examples:/);
  const saved = process.env.NO_COLOR;
  try {
    process.env.NO_COLOR = '';
    const noColor = await run(['help', 'init'], true);
    assert.match(noColor.out, /SKETCHBOOK/);
    assert.equal(noColor.out.includes('\x1b['), false);
  } finally {
    if (saved === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = saved;
  }
  const brief = await run(['list'], true);
  const full = await run(['list', '--details'], true);
  assert.match(brief.out, /more\. Use sketchbook list --details/);
  assert.doesNotMatch(full.out, /more\. Use sketchbook list --details/);
  const plain = await run(['list'], false);
  assert.equal(plain.out.includes('\x1b['), false);
  assert.doesNotMatch(plain.out, /SKETCHBOOK/);
  const json = await run(['list', '--json'], true);
  envelope(parseJson<Envelope>(json.out), 'list');
  const error = await run(['not-a-command'], true);
  assert.equal(error.code, 1);
  assert.match(error.err, /Unknown command/);
  assert.match(error.err, /Next/);
  await rm(dir, { recursive: true });
});
