import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tokenPayload } from '../lib/design/tokens.mjs';
import { contractHash, mdOf } from '../lib/design/components.mjs';
import { EXAMPLE_FILE, STAMP, VERIFY, designFile } from '../lib/design/sync.mjs';
import { parseJson } from '../lib/files.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

interface Stamp { tokens?: { hash: string }; components?: Record<string, { hash: string } | undefined> }
interface Verify { mismatches?: { token?: string; mode?: string; design: unknown; spec: unknown }[] }

export const id = 'D1';
export const title = 'Design file is in step with the spec (offline stamp)';

// Compares what was last pushed (generated/design/stamp.json) with the spec now.
// Drift is an error: the design file is required to follow the spec (propagation promise, decided by the user).
// D2: a live read-back (generated/design/verify.json, written by `sync verify --ingest`) with mismatches is an error.
export async function run({ root, config, all }: CheckContext): Promise<CheckResult> {
  const errors: CheckIssue[] = [];
  const warnings: CheckIssue[] = [];
  const tool = config.adapters?.design?.tool;
  if (!tool || tool === 'none') return { errors, warnings, info: [{ note: 'no design adapter configured' }] };
  if (config.adapters.design.available === false) return { errors, warnings, info: [{ note: 'design adapter marked unavailable; drift not checked until the preflight passes' }] };
  let stamp: Stamp;
  try { stamp = parseJson<Stamp>(await readFile(join(root, STAMP), 'utf8')); } catch {
    if (!designFile(config.adapters.design)) return { errors, warnings, info: [{ note: `no design file set yet: import the example (${EXAMPLE_FILE}) into Figma, then sketchbook swap design figma --file <your file key>` }] };
    // Never synced: an error only once the project has propagated (generated/propagation.json), so a new project is not failed before its first build.
    const propagated = await readFile(join(root, 'generated/propagation.json'), 'utf8').then(() => true, () => false);
    if (propagated) errors.push({ file: STAMP, msg: `the design file (${tool}) was never synced`, fix: 'Run sketchbook propagate, then the sync scripts it lists.' });
    return { errors, warnings, info: propagated ? [] : [{ note: `the design file (${tool}) is not synced yet` }] };
  }
  if (stamp.tokens && stamp.tokens.hash !== (await tokenPayload(root)).hash) errors.push({ file: 'spec/tokens', msg: `tokens changed since the last ${tool} sync`, fix: 'Run sketchbook propagate, then run the sync scripts it lists.' });
  for (const { name, contract } of all.contracts) {
    const s = stamp.components?.[name];
    if (!s || !contract) continue;
    if (s.hash !== contractHash(contract, await mdOf(root, name))) {
      const item = { file: `spec/components/${name}/contract.json`, msg: `${contract.component} changed since the last ${tool} sync`, fix: `Run sketchbook sync components ${name}.` };
      errors.push(item);
    }
  }
  try {
    const verify = parseJson<Verify>(await readFile(join(root, VERIFY), 'utf8'));
    for (const m of verify.mismatches || []) errors.push({ file: VERIFY, token: m.token, mode: m.mode, msg: `${tool} has ${JSON.stringify(m.design)}, spec has ${JSON.stringify(m.spec)}`, fix: `Run sketchbook sync tokens; never edit variables in ${tool} by hand (D2).` });
  } catch { /* absent: no live read-back yet */ }
  return { errors, warnings };
}
