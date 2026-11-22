// The Claude layer (.claude/ skills and their agent briefs, commands, rules, hooks) must load and must not invent CLI
// commands (SB-0038). The rules live in harness/lib/claude-layer.mjs, which check H1 runs in every project.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { frontmatter, skillProblems, mentions, unknownMentions, unknownStarters, claudeLayerProblems, loadKnown, DESCRIPTION_MAX, alwaysOnContext } from '../lib/claude-layer.mjs';
import * as h1 from '../checks/h1-claude-layer.mjs';
import { fileURLToPath } from 'node:url';
import { must } from './helpers.mjs';
import type { CheckContext, CheckResult } from '../checks/types.mjs';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const problems = claudeLayerProblems(ROOT);
// H1 reads only root and config.contextBudget, so these tests hand it just those.
const runH1 = (ctx: { root: string; config: Pick<HarnessConfigJson, 'contextBudget'> }): CheckResult => h1.run(ctx as CheckContext);

test('every skill, agent brief and command has frontmatter with a name and a description', () => {
  assert.deepEqual(problems.frontmatter, []);
});

test('every skill follows the skill standard, and agents live inside skills (SB-0073)', () => {
  assert.deepEqual(problems.skills, []);
});

test('the skill standard guard rejects a skill that breaks it', () => {
  const good = [
    '---', 'name: demo', 'description: >', '  Does a thing. Trigger: when asked.', 'metadata:', '  author: sketchbook',
    "  version: '1.0.0'", '  changelog: >', '    Initial; reason; scope.', '  auto-invoke: When asked', '  allowed-tools: [Read]', '---',
    '# Demo', '## When to use', '## Critical patterns', '## Decision tree', '## Modes', '```', '## Not a heading', '```',
    '## Commands', '## Resources', '',
  ].join('\n');
  assert.deepEqual(skillProblems('demo', good, ['agents', 'references']), []);
  const bad = '---\nname: other\ndescription: Use for things.\nversion: 1.0.0\n---\n# Demo\n## Workflow\n## Resources\n';
  const found = skillProblems('demo', bad, ['subagents']);
  for (const expected of ['name "other"', 'Trigger:', 'top-level version', 'metadata.author missing', 'sections must start', 'Commands must come', 'folder "subagents/"']) {
    assert.ok(found.some((p) => p.includes(expected)), `expected a problem about ${expected}: ${found.join('; ')}`);
  }
});

