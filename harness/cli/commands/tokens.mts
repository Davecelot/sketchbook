// sketchbook tokens <subcommand>: one registry command with subcommands (declared in `subcommands`, which help and
// docs/cli.md list). Mutating subcommands run on a temporary stage: write, regenerate, build, run the token checks
// (T1–T7, G1, F1); --dry-run reports and discards, a real run copies the changed files back only when the checks pass,
// prints the CSS diff, impact, links and overrides, and proposes an SB decision record when a file changed (unless --no-record).
import { createInterface } from 'node:readline/promises';
import { resolve } from 'node:path';
import { runChecks, formatHuman } from '../../checks/run.mjs';
import { proposeDecision } from '../../lib/decisions.mjs';
import { listOverrides, resetOverride, resetAll } from '../../generators/overrides.mjs';
import { familiesFor, planSet, planPreset, planAdd, planRemove, planRename, planRenames, planScratch, runPlan, staleLinks, formatDiff, impactOfDiff, diffAgainst, impact, formatImpact, SCRATCH_QUESTIONS, questionDefault, fail } from '../../commands/tokens.mjs';
import { buildProposal, importFormatOf, importReviewNext, planImportApply, writeImportProposal, FORMATS } from '../../commands/tokens-import.mjs';
import { namingProposal, NAMING_PRESET, readRenameList, writeRenameList } from '../../commands/tokens-rename-plan.mjs';
import { presetsOf } from '../../standards/resolve.mjs';
import presetsCmd from './presets.mjs';
import { errorMessage, parseJson, show } from '../../lib/files.mjs';
import type { CssDiff, PlanDecision, TokenPlan } from '../../commands/tokens.mjs';
import type { Command, CommandContext, CommandResult, IssueLike, OptionSpecs, SubcommandInfo } from '../types.mjs';

type TokensContext = CommandContext<typeof options>;
// A token plan as mutate takes it: overrides reset adds what it touches and no decision.
type MutatePlan<D extends object> = Omit<TokenPlan<D>, 'decision'> & { decision?: PlanDecision | null };
class PlanRefusal extends Error {
  constructor(readonly result: CommandResult) { super('Token change refused'); }
}
interface TokensSubcommand extends Omit<SubcommandInfo, 'usage'> {
  usage: string;
  run(ctx: TokensContext): CommandResult | Promise<CommandResult>;
}
interface Question { key: string; q: string; hint?: string | null; default?: string }

export const TOKEN_CHECKS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'G1', 'F1'];
const DECISIONS = 'spec/decisions/DECISIONS.md';
const LINKS_FILE = 'spec/tokens/brand-links.json';

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

