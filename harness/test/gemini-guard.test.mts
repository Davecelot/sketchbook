import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, rm, symlink, realpath, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, sourceRepoOnly } from './helpers.mjs';

const assertDenied = (result: { status: number | null; stdout: string; stderr: string }) => {
  assert.equal(result.status, 0, result.stderr);
  assert.equal((JSON.parse(result.stdout) as { decision?: string }).decision, 'deny');
};

test('Gemini native edit events enforce the existing generated-file and decision guards', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook gemini '));
  try {
    await mkdir(join(dir, 'spec/decisions'), { recursive: true });
    const decision = '### SB-0001 · 2026-01-01 · A decision\n**Status:** accepted\n**Decision:** Keep it.';
    await writeFile(join(dir, 'spec/decisions/DECISIONS.md'), '# Decisions\n\n' + decision + '\n');
    const call = (tool_name: string, tool_input: object) => spawnSync('node', [join(ROOT, 'harness/agent/gemini-guard.mjs')], { cwd: dir, input: JSON.stringify({ cwd: dir, tool_name, tool_input }), env: { ...process.env, GEMINI_PROJECT_DIR: dir }, encoding: 'utf8' });
    const generated = call('write_file', { file_path: 'generated/css/tokens.css', content: 'bad' });
    assertDenied(generated);
    assert.match(generated.stdout, /Blocked/);
    assertDenied(call('replace', { file_path: 'src/index.ts', old_string: 'a', new_string: 'b' }));
    assert.equal(call('write_file', { file_path: 'src/example.ts', content: 'ok' }).status, 0);
    assertDenied(call('replace', { file_path: 'spec/decisions/DECISIONS.md', old_string: 'Keep it.', new_string: 'Change it.' }));
    assert.equal(call('write_file', { file_path: 'spec/decisions/DECISIONS.md', content: '# Decisions\n\n' + decision + '\n' }).status, 0);
    assert.equal(call('write_file', { file_path: join(dir, '..', 'other.styles.ts'), content: 'ok' }).status, 0);
    const other = call('read_file', { file_path: 'generated/css/tokens.css' });
    assert.equal(other.status, 0);
    assert.deepEqual(JSON.parse(other.stdout), {});
    assert.equal(call('write_file', {}).status, 2);
    await mkdir(join(dir, '.gemini'));
    await writeFile(join(dir, '.gemini/sketchbook-guard.mjs'), await readFile(join(ROOT, 'harness/templates/project/.gemini/sketchbook-guard.mjs')));
    await mkdir(join(dir, 'node_modules'));
    await symlink(ROOT, join(dir, 'node_modules/sketchbook'), 'dir');
    const settings = JSON.parse(await readFile(join(ROOT, 'harness/templates/project/.gemini/settings.json'), 'utf8')) as { hooks: { BeforeTool: { hooks: { command: string }[] }[] } };
    const command = settings.hooks.BeforeTool[0]?.hooks[0]?.command;
    assert.ok(command);
    const integrated = spawnSync('sh', ['-c', command], { cwd: dir, input: JSON.stringify({ cwd: dir, tool_name: 'write_file', tool_input: { file_path: 'generated/test.css', content: 'bad' } }), env: { ...process.env, GEMINI_PROJECT_DIR: dir }, encoding: 'utf8' });
    assertDenied(integrated);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('Gemini guard blocks malformed inputs and unexpected runtime failures', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-gemini-failure-'));
  try {
    const guard = join(ROOT, 'harness/agent/gemini-guard.mjs');
    const run = (input: string, project = dir) => spawnSync('node', [guard], { cwd: dir, input, env: { ...process.env, GEMINI_PROJECT_DIR: project }, encoding: 'utf8' });
    for (const input of ['null', '{broken', JSON.stringify({ tool_name: 'write_file', cwd: 42, tool_input: { file_path: 'generated/test.css' } })]) {
      const result = run(input);
      assert.equal(result.status, 2, result.stderr);
      assert.match(result.stderr, /Sketchbook guard/);
    }
    const absentRoot = run(JSON.stringify({ tool_name: 'write_file', tool_input: { file_path: 'generated/test.css' } }), join(dir, 'missing-project'));
    assert.equal(absentRoot.status, 2, absentRoot.stderr);
    assert.match(absentRoot.stderr, /Sketchbook guard failed/);
    const engine = join(dir, 'engine');
    await mkdir(join(engine, 'harness/agent'), { recursive: true });
    await mkdir(join(engine, 'harness/lib'), { recursive: true });
    await cp(guard, join(engine, 'harness/agent/gemini-guard.mjs'));
    await cp(join(ROOT, 'harness/lib/files.mjs'), join(engine, 'harness/lib/files.mjs'));
    const missingUnderlyingGuard = spawnSync('node', [join(engine, 'harness/agent/gemini-guard.mjs')], { cwd: dir, input: JSON.stringify({ tool_name: 'write_file', tool_input: { file_path: 'generated/test.css' } }), env: { ...process.env, GEMINI_PROJECT_DIR: dir }, encoding: 'utf8' });
    assert.equal(missingUnderlyingGuard.status, 2, missingUnderlyingGuard.stderr);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('Gemini guards resolve workspace and in-project symlink aliases without blocking unrelated files', sourceRepoOnly, async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'sketchbook gemini aliases '));
  const project = join(workspace, 'project');
  const alias = join(workspace, 'workspace-alias');
  const outside = join(workspace, 'outside');
  try {
    await mkdir(join(project, 'generated'), { recursive: true });
    await mkdir(join(project, 'spec/decisions'), { recursive: true });
    await mkdir(outside);
    await writeFile(join(project, 'spec/decisions/DECISIONS.md'), '# Decisions\n\n### SB-0001 · 2026-01-01 · A decision\n**Status:** accepted\n**Decision:** Keep it.\n');
    await symlink(project, alias, 'dir');
    await symlink(join(project, 'generated'), join(project, 'output-alias'), 'dir');
    const realProject = await realpath(project);
    const call = (cwd: string, path: string, tool = 'write_file') => spawnSync('node', [join(ROOT, 'harness/agent/gemini-guard.mjs')], {
      cwd: project, env: { ...process.env, GEMINI_PROJECT_DIR: project }, encoding: 'utf8',
      input: JSON.stringify({ cwd, tool_name: tool, tool_input: { file_path: path, content: 'bad', old_string: 'Keep it.', new_string: 'Changed.' } }),
    });
    assertDenied(call(realProject, join(alias, 'generated/new.css')));
    assertDenied(call(alias, join(realProject, 'generated/new.css')));
    assertDenied(call(realProject, join(project, 'output-alias/new.css')));
    assertDenied(call(realProject, join(alias, 'spec/decisions/DECISIONS.md'), 'replace'));
    assert.equal(call(realProject, join(outside, 'ordinary.ts')).status, 0);
    await rm(join(project, 'generated'), { recursive: true });
    await symlink(outside, join(project, 'generated'), 'dir');
    assertDenied(call(realProject, join(project, 'generated/new.css')));
    assertDenied(call(realProject, join(alias, 'generated/new.css')));
    assert.equal(call(realProject, join(outside, 'new.css')).status, 0);
  } finally { await rm(workspace, { recursive: true, force: true }); }
});

test('Gemini launcher finds an engine hoisted above the project', sourceRepoOnly, async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'sketchbook gemini workspace '));
  const project = join(workspace, 'packages/design-system');
  try {
    await mkdir(join(project, '.gemini'), { recursive: true });
    await mkdir(join(workspace, 'node_modules'));
    await symlink(ROOT, join(workspace, 'node_modules/sketchbook'), 'dir');
    for (const file of ['settings.json', 'sketchbook-guard.mjs']) {
      await writeFile(join(project, '.gemini', file), await readFile(join(ROOT, 'harness/templates/project/.gemini', file)));
    }
    const settings = JSON.parse(await readFile(join(project, '.gemini/settings.json'), 'utf8')) as { hooks: { BeforeTool: { hooks: { command: string }[] }[] } };
    const command = settings.hooks.BeforeTool[0]?.hooks[0]?.command;
    assert.ok(command);
    const result = spawnSync('sh', ['-c', command], { cwd: project, env: { ...process.env, GEMINI_PROJECT_DIR: project }, input: JSON.stringify({ cwd: project, tool_name: 'write_file', tool_input: { file_path: 'generated/test.css', content: 'bad' } }), encoding: 'utf8' });
    assertDenied(result);
    assert.match(result.stdout, /Blocked/);
    const { nativeHookStatus } = await import('../lib/agent-diagnostics.mjs');
    assert.deepEqual(nativeHookStatus(project, 'sketchbook').gemini, { registration: 'registered', scriptPresent: true, scriptMatchesTemplate: true, enginePresent: true });
  } finally { await rm(workspace, { recursive: true, force: true }); }
});
