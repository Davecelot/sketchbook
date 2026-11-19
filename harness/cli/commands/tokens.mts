// sketchbook tokens <subcommand>: one registry command with subcommands (declared in `subcommands`, which help and
// docs/cli.md list). Mutating subcommands run on a temporary stage: write, regenerate, build, run the token checks
// (T1–T7, G1, F1); --dry-run reports and discards, a real run copies the changed files back only when the checks pass,
// prints the CSS diff, impact, links and overrides, and proposes an SB decision record when a file changed (unless --no-record).
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { join, resolve, dirname } from 'node:path';
import { runChecks, formatHuman } from '../../checks/run.mjs';
import { proposeDecision } from '../../lib/decisions.mjs';
import { listOverrides, resetOverride, resetAll } from '../../generators/overrides.mjs';
import { familiesFor, planSet, planPreset, planAdd, planRemove, planRename, planScratch, runPlan, staleLinks, formatDiff, impactOfDiff, diffAgainst, impact, formatImpact, SCRATCH_QUESTIONS, questionDefault, fail } from '../../commands/tokens.mjs';
import { buildProposal, planImportApply, FORMATS } from '../../commands/tokens-import.mjs';
import { presetsOf } from '../../standards/resolve.mjs';
import presetsCmd from './presets.mjs';
import { parseJson, show } from '../../lib/files.mjs';
import type { CssDiff, PlanDecision, TokenPlan } from '../../commands/tokens.mjs';
import type { Command, CommandContext, CommandResult, IssueLike, OptionSpecs, SubcommandInfo } from '../types.mjs';

type TokensContext = CommandContext<typeof options>;
// A token plan as mutate takes it: overrides reset adds what it touches and no decision.
type MutatePlan<D extends object> = Omit<TokenPlan<D>, 'decision'> & { decision?: PlanDecision | null };
interface TokensSubcommand extends Omit<SubcommandInfo, 'usage'> {
  usage: string;
  run(ctx: TokensContext): CommandResult | Promise<CommandResult>;
}
interface Question { key: string; q: string; hint?: string | null; default?: string }

export const TOKEN_CHECKS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'G1', 'F1'];
const DECISIONS = 'spec/decisions/DECISIONS.md';
const LINKS_FILE = 'spec/tokens/brand-links.json';

// .css/.scss is CSS custom properties; .json or a folder of token sets is DTCG / Tokens Studio.
const formatOf = (p: string): 'css' | 'dtcg' | null => (/\.s?css$/i.test(p) ? 'css' : /\.json$/i.test(p) || (existsSync(p) && statSync(p).isDirectory()) ? 'dtcg' : null);
const interactive = (json: boolean) => !json && process.stdin.isTTY && process.stdout.isTTY;
async function ask(questions: Question[]): Promise<Record<string, string | undefined>> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answers: Record<string, string | undefined> = {};
  try { for (const q of questions) { const a = (await rl.question(`${q.q}${q.hint ? ` (${q.hint})` : ''} [${q.default}]: `)).trim(); answers[q.key] = a || q.default; } } finally { rl.close(); }
  return answers;
}

const watchOutOf = (diff: CssDiff, imp: { components: string[] }) => {
  const modes = Object.entries(diff).map(([m, d]) => `${m} ${d.changed.length} changed, ${d.added.length} added, ${d.removed.length} removed`).join('; ') || 'no CSS change';
  return `CSS: ${modes}. Components using changed semantic tokens: ${imp.components.join(', ') || 'none'}. PROPOSAL: accessibility limits close to the edge, and who must review.`;
};

