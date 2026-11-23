// The end-to-end propagation wall: a full copy of this repository, one Foundations change, then the real pipeline
// (propagate --maintainer: tokens, styles, engine build, Figma scripts, Storybook build, docs site build). Every output
// must move with the change, and the maintainer check must pass on the copy. Slow (minutes): `npm run test:wall`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { ROOT, must, sourceRepoOnly } from './helpers.mjs';
import { runChecks } from '../checks/run.mjs';
import { readJson } from '../lib/files.mjs';
import type { BrandConfig } from '../../generated/types/brand-config.js';

const SKIP_TOP = new Set(['node_modules', '.git', 'site-dist', 'storybook-static', 'dist', '.claude', 'coverage']);
const CHANGED_PRIMARY = '#2563EB';

const copyRepo = (dest: string): void => {
  cpSync(ROOT, dest, {
    recursive: true,
    filter: (src) => {
      const rel = src.slice(ROOT.length).replace(/^\//, '');
      if (!rel) return true;
      return !SKIP_TOP.has(rel.split('/')[0] ?? '') && !rel.includes('worktrees');
    },
  });
};

test('the wall: a Foundations change reaches every output through propagate --maintainer, and the maintainer check passes on the copy', { ...sourceRepoOnly, timeout: 45 * 60 * 1000 }, async () => {
  const hasDeps = existsSync(join(ROOT, 'node_modules'));
  if (!hasDeps) return; // needs the installed dependencies to run the real builds

  const dir = mkdtempSync(join(tmpdir(), 'sketchbook-wall-'));
  try {
    copyRepo(dir);
    symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'), 'dir');
    const before = readFileSync(join(dir, 'generated/css/tokens.css'), 'utf8');

    const brandPath = join(dir, 'brand.config.json');
    const brand = readJson<BrandConfig>(brandPath);
    must(brand.color, 'brand.config.json color').primary = CHANGED_PRIMARY;
    writeFileSync(brandPath, JSON.stringify(brand, null, 2) + '\n');

    // Script generation is local. Do not depend on a maintainer's actual Figma file key.
    rmSync(join(dir, 'generated/design/figma/variables'), { recursive: true, force: true });
    execFileSync(process.execPath, ['harness/cli.mjs', 'propagate', '--maintainer'], {
      cwd: dir, env: { ...process.env, SKETCHBOOK_FIGMA_FILE: 'SketchbookWallFixture' }, stdio: 'pipe', timeout: 40 * 60 * 1000,
    });

    // Every output moved with the change.
    const after = readFileSync(join(dir, 'generated/css/tokens.css'), 'utf8');
    assert.notEqual(after, before, 'generated token CSS rebuilt from the new brand color');
    assert.ok(after.includes('--sb-color-brand-'), 'the brand ramp is in the token CSS');
    assert.ok(existsSync(join(dir, 'dist/index.js')), 'the engine build (dist) is rebuilt');
    assert.ok(existsSync(join(dir, 'storybook-static/index.html')), 'the Storybook build exists');
    assert.equal(readFileSync(join(dir, 'site-dist/assets/tokens.css'), 'utf8'), after, 'the docs site uses the same token CSS');
    assert.ok(existsSync(join(dir, 'generated/design/figma/variables')), 'the Figma token scripts are prepared');
    const record = readJson<{ maintainer?: { storybook?: unknown; docs?: unknown } }>(join(dir, 'generated/propagation.json'));
    assert.ok(record.maintainer?.storybook && record.maintainer?.docs, 'the maintainer builds are recorded');

    // The maintainer check passes on the copy: the record matches the spec and every maintainer output.
    const report = await runChecks(dir, { only: ['O1'], maintainer: true });
    assert.deepEqual(report.results[0]?.errors.map((e) => e.msg), [], `O1 on the copy: ${basename(dir)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