// Plan from the stage, so conflict detection and the planner use the same starting files.
async function mutate<D extends object>(ctx: TokensContext, prepare: (dir: string) => MutatePlan<D> | Promise<MutatePlan<D>>, next?: string, previewNext?: string): Promise<CommandResult> {
  const { root, dryRun, out, json, options } = ctx;
  let plan!: MutatePlan<D>;
  const prepared: { decision: string | null; impact?: Awaited<ReturnType<typeof impactOfDiff>> } = { decision: null };
  let r;
  try {
    r = await runPlan(root, async (dir) => {
      plan = await prepare(dir);
      const stale = await staleLinks(dir);
      if (stale.length && !options.yes) throw new PlanRefusal({
        exitCode: 1, changed: [], data: { ...plan.data, staleLinks: stale, dryRun },
        errors: [{ file: LINKS_FILE, msg: `${stale.length} brand-linked token value(s) differ from their link (edited by hand?) and this command would overwrite them: ${stale.slice(0, 4).join('; ')}${stale.length > 4 ? '; …' : ''}.`, fix: `To keep the hand value, delete that token's entry in ${LINKS_FILE} (you own it then); to let the link win, re-run with --yes.` }],
        next: `Delete the link in ${LINKS_FILE}, or re-run with --yes.`,
      });
      if (stale.length) out(`--yes: the brand links overwrite ${stale.length} hand-edited value(s): ${stale.join('; ')}`);
      return plan;
    }, {
      dryRun,
      check: (dir) => runChecks(dir, { only: TOKEN_CHECKS }),
      finalize: async (dir, diff) => {
        prepared.impact = await impactOfDiff(dir, diff);
        if (!plan.decision || options['no-record']) return;
        try {
          prepared.decision = await proposeDecision(dir, { section: 'Theme', title: plan.decision.title, context: 'PROPOSAL: what prompted the change (roast finding, brand, product need).', decision: plan.decision.decision, why: 'PROPOSAL: the trade-off accepted, with the standard\'s source link.', watchOut: watchOutOf(diff, prepared.impact) });
        } catch (e) {
          const missing = e instanceof Error && 'code' in e && e.code === 'ENOENT';
          return {
            file: DECISIONS, id: 'decision',
            msg: missing ? `The decision log at ${DECISIONS} is missing.` : `Could not prepare the decision record in ${DECISIONS}: ${errorMessage(e)}`,
            fix: 'Restore a valid decision log and retry, or use --no-record to skip it.',
          };
        }
      },
    });
  } catch (e) {
    if (e instanceof PlanRefusal) return e.result;
    throw e;
  }
  const writeError = r.errors.find((e) => e.id === 'write' || e.id === 'decision');
  out(r.failed ? r.notRestored?.length ? 'Token change failed and some files need to be restored.' : 'Token change not applied.' : dryRun ? `Preview: ${r.changed.length} files would change.${previewNext ? ' No files written.' : ''}` : r.changed.length ? `Updated ${r.changed.length} files.` : 'Your token files already match this change.');
  for (const s of plan.summary) out(s);
  for (const w of plan.warnings) out(`Warning: ${w}`);
  if (previewNext && ctx.details) {
    const rebuilt = r.changed.filter((file) => file !== DECISIONS && !Object.hasOwn(plan.files ?? {}, file));
    if (rebuilt.length) out(`Other files changed by regeneration:\n${rebuilt.map((file) => `  ${file}`).join('\n')}`);
  }
  out(formatDiff(r.diff, previewNext ? ctx.details ? Infinity : 4 : undefined, previewNext ? 'use --details' : undefined).join('\n'));
  const imp = (!r.failed && prepared.impact) || { semantic: [], components: [] };
  if (previewNext) {
    if (imp.components.length) out(`Components affected: ${imp.components.join(', ')}.`);
  } else if (imp.semantic.length) out(`Impact: ${imp.semantic.length} semantic token(s) change value (${imp.semantic.slice(0, 8).join(', ')}${imp.semantic.length > 8 ? ', …' : ''}); components: ${imp.components.join(', ') || 'none'}.`);
  for (const m of r.linkWarnings) out(`link not applied: ${m.msg}`);
  for (const c of r.linked) out(`linked: ${c}`);
  for (const p of r.overrides.added) out(`override added: ${p} (hand-added foundation token, recorded)`);
  for (const p of r.overrides.dropped) out(`override dropped: ${p}`);
  if (r.overrides.kept.length) out(`overrides kept: ${r.overrides.kept.join(', ')}`);
  const data = { ...plan.data, diff: r.diff, impact: imp, links: { changed: r.linked, missing: r.linkWarnings }, overrides: r.overrides };
  const warnings: (string | IssueLike)[] = [...plan.warnings, ...r.linkWarnings, ...r.warnings];
  if (!json && r.report) { out(`Checks (${TOKEN_CHECKS.join(', ')}):`); out(formatHuman(r.report).join('\n')); }
  if (r.failed) {
    if (writeError) return {
      changed: r.notRestored ?? [], warnings, errors: r.errors, exitCode: 1,
      data: { ...data, dryRun, applied: false, wouldChange: r.changed, ...(r.notRestored?.length ? { notRestored: r.notRestored } : {}) },
      next: writeError.fix,
    };
    if (r.conflict?.length) {
      out(`Nothing written: ${r.conflict.length} file(s) changed in the project while the command ran: ${r.conflict.join(', ')}`);
      return { changed: [], warnings, errors: r.errors, exitCode: 1, data: { ...data, dryRun, applied: false, wouldChange: r.changed, conflict: r.conflict }, next: 'Save or commit those edits, then run the command again.' };
    }
    out(dryRun ? '(dry run: the real run would be refused; nothing written)' : 'Nothing written: the change fails the token checks.');
    return { changed: [], warnings, errors: r.errors, exitCode: 1, data: { ...data, dryRun, applied: false, wouldChange: r.changed }, next: 'Fix the change (each error names its fix), then run it again.' };
  }
  const { decision } = prepared;
  if (dryRun) {
    if (decision) out(`Would propose decision ${decision} in ${DECISIONS}.`);
    if (previewNext) out(`Next: ${previewNext}`);
    return { changed: r.changed, warnings, data: { ...data, dryRun: true, ...(decision ? { decision } : {}) }, next: previewNext ?? 'Run the same command without --dry-run to apply it.' };
  }
  if (decision) out(`Proposed decision ${decision} in ${DECISIONS} (fill the PROPOSAL parts; set accepted when agreed).`);
  const followUp = next ?? 'Review the change in Storybook under Foundations.';
  if (r.changed.length) out(`Next: ${followUp}`);
  return {
    changed: r.changed, warnings, errors: [], exitCode: 0,
    data: { ...data, decision },
    next: next ?? 'Review in Storybook (Foundations pages), then sketchbook sync tokens if a design file is connected.',
  };
}