// The shared tail of every mutating subcommand: refuse over hand-edited linked tokens (unless --yes), run the plan on a
// stage with the token checks, apply only when they pass, and propose an SB record only when a file changed.
async function mutate<D extends object>(ctx: TokensContext, plan: MutatePlan<D>, next?: string): Promise<CommandResult> {
  const { root, dryRun, out, json, options } = ctx;
  for (const s of plan.summary) out(s);
  for (const w of plan.warnings) out(`warning: ${w}`);
  const stale = await staleLinks(root);
  if (stale.length && !options.yes) {
    return {
      exitCode: 1, changed: [], data: { ...plan.data, staleLinks: stale, dryRun },
      errors: [{ file: LINKS_FILE, msg: `${stale.length} brand-linked token value(s) differ from their link (edited by hand?) and this command would overwrite them: ${stale.slice(0, 4).join('; ')}${stale.length > 4 ? '; …' : ''}.`, fix: `To keep the hand value, delete that token's entry in ${LINKS_FILE} (you own it then); to let the link win, re-run with --yes.` }],
      next: `Delete the link in ${LINKS_FILE}, or re-run with --yes.`,
    };
  }
  if (stale.length) out(`--yes: the brand links overwrite ${stale.length} hand-edited value(s): ${stale.join('; ')}`);
  const r = await runPlan(root, plan, { dryRun, check: (dir) => runChecks(dir, { only: TOKEN_CHECKS }) });
  out(formatDiff(r.diff).join('\n'));
  const imp = r.failed ? { semantic: [], components: [] } : await impactOfDiff(root, r.diff);
  if (imp.semantic.length) out(`Impact: ${imp.semantic.length} semantic token(s) change value (${imp.semantic.slice(0, 8).join(', ')}${imp.semantic.length > 8 ? ', …' : ''}); components: ${imp.components.join(', ') || 'none'}.`);
  for (const m of r.linkWarnings) out(`link not applied: ${m.msg}`);
  for (const c of r.linked) out(`linked: ${c}`);
  for (const p of r.overrides.added) out(`override added: ${p} (hand-added foundation token, recorded)`);
  for (const p of r.overrides.dropped) out(`override dropped: ${p}`);
  if (r.overrides.kept.length) out(`overrides kept: ${r.overrides.kept.join(', ')}`);
  const data = { ...plan.data, diff: r.diff, impact: imp, links: { changed: r.linked, missing: r.linkWarnings }, overrides: r.overrides };
  const warnings: (string | IssueLike)[] = [...plan.warnings, ...r.linkWarnings, ...r.warnings];
  if (!json && r.report) { out(`Checks (${TOKEN_CHECKS.join(', ')}):`); out(formatHuman(r.report).join('\n')); }
  if (r.failed) {
    if (r.conflict?.length) {
      out(`Nothing written: ${r.conflict.length} file(s) changed in the project while the command ran: ${r.conflict.join(', ')}`);
      return { changed: [], warnings, errors: r.errors, exitCode: 1, data: { ...data, dryRun, applied: false, wouldChange: r.changed, conflict: r.conflict }, next: 'Save or commit those edits, then run the command again.' };
    }
    out(dryRun ? '(dry run: the real run would be refused; nothing written)' : 'Nothing written: the change fails the token checks.');
    return { changed: [], warnings, errors: r.errors, exitCode: 1, data: { ...data, dryRun, applied: false, wouldChange: r.changed }, next: 'Fix the change (each error names its fix), then run it again.' };
  }
  if (dryRun) {
    out(`(dry run: nothing written; ${r.changed.length} file(s) would change)`);
    return { changed: r.changed, warnings, data: { ...data, dryRun: true }, next: 'Run the same command without --dry-run to apply it.' };
  }
  if (!r.changed.length) out('Nothing changed: the files already say this.');
  let decision = null;
  if (plan.decision && !options['no-record'] && r.changed.length) {
    decision = await proposeDecision(root, { section: 'Theme', title: plan.decision.title, context: 'PROPOSAL: what prompted the change (roast finding, brand, product need).', decision: plan.decision.decision, why: 'PROPOSAL: the trade-off accepted, with the standard\'s source link.', watchOut: watchOutOf(r.diff, imp) });
    out(`Proposed decision ${decision} in ${DECISIONS} (fill the PROPOSAL parts; set accepted when agreed).`);
  }
  return {
    changed: [...r.changed, ...(decision ? [DECISIONS] : [])], warnings, errors: [], exitCode: 0,
    data: { ...data, decision },
    next: next ?? 'Review in Storybook (Foundations pages), then sketchbook sync tokens if a design file is connected.',
  };
}