test('the always-on context guards reject long descriptions and invalid explicit legacy models (SB-0114)', () => {
  const long = `---\nname: demo\ndescription: ${'x'.repeat(DESCRIPTION_MAX)} Trigger: when asked.\n---\n`;
  assert.ok(skillProblems('demo', long).some((p) => p.includes(`at most ${DESCRIPTION_MAX}`)));
  const dir = mkdtempSync(join(tmpdir(), 'sb-h1-'));
  try {
    mkdirSync(join(dir, '.claude/skills/demo/agents'), { recursive: true });
    const brief = join(dir, '.claude/skills/demo/agents/probe.md');
    writeFileSync(brief, '---\nname: probe\ndescription: Probes.\ntools: Read\n---\n');
    assert.deepEqual(claudeLayerProblems(dir).frontmatter, []);
    writeFileSync(brief, '---\nname: probe\ndescription: Probes.\ntools: Read\nmodel: unknown-legacy-alias\n---\n');
    assert.ok(claudeLayerProblems(dir).frontmatter.some((p) => p.includes('model must be one of')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('H1 counts only always-on context and rejects a layer over its budget (SB-0114)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sb-budget-'));
  try {
    mkdirSync(join(dir, '.claude/rules'), { recursive: true });
    writeFileSync(join(dir, 'CLAUDE.md'), 'x'.repeat(100));
    writeFileSync(join(dir, '.claude/rules/always.md'), 'y'.repeat(50));
    writeFileSync(join(dir, '.claude/rules/scoped.md'), `---\npaths:\n  - "src/**"\n---\n${'z'.repeat(500)}`);
    assert.deepEqual(alwaysOnContext(dir).parts, { 'CLAUDE.md': 100, rules: 50, descriptions: 0, hooks: 0 });
    const over = runH1({ root: dir, config: { contextBudget: { alwaysOnBytes: 120 } } });
    assert.ok(over.errors?.some((e) => e.msg.includes('150 of 120 bytes') && e.msg.includes('over budget')));
    const close = runH1({ root: dir, config: { contextBudget: { alwaysOnBytes: 160 } } });
    assert.equal(close.errors?.length, 0);
    assert.ok(close.warnings?.some((w) => w.msg.includes('close to the budget')));
    const roomy = runH1({ root: dir, config: { contextBudget: { alwaysOnBytes: 200 } } });
    assert.deepEqual([roomy.errors?.length, roomy.warnings?.length], [0, 0]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('H1 runs only the harness hooks, unchanged: a project\'s own or edited hook is never executed, and is reported (SB-0116)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sb-hooks-trust-'));
  const marker = join(dir, 'ran');
  try {
    mkdirSync(join(dir, '.claude/hooks'), { recursive: true });
    writeFileSync(join(dir, '.claude/hooks/guard-decisions.mjs'), readFileSync(join(ROOT, '.claude/hooks/guard-decisions.mjs')));
    writeFileSync(join(dir, '.claude/hooks/guard-generated.mjs'), `import { writeFileSync } from 'node:fs';\nwriteFileSync(${JSON.stringify(marker)}, 'x');\n`);
    const hook = (command: string) => ({ hooks: [{ type: 'command', command }] });
    writeFileSync(join(dir, '.claude/settings.json'), JSON.stringify({ hooks: { SessionStart: [
      hook(`touch "${marker}"`),
      hook('node "${CLAUDE_PROJECT_DIR}/.claude/hooks/run.mjs" hooks/guard-generated'),
      hook('node "${CLAUDE_PROJECT_DIR}/.claude/hooks/run.mjs" hooks/guard-decisions'),
      hook('node "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-decisions.mjs"'),
    ] } }));
    const { unmeasured } = alwaysOnContext(dir);
    assert.equal(existsSync(marker), false, 'neither the shell hook nor the edited harness hook ran');
    assert.equal(unmeasured.length, 2);
    assert.ok(!unmeasured.some((u) => u.includes('guard-decisions')), 'the unchanged harness hook is measured');
    const r = runH1({ root: dir, config: { contextBudget: { alwaysOnBytes: 100000 } } });
    assert.ok(r.warnings?.some((w) => /2 hook\(s\) not run/.test(w.msg)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('every CLI command named in .claude/ is a known command', () => {
  assert.deepEqual(problems.commands, [], 'Add the command to harness/cli/known-commands.json only if the CLI really has (or plans) it.');
});

test('the command guard rejects invented commands and starters', () => {
  const known = must(loadKnown(ROOT), 'harness/cli/known-commands.json');
  const doc = 'Run `sketchbook tokens make-it-pretty` then `sketchbook teleport` and `npx sketchbook init --start everything`.\n```sh\nnode harness/cli.mjs frobnicate\n```\n';
  assert.equal(unknownMentions(mentions(doc), known).length, 3);
  assert.deepEqual(unknownStarters(doc, known), ['everything']);
  assert.deepEqual(unknownMentions(mentions('Run `sketchbook tokens diff` and `sketchbook add button`.'), known), []);
  assert.equal(mentions('Prose about sketchbook tokens outside code is not a command.').length, 0);
});

test('the frontmatter reader rejects a missing description and reads folded blocks', () => {
  assert.equal(frontmatter('# no frontmatter\n'), null);
  assert.equal(must(frontmatter('---\nname: x\n---\n'), 'frontmatter').description, undefined);
  assert.equal(must(frontmatter('---\nname: x\ndescription: >\n  folded\n  text\n---\n'), 'frontmatter').description, 'folded text');
  const nested = must(frontmatter("---\nname: x\nmetadata:\n  version: '1.2.0'\n  changelog: >\n    one\n    two\n  allowed-tools: [Read]\ntools: Read\n---\n"), 'frontmatter');
  assert.deepEqual(nested.metadata, { version: '1.2.0', changelog: 'one two', 'allowed-tools': '[Read]' });
  assert.equal(nested.tools, 'Read');
});

test('H1 never reads .claude/worktrees (local checkouts with node_modules overflowed the walk)', () => {
  const root = mkdtempSync(join(tmpdir(), 'sb-h1-wt-'));
  const locked = join(root, '.claude', 'worktrees', 'agent-x');
  mkdirSync(locked, { recursive: true });
  chmodSync(locked, 0o000);
  try {
    assert.deepEqual(claudeLayerProblems(root, loadKnown(ROOT)), { frontmatter: [], skills: [], commands: [] });
  } finally {
    chmodSync(locked, 0o755);
    rmSync(root, { recursive: true, force: true });
  }
});
