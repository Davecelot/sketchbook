import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { renderAgentSetup } from '../lib/agent-config.mjs';
import { nativeHookStatus } from '../lib/agent-diagnostics.mjs';
import { ROOT, sourceRepoOnly } from './helpers.mjs';

test('native agent adapters use a renamed scoped engine and retain their edit protections', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-renamed-agent-'));
  const name = '@acme/engine';
  try {
    for (const folder of ['.gemini', '.github/hooks', 'node_modules/@acme']) await mkdir(join(dir, folder), { recursive: true });
    await symlink(ROOT, join(dir, 'node_modules/@acme/engine'), 'dir');
    for (const file of ['.gemini/sketchbook-guard.mjs', '.github/hooks/sketchbook-guard.mjs']) {
      const source = await readFile(join(ROOT, 'harness/templates/project', file), 'utf8');
      await writeFile(join(dir, file), renderAgentSetup(file, source, name));
      assert.throws(() => renderAgentSetup(file, source, '../bad;command'));
    }
    await writeFile(join(dir, '.gemini/settings.json'), await readFile(join(ROOT, 'harness/templates/project/.gemini/settings.json')));
    const copilotConfig = await readFile(join(ROOT, 'harness/templates/project/.github/hooks/sketchbook.json'), 'utf8');
    await writeFile(join(dir, '.github/hooks/sketchbook.json'), copilotConfig);
    const status = nativeHookStatus(dir, name);
    assert.equal(status.gemini.registration, 'registered');
    assert.equal(status.gemini.enginePresent, true);
    assert.equal(status.gemini.scriptMatchesTemplate, true);
    assert.equal(status.copilot.registration, 'registered');
    assert.equal(status.copilot.enginePresent, true);
    assert.equal(status.copilot.scriptMatchesTemplate, true);
    const settings = JSON.parse(await readFile(join(dir, '.gemini/settings.json'), 'utf8')) as { hooks: { BeforeTool: { hooks: { command: string }[] }[] } };
    const command = settings.hooks.BeforeTool[0]?.hooks[0]?.command;
    assert.ok(command);
    const gemini = spawnSync('sh', ['-c', command], { cwd: dir, env: { ...process.env, GEMINI_PROJECT_DIR: dir }, input: JSON.stringify({ cwd: dir, tool_name: 'write_file', tool_input: { file_path: 'generated/test.css', content: 'x' } }), encoding: 'utf8' });
    assert.equal(gemini.status, 0, gemini.stderr);
    assert.equal((JSON.parse(gemini.stdout) as { decision?: string }).decision, 'deny');
    const copilot = spawnSync('node', [join(dir, '.github/hooks/sketchbook-guard.mjs')], { cwd: dir, input: JSON.stringify({ cwd: dir, toolName: 'edit', toolArgs: { path: 'generated/test.css', old_str: 'a', new_str: 'b' } }), encoding: 'utf8' });
    assert.equal(copilot.status, 0, copilot.stderr);
    assert.equal((JSON.parse(copilot.stdout) as { permissionDecision?: string }).permissionDecision, 'deny');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('init and repair render adapters with the installed engine package name', sourceRepoOnly, async () => {
  const { execFileSync } = await import('node:child_process');
  const { copyFile } = await import('node:fs/promises');
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-renamed-engine-'));
  const engine = join(dir, 'engine');
  const project = join(dir, 'project');
  try {
    const packed = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })) as [{ files: { path: string }[] }];
    for (const { path } of packed[0].files) {
      const target = join(engine, path);
      await mkdir((await import('node:path')).dirname(target), { recursive: true });
      await copyFile(join(ROOT, path), target);
    }
    const enginePackage = JSON.parse(await readFile(join(engine, 'package.json'), 'utf8')) as { name: string };
    enginePackage.name = '@acme/engine';
    await writeFile(join(engine, 'package.json'), JSON.stringify(enginePackage, null, 2) + '\n');
    await symlink(join(ROOT, 'node_modules'), join(engine, 'node_modules'), 'dir');
    await mkdir(project);
    const cli = join(engine, 'harness/cli.mjs');
    const init = (...args: string[]) => spawnSync('node', [cli, 'init', ...args, '--json'], { cwd: project, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const fresh = init('--start', 'blank', '--no-install');
    assert.equal(fresh.status, 0, fresh.stdout + fresh.stderr);
    const gemini = join(project, '.gemini/sketchbook-guard.mjs');
    const copilot = join(project, '.github/hooks/sketchbook-guard.mjs');
    assert.match(await readFile(gemini, 'utf8'), /@acme\/engine\/harness/);
    assert.match(await readFile(copilot, 'utf8'), /@acme\/engine\/harness\/cli\.mjs/);
    await rm(gemini);
    await rm(copilot);
    const repair = init();
    assert.equal(repair.status, 0, repair.stdout + repair.stderr);
    assert.match(await readFile(gemini, 'utf8'), /@acme\/engine\/harness/);
    assert.match(await readFile(copilot, 'utf8'), /@acme\/engine\/harness\/cli\.mjs/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
