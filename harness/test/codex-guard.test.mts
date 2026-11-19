import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, sourceRepoOnly } from './helpers.mjs';

test('Codex patch guard checks generated paths without affecting other files or granting permission', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-codex-'));
  try {
    await mkdir(join(dir, '.codex'));
    await cp(join(ROOT, 'harness/templates/project/.codex/sketchbook-guard.mjs'), join(dir, '.codex/sketchbook-guard.mjs'));
    const run = (patch: string, tool = 'apply_patch') => {
      const r = spawnSync('node', [join(dir, '.codex/sketchbook-guard.mjs')], { cwd: dir, input: JSON.stringify({ cwd: dir, tool_name: tool, tool_input: { command: patch } }), encoding: 'utf8' });
      assert.equal(r.status, 0, r.stderr);
      return JSON.parse(r.stdout) as { hookSpecificOutput?: { permissionDecision: string } };
    };
    const patch = (line: string) => `*** Begin Patch\n${line}\n*** End Patch\n`;
    for (const line of ['*** Update File: generated/css/tokens.css', '*** Add File: spec/tokens/foundation/new.json', '*** Delete File: src/index.ts', '*** Update File: src/components/example/a.styles.ts', '*** Update File: src/example.ts\n*** Move to: generated/new.ts']) {
      assert.equal(run(patch(line)).hookSpecificOutput?.permissionDecision, 'deny', line);
    }
    assert.deepEqual(run(patch('*** Update File: src/example.ts\n+*** Update File: generated/not-a-header')), {});
    assert.deepEqual(run(patch(`*** Update File: ${join(dir, '..', 'outside.styles.ts')}`)), {});
    assert.deepEqual(run(patch('*** Update File: generated/css/tokens.css'), 'shell_command'), {});
    assert.deepEqual(run('not a patch'), {});
    const invalid = spawnSync('node', [join(dir, '.codex/sketchbook-guard.mjs')], { cwd: dir, input: 'null', encoding: 'utf8' });
    assert.equal(invalid.status, 0, invalid.stderr);
    assert.deepEqual(JSON.parse(invalid.stdout), {});
    const invalidCwd = spawnSync('node', [join(dir, '.codex/sketchbook-guard.mjs')], { cwd: dir, input: JSON.stringify({ cwd: 42, tool_name: 'apply_patch', tool_input: { command: patch('*** Add File: generated/x.css') } }), encoding: 'utf8' });
    assert.equal(invalidCwd.status, 0, invalidCwd.stderr);
    assert.equal((JSON.parse(invalidCwd.stdout) as { hookSpecificOutput?: { permissionDecision?: string } }).hookSpecificOutput?.permissionDecision, 'deny');
    if (process.platform !== 'win32') assert.deepEqual(run(patch('*** Add File: GENERATED/new.css')), {});
    // Simulate Windows case-insensitive matching while preserving the native path resolver.
    const adapter = join(dir, '.codex/sketchbook-guard.mjs');
    const source = await readFile(adapter, 'utf8');
    assert.ok(source.includes("process.platform === 'win32'"));
    await writeFile(adapter, source.replace("process.platform === 'win32'", 'true'));
    for (const line of ['*** Add File: GENERATED/new.css', '*** Add File: Spec/Tokens/Foundation/new.json', '*** Update File: SRC/INDEX.TS', '*** Update File: src/component/Example.STYLES.TS']) {
      assert.equal(run(patch(line)).hookSpecificOutput?.permissionDecision, 'deny', line);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('Codex patch guard handles symlinked workspace and generated directory aliases', sourceRepoOnly, async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'sketchbook codex aliases '));
  const project = join(workspace, 'project');
  const alias = join(workspace, 'workspace-alias');
  const outside = join(workspace, 'outside');
  try {
    await mkdir(join(project, '.codex'), { recursive: true });
    await mkdir(join(project, 'generated'));
    await mkdir(outside);
    await cp(join(ROOT, 'harness/templates/project/.codex/sketchbook-guard.mjs'), join(project, '.codex/sketchbook-guard.mjs'));
    await symlink(project, alias, 'dir');
    await symlink(join(project, 'generated'), join(project, 'output-alias'), 'dir');
    const realProject = await realpath(project);
    const run = (cwd: string, path: string) => {
      const patch = `*** Begin Patch\n*** Add File: ${path}\n+example\n*** End Patch\n`;
      const r = spawnSync('node', [join(project, '.codex/sketchbook-guard.mjs')], { cwd: project, input: JSON.stringify({ cwd, tool_name: 'apply_patch', tool_input: { command: patch } }), encoding: 'utf8' });
      assert.equal(r.status, 0, r.stderr);
      return JSON.parse(r.stdout) as { hookSpecificOutput?: { permissionDecision: string } };
    };
    assert.equal(run(realProject, join(alias, 'generated/new.css')).hookSpecificOutput?.permissionDecision, 'deny');
    assert.equal(run(alias, join(realProject, 'generated/new.css')).hookSpecificOutput?.permissionDecision, 'deny');
    assert.equal(run(realProject, join(project, 'output-alias/new.css')).hookSpecificOutput?.permissionDecision, 'deny');
    assert.deepEqual(run(realProject, join(outside, 'ordinary.ts')), {});
    await rm(join(project, 'generated'), { recursive: true });
    await symlink(outside, join(project, 'generated'), 'dir');
    assert.equal(run(realProject, join(project, 'generated/new.css')).hookSpecificOutput?.permissionDecision, 'deny');
    assert.equal(run(realProject, join(alias, 'generated/new.css')).hookSpecificOutput?.permissionDecision, 'deny');
    assert.deepEqual(run(realProject, join(outside, 'new.css')), {});
  } finally { await rm(workspace, { recursive: true, force: true }); }
});


