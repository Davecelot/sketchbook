import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { codexSubdirectoryAdapterMatches, codexSubdirectoryLauncher, copilotRepositoryHookLocation, nativeHookStatus } from '../lib/agent-diagnostics.mjs';
import { ROOT, sourceRepoOnly } from './helpers.mjs';

test('native hook diagnostics distinguish missing, custom, malformed and registered settings without running them', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-agent-doctor-'));
  try {
    assert.equal(codexSubdirectoryLauncher(dir), false);
    assert.equal(codexSubdirectoryAdapterMatches(dir), null);
    assert.deepEqual(nativeHookStatus(dir, 'sketchbook'), { codex: { registration: 'missing', scriptPresent: false, scriptMatchesTemplate: null }, gemini: { registration: 'missing', scriptPresent: false, scriptMatchesTemplate: null, enginePresent: false }, copilot: { registration: 'missing', scriptPresent: false, scriptMatchesTemplate: null, enginePresent: false } });
    await mkdir(join(dir, '.codex'), { recursive: true });
    await cp(join(ROOT, 'harness/templates/project/.codex/hooks.json'), join(dir, '.codex/hooks.json'));
    assert.equal(codexSubdirectoryLauncher(dir), true);
    await cp(join(ROOT, 'harness/templates/project/.codex/sketchbook-guard.mjs'), join(dir, '.codex/sketchbook-guard.mjs'));
    const guard = await (await import('node:fs/promises')).readFile(join(dir, '.codex/sketchbook-guard.mjs'), 'utf8');
    assert.equal(codexSubdirectoryAdapterMatches(dir), true);
    await writeFile(join(dir, '.codex/sketchbook-guard.mjs'), guard.replace(/\n/g, '\r\n'));
    assert.equal(codexSubdirectoryAdapterMatches(dir), true);
    await writeFile(join(dir, '.codex/sketchbook-guard.mjs'), guard + '\n// Custom\n');
    assert.equal(codexSubdirectoryAdapterMatches(dir), false);

    const codexSettings = JSON.parse(await (await import('node:fs/promises')).readFile(join(dir, '.codex/hooks.json'), 'utf8')) as { hooks: { PreToolUse: { hooks: unknown[] }[] } };
    codexSettings.hooks.PreToolUse[0]?.hooks.pop();
    await writeFile(join(dir, '.codex/hooks.json'), JSON.stringify(codexSettings));
    assert.equal(codexSubdirectoryLauncher(dir), false);
    await mkdir(join(dir, '.gemini'), { recursive: true });
    await mkdir(join(dir, '.github/hooks'), { recursive: true });
    await writeFile(join(dir, '.gemini/settings.json'), '{bad json');
    await writeFile(join(dir, '.github/hooks/sketchbook.json'), JSON.stringify({ version: 1, hooks: { preToolUse: [{ command: `touch ${join(dir, 'executed')}` }] } }));
    assert.equal(nativeHookStatus(dir, 'sketchbook').gemini.registration, 'invalid');
    assert.equal(nativeHookStatus(dir, 'sketchbook').copilot.registration, 'unrecognized');
    assert.equal(existsSync(join(dir, 'executed')), false);
    await cp(join(ROOT, 'harness/templates/project/.gemini/settings.json'), join(dir, '.gemini/settings.json'));
    await cp(join(ROOT, 'harness/templates/project/.github/hooks/sketchbook.json'), join(dir, '.github/hooks/sketchbook.json'));
    const incomplete = nativeHookStatus(dir, 'sketchbook');
    assert.equal(incomplete.gemini.registration, 'registered');
    assert.equal(incomplete.gemini.enginePresent, false);
    assert.equal(incomplete.copilot.registration, 'registered');
    assert.equal(incomplete.copilot.scriptPresent, false);
    await cp(join(ROOT, 'harness/templates/project/.gemini/sketchbook-guard.mjs'), join(dir, '.gemini/sketchbook-guard.mjs'));
    await cp(join(ROOT, 'harness/templates/project/.github/hooks/sketchbook-guard.mjs'), join(dir, '.github/hooks/sketchbook-guard.mjs'));
    await mkdir(join(dir, 'node_modules'));
    await symlink(ROOT, join(dir, 'node_modules/sketchbook'), 'dir');
    const present = nativeHookStatus(dir, 'sketchbook');
    assert.equal(present.gemini.enginePresent, true);
    assert.equal(present.copilot.enginePresent, true);
    assert.equal(present.copilot.scriptPresent, true);
    assert.equal(present.gemini.scriptMatchesTemplate, true);
    assert.equal(present.copilot.scriptMatchesTemplate, true);
    await writeFile(join(dir, '.github/hooks/sketchbook-guard.mjs'), '// team-owned adapter\n');
    assert.equal(nativeHookStatus(dir, 'sketchbook').copilot.scriptMatchesTemplate, false);
    assert.equal(await (await import('node:fs/promises')).readFile(join(dir, '.github/hooks/sketchbook-guard.mjs'), 'utf8'), '// team-owned adapter\n');
    await writeFile(join(dir, '.gemini/settings.json'), JSON.stringify({ hooks: { BeforeTool: [{ matcher: 'write_file|replace', hooks: [{ type: 'command', command: 'node "${GEMINI_PROJECT_DIR}/.gemini/sketchbook-guard.mjs"' }] }] } }));
    assert.deepEqual(nativeHookStatus(dir, 'sketchbook').gemini, { registration: 'registered', scriptPresent: true, scriptMatchesTemplate: true, enginePresent: true });
    await writeFile(join(dir, '.gemini/settings.json'), JSON.stringify({ hooks: { BeforeTool: [{ matcher: 'write_file|replace', hooks: [{ type: 'command', command: 'node "${GEMINI_PROJECT_DIR}/node_modules/sketchbook/harness/agent/gemini-guard.mjs"' }] }] } }));
    assert.deepEqual(nativeHookStatus(dir, 'sketchbook').gemini, { registration: 'registered', scriptPresent: true, scriptMatchesTemplate: null, enginePresent: true });
    await writeFile(join(dir, '.gemini/settings.json'), JSON.stringify({ hooks: { BeforeTool: [{ matcher: 'read_file', hooks: [{ type: 'command', command: 'node custom.mjs' }] }] } }));
    assert.equal(nativeHookStatus(dir, 'sketchbook').gemini.registration, 'unrecognized');
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('Copilot repository-hook location distinguishes the Git root, nested folders and unknown repositories', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-copilot-location-'));
  try {
    const nested = join(dir, 'design system');
    await mkdir(nested);
    assert.equal(copilotRepositoryHookLocation(dir), 'unknown');
    assert.equal(spawnSync('git', ['-C', dir, 'init', '-q']).status, 0);
    assert.equal(copilotRepositoryHookLocation(dir), 'repository-root');
    assert.equal(copilotRepositoryHookLocation(nested), 'nested');
    const alias = join(dir, 'alias');
    await symlink(nested, alias, 'dir');
    assert.equal(copilotRepositoryHookLocation(alias), 'nested');
    assert.equal(spawnSync('git', ['-C', nested, 'init', '-q']).status, 0);
    assert.equal(copilotRepositoryHookLocation(nested), 'repository-root');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
