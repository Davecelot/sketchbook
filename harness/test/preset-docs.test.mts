// Guard: the docs must only name presets that exist in the standards catalog (harness/standards/).
// The foundations references were first written from a research draft whose ids were never implemented
// (`8pt`, `carbon-13`, `tailwind-11` ...); a beginner who copied them got errors. In .claude/** and docs/**:
//   1. every `sketchbook tokens preset <foundation> <id>` names an id in the family that <foundation> resolves to
//      (the CLI's own resolution, familiesFor) and that is implemented;
//   2. every `sketchbook tokens set <key>.preset <id>` and every `"preset": "<id>"` in a JSON snippet exists
//      (under the family its config key points at, when the snippet names the key);
//   3. every backticked id in a table column headed "Preset id" exists (`family: id` or a bare id), and a row for a
//      catalogued-but-not-implemented id says "not implemented".
// Ideas that have no preset live under a heading "Not in the catalog yet"; that section is exempt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { families, presetsOf, FAMILY_KEYS } from '../standards/resolve.mjs';
import { familiesFor } from '../commands/tokens.mjs';
import { SOURCE_REPO } from './helpers.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const EXEMPT_HEADING = /^(#{1,6})\s+Not in the catalog yet\b/i;

export interface Scan { count: number; errors: string[] }

// Other branches' checkouts live here; their docs are not this tree's.
const WORKTREES = join(ROOT, '.claude', 'worktrees');

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (p !== WORKTREES) yield* walk(p);
    }
    else if (entry.name.endsWith('.md')) yield p;
  }
}

// Text without the "Not in the catalog yet" sections (up to the next heading of the same or a higher level).
// `#` lines inside fenced code are comments, not headings.
export function withoutExempt(text: string): string {
  const out: string[] = [];
  let fence = false;
  let skipLevel = 0;
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) fence = !fence;
    const h = !fence && /^(#{1,6})\s/.exec(line);
    if (h && skipLevel && (h[1] ?? '').length <= skipLevel) skipLevel = 0;
    if (!skipLevel && !fence) {
      const ex = EXEMPT_HEADING.exec(line);
      if (ex) skipLevel = (ex[1] ?? '').length;
    }
    if (!skipLevel) out.push(line);
  }
  return out.join('\n');
}

const findPreset = (fam: string, id: string) => presetsOf(fam).find((p) => p.id === id || p.aliases?.includes(id));
const anyPreset = (id: string) => families().map((f) => ({ f, p: findPreset(f, id) })).find((x) => x.p);

// The family a config key such as `spacing`, `typography.scale` or `color.ramp` chooses (or a family name itself).
function familyOfKey(key: string): string | undefined {
  if (families().includes(key)) return key;
  return families().find((f) => FAMILY_KEYS[f] === key);
}

function check(fam: string | undefined, id: string, where: string, errors: string[]): void {
  const p = fam ? findPreset(fam, id) : anyPreset(id)?.p;
  if (!p) errors.push(`${where}: "${id}" is not a preset${fam ? ` of ${fam} (${presetsOf(fam).map((x) => x.id).join(', ')})` : ' of any family'}`);
  else if (p.implemented === false) errors.push(`${where}: "${id}" is catalogued but not implemented, so the command is refused`);
}

