import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import fs, { existsSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { dispatch } from '../cli/run.mjs';
import { catalogPresence, harnessCatalog } from '../lib/agent-catalog.mjs';
import { catalogProjections, catalogSourceFiles } from '../lib/agent-render.mjs';
import { ENGINE, parseJson, readJson } from '../lib/files.mjs';
import type { Envelope } from '../cli/types.mjs';

async function run(root: string, ...args: string[]) {
  let output = '';
  const exit = await dispatch(['harness', ...args, '--json'], { root, stdout: (part) => { output += part; } });
  return { exit, ...parseJson<Envelope>(output) };
}

test('the shared catalog indexes all artifact types with unique stable IDs', () => {
  const entries = harnessCatalog();
  assert.equal(new Set(entries.map(({ id }) => id)).size, entries.length);
  for (const id of ['recommended', 'hammock', 'review-rangers', 'forge-me-a-skill', 'agent:contract-author/drafter', 'agent:review-rangers/safety-guard', 'rule:contract-first', 'command:add', 'hook:hammock/hammock-activate', 'config:hammock/default-mode', 'config:claude/settings']) {
    assert.ok(entries.some((entry) => entry.id === id), id);
  }
  for (const entry of entries) if (entry.integration) assert.match(entry.id, /^(?:hook:|(?:rule|config):[^/]+\/)/);
  for (const digest of Object.values(readJson<Record<string, string | string[]>>(join(ENGINE, 'harness/templates/agent-catalog/legacy-content.json'))).flat()) {
    assert.match(digest, /^[0-9a-f]{20}$/);
  }
});

test('selective installs work without init, preview resources, and are idempotent', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'sketchbook catalog '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const preview = await run(root, 'add', 'hammock', '--agent', 'opencode', '--dry-run');
  assert.equal(preview.exit, 0);
  assert.equal(preview.changed.length, 5);
  assert.deepEqual(await readdir(root), []);
  const install = await run(root, 'add', 'hammock', 'review-rangers', '--agent', 'opencode');
  assert.equal(install.exit, 0);
  assert.deepEqual((await readdir(root)).sort(), ['.agents', '.sketchbook']);
  assert.equal((await run(root, 'add', 'hammock', 'review-rangers')).changed.length, 0);
  assert.match(await readFile(join(root, '.agents/skills/hammock/SKILL.md'), 'utf8'), /does not activate hooks/);
  assert.match(await readFile(join(root, '.agents/skills/review-rangers/SKILL.md'), 'utf8'), /independent verdict not assessed/);
  assert.deepEqual(readJson(join(root, '.sketchbook/hammock.json')), { defaultMode: null });
  await rm(join(root, '.agents/skills/hammock/assets/DECISION-LADDER.md'));
  assert.equal(catalogPresence(root).find(({ id }) => id === 'hammock')?.complete, false);
});

