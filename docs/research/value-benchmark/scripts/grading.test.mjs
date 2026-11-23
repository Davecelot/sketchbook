import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

function run(script, ...args) {
  return spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), ...args], { encoding: 'utf8' });
}
const stdout = (result) => {
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};

test('the transcript grader sees local CLI entry points and does not count denials or unfinished calls as success', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-grader-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const commands = [
    'node node_modules/@usesketchbook/cli/harness/cli.mjs approve button',
    'node_modules/.bin/sketchbook evidence red button',
    'npm run -s sketchbook -- audit-page out/settings.html',
    'grep -n sketchbook package.json',
    './node_modules/.bin/sketchbook generate',
    'npm run check && npx sketchbook audit-decisions --git-ref HEAD',
  ];
  const content = commands.map((command, i) => ({ type: 'tool_use', name: 'Bash', id: String(i), input: { command } }));
  const events = [
    { type: 'assistant', message: { id: 'turn', content } },
    { type: 'user', message: { content: ['0', '2', '3', '5'].map((tool_use_id) => ({ type: 'tool_result', tool_use_id, content: 'done' })) } },
    { type: 'result', permission_denials: [{ tool_name: 'Bash', tool_use_id: '1' }] },
  ];
  const path = join(dir, 'run.jsonl');
  await writeFile(path, events.map((entry) => JSON.stringify(entry)).join('\n'));
  const scored = stdout(run('parse-run.mjs', path));
  assert.deepEqual(scored.cliOk, { approve: 1, 'audit-page': 1 });
  assert.deepEqual(scored.cliDenied, { evidence: 1 });
  assert.deepEqual(scored.cliUnconfirmed, { generate: 1, check: 1, 'audit-decisions': 1 });
  assert.equal(scored.permissionDenials, 1);
  assert.equal(scored.cliCalls, 5);
});

test('the QA grader keeps heuristic matches separate from verified and false-positive findings', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-grader-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'out'));
  const seed = join(dir, 'seed.html');
  const page = '<html lang="en"></html>\n';
  await writeFile(seed, page);
  await writeFile(join(dir, 'out/settings.html'), page);
  const report = '# QA\n- The hint uses hard-coded #d33.\n- A package asset is alleged missing.\n- Needs investigation.\n';
  await writeFile(join(dir, 'qa-report.md'), report);
  const unreviewed = stdout(run('score-qa.mjs', dir, seed));
  assert.equal(unreviewed.unreviewedFindings, 3);
  assert.equal(unreviewed.falsePositives, undefined);
  assert.equal(unreviewed.pageUntouched, true);
  const review = join(dir, 'review.json');
  const verdicts = { 2: 'verified', 3: 'false-positive' };
  await writeFile(review, JSON.stringify({ reportSha256: createHash('sha256').update(report).digest('hex'), verdicts }));
  const scored = stdout(run('score-qa.mjs', dir, seed, review));
  assert.equal(scored.found, 1);
  assert.equal(scored.verifiedFindings, 1);
  assert.equal(scored.falsePositives, 1);
  assert.equal(scored.unreviewedFindings, 1);
  await writeFile(join(dir, 'qa-report.md'), `${report}\n`);
  assert.match(run('score-qa.mjs', dir, seed, review).stderr, /Review does not match/);
});

test('the browser grader distinguishes keyboard reachability, submission and component conformance', {
  skip: process.env.SKETCHBOOK_TEST_BENCHMARK_BROWSER !== '1',
}, async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-grader-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'out'));
  const path = join(dir, 'out/settings.html');
  assert.equal(stdout(run('score-ui.mjs', dir)).workflowPass, false, 'an incomplete trial still counts as a failed outcome');
  const html = `<!doctype html><html lang="en"><title>Settings</title><main><h1>Settings</h1><form>
    <label><input type="checkbox" name="email" checked>Email</label>
    <label><input type="checkbox" name="push">Push</label>
    <label><input type="checkbox" name="digest">Weekly digest</label>
    <button type="submit">Save</button>
  </form></main></html>`;
  await writeFile(path, html);
  const accessible = stdout(run('score-ui.mjs', dir));
  assert.equal(accessible.keyboardAllControls, true);
  assert.equal(accessible.saveWithDefaultValue, true);
  assert.equal(accessible.usesExpectedSettingsControls, false, 'native HTML is functional without using the design system');
  await writeFile(path, html.replace('name="push"', 'name="push" tabindex="-1"').replace('</main>', '<sb-missing></sb-missing></main>'));
  const incomplete = stdout(run('score-ui.mjs', dir));
  assert.equal(incomplete.keyboardAllControls, false, 'programmatic focus does not count as keyboard reachability');
  assert.equal(incomplete.pageOperational, false, 'a page with unregistered components cannot pass on axe alone');
});