function need(args: string[], n: 1, usage: string): asserts args is [string, ...string[]];
function need(args: string[], n: 2, usage: string): asserts args is [string, string, ...string[]];
function need(args: string[], n: number, usage: string): void { if (args.length < n) throw fail(`Usage: sketchbook tokens ${usage}`, `Run sketchbook help tokens.`); }
const readOnly = (ctx: Pick<TokensContext, 'dryRun'>, name: string): void => { if (ctx.dryRun) throw fail(`tokens ${name} is read-only; --dry-run does not apply.`, 'Drop --dry-run.'); };
const defaultRenameList = 'token-renames.json';
const renamePlanExample = `sketchbook tokens rename-plan --preset ${NAMING_PRESET.id} --out ${defaultRenameList}`;
const renamePreviewExample = `sketchbook tokens rename --map ${defaultRenameList} --dry-run`;
const shellPath = (path: string): string => /^[a-zA-Z0-9_./+-]+$/.test(path) && !path.startsWith('-') ? path
  : process.platform === 'win32' ? `'${path.replaceAll("'", "''")}'` : `'${path.replaceAll("'", "'\\''")}'`;
const mapFlag = (path: string): string => path.startsWith('-') ? `--map=${shellPath(path)}` : `--map ${shellPath(path)}`;
const checkListPath = (path: string, flag: '--map' | '--out'): void => {
  if (!path.trim() || [...path].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) throw fail(`${flag} needs a file path without control characters.`, `Use ${flag} ${defaultRenameList}.`);
};
const renameListRefusal = (path: string, e: unknown): CommandResult => ({
  changed: [],
  errors: [{ file: path, msg: `${errorMessage(e)} No files changed.`, fix: e instanceof Error && 'fix' in e && typeof e.fix === 'string' ? e.fix : 'Check the list and run the preview again.' }],
});