test('Codex subdirectory launcher runs only the exact shipped adapter', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook codex launcher '));
  try {
    await mkdir(join(dir, '.codex'), { recursive: true });
    await mkdir(join(dir, 'src'));
    const adapter = join(dir, '.codex/sketchbook-guard.mjs');
    await cp(join(ROOT, 'harness/templates/project/.codex/sketchbook-guard.mjs'), adapter);
    const settings = JSON.parse(await readFile(join(ROOT, 'harness/templates/project/.codex/hooks.json'), 'utf8')) as { hooks: { PreToolUse: { hooks: { command: string }[] }[] } };
    const launcher = settings.hooks.PreToolUse[0]?.hooks[1]?.command;
    assert.ok(launcher);
    const payload = JSON.stringify({ cwd: join(dir, 'src'), tool_name: 'apply_patch', tool_input: { command: '*** Begin Patch\n*** Add File: ../generated/test.css\n+test\n*** End Patch\n' } });
    const run = () => spawnSync('sh', ['-c', launcher], { cwd: join(dir, 'src'), input: payload, encoding: 'utf8' });
    const blocked = run();
    assert.equal(blocked.status, 0, blocked.stderr);
    assert.equal((JSON.parse(blocked.stdout) as { hookSpecificOutput?: { permissionDecision?: string } }).hookSpecificOutput?.permissionDecision, 'deny');
    const original = await readFile(adapter, 'utf8');
    await writeFile(adapter, original.replace(/\n/g, '\r\n'));
    const windowsLines = run();
    assert.equal(windowsLines.status, 0, windowsLines.stderr);
    assert.equal((JSON.parse(windowsLines.stdout) as { hookSpecificOutput?: { permissionDecision?: string } }).hookSpecificOutput?.permissionDecision, 'deny');
    const marker = join(dir, 'executed');
    await writeFile(adapter, `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, 'unexpected');`);
    const modified = run();
    assert.equal(modified.status, 0, modified.stderr);
    assert.deepEqual(JSON.parse(modified.stdout), {});
    assert.match(modified.stderr, /differs from the trusted template/);
    await assert.rejects(readFile(marker));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
