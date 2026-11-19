import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve as resolvePath } from 'node:path';
import { designFile, ingestVerify, noFileError, stamp, readStamp, setProgress, writeProgress, PROGRESS, PROGRESS_VIEW, STAMP, VERIFY } from '../../lib/design/sync.mjs';
import { OUT, TARGETS, prepare, prepareVerify, writePushed } from '../../adapters/design/figma/sync.mjs';
import { LIBRARY_VERIFY, ingestLibraryVerify, realize } from '../../lib/design/realize.mjs';
import { readProgress } from '../../lib/design/sync.mjs';
import { compareDigests, figmaModel } from '../../adapters/design/figma/variables.mjs';
import type { VerifyReadback } from '../../adapters/design/figma/variables.mjs';
import type { LibraryReadback } from '../../lib/design/realize.mjs';
import { compareScript } from '../../adapters/design/figma/compare.mjs';
import { COMPARE_DIR, PARITY_VIEW, patternIds, storybookInventories, writeParity } from '../../lib/design/compare.mjs';
import { errorMessage, parseJson } from '../../lib/files.mjs';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';
import type { CommandContext, Command, IssueLike, OptionSpecs } from '../types.mjs';

const isLibraryReadback = (v: unknown): v is LibraryReadback[] => Array.isArray(v) && v.every((r: unknown) => typeof r === 'object' && r !== null && 'title' in r && typeof r.title === 'string');

const options = {
  verify: { type: 'boolean', description: 'Same as "sync verify"' },
  full: { type: 'boolean', description: 'With tokens: write every variable, not only what changed since the last stamp' },
  detail: { type: 'string', value: 'combination', description: 'With verify: also return that combination\'s values (e.g. "Dark | Round | Compact") so --ingest names each differing variable. With library: the variant (e.g. "Variant=Primary, Size=Medium, State=Rest, Disabled=False") whose node-by-node bindings its verify script lists when they differ' },
  url: { type: 'string', value: 'http://localhost:6006', description: 'With compare: the running Storybook to render the pattern states from (default http://localhost:6006)' },
  ingest: { type: 'string', value: 'file.json', description: 'With compare: the folder holding what each compare-<id>.js returned (<id>.fg.json); writes docs/design-docs/parity.md. With verify: compare the JSON that verify.js returned with the spec per theme combination and write generated/design/verify.json (read by check D1). With verify-library: record what verify-all.js returned per set in generated/design/library-verify.json (read by sync realize and check D4)' },
} satisfies OptionSpecs;

// One state's result from a compare-<id>.js script (harness/adapters/design/figma/compare.mts).
interface CompareRow { id: string; state: unknown; ok: boolean; error?: string; missing: unknown[]; extra: unknown[]; moved: unknown[]; order?: boolean; bounds?: boolean }

type VerifyContext = Pick<CommandContext<typeof options>, 'root' | 'options' | 'dryRun' | 'out'> & { file: string | null | undefined };

async function verify({ root, options, dryRun, out, file }: VerifyContext) {
  if (!options.ingest) {
    if (!file) throw noFileError();
    if (dryRun) { out(`Would write ${OUT}/verify.js (read-only) for Figma file ${file}.`); return { changed: [`${OUT}/verify.js`] }; }
    const written = await prepareVerify(root, { detail: options.detail });
    const next = `Run ${written} with the Figma MCP use_figma tool, save the returned JSON (e.g. figma-verify.json), then: sketchbook sync verify --ingest figma-verify.json. A differing combination is located with sketchbook sync verify --detail "<combination>".`;
    out(`Prepared a verification script for Figma file ${file}:\n  ${written}\nNext: ${next}`);
    return { changed: [written], next };
  }
  let readback: VerifyReadback | null;
  try { readback = parseJson<VerifyReadback | null>(await readFile(resolvePath(root, options.ingest), 'utf8')); } catch (e) {
    throw Object.assign(new Error(`Cannot read ${options.ingest}: ${errorMessage(e)}`), { fix: `Save the JSON that ${OUT}/verify.js returned to that file.` });
  }
  if (!readback || typeof readback.combos !== 'object') throw Object.assign(new Error(`${options.ingest} is not a verify result (no "combos").`), { fix: `Run ${OUT}/verify.js and save exactly what it returns.` });
  const model = await figmaModel(root);
  const r = await ingestVerify(root, readback, { write: !dryRun, compare: () => Promise.resolve(compareDigests(model, readback)) });
  const warnings: IssueLike[] = [];
  if (r.stale) warnings.push({ file: options.ingest, msg: 'the read-back was taken from tokens pushed before the current spec (hash differs)', fix: 'sketchbook sync tokens, run its scripts, then verify again.' });
  if (r.wrongFile) warnings.push({ file: options.ingest, msg: `read from Figma file ${r.readFile}, configured file is ${r.file}`, fix: 'Run verify.js on the configured file again.' });
  out(`${dryRun ? 'Would write' : 'Wrote'} ${VERIFY}: ${r.compared} values compared (${model.combos.length} combinations), ${r.mismatches.length} mismatch(es).`);
  for (const m of r.mismatches.slice(0, 20)) out(`  ${m.mode}  ${m.token}: Figma ${JSON.stringify(m.design)}, spec ${JSON.stringify(m.spec)}`);
  if (readback.extraModes?.length) out(`  extra modes (not in the spec; remove only on purpose): ${readback.extraModes.join(', ')}`);
  return {
    changed: dryRun ? [] : [VERIFY], warnings,
    next: r.mismatches.length ? 'sketchbook sync tokens, run its scripts, then verify again (check D1 fails until it is clean).' : 'sketchbook check',
    data: { compared: r.compared, skipped: r.skipped, mismatches: r.mismatches },
  };
}

