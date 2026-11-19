// docs/cli.md, generated from the command registry (npm run build:cli-docs; check G1 keeps it fresh).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { commands, GROUPS, subcommandsOf } from './registry.mjs';
import { usage, GLOBAL_OPTIONS } from './run.mjs';
import { isMain } from '../lib/files.mjs';

export function cliDocs(): string {
  const lines = [
    '# sketchbook CLI',
    '',
    '<!-- GENERATED from harness/cli/commands by npm run build:cli-docs. Do not edit; change the command module. -->',
    '',
    'Use the Sketchbook CLI to set up your project, change its sources, and verify the outputs. Run `sketchbook help <command> --details` for the full terminal reference.',
    '',
    '## Conventions',
    '',
    '- Bare `sketchbook` in a terminal opens an interactive menu built from this registry: enter a number to pick a group and command, provide arguments, and optionally review settings. Mutating commands show a dry run where supported; type y and press Enter to confirm, or press Enter to cancel. Piped input or `--json` prints help instead.',
    '- `--details` shows full human-readable output where a terminal view is abbreviated.',
    '- `--json` on every command prints one envelope: `{ ok, command, changed[], warnings[], errors[{file, msg, fix}], next, data? }`.',
    '- Exit codes: 0 ok, 1 failed, 2 ok with flags (for example overrides kept in spec/tokens/overrides.json).',
    '- Use `--dry-run` on commands marked as supporting it to review the paths and values that would change.',
    '- Conventions (one registry, introspect before mutate, JSON envelope) are adapted from CLI-Anything (HKUDS, Apache-2.0, https://github.com/HKUDS/CLI-Anything); no code is used.',
    '',
    '| Global option | Meaning |',
    '| --- | --- |',
    ...Object.entries(GLOBAL_OPTIONS).map(([k, o]) => `| \`--${k}\` | ${o.description} |`),
    '',
  ];
  for (const [g, label] of Object.entries(GROUPS)) {
    const list = commands().filter((c) => c.group === g);
    if (!list.length) continue;
    lines.push(`## ${label}`, '');
    for (const c of list) {
      lines.push(`### ${c.name}`, '', c.summary, '', '```', usage(c), '```', '', `${c.mutates ? 'Changes files' : 'Read-only'}${c.dryRun ? '; supports `--dry-run`' : ''}.`, '');
      if (c.args.length) lines.push('| Argument | Meaning |', '| --- | --- |', ...c.args.map((a) => `| \`${a.name}\`${a.required ? '' : ' (optional)'} | ${a.description} |`), '');
      if (Object.keys(c.options).length) lines.push('| Option | Meaning |', '| --- | --- |', ...Object.entries(c.options).map(([k, o]) => `| \`--${k}\` | ${o.description.replace(/\|/g, '\\|')} |`), '');
      if (c.subcommands) {
        const subs = subcommandsOf(c);
        lines.push('| Subcommand | What it does |', '| --- | --- |', ...subs.map((sc) => `| \`${sc.usage.replace(/\|/g, '\\|')}\` | ${sc.summary.replace(/\|/g, '\\|')}${sc.mutates ? '' : ' Read-only.'} |`), '');
        lines.push('Examples:', '', ...[...c.examples, ...subs.flatMap((sc) => sc.examples)].filter((e, i, a) => a.indexOf(e) === i).map((e) => `- \`${e}\``), '');
        continue;
      }
      lines.push('Examples:', '', ...c.examples.map((e) => `- \`${e}\``), '');
    }
  }
  return lines.join('\n');
}

if (isMain(import.meta.url)) {
  writeFileSync(fileURLToPath(new URL('../../docs/cli.md', import.meta.url)), cliDocs());
  console.log('docs/cli.md written from the command registry');
}
