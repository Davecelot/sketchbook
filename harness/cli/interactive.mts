// Bare `sketchbook` in a terminal: a node:readline menu over the command registry (SB-0052).
// Groups -> commands -> prompts for arguments and options (current values from `status` shown as hints),
// then a dry run first for mutating commands and a confirmation before applying. Everything runs
// through dispatch(), so the menu can do nothing the CLI can't. Non-TTY or --json prints help instead.
import { createInterface } from 'node:readline';
import { commands, GROUPS } from './registry.mjs';
import { dispatch } from './run.mjs';
import type { DispatchIO } from './run.mjs';
import type { Command } from './types.mjs';

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

interface Choice<T> { label: string; value: T }

export async function interactive({ root = process.cwd(), input = process.stdin, output = process.stdout, run = dispatch }: InteractiveIO = {}): Promise<number> {
  const write = (s: string) => output.write(s);
  const lines = lineReader(input);
  const ask = async (q: string) => { write(q); const a = await lines.next(); if (a === null) throw new Quit(); return a.trim(); };
  const choose = async <T,>(title: string, items: Choice<T>[], back: string): Promise<T | 'q' | 'b'> => {
    write(`\n${title}\n`);
    items.forEach((it, i) => write(`  ${String(i + 1).padStart(2)}) ${it.label}\n`));
    write(`   ${back}\n`);
    for (;;) {
      const a = await ask('> ');
      if (a === 'q' || a === 'b') return a;
      const n = Number(a);
      const item = Number.isInteger(n) && n >= 1 ? items[n - 1] : undefined;
      if (item) return item.value;
      write(`Type 1-${items.length}, ${back.split(')')[0]}.\n`);
    }
  };
  let last = 0;
  try {
    write('sketchbook: pick what to do (q quits). Every choice runs a normal sketchbook command, shown before it runs.\n');
    for (;;) {
      const groups = Object.entries(GROUPS).map(([g, label]) => ({ g, label, list: commands().filter((c) => c.group === g) })).filter((x) => x.list.length);
      const group = await choose('Groups:', groups.map((x) => ({ label: `${x.label.padEnd(12)} ${x.list.map((c) => c.name).join(', ')}`, value: x })), 'q) quit');
      if (group === 'q') break;
      if (group === 'b') continue;
      const cmd = await choose<Command>(`${group.label}:`, group.list.map((c) => ({ label: `${c.name.padEnd(9)} ${c.summary}`, value: c })), 'b) back   q) quit');
      if (cmd === 'q') break;
      if (cmd === 'b') continue;
      const current = await currentValues(root);
      const argv = [cmd.name];
      for (const a of cmd.args) {
        for (;;) {
          const v = await ask(`${a.name}${a.required ? '' : ' (optional)'}: ${a.description}\n> `);
          if (!v && a.required) { write('Required.\n'); continue; }
          if (v) argv.push(...(a.variadic ? v.split(/\s+/) : [v]));
          break;
        }
      }
      for (const [k, o] of Object.entries(cmd.options)) {
        const hint = current[k] !== undefined ? ` [current: ${current[k]}; Enter keeps it]` : ' [Enter skips]';
        if (o.type === 'boolean') { if (/^y(es)?$/i.test(await ask(`--${k}: ${o.description}? (y/N)\n> `))) argv.push(`--${k}`); continue; }
        const v = await ask(`--${k}: ${o.description}${hint}\n> `);
        if (v) argv.push(`--${k}`, v);
      }
      const shown = `sketchbook ${argv.map((x) => (/\s/.test(x) ? JSON.stringify(x) : x)).join(' ')}`;
      if (cmd.mutates && cmd.dryRun) {
        write(`\nDry run: ${shown} --dry-run\n`);
        last = await run([...argv, '--dry-run'], { root, stdout: write, stderr: write });
        if (last === 1) { write('The dry run failed; nothing was changed.\n'); continue; }
        if (!/^y(es)?$/i.test(await ask('Apply these changes? (y/N)\n> '))) { write('Not applied.\n'); continue; }
      } else if (cmd.mutates && !/^y(es)?$/i.test(await ask(`Run ${shown}? It changes files. (y/N)\n> `))) { write('Not run.\n'); continue; }
      write(`\nRunning: ${shown}\n`);
      last = await run(argv, { root, stdout: write, stderr: write });
      write(`(exit ${last})\n`);
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
