import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { kebab } from '../commands/catalog.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'S1';
export const title = 'Screen-reader views: every shipped component has stored views, none with an unnamed control';

const SHIPPED = new Set(['beta', 'stable', 'code-only']);
// Keys that change what a screen reader announces (expanded, checked, selected, active, value); Tab and Enter on a link do not.
const STATEFUL_KEY = /Arrow|Space|Escape|Home|End\b|Page|typing|Printable/i;
// Same list as screenReaderProblems in playwright/helpers/a11y.ts.
const NEEDS_NAME = /^\s*- (button|link|textbox|searchbox|checkbox|radio|switch|combobox|slider|spinbutton|tab|option|menuitem|listbox|dialog|alertdialog|navigation|radiogroup|tablist)( \[|$)/;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// Only the key names reach STATEFUL_KEY, so anything that is not text or a list of text adds nothing.
const words = (v: unknown): string => (typeof v === 'string' ? v : Array.isArray(v) ? v.map(words).join(',') : '');

const txtFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? txtFiles(join(dir, d.name)) : d.name.endsWith('.txt') ? [join(dir, d.name)] : []));
};

export function run({ root, registry, all }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  for (const c of registry.components.filter((x) => SHIPPED.has(x.status))) {
    const name = c.path ? basename(c.path) : kebab(c.name);
    const views = join(root, `playwright/tests/${name}/__screen-reader__`);
    const fail = (file: string, msg: string, fix: string) => errors.push({ file, token: c.name, msg: `${c.status}: ${msg}`, fix });
    const stories = txtFiles(join(views, 'stories'));
    if (!stories.length) fail('spec/registry.json', `no stored screen-reader view of its stories (playwright/tests/${name}/__screen-reader__/stories/)`, 'Run npm run test:component -- tests/screen-reader --update-snapshots, then review the written views.');
    for (const file of txtFiles(views)) {
      const bad = readFileSync(file, 'utf8').split('\n').filter((line) => NEEDS_NAME.test(line) || line.includes('active "?"'));
      const [first] = bad;
      if (first !== undefined) fail(file.slice(root.length + 1), `a screen reader announces a control with no name: ${first.trim()}`, 'Name the control (label, aria-label or the contract\'s accessible-name prop), then update the view.');
    }
    const keyboard: unknown = all.contracts.find((x) => x.name === name)?.contract?.accessibility?.keyboard ?? {};
    const keys = Array.isArray(keyboard) ? keyboard.map((k: unknown) => words(isRecord(k) ? k.key ?? k.keys : undefined)).join(' ') : Object.keys(isRecord(keyboard) ? keyboard : {}).join(' ');
    if (!STATEFUL_KEY.test(keys)) continue;
    const spec = `playwright/tests/${name}/${name}.behavior.spec.ts`;
    const source = existsSync(join(root, spec)) ? readFileSync(join(root, spec), 'utf8') : '';
    if (!source.includes('expectScreenReaderView(')) fail(spec, 'its keyboard changes what a screen reader announces, but the behavior spec stores no screen-reader view after a key press', 'Add a "screen-reader view: ..." test that presses the contract\'s keys and calls expectScreenReaderView(page, \'<name>-<state>\').');
  }
  return { errors };
}