function need(args: string[], n: 1, usage: string): asserts args is [string, ...string[]];
function need(args: string[], n: 2, usage: string): asserts args is [string, string, ...string[]];
function need(args: string[], n: number, usage: string): void { if (args.length < n) throw fail(`Usage: sketchbook tokens ${usage}`, `Run sketchbook help tokens.`); }
const readOnly = (ctx: Pick<TokensContext, 'dryRun'>, name: string): void => { if (ctx.dryRun) throw fail(`tokens ${name} is read-only; --dry-run does not apply.`, 'Drop --dry-run.'); };

const SUBCOMMANDS: TokensSubcommand[] = [
  {
    name: 'rebuild', usage: 'rebuild', mutates: true,
    summary: 'Rebuild foundations and linked tokens from the current brand, preserving recorded and hand-edited foundation overrides. Review the dry run first.',
    examples: ['sketchbook tokens rebuild --dry-run', 'sketchbook tokens rebuild'],
    async run(ctx) {
      if (ctx.args.length) throw fail('tokens rebuild takes no arguments.', 'Run sketchbook help tokens.');
      return mutate(ctx, { summary: ['Rebuild foundations and linked tokens from the current brand.'], warnings: [], data: {} });
    },
  },
  {
    name: 'set', usage: 'set <key> <value>', mutates: true,
    summary: 'Set one value in brand.config.json by dot path (validated against the schema and the catalog); a .preset key replaces its sibling fine overrides.',
    examples: ['sketchbook tokens set typography.family Inter', 'sketchbook tokens set spacing.preset grid-8 --dry-run', 'sketchbook tokens set color.primary "#0F766E"'],
    async run(ctx) { need(ctx.args, 2, this.usage); return mutate(ctx, await planSet(ctx.root, ctx.args[0], ctx.args.slice(1).join(' '))); },
  },
  {
    name: 'preset', usage: 'preset <foundation> <id>', mutates: true,
    summary: 'Switch a foundation to a catalog preset. <foundation> is a family (typeScale), its config key (typography.scale) or an area (typography, color, z-index).',
    examples: ['sketchbook tokens preset spacing grid-8 --dry-run', 'sketchbook tokens preset typography perfect-fourth', 'sketchbook tokens preset motion material-like'],
    async run(ctx) { need(ctx.args, 2, this.usage); return mutate(ctx, await planPreset(ctx.root, ctx.args[0], ctx.args[1])); },
  },
  {
    name: 'presets', usage: 'presets [foundation]', mutates: false,
    summary: 'List the standards catalog (same as sketchbook presets); an area lists each of its families.',
    examples: ['sketchbook tokens presets', 'sketchbook tokens presets color'],
    run(ctx) {
      readOnly(ctx, 'presets');
      if (!ctx.args[0]) return presetsCmd.run({ ...ctx, args: [] });
      const fams = familiesFor(ctx.args[0]);
      const data: unknown[] = [];
      for (const f of fams) { const r = presetsCmd.run({ ...ctx, args: [f] }); data.push(r.data); if (fams.length > 1) ctx.out(''); }
      return { data: fams.length === 1 ? data[0] : { families: data }, next: `sketchbook tokens preset ${ctx.args[0]} <id> --dry-run` };
    },
  },
  {
    name: 'diff', usage: 'diff [--against <ref>]', mutates: false,
    summary: 'CSS custom properties added, removed and changed per mode: generated/css/tokens.css now vs a git ref (default HEAD).',
    examples: ['sketchbook tokens diff', 'sketchbook tokens diff --against main'],
    async run(ctx) {
      readOnly(ctx, 'diff');
      const ref = ctx.options.against ?? 'HEAD';
      const diff = await diffAgainst(ctx.root, ref);
      ctx.out(`tokens.css vs ${ref}:`);
      ctx.out(formatDiff(diff, 40).join('\n'));
      return { data: { against: ref, diff, impact: await impactOfDiff(ctx.root, diff) } };
    },
  },
  {
    name: 'impact', usage: 'impact <token-path | --css-var>', mutates: false,
    summary: 'What depends on a token: semantic aliases, brand links, contracts (component tokens, contrast pairs), and stories, specs, .storybook and patterns using its CSS variable.',
    examples: ['sketchbook tokens impact color.primary', 'sketchbook tokens impact color.neutral.900'],
    async run(ctx) {
      readOnly(ctx, 'impact');
      need(ctx.args, 1, this.usage);
      const i = await impact(ctx.root, ctx.args[0]);
      ctx.out(formatImpact(i).join('\n'));
      if (ctx.options.verbose) for (const f of i.files) ctx.out(`    ${f.ref} (${f.category})`);
      return { data: i };
    },
  },
  {
    name: 'add', usage: 'add <semantic.path> (--value v | --light v --dark v) [--type t] [--pair fg:bg --kind text|large-text|ui]', mutates: true,
    summary: 'Add a semantic token: one mode-less value (--value) or one per mode (--light, --dark; modes by role); optionally a contrast pair.',
    examples: ['sketchbook tokens add color.highlight --light "{color.neutral.100}" --dark "{color.neutral.800}" --pair color.foreground:color.highlight', 'sketchbook tokens add space.section --value "{space.16}"'],
    async run(ctx) {
      need(ctx.args, 1, this.usage);
      const o = ctx.options;
      return mutate(ctx, await planAdd(ctx.root, ctx.args[0], { value: o.value, light: o.light, dark: o.dark, type: o.type, pair: o.pair, kind: o.kind }));
    },
  },
  {
    name: 'remove', usage: 'remove <semantic.path>', mutates: true,
    summary: 'Remove a semantic token from every semantic file; refused (with the impact) while anything depends on it.',
    examples: ['sketchbook tokens remove color.legacy-accent --dry-run'],
    async run(ctx) { need(ctx.args, 1, this.usage); return mutate(ctx, await planRemove(ctx.root, ctx.args[0])); },
  },
  {
    name: 'rename', usage: 'rename <old> <new>', mutates: true,
    summary: 'Rename a semantic token (or group) everywhere: semantic files and aliases, brand links, contracts (tokens, contrast), contrast.json, CSS variables in stories, specs, patterns and .storybook.',
    examples: ['sketchbook tokens rename color.muted color.subtle --dry-run', 'sketchbook tokens rename color.muted color.subtle'],
    async run(ctx) { need(ctx.args, 2, this.usage); return mutate(ctx, await planRename(ctx.root, ctx.args[0], ctx.args[1]), 'Run the behavior specs (npm run test:component): renamed variables are now checked by T7.'); },
  },
  {
    name: 'import', usage: 'import <file|folder> --from dtcg|css [--name n] | import apply <proposal> [--only semantic|foundation|mapped] [--min-confidence 0.6]', mutates: true,
    summary: 'Parse existing tokens (DTCG / Tokens Studio, one file or a folder of sets, CSS custom properties) into generated/import/<name>.proposal.json with a proposed mapping; "import apply" writes a reviewed proposal into brand.config and the semantic files.',
    examples: ['sketchbook tokens import tokens.json --from dtcg', 'sketchbook tokens import theme.css --from css --name brand', 'sketchbook tokens import apply generated/import/brand.proposal.json --dry-run'],
    async run(ctx) {
      need(ctx.args, 1, this.usage);
      if (ctx.args[0] === 'apply') {
        need(ctx.args, 2, this.usage);
        const min = ctx.options['min-confidence'] !== undefined ? Number(ctx.options['min-confidence']) : undefined;
        return mutate(ctx, await planImportApply(ctx.root, resolve(ctx.root, ctx.args[1]), { only: ctx.options.only, minConfidence: min }));
      }
      const from = ctx.options.from ?? formatOf(resolve(ctx.root, ctx.args[0]));
      if (from === null || !FORMATS.includes(from)) throw fail(`tokens import cannot tell the format of ${ctx.args[0]}: pass --from ${FORMATS.join('|')}.`, 'e.g. sketchbook tokens import tokens.json --from dtcg');
      const r = await buildProposal(ctx.root, resolve(ctx.root, ctx.args[0]), { from, name: ctx.options.name });
      const p = r.proposal;
      const confident = p.mapping.filter((m) => m.apply).length;
      ctx.out(`${p.tokens.length} token(s) parsed (${from}${p.source.modes.length ? `, modes ${p.source.modes.join(', ')}` : ''}); ${p.mapping.length} mapping(s) (${confident} confident), ${p.unmapped.length} unmapped${p.skipped ? `, ${p.skipped.count} component token(s) skipped` : ''}.`);
      for (const m of p.mapping) ctx.out(`  ${m.apply ? '+' : '?'} ${m.from} -> ${m.to} (${m.confidence}) ${m.reason}`);
      for (const u of p.unmapped.slice(0, 20)) ctx.out(`  - ${u.path} (${show(u.type ?? 'unknown')}): unmapped`);
      if (p.unmapped.length > 20) ctx.out(`  … ${p.unmapped.length - 20} more unmapped`);
      const next = `Review ${r.path} (the foundations skill's token-mapper brief for the unmapped), then sketchbook tokens import apply ${r.path} --dry-run`;
      if (ctx.dryRun) { ctx.out(`(dry run: would write ${r.path})`); return { changed: [r.path], data: { ...p, dryRun: true }, next }; }
      await mkdir(join(ctx.root, dirname(r.path)), { recursive: true });
      await writeFile(join(ctx.root, r.path), JSON.stringify(p, null, 2) + '\n');
      ctx.out(`Wrote ${r.path}. Nothing else changed.`);
      return { changed: [r.path], data: { path: r.path, mapped: p.mapping.length, confident, unmapped: p.unmapped.length }, next };
    },
  },
  {
    name: 'scratch', usage: 'scratch [--answers file.json]', mutates: true,
    summary: 'Restart the foundations: a minimal brand.config.json from answers (a JSON file, or questions when interactive; defaults otherwise). The semantic interface is kept.',
    examples: ['sketchbook tokens scratch --dry-run', 'sketchbook tokens scratch --answers answers.json'],
    async run(ctx) {
      let answers: Record<string, string | undefined> = {};
      if (ctx.options.answers) {
        const { readFile } = await import('node:fs/promises');
        answers = parseJson<Record<string, string | undefined>>(await readFile(resolve(ctx.root, ctx.options.answers), 'utf8'));
      } else if (interactive(ctx.json)) {
        answers = await ask(SCRATCH_QUESTIONS.map((q) => ({ ...q, default: questionDefault(q), hint: q.family ? presetsOf(q.family).filter((p) => p.implemented !== false).map((p) => p.id).join(' | ') : null })));
      }
      return mutate(ctx, await planScratch(ctx.root, answers), 'Run the foundations skill (guided) over each area; T7 lists any interface token that no longer resolves.');
    },
  },
  {
    name: 'overrides', usage: 'overrides list | reset <path> | reset --all [--yes]', mutates: true,
    summary: 'Hand edits kept in spec/tokens/overrides.json: list them, reset one to the generated value (a hand-added token is removed), or reset all (asks unless --yes).',
    examples: ['sketchbook tokens overrides list', 'sketchbook tokens overrides reset radius.md', 'sketchbook tokens overrides reset --all --yes'],
    async run(ctx) {
      const [action = 'list', path] = ctx.args;
      if (action === 'list') {
        readOnly(ctx, 'overrides list');
        const list = await listOverrides(ctx.root);
        if (!list.length) ctx.out('No overrides: the foundation equals generator(brand.config.json).');
        for (const o of list) ctx.out(`${o.token} = ${JSON.stringify(o.value)} (${o.added ? 'added by hand' : `generated ${JSON.stringify(o.generated)}`}) in ${o.file}`);
        return { data: { overrides: list }, exitCode: list.length ? 2 : 0, next: list.length ? 'Move each into brand.config.json, then sketchbook tokens overrides reset <path>; or record why it stays.' : null };
      }
      if (action !== 'reset') throw fail(`Unknown overrides action "${action}".`, 'Use list, reset <path> or reset --all.');
      const list = await listOverrides(ctx.root);
      let targets: string[];
      let apply: (dir: string) => Promise<void>;
      if (ctx.options.all) {
        targets = list.map((o) => o.token);
        apply = async (dir) => { await resetAll(dir); };
        if (targets.length && !ctx.options.yes && !ctx.dryRun) {
          if (!interactive(ctx.json)) throw fail(`reset --all drops ${targets.length} override(s).`, 'Add --yes to confirm (or --dry-run to see them).');
          const a = await ask([{ key: 'ok', q: `Drop ${targets.length} override(s) (${targets.join(', ')})?`, default: 'no' }]);
          // ask answers every question (its default when left empty).
          if (!/^y(es)?$/i.test(a.ok ?? '')) return { data: { cancelled: true }, next: null };
        }
      } else {
        if (!path) throw fail('Usage: sketchbook tokens overrides reset <path> | reset --all', 'Name the token (sketchbook tokens overrides list).');
        if (!list.some((o) => o.token === path)) throw fail(`No override for ${path}.`, `Overrides: ${list.map((o) => o.token).join(', ') || 'none'}.`);
        targets = [path];
        apply = async (dir) => { await resetOverride(dir, path); };
      }
      const plan = {
        apply,
        touches: ['spec/tokens/overrides.json', 'spec/tokens/foundation/*'],
        summary: [targets.length ? `Reset ${targets.join(', ')} to the generated value(s).` : 'No overrides to reset.'],
        warnings: [], data: { reset: targets }, decision: null,
      };
      return mutate(ctx, plan);
    },
  },
];

