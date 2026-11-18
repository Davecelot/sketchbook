// Reads component styles with PostCSS (pinned) so checks see real declarations, not split lines.
// Source styles are SCSS (the reference implementation convention): src/components/<name>/<Name>.scss, parsed with postcss-scss.
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import postcss from 'postcss';
import type { Declaration, Root } from 'postcss';
import scss from 'postcss-scss';
import { errorMessage } from './files.mjs';

export const pascal = (kebab: string): string => kebab.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');

export interface ComponentCss { name: string; file: string; ast?: Root; error?: string }

export async function loadComponentCss(root: string): Promise<ComponentCss[]> {
  const dir = join(root, 'src/components');
  let names: string[] = [];
  try { names = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name); } catch { /* absent: treated as empty */ }
  const out: ComponentCss[] = [];
  for (const name of names.sort()) {
    const file = `src/components/${name}/${pascal(name)}.scss`;
    let text: string;
    try { text = await readFile(join(root, file), 'utf8'); } catch { continue; }
    try { out.push({ name, file, ast: postcss.parse(text, { from: file }) }); } catch {
      try { out.push({ name, file, ast: scss.parse(text, { from: file }) }); } catch (e) { out.push({ name, file, error: errorMessage(e) }); }
    }
  }
  return out;
}

export const VAR_REF = /var\(\s*(--[A-Za-z0-9_-]+)/g;

export const cssVarName = (prefix: string, path: string): string => `--${prefix}-${path.replace(/\./g, '-')}`;

// True when the declaration's previous sibling is a `/* sketchbook-allow-literal: reason */` comment.
export function allowedLiteral(decl: Declaration): boolean {
  const prev = decl.prev();
  return prev?.type === 'comment' && /sketchbook-allow-literal:\s*\S/.test(prev.text);
}

// Literal values that have a token: shared by T5 (component CSS) and K1 (pattern CSS).
export interface LiteralRule { re: RegExp; what: string; fix: string; skip?: (m: string) => boolean }
export interface Literal { what: string; match: string; fix: string }

export const LITERAL_RULES: LiteralRule[] = [
  { re: /#[0-9A-Fa-f]{3,8}\b/, what: 'color literal', fix: 'Use a color token.' },
  { re: /\b(rgba?|hsla?|oklch|oklab|lab|lch|color)\(/, what: 'color function', fix: 'Use a color token.' },
  { re: /(?<![\w-])-?(\d*\.)?\d+(px|rem|em)\b/, what: 'length literal', fix: 'Use a dimension token (spacing, size, radius, border width).', skip: (m) => /^-?0*\.?0+(px|rem|em)$/.test(m) },
  { re: /(?<![\w-])\d*\.?\d+m?s\b/, what: 'time literal', fix: 'Use a motion duration token.' },
];

// Each literal in a declaration as { what, match, fix }; z-index numbers count too (layer tokens).
export function literalsIn(decl: Declaration): Literal[] {
  const found: Literal[] = [];
  for (const r of LITERAL_RULES) {
    const m = r.re.exec(decl.value);
    if (m && !r.skip?.(m[0])) found.push({ what: r.what, match: m[0], fix: r.fix });
  }
  if (decl.prop === 'z-index' && /^-?[1-9]\d*$/.test(decl.value.trim())) found.push({ what: 'z-index literal', match: decl.value.trim(), fix: 'Use a layer token (layer.dropdown, layer.modal, ...).' });
  return found;
}
