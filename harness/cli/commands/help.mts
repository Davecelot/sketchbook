import { commands, find, GROUPS, subcommandsOf } from '../registry.mjs';
import { usage, GLOBAL_OPTIONS } from '../run.mjs';
import { DOCS_URL, presentation } from '../presentation.mjs';
import type { Command, CommandContext, CommandOption } from '../types.mjs';

// The list shows each summary's first sentence; agents call it often, `help <command>` has the rest (SB-0114).
const brief = (s: string): string => { const [first = ''] = s.split(/(?<=\.)\s/); return first.length <= 90 ? first : `${first.slice(0, first.lastIndexOf(' ', 88))} …`; };

const describe = (c: Command) => ({ name: c.name, group: c.group, summary: c.summary, usage: usage(c), args: c.args, options: c.options, examples: c.examples, mutates: c.mutates, dryRun: c.dryRun, ...(c.subcommands ? { subcommands: subcommandsOf(c) } : {}) });

export default {
  name: 'help',
  group: 'meta',
  summary: 'Find a command or look up its usage, options, and examples.',
  args: [{ name: 'command', required: false, description: 'A command name' }],
  options: {},
  examples: ['sketchbook help', 'sketchbook help init'],
  mutates: false,
  project: false,
  dryRun: false,
  // Narrower than CommandContext: dispatch runs it for --help with no dry-run or checks.
  run({ args, out, human, details }: Pick<CommandContext, 'root' | 'args' | 'options' | 'json' | 'out' | 'human' | 'details'>) {
    const ui = presentation(Boolean(human));
    if (args[0]) {
      const c = find(args[0]);
      if (!c) throw Object.assign(new Error(`Unknown command "${args[0]}".`), { fix: 'Run sketchbook help to list commands.' });
      if (human && !details) {
        out(`${c.summary}\n\n${ui.section('Usage')}\n  ${usage(c)}\n  ${c.mutates ? 'Changes files' : 'Read-only'}`);
        if (c.args.length) { out('\nArguments:'); for (const a of c.args) out(`  ${a.name}  ${a.description}${a.required ? '' : ' (optional)'}`); }
        if (c.subcommands) out(`\nSubcommands:  ${subcommandsOf(c).map((sc) => sc.name).join('  ·  ')}`);
        if (c.examples.length) out(`\nTry:  ${c.examples[0]}`);
        out(`\nMore options  sketchbook help ${c.name} --details\nDocumentation  ${DOCS_URL}`);
        return { data: { command: describe(c) } };
      }
      out(`${usage(c)}\n\n${c.summary}${c.mutates ? ' Changes files.' : ' Read-only.'}`);
      if (c.args.length) { out('\nArguments:'); for (const a of c.args) out(`  ${a.name.padEnd(16)} ${a.description}${a.required ? '' : ' (optional)'}`); }
      const opts: Record<string, Pick<CommandOption, 'description'>> = { ...c.options, ...(c.dryRun ? { 'dry-run': GLOBAL_OPTIONS['dry-run'] } : {}), json: GLOBAL_OPTIONS.json, details: GLOBAL_OPTIONS.details };
      out('\nOptions:'); for (const [k, o] of Object.entries(opts)) out(`  --${k.padEnd(14)} ${o.description}`);
      if (c.subcommands) { out('\nSubcommands:'); for (const sc of subcommandsOf(c)) out(`  ${sc.usage}\n      ${sc.summary}${sc.mutates ? '' : ' Read-only.'}`); }
      out('\nExamples:'); for (const e of c.examples) out(`  ${e}`);
      out(`\nDocumentation: ${DOCS_URL}`);
      return { data: { command: describe(c) } };
    }
    if (human && !details) {
      out('Choose a command for the work you want to do.\n\nUsage  sketchbook <command> [arguments]\nTry    sketchbook status\n');
      for (const [g, label] of Object.entries(GROUPS)) {
        const list = commands().filter((c) => c.group === g);
        if (list.length) out(`${ui.section(label)}\n  ${list.map((c) => c.name).join('  ·  ')}\n`);
      }
      out(`More help  sketchbook help <command>  ·  sketchbook help --details\nDocumentation  ${DOCS_URL}`);
      return { data: { commands: commands().map(describe) } };
    }
    out('sketchbook <command> [arguments] [--json] [--dry-run]\n');
    for (const [g, label] of Object.entries(GROUPS)) {
      const list = commands().filter((c) => c.group === g);
      if (!list.length) continue;
      out(`${label}:`);
      for (const c of list) out(`  ${c.name.padEnd(9)} ${brief(c.summary)}`);
    }
    out(`\nsketchbook help <command> for details. Every command accepts --json (envelope: ok, command, changed, warnings, errors, next).\nDocumentation: ${DOCS_URL}`);
    return { data: { commands: commands().map(describe) } };
  },
} satisfies Command;
