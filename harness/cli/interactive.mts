// Bare `sketchbook` in a terminal: a node:readline menu over the command registry (SB-0052).
// Groups -> commands -> prompts for arguments and options (current values from `status` shown as hints),
// then a dry run first for mutating commands and a confirmation before applying. Everything runs
// through dispatch(), so the menu can do nothing the CLI can't. Non-TTY or --json prints help instead.
import { createInterface } from 'node:readline';
import { commands, GROUPS } from './registry.mjs';
import { dispatch } from './run.mjs';
import type { DispatchIO } from './run.mjs';
import type { Command } from './types.mjs';
import { DOCS_URL, presentation } from './presentation.mjs';

type CurrentValues = Partial<Record<string, string>>;

// Current values worth offering as hints, by option or argument name.
export async function currentValues(root: string): Promise<CurrentValues> {
  const status = (await import('./commands/status.mjs')).default;
  try {
    const { data } = await status.run({ root, args: [], options: {}, out: () => {} });
    return { name: data.brand.name, primary: data.brand.primary, font: data.brand.font, prefix: data.prefix, design: data.design.tool ?? 'none', file: data.design.file ?? undefined };
  } catch {
    return {};
  }
}

// Line reader that keeps lines typed (or piped) before a question is asked; null when input ends.
function lineReader(input: NodeJS.ReadableStream) {
  const rl = createInterface({ input, terminal: false });
  const queue: string[] = [];
  const waiting: ((line: string | null) => void)[] = [];
  let closed = false;
  rl.on('line', (l) => (waiting.length ? waiting.shift()?.(l) : queue.push(l)));
  rl.on('close', () => { closed = true; while (waiting.length) waiting.shift()?.(null); });
  return { next: (): Promise<string | null> => (queue.length ? Promise.resolve(queue.shift() ?? null) : closed ? Promise.resolve(null) : new Promise((r) => waiting.push(r))), close: () => rl.close() };
}

export interface InteractiveIO {
  root?: string;
  input?: NodeJS.ReadableStream;
  output?: { write: (s: string) => unknown };
  run?: (argv: string[], io: DispatchIO) => Promise<number>;
}

interface Choice<T> { label: string; description?: string; value: T }

