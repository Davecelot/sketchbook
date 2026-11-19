// Opt-in: inspect the real Codex CLI's model-visible input without a model account.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from './helpers.mjs';

test('Codex discovers project guidance and skill from a nested design-system workspace', { skip: process.env.SKETCHBOOK_TEST_CODEX !== '1', timeout: 30000 }, async () => {
  const temp = await mkdtemp(join(tmpdir(), 'sketchbook-codex-instructions-'));
  const repo = join(temp, 'app');
  const project = join(repo, 'design-system');
  const config = join(temp, 'codex-config');
  try {
    await mkdir(join(project, '.agents/skills/sketchbook'), { recursive: true });
    await mkdir(config);
    assert.equal(spawnSync('git', ['init', '-q', repo]).status, 0);
    await writeFile(join(repo, 'AGENTS.md'), 'HOST_PROJECT_GUIDANCE: preserve the app.\n');
    await cp(join(ROOT, 'harness/templates/project/AGENTS.md'), join(project, 'AGENTS.md'));
    await cp(join(ROOT, 'harness/templates/project/.agents/skills/sketchbook/SKILL.md'), join(project, '.agents/skills/sketchbook/SKILL.md'));
    const env: NodeJS.ProcessEnv = { ...process.env, CODEX_HOME: config };
    for (const key of Object.keys(env)) if (/^(OPENAI_|ANTHROPIC_|GH_|GITHUB_)/i.test(key)) delete env[key];
    const inspect = (cwd: string) => {
      const result = spawnSync('codex', ['debug', 'prompt-input', 'change a Sketchbook component'], { cwd, env, encoding: 'utf8', timeout: 20000, maxBuffer: 16 * 1024 * 1024 });
      assert.equal(result.status, 0, result.stderr);
      return result.stdout;
    };
    const parent = inspect(repo);
    assert.match(parent, /HOST_PROJECT_GUIDANCE/);
    assert.doesNotMatch(parent, /This project uses the Sketchbook CLI and a contract-first design system/);
    assert.doesNotMatch(parent, /Work on a Sketchbook design-system project/);
    const nested = inspect(project);
    assert.match(nested, /HOST_PROJECT_GUIDANCE/);
    assert.match(nested, /This project uses the Sketchbook CLI and a contract-first design system/);
    assert.match(nested, /Work on a Sketchbook design-system project/);
    assert.match(nested, /sketchbook\/SKILL\.md/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