const SUBCOMMANDS: TokensSubcommand[] = [
  {
    name: 'rebuild', usage: 'rebuild', mutates: true,
    summary: 'Rebuild foundations and linked tokens from the current brand, preserving recorded and hand-edited foundation overrides. Review the dry run first.',
    examples: ['sketchbook tokens rebuild --dry-run', 'sketchbook tokens rebuild'],
    async run(ctx) {
      if (ctx.args.length) throw fail('tokens rebuild takes no arguments.', 'Run sketchbook help tokens.');
      return mutate(ctx, () => ({ summary: ['Rebuild foundations and linked tokens from the current brand.'], warnings: [], data: {} }));
    },
  },
  {
    name: 'set', usage: 'set <key> <value>', mutates: true,
    summary: 'Set one value in brand.config.json by dot path (validated against the schema and the catalog); a .preset key replaces its sibling fine overrides.',
    examples: ['sketchbook tokens set typography.family Inter', 'sketchbook tokens set spacing.preset grid-8 --dry-run', 'sketchbook tokens set color.primary "#0F766E"'],
    async run(ctx) { need(ctx.args, 2, this.usage); const [key, ...values] = ctx.args; return mutate(ctx, (dir) => planSet(dir, key, values.join(' '))); },
  },
  {
    name: 'preset', usage: 'preset <foundation> <id>', mutates: true,
    summary: 'Switch a foundation to a catalog preset. <foundation> is a family (typeScale), its config key (typography.scale) or an area (typography, color, z-index).',
    examples: ['sketchbook tokens preset spacing grid-8 --dry-run', 'sketchbook tokens preset typography perfect-fourth', 'sketchbook tokens preset motion material-like'],
    async run(ctx) { need(ctx.args, 2, this.usage); const [foundation, id] = ctx.args; return mutate(ctx, (dir) => planPreset(dir, foundation, id)); },
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
      const [path] = ctx.args;
      const o = ctx.options;
      return mutate(ctx, (dir) => planAdd(dir, path, { value: o.value, light: o.light, dark: o.dark, type: o.type, pair: o.pair, kind: o.kind }));
    },
  },
  {
    name: 'remove', usage: 'remove <semantic.path>', mutates: true,
    summary: 'Remove a semantic token from every semantic file; refused (with the impact) while anything depends on it.',
    examples: ['sketchbook tokens remove color.legacy-accent --dry-run'],
    async run(ctx) { need(ctx.args, 1, this.usage); const [path] = ctx.args; return mutate(ctx, (dir) => planRemove(dir, path)); },
  },
  {
    name: 'rename', usage: 'rename [<old> <new> | --map <file>] [--dry-run] [--details]', mutates: true,
    summary: 'Rename one semantic token or group, or use --map to rename several tokens together. Updates references and checks the whole change before writing.',
    examples: [renamePreviewExample, 'sketchbook tokens rename --map token-renames.json', 'sketchbook tokens rename color.muted color.subtle --dry-run'],
    async run(ctx) {
      const path = ctx.options.map;
      if (path === undefined) {
        if (ctx.args.length !== 2) throw fail('Provide two token names or a rename list.', 'Run sketchbook tokens rename --help for examples.');
        need(ctx.args, 2, this.usage);
        const [from, to] = ctx.args;
        return mutate(ctx, (dir) => planRename(dir, from, to), 'Run the behavior specs (npm run test:component): renamed variables are now checked by T7.');
      }
      if (ctx.args.length) throw fail('Use two token names or --map, not both.', `To preview a list, run ${renamePreviewExample}.`);
      checkListPath(path, '--map');
      let list;
      try {
        list = await readRenameList(resolve(ctx.root, path), path);
      } catch (e) {
        return renameListRefusal(path, e);
      }
      if (!list.renames.length) {
        ctx.out('The rename list is empty. No files changed.');
        return { data: { renames: [], tokens: {}, files: [], dryRun: ctx.dryRun } };
      }
      const flags = [ctx.options.yes && '--yes', ctx.options['no-record'] && '--no-record'].filter(Boolean).join(' ');
      return mutate(ctx, async (dir) => {
        try { return await planRenames(dir, list.renames, { details: ctx.details }); }
        catch (e) { throw new PlanRefusal(renameListRefusal(path, e)); }
      },
        'Run npx sketchbook check. Update any apps or design files outside this project that still use the old names.',
        `Review the changes above. If they look right, apply the same list:\n  npx sketchbook tokens rename ${mapFlag(path)}${flags ? ` ${flags}` : ''}`,
      );
    },
  },
  {
    name: 'rename-plan', usage: 'rename-plan [--preset <id> --out <file>] [--dry-run]', mutates: true,
    summary: 'List naming presets, or write an editable JSON rename list. Does not change tokens or overwrite a file.',
    examples: ['sketchbook tokens rename-plan', renamePlanExample],
    async run(ctx) {
      const { preset, out: path } = ctx.options;
      if (ctx.args.length) throw fail('Pass a preset with --preset.', `To write a rename list, run ${renamePlanExample}.`);
      if (preset === undefined && path === undefined) {
        ctx.out(`Naming presets:\n  ${NAMING_PRESET.id}  ${NAMING_PRESET.label}\n  ${NAMING_PRESET.description}`);
        const next = `Write a list to review:\n  npx ${renamePlanExample}`;
        ctx.out(`Next: ${next}`);
        return { data: { presets: [NAMING_PRESET] }, next };
      }
      if (preset !== NAMING_PRESET.id) throw fail(preset === undefined ? 'Choose a naming preset with --preset.' : `Unknown naming preset ${JSON.stringify(preset)}.`, 'Run sketchbook tokens rename-plan to list presets.');
      if (path === undefined) throw fail('Choose a new file with --out.', `For example, run ${renamePlanExample}.`);
      checkListPath(path, '--out');
      const list = await namingProposal(ctx.root);
      if (!list.renames.length) {
        ctx.out(`No paired colors match ${NAMING_PRESET.label}. No file was written.`);
        return { data: { preset, renames: [], path: null, dryRun: ctx.dryRun } };
      }
      await writeRenameList(resolve(ctx.root, path), path, list, ctx.dryRun);
      ctx.out(`${ctx.dryRun ? 'Would write' : 'Wrote'} ${list.renames.length} proposed renames ${ctx.dryRun ? 'to' : 'in'} ${path}. ${ctx.dryRun ? 'No files changed.' : 'No tokens changed.'}`);
      const next = ctx.dryRun
        ? `Run the same command without --dry-run to write ${path}.`
        : `Open ${path} and keep only the names you want. Then preview the changes:\n  npx sketchbook tokens rename ${mapFlag(path)} --dry-run`;
      ctx.out(`Next: ${next}`);
      return { changed: [path], data: { preset, path, ...list, dryRun: ctx.dryRun }, next };
    },
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
        const file = resolve(ctx.root, ctx.args[1]);
        return mutate(ctx, (dir) => planImportApply(dir, file, { only: ctx.options.only, minConfidence: min, displayRoot: ctx.root }));
      }
      const from = ctx.options.from ?? importFormatOf(resolve(ctx.root, ctx.args[0]));
      if (from === null || !FORMATS.includes(from)) throw fail(`tokens import cannot tell the format of ${ctx.args[0]}: pass --from ${FORMATS.join('|')}.`, 'e.g. sketchbook tokens import tokens.json --from dtcg');
      const r = await buildProposal(ctx.root, resolve(ctx.root, ctx.args[0]), { from, name: ctx.options.name });
      const p = r.proposal;
      const confident = p.mapping.filter((m) => m.apply).length;
      if (!ctx.dryRun) await writeImportProposal(ctx.root, r.path, p);
      ctx.out(ctx.dryRun ? `Would write ${r.path}. No files changed.` : `Wrote ${r.path}. Nothing else changed.`);
      ctx.out(`${p.tokens.length} token(s) parsed (${from}${p.source.modes.length ? `, modes ${p.source.modes.join(', ')}` : ''}); ${p.mapping.length} mapping(s) (${confident} confident), ${p.unmapped.length} unmapped${p.skipped ? `, ${p.skipped.count} component token(s) skipped` : ''}.`);
      for (const m of p.mapping) ctx.out(`  ${m.apply ? '+' : '?'} ${m.from} -> ${m.to} (${m.confidence}) ${m.reason}`);
      for (const u of p.unmapped.slice(0, 20)) ctx.out(`  - ${u.path} (${show(u.type ?? 'unknown')}): unmapped`);
      if (p.unmapped.length > 20) ctx.out(`  … ${p.unmapped.length - 20} more unmapped`);
      const next = importReviewNext(r.path);
      if (ctx.dryRun) return { changed: [r.path], data: { ...p, dryRun: true }, next };
      ctx.out(`Next: ${next}`);
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
      return mutate(ctx, (dir) => planScratch(dir, answers), 'Run the foundations skill (guided) over each area; T7 lists any interface token that no longer resolves.');
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
      return mutate(ctx, () => plan);
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
  map: { type: 'string', value: 'file', description: 'rename: read a JSON list of semantic token renames' },
  preset: { type: 'string', value: 'id', description: 'rename-plan: pick a naming preset from tokens rename-plan' },
  out: { type: 'string', value: 'file', description: 'rename-plan: write the list to this new JSON file' },
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
  summary: 'Set foundation values, rename semantic tokens, or trace the impact of a change.',
  args: [
    { name: 'subcommand', required: true, description: SUBCOMMANDS.map((s) => s.name).join(' | ') },
    { name: 'args', required: false, variadic: true, description: 'The subcommand\'s arguments (see below)' },
  ],
  options,
  subcommands: SUBCOMMANDS.map(({ name, usage, summary, mutates, examples }) => ({ name, usage: `sketchbook tokens ${usage}`, summary, mutates, examples })),
  examples: ['sketchbook tokens rename-plan', renamePlanExample, renamePreviewExample, 'sketchbook tokens set typography.family Inter --dry-run', 'sketchbook tokens impact color.border', 'sketchbook tokens import theme.css --from css'],
  mutates: true,
  dryRun: true,
  cssVarArgs: true,
  async run(ctx) {
    const [name, ...args] = ctx.args;
    const sub = findSub(name);
    if (!sub) throw fail(`Unknown tokens subcommand "${name}".`, `Use one of: ${SUBCOMMANDS.map((s) => s.name).join(', ')} (sketchbook help tokens).`);
    for (const [flag, subcommand] of [['map', 'rename'], ['preset', 'rename-plan'], ['out', 'rename-plan']] as const) {
      if (ctx.options[flag] !== undefined && name !== subcommand) throw fail(`--${flag} goes with tokens ${subcommand}.`, `Run sketchbook tokens ${subcommand} --help for examples.`);
    }
    return sub.run({ ...ctx, args });
  },
} satisfies Command<typeof options>;
