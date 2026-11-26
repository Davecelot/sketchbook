import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { PassThrough } from 'node:stream';
import { EventEmitter, once } from 'node:events';
import { test, type TestContext } from 'node:test';
import { setImmediate as tick } from 'node:timers/promises';
import { workspace } from '../cli/workspace.mjs';
import { openWorkspaceEditor, workspaceChecks, workspaceEditor } from '../cli/workspace-actions.mjs';
import { clip, displayWidth, workspaceHeader, wrap } from '../cli/workspace-view.mjs';
import { presentation } from '../cli/presentation.mjs';
import { parseJson } from '../lib/files.mjs';
import type { Report } from '../checks/types.mjs';
import type { Envelope } from '../cli/types.mjs';
import { fixture, must, ROOT } from './helpers.mjs';

const CLI = join(ROOT, 'harness/cli.mjs');
const enterScreen = '\x1b[?1049h';
const leaveScreen = '\x1b[?1049l';
// eslint-disable-next-line no-control-regex
const plain = (value: string) => value.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');

async function project(t: TestContext, full = false) {
  const root = full ? await fixture() : await fixture(['harness.config.json', 'brand.config.json', 'spec/registry.json']);
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function terminal(options: Omit<Parameters<typeof workspace>[0], 'input' | 'output'>, columns = 100, rows = 26) {
  const input = Object.assign(new PassThrough(), { isRaw: false, setRawMode(raw: boolean) { this.isRaw = raw; } });
  const chunks: string[] = [];
  let lastFrame = '';
  const output = Object.assign(new EventEmitter(), {
    isTTY: true, columns, rows, write: (chunk: string) => {
      chunks.push(chunk);
      if (chunk.startsWith('\x1b[H')) {
        lastFrame = plain(chunk);
        output.emit('frame');
      }
    },
  });
  const done = workspace({ ...options, input, output });
  const press = async (name: string, text = name.length === 1 ? name : '', ctrl = false) => {
    input.emit('keypress', text, { name, ctrl });
    await tick();
  };
  return {
    input, chunks, done, press,
    async send(sequence: string) {
      input.write(sequence);
      await tick();
    },
    resize(width: number, height: number) {
      output.columns = width;
      output.rows = height;
      output.emit('resize');
    },
    async waitFor(text: string) {
      while (!lastFrame.includes(text)) await once(output, 'frame');
    },
    screen: () => lastFrame,
  };
}

const findings: Report = {
  ok: false, exitCode: 1, overrides: [],
  results: [
    { id: 'T6', title: 'Contrast', errors: [{ msg: 'Contrast below target', file: 'spec/registry.json', line: 3, mode: 'dark', fix: 'Review the \x1b[2Jcontrast pair.' }], warnings: [], info: [] },
    { id: 'C4', title: 'Approval', errors: [{ msg: 'Approval needs review' }], warnings: [{ msg: 'Plan is old' }], info: [] },
  ],
};
const warningsOnly: Report = { ok: true, exitCode: 0, overrides: [], results: [must(findings.results[1], 'approval check')].map((result) => ({ ...result, errors: [] })) };

test('workspace launch and help preserve the non-interactive CLI contract', async (t) => {
  const root = await project(t);
  const run = (...args: string[]) => spawnSync(process.execPath, [CLI, ...args], { cwd: root, encoding: 'utf8' });
  const help = run('workspace', '--help');
  assert.equal(help.status, 0);
  assert.match(help.stdout, /^sketchbook workspace$/m);
  assert.match(help.stdout, /Requires an interactive terminal/);
  assert.doesNotMatch(help.stdout, /--json/);
  const detailedHelp = run('help', 'workspace', '--details', '--json');
  assert.equal(detailedHelp.status, 0);
  assert.equal(parseJson<{ data: { command: { usage: string } } }>(detailedHelp.stdout).data.command.usage, 'sketchbook workspace');
  const piped = run('workspace');
  assert.equal(piped.status, 1);
  assert.match(piped.stderr, /Use sketchbook status and sketchbook check/);
  assert.equal(piped.stdout.includes('\x1b'), false);
  const json = run('workspace', '--json');
  const result = parseJson<Envelope>(json.stdout);
  assert.equal(json.status, 1);
  assert.equal(result.command, 'workspace');
  assert.equal(result.ok, false);
  assert.deepEqual(result.changed, []);
  assert.match(result.errors[0]?.fix ?? '', /Both accept --json/);
  assert.equal(run('workspace', '--dry-run').status, 1);
  assert.equal(run('workspace', 'extra').status, 1);
});

test('workspace preview, compact layout, search, and handoff use the same finding', async (t) => {
  const root = await project(t);
  const ui = terminal({ root, check: () => Promise.resolve(findings) });
  assert.match(ui.screen(), /> 1 Overview/);
  assert.match(ui.screen(), /Reading project status/);
  assert.match(ui.screen(), /\[Enter\] Open Checks/);
  await ui.send('\x1b[C');
  assert.match(ui.screen(), /> 2 Checks/);
  assert.match(ui.screen(), /Checks have not run/);
  assert.match(ui.screen(), /\[Enter\] Run checks/);
  await ui.send('\r');
  assert.match(ui.screen(), /Failed · 2 errors · 1 warning · 0 overrides/);
  assert.match(ui.screen(), /FINDINGS \(3\) +SELECTED FINDING \(1 OF 3\)/);
  assert.match(ui.screen(), /T6 · Contrast/);
  const previewColumn = ui.screen().split('\r\n').find((line) => line.includes('SELECTED FINDING'))?.indexOf('SELECTED FINDING');
  await ui.press('f');
  await ui.press('f');
  const filtered = ui.screen().split('\r\n').find((line) => line.includes('SELECTED FINDING'));
  assert.match(filtered ?? '', /FINDINGS \(1\) · Warnings +SELECTED FINDING \(1 OF 1\)/);
  assert.equal(filtered?.indexOf('SELECTED FINDING'), previewColumn);
  await ui.press('f');
  await ui.press('f');
  await ui.send('\x1bOB');
  assert.match(ui.screen(), /> Error C4/);
  assert.match(ui.screen(), /SELECTED FINDING \(2 OF 3\)/);
  await ui.send('\r');
  assert.match(ui.screen(), /Approval needs review/);
  assert.match(ui.screen(), /\[Esc\] Back/);
  await ui.press('escape');
  ui.resize(48, 14);
  assert.match(ui.screen(), /> Error · C4/);
  assert.match(ui.screen(), /All · 2 of 3 findings/);
  assert.match(ui.screen(), /\[\/\] Search\s+\[f\] Filter/);
  await ui.press('f');
  await ui.press('f');
  assert.match(ui.screen(), /Warnings · 1 finding/);
  await ui.press('/');
  await ui.press('z');
  assert.match(ui.screen(), /No matching findings/);
  await ui.press('escape');
  assert.match(ui.screen(), /> Warning · C4/);
  await ui.press('f');
  assert.match(ui.screen(), /\[Enter\] Show all findings/);
  await ui.press('return');
  await ui.press('return');
  assert.match(ui.screen(), /\[Esc\] Back/);
  assert.match(ui.screen(), /\[p\] Print handoff and exit/);
  ui.resize(100, 26);
  assert.match(ui.screen(), /File: spec\/registry\.json:3/);
  assert.match(ui.screen(), /Mode: dark/);
  await ui.press('p');
  const result = await ui.done;
  assert.equal(result.code, 0);
  assert.match(result.handoff ?? '', /T6 · Contrast[\s\S]*File: spec\/registry\.json:3[\s\S]*Suggested fix:[\s\S]* {2}sketchbook check$/);
  assert.equal(result.handoff?.includes('\x1b'), false);
  assert.equal(ui.input.isRaw, false);
  assert.equal(ui.input.listenerCount('keypress'), 0);
  assert.ok(ui.chunks.at(-1)?.endsWith(leaveScreen));
});

test('a single finding opens inline on wide terminals and uses the list in compact layouts', async (t) => {
  const root = await project(t);
  const report: Report = {
    ok: true, exitCode: 0, overrides: [],
    results: [{
      id: 'T5', title: 'No hard-coded values where a token exists', errors: [], info: [],
      warnings: [{
        msg: 'A long message about the token usage. '.repeat(16).trim(), file: 'spec/registry.json', line: 3,
        fix: 'Use a dimension component token.',
      }],
    }],
  };
  const ui = terminal({ root, check: () => Promise.resolve(report) }, 100, 22);
  await ui.press('2');
  await ui.press('return');
  assert.match(ui.screen(), /Passed · 0 errors · 1 warning · 0 overrides {4,}Last run:/);
  const findingDivider = ui.screen().match(/\r\n\r\n {2}FINDING\r\n {2}(─+)\r\n {2}Warning · T5 · No hard-coded values/)?.[1];
  assert.ok(findingDivider);
  assert.doesNotMatch(ui.screen(), /SELECTED FINDING|> Warning/);
  assert.match(ui.screen(), /\[↑\/↓\] Scroll/);
  await ui.press('end');
  assert.match(ui.screen(), /File: spec\/registry\.json:3/);
  const fixDivider = ui.screen().match(/SUGGESTED FIX\r\n {2}(─+)\r\n {2}Use a dimension component token/)?.[1];
  assert.equal(fixDivider, findingDivider);

  await ui.press('/');
  await ui.press('t');
  assert.match(ui.screen(), /Search: t_/);
  assert.match(ui.screen(), /Warning · T5 · No hard-coded values/);
  await ui.press('escape');
  ui.resize(48, 14);
  assert.match(ui.screen(), /> Warning · T5/);
  await ui.press('return');
  await ui.press('end');
  assert.match(ui.screen(), /Suggested fix: Use a dimension component token/);
  await ui.press('q');
  assert.equal((await ui.done).code, 0);
});

test('Workspace fits wide CJK punctuation into the smallest supported viewport', async (t) => {
  const root = await project(t);
  const report = { ...warningsOnly, results: warningsOnly.results.map((result) =>
    ({ ...result, warnings: [{ msg: '、'.repeat(30) }] })) };
  const ui = terminal({ root, check: () => Promise.resolve(report) }, 40, 12);
  await ui.press('2');
  await ui.press('return');
  const warning = ui.screen().split('\r\n').find((line) => line.startsWith('> Warning · C4 · '));
  await ui.press('q');
  await ui.done;
  assert.equal(warning, `> Warning · C4 · ${'、'.repeat(10)}…`);
  assert.equal(displayWidth('、\u3000Ａ'), 6);
  assert.equal(clip('、、、', 5), '、、…');
  assert.deepEqual(wrap('、、、、', 5), ['、、', '、、']);
});

test('rerunning preserves the selected finding across modes and brands', async (t) => {
  const root = await project(t);
  const shared = { msg: 'Contrast below target', file: 'spec/registry.json', line: 3, token: 'color.sample' };
  const errors = [
    { ...shared, mode: 'light', brand: 'secondary' },
    { ...shared, mode: 'dark', brand: 'primary' },
    { ...shared, mode: 'dark', brand: 'secondary' },
  ];
  let count = 0;
  const ui = terminal({ root, check: () => Promise.resolve({
    ...findings,
    results: [{ id: 'T6', title: 'Contrast', errors: ++count <= 2 ? errors : errors.slice(0, 2), warnings: [], info: [] }],
  }) });
  await ui.press('2');
  await ui.press('return');
  await ui.press('end');
  const selected = ui.screen();
  await ui.press('r');
  const rerun = ui.screen();
  await ui.press('r');
  const fallback = ui.screen();
  await ui.press('q');
  await ui.done;
  assert.match(selected, /Mode: dark[\s\S]*Brand: secondary/);
  assert.match(rerun, /SELECTED FINDING \(3 OF 3\)[\s\S]*Mode: dark[\s\S]*Brand: secondary/);
  assert.match(fallback, /SELECTED FINDING \(1 OF 2\)[\s\S]*Mode: light/);
});

test('search backspace removes a whole grapheme', async (t) => {
  const root = await project(t);
  const report = { ...warningsOnly, results: warningsOnly.results.map((result) =>
    ({ ...result, warnings: [{ msg: 'x👩🏿‍💻' }, { msg: 'plain x' }] })) };
  const ui = terminal({ root, check: () => Promise.resolve(report) });
  await ui.press('2');
  await ui.press('return');
  await ui.press('/');
  await ui.send('x👩🏿‍💻');
  const before = ui.screen();
  await ui.send('\x7f');
  const afterEmoji = ui.screen();
  await ui.send('e\u0301');
  await ui.send('\x7f');
  const afterAccent = ui.screen();
  await ui.press('c', '\x03', true);
  await ui.done;
  assert.match(before, /Search: x👩🏿‍💻_.*SELECTED FINDING \(1 OF 1\)/);
  assert.match(afterEmoji, /Search: x_.*SELECTED FINDING \(1 OF 2\)/);
  assert.match(afterAccent, /Search: x_.*SELECTED FINDING \(1 OF 2\)/);
});

test('search can match a complete emoji at its 160-grapheme limit', async (t) => {
  const root = await project(t);
  const prefix = 'a'.repeat(159);
  const report = { ...warningsOnly, results: warningsOnly.results.map((result) =>
    ({ ...result, warnings: [{ msg: `${prefix}😀` }, { msg: `${prefix}😁` }] })) };
  const ui = terminal({ root, check: () => Promise.resolve(report) });
  await ui.press('2');
  await ui.press('return');
  await ui.press('/');
  await ui.press('paste', `${prefix}😀more`);
  await ui.press('return');
  const atLimit = ui.screen();
  await ui.press('q');
  await ui.done;
  assert.match(atLimit, /FINDINGS \(1\)/);
  assert.match(atLimit.replace(/\s+/gu, ''), /😀/u);
});

test('checks keep the last report during reruns and distinguish cancellation, process failure, and overrides', async (t) => {
  const root = await project(t);
  const requests: { signal: AbortSignal; complete: (report: Report) => void; reject: (error: Error) => void }[] = [];
  const ui = terminal({ root, check: (_root, signal) => new Promise((complete, reject) => requests.push({ signal, complete, reject })) });
  await ui.press('2');
  await ui.press('r');
  await ui.press('r');
  assert.equal(requests.length, 1);
  requests[0]?.complete(warningsOnly);
  await tick();
  assert.match(ui.screen(), /Passed · 0 errors · 1 warning/);
  await ui.press('r');
  assert.match(ui.screen(), /Running checks…[\s\S]*Previous run.*Passed/);
  await ui.press('escape');
  assert.equal(requests[1]?.signal.aborted, true);
  assert.match(ui.screen(), /Cancelling checks/);
  requests[1]?.reject(new Error('Cancelled'));
  await tick();
  assert.match(ui.screen(), /Checks cancelled/);
  await ui.press('r');
  requests[2]?.reject(new Error('Missing project file'));
  await tick();
  assert.match(ui.screen(), /Could not complete checks[\s\S]*Previous run.*Passed[\s\S]*Missing project file/);
  await ui.press('r');
  requests[3]?.complete({ ...warningsOnly, exitCode: 2, overrides: [{ token: 'color.primary', file: 'color.tokens.json', value: '#222', generated: '#333', added: false }] });
  await tick();
  assert.match(ui.screen(), /Passed with overrides · 0 errors · 1 warning · 1 override/);
  await ui.press('f');
  await ui.press('f');
  await ui.press('f');
  assert.match(ui.screen(), /> Override color\.primary/);
  await ui.press('r');
  await ui.press('c', '\x03', true);
  assert.equal((await ui.done).code, 130);
  assert.equal(requests[4]?.signal.aborted, true);
  requests[4]?.reject(new Error('Cancelled'));
  await tick();
  assert.equal(ui.input.isRaw, false);
  assert.ok(ui.chunks.at(-1)?.endsWith(leaveScreen));
});

test('opening a file hands the terminal to the editor and requires a rerun on return', { timeout: 3000 }, async (t) => {
  const root = await project(t);
  const saved = process.env.VISUAL;
  process.env.VISUAL = 'vim';
  t.after(() => { if (saved === undefined) delete process.env.VISUAL; else process.env.VISUAL = saved; });
  type Editor = Awaited<ReturnType<typeof workspaceEditor>>;
  let launched!: (data: { editor: Editor; returned: () => void }) => void;
  const launch = new Promise<{ editor: Editor; returned: () => void }>((resolve) => { launched = resolve; });
  const ui = terminal({ root, check: () => Promise.resolve(findings), open: (_root, editor) =>
    new Promise<void>((returned) => { launched({ editor, returned }); }) });
  await ui.press('2');
  await ui.press('r');
  await ui.press('o');
  const { editor, returned } = await launch;
  assert.equal(editor.program, 'vim');
  assert.equal(editor.args[0], '+3');
  assert.match(editor.args[1] ?? '', /[/\\]spec[/\\]registry\.json$/);
  assert.equal(ui.input.isRaw, false);
  assert.ok(ui.chunks.at(-1)?.endsWith(leaveScreen));
  returned();
  await tick();
  assert.equal(ui.input.isRaw, true);
  assert.match(ui.screen(), /Rerun needed after opening editor[\s\S]*Previous run.*Failed/);
  assert.match(ui.screen(), /> Error T6/);
  assert.equal(ui.chunks.filter((chunk) => chunk.startsWith(enterScreen)).length, 2);
  await ui.press('r');
  assert.doesNotMatch(ui.screen(), /Rerun needed/);
  ui.resize(20, 5);
  assert.match(ui.screen(), /\[q\] Exit/);
  await ui.press('q');
  assert.equal((await ui.done).code, 0);
});

test('editor actions fail cleanly for missing, external, or non-file paths', async (t) => {
  const root = await project(t);
  const external = await mkdtemp(join(tmpdir(), 'sketchbook-editor-'));
  t.after(() => rm(external, { recursive: true, force: true }));
  const file = join(external, 'outside.json');
  await writeFile(file, '{}');
  await assert.rejects(workspaceEditor(root, file, 1, 'vim'), /outside the project/);
  await assert.rejects(workspaceEditor(root, 'missing.json', 1, 'vim'), /File is unavailable/);
  await assert.rejects(workspaceEditor(root, 'spec', 1, 'vim'), /not a file/);
  if (process.platform !== 'win32') {
    await symlink(file, join(root, 'link.json'));
    await assert.rejects(workspaceEditor(root, 'link.json', 1, 'vim'), /outside the project/);
  }
  const launch = await workspaceEditor(root, 'spec/registry.json', 8, 'code');
  assert.deepEqual(launch.args.slice(0, 2), ['--wait', '--goto']);
  assert.match(launch.args[2] ?? '', /registry\.json:8$/);
  await assert.rejects(openWorkspaceEditor(root, { ...launch, program: join(external, 'missing-editor') }, new AbortController().signal),
    { code: 'ENOENT', editorStarted: false });
});

test('workspace check subprocess returns the same full report as check --json without writing files', async (t) => {
  const root = await project(t, true);
  const files = ['harness.config.json', 'brand.config.json', 'spec/registry.json'];
  const read = () => Promise.all(files.map((file) => readFile(join(root, file), 'utf8')));
  const before = await read();
  const result = await workspaceChecks(root, new AbortController().signal);
  const cli = spawnSync(process.execPath, [CLI, 'check', '--json'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.exitCode, cli.status);
  assert.deepEqual(result, parseJson<Envelope>(cli.stdout).data);
  assert.deepEqual(await read(), before);
  const incomplete = join(root, 'incomplete-project');
  await mkdir(incomplete);
  await assert.rejects(workspaceChecks(incomplete, new AbortController().signal), /Error.*harness\.config\.json/);
  await writeFile(join(incomplete, 'harness.config.json'), '{');
  await assert.rejects(workspaceChecks(incomplete, new AbortController().signal), /SyntaxError/);
  const aborted = AbortSignal.abort();
  await assert.rejects(workspaceChecks(root, aborted), { name: 'AbortError' });
});

test('a long report keeps the last finding selectable at the smallest supported size', async (t) => {
  const root = await project(t);
  const report: Report = {
    ok: false, exitCode: 1, overrides: [],
    results: [{
      id: 'T2', title: 'Aliases', warnings: [], info: [],
      errors: Array.from({ length: 1600 }, (_, index) => ({ msg: `Finding ${index + 1}`, file: `spec/${'漢字'.repeat(50)}-${index + 1}.json` })),
    }],
  };
  const ui = terminal({ root, check: () => Promise.resolve(report) }, 40, 12);
  await ui.send('\r');
  assert.match(ui.screen(), /> 2 Checks/);
  await ui.send('\r');
  await ui.press('end');
  assert.match(ui.screen(), /> Error · T2 · Finding 1600/);
  await ui.press('return');
  assert.match(ui.screen(), /Finding 1600/);
  await ui.press('p');
  assert.match((await ui.done).handoff ?? '', /-1600\.json/);
  assert.ok(ui.chunks.filter((chunk) => chunk.startsWith('\x1b[H')).every((chunk) => chunk.split('\r\n').length <= 12));
});

test('workspace keeps the header fixed across views and groups Overview content without color', { timeout: 3000 }, async (t) => {
  const root = await project(t);
  const saved = process.env.NO_COLOR;
  process.env.NO_COLOR = '1';
  t.after(() => { if (saved === undefined) delete process.env.NO_COLOR; else process.env.NO_COLOR = saved; });
  const ui = terminal({ root }, 80, 24);
  await ui.waitFor('Status read at');
  assert.match(ui.screen(), /^ {2}╭─+╮\r\n {2}│ Sketchbook \/ Workspace +[^\r\n]+ │\r\n {2}╰─+╯\r\n\r\n {2}> 1 Overview {4}2 Checks\r\n/);
  assert.match(ui.screen(), /│ BRAND +│ DESIGN SYNC +│/);
  assert.match(ui.screen(), /├─+┼─+┤\r\n {2}│ COMPONENTS +│ TOKEN OVERRIDES +│/);
  assert.match(ui.screen(), /Project root:/);

  const boxedHeader = ui.screen().split('\r\n').slice(0, 4);
  await ui.send('\x1b[C');
  assert.deepEqual(ui.screen().split('\r\n').slice(0, 4), boxedHeader);
  assert.match(ui.screen(), /\r\n\r\n {4}1 Overview {2}> 2 Checks\r\n\r\n {2}Checks have not run/);
  assert.doesNotMatch(ui.screen(), /DESIGN SYNC/);
  await ui.press('1');
  await ui.press('?');
  assert.match(ui.screen(), /Workspace keys/);
  assert.deepEqual(ui.screen().split('\r\n').slice(0, 4), boxedHeader);
  await ui.press('escape');
  ui.resize(80, 15);
  assert.match(ui.screen(), /^ {2}Sketchbook \/ Workspace · [^\r\n]+\r\n\r\n {2}> 1 Overview/);
  assert.match(ui.screen(), /│ COMPONENTS +│ TOKEN OVERRIDES +│/);
  assert.match(ui.screen(), /╰─+┴─+╯/);
  ui.resize(64, 22);
  assert.match(ui.screen(), /\r\nBRAND\r\n[^\r]+(?:\r\n[^\r]+)*?\r\n─+\r\nDESIGN SYNC\r\n/);
  assert.doesNotMatch(ui.screen(), /╭─/);
  ui.resize(40, 12);
  const compactHeader = ui.screen().split('\r\n').slice(0, 2);
  assert.ok(compactHeader[0]?.startsWith(`Sketchbook / Workspace · ${basename(root).slice(0, 6)}`));
  assert.match(ui.screen(), /\r\n\r\n> 1 Overview/);
  await ui.press('2');
  assert.deepEqual(ui.screen().split('\r\n').slice(0, 2), compactHeader);
  assert.match(ui.screen(), /\r\n\r\n {2}1 Overview {2}> 2 Checks\r\nChecks have not run/);
  assert.doesNotMatch(ui.screen(), /Resize to/);
  assert.ok(ui.screen().split('\r\n').every((line) => line.length <= 39));
  assert.ok(ui.chunks.every((chunk) => !chunk.includes('\x1b[38;5;208m')));
  assert.ok(ui.chunks.every((chunk) => !chunk.includes('\x1b[1m')));
  await ui.press('1');
  await ui.press('escape');
  assert.equal((await ui.done).code, 0);
});

test('terminal formatting keeps wide graphemes intact and filters control characters', () => {
  assert.equal(clip('白👩🏿‍💻é', 5), '白👩🏿‍💻é');
  assert.equal(clip('白👩🏿‍💻é옷', 5), '白👩🏿‍💻…');
  assert.equal(clip('カナ', 6, true), 'カナ  ');
  assert.deepEqual(wrap('👩🏿‍💻👩🏿‍💻é', 3), ['👩🏿‍💻', '👩🏿‍💻é']);
  assert.equal(clip('ab\u001b[2J', 10), 'ab [2J');
  const root = join('projects', '漢字'.repeat(30) + '👩🏿‍💻');
  const ui = presentation(true, false);
  const wideHeader = workspaceHeader(root, false, 75, 24, ui);
  const narrowHeader = workspaceHeader(root, false, 39, 12, ui);
  assert.match(wideHeader.join('\n'), /│ Sketchbook \/ Workspace +漢字.*… │/);
  assert.match(narrowHeader.join('\n'), /Workspace · 漢字.*…/);
  assert.ok(wideHeader.every((line) => clip(line, 75) === line));
  assert.ok(narrowHeader.every((line) => clip(line, 39) === line));
});