test('all catalog workflows install with their local resources and native projections match', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'sketchbook-catalog-all-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const entries = harnessCatalog().filter((entry) => !entry.integration && !entry.partOf);
  assert.equal((await run(root, 'add', ...entries.map(({ id }) => id))).exit, 0);
  assert.equal(existsSync(join(root, '.claude')), false);
  for (const { path, bytes } of catalogProjections()) assert.deepEqual(await readFile(join(ENGINE, path)), bytes, path);
  for (const { files } of entries) for (const { path } of files) {
    if (!path.endsWith('.md')) continue;
    const body = (await readFile(join(root, path), 'utf8')).replace(/```[\s\S]*?```|`[^`\n]*`/g, '');
    for (const [, target = ''] of body.matchAll(/\]\(([^"\s()#]+)(?:#[^)]*)?\)/g)) {
      if (/^(?:[a-z]+:|\/)/i.test(target)) continue;
      assert.ok(existsSync(resolve(root, dirname(path), target)), `${path}: ${target}`);
    }
  }
  for (const file of catalogSourceFiles().filter((file) => /\/(?:SKILL\.md|agents\/[^/]+\.md)$/.test(file))) {
    assert.doesNotMatch(await readFile(join(ENGINE, file), 'utf8'), /^(?:model|allowed-tools):|`Agent`|\b(?:sonnet|haiku|opus)\b/m, file);
  }
});

test('module internals cannot install separately; team settings survive the complete module install', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'sketchbook-module-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [id, owner] of [['config:hammock/default-mode', 'hammock'], ['agent:review-rangers/safety-guard', 'review-rangers']] as const) {
    const refused = await run(root, 'add', id);
    assert.equal(refused.exit, 1);
    assert.deepEqual(refused.changed, []);
    assert.match(refused.errors[0]?.fix ?? '', new RegExp(`harness add ${owner}`));
    assert.match((await run(root, 'show', id)).next ?? '', new RegExp(`harness add ${owner}`));
  }
  assert.deepEqual(await readdir(root), []);
  await mkdir(join(root, '.sketchbook'));
  const settings = join(root, '.sketchbook/hammock.json');
  await writeFile(settings, '{"defaultMode":"ultra"}\n');
  const request = await run(root, 'add', 'hammock', 'review-rangers');
  assert.equal(request.exit, 0);
  assert.equal(await readFile(settings, 'utf8'), '{"defaultMode":"ultra"}\n');
  assert.ok(request.changed.includes('.agents/skills/review-rangers/assets/safety-guard-template.md'));
  assert.ok(!request.changed.includes('.sketchbook/hammock.json'));
  assert.equal(existsSync(join(root, '.claude')), false);
});

test('a conflict in a bundle stops writes before touching the project', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'sketchbook-catalog-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const skill = '.agents/skills/hammock';
  await mkdir(join(root, skill), { recursive: true });
  await writeFile(join(root, skill, 'SKILL.md'), 'Team skill\n');
  await mkdir(join(root, '.opencode'));
  await writeFile(join(root, '.opencode/opencode.jsonc'), '{ /* team settings */ }\n');
  const result = await run(root, 'add', 'recommended');
  assert.equal(result.exit, 1);
  assert.deepEqual(result.changed, []);
  assert.equal(result.errors[0]?.file, `${skill}/SKILL.md`);
  assert.equal(await readFile(join(root, skill, 'SKILL.md'), 'utf8'), 'Team skill\n');
  assert.equal(await readFile(join(root, '.opencode/opencode.jsonc'), 'utf8'), '{ /* team settings */ }\n');
  assert.deepEqual(await readdir(join(root, '.agents/skills')), ['hammock']);
});

test('a symlinked destination parent is blocked, including dry runs', async (t) => {
  const temp = await mkdtemp(join(tmpdir(), 'sketchbook-catalog-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const root = join(temp, 'project');
  const external = join(temp, 'external');
  await mkdir(root);
  await mkdir(external);
  await symlink(external, join(root, '.agents'), 'dir');
  for (const args of [['--dry-run'], []]) assert.equal((await run(root, 'add', 'recommended', ...args)).exit, 1);
  assert.deepEqual(await readdir(external), []);
});

for (const concurrentEdit of [false, true]) {
  test(`late install failure ${concurrentEdit ? 'reports a path it cannot restore without losing a concurrent edit' : 'rolls back the whole module'}`, async (t) => {
    const root = await mkdtemp(join(tmpdir(), 'sketchbook-catalog-rollback-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const skill = '.agents/skills/hammock/SKILL.md';
    const config = '.sketchbook/hammock.json';
    await writeFile(join(root, 'team.txt'), 'Keep me');
    const original = fs.linkSync;
    const link = t.mock.method(fs, 'linkSync', (from: string, to: string) => {
      if (to !== join(root, config)) return original(from, to);
      assert.ok(existsSync(join(root, skill)), 'failure must happen after publishing');
      if (concurrentEdit) fs.writeFileSync(join(root, skill), 'Concurrent edit');
      throw new Error('Simulated publish failure');
    });
    syncBuiltinESMExports();
    try {
      const result = await run(root, 'add', 'hammock');
      assert.equal(result.exit, 1);
      assert.deepEqual(result.changed, concurrentEdit ? [skill] : []);
      assert.equal(result.errors[0]?.file, config);
      assert.match(result.errors[0]?.msg ?? '', /Simulated publish failure/);
      assert.deepEqual((await readdir(root)).sort(), concurrentEdit ? ['.agents', 'team.txt'] : ['team.txt']);
      assert.equal(await readFile(join(root, 'team.txt'), 'utf8'), 'Keep me');
      if (concurrentEdit) {
        assert.equal(result.errors[1]?.file, skill);
        assert.match(result.errors[1]?.msg ?? '', /Rollback could not restore/);
        assert.equal(await readFile(join(root, skill), 'utf8'), 'Concurrent edit');
        assert.deepEqual(await readdir(join(root, dirname(skill))), ['SKILL.md']);
      }
    } finally {
      link.mock.restore();
      syncBuiltinESMExports();
    }
  });
}
