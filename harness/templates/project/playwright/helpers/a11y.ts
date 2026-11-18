import { fileURLToPath } from 'node:url';
import { expect, type CDPSession, type Page } from '@playwright/test';

import { gotoStory } from './storybook';
import { tokenColor } from './tokens';

// What Chrome sends as an AXValue for the properties read here is a primitive.
type AXPrimitive = string | number | boolean;
interface AXProperty {
  name: string;
  value: { value?: AXPrimitive; relatedNodes?: { backendDOMNodeId: number }[] };
}
export interface AXNode {
  nodeId: string;
  ignored: boolean;
  role?: { value: string };
  name?: { value: string };
  description?: { value: string };
  value?: { value: AXPrimitive };
  properties?: AXProperty[];
  childIds?: string[];
  backendDOMNodeId?: number;
}

// The protocol types every AXValue as any; this is the one place the tree crosses into typed code.
export const axTree = async (cdp: CDPSession): Promise<AXNode[]> =>
  ((await cdp.send('Accessibility.getFullAXTree')) as unknown as { nodes: AXNode[] }).nodes;

const FLATTENED = new Set(['generic', 'none', 'presentation', 'InlineTextBox', 'LineBreak', 'LabelText']);
const ALWAYS = new Set(['expanded', 'checked', 'pressed']);
const TRUTHY = ['focused', 'selected', 'modal', 'disabled', 'required', 'readonly', 'multiselectable', 'busy'];
const VALUED = ['invalid', 'current', 'level', 'haspopup', 'autocomplete', 'live', 'valuetext', 'orientation'];
const OFF = new Set(['false', '', 'off', 'none']);

// What a screen reader is given: Chrome's computed accessibility tree, which (unlike a DOM walk)
// resolves element references across shadow roots and drops what a modal dialog makes inert.
export const screenReaderView = async (page: Page): Promise<string> => {
  // Chrome serializes the accessibility tree during a rendering lifecycle, so a DOM change is read after a frame.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const cdp = await page.context().newCDPSession(page);
  try {
    const nodes = await axTree(cdp);
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const byDom = new Map(nodes.filter((n) => n.backendDOMNodeId).map((n) => [n.backendDOMNodeId, n]));
    const lines: string[] = [];
    // The protocol has no property for aria-current, so it is read from the focusable element itself.
    const current = new Map<string, string>();
    for (const n of nodes) {
      if (n.ignored || !n.backendDOMNodeId || !n.properties?.some((p) => p.name === 'focusable' && p.value.value === true)) continue;
      const { node } = (await cdp.send('DOM.describeNode', { backendNodeId: n.backendDOMNodeId })) as { node: { attributes?: string[] } };
      const attrs = node.attributes ?? [];
      const at = attrs.indexOf('aria-current');
      if (at >= 0 && !OFF.has(attrs[at + 1] ?? '')) current.set(n.nodeId, attrs[at + 1] ?? '');
    }
    const states = (n: AXNode) => {
      const out: string[] = [];
      if (current.has(n.nodeId)) out.push(`current=${current.get(n.nodeId)}`);
      for (const p of n.properties ?? []) {
        const v = p.value.value;
        if (p.name === 'activedescendant') {
          const target = byDom.get(p.value.relatedNodes?.[0]?.backendDOMNodeId);
          out.push(`active "${target?.name?.value ?? '?'}"`);
        } else if (ALWAYS.has(p.name)) out.push(`${p.name}=${String(v)}`);
        else if (TRUTHY.includes(p.name) && (v === true || v === 1 || v === 'true')) out.push(p.name);
        else if (VALUED.includes(p.name) && v !== undefined && !OFF.has(String(v))) out.push(`${p.name}=${String(v)}`);
      }
      return out;
    };
    const walk = (id: string, depth: number, context: string) => {
      const n = byId.get(id);
      if (!n) return;
      const role = n.role?.value ?? '';
      const name = n.name?.value ?? '';
      const printed = !n.ignored && !FLATTENED.has(role) && role !== 'RootWebArea' && !(role === 'StaticText' && context.includes(name.trim()));
      if (printed && (role !== 'StaticText' || name.trim())) {
        const parts = [role === 'StaticText' ? 'text' : role];
        if (name) parts.push(JSON.stringify(name.trim()));
        const st = states(n);
        if (st.length) parts.push(`[${st.join(', ')}]`);
        if (n.value?.value !== undefined && n.value.value !== '') parts.push(`value ${JSON.stringify(String(n.value.value))}`);
        if (n.description?.value) parts.push(`desc ${JSON.stringify(n.description.value)}`);
        lines.push(`${'  '.repeat(depth)}- ${parts.join(' ')}`);
      }
      const own = printed ? `${name}\n${String(n.value?.value ?? '')}` : context;
      for (const child of n.childIds ?? []) walk(child, printed ? depth + 1 : depth, own);
    };
    const root = nodes.find((n) => n.role?.value === 'RootWebArea');
    if (root) walk(root.nodeId, 0, '');
    return lines.join('\n') + '\n';
  } finally {
    await cdp.detach();
  }
};

