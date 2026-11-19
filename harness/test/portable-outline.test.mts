import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, sourceRepoOnly } from './helpers.mjs';

test('portable page audit matches the existing Claude hook on complete pages and fragments', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-page-'));
  try {
    await writeFile(join(dir, 'harness.config.json'), JSON.stringify({ prefix: 'ui' }));
    const cases: [string, boolean, boolean][] = [
      ['<html><body><ui-card>Title</ui-card></body></html>', false, true],
      ['<html><body><main><ui-card>Title</ui-card></main></body></html>', false, true],
      ['<html><body><main><ui-card><!-- <h1>Title</h1> --></ui-card></main></body></html>', false, true],
      ['<html><body><main><ui-card><h1>Title</h1></ui-card></main></body></html>', true, true],
      ['<html><body><div role="main"><ui-card><div role="heading" aria-level="1">Title</div></ui-card></div></body></html>', true, true],
      ['<ui-card>Fragment</ui-card>', true, false],
      ['<html><body><sb-card>Other prefix</sb-card></body></html>', true, false],
    ];
    for (const [html, expected, checked] of cases) {
      const file = join(dir, 'page.html');
      await writeFile(file, html);
      const hook = spawnSync('node', [join(ROOT, '.claude/hooks/page-outline.mjs')], { input: JSON.stringify({ tool_input: { file_path: file } }), env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, encoding: 'utf8' });
      const cli = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-page', 'page.html', '--json'], { cwd: dir, encoding: 'utf8' });
      assert.equal(hook.status === 0, expected, hook.stderr);
      assert.equal(cli.status === 0, expected, cli.stdout + cli.stderr);
      const result = JSON.parse(cli.stdout) as { ok: boolean; data: { checked: boolean; misses: string[] } };
      assert.equal(result.ok, expected);
      assert.equal(result.data.checked, checked);
      assert.equal(result.data.misses.length === 0, expected);
    }
    const invalid = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'audit-page', 'notes.md', '--json'], { cwd: dir, encoding: 'utf8' });
    assert.equal(invalid.status, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