export default {
  name: 'sync',
  group: 'design',
  summary: 'Prepare scripts to update or verify your Figma file. Record sync progress after you run the scripts. Use verify to compare a read-back with the spec, stamp to record a push or stage, and realize to write design realizations.',
  args: [
    { name: 'what', required: false, description: 'tokens (default) | verify | stamp | progress | describe | verify-library | layout | theme-matrix | components | patterns | compare | realize' },
    { name: 'names', required: false, variadic: true, description: 'After "stamp": tokens|foundations|components, or library|doc|checked|note|clear, then component names (clear takes names only, and removes the note and its fix flag without changing the stage); after "library" or "describe": the components (describe defaults to every drawn one); after "components": one batch id of spec/design-docs.json; after "realize" or "verify-library --ingest": the components (default every drawn one)' },
  ],
  options,
  examples: ['sketchbook sync tokens', 'sketchbook sync verify', 'sketchbook sync verify --ingest figma-verify.json', 'sketchbook sync stamp tokens', 'sketchbook sync stamp library button', 'sketchbook sync compare settings --url http://localhost:6006', 'sketchbook sync compare --ingest generated/design/compare'],
  subcommands: [...TARGETS, 'verify', 'stamp', 'progress', 'realize', 'compare'],
  mutates: true,
  dryRun: true,
  async run({ root, args, options, dryRun, out }) {
    const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
    if (config.adapters.design.tool !== 'figma') throw Object.assign(new Error('No Figma design adapter configured in harness.config.json.'), { fix: 'sketchbook swap design figma --file <file key>' });
    const file = designFile(config.adapters.design);
    if (args[0] === 'compare') {
      const ids = args.length > 1 ? args.slice(1) : await patternIds(root);
      if (options.ingest) {
        const dir = resolvePath(root, options.ingest);
        const rows: CompareRow[] = [];
        try { for (const f of (await readdir(dir)).filter((x) => x.endsWith('.fg.json')).sort()) rows.push(...parseJson<CompareRow[]>(await readFile(join(dir, f), 'utf8'))); } catch (e) {
          throw Object.assign(new Error(`Cannot read the compare results in ${options.ingest}: ${errorMessage(e)}`), { fix: `Save what each ${OUT}/compare-<id>.js returned to ${COMPARE_DIR}/<id>.fg.json, then pass ${COMPARE_DIR}.` });
        }
        if (!rows.length) throw Object.assign(new Error(`No *.fg.json results in ${options.ingest}.`), { fix: `Run ${OUT}/compare-<id>.js and save its result as ${COMPARE_DIR}/<id>.fg.json.` });
        const report = await writeParity(root, rows, { write: !dryRun });
        out(`${dryRun ? 'Would write' : 'Wrote'} ${PARITY_VIEW}: ${rows.filter((r) => r.ok).length} of ${rows.length} states match.\n${rows.map((r) => `  ${r.id.padEnd(13)} ${String(r.state).padEnd(14)} ${r.error ? r.error : r.ok ? 'match' : `${r.missing.length} missing, ${r.extra.length} extra, ${r.moved.length} moved${r.order ? ', order' : ''}${r.bounds ? ', edges' : ''}`}`).join('\n')}`);
        return { changed: dryRun ? [] : [PARITY_VIEW, `${COMPARE_DIR}/report.json`], next: 'Fix the layout (or record a library gap with sketchbook sync stamp note), sync patterns <id>, run it, compare again.', data: { rows: report.rows } };
      }
      const url = options.url ?? 'http://localhost:6006';
      if (dryRun) { out(`Would render ${ids.join(', ')} from ${url} into ${COMPARE_DIR}/ and write ${OUT}/compare-<id>.js.`); return { changed: [`${COMPARE_DIR}/`, `${OUT}/compare-<id>.js`] }; }
      const rendered = await storybookInventories(root, ids, { url });
      await mkdir(join(root, OUT), { recursive: true });
      const scripts = [];
      for (const id of ids) { const file = `${OUT}/compare-${id}.js`; await writeFile(join(root, file), await compareScript(root, id)); scripts.push(file); }
      out(`Rendered ${rendered.length} state(s) from ${url} into ${COMPARE_DIR}/.\nNext: run each of ${scripts.join(', ')} with the Figma MCP use_figma tool, save what it returns as ${COMPARE_DIR}/<id>.fg.json, then sketchbook sync compare --ingest ${COMPARE_DIR}`);
      return { changed: [`${COMPARE_DIR}/`, ...scripts], next: `Run the compare scripts (read-only), then sketchbook sync compare --ingest ${COMPARE_DIR}`, data: { rendered } };
    }
    if (args[0] === 'verify' || options.verify) {
      if (args[0] && args[0] !== 'verify') throw Object.assign(new Error(`--verify cannot be combined with "${args[0]}".`), { fix: 'Run sketchbook sync verify (or sync --verify).' });
      return verify({ root, options, dryRun, out, file });
    }
    const drawnNames = async () => (args.length > 1 ? args.slice(1) : Object.entries<{ stage?: string }>((await readProgress(root)).components).filter(([, p]) => p.stage !== 'planned').map(([n]) => n).sort());
    if (args[0] === 'verify-library' && options.ingest) {
      let results: unknown;
      try { results = parseJson<unknown>(await readFile(resolvePath(root, options.ingest), 'utf8')); } catch (e) {
        throw Object.assign(new Error(`Cannot read ${options.ingest}: ${errorMessage(e)}`), { fix: `Save the JSON that ${OUT}/library/verify-all.js returned to that file.` });
      }
      if (!isLibraryReadback(results)) throw Object.assign(new Error(`${options.ingest} is not a library read-back (a list of { title, ok, problems }).`), { fix: `Run ${OUT}/library/verify-all.js and save exactly what it returns.` });
      const r = await ingestLibraryVerify(root, results, await drawnNames(), { write: !dryRun });
      out(`${dryRun ? 'Would record' : 'Recorded'} ${results.length} set(s) in ${LIBRARY_VERIFY}: ${results.length - r.failed.length} ok${r.failed.length ? `, with problems: ${r.failed.join(', ')}` : ''}${r.unknown.length ? `; not a drawn set (ignored): ${r.unknown.join(', ')}` : ''}.`);
      return { changed: dryRun ? [] : [LIBRARY_VERIFY], next: 'sketchbook sync realize', data: { failed: r.failed, unknown: r.unknown } };
    }
    if (options.ingest) throw Object.assign(new Error('--ingest goes with verify or verify-library.'), { fix: 'sketchbook sync verify --ingest <file.json>' });
    if (args[0] === 'realize') {
      const names = await drawnNames();
      const rs = await realize(root, names, { write: !dryRun });
      for (const r of rs) {
        const why = [...r.sets.filter((s) => s.verified !== 'ok').map((s) => `${s.title} ${s.verified}`), ...(r.unexplained.length ? [`not drawn and no drift: ${r.unexplained.join(', ')}`] : []), ...(r.staleDrift.length ? [`drift names drawn tokens: ${r.staleDrift.join(', ')}`] : [])];
        out(`  ${r.name.padEnd(14)} ${r.complete ? 'complete' : 'partial'}  ${r.sets.map((s) => `${s.title} ${s.variants}`).join(', ')}${why.length ? `\n${''.padEnd(16)}${why.join('; ')}` : ''}`);
      }
      const done = rs.filter((r) => r.complete).length;
      out(`${dryRun ? 'Would write' : 'Wrote'} realizations.design of ${rs.length} contract(s): ${done} complete.`);
      return { changed: dryRun ? [] : rs.map((r) => `spec/components/${r.name}/contract.json`), next: 'sketchbook check (D4 holds a complete realization to its read-back and drift)', data: { complete: done, total: rs.length } };
    }
    if (args[0] === 'progress') {
      const v = await writeProgress(root, { write: !dryRun });
      out(`${dryRun ? 'Would write' : 'Wrote'} ${PROGRESS_VIEW}: ${v.done} of ${v.rows.length} components and ${v.kitsDone} of ${v.kits.length} patterns checked.\n${v.rows.map((r) => `  ${r.batch}  ${r.name.padEnd(14)} ${r.stage}${r.needsFix ? '  (fix: ' + (r.note || 'yes') + ')' : ''}`).join('\n')}${v.kits.length ? `\n${v.kits.map((r) => `  pattern  ${r.name.padEnd(12)} ${r.stage}${r.needsFix ? '  (fix: ' + (r.note || 'yes') + ')' : ''}`).join('\n')}` : ''}`);
      return { changed: dryRun ? [] : [PROGRESS_VIEW], data: { done: v.done, total: v.rows.length, rows: v.rows, patterns: v.kits } };
    }
    if (args[0] === 'stamp' && args[1] !== undefined && ['library', 'doc', 'checked', 'note', 'clear'].includes(args[1])) {
      const stage = args[1];
      const rest = args.slice(2);
      const names = stage === 'note' ? rest.slice(0, 1) : rest;
      if (!names.length || (stage === 'note' && !rest[1])) throw Object.assign(new Error(stage === 'note' ? 'Usage: sketchbook sync stamp note <component> "<what to fix>"' : `Usage: sketchbook sync stamp ${stage} <components>`), { fix: 'Name the component(s) the agent just built or checked.' });
      if (dryRun) { out(`Would record ${stage} for ${names.join(', ')} in ${PROGRESS}.`); return { changed: [PROGRESS] }; }
      await setProgress(root, stage, names, rest[1] ?? '');
      out(`Progress updated: ${names.join(', ')} -> ${stage} (${PROGRESS}).`);
      return { changed: [PROGRESS], next: 'sketchbook sync progress (writes the readable list)' };
    }
    if (args[0] === 'stamp') {
      const [what, ...names] = args.slice(1);
      if (what === undefined || !['tokens', 'foundations', 'components'].includes(what)) throw Object.assign(new Error('Usage: sketchbook sync stamp tokens|foundations|components <names>'), { fix: 'Name what the agent pushed.' });
      if (dryRun) {
        const before = await readStamp(root);
        out(`Would record ${what}${names.length ? ` (${names.join(', ')})` : ''} in ${STAMP}.`);
        return { changed: [STAMP], data: { stamp: before, what, names } };
      }
      const s = await stamp(root, what, names);
      if (what === 'tokens') await writePushed(root);
      out(`Stamp updated: ${STAMP} (${Object.keys(s.components).length} component(s)${s.tokens ? ', tokens' : ''}${s.foundations ? ', foundations' : ''}).`);
      return { changed: [STAMP], next: 'sketchbook check (D1 compares the stamp with the spec)', data: { stamp: s } };
    }
    const what = args[0] ?? 'tokens';
    if (!TARGETS.includes(what)) throw Object.assign(new Error(`Unknown sync target "${what}".`), { fix: `Use ${TARGETS.join(', ')}, verify, stamp or progress.` });
    if (!file) throw noFileError();
    const next = `Run each script with the Figma MCP use_figma tool, in file order, one call at a time (never in parallel); check its report has no errors${what === 'describe' ? '; then run the library verify scripts (they compare each description).' : what === 'patterns' ? '; patterns-runtime.js goes first (it stores the shared runtime in the file as hidden text) and patterns-runtime-remove.js goes last (it deletes it); patterns-verify.js must report ok and every screen is checked by eye against its Storybook story.' : what === 'components' ? `; then components-${args[1] ?? '<batch>'}-verify.js must report ok; then sketchbook sync stamp doc <the batch's components> and sketchbook sync progress.` : what === 'verify-library' ? '; every set must report ok (a problem names the variant: sketchbook sync library <name> --detail <variant> lists the nodes).' : ['pages', 'brand', 'guide', 'foundations', 'icons', 'layout', 'theme-matrix'].includes(what) ? '.' : `; then sketchbook sync stamp ${what} and sketchbook sync verify.`}`;
    if (dryRun) { out(`Would write the ${what} scripts to ${OUT}/ for Figma file ${file}.`); return { changed: [`${OUT}/`], next, data: { file } }; }
    const { written, skipped, delta, coverage } = await prepare(root, what, { full: options.full, names: args.slice(1), detail: options.detail });
    if (what === 'library' && skipped.length) out(`Tokens without a Figma variable or style (left unbound): ${skipped.map((s) => (typeof s === 'string' ? s : s.token)).join(', ')}`);
    out(`Prepared ${what} scripts for Figma file ${file}${delta ? ' (changes since the last stamp, or use --full for all inputs)' : ''}:\n  ${written.join('\n  ')}${coverage.total ? `\nCoverage: ${coverage.total - coverage.missing.length} of ${coverage.total} spec tokens reach the file${coverage.missing.length ? ` (missing: ${coverage.missing.slice(0, 10).join(', ')}${coverage.missing.length > 10 ? ' ...' : ''})` : ''}.` : ''}\nNext: ${next}`);
    return { changed: written, next, warnings: coverage.missing.length ? [{ file: 'spec/tokens', msg: `${coverage.missing.length} token(s) do not reach the design file`, fix: 'Map their kind in harness/adapters/design/figma/variables.mts.' }] : [], data: { file, skipped: skipped.length, coverage } };
  },
} satisfies Command<typeof options>;