// 1. sketchbook tokens preset <foundation> <id>  (and tokens set <key>.preset <id>)
export function commandErrors(text: string): Scan {
  const errors: string[] = [];
  let count = 0;
  const src = withoutExempt(text);
  for (const m of src.matchAll(/\btokens\s+preset\s+([A-Za-z][\w.-]*)\s+([a-z0-9][a-z0-9.-]*)/g)) {
    count++;
    const [, foundation = '', id = ''] = m;
    let fams: string[];
    try { fams = familiesFor(foundation); } catch { errors.push(`tokens preset ${foundation} ${id}: unknown foundation "${foundation}"`); continue; }
    const hit = fams.find((f) => findPreset(f, id));
    if (!hit) errors.push(`tokens preset ${foundation} ${id}: no preset "${id}" in ${fams.join(', ')} (${fams.map((f) => presetsOf(f).map((x) => x.id).join(', ')).join('; ')})`);
    else check(hit, id, `tokens preset ${foundation} ${id}`, errors);
  }
  for (const m of src.matchAll(/\btokens\s+set\s+([\w.]+)\.preset\s+["']?([a-z0-9][a-z0-9.-]*)/g)) {
    count++;
    check(familyOfKey(m[1] ?? ''), m[2] ?? '', `tokens set ${m[1]}.preset ${m[2]}`, errors);
  }
  return { count, errors };
}

// 2. "preset": "<id>" in JSON snippets. `"spacing": { "preset": "grid-8" }` is checked against that key's family.
export function jsonErrors(text: string): Scan {
  const errors: string[] = [];
  let count = 0;
  const src = withoutExempt(text);
  for (const m of src.matchAll(/(?:"([\w.-]+)"\s*:\s*\{\s*)?"preset"\s*:\s*"([^"<>]+)"/g)) {
    count++;
    const key = m[1];
    const fam = key ? familyOfKey(key) ?? Object.keys(FAMILY_KEYS).find((f) => FAMILY_KEYS[f]?.split('.').at(-1) === key) : undefined;
    check(fam, m[2] ?? '', `"preset": "${m[2]}"${key ? ` under "${key}"` : ''}`, errors);
  }
  return { count, errors };
}

// 3. Tables whose header has a "Preset id" column.
export function tableErrors(text: string): Scan {
  const errors: string[] = [];
  let count = 0;
  const lines = withoutExempt(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const header = (lines[i] ?? '').trim();
    if (!header.startsWith('|')) continue;
    const cells = (l: string): string[] => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const col = cells(header).findIndex((c) => /^preset id$/i.test(c));
    if (col < 0) continue;
    for (let j = i + 2; j < lines.length && (lines[j] ?? '').trim().startsWith('|'); j++) {
      const row = cells(lines[j] ?? '');
      for (const span of (row[col] ?? '').matchAll(/`([^`]+)`/g)) {
        count++;
        const m = /^(?:([A-Za-z]\w*):\s*)?([a-z0-9][a-z0-9.-]*)$/.exec((span[1] ?? '').trim());
        if (!m) { errors.push(`table id \`${span[1]}\` is not "id" or "family: id"`); continue; }
        const [, fam, id = ''] = m;
        if (fam && !families().includes(fam)) { errors.push(`table id \`${span[1]}\`: unknown family "${fam}" (${families().join(', ')})`); continue; }
        const p = fam ? findPreset(fam, id) : anyPreset(id)?.p;
        if (!p) { errors.push(`table id \`${span[1]}\` is not in the catalog${fam ? ` family ${fam}` : ''}`); continue; }
        if (p.implemented === false && !/not implemented/i.test(row.join(' '))) errors.push(`table id \`${span[1]}\` is catalogued but not implemented; its row must say "not implemented"`);
      }
    }
  }
  return { count, errors };
}

const scanned: { file: string; text: string }[] = [];
// The harness's docs (.claude/, docs/cli.md); the rest of docs/ is the team's, checked only in the Sketchbook repo.
const files: string[] = [];
for await (const f of walk(join(ROOT, '.claude'))) files.push(f);
if (SOURCE_REPO) for await (const f of walk(join(ROOT, 'docs'))) files.push(f);
else files.push(join(ROOT, 'docs/cli.md'));
for (const f of files) scanned.push({ file: relative(ROOT, f), text: await readFile(f, 'utf8') });

test('docs name only presets that exist in the catalog', () => {
  const totals = { commands: 0, json: 0, table: 0 };
  const errors: string[] = [];
  for (const { file, text } of scanned) {
    for (const [kind, fn] of [['commands', commandErrors], ['json', jsonErrors], ['table', tableErrors]] satisfies [keyof typeof totals, (text: string) => Scan][]) {
      const r = fn(text);
      totals[kind] += r.count;
      errors.push(...r.errors.map((e) => `${file}: ${e}`));
    }
  }
  assert.deepEqual(errors, [], `Docs name presets that are not in harness/standards/ (or not implemented). Fix the doc, or move the idea under "Not in the catalog yet".\n${errors.join('\n')}`);
  // The guard must actually find things, or it proves nothing.
  assert.ok(totals.commands >= 6, `only ${totals.commands} "tokens preset <foundation> <id>" commands found`);
  assert.ok(totals.json >= 2, `only ${totals.json} "preset" JSON snippets found`);
  assert.ok(totals.table >= 50, `only ${totals.table} ids found in "Preset id" tables`);
});

