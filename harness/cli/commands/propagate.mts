import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { designFile, noFileError } from '../../lib/design/sync.mjs';
import { parseJson } from '../../lib/files.mjs';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';
import { inputsHash, docsInputsHash, readRecord, writeRecord, hashFile, keepTime, RECORD } from '../../lib/propagation.mjs';
import type { PropagationRecord } from '../../lib/propagation.mjs';
import type { Command, OptionSpecs } from '../types.mjs';

const HARNESS_CLI = fileURLToPath(new URL('../../../harness/cli.mjs', import.meta.url));
const MAINTAINER_OUTPUTS = { storybook: 'storybook-static/index.html', docs: 'site-dist/index.html' };
// Foundations, generated outputs and the engine build, in dependency order (npm scripts from package.json).
const STEPS = ['tokens:generate', 'tokens', 'build'];
const MAINTAINER_STEPS = ['build-storybook', 'docs:build'];

const run = (root: string, args: string[], label: string): void => {
  const [bin = '', ...rest] = args;
  const r = spawnSync(bin, rest, { cwd: root, stdio: 'inherit', shell: false });
  if (r.status !== 0) throw Object.assign(new Error(`${label} failed (exit ${r.status ?? 'signal'})`), { fix: `Fix the failure above, then run sketchbook propagate again.` });
};

const options = {
  maintainer: { type: 'boolean', description: 'Also build Storybook and the docs site, and record them for check --maintainer' },
} satisfies OptionSpecs;

export default {
  name: 'propagate',
  group: 'project',
  summary: 'Rebuild outputs after a source change and record the build. Use --maintainer to include Storybook and the Docs site. Run the generated design scripts to carry the change into Figma.',
  args: [],
  options,
  examples: ['sketchbook propagate', 'sketchbook propagate --maintainer'],
  mutates: true,
  dryRun: false,
  async run({ root, options, out }) {
    const changed: string[] = [];
    for (const s of STEPS) { out(`npm run ${s}`); run(root, ['npm', 'run', s], `npm run ${s}`); changed.push(`npm run ${s}`); }
    const design = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8')).adapters?.design ?? {};
    const syncDesign = design.tool === 'figma' && Boolean(designFile(design));
    if (design.tool === 'figma' && !syncDesign) out(`sync skipped: ${(noFileError() as Error & { fix: string }).fix}`);
    for (const what of syncDesign ? ['tokens', 'foundations'] : []) {
      out(`sync ${what}`);
      run(root, ['node', HARNESS_CLI, 'sync', what], `sync ${what}`);
      changed.push(`generated/design/figma (${what} scripts)`);
    }
    const previous = await readRecord(root);
    const record: PropagationRecord = { inputsHash: await inputsHash(root), at: new Date().toISOString(), maintainer: previous?.maintainer ?? null };
    if (options.maintainer) {
      for (const s of MAINTAINER_STEPS) { out(`npm run ${s}`); run(root, ['npm', 'run', s], `npm run ${s}`); changed.push(`npm run ${s}`); }
      const { storybook, docs } = MAINTAINER_OUTPUTS;
      record.maintainer = { storybook: { file: storybook, hash: await hashFile(root, storybook) }, docs: { file: docs, hash: await hashFile(root, docs), inputs: await docsInputsHash(root) } };
    }
    await writeRecord(root, keepTime(previous, record));
    changed.push(RECORD);
    const check = `sketchbook check${options.maintainer ? ' --maintainer' : ''}`;
    const next = syncDesign
      ? `Paste the Figma scripts listed under generated/design/figma (in order, one use_figma call each), then run sketchbook sync stamp tokens and ${check}.`
      : `Run ${check}.`;
    out(`Next: ${next}`);
    return {
      changed,
      next,
    };
  },
} satisfies Command<typeof options>;
