import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, sourceRepoOnly } from './helpers.mjs';

test('Copilot adapter protects known native edits without granting permission or requiring a dependency install', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-copilot-'));
  try {
    await mkdir(join(dir, '.github/hooks'), { recursive: true });
    await cp(join(ROOT, 'harness/templates/project/.github/hooks/sketchbook-guard.mjs'), join(dir, '.github/hooks/sketchbook-guard.mjs'));
    const run = (toolName: string, toolArgs: unknown) => spawnSync('node', [join(dir, '.github/hooks/sketchbook-guard.mjs')], { cwd: dir, input: JSON.stringify({ cwd: dir, toolName, toolArgs }), encoding: 'utf8' });
    const absent = run('edit', { path: 'generated/example.css', old_str: 'a', new_str: 'b' });
    assert.equal(absent.status, 0);
    assert.deepEqual(JSON.parse(absent.stdout), {});
    assert.match(absent.stderr, /npm install/);
    await mkdir(join(dir, 'node_modules'));
    await symlink(ROOT, join(dir, 'node_modules/sketchbook'), 'dir');
    const malformed = spawnSync('node', [join(dir, '.github/hooks/sketchbook-guard.mjs')], { cwd: dir, input: 'null', encoding: 'utf8' });
    assert.equal(malformed.status, 0, malformed.stderr);
    assert.deepEqual(JSON.parse(malformed.stdout), {});
    const invalidCwd = spawnSync('node', [join(dir, '.github/hooks/sketchbook-guard.mjs')], { cwd: dir, input: JSON.stringify({ cwd: 42, toolName: 'edit', toolArgs: { path: 'generated/x.css' } }), encoding: 'utf8' });
    assert.equal(invalidCwd.status, 0, invalidCwd.stderr);
    assert.equal((JSON.parse(invalidCwd.stdout) as { permissionDecision?: string }).permissionDecision, 'deny');
    const settings = JSON.parse(await readFile(join(ROOT, 'harness/templates/project/.github/hooks/sketchbook.json'), 'utf8')) as { hooks: { preToolUse: { command: string }[] } };
    const command = settings.hooks.preToolUse[0]?.command;
    assert.ok(command);
    const integrated = spawnSync('sh', ['-c', command], { cwd: dir, input: JSON.stringify({ cwd: dir, toolName: 'edit', toolArgs: { path: 'generated/example.css', old_str: 'a', new_str: 'b' } }), encoding: 'utf8' });
    assert.equal((JSON.parse(integrated.stdout) as { permissionDecision?: string }).permissionDecision, 'deny');
    const blocked = run('edit', JSON.stringify({ path: 'generated/example.css', old_str: 'a', new_str: 'b' }));
    assert.equal(blocked.status, 0);
    assert.equal((JSON.parse(blocked.stdout) as { permissionDecision?: string }).permissionDecision, 'deny');
    assert.deepEqual(JSON.parse(run('edit', { path: 'src/example.ts', old_str: 'a', new_str: 'b' }).stdout), {});
    assert.deepEqual(JSON.parse(run('edit', { path: join(dir, '..', 'other.styles.ts'), old_str: 'a', new_str: 'b' }).stdout), {});
    assert.deepEqual(JSON.parse(run('bash', { command: 'echo hi' }).stdout), {});
    await mkdir(join(dir, 'spec/decisions'), { recursive: true });
    await writeFile(join(dir, 'spec/decisions/DECISIONS.md'), '# Decisions\n\n### SB-0001 · 2026-01-01 · Example\n**Status:** accepted\n**Decision:** Keep it.\n');
    const decision = run('edit', { path: 'spec/decisions/DECISIONS.md', old_str: 'Keep it.', new_str: 'Change it.' });
    assert.equal((JSON.parse(decision.stdout) as { permissionDecision?: string }).permissionDecision, 'deny');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('Copilot guard handles symlinked workspace and generated directory aliases', sourceRepoOnly, async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'sketchbook copilot aliases '));
  const project = join(workspace, 'project');
  const alias = join(workspace, 'workspace-alias');
  const outside = join(workspace, 'outside');
  try {
    await mkdir(join(project, '.github/hooks'), { recursive: true });
    await mkdir(join(project, 'generated'));
    await mkdir(join(project, 'node_modules'));
    await mkdir(join(project, 'spec/decisions'), { recursive: true });
    await mkdir(outside);
    await cp(join(ROOT, 'harness/templates/project/.github/hooks/sketchbook-guard.mjs'), join(project, '.github/hooks/sketchbook-guard.mjs'));
    await symlink(ROOT, join(project, 'node_modules/sketchbook'), 'dir');
    await symlink(project, alias, 'dir');
    await symlink(join(project, 'generated'), join(project, 'output-alias'), 'dir');
    await writeFile(join(project, 'spec/decisions/DECISIONS.md'), '# Decisions\n\n### SB-0001 · 2026-01-01 · Example\n**Status:** accepted\n**Decision:** Keep it.\n');
    const realProject = await realpath(project);
    const run = (cwd: string, path: string) => {
      const r = spawnSync('node', [join(project, '.github/hooks/sketchbook-guard.mjs')], { cwd: project, input: JSON.stringify({ cwd, toolName: 'edit', toolArgs: { path, old_str: 'Keep it.', new_str: 'Changed.' } }), encoding: 'utf8' });
      assert.equal(r.status, 0, r.stderr);
      return JSON.parse(r.stdout) as { permissionDecision?: string };
    };
    assert.equal(run(realProject, join(alias, 'generated/new.css')).permissionDecision, 'deny');
    assert.equal(run(alias, join(realProject, 'generated/new.css')).permissionDecision, 'deny');
    assert.equal(run(realProject, join(project, 'output-alias/new.css')).permissionDecision, 'deny');
    assert.equal(run(realProject, join(alias, 'spec/decisions/DECISIONS.md')).permissionDecision, 'deny');
    assert.deepEqual(run(realProject, join(outside, 'ordinary.ts')), {});
    await rm(join(project, 'generated'), { recursive: true });
    await symlink(outside, join(project, 'generated'), 'dir');
    assert.equal(run(realProject, join(project, 'generated/new.css')).permissionDecision, 'deny');
    assert.equal(run(realProject, join(alias, 'generated/new.css')).permissionDecision, 'deny');
    assert.deepEqual(run(realProject, join(outside, 'new.css')), {});
  } finally { await rm(workspace, { recursive: true, force: true }); }
});


