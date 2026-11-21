// Dispatcher over the command registry. Every command answers --json with one envelope
//   { ok, command, changed[], warnings[], errors[{file, msg, fix}], next, data? }
// and exits 0 (ok), 1 (failed) or 2 (ok with flags, e.g. overrides). Human output is unchanged per command.
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commands, find } from './registry.mjs';
import help from './commands/help.mjs';
import { presentation } from './presentation.mjs';
import { runChecks } from '../checks/run.mjs';
import { errorMessage, show } from '../lib/files.mjs';
import type { CheckIssue } from '../checks/types.mjs';
import type { ChecksSummary, Command, CommandResult, Envelope, EnvelopeIssue, IssueLike, OptionValues } from './types.mjs';

const HARNESS = fileURLToPath(new URL('../', import.meta.url));

export const GLOBAL_OPTIONS = {
  json: { type: 'boolean', description: 'Print a structured JSON result' },
  'dry-run': { type: 'boolean', description: 'Preview file changes on supported commands' },
  help: { type: 'boolean', description: 'Show help for the command' },
  details: { type: 'boolean', description: 'Show the full terminal output' },
} as const;

const asError = (e: IssueLike): EnvelopeIssue => ({ file: e.file ?? null, msg: e.msg ?? show(e), fix: e.fix ?? null, ...(e.token ? { token: e.token } : {}), ...(e.id ? { check: e.id } : {}) });

// Runs the deterministic checks after a mutating command: in-process for --json, with live output otherwise.
async function checks(root: string, json: boolean): Promise<ChecksSummary> {
  if (!json) return { exitCode: spawnSync('node', [join(HARNESS, 'checks/run.mjs')], { stdio: 'inherit', cwd: root }).status ?? 1, errors: [], warnings: [] };
  const report = await runChecks(root);
  const flat = (k: 'errors' | 'warnings') => report.results.flatMap((r) => r[k].map((e: CheckIssue) => asError({ ...e, id: r.id })));
  return { exitCode: report.exitCode, errors: flat('errors'), warnings: flat('warnings'), overrides: report.overrides };
}

export interface DispatchIO {
  root?: string;
  stdout?: (s: string) => unknown;
  stderr?: (s: string) => unknown;
  human?: boolean;
}