const options = {
  value: { type: 'string', value: 'v', description: 'add: mode-less value (alias like {space.4}, or a literal)' },
  light: { type: 'string', value: 'v', description: 'add: value for light-role modes' },
  dark: { type: 'string', value: 'v', description: 'add: value for dark-role modes' },
  type: { type: 'string', value: 'type', description: 'add: $type when it cannot be inferred (color, dimension, number, …)' },
  pair: { type: 'string', value: 'fg:bg', description: 'add: also declare a contrast pair (fg:bg or fg/bg) in spec/tokens/contrast.json' },
  kind: { type: 'string', value: 'text|large-text|ui', description: 'add: kind of the contrast pair (default text)' },
  against: { type: 'string', value: 'ref', description: 'diff: git ref to compare with (default HEAD)' },
  from: { type: 'string', value: 'dtcg|css', description: 'import: source format (default: from the file, .css/.scss is css, .json or a folder is dtcg)' },
  name: { type: 'string', value: 'n', description: 'import: proposal name (default: the file name)' },
  only: { type: 'string', value: 'semantic|foundation|mapped', description: 'import apply: only semantic (alias mapped) or only foundation entries' },
  'min-confidence': { type: 'string', value: '0.6', description: 'import apply: skip entries below this confidence' },
  answers: { type: 'string', value: 'file.json', description: 'scratch: answers (name, primary, neutral, font, scale, spacing, radius, density, motion, elevation, contrast)' },
  all: { type: 'boolean', description: 'overrides reset: every override' },
  yes: { type: 'boolean', description: 'overrides reset --all: confirm without asking; any mutating subcommand: let the brand links overwrite hand-edited linked tokens' },
  verbose: { type: 'boolean', description: 'impact: list every file reference' },
  'no-record': { type: 'boolean', description: 'Do not propose an SB decision record (each mutating call that changes a file proposes one otherwise)' },
} satisfies OptionSpecs;