test('documented repository-root hook invokes the nested project adapter without affecting the host app', sourceRepoOnly, async () => {
  const repo = await mkdtemp(join(tmpdir(), 'sketchbook copilot nested '));
  const project = join(repo, 'design-system');
  try {
    await mkdir(join(project, '.github/hooks'), { recursive: true });
    await mkdir(join(project, 'node_modules'));
    await mkdir(join(project, 'spec/decisions'), { recursive: true });
    await cp(join(ROOT, 'harness/templates/project/.github/hooks/sketchbook-guard.mjs'), join(project, '.github/hooks/sketchbook-guard.mjs'));
    await symlink(ROOT, join(project, 'node_modules/sketchbook'), 'dir');
    await writeFile(join(project, 'spec/decisions/DECISIONS.md'), '# Decisions\n\n### SB-0001 · 2026-01-01 · Example\n**Status:** accepted\n**Decision:** Keep it.\n');
    const docs = await readFile(join(ROOT, 'docs/agent-compatibility.md'), 'utf8');
    const section = docs.split('## Copilot repository hooks for an adopted app')[1]?.split('## Model-family test targets')[0] ?? '';
    const example = /```json\n([\s\S]*?)\n```/.exec(section)?.[1];
    assert.ok(example, 'documented JSON configuration');
    const config = JSON.parse(example) as { version: number; hooks: { preToolUse: { type: string; matcher: string; command: string }[] } };
    assert.equal(config.version, 1);
    const entry = config.hooks.preToolUse[0];
    assert.ok(entry);
    assert.equal(entry.type, 'command');
    assert.equal(entry.matcher, 'create|edit');
    const run = (cwd: string, path: string) => {
      const result = spawnSync('sh', ['-c', entry.command], { cwd: repo, input: JSON.stringify({ cwd, toolName: 'edit', toolArgs: { path, old_str: 'Keep it.', new_str: 'Changed.' } }), encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      return JSON.parse(result.stdout) as { permissionDecision?: string };
    };
    assert.equal(run(repo, 'design-system/generated/new.css').permissionDecision, 'deny');
    assert.equal(run(project, 'generated/new.css').permissionDecision, 'deny');
    assert.equal(run(repo, 'design-system/spec/decisions/DECISIONS.md').permissionDecision, 'deny');
    assert.deepEqual(run(repo, 'src/app.ts'), {});
    assert.deepEqual(run(project, 'src/component.ts'), {});
  } finally { await rm(repo, { recursive: true, force: true }); }
});
