// Font source (SB-0050): generated/css/fonts.css from brand.config.json typography.source, kept fresh by G1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fontsCss, type FontSource } from '../build/fonts.mjs';
import { buildTokens } from '../build/index.mjs';
import { runChecks } from '../checks/run.mjs';
import { fixture, edit, readJson, failing, reference, must } from './helpers.mjs';
import type { BrandConfig } from '../../generated/types/brand-config.js';

type Typography = NonNullable<BrandConfig['typography']>;

const brandWith = (source: FontSource | null, typography: Partial<Typography> = {}): Partial<BrandConfig> => ({ name: 't', color: { primary: 'neutral' }, typography: { family: 'Inter', ...typography, ...(source ? { source } : {}) } });
const body = (css: string): string[] => css.split('\n').filter((l) => l && !l.startsWith('/*'));

test('F-none: default config gives a comment-only fonts.css', async () => {
  for (const css of [fontsCss(brandWith(null, { family: 'ui-sans-serif' })), fontsCss(brandWith({ kind: 'none' })), fontsCss(await readJson<BrandConfig>(await reference(), 'brand.config.json'))]) {
    assert.match(css, /^\/\* GENERATED/);
    assert.deepEqual(body(css), [], css);
  }
});

test('F-google: one @import of the css2 URL with the weights in use and display=swap', () => {
  const css = fontsCss(brandWith({ kind: 'google' }));
  assert.deepEqual(body(css), ['@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");']);
  const custom = fontsCss(brandWith({ kind: 'google', family: 'IBM Plex Sans', weights: [700, 400], display: 'optional', mono: { family: 'JetBrains Mono', weights: [400] } }));
  assert.match(custom, /family=IBM\+Plex\+Sans:wght@400;700&family=JetBrains\+Mono:wght@400&display=optional/);
  assert.throws(() => fontsCss(brandWith({ kind: 'google' }, { family: 'ui-sans-serif' })), /generic or system font/);
});

test('F-url: @import url(...) of the given stylesheet', () => {
  assert.deepEqual(body(fontsCss(brandWith({ kind: 'url', url: 'https://cdn.example.com/brand.css' }))), ['@import url("https://cdn.example.com/brand.css");']);
  assert.throws(() => fontsCss(brandWith({ kind: 'url' })), /needs source.url/);
});

test('F-local: one @font-face per listed file, paths as given', () => {
  const css = fontsCss(brandWith({ kind: 'local', files: [{ path: '/fonts/Inter-Regular.woff2', weight: 400 }, { path: '/fonts/Inter-Italic.ttf', weight: 400, style: 'italic' }] }));
  assert.equal((css.match(/@font-face/g) ?? []).length, 2);
  assert.match(css, /font-family: "Inter";\n {2}src: url\("\/fonts\/Inter-Regular.woff2"\) format\("woff2"\);\n {2}font-weight: 400;\n {2}font-style: normal;\n {2}font-display: swap;/);
  assert.match(css, /format\("truetype"\);\n {2}font-weight: 400;\n {2}font-style: italic;/);
  const variable = fontsCss(brandWith({ kind: 'local', path: '/fonts/Inter.var.woff2' }));
  assert.match(variable, /font-weight: 400 800;/);
  assert.throws(() => fontsCss(brandWith({ kind: 'local' })), /needs source.files/);
});

test('F-G1: fonts.css is part of the token build and G1 rejects a stale one', async () => {
  const dir = await fixture();
  const tokensBefore = await readFile(join(dir, 'generated/css/tokens.css'), 'utf8');
  await edit<BrandConfig>(dir, 'brand.config.json', (b) => { must(b.typography, 'brand.config.json typography').source = { kind: 'google', family: 'Inter' }; });
  assert.ok(failing(await runChecks(dir, { only: ['G1'] })).includes('G1'), 'G1 must reject a stale fonts.css');
  await buildTokens({ root: dir });
  assert.match(await readFile(join(dir, 'generated/css/fonts.css'), 'utf8'), /fonts\.googleapis\.com\/css2\?family=Inter/);
  assert.equal(await readFile(join(dir, 'generated/css/tokens.css'), 'utf8'), tokensBefore, 'the font source does not change tokens.css');
  assert.deepEqual(failing(await runChecks(dir, { only: ['G1'] })), []);
  await rm(dir, { recursive: true });
});
