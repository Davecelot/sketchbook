// The reference project every harness test runs on (TEST.md, "Reference project"). Built from harness-owned files
// only, never from the team's spec/, src/, docs/ or configs, so `npm run test:harness` passes on any install: after
// `init --start blank`, a rebrand, a renamed prefix, unlinked tokens or the team's own components.
//   harness/templates/project/              pinned team skeleton: configs, registry, schemas, decisions, shared src,
//                                           playwright and .storybook files (a copy of the default project)
//   harness/test/golden/brand.default.json  brand.config.json
//   harness/templates/                      semantic tokens and brand links (the generator copies them in)
//   harness/catalog/ + harness/kits/        every component and kit, installed as `sketchbook add` / `kits add` would
//                                           (harness/kits is copied in: tests edit the kit index)
// Built once per test process; fixture() copies it.
import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { constants, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HARNESS = fileURLToPath(new URL('../', import.meta.url));
export const SKELETON = join(HARNESS, 'templates/project');
// The harness's own files (harness/manifest.json "harness"), copied from the install when a test needs them.
export const HARNESS_PARTS = new Set(['harness', 'harness/catalog', '.claude', 'scripts', '.githooks']);
const CLONE = { recursive: true, mode: constants.COPYFILE_FICLONE };

// Assembles the reference project in `dir` (empty or missing).
export async function buildReference(dir: string): Promise<string> {
  const { runGenerator } = await import('../generators/foundation.mjs');
  const { catalogIndex, installComponents, installKits, kitIndex } = await import('../commands/catalog.mjs');
  const { regenerate } = await import('../commands/prefix.mjs');
  const { cliDocs } = await import('../cli/docs.mjs');
  await cp(SKELETON, dir, CLONE);
  await cp(join(HARNESS, 'kits'), join(dir, 'harness/kits'), CLONE);
  await cp(join(HARNESS, 'test/golden/brand.default.json'), join(dir, 'brand.config.json'));
  await mkdir(join(dir, 'docs'), { recursive: true });
  await writeFile(join(dir, 'docs/cli.md'), cliDocs());
  await mkdir(join(dir, 'generated/design'), { recursive: true });
  // Foundation, semantic layer and brand links from the templates, snapshot.
  await runGenerator(dir, { quiet: true });
  // The catalog and kit index resolve to this harness (the project has no harness/ of its own).
  await installComponents(dir, catalogIndex(dir).components, { rebuild: false });
  await installKits(dir, kitIndex(dir).map((k) => k.id), { rebuild: false });
  await regenerate(dir);
  return dir;
}

let cached: Promise<string> | null = null;
// Path of this process's reference project (read-only: copy it with fixture()). Built once per test process (about half
// a second) and removed when the process exits.
export function reference(): Promise<string> {
  cached ??= mkdtemp(join(tmpdir(), 'sketchbook-reference-')).then((dir) => {
    process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
    return buildReference(dir);
  });
  return cached;
}

// A fresh temp copy of the parts of the reference project a test needs (the harness's own parts from this install).
export async function copyParts(parts: string[], root: string): Promise<string> {
  const ref = await reference();
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-'));
  for (const p of parts) {
    const from = HARNESS_PARTS.has(p) ? join(root, p) : existsSync(join(ref, p)) ? join(ref, p) : null;
    if (!from) throw new Error(`fixture part ${p} is neither in the reference project nor harness-owned (${relative(root, SKELETON)})`);
    await cp(from, join(dir, p), CLONE);
  }
  return dir;
}