test('guard rejects invented ids (it can fail)', () => {
  // commands
  assert.equal(commandErrors('sketchbook tokens preset spacing 8pt --dry-run').errors.length, 1);
  assert.equal(commandErrors('`npx sketchbook tokens preset typography modular-1.25`').errors.length, 1);
  assert.equal(commandErrors('sketchbook tokens preset layout-grid carbon-2x').errors.length, 1);
  assert.equal(commandErrors('sketchbook tokens preset nonsense grid-8').errors.length, 1, 'unknown foundation');
  assert.equal(commandErrors('sketchbook tokens preset spacing 8pt').count, 1);
  assert.match(commandErrors('sketchbook tokens preset color tailwind-11').errors[0] ?? '', /not implemented/);
  assert.match(commandErrors('sketchbook tokens preset contrast apca').errors[0] ?? '', /not implemented/);
  assert.equal(commandErrors('sketchbook tokens set spacing.preset 8pt').errors.length, 1);
  assert.equal(commandErrors('sketchbook tokens set typography.scale.preset major-thirds').errors.length, 1);
  // json
  assert.equal(jsonErrors('{ "spacing": { "preset": "carbon-13" } }').errors.length, 1);
  assert.equal(jsonErrors('{ "preset": "fluid-utopia" }').errors.length, 1);
  assert.equal(jsonErrors('{ "radius": { "preset": "grid-8" } }').errors.length, 1, 'right id, wrong family');
  // tables
  const table = (cell: string, rest = 'a | b | c') => `| Preset id | What | Pick | Source |\n| --- | --- | --- | --- |\n| ${cell} | ${rest} |\n`;
  assert.equal(tableErrors(table('`spacing: 4px-linear`')).errors.length, 1);
  assert.equal(tableErrors(table('`bootstrap-6`')).errors.length, 1);
  assert.equal(tableErrors(table('`typeScale: grid-8`')).errors.length, 1, 'right id, wrong family');
  assert.equal(tableErrors(table('`nope: grid-8`')).errors.length, 1, 'unknown family');
  assert.equal(tableErrors(table('`rampMethods: tailwind-11`')).errors.length, 1, 'unimplemented row must say so');
});

test('guard accepts real ids and exempts "Not in the catalog yet"', () => {
  const table = (cell: string, rest = 'a | b | c') => `| Preset id | What | Pick | Source |\n| --- | --- | --- | --- |\n| ${cell} | ${rest} |\n`;
  assert.deepEqual(commandErrors('sketchbook tokens preset spacing grid-8 --dry-run\nsketchbook tokens preset typography major-third\nsketchbook tokens preset color slate\nsketchbook tokens preset layout-grid 16-col').errors, []);
  assert.equal(commandErrors('sketchbook tokens preset spacing grid-8').count, 1);
  assert.deepEqual(commandErrors('sketchbook tokens preset <foundation> <id>').errors, [], 'placeholders are not ids');
  assert.deepEqual(jsonErrors('{ "spacing": { "preset": "grid-8" }, "radius": "soft", "typography": { "scale": { "preset": "major-third" } } }').errors, []);
  assert.deepEqual(tableErrors(table('`spacing: grid-4` (default)')).errors, []);
  assert.deepEqual(tableErrors(table('`grid-4`')).errors, [], 'a bare id that exists is accepted');
  assert.deepEqual(tableErrors(table('`rampMethods: tailwind-11` (not implemented)')).errors, []);
  assert.deepEqual(tableErrors(table('`contrast: wcag-aa`') + '\nSome prose with `spacing: nope`.').errors, []);
  const exempt = '## Options\n\n## Not in the catalog yet\n- `spacing: carbon-13`\n```sh\n# sketchbook comment\nsketchbook tokens preset spacing carbon-13\n```\n{ "preset": "fluid-utopia" }\n' + table('`bootstrap-6`') + '\n## Accessibility\nsketchbook tokens preset spacing grid-8\n';
  assert.deepEqual([commandErrors(exempt), jsonErrors(exempt), tableErrors(exempt)].map((r) => r.errors), [[], [], []]);
  // the exemption ends at the next heading of the same level, so later text is checked again
  assert.equal(commandErrors(exempt + 'sketchbook tokens preset spacing 8pt\n').errors.length, 1);
  assert.equal(commandErrors('### Not in the catalog yet\nsketchbook tokens preset spacing 8pt\n#### Detail\nsketchbook tokens preset spacing 8pt\n## Next\nsketchbook tokens preset spacing 8pt\n').errors.length, 1);
});