const NEEDS_NAME = /^\s*- (button|link|textbox|searchbox|checkbox|radio|switch|combobox|slider|spinbutton|tab|option|menuitem|listbox|dialog|alertdialog|navigation|radiogroup|tablist)( \[|$)/;

// Lines of a screen-reader view a reader would announce with no name, or an active item it can't resolve.
export const screenReaderProblems = (view: string) =>
  view.split('\n').filter((line) => NEEDS_NAME.test(line) || line.includes('active "?"'));

export const expectScreenReaderView = async (page: Page, name: string) => {
  const view = await screenReaderView(page);
  expect(screenReaderProblems(view), `${name}: unnamed controls`).toEqual([]);
  expect(view).toMatchSnapshot(`${name}.txt`);
};

export const axNodes = async (cdp: CDPSession, role: string) =>
  (await axTree(cdp))
    .filter((node) => node.role?.value === role)
    .map((node) => ({ name: node.name?.value, description: node.description?.value ?? '' }));

// The same axe-core the Storybook a11y addon runs, scoped to the component under test:
// other Sketchbook components it composes have their own specs, so they're excluded by tag name.
const AXE_SCRIPT = fileURLToPath(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url));

export interface AxeViolation {
  id: string;
  impact: string;
  targets: string[];
}

// Storybook's a11y addon loads axe into the story and runs it on render; the helper reuses
// that instance and waits out its run, since axe refuses to start while another run is on.
export const axeViolations = async (page: Page, tagName: string, exclude: string[] = []): Promise<AxeViolation[]> => {
  const loaded = await page.evaluate(() => 'axe' in window);
  if (!loaded) await page.addScriptTag({ path: AXE_SCRIPT });
  return page.evaluate(
    async ([include, excluded]) => {
      type Axe = { run: (context: unknown, options: unknown) => Promise<unknown> };
      const axe = (window as unknown as { axe: Axe }).axe;
      const context = { include: [include], exclude: excluded.map((tag) => [tag]) };
      const options = { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] };
      const run = async (): Promise<unknown> => {
        try {
          return await axe.run(context, options);
        } catch (error) {
          if (!String(error).includes('already running')) throw error;
          await new Promise((resolve) => setTimeout(resolve, 100));
          return run();
        }
      };
      const { violations } = (await run()) as {
        violations: { id: string; impact: string; nodes: { target: unknown[] }[] }[];
      };
      return violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        targets: nodes.map((node) => node.target.flat().join(' ')),
      }));
    },
    [tagName, exclude] as const,
  );
};

// Focus on an invalid control must look different from the invalid control at rest (WCAG 2.4.7, 1.4.11):
// the ring is drawn solid in the invalid color, not as a faint tint of it.
export async function expectSolidInvalidRing(page: Page, story: string, tag: string, part: string, token: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoStory(page, story, tag);
  const host = page.locator(tag).first();
  await page.keyboard.press('Shift');
  await host.locator('input, textarea, select').first().focus();
  const ring = await host.locator(`[part="${part}"]`).evaluate((el) => getComputedStyle(el).boxShadow);
  expect(ring).toContain(await tokenColor(host, token));
}