// Commands retain their project-root working-directory contract. Only suggest an ancestor;
// silently changing root would reinterpret file arguments and could write to the wrong project.
function ancestorProject(start: string): string | null {
  let dir = dirname(resolve(start));
  for (;;) {
    if (existsSync(join(dir, 'harness.config.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export async function dispatch(argv: string[], { root = process.cwd(), stdout = (s) => process.stdout.write(s), stderr = (s) => process.stderr.write(s), human = Boolean(process.stdout.isTTY) }: DispatchIO = {}): Promise<number> {
  let [name, ...rest] = argv;
  const json = argv.includes('--json');
  if (!name || name === '--help' || name === '-h' || (name === '--json' && rest.length === 0)) { name = 'help'; rest = [...(json ? ['--json'] : []), ...(argv.includes('--details') ? ['--details'] : [])]; }
  const ui = presentation(human && !json);
  const errorUi = presentation(ui.enabled, ui.enabled && Boolean(process.stderr.isTTY) && !('NO_COLOR' in process.env));
  const out = (line = '') => { if (!json) stdout((ui.enabled ? ui.line(line) : line) + '\n'); };
  if (ui.enabled) stdout(ui.header(name));
  const finish = (cmdName: string, r: CommandResult): number => {
    const errors = (r.errors ?? []).map(asError);
    const exitCode = r.exitCode ?? (errors.length ? 1 : 0);
    const envelope: Envelope = { ok: exitCode !== 1, command: cmdName, changed: r.changed ?? [], warnings: (r.warnings ?? []).map((w) => (typeof w === 'string' ? w : asError(w))), errors, next: r.next ?? null, ...(r.data !== undefined ? { data: r.data } : {}) };
    if (json) stdout(JSON.stringify(envelope, null, 2) + '\n');
    else for (const e of errors) stderr(ui.enabled ? errorUi.error(e.msg, e.fix, e.file) : `${e.msg}${e.fix ? `\n  fix: ${e.fix}` : ''}\n`);
    return exitCode;
  };
  const fail = (cmdName: string, msg: string, fix: string, file: string | null = null) => finish(cmdName, { errors: [{ file, msg, fix }], exitCode: 1 });

  const cmd = find(name);
  if (!cmd) return fail(name, ui.enabled ? `Unknown command "${name}".` : `Unknown command "${name}". Commands: ${commands().map((c) => c.name).join(', ')}.`, 'Run sketchbook help to list commands.');
  // Commands that take CSS variables as arguments (--sb-color-primary) keep them as positionals, not options.
  const known = new Set([...Object.keys(GLOBAL_OPTIONS), ...Object.keys(cmd.options)]);
  const MARK = '\u0000';
  if (cmd.cssVarArgs) rest = rest.map((a) => (/^--[a-z0-9]+-[a-z0-9-]+$/i.test(a) && !known.has(a.slice(2)) ? MARK + a : a));
  // No option is `multiple`, so parseArgs types every value as string | boolean.
  const config: Record<string, { type: 'string' | 'boolean'; short?: string }> = { ...GLOBAL_OPTIONS, ...Object.fromEntries(Object.entries(cmd.options).map(([k, o]) => [k, { type: o.type, ...(o.short ? { short: o.short } : {}) }])) };
  let parsed;
  try {
    parsed = parseArgs({ args: rest, options: config, allowPositionals: true, strict: true });
  } catch (e) {
    return fail(name, errorMessage(e), `Run sketchbook help ${name}.`);
  }
  const values: OptionValues = parsed.values;
  const positionals = parsed.positionals.map((p) => (p.startsWith(MARK) ? p.slice(1) : p));
  if (values.help) return finish(name, help.run({ root, args: [name], options: {}, json, out, human: ui.enabled, details: Boolean(values.details) }));
  if (cmd.project !== false && !existsSync(join(root, 'harness.config.json'))) {
    const ancestor = ancestorProject(root);
    return fail(name, `Not a Sketchbook project (no harness.config.json in ${root}).`, ancestor
      ? `Change directory to ${ancestor} and run the command again. Sketchbook resolves file paths from the project root.`
      : 'sketchbook init (in an empty folder, or --dir <new folder>) creates one; or cd into your design-system folder.');
  }
  if (values['dry-run'] && !cmd.dryRun) return fail(name, `${name} does not support --dry-run.`, `Run sketchbook help ${name}.`);
  const required = cmd.args.filter((a) => a.required).length;
  if (positionals.length < required) return fail(name, `Usage: ${usage(cmd)}`, `Run sketchbook help ${name}.`);
  try {
    const r = await cmd.run({ root, args: positionals, options: values, json, dryRun: Boolean(values['dry-run']), human: ui.enabled, details: Boolean(values.details), out, checks: (dir = root) => checks(dir, json) });
    return finish(name, r);
  } catch (e) {
    return fail(name, errorMessage(e), fixOf(e) ?? `Run sketchbook help ${name}.`);
  }
}

// Commands throw Object.assign(new Error(msg), { fix }) to name the fix.
const fixOf = (e: unknown): string | undefined => (typeof e === 'object' && e !== null && 'fix' in e && typeof e.fix === 'string' ? e.fix : undefined);

export function usage(cmd: Pick<Command, 'name' | 'args' | 'options' | 'dryRun'>): string {
  const args = cmd.args.map((a) => (a.required ? `<${a.name}${a.variadic ? '...' : ''}>` : `[${a.name}${a.variadic ? '...' : ''}]`));
  const opts = Object.entries(cmd.options).map(([k, o]) => (o.type === 'boolean' ? `[--${k}]` : `[--${k} <${o.value ?? 'value'}>]`));
  return ['sketchbook', cmd.name, ...args, ...opts, ...(cmd.dryRun ? ['[--dry-run]'] : []), '[--json]'].join(' ');
}
