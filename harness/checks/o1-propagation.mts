import { inputsHash, docsInputsHash, readRecord, hashFile } from '../lib/propagation.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'O1';
export const title = 'Every output was built from the current foundations (sketchbook propagate)';

// Fails when the spec changed after the last propagate. With --maintainer (check --maintainer), the Storybook and docs
// site builds recorded by `propagate --maintainer` must also still match their output files.
export async function run({ root, maintainer }: CheckContext): Promise<CheckResult> {
  const errors: CheckIssue[] = [];
  const record = await readRecord(root);
  // No record: nothing was propagated yet, so there is no baseline to be stale against. The first propagate creates it.
  if (!record) return { errors, warnings: [], info: [{ note: 'no propagation record yet; sketchbook propagate creates it, and from then on a changed foundation must be propagated' }] };
  if ((await inputsHash(root)) !== record.inputsHash) {
    errors.push({ file: 'spec', msg: 'the foundations or contracts changed since the last propagate; the outputs are stale', fix: 'Run sketchbook propagate, then the Figma scripts it lists.' });
  }
  if (maintainer) {
    if (!record.maintainer) errors.push({ file: 'generated/propagation.json', msg: 'no maintainer builds recorded (Storybook, docs site)', fix: 'Run sketchbook propagate --maintainer.' });
    for (const [name, rec] of Object.entries(record.maintainer ?? {})) {
      let got: string | null = null;
      try { got = await hashFile(root, rec.file); } catch { /* missing output */ }
      if (got === null) errors.push({ file: rec.file, msg: `${name} build output is missing`, fix: 'Run sketchbook propagate --maintainer.' });
      else if (got !== rec.hash) errors.push({ file: rec.file, msg: `${name} build output differs from the propagate record`, fix: 'Run sketchbook propagate --maintainer.' });
      if (name === 'docs' && got !== null && rec.inputs !== await docsInputsHash(root)) {
        errors.push({ file: 'apps/docs', msg: 'the docs site sources changed since the last build (apps/docs/, docs/cli.md or brand.config.json)', fix: 'Run sketchbook propagate --maintainer.' });
      }
    }
  }
  return { errors, warnings: [] };
}