export const findSub = (name: string | undefined): TokensSubcommand | undefined => SUBCOMMANDS.find((s) => s.name === name);

export default {
  name: 'tokens',
  group: 'tokens',
  summary: 'Change foundations and semantic tokens through the harness: set, preset, presets, diff, impact, add, remove, rename, import, scratch, overrides.',
  args: [
    { name: 'subcommand', required: true, description: SUBCOMMANDS.map((s) => s.name).join(' | ') },
    { name: 'args', required: false, variadic: true, description: 'The subcommand\'s arguments (see below)' },
  ],
  options,
  subcommands: SUBCOMMANDS.map(({ name, usage, summary, mutates, examples }) => ({ name, usage: `sketchbook tokens ${usage}`, summary, mutates, examples })),
  examples: ['sketchbook tokens set typography.family Inter --dry-run', 'sketchbook tokens impact color.border', 'sketchbook tokens rename color.muted color.subtle --dry-run', 'sketchbook tokens import theme.css --from css'],
  mutates: true,
  dryRun: true,
  cssVarArgs: true,
  async run(ctx) {
    const [name, ...args] = ctx.args;
    const sub = findSub(name);
    if (!sub) throw fail(`Unknown tokens subcommand "${name}".`, `Use one of: ${SUBCOMMANDS.map((s) => s.name).join(', ')} (sketchbook help tokens).`);
    return sub.run({ ...ctx, args });
  },
} satisfies Command<typeof options>;
