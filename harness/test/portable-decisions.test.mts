import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './helpers.mjs';

const accepted = '### SB-0001 · 2026-01-01 · A decision\n**Status:** accepted\n**Context:** c\n**Decision:** d\n**Why:** w\n**Watch out:** o';
const proposed = '### SB-0002 · 2026-01-02 · A proposal\n**Status:** proposed\n**Context:** c\n**Decision:** d\n**Why:** w\n**Watch out:** o';
const added = '### SB-0003 · 2026-01-03 · New decision\n**Status:** proposed\n**Context:** c\n**Decision:** d\n**Why:** w\n**Watch out:** o';
const log = (entries: string[]) => '# Decisions\n\n' + entries.join('\n\n---\n\n') + '\n';

test('portable decision audit preserves settled entries while allowing proposed edits and new decisions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-decisions-'));
  try {
    await mkdir(join(dir, 'spec/decisions'), { recursive: true });
    await writeFile(join(dir, 'harness.config.json'), '{}');
    await writeFile(join(dir, 'baseline.md'), log([accepted, proposed]));
    const cases: [string[], boolean][] = [
      [[accepted, proposed], true],
      [[accepted, proposed.replace('**Decision:** d', '**Decision:** revised'), added], true],
      [[accepted.replace('**Decision:** d', '**Decision:** changed'), proposed], false],
      [[proposed], false],
      [[accepted + '\nAdded to the settled entry.', proposed], false],
      [[accepted, accepted, proposed], false],
    ];
    for (const [entries, expected] of cases) {
      await writeFile(join(dir, 'spec/decisions/DECISIONS.md'), log(entries));
      const result = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-decisions', 'baseline.md', '--json'], { cwd: dir, encoding: 'utf8' });
      assert.equal(result.status === 0, expected, result.stdout + result.stderr);
      const json = JSON.parse(result.stdout) as { ok: boolean; changed: string[]; data: { compared: number } };
      assert.equal(json.ok, expected);
      assert.deepEqual(json.changed, []);
      assert.equal(json.data.compared, 1);
    }
    const windowsLog = log([accepted, proposed]).replace(/\n/g, '\r\n');
    await writeFile(join(dir, 'spec/decisions/DECISIONS.md'), windowsLog);
    const windows = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-decisions', 'baseline.md', '--json'], { cwd: dir, encoding: 'utf8' });
    assert.equal(windows.status, 0, windows.stdout + windows.stderr);
    assert.equal(await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8'), windowsLog);
    const windowsChange = windowsLog.replace('**Decision:** d', '**Decision:** changed');
    await writeFile(join(dir, 'spec/decisions/DECISIONS.md'), windowsChange);
    const changedWindows = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-decisions', 'baseline.md', '--json'], { cwd: dir, encoding: 'utf8' });
    assert.equal(changedWindows.status, 1);
    assert.match(changedWindows.stdout, /Settled decision SB-0001/);
    assert.equal(await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8'), windowsChange);
    const same = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-decisions', 'spec/decisions/DECISIONS.md', '--json'], { cwd: dir, encoding: 'utf8' });
    assert.equal(same.status, 1);
    assert.match(same.stdout, /baseline is the current decision log/);
    const missing = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-decisions', 'missing.md', '--json'], { cwd: dir, encoding: 'utf8' });
    assert.equal(missing.status, 1);
    await writeFile(join(dir, 'baseline.md'), accepted + '\n');
    await writeFile(join(dir, 'spec/decisions/DECISIONS.md'), log([accepted.replace('**Decision:** d', '**Decision:** changed')]));
    const firstHeading = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-decisions', 'baseline.md', '--json'], { cwd: dir, encoding: 'utf8' });
    assert.equal(firstHeading.status, 1);
    assert.match(firstHeading.stdout, /Settled decision SB-0001/);
    await writeFile(join(dir, 'baseline.md'), log([accepted.replace('SB-0001', 'SB-001')]));
    const malformed = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-decisions', 'baseline.md', '--json'], { cwd: dir, encoding: 'utf8' });
    assert.equal(malformed.status, 1);
    assert.match(malformed.stdout, /Invalid decision heading/);
    await writeFile(join(dir, 'baseline.md'), log([]));
    const empty = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-decisions', 'baseline.md'], { cwd: dir, encoding: 'utf8' });
    assert.equal(empty.status, 0);
    assert.match(empty.stdout, /none were compared/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('decision audit reads a selected Git baseline in a nested project without modifying files', async () => {
  const repo = await mkdtemp(join(tmpdir(), 'sketchbook-git-decisions-'));
  const dir = join(repo, 'design-system');
  try {
    await mkdir(join(dir, 'spec/decisions'), { recursive: true });
    await writeFile(join(dir, 'harness.config.json'), '{}');
    const file = join(dir, 'spec/decisions/DECISIONS.md');
    await writeFile(file, log([accepted, proposed]));
    const git = (...args: string[]) => spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
    assert.equal(git('init', '-q').status, 0);
    assert.equal(git('add', 'design-system').status, 0);
    const commit = git('-c', 'user.name=Sketchbook Test', '-c', 'user.email=sketchbook@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'baseline');
    assert.equal(commit.status, 0, commit.stderr);
    const run = (...args: string[]) => spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-decisions', ...args, '--json'], { cwd: dir, encoding: 'utf8' });
    assert.equal(run('--git-ref', 'HEAD').status, 0);
    await writeFile(file, log([accepted, proposed]).replace(/\n/g, '\r\n'));
    assert.equal(run('--git-ref', 'HEAD').status, 0, 'Git LF baseline and CRLF working copy compare equally');
    const edited = log([accepted.replace('**Decision:** d', '**Decision:** changed'), proposed]);
    await writeFile(file, edited);
    const changed = run('--git-ref', 'HEAD');
    assert.equal(changed.status, 1);
    assert.match(changed.stdout, /Settled decision SB-0001/);
    assert.equal(await (await import('node:fs/promises')).readFile(file, 'utf8'), edited);
    assert.equal(run('--git-ref', 'missing-revision').status, 1);
    assert.equal(run().status, 1);
    assert.equal(run('baseline.md', '--git-ref', 'HEAD').status, 1);
  } finally { await rm(repo, { recursive: true, force: true }); }
});
