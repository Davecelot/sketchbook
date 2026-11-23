// The harness is TypeScript compiled in place (x.mts -> x.mjs). The generated .gitignore must list exactly the
// compiled outputs, and the npm package must ship them instead of the sources.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { must, packedFiles, sourceRepoOnly } from './helpers.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
// scripts/build-harness.mjs stays hand-written JS (it bootstraps the build), so its exports are typed here.
interface BuildScript { SOURCE_ROOTS: string[]; compiledOutputs: (root: string, base: string) => string[]; writeIgnoreFiles: (root: string) => void }
const { compiledOutputs, writeIgnoreFiles, SOURCE_ROOTS }: Partial<BuildScript> = await import('../../scripts/build-harness.mjs').catch(() => ({}));
// Only BH1 and BH5 skip without the script; the source-repo tests reach for it unguarded, so a missing export throws by name.
const built = <T,>(v: T | undefined): T => must(v, 'scripts/build-harness.mjs export');
const needsBuildScript = { skip: compiledOutputs ? false : 'scripts/build-harness.mjs is not part of this install' };

test('BH1 the generated .gitignore lists compiled outputs only, never a hand-written .mjs', needsBuildScript, () => {
  const dir = mkdtempSync(join(tmpdir(), 'sb-build-'));
  try {
    mkdirSync(join(dir, 'harness', 'lib'), { recursive: true });
    writeFileSync(join(dir, 'harness', 'lib', 'a.mts'), 'export const a = 1;\n');
    writeFileSync(join(dir, 'harness', 'lib', 'b.mjs'), 'export const b = 1;\n');
    built(writeIgnoreFiles)(dir);
    const ignore = readFileSync(join(dir, 'harness', '.gitignore'), 'utf8').split('\n').filter((l) => l.startsWith('/'));
    assert.deepEqual(ignore, ['/lib/a.mjs', '/lib/a.d.mts']);
    rmSync(join(dir, 'harness', 'lib', 'a.mts'));
    built(writeIgnoreFiles)(dir);
    assert.equal(existsSync(join(dir, 'harness', '.gitignore')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('BH8 under .claude only the hook folders compile: never another worktree or a skill\'s other files', needsBuildScript, () => {
  const dir = mkdtempSync(join(tmpdir(), 'sb-build-'));
  try {
    for (const f of ['.claude/hooks/a.mts', '.claude/skills/s/hooks/b.mts', '.claude/skills/s/scripts/c.mts', '.claude/worktrees/w/.claude/hooks/d.mts', '.claude/worktrees/w/harness/e.mts']) {
      mkdirSync(join(dir, f, '..'), { recursive: true });
      writeFileSync(join(dir, f), 'export const x = 1;\n');
    }
    assert.deepEqual(built(compiledOutputs)(dir, '.claude'), ['/hooks/a.mjs', '/skills/s/hooks/b.mjs']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('BH2 the committed .gitignore files match the .mts sources and every output is built', sourceRepoOnly, () => {
  for (const base of built(SOURCE_ROOTS)) {
    const outputs = built(compiledOutputs)(ROOT, base);
    const file = join(ROOT, base, '.gitignore');
    const listed = existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter((l) => l.startsWith('/')) : [];
    assert.deepEqual(listed, outputs, `${base}/.gitignore is out of date: run npm run build:harness`);
    for (const out of outputs) assert.ok(existsSync(join(ROOT, base, out)), `${base}${out} is not built: run npm run build:harness`);
  }
});

test('BH3 the package ships compiled engine modules and hooks, with docs builders kept in the checkout', sourceRepoOnly, () => {
  const shipped = new Set(packedFiles().map((f) => f.path));
  assert.deepEqual([...shipped].filter((p) => p.endsWith('.mts') && !p.endsWith('.d.mts')), []);
  for (const base of built(SOURCE_ROOTS)) {
    const shouldShip = base !== 'apps/docs/scripts';
    for (const out of built(compiledOutputs)(ROOT, base)) {
      assert.equal(shipped.has(`${base}${out}`), shouldShip, `${base}${out} package inclusion`);
    }
  }
});

test('BH4 a fresh clone (sources only, nothing compiled) builds with the script alone', sourceRepoOnly, () => {
  const dir = mkdtempSync(join(tmpdir(), 'sb-fresh-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'harness', 'lib'), { recursive: true });
    for (const f of ['scripts/build-harness.mjs', 'tsconfig.json', 'tsconfig.harness.json']) copyFileSync(join(ROOT, f), join(dir, f));
    mkdirSync(join(dir, 'node_modules'));
    for (const m of ['typescript', '@types']) symlinkSync(join(ROOT, 'node_modules', m), join(dir, 'node_modules', m));
    writeFileSync(join(dir, 'harness', 'lib', 'a.mts'), 'export const a: number = 1;\n');
    execFileSync(process.execPath, ['scripts/build-harness.mjs'], { cwd: dir, stdio: 'ignore' });
    assert.ok(existsSync(join(dir, 'harness', 'lib', 'a.mjs')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// A source checkout with only the build script, the tsconfigs and this install's TypeScript, in a folder named `name`.
function checkout(name: string): { dir: string; build: () => void } {
  const parent = mkdtempSync(join(tmpdir(), 'sb-checkout-'));
  const dir = join(parent, name);
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  mkdirSync(join(dir, 'harness', 'lib'), { recursive: true });
  for (const f of ['scripts/build-harness.mjs', 'tsconfig.json', 'tsconfig.harness.json']) copyFileSync(join(ROOT, f), join(dir, f));
  mkdirSync(join(dir, 'node_modules'));
  for (const m of ['typescript', '@types']) symlinkSync(join(ROOT, 'node_modules', m), join(dir, 'node_modules', m));
  return { dir, build: () => { execFileSync(process.execPath, ['scripts/build-harness.mjs'], { cwd: dir, stdio: 'ignore' }); } };
}

test('BH9 a renamed or deleted .mts leaves no compiled output behind; a hand-written .mjs stays', sourceRepoOnly, () => {
  const { dir, build } = checkout('repo');
  try {
    const lib = join(dir, 'harness', 'lib');
    writeFileSync(join(lib, 'a.mts'), 'export const a: number = 1;\n');
    writeFileSync(join(lib, 'keep.mjs'), 'export const keep = 1;\n');
    build();
    assert.ok(existsSync(join(lib, 'a.mjs')));
    rmSync(join(lib, 'a.mts'));
    writeFileSync(join(lib, 'b.mts'), 'export const b: number = 1;\n');
    build();
    assert.deepEqual([existsSync(join(lib, 'a.mjs')), existsSync(join(lib, 'a.d.mts'))], [false, false], 'the renamed source left no output');
    assert.ok(existsSync(join(lib, 'b.mjs')));
    assert.ok(existsSync(join(lib, 'keep.mjs')), 'a hand-written .mjs is never removed');
  } finally {
    rmSync(join(dir, '..'), { recursive: true, force: true });
  }
});

test('BH10 the build runs from a folder whose path has a space', sourceRepoOnly, () => {
  const { dir, build } = checkout('my repo');
  try {
    writeFileSync(join(dir, 'harness', 'lib', 'a.mts'), 'export const a: number = 1;\n');
    build();
    assert.ok(existsSync(join(dir, 'harness', 'lib', 'a.mjs')));
    // The same test every compiled entry point uses (isMain in harness/lib/files).
    const probe = join(dir, 'probe.mjs');
    writeFileSync(probe, `import { isMain } from ${JSON.stringify(pathToFileURL(join(ROOT, 'harness/lib/files.mjs')).href)};\nprocess.stdout.write(String(isMain(import.meta.url)));\n`);
    assert.equal(execFileSync(process.execPath, [probe], { encoding: 'utf8' }), 'true');
  } finally {
    rmSync(join(dir, '..'), { recursive: true, force: true });
  }
});

test('BH11 in a source checkout with nothing compiled, the git hooks build and check instead of blocking', sourceRepoOnly, () => {
  const { dir } = checkout('repo');
  try {
    mkdirSync(join(dir, '.githooks'));
    for (const f of ['pre-commit', 'pre-push']) {
      copyFileSync(join(ROOT, '.githooks', f), join(dir, '.githooks', f));
      chmodSync(join(dir, '.githooks', f), 0o755);
    }
    // A stand-in build: it writes the checks entry point the hooks run (exit 0), as the real build compiles it.
    writeFileSync(join(dir, 'scripts', 'build-harness.mjs'), "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('harness/checks', { recursive: true });\nwriteFileSync('harness/checks/run.mjs', 'process.exit(0);\\n');\n");
    // Stand-ins for the gates pre-push runs after the checks (SB-0120).
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: Object.fromEntries(['test:harness', 'typecheck', 'lint'].map((s) => [s, 'node -e 0'])) }));
    for (const f of ['pre-commit', 'pre-push']) {
      rmSync(join(dir, 'harness', 'checks'), { recursive: true, force: true });
      const r = spawnSync('sh', [join('.githooks', f)], { cwd: dir, encoding: 'utf8' });
      assert.equal(r.status, 0, `${f}: ${r.stdout}${r.stderr}`);
    }
  } finally {
    rmSync(join(dir, '..'), { recursive: true, force: true });
  }
});

test('BH7 a fresh clone with a restored node_modules cache still emits every output', sourceRepoOnly, () => {
  const dir = mkdtempSync(join(tmpdir(), 'sb-restored-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'harness', 'lib'), { recursive: true });
    for (const f of ['scripts/build-harness.mjs', 'tsconfig.json', 'tsconfig.harness.json']) copyFileSync(join(ROOT, f), join(dir, f));
    mkdirSync(join(dir, 'node_modules'));
    for (const m of ['typescript', '@types']) symlinkSync(join(ROOT, 'node_modules', m), join(dir, 'node_modules', m));
    writeFileSync(join(dir, 'harness', 'lib', 'a.mts'), 'export const a: number = 1;\n');
    const build = () => execFileSync(process.execPath, ['scripts/build-harness.mjs'], { cwd: dir, stdio: 'ignore' });
    build();
    rmSync(join(dir, 'harness', 'lib', 'a.mjs'));
    build();
    assert.ok(existsSync(join(dir, 'harness', 'lib', 'a.mjs')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Git gates accept only documented check statuses and reject every failed build', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sb-gates-'));
  try {
    for (const folder of ['.githooks', 'scripts', 'harness/checks', 'node_modules/.bin']) mkdirSync(join(dir, folder), { recursive: true });
    for (const hook of ['pre-commit', 'pre-push']) {
      copyFileSync(join(ROOT, '.githooks', hook), join(dir, '.githooks', hook));
      chmodSync(join(dir, '.githooks', hook), 0o755);
    }
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: Object.fromEntries(['test:harness', 'typecheck', 'lint'].map((s) => [s, 'node -e 0'])) }));
    const run = (hook: string) => spawnSync('sh', [join('.githooks', hook)], { cwd: dir, encoding: 'utf8' });
    const build = join(dir, 'scripts/build-harness.mjs');
    const checks = join(dir, 'harness/checks/run.mjs');
    writeFileSync(checks, 'process.exit(0);\n');
    for (const code of [1, 2, 127, 137]) {
      writeFileSync(build, `console.error('build diagnostic'); process.exit(${code});\n`);
      const result = run('pre-commit');
      assert.equal(result.status, 1, `build exit ${code}`);
      assert.match(result.stdout, /build diagnostic/);
    }
    writeFileSync(build, '');
    for (const code of [0, 2, 1, 127, 137]) {
      const expected = code === 0 || code === 2 ? 0 : 1;
      writeFileSync(checks, `process.exit(${code});\n`);
      assert.equal(run('pre-commit').status, expected, `source check exit ${code}`);
      writeFileSync(checks, `if (process.argv.includes('--maintainer')) process.exit(${code});\n`);
      assert.equal(run('pre-push').status, expected, `maintainer check exit ${code}`);
    }
    rmSync(build);
    for (const code of [0, 2, 1, 127, 137]) {
      const installed = join(dir, 'node_modules/.bin/sketchbook');
      writeFileSync(installed, `#!/bin/sh\nexit ${code}\n`, { mode: 0o755 });
      assert.equal(run('pre-commit').status, code === 0 || code === 2 ? 0 : 1, `installed check exit ${code}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the Hammock component scan ignores generated styles, Storybook entry points and barrel imports', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sb-hammock-'));
  try {
    const folder = join(dir, 'src/components/probe');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(dir, 'src/index.ts'), "export * from './components/probe/Probe';\n");
    for (const name of ['Probe', 'Probe.styles', 'Probe.stories', 'Unreferenced']) {
      writeFileSync(join(folder, `${name}.ts`), 'export const probe = true;\n');
    }
    const script = join(ROOT, 'harness/templates/agent-catalog/hammock/scripts/audit-simplicity.sh');
    const result = spawnSync('bash', [script], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Unreferenced\.ts/);
    assert.doesNotMatch(result.stdout, /Probe(?:\.stories|\.styles)?\.ts/);
    assert.match(result.stdout, /src\/components/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('BH5 the inputs hash covers the .mts source and never its compiled .mjs', needsBuildScript, async () => {
  const { inputsHash } = await import('../lib/propagation.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'sb-hash-'));
  try {
    mkdirSync(join(dir, 'harness', 'standards'), { recursive: true });
    const src = join(dir, 'harness', 'standards', 'x.mts');
    writeFileSync(src, 'export const x = 1;\n');
    const alone = await inputsHash(dir);
    writeFileSync(join(dir, 'harness', 'standards', 'x.mjs'), 'export const x = 1; // compiled\n');
    assert.equal(await inputsHash(dir), alone);
    writeFileSync(src, 'export const x = 2;\n');
    assert.notEqual(await inputsHash(dir), alone);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('BH6 an .mts can import a hand-written .mjs: it compiles, runs, and the .mjs is left alone', sourceRepoOnly, () => {
  const dir = mkdtempSync(join(tmpdir(), 'sb-bridge-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'harness', 'lib'), { recursive: true });
    for (const f of ['scripts/build-harness.mjs', 'tsconfig.json', 'tsconfig.harness.json']) copyFileSync(join(ROOT, f), join(dir, f));
    mkdirSync(join(dir, 'node_modules'));
    for (const m of ['typescript', '@types']) symlinkSync(join(ROOT, 'node_modules', m), join(dir, 'node_modules', m));
    const legacy = 'export const two = () => 2;\n';
    writeFileSync(join(dir, 'harness', 'lib', 'legacy.mjs'), legacy);
    writeFileSync(join(dir, 'harness', 'lib', 'a.mts'), "import { two } from './legacy.mjs';\nexport const four: number = two() + 2;\n");
    const build = () => execFileSync(process.execPath, ['scripts/build-harness.mjs'], { cwd: dir, stdio: 'ignore' });
    build();
    const out = join(dir, 'harness', 'lib', 'a.mjs');
    assert.match(execFileSync(process.execPath, ['--input-type=module', '-e', `import { four } from ${JSON.stringify(out)}; console.log(four)`], { encoding: 'utf8' }), /^4\n$/);
    assert.equal(readFileSync(join(dir, 'harness', 'lib', 'legacy.mjs'), 'utf8'), legacy);
    rmSync(join(dir, 'node_modules', '.cache', 'harness-build'), { recursive: true });
    rmSync(out);
    build();
    assert.ok(existsSync(out));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
