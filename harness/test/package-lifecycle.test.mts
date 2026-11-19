// Opt-in: verify npm's real prepack lifecycle in a disposable checkout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { promisify } from 'node:util';
import { ROOT } from './helpers.mjs';

const exec = promisify(execFile);

test('npm pack runs prepack and emits parseable JSON', { skip: process.env.SKETCHBOOK_TEST_LIFECYCLE !== '1', timeout: 300000 }, async () => {
  const temp = await mkdtemp(join(tmpdir(), 'sketchbook-pack-lifecycle-'));
  const source = join(temp, 'source');
  const artifacts = join(temp, 'artifacts');
  try {
    await cp(ROOT, source, { recursive: true, verbatimSymlinks: true, filter: (path) => ![join(ROOT, '.git'), join(ROOT, 'node_modules')].includes(path) });
    await cp(join(ROOT, 'node_modules'), join(source, 'node_modules'), { recursive: true, verbatimSymlinks: true });
    await rm(join(source, 'dist'), { recursive: true, force: true });
    await mkdir(artifacts);
    const env = { ...process.env, npm_config_cache: join(temp, 'npm-cache'), npm_config_offline: 'true' };
    const result = await exec('npm', ['pack', '--json', '--pack-destination', artifacts], { cwd: source, env, timeout: 90000, maxBuffer: 64 * 1024 * 1024 });
    const entries = JSON.parse(result.stdout) as { filename: string; files: { path: string }[] }[];
    assert.equal(entries.length, 1);
    const packed = entries[0];
    assert.ok(packed);
    assert.ok(packed.filename.endsWith('.tgz'));
    for (const file of ['dist/index.js', 'harness/cli.mjs', 'harness/templates/project/.codex/hooks.json', 'docs/agent-compatibility.md']) {
      assert.ok(packed.files.some((entry) => entry.path === file), `${file} was not packed`);
    }
    if (process.env.SKETCHBOOK_TEST_LIFECYCLE_INSTALL === '1') {
      // Installation needs the engine's dependencies in the caller's npm cache.
      const consumer = join(temp, 'consumer with spaces');
      await mkdir(consumer);
      await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'sketchbook-lifecycle-consumer', private: true, version: '1.0.0' }));
      const installEnv = { ...process.env, npm_config_offline: 'true' };
      const tarball = join(artifacts, packed.filename);
      await exec('npm', ['install', '--offline', '--no-audit', '--no-fund', '--save-dev', tarball], { cwd: consumer, env: installEnv, timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
      const help = await exec('npx', ['--no-install', 'sketchbook', 'help', '--json'], { cwd: consumer, env: installEnv, timeout: 30000 });
      assert.equal((JSON.parse(help.stdout) as { command: string }).command, 'help');
      const init = await exec('npx', ['--no-install', 'sketchbook', 'init', '--dir', 'design system', '--start', 'blank', '--agent', 'codex,gemini,copilot', '--no-install', '--engine', relative(consumer, tarball), '--json'], { cwd: consumer, env: installEnv, timeout: 90000, maxBuffer: 64 * 1024 * 1024 });
      assert.equal((JSON.parse(init.stdout) as { ok: boolean }).ok, true);
      const project = join(consumer, 'design system');
      const projectPackage = JSON.parse(await readFile(join(project, 'package.json'), 'utf8')) as { devDependencies: Record<string, string> };
      assert.equal(projectPackage.devDependencies.sketchbook, `file:${await realpath(tarball)}`);
      assert.match(await readFile(join(project, 'AGENT-WORKFLOWS.md'), 'utf8'), /Sketchbook workflows for coding agents/);
      assert.match(await readFile(join(project, '.github/copilot-instructions.md'), 'utf8'), /AGENTS\.md/);
      assert.match(await readFile(join(project, '.codex/hooks.json'), 'utf8'), /sketchbook-guard/);
      if (process.env.SKETCHBOOK_TEST_LIFECYCLE_PROJECT_INSTALL === '1') {
        await exec('npm', ['install', '--offline', '--no-audit', '--no-fund'], { cwd: project, env: installEnv, timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
        const installed = JSON.parse(await readFile(join(project, 'node_modules/sketchbook/package.json'), 'utf8')) as { name: string };
        assert.equal(installed.name, 'sketchbook');
        const doctor = await exec('npx', ['--no-install', 'sketchbook', 'doctor', '--json'], { cwd: project, env: installEnv, timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
        const report = JSON.parse(doctor.stdout) as { ok: boolean; data: { nativeHooks: { gemini: { enginePresent: boolean }; copilot: { enginePresent: boolean } } } };
        assert.equal(report.ok, true);
        assert.equal(report.data.nativeHooks.gemini.enginePresent, true);
        assert.equal(report.data.nativeHooks.copilot.enginePresent, true);
        const invoke = (path: string, event: unknown, extraEnv: NodeJS.ProcessEnv = {}) => {
          const result = spawnSync(process.execPath, [join(project, path)], { cwd: project, input: JSON.stringify(event), encoding: 'utf8', env: { ...installEnv, ...extraEnv } });
          assert.equal(result.status, 0, result.stderr);
          return JSON.parse(result.stdout) as { decision?: string; permissionDecision?: string; hookSpecificOutput?: { permissionDecision?: string } };
        };
        const generated = join(project, 'generated/css/tokens.css');
        const codex = invoke('.codex/sketchbook-guard.mjs', { cwd: project, tool_name: 'apply_patch', tool_input: { command: `*** Begin Patch\n*** Update File: ${generated}\n*** End Patch` } });
        assert.equal(codex.hookSpecificOutput?.permissionDecision, 'deny');
        const gemini = invoke('.gemini/sketchbook-guard.mjs', { cwd: project, tool_name: 'write_file', tool_input: { file_path: generated, content: 'test' } }, { GEMINI_PROJECT_DIR: project });
        assert.equal(gemini.decision, 'deny');
        const copilot = invoke('.github/hooks/sketchbook-guard.mjs', { cwd: project, toolName: 'create', toolArgs: { path: generated, file_text: 'test' } });
        assert.equal(copilot.permissionDecision, 'deny');
      }
    }
  } finally { await rm(temp, { recursive: true, force: true }); }
});