export async function interactive({ root = process.cwd(), input = process.stdin, output = process.stdout, run = dispatch }: InteractiveIO = {}): Promise<number> {
  const write = (s: string) => output.write(s);
  const ui = presentation(Boolean((output as { isTTY?: boolean }).isTTY));
  const lines = lineReader(input);
  const ask = async (q: string) => { write(q); const a = await lines.next(); if (a === null) throw new Quit(); return a.trim(); };
  const heading = (title: string) => ui.enabled ? ui.section(title) : title;
  const note = (value: string) => ui.enabled ? ui.dim(value) : value;
  const line = (value: string) => ui.enabled ? ui.line(value) : value;
  const brief = (value: string) => value.length > 130 ? `${value.slice(0, 127).replace(/\s+\S*$/, '')}…` : value;
  const choose = async <T,>(title: string, items: Choice<T>[], back: string): Promise<T | 'q' | 'b'> => {
    write(`\n${heading(title)}\n\n`);
    items.forEach((it, i) => {
      const number = String(i + 1).padStart(2);
      if (it.description) {
        write(`  ${ui.accent(number)}  ${ui.bold(it.label)}\n`);
        write(line(`      ${it.description}`) + '\n\n');
      } else write(line(`  ${number}  ${it.label}`) + '\n');
    });
    write(`\n  ${note(back)}\n`);
    for (;;) {
      const a = (await ask('  Enter a number and press Enter: ')).toLowerCase();
      if (a === 'q' || a === 'b') return a;
      const n = Number(a);
      const item = a && Number.isInteger(n) && n >= 1 ? items[n - 1] : undefined;
      if (item) return item.value;
      write(`  Type 1-${items.length}, ${back.split(')')[0]}.\n`);
    }
  };
  // Enter is always the safe default; unexpected input must never silently confirm or cancel.
  const confirm = async (question: string, yesLabel: string, noLabel: string): Promise<boolean> => {
    write(`\n${heading(question)}\n  y + Enter: ${yesLabel}\n  Enter or n + Enter: ${noLabel}\n`);
    for (;;) {
      const answer = (await ask('  Your choice [y/N]: ')).toLowerCase();
      if (answer === 'y' || answer === 'yes') return true;
      if (answer === '' || answer === 'n' || answer === 'no') return false;
      write('  Please type y or n, then press Enter.\n');
    }
  };
  let last = 0;
  try {
    if (ui.enabled) write(ui.header('explore'));
    write(`${line('  Explore your design system, one step at a time.')}\n  Choose a number and press Enter. Type q and press Enter to quit.\n`);
    for (;;) {
      const groups = Object.entries(GROUPS).map(([g, label]) => ({ g, label, list: commands().filter((c) => c.group === g) })).filter((x) => x.list.length);
      const group = await choose('Groups:', groups.map((x) => ({ label: `${x.label.padEnd(12)} ${x.list.length} ${x.list.length === 1 ? 'command' : 'commands'}`, value: x })), 'q) quit');
      if (group === 'q') break;
      if (group === 'b') continue;
      const cmd = await choose<Command>(`${group.label}:`, group.list.map((c) => ({ label: c.name, description: brief(c.summary.split(/(?<=\.)\s/)[0] ?? c.summary), value: c })), 'b) back   q) quit');
      if (cmd === 'q') break;
      if (cmd === 'b') continue;
      write(`\n${heading(cmd.name)}\n  ${line(brief(cmd.summary))}\n  ${note(`More: sketchbook help ${cmd.name} --details`)}\n  ${note(cmd.mutates ? (cmd.dryRun ? 'Changes files · a preview runs before confirmation' : 'Changes files · confirmation required') : 'Read-only · no files changed')}\n`);
      write(`  Documentation: ${DOCS_URL}\n`);
      const current = await currentValues(root);
      const argv = [cmd.name];
      for (const a of cmd.args) {
        const selected = cmd.subcommands?.find((sub) => typeof sub !== 'string' && sub.name === argv[1]);
        const sub = typeof selected === 'object' ? selected : undefined;
        const remainingUsage = sub?.usage.slice(`sketchbook ${cmd.name} ${sub.name}`.length).trim();
        const required = a.required || Boolean(a.variadic && remainingUsage?.startsWith('<'));
        // Only suggest literal examples: quoted arguments and flags need shell parsing, which this prompt does not perform.
        const candidates = [...(sub?.examples ?? []), ...cmd.examples];
        const example = candidates.map((e) => e.split(/\s+/)).find((parts) =>
          parts[0] === 'sketchbook' && parts[1] === cmd.name &&
          argv.slice(1).every((arg, i) => parts[i + 2] === arg) &&
          parts.length > argv.length + 1 && parts.slice(argv.length + 1).every((part) => /^[a-zA-Z0-9_./:=@+-]+$/.test(part)));
        const values = example?.slice(argv.length + 1);
        const hint = values?.length ? (a.variadic ? values.join(' ') : values[0]) : undefined;
        for (;;) {
          const description = a.variadic && sub && remainingUsage ? `Arguments for ${sub.name}: ${remainingUsage}` : `${a.name}: ${brief(a.description)}`;
          write(`\n${line(`  ${description}`)}\n`);
          if (hint) write(`${line(`  Example to type: ${hint}`)}\n`);
          const v = await ask(`  ${required ? 'Type a value and press Enter' : 'Type a value, or press Enter to skip'}: `);
          if (!v && required) { write('Required.\n'); continue; }
          if (v) argv.push(...(a.variadic ? v.split(/\s+/) : [v]));
          break;
        }
      }
      const configure = Object.keys(cmd.options).length > 0 && await confirm('Configure optional settings?', 'review options', 'use defaults');
      if (configure) for (const [k, o] of Object.entries(cmd.options)) {
        const hint = current[k] !== undefined ? ` [current: ${current[k]}; Enter keeps it]` : ' [Enter skips]';
        if (o.type === 'boolean') { if (await confirm(`--${k}: ${o.description}`, 'enable', 'leave off')) argv.push(`--${k}`); continue; }
        const example = o.value && /^(?:https?:\/\/\S+|\d+(?:\.\d+)?)$/.test(o.value) ? `\n  Example to type: ${o.value}` : '';
        const v = await ask(`\n  --${k}: ${brief(o.description)}${hint}${example}\n  Value: `);
        if (v) argv.push(`--${k}`, v);
      }
      // Display a shell-safe command for people who want to repeat it.
      const shown = `sketchbook ${argv.map((x) => (/^[a-zA-Z0-9_./:=@+-]+$/.test(x) ? x : `'${x.replace(/'/g, `'\\''`)}'`)).join(' ')}`;
      if (cmd.mutates && cmd.dryRun) {
        write(`\n${heading('Preview · no files will be changed')}\n  ${shown} --dry-run\n\n`);
        last = await run([...argv, '--dry-run'], { root, stdout: write, stderr: write, human: ui.enabled });
        if (last === 1) { write('The dry run failed; nothing was changed.\n'); continue; }
        if (!await confirm('Apply these changes?', 'apply changes', 'cancel without applying')) { write(`\n  ${ui.warning('Not applied.')} No files were changed.\n`); continue; }
      } else if (cmd.mutates && !await confirm(`Run ${shown}? This changes files.`, 'run command', 'cancel without running')) { write(`\n  ${ui.warning('Not run.')} No files were changed.\n`); continue; }
      write(`\n${heading('Running')}\n  Running: ${shown}\n\n`);
      last = await run(argv, { root, stdout: write, stderr: write, human: ui.enabled });
      write(`\n${heading(last === 0 ? ui.success('Done') : ui.warning(last === 2 ? 'Done with notices' : 'Command failed'))}  ${note(`exit ${last}`)}\n`);
    }
  } catch (e) {
    if (!(e instanceof Quit)) throw e;
  } finally {
    lines.close();
  }
  write('Bye.\n');
  return last;
}

class Quit extends Error {}

interface TtyEnds { stdin?: { isTTY?: boolean }; stdout?: { isTTY?: boolean } }

// Bare `sketchbook`: the menu only when both ends are a terminal and --json was not asked for.
export const wantsInteractive = (argv: string[], { stdin = process.stdin, stdout = process.stdout }: TtyEnds = {}): boolean => argv.length === 0 && Boolean(stdin.isTTY && stdout.isTTY);
