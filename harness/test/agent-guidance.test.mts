import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, sourceRepoOnly } from './helpers.mjs';

// Keep the portable routing map in sync with the workflows shipped in the Claude layer.
test('portable guidance names every shipped skill and slash workflow', sourceRepoOnly, async () => {
  const guidance = await readFile(join(ROOT, 'harness/templates/project/AGENT-WORKFLOWS.md'), 'utf8');
  const skills = (await readdir(join(ROOT, '.claude/skills'), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const commands = (await readdir(join(ROOT, '.claude/commands'))).filter((name) => name.endsWith('.md')).map((name) => name.slice(0, -3));
  for (const name of [...skills, ...commands]) assert.ok(guidance.includes(`\`${name}\``), `portable guidance is missing ${name}`);
});

test('TRAE project rule points to the shared workflows and is marked always applicable', sourceRepoOnly, async () => {
  const rule = await readFile(join(ROOT, 'harness/templates/project/.trae/rules/sketchbook.md'), 'utf8');
  assert.match(rule, /^---\n(?:[^\n]*\n)*alwaysApply: true\n(?:[^\n]*\n)*---\n/);
  assert.match(rule, /`AGENTS\.md`/);
  assert.match(rule, /`AGENT-WORKFLOWS\.md`/);
});


test('JetBrains AI Assistant rule declares its activation type and points to shared workflows', sourceRepoOnly, async () => {
  const rule = await readFile(join(ROOT, 'harness/templates/project/.aiassistant/rules/sketchbook.md'), 'utf8');
  assert.match(rule, /^---\napply: always\n---\n/);
  assert.match(rule, /`AGENTS\.md`/);
  assert.match(rule, /`AGENT-WORKFLOWS\.md`/);
});
