// Bundlers drop modules that package.json says have no side effects. Registration is a side
// effect, so every file that defines an element (and the barrel and token CSS that load them)
// must match a sideEffects pattern, or production builds ship components that never upgrade.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { sourceRepoOnly, checkoutOnly, packedFiles } from './helpers.mjs';
import { fileURLToPath } from 'node:url';
import { parseJson } from '../lib/files.mjs';

interface PackageJson { sideEffects?: string[]; dependencies?: Record<string, string> }

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

const toRegExp = (glob: string): RegExp =>
  new RegExp(
    '^' +
      glob
        .replace(/^\.\//, '')
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*\//g, '(?:.*/)?')
        .replace(/\*/g, '[^/]*') +
      '$',
  );

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

test('sideEffects covers every registration, the barrel and the token CSS', checkoutOnly, async () => {
  const pkg = parseJson<PackageJson>(await readFile(join(ROOT, 'package.json'), 'utf8'));
  const patterns = (pkg.sideEffects ?? []).map(toRegExp);
  const covered = (file: string): boolean => patterns.some((re) => re.test(file));

  const required = ['src/index.ts', 'generated/css/tokens.css'];
  for await (const file of walk(join(ROOT, 'src'))) {
    if (!file.endsWith('.ts')) continue;
    if ((await readFile(file, 'utf8')).includes('customElements.define(')) required.push(relative(ROOT, file));
  }
  const missing = required.filter((f) => !covered(f));
  assert.deepEqual(missing, [], `not listed in package.json sideEffects: ${missing.join(', ')}`);
});

// `sketchbook init` installs the harness from the package itself (SB-0097, SB-0098): the tarball must carry the engine,
// the project template and the Claude layer, and the engine's run-time imports must install for a consumer.
const SHIPPED = [
  'harness/cli.mjs', 'harness/cli/run.mjs', 'harness/manifest.json', 'harness/catalog/index.json', 'harness/checks/run.mjs',
  'harness/templates/CLAUDE.md', 'harness/templates/project/harness.config.json', 'harness/templates/project/.claude/settings.json',
  '.agents/skills/contract-author/SKILL.md', '.agents/skills/component-builder/SKILL.md',
  'harness/templates/project/gitignore', 'harness/templates/project/AGENTS.md', 'harness/templates/project/.trae/rules/sketchbook.md', 'harness/templates/project/.aiassistant/rules/sketchbook.md', 'harness/templates/project/.agents/skills/sketchbook/SKILL.md', 'harness/templates/project/AGENT-WORKFLOWS.md', 'harness/templates/project/GEMINI.md', 'harness/templates/project/.codex/hooks.json', 'harness/templates/project/.codex/sketchbook-guard.mjs', 'harness/templates/project/.gemini/settings.json', 'harness/templates/project/.gemini/sketchbook-guard.mjs', 'harness/agent/gemini-guard.mjs', 'harness/templates/project/.github/copilot-instructions.md', 'harness/templates/project/.github/hooks/sketchbook.json', 'harness/templates/project/.github/hooks/sketchbook-guard.mjs', '.claude/skills/hammock/SKILL.md', '.claude/hooks/guard-generated.mjs', '.claude/hooks/guard-decisions.mjs',
  '.claude/commands/add.md', '.claude/rules/contract-first.md', '.githooks/pre-commit', '.githooks/pre-push', 'scripts/build-barrel.mjs', 'docs/cli.md', 'docs/agent-compatibility.md', 'spec/schemas/contract.schema.json', 'harness/templates/move-to-claude-INSTALL.md',
];
test('the package ships the engine, the project template and the Claude layer', sourceRepoOnly, () => {
  const files = new Set(packedFiles().map((f) => f.path));
  assert.deepEqual(SHIPPED.filter((f) => !files.has(f)), [], 'add the missing paths to package.json "files"');
  assert.deepEqual([...files].filter((f) => /^(?:apps\/docs\/|site-dist\/|scripts\/docs-(?:site|components)\.mjs$)/.test(f)), [], 'docs app build files stay in the source repo');
});

test('the engine\'s run-time imports are dependencies, not devDependencies', async () => {
  const pkg = parseJson<PackageJson>(await readFile(join(ROOT, 'package.json'), 'utf8'));
  const runtime = ['postcss', 'postcss-scss', 'sass', 'typescript', 'style-dictionary', 'lucide-static'];
  assert.deepEqual(runtime.filter((d) => !pkg.dependencies?.[d]), []);
});

test('the CLI runs when started through a symlink (the npm .bin link)', async () => {
  const { execFileSync } = await import('node:child_process');
  const { mkdtemp, symlink, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-bin-'));
  await symlink(join(ROOT, 'harness/cli.mjs'), join(dir, 'sketchbook'));
  const out = execFileSync('node', [join(dir, 'sketchbook'), 'help', '--json'], { cwd: dir, encoding: 'utf8' });
  await rm(dir, { recursive: true, force: true });
  assert.equal(parseJson<{ command: string }>(out).command, 'help');
});
