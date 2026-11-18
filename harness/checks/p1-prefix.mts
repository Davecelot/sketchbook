import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'P1';
export const title = 'Component sources use the configured prefix';

// Hand-written sources under src/ (generated *.styles.ts follow the .scss); pattern kits add plain .css.
function sources(root: string): string[] {
  try {
    return readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && /\.(ts|s?css)$/.test(e.name) && !e.name.endsWith('.styles.ts'))
      .map((e) => join(e.parentPath, e.name));
  } catch { return []; }
}

const lineOf = (text: string, index: number): number => text.slice(0, index).split('\n').length;

export function run({ root, config, all }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const prefix = config.prefix;
  const fix = `Use the prefix from harness.config.json ("${prefix}"); to rebrand everything at once run: sketchbook prefix <new>.`;
  // Names of the system's own elements without their prefix (button, card-header, ...), from contracts.
  const tags = all.contracts.flatMap((c) => [c.contract?.tag, ...(c.contract?.elements || []).map((e) => e.tag)]).filter((t): t is string => !!t);
  const names = [...new Set(tags.map((t) => t.slice(t.indexOf('-') + 1)))].sort((a, b) => b.length - a.length);
  const nameAlt = names.map((n) => n.replace(/[-]/g, '\\-')).join('|');
  for (const abs of sources(root)) {
    const file = relative(root, abs);
    const text = readFileSync(abs, 'utf8');
    const report = (index: number, token: string, msg: string) => errors.push({ file, line: lineOf(text, index), token, msg, fix });
    // Custom-element registrations and tag constants: customElements.define('x-foo'), get, whenDefined, const TAG = 'x-foo'.
    for (const m of text.matchAll(/(?:customElements\.(?:define|get|whenDefined)\(\s*|\bTAG\s*=\s*)['"`]([a-z][a-z0-9]*)-[a-z0-9-]*['"`]/g)) {
      if (m[1] !== prefix) report(m.index, m[0], `element name uses prefix "${m[1]}", not "${prefix}"`);
    }
    // Custom properties: every --name in SCSS, and var(--x) / setProperty('--x') in TS, must be --<prefix>-* or private --_*.
    const isCss = /\.s?css$/.test(file);
    const props = isCss
      ? text.matchAll(/(?<![\w-])--([A-Za-z0-9][\w-]*)/g)
      : text.matchAll(/(?:var\(\s*|(?:set|get|remove)Propert(?:y|yValue)\(\s*['"`])--([A-Za-z0-9][\w-]*)/g);
    for (const m of props) { const name = m[1] ?? ''; if (!name.startsWith(`${prefix}-`)) report(m.index, `--${name}`, `custom property --${name} does not use the prefix "${prefix}"`); }
    // One of the system's own elements under another prefix: <x-button in templates, x-button as a SCSS selector.
    if (nameAlt) {
      const tagRe = isCss
        ? new RegExp(`(?<=^|[\\s,>+~(])([a-z][a-z0-9]*)-(${nameAlt})(?![\\w-])(?=[^;{}]*[{,])`, 'gm')
        : new RegExp(`</?([a-z][a-z0-9]*)-(${nameAlt})(?![\\w-])`, 'g');
      for (const m of text.matchAll(tagRe)) if (m[1] !== prefix) report(m.index, `${m[1]}-${m[2]}`, `element ${m[1]}-${m[2]} should be ${prefix}-${m[2]}`);
    }
  }
  return { errors };
}
